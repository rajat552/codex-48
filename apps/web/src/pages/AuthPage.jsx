import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { ApiClient } from '../api/client';

export function AuthPage({ onAuthenticated }) {
  const [isRegister, setIsRegister] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const result = await ApiClient.register({
          displayName,
          email,
          password,
          workspaceName
        });
        ApiClient.setToken(result.tokens.accessToken);
        onAuthenticated(result.user, [result.membership], result.membership);
      } else {
        const result = await ApiClient.login({ email, password });
        ApiClient.setToken(result.tokens.accessToken);
        const activeWs = result.memberships[0] || null;
        onAuthenticated(result.user, result.memberships, activeWs);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAdmin = async () => {
    setError(null);
    setLoading(true);
    const demoEmail = `demo.admin-${Date.now().toString(36)}@cohesora.test`;
    try {
      const result = await ApiClient.register({
        displayName: 'Demo Brand Admin',
        email: demoEmail,
        password: 'Password123!',
        workspaceName: 'Acme Demo Brand Workspace'
      });
      ApiClient.setToken(result.tokens.accessToken);
      onAuthenticated(result.user, [result.membership], result.membership);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full glass-panel p-8 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop decoration */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand header */}
        <div className="text-center mb-8 relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 mx-auto flex items-center justify-center shadow-xl shadow-indigo-500/30 mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            {isRegister ? 'Create your Brand Workspace' : 'Welcome to Cohesora'}
          </h1>
          <p className="text-xs text-slate-400 mt-1.5">
            AI-powered, evidence-first brand governance and compliance platform
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Your Full Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="brand.lead@organization.com"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Organization / Workspace Name</label>
              <input
                type="text"
                value={workspaceName}
                onChange={e => setWorkspaceName(e.target.value)}
                placeholder="e.g. Inkloom Marketing & Brand"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isRegister ? 'Register & Provision Workspace' : 'Sign In')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Login Option */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500 mb-3">Hackathon Judge / Evaluation Quick Start:</p>
          <button
            type="button"
            onClick={handleDemoAdmin}
            disabled={loading}
            className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-indigo-300 border border-indigo-500/30 flex items-center justify-center gap-2 transition-colors font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            1-Click Quick Launch Demo Workspace (Admin Role)
          </button>
        </div>

        {/* Toggle between register and login */}
        <div className="mt-6 text-center text-xs text-slate-400">
          {isRegister ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className="text-indigo-400 font-semibold hover:underline"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Need a new workspace?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className="text-indigo-400 font-semibold hover:underline"
              >
                Register Workspace
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
