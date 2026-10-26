import React from 'react';
import { ShieldCheck, Layers, FileText, UploadCloud, PieChart, LogOut, CheckCircle2 } from 'lucide-react';

export function Navbar({ user, workspaces, currentWorkspace, onSelectWorkspace, onLogout, activeTab, setActiveTab }) {
  const currentRoles = currentWorkspace?.roles || ['CREATOR'];

  return (
    <header className="border-b-2 border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('submissions')}>
            <div className="w-9 h-9 rounded-xl bg-[#0B1E36] border-2 border-[#0B1E36] flex items-center justify-center shadow-[2px_2px_0px_#F59E0B]">
              <ShieldCheck className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-[#0B1E36]">
                Cohesora
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                Evidence-First
              </span>
            </div>
          </div>

          {/* Navigation links */}
          {user && (
            <nav className="hidden md:flex items-center gap-1.5">
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
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                      isActive
                        ? 'bg-[#0B1E36] text-white border-2 border-[#0B1E36] shadow-[2px_2px_0px_#F59E0B]'
                        : 'text-slate-700 hover:text-[#0055D4] hover:bg-slate-100 border-2 border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
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
            <div className="flex items-center gap-2 bg-white border-2 border-slate-300 rounded-lg px-3 py-1.5 text-xs shadow-sm focus-within:border-[#0055D4]">
              <span className="text-slate-500 font-mono text-[11px] uppercase">Workspace:</span>
              <select
                value={typeof currentWorkspace?.workspace === 'object' ? (currentWorkspace.workspace._id || currentWorkspace.workspace.id) : (currentWorkspace?.workspace || '')}
                onChange={e => {
                  const ws = workspaces.find(w => {
                    const id = typeof w.workspace === 'object' ? (w.workspace._id || w.workspace.id) : w.workspace;
                    return id === e.target.value;
                  });
                  if (ws) onSelectWorkspace(ws);
                }}
                className="bg-transparent text-[#0B1E36] font-bold font-mono focus:outline-none cursor-pointer"
              >
                {workspaces.map(w => {
                  const id = typeof w.workspace === 'object' ? (w.workspace._id || w.workspace.id) : w.workspace;
                  const name = typeof w.workspace === 'object' ? (w.workspace.name || 'Workspace') : 'Workspace';
                  return (
                    <option key={id} value={id} className="bg-white text-slate-900">
                      {name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Role pills */}
            <div className="hidden lg:flex items-center gap-1">
              {currentRoles.map(role => (
                <span
                  key={role}
                  className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-[#0B1E36] border border-slate-300"
                >
                  {role}
                </span>
              ))}
            </div>

            {/* User display */}
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-[#0B1E36]">{user.displayName}</div>
              <div className="text-[10px] text-slate-500 font-mono">{user.email}</div>
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-xs font-mono text-slate-500">Not authenticated</div>
        )}
      </div>
    </header>
  );
}
