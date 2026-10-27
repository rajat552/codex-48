import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Layers,
  FileText,
  UploadCloud,
  PieChart,
  LogOut,
  ChevronDown,
  Check,
  Shield,
  Search,
  PenTool,
  Users,
  Menu,
  X,
  Building2
} from 'lucide-react';

export function Navbar({
  user,
  workspaces,
  currentWorkspace,
  onSelectWorkspace,
  onLogout,
  activeTab,
  setActiveTab,
  activeRole = 'ALL',
  onSelectRole
}) {
  const currentRoles = currentWorkspace?.roles || ['CREATOR'];
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const workspaceDropdownRef = useRef(null);
  const roleDropdownRef = useRef(null);

  // Close dropdowns on click outside or escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        workspaceDropdownRef.current &&
        !workspaceDropdownRef.current.contains(event.target)
      ) {
        setWorkspaceDropdownOpen(false);
      }
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(event.target)
      ) {
        setRoleDropdownOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setWorkspaceDropdownOpen(false);
        setRoleDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'REVIEWER':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'CREATOR':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="w-3.5 h-3.5 text-amber-600" />;
      case 'REVIEWER':
        return <Search className="w-3.5 h-3.5 text-emerald-600" />;
      case 'CREATOR':
        return <PenTool className="w-3.5 h-3.5 text-blue-600" />;
      default:
        return <Users className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'Full governance, rules & settings';
      case 'REVIEWER':
        return 'Approve, reject & resolve findings';
      case 'CREATOR':
        return 'Submit campaigns & new revisions';
      default:
        return 'Standard workspace access';
    }
  };

  const currentWsId =
    typeof currentWorkspace?.workspace === 'object'
      ? currentWorkspace.workspace._id || currentWorkspace.workspace.id
      : currentWorkspace?.workspace || '';

  const currentWsName =
    typeof currentWorkspace?.workspace === 'object'
      ? currentWorkspace.workspace.name || 'Workspace'
      : 'Workspace';

  const userInitials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const navItems = [
    { id: 'submissions', label: 'Reviews', shortLabel: 'Reviews', icon: FileText },
    { id: 'rules', label: 'Brand Rules', shortLabel: 'Rules', icon: Layers },
    { id: 'brief-imports', label: 'Brief Imports', shortLabel: 'Briefs', icon: UploadCloud },
    { id: 'insights', label: 'Insights', shortLabel: 'Insights', icon: PieChart }
  ];

  return (
    <header className="border-b-2 border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-50 shadow-sm w-full">
      <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-8 h-16 flex items-center justify-between gap-2 lg:gap-4 flex-nowrap whitespace-nowrap">
        {/* Left Section: Brand & Navigation */}
        <div className="flex items-center gap-3 lg:gap-5 flex-shrink-0">
          <div
            className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0"
            onClick={() => setActiveTab('submissions')}
          >
            <div className="w-9 h-9 rounded-xl bg-[#0B1E36] border-2 border-[#0B1E36] flex items-center justify-center shadow-[2px_2px_0px_#F59E0B] flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div className="flex items-center">
              <span className="text-xl font-black tracking-tight text-[#0B1E36]">
                Cohesora
              </span>
              <span className="hidden 2xl:inline-block ml-2 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex-shrink-0">
                Evidence-First
              </span>
            </div>
          </div>

          {/* Navigation links */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 flex-shrink-0">
              {navItems.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex-shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#0B1E36] text-white border-2 border-[#0B1E36] shadow-[2px_2px_0px_#F59E0B]'
                        : 'text-slate-700 hover:text-[#0055D4] hover:bg-slate-100 border-2 border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right Section: Workspace Dropdown, Role Dropdown, User Profile & Logout */}
        {user ? (
          <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
            {/* 1. Workspace Dropdown (First only show "Workspace", click to view/switch) */}
            <div className="relative flex-shrink-0" ref={workspaceDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setWorkspaceDropdownOpen((prev) => !prev);
                  setRoleDropdownOpen(false);
                }}
                className={`flex items-center gap-1.5 bg-white border-2 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold shadow-sm transition-all cursor-pointer ${
                  workspaceDropdownOpen
                    ? 'border-[#0055D4] ring-2 ring-[#0055D4]/20'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
                title={`Active Workspace: ${currentWsName}`}
              >
                <Building2 className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-[#0B1E36] font-mono uppercase text-xs tracking-wider">
                  Workspace
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                    workspaceDropdownOpen ? 'rotate-180 text-[#0055D4]' : ''
                  }`}
                />
              </button>

              {/* Workspace Popover Menu */}
              {workspaceDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border-2 border-[#0B1E36] rounded-xl shadow-[4px_4px_0px_#0B1E36] py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                      Select Workspace
                    </span>
                    <span className="text-[10px] font-mono text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-bold">
                      {workspaces.length} Available
                    </span>
                  </div>

                  <div className="py-1 max-h-60 overflow-y-auto">
                    {workspaces.map((w) => {
                      const id =
                        typeof w.workspace === 'object'
                          ? w.workspace._id || w.workspace.id
                          : w.workspace;
                      const name =
                        typeof w.workspace === 'object'
                          ? w.workspace.name || 'Workspace'
                          : 'Workspace';
                      const slug =
                        typeof w.workspace === 'object' ? w.workspace.slug : '';
                      const isSelected = id === currentWsId;

                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            onSelectWorkspace(w);
                            setWorkspaceDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                            isSelected ? 'bg-amber-50/70 border-l-4 border-[#F59E0B]' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-4 h-4 text-[#0B1E36]" />
                            </div>
                            <div className="overflow-hidden">
                              <div className="text-xs font-bold text-[#0B1E36] font-mono truncate">
                                {name}
                              </div>
                              {slug && (
                                <div className="text-[10px] text-slate-500 font-mono truncate">
                                  {slug}
                                </div>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <span className="ml-2 text-[10px] font-mono font-bold uppercase text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded flex-shrink-0">
                              Active
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Role Dropdown */}
            <div className="relative flex-shrink-0" ref={roleDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setRoleDropdownOpen((prev) => !prev);
                  setWorkspaceDropdownOpen(false);
                }}
                className={`flex items-center gap-1.5 bg-white border-2 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold shadow-sm transition-all cursor-pointer ${
                  roleDropdownOpen
                    ? 'border-[#0055D4] ring-2 ring-[#0055D4]/20'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
                title="Switch active role view"
              >
                {activeRole === 'ALL' ? (
                  <Users className="w-3.5 h-3.5 text-slate-700" />
                ) : (
                  getRoleIcon(activeRole)
                )}
                <span className="text-slate-500 uppercase text-[11px] hidden sm:inline">Role:</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${
                    activeRole === 'ALL'
                      ? 'bg-slate-100 text-[#0B1E36] border-slate-300'
                      : getRoleBadgeStyle(activeRole)
                  }`}
                >
                  {activeRole === 'ALL'
                    ? currentRoles.length > 1
                      ? `ALL (${currentRoles.length})`
                      : currentRoles[0]
                    : activeRole}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                    roleDropdownOpen ? 'rotate-180 text-[#0055D4]' : ''
                  }`}
                />
              </button>

              {/* Role Popover Menu */}
              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border-2 border-[#0B1E36] rounded-xl shadow-[4px_4px_0px_#0B1E36] py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                      Switch Role View
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      {currentRoles.length} assigned
                    </span>
                  </div>

                  {currentRoles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectRole) onSelectRole('ALL');
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                        activeRole === 'ALL' ? 'bg-amber-50/70' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-slate-100 border border-slate-300 flex items-center justify-center">
                          <Users className="w-3.5 h-3.5 text-[#0B1E36]" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#0B1E36] font-mono flex items-center gap-1.5">
                            <span>ALL ROLES</span>
                            <span className="text-[9px] bg-slate-200 text-slate-700 px-1 rounded font-normal">
                              Default
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Full combined permissions
                          </div>
                        </div>
                      </div>
                      {activeRole === 'ALL' && <Check className="w-4 h-4 text-[#0055D4]" />}
                    </button>
                  )}

                  <div className="py-1">
                    {currentRoles.map((role) => {
                      const isSelected = activeRole === role;
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => {
                            if (onSelectRole) onSelectRole(role);
                            setRoleDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                            isSelected ? 'bg-blue-50/70' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center">
                              {getRoleIcon(role)}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[#0B1E36] font-mono flex items-center gap-1.5">
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold border ${getRoleBadgeStyle(
                                    role
                                  )}`}
                                >
                                  {role}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {getRoleDescription(role)}
                              </div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#0055D4]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3. User Avatar & Display */}
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200 flex-shrink-0">
              <div
                className="w-8 h-8 rounded-lg bg-[#0B1E36] text-[#F59E0B] font-mono font-bold text-xs flex items-center justify-center border border-[#0B1E36] shadow-sm flex-shrink-0"
                title={`${user.displayName} (${user.email})`}
              >
                {userInitials}
              </div>

              <div className="hidden lg:block text-left flex-shrink-0 max-w-[110px] xl:max-w-[140px]">
                <div className="text-xs font-bold text-[#0B1E36] truncate leading-tight">
                  {user.displayName}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate leading-tight">
                  {user.email}
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-300 transition-colors flex-shrink-0 cursor-pointer ml-0.5"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-300 flex-shrink-0 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        ) : (
          <div className="text-xs font-mono text-slate-500">Not authenticated</div>
        )}
      </div>

      {/* Mobile navigation drawer when open */}
      {mobileMenuOpen && user && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                    isActive
                      ? 'bg-[#0B1E36] text-white'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
          <div className="pt-2 border-t border-slate-100 text-xs font-mono text-slate-500">
            Workspace: <span className="font-bold text-[#0B1E36]">{currentWsName}</span>
          </div>
          <div className="text-xs font-mono text-slate-500">
            Signed in as: <span className="font-bold text-[#0B1E36]">{user.displayName}</span> ({user.email})
          </div>
        </div>
      )}
    </header>
  );
}
