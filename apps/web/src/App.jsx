import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { SubmissionsPage } from './pages/SubmissionsPage.jsx';
import { RulesPage } from './pages/RulesPage.jsx';
import { BriefImportPage } from './pages/BriefImportPage.jsx';
import { InsightsPage } from './pages/InsightsPage.jsx';
import { api } from './api/client.js';
import { RefreshCw } from 'lucide-react';

export function App() {
  const [user, setUser] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [activeTab, setActiveTab] = useState('submissions');
  const [loading, setLoading] = useState(true);

  // Restore session
  const initAuth = async () => {
    const token = localStorage.getItem('cohesora_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const me = await api.auth.me();
      setUser(me);
      const wsList = await api.workspaces.list();
      setWorkspaces(wsList);
      if (wsList && wsList.length > 0) {
        setCurrentWorkspace(wsList[0]);
      }
    } catch (err) {
      console.warn('Session expired or invalid', err);
      localStorage.removeItem('cohesora_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const handleAuthSuccess = async ({ token, user }) => {
    setUser(user);
    try {
      const wsList = await api.workspaces.list();
      setWorkspaces(wsList);
      if (wsList && wsList.length > 0) {
        setCurrentWorkspace(wsList[0]);
      }
    } catch (err) {
      console.error('Failed to load workspaces after auth', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cohesora_token');
    setUser(null);
    setWorkspaces([]);
    setCurrentWorkspace(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
        <span className="text-sm font-semibold tracking-wide">Initializing Cohesora Governance Platform...</span>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  const rawWs = currentWorkspace?.workspace;
  const workspaceId = typeof rawWs === 'object' ? (rawWs?._id || rawWs?.id) : (rawWs || null);
  const userRoles = currentWorkspace?.roles || ['CREATOR'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar
        user={user}
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onSelectWorkspace={ws => setCurrentWorkspace(ws)}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!workspaceId ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
            <h3 className="text-lg font-bold text-slate-200">No workspace available</h3>
            <p className="text-xs text-slate-400">Please sign in with an account associated with an active workspace.</p>
          </div>
        ) : (
          <>
            {activeTab === 'submissions' && (
              <SubmissionsPage
                key={`sub-${workspaceId}`}
                workspaceId={workspaceId}
                userRoles={userRoles}
              />
            )}
            {activeTab === 'rules' && (
              <RulesPage
                key={`rules-${workspaceId}`}
                workspace={currentWorkspace?.workspace || { _id: workspaceId }}
                workspaceId={workspaceId}
                userRoles={userRoles}
              />
            )}
            {activeTab === 'brief-imports' && (
              <BriefImportPage
                key={`briefs-${workspaceId}`}
                workspace={currentWorkspace?.workspace || { _id: workspaceId }}
                workspaceId={workspaceId}
                userRoles={userRoles}
              />
            )}
            {activeTab === 'insights' && (
              <InsightsPage
                key={`insights-${workspaceId}`}
                workspaceId={workspaceId}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
