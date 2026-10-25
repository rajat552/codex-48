import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api, ApiClient } from '../api/client.js';

export function AuthPage({ onAuthSuccess, onAuthenticated }) {
  const [isRegister, setIsRegister] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const notifySuccess = (token, user, membership) => {
    ApiClient.setToken(token);
    if (onAuthSuccess) {
      onAuthSuccess({ token, user, membership });
    } else if (onAuthenticated) {
      onAuthenticated(user, membership ? [membership] : [], membership);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const result = await api.auth.register({
          displayName,
          email,
          password,
          workspaceName: workspaceName || `${displayName}'s Workspace`
        });
        const token = result.tokens?.accessToken || result.token;
        notifySuccess(token, result.user, result.membership);
      } else {
        const result = await api.auth.login({ email, password });
        const token = result.tokens?.accessToken || result.token;
        const activeWs = result.memberships?.[0] || null;
        notifySuccess(token, result.user, activeWs);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAdmin = async () => {
    setError(null);
    setLoading(true);
    const rand = Math.random().toString(36).substring(2, 7);
    const demoEmail = `evaluator.${rand}@cohesora.local`;
    try {
      const result = await api.auth.register({
        displayName: 'Brand Governance Admin',
        email: demoEmail,
        password: 'Password123!',
        workspaceName: 'Acme Global Brand Governance'
      });
      const token = result.tokens?.accessToken || result.token;
      notifySuccess(token, result.user, result.membership);
    } catch (err) {
      setError(err.message || 'Demo initialization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Glow backdrop decoration */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center mb-8 relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 mx-auto flex items-center justify-center shadow-xl shadow-indigo-500/30 mb-4">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100">
            {isRegister ? 'Create Workspace' : 'Welcome to Cohesora'}
          </h1>
          <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
            AI-powered, evidence-first brand governance and compliance platform
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="brand.lead@organization.com"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Workspace / Brand Name</label>
              <input
                type="text"
                value={workspaceName}
                onChange={e => setWorkspaceName(e.target.value)}
                placeholder="e.g. Acme Brand Marketing"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white shadow-lg shadow-indigo-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? 'Processing...' : (isRegister ? 'Register & Provision Workspace' : 'Sign In')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo 1-Click Launch */}
        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
          <p className="text-[11px] font-medium text-slate-400 mb-3">
            Hackathon Judge / Instant Evaluation:
          </p>
          <button
            type="button"
            onClick={handleDemoAdmin}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            1-Click Launch Demo Workspace (Admin Role)
          </button>
        </div>

        {/* Toggle between Register and Sign In */}
        <div className="mt-6 text-center text-xs text-slate-400">
          {isRegister ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className="text-indigo-400 font-semibold hover:underline cursor-pointer"
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
                className="text-indigo-400 font-semibold hover:underline cursor-pointer"
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
