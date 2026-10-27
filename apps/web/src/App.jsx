import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { SubmissionsPage } from './pages/SubmissionsPage.jsx';
import { RulesPage } from './pages/RulesPage.jsx';
import { BriefImportPage } from './pages/BriefImportPage.jsx';
import { InsightsPage } from './pages/InsightsPage.jsx';
import { api } from './api/client.js';
import { RefreshCw, Building2, Plus } from 'lucide-react';

export function App() {
  const [user, setUser] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [activeTab, setActiveTab] = useState('submissions');
  const [activeRole, setActiveRole] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [creatingWs, setCreatingWs] = useState(false);

  const prefetchWorkspaceData = (wsId) => {
    if (!wsId) return;
    try {
      api.prefetch(`/workspaces/${wsId}/submissions`);
      api.prefetch(`/workspaces/${wsId}/rules`);
      api.prefetch(`/workspaces/${wsId}/insights`);
    } catch (e) {}
  };

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
      let wsList = await api.workspaces.list();
      if (!wsList || wsList.length === 0) {
        try {
          const created = await api.workspaces.create({
            name: `${me.displayName || 'Default'}'s Workspace`
          });
          const wsObj = created?.workspace || created;
          wsList = [{ workspace: wsObj, roles: ['ADMIN', 'REVIEWER', 'CREATOR'], status: 'active' }];
        } catch (wsErr) {
          console.warn('Auto workspace provisioning notice:', wsErr);
        }
      }
      setWorkspaces(wsList || []);
      if (wsList && wsList.length > 0) {
        const first = wsList[0];
        setCurrentWorkspace(first);
        const wsId = first?.workspace?._id || first?.workspace?.id || first?._id;
        prefetchWorkspaceData(wsId);
      }
    } catch (err) {
      console.warn('Session expired or invalid', err);
      ApiClient.setToken(null);
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
      let wsList = await api.workspaces.list();
      if (!wsList || wsList.length === 0) {
        try {
          const created = await api.workspaces.create({
            name: `${user.displayName || 'Default'}'s Workspace`
          });
          const wsObj = created?.workspace || created;
          wsList = [{ workspace: wsObj, roles: ['ADMIN', 'REVIEWER', 'CREATOR'], status: 'active' }];
        } catch (wsErr) {
          console.warn('Auto workspace provisioning notice:', wsErr);
        }
      }
      setWorkspaces(wsList || []);
      if (wsList && wsList.length > 0) {
        const first = wsList[0];
        setCurrentWorkspace(first);
        const wsId = first?.workspace?._id || first?.workspace?.id || first?._id;
        prefetchWorkspaceData(wsId);
      }
    } catch (err) {
      console.error('Failed to load workspaces after auth', err);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!user) return;
    setCreatingWs(true);
    try {
      const created = await api.workspaces.create({
        name: `${user.displayName || 'Brand'}'s Workspace`
      });
      const wsObj = created?.workspace || created;
      const newEntry = { workspace: wsObj, roles: ['ADMIN', 'REVIEWER', 'CREATOR'], status: 'active' };
      setWorkspaces(prev => [newEntry, ...prev]);
      setCurrentWorkspace(newEntry);
      const wsId = wsObj?._id || wsObj?.id;
      prefetchWorkspaceData(wsId);
    } catch (err) {
      alert(err.message || 'Failed to create workspace.');
    } finally {
      setCreatingWs(false);
    }
  };

  const handleLogout = () => {
    ApiClient.setToken(null);
    api.clearCache();
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

  const rawWs = currentWorkspace?.workspace || currentWorkspace;
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
          const wsId = ws?.workspace?._id || ws?.workspace?.id || ws?._id;
          prefetchWorkspaceData(wsId);
        }}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeRole={activeRole}
        onSelectRole={setActiveRole}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!workspaceId ? (
          <div className="p-12 text-center bg-white border-2 border-[#0B1E36] rounded-2xl shadow-[4px_4px_0px_#0B1E36] space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border-2 border-[#0B1E36] flex items-center justify-center mx-auto shadow-[2px_2px_0px_#0B1E36]">
              <Building2 className="w-6 h-6 text-[#0B1E36]" />
            </div>
            <h3 className="text-lg font-black text-[#0B1E36]">No Workspace Available</h3>
            <p className="text-xs text-slate-600 font-mono">
              Create your brand governance workspace to begin submitting campaigns and managing compliance rules.
            </p>
            <button
              onClick={handleCreateWorkspace}
              disabled={creatingWs}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B1E36] text-white hover:bg-[#152B4A] rounded-xl text-xs font-mono font-bold uppercase transition-all shadow-[2px_2px_0px_#F59E0B] cursor-pointer disabled:opacity-50"
            >
              {creatingWs ? <RefreshCw className="w-4 h-4 animate-spin text-[#F59E0B]" /> : <Plus className="w-4 h-4 text-[#F59E0B]" />}
              <span>{creatingWs ? 'Creating...' : 'Create Brand Workspace'}</span>
            </button>
          </div>
        ) : (
          <div className="w-full">
            <div className={activeTab === 'submissions' ? 'block' : 'hidden'}>
              <SubmissionsPage
                workspaceId={workspaceId}
                userRoles={userRoles}
                onNavigateTab={setActiveTab}
              />
            </div>
            <div className={activeTab === 'rules' ? 'block' : 'hidden'}>
              <RulesPage
                workspace={typeof rawWs === 'object' ? rawWs : { _id: workspaceId }}
                workspaceId={workspaceId}
                userRoles={userRoles}
              />
            </div>
            <div className={activeTab === 'brief-imports' ? 'block' : 'hidden'}>
              <BriefImportPage
                workspace={typeof rawWs === 'object' ? rawWs : { _id: workspaceId }}
                workspaceId={workspaceId}
                userRoles={userRoles}
              />
            </div>
            <div className={activeTab === 'insights' ? 'block' : 'hidden'}>
              <InsightsPage
                workspaceId={workspaceId}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
