import React from 'react';
import { ShieldCheck, Layers, FileText, UploadCloud, PieChart, LogOut, CheckCircle2 } from 'lucide-react';

export function Navbar({ user, workspaces, currentWorkspace, onSelectWorkspace, onLogout, activeTab, setActiveTab }) {
  const currentRoles = currentWorkspace?.roles || ['CREATOR'];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('submissions')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Cohesora
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Evidence-First
              </span>
            </div>
          </div>

          {/* Navigation links */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {[
                { id: 'submissions', label: 'Reviews', icon: FileText },
                { id: 'rules', label: 'Brand Rules', icon: Layers },
                { id: 'brief-imports', label: 'Brief Imports', icon: UploadCloud },
                { id: 'insights', label: 'Governance Insights', icon: PieChart }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* User profile & Workspace selector */}
        {user ? (
          <div className="flex items-center gap-4">
            {/* Workspace selector */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
              <span className="text-slate-500">Workspace:</span>
              <select
                value={currentWorkspace?.workspace?._id || ''}
                onChange={e => {
                  const ws = workspaces.find(w => w.workspace._id === e.target.value);
                  if (ws) onSelectWorkspace(ws);
                }}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                {workspaces.map(w => (
                  <option key={w.workspace._id} value={w.workspace._id} className="bg-slate-900 text-slate-200">
                    {w.workspace.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Role pills */}
            <div className="hidden lg:flex items-center gap-1">
              {currentRoles.map(role => (
                <span
                  key={role}
                  className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                >
                  {role}
                </span>
              ))}
            </div>

            {/* User display */}
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-200">{user.displayName}</div>
              <div className="text-[10px] text-slate-500">{user.email}</div>
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-400">Not authenticated</div>
        )}
      </div>
    </header>
  );
}
