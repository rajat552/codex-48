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
  const [activeRole, setActiveRole] = useState('ALL');
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
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-700 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-[#F59E0B]" />
        <span className="text-sm font-bold font-mono tracking-wide text-[#0B1E36]">Initializing Cohesora Governance Platform...</span>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  const rawWs = currentWorkspace?.workspace;
  const workspaceId = typeof rawWs === 'object' ? (rawWs?._id || rawWs?.id) : (rawWs || null);
  const availableRoles = currentWorkspace?.roles || ['CREATOR'];
  const userRoles = activeRole === 'ALL'
    ? availableRoles
    : (availableRoles.includes(activeRole) ? [activeRole] : availableRoles);

  return (
    <div className="min-h-screen bg-transparent text-slate-900 flex flex-col selection:bg-[#F59E0B]/30 selection:text-[#0B1E36]">
      <Navbar
        user={user}
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onSelectWorkspace={ws => {
          setCurrentWorkspace(ws);
          setActiveRole('ALL');
        }}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeRole={activeRole}
        onSelectRole={setActiveRole}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!workspaceId ? (
          <div className="p-12 text-center bg-white border-2 border-[#0B1E36] rounded-2xl shadow-[4px_4px_0px_#0B1E36] space-y-3">
            <h3 className="text-lg font-black text-[#0B1E36]">No workspace available</h3>
            <p className="text-xs text-slate-600 font-mono">Please sign in with an account associated with an active workspace.</p>
          </div>
        ) : (
          <>
            {activeTab === 'submissions' && (
              <SubmissionsPage
                key={`sub-${workspaceId}`}
                workspaceId={workspaceId}
                userRoles={userRoles}
                onNavigateTab={setActiveTab}
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
