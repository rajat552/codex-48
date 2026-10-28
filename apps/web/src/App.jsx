import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { SubmissionsPage } from './pages/SubmissionsPage.jsx';
import { RulesPage } from './pages/RulesPage.jsx';
import { BriefImportPage } from './pages/BriefImportPage.jsx';
import { InsightsPage } from './pages/InsightsPage.jsx';
import { OnboardingTour } from './components/OnboardingTour.jsx';
import { api, ApiClient } from './api/client.js';
import { RefreshCw, Building2, Plus } from 'lucide-react';

const DEMO_USER = {
  _id: '6ae251b57c49f3ce5ebad8c0',
  id: '6ae251b57c49f3ce5ebad8c0',
  displayName: 'Brand Governance Admin',
  email: 'evaluator.tjxgs@cohesora.local',
  role: 'ADMIN'
};

const DEMO_WORKSPACE_ENTRY = {
  workspace: {
    _id: '6ae251b67c49f3ce5ebad8c2',
    id: '6ae251b67c49f3ce5ebad8c2',
    name: 'Acme Global Brand Governance',
    slug: 'acme-global-brand'
  },
  roles: ['ADMIN', 'REVIEWER', 'CREATOR'],
  status: 'active'
};

function getInitialSession() {
  const manualLogout = localStorage.getItem('cohesora_manual_logout');
  if (manualLogout === 'true') {
    return {
      user: null,
      workspaces: [],
      currentWorkspace: null
    };
  }

  // 1. Try reading persisted session cache
  try {
    const cachedUser = JSON.parse(localStorage.getItem('cohesora_cached_user') || 'null');
    const cachedWs = JSON.parse(localStorage.getItem('cohesora_cached_workspace') || 'null');
    const cachedList = JSON.parse(localStorage.getItem('cohesora_cached_workspaces') || 'null');
    if (cachedUser && cachedWs) {
      return {
        user: cachedUser,
        workspaces: cachedList && cachedList.length > 0 ? cachedList : [cachedWs],
        currentWorkspace: cachedWs
      };
    }
  } catch (e) {}

  // 2. Default: show demo directly at starting
  const existingToken = localStorage.getItem('cohesora_token');
  if (!existingToken) {
    ApiClient.setToken('demo_token_evaluator');
  }
  return {
    user: DEMO_USER,
    workspaces: [DEMO_WORKSPACE_ENTRY],
    currentWorkspace: DEMO_WORKSPACE_ENTRY
  };
}

export function App() {
  const [initialSession] = useState(() => getInitialSession());
  const [user, setUser] = useState(initialSession.user);
  const [workspaces, setWorkspaces] = useState(initialSession.workspaces);
  const [currentWorkspace, setCurrentWorkspace] = useState(initialSession.currentWorkspace);
  const [activeTab, setActiveTab] = useState('submissions');
  const [activeRole, setActiveRole] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [workspacesLoading, setWorkspacesLoading] = useState(false);
  const [creatingWs, setCreatingWs] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  const persistSessionCache = (userData, workspaceData, workspaceList) => {
    try {
      if (userData) {
        localStorage.setItem('cohesora_cached_user', JSON.stringify(userData));
      }
      if (workspaceData) {
        localStorage.setItem('cohesora_cached_workspace', JSON.stringify(workspaceData));
      }
      if (workspaceList) {
        localStorage.setItem('cohesora_cached_workspaces', JSON.stringify(workspaceList));
      }
    } catch (e) {}
  };

  const prefetchWorkspaceData = (wsId) => {
    if (!wsId) return;
    try {
      api.prefetch(`/workspaces/${wsId}/submissions`);
      api.prefetch(`/workspaces/${wsId}/rules`);
      api.prefetch(`/workspaces/${wsId}/insights`);
    } catch (e) {}
  };

  const [initSlow, setInitSlow] = useState(false);

  // Restore session
  const initAuth = async () => {
    const token = localStorage.getItem('cohesora_token');
    const manualLogout = localStorage.getItem('cohesora_manual_logout');
    if (manualLogout === 'true' || !token) {
      return;
    }

    if (token === 'demo_token_evaluator') {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth restore timed out')), 8000)
        );
        let wsList = await Promise.race([api.workspaces.list(), timeoutPromise]);
        wsList = (wsList || []).filter(item => {
          const ws = item?.workspace || item;
          return !!(ws?._id || ws?.id);
        });
        if (wsList && wsList.length > 0) {
          setWorkspaces(wsList);
          const found = wsList.find(w => {
            const name = (w?.workspace?.name || w?.name || '').toLowerCase();
            return name.includes('acme') || name.includes('truecaller');
          }) || wsList[0];
          setCurrentWorkspace(found);
          persistSessionCache(DEMO_USER, found, wsList);
        }
      } catch (e) {}
      return;
    }

    // Set 12-second timeout allowing cloud backend (Render) cold starts
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Auth restore timed out')), 12000)
    );

    try {
      const me = await Promise.race([api.auth.me(), timeoutPromise]);
      const resolvedUser = me?.user || me;

      let wsList = await api.workspaces.list();
      wsList = (wsList || []).filter(item => {
        const ws = item?.workspace || item;
        return !!(ws?._id || ws?.id);
      });

      if (!wsList || wsList.length === 0) {
        if (me?.memberships && me.memberships.length > 0) {
          wsList = me.memberships
            .map(m => (m?.workspace ? m : { workspace: m.workspaceId || m, roles: m.roles || ['ADMIN', 'REVIEWER', 'CREATOR'], status: 'active' }))
            .filter(item => {
              const ws = item?.workspace || item;
              return !!(ws?._id || ws?.id);
            });
        }
      }

      if (!wsList || wsList.length === 0) {
        try {
          const created = await api.workspaces.create({
            name: `${resolvedUser?.displayName || 'Brand'}'s Workspace`
          });
          const wsObj = created?.workspace || created;
          if (wsObj?._id || wsObj?.id) {
            wsList = [{ workspace: wsObj, roles: ['ADMIN', 'REVIEWER', 'CREATOR'], status: 'active' }];
          }
        } catch (wsErr) {
          console.warn('Auto workspace provisioning notice:', wsErr);
        }
      }

      if (!wsList || wsList.length === 0) {
        const fallbackWs = {
          workspace: {
            _id: '6ae251b67c49f3ce5ebad8c2',
            id: '6ae251b67c49f3ce5ebad8c2',
            name: `${resolvedUser?.displayName || 'Brand'}'s Workspace`,
            slug: 'brand-workspace'
          },
          roles: ['ADMIN', 'REVIEWER', 'CREATOR'],
          status: 'active'
        };
        wsList = [fallbackWs];
      }

      setWorkspaces(wsList);
      let selectedWs = null;
      try {
        const savedWsId = localStorage.getItem('cohesora_active_workspace_id');
        if (savedWsId) {
          selectedWs = wsList.find(w => {
            const id = w?.workspace?._id || w?.workspace?.id || w?._id;
            return id === savedWsId;
          });
        }
      } catch (e) {}

      if (!selectedWs) {
        selectedWs = wsList.find(w => {
          const name = (w?.workspace?.name || w?.name || '').toLowerCase();
          return name.includes('truecaller') || name.includes('acme');
        }) || wsList[0];
      }

      setCurrentWorkspace(selectedWs);
      setUser(resolvedUser);
      persistSessionCache(resolvedUser, selectedWs, wsList);
      const wsId = selectedWs?.workspace?._id || selectedWs?.workspace?.id || selectedWs?._id;
      if (wsId) {
        try {
          localStorage.setItem('cohesora_active_workspace_id', wsId);
        } catch (e) {}
        prefetchWorkspaceData(wsId);
      }
    } catch (err) {
      console.warn('Session background sync notice:', err);
      if (!user) {
        setUser(DEMO_USER);
        setWorkspaces([DEMO_WORKSPACE_ENTRY]);
        setCurrentWorkspace(DEMO_WORKSPACE_ENTRY);
      }
    }
  };

  useEffect(() => {
    const handleSessionExpired = () => {
      handleLogout();
    };
    window.addEventListener('cohesora:session-expired', handleSessionExpired);
    return () => window.removeEventListener('cohesora:session-expired', handleSessionExpired);
  }, []);

  useEffect(() => {
    const slowTimer = setTimeout(() => {
      setInitSlow(true);
    }, 2500);
    initAuth().finally(() => clearTimeout(slowTimer));
    return () => clearTimeout(slowTimer);
  }, []);

  // Auto-launch onboarding tour for first-time users
  useEffect(() => {
    if (user && currentWorkspace) {
      try {
        const completed = localStorage.getItem('cohesora_tour_completed');
        if (!completed) {
          const tourTimer = setTimeout(() => {
            setTourOpen(true);
          }, 800);
          return () => clearTimeout(tourTimer);
        }
      } catch (e) {}
    }
  }, [user, currentWorkspace]);

  const handleAuthSuccess = async ({ token, user, membership, memberships }) => {
    try {
      localStorage.removeItem('cohesora_manual_logout');
    } catch (e) {}

    const resolvedUser = user?.user || user;

    // Fast-path: immediately initialize workspaces and active workspace from login/register/demo payload
    // to eliminate the 2-second flash of "No Workspace Available"
    const candidateList = ((memberships && memberships.length > 0) ? memberships : (membership ? [membership] : []))
      .filter(item => {
        const ws = item?.workspace || item;
        return !!(ws?._id || ws?.id);
      });

    let immediateWs = null;
    if (candidateList.length > 0) {
      setWorkspaces(candidateList);
      try {
        const savedWsId = localStorage.getItem('cohesora_active_workspace_id');
        if (savedWsId) {
          immediateWs = candidateList.find(w => {
            const id = w?.workspace?._id || w?.workspace?.id || w?._id;
            return id === savedWsId;
          });
        }
      } catch (e) {}

      if (!immediateWs) {
        immediateWs = candidateList.find(w => {
          const name = (w?.workspace?.name || w?.name || '').toLowerCase();
          return name.includes('acme') || name.includes('truecaller');
        }) || candidateList[0];
      }

      setCurrentWorkspace(immediateWs);
      persistSessionCache(resolvedUser, immediateWs, candidateList);
      const wsId = immediateWs?.workspace?._id || immediateWs?.workspace?.id || immediateWs?._id;
      if (wsId) {
        try {
          localStorage.setItem('cohesora_active_workspace_id', wsId);
        } catch (e) {}
        prefetchWorkspaceData(wsId);
      }
    } else {
      setWorkspacesLoading(true);
    }

    setUser(resolvedUser);

    try {
      let wsList = await api.workspaces.list();
      wsList = (wsList || []).filter(item => {
        const ws = item?.workspace || item;
        return !!(ws?._id || ws?.id);
      });

      if ((!wsList || wsList.length === 0) && candidateList.length > 0) {
        wsList = candidateList;
      }

      if (!wsList || wsList.length === 0) {
        try {
          const created = await api.workspaces.create({
            name: `${resolvedUser?.displayName || 'Brand'}'s Workspace`
          });
          const wsObj = created?.workspace || created;
          if (wsObj?._id || wsObj?.id) {
            wsList = [{ workspace: wsObj, roles: ['ADMIN', 'REVIEWER', 'CREATOR'], status: 'active' }];
          }
        } catch (wsErr) {
          console.warn('Auto workspace provisioning notice:', wsErr);
        }
      }

      if (!wsList || wsList.length === 0) {
        const fallbackWs = {
          workspace: {
            _id: '6ae251b67c49f3ce5ebad8c2',
            id: '6ae251b67c49f3ce5ebad8c2',
            name: `${resolvedUser?.displayName || 'Brand'}'s Workspace`,
            slug: 'brand-workspace'
          },
          roles: ['ADMIN', 'REVIEWER', 'CREATOR'],
          status: 'active'
        };
        wsList = [fallbackWs];
      }

      setWorkspaces(wsList);
      let selectedWs = null;
      try {
        const savedWsId = localStorage.getItem('cohesora_active_workspace_id');
        if (savedWsId) {
          selectedWs = wsList.find(w => {
            const id = w?.workspace?._id || w?.workspace?.id || w?._id;
            return id === savedWsId;
          });
        }
      } catch (e) {}

      if (!selectedWs) {
        selectedWs = wsList.find(w => {
          const name = (w?.workspace?.name || w?.name || '').toLowerCase();
          return name.includes('acme') || name.includes('truecaller');
        }) || wsList[0];
      }

      setCurrentWorkspace(selectedWs);
      persistSessionCache(resolvedUser, selectedWs, wsList);
      const wsId = selectedWs?.workspace?._id || selectedWs?.workspace?.id || selectedWs?._id;
      if (wsId) {
        try {
          localStorage.setItem('cohesora_active_workspace_id', wsId);
        } catch (e) {}
        prefetchWorkspaceData(wsId);
      }
    } catch (err) {
      console.error('Failed to load workspaces after auth', err);
      if (candidateList.length > 0) {
        setWorkspaces(candidateList);
        setCurrentWorkspace(candidateList[0]);
      }
    } finally {
      setWorkspacesLoading(false);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!user || creatingWs) return;
    setCreatingWs(true);
    try {
      const created = await api.workspaces.create({
        name: `${user.displayName || 'Brand'}'s Workspace`
      });
      const wsObj = created?.workspace || created;
      const newEntry = { workspace: wsObj, roles: ['ADMIN', 'REVIEWER', 'CREATOR'], status: 'active' };
      setWorkspaces(prev => [newEntry, ...(prev || [])]);
      setCurrentWorkspace(newEntry);
      persistSessionCache(user, newEntry, [newEntry, ...(workspaces || [])]);
      const wsId = wsObj?._id || wsObj?.id;
      if (wsId) {
        try {
          localStorage.setItem('cohesora_active_workspace_id', wsId);
        } catch (e) {}
        prefetchWorkspaceData(wsId);
      }
    } catch (err) {
      if (err.message?.includes('token') || err.message?.includes('Unauthorized') || err.status === 401) {
        handleLogout();
        return;
      }
      console.warn('Backend workspace creation notice, using instant workspace:', err);
      const fallbackEntry = {
        workspace: {
          _id: '6ae251b67c49f3ce5ebad8c2',
          id: '6ae251b67c49f3ce5ebad8c2',
          name: `${user.displayName || 'Brand'}'s Workspace`,
          slug: 'brand-workspace'
        },
        roles: ['ADMIN', 'REVIEWER', 'CREATOR'],
        status: 'active'
      };
      setWorkspaces(prev => [fallbackEntry, ...(prev || [])]);
      setCurrentWorkspace(fallbackEntry);
      try {
        localStorage.setItem('cohesora_active_workspace_id', fallbackEntry.workspace._id);
      } catch (e) {}
    } finally {
      setCreatingWs(false);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.setItem('cohesora_manual_logout', 'true');
      localStorage.removeItem('cohesora_cached_user');
      localStorage.removeItem('cohesora_cached_workspace');
      localStorage.removeItem('cohesora_cached_workspaces');
      localStorage.removeItem('cohesora_active_workspace_id');
    } catch (e) {}
    ApiClient.setToken(null);
    api.clearCache();
    setUser(null);
    setWorkspaces([]);
    setCurrentWorkspace(null);
    setWorkspacesLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-700 gap-4 p-6 text-center">
        <RefreshCw className="w-9 h-9 animate-spin text-[#F59E0B]" />
        <div>
          <span className="text-sm font-bold font-mono tracking-wide text-[#0B1E36] block">
            Initializing Cohesora Governance Platform...
          </span>
          {initSlow && (
            <p className="text-xs text-slate-500 font-mono mt-2 max-w-sm mx-auto">
              Waking up cloud backend (Render free-tier cold starts can take 20–30s on first load)...
            </p>
          )}
        </div>
        {initSlow && (
          <button
            onClick={() => {
              ApiClient.setToken(null);
              setLoading(false);
            }}
            className="mt-1 px-4 py-2 text-xs font-mono font-bold text-[#0B1E36] bg-white border-2 border-[#0B1E36] shadow-[2px_2px_0px_#0B1E36] rounded-xl hover:bg-slate-50 transition cursor-pointer"
          >
            Skip to Sign In / Demo &rarr;
          </button>
        )}
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
          if (wsId) {
            try {
              localStorage.setItem('cohesora_active_workspace_id', wsId);
            } catch (e) {}
            prefetchWorkspaceData(wsId);
          }
          persistSessionCache(user, ws, workspaces);
        }}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeRole={activeRole}
        onSelectRole={setActiveRole}
        onStartTour={() => setTourOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {!workspaceId ? (
          workspacesLoading ? (
            <div className="p-12 text-center bg-white border-2 border-[#0B1E36] rounded-2xl shadow-[4px_4px_0px_#0B1E36] space-y-4 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border-2 border-[#0B1E36] flex items-center justify-center mx-auto shadow-[2px_2px_0px_#0B1E36]">
                <RefreshCw className="w-6 h-6 animate-spin text-[#F59E0B]" />
              </div>
              <h3 className="text-lg font-black text-[#0B1E36]">Connecting Brand Workspace...</h3>
              <p className="text-xs text-slate-600 font-mono">
                Synchronizing brand governance rules and active campaigns...
              </p>
            </div>
          ) : (
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
          )
        ) : (
          <div className="w-full">
            <div className={activeTab === 'submissions' ? 'block' : 'hidden'}>
              <SubmissionsPage
                workspaceId={workspaceId}
                userRoles={userRoles}
                onNavigateTab={setActiveTab}
                isActive={activeTab === 'submissions'}
              />
            </div>
            <div className={activeTab === 'rules' ? 'block' : 'hidden'}>
              <RulesPage
                workspace={typeof rawWs === 'object' ? rawWs : { _id: workspaceId }}
                workspaceId={workspaceId}
                userRoles={userRoles}
                isActive={activeTab === 'rules'}
              />
            </div>
            <div className={activeTab === 'brief-imports' ? 'block' : 'hidden'}>
              <BriefImportPage
                workspace={typeof rawWs === 'object' ? rawWs : { _id: workspaceId }}
                workspaceId={workspaceId}
                userRoles={userRoles}
                isActive={activeTab === 'brief-imports'}
              />
            </div>
            <div className={activeTab === 'insights' ? 'block' : 'hidden'}>
              <InsightsPage
                workspaceId={workspaceId}
                isActive={activeTab === 'insights'}
              />
            </div>
          </div>
        )}
      </main>

      <OnboardingTour
        isOpen={tourOpen}
        onClose={() => setTourOpen(false)}
        activeTab={activeTab}
        onNavigateTab={setActiveTab}
      />
    </div>
  );
}
