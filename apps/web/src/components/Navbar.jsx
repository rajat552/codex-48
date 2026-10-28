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
  Building2,
  Compass
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
  onSelectRole,
  onStartTour
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

  const rawWs = currentWorkspace?.workspace || currentWorkspace;
  const currentWsId =
    typeof rawWs === 'object'
      ? rawWs?._id || rawWs?.id || ''
      : rawWs || '';

  const currentWsName =
    typeof rawWs === 'object'
      ? rawWs?.name || 'Workspace'
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
      <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 h-16 flex items-center justify-between gap-2 lg:gap-4 flex-nowrap whitespace-nowrap">
        {/* Left Section: Brand & Navigation */}
        <div className="flex items-center gap-3 lg:gap-5 flex-shrink-0">
          <div
            className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0"
            onClick={() => setActiveTab('submissions')}
            data-tour="brand-header"
            title="Cohesora — Brand Governance"
          >
            <div className="w-8 h-8 rounded-xl bg-[#0B1E36] border-2 border-[#0B1E36] flex items-center justify-center shadow-[2px_2px_0px_#F59E0B] flex-shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
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
                    data-tour={`nav-${tab.id}`}
                    className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex-shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#0B1E36] text-white border-2 border-[#0B1E36] shadow-[2px_2px_0px_#F59E0B]'
                        : 'text-slate-700 hover:text-[#0055D4] hover:bg-slate-100 border-2 border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">{tab.label}</span>
                    <span className="xl:hidden">{tab.shortLabel}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right Section: Tour, Workspace Dropdown, Role Dropdown, User Profile & Logout */}
        {user ? (
          <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
            {/* Tour Button - Positioned just left of Workspace */}
            {onStartTour && (
              <button
                type="button"
                onClick={onStartTour}
                data-tour="btn-product-tour"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-amber-50 hover:bg-amber-100 text-[#0B1E36] border-2 border-[#F59E0B] shadow-[2px_2px_0px_#0B1E36] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer flex-shrink-0"
                title="Launch Interactive 10-Step Product Tour"
              >
                <Compass className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span>Tour</span>
              </button>
            )}

            {/* 1. Workspace Dropdown (First only show "Workspace", click to view/switch) */}
            <div className="relative hidden sm:block flex-shrink-0" ref={workspaceDropdownRef}>
              <button
                type="button"
                data-tour="workspace-selector"
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
            <div className="relative hidden sm:block flex-shrink-0" ref={roleDropdownRef}>
              <button
                type="button"
                data-tour="role-selector"
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

            {/* 3. User Avatar, Display & Logout (Unified Login Badge) */}
            <div className="flex items-center pl-1.5 sm:pl-2 border-l-2 border-slate-200 flex-shrink-0">
              <div
                className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100/90 border-2 border-slate-200 rounded-xl p-1 transition-colors shadow-xs"
                title={`${user.displayName} (${user.email})`}
              >
                <div
                  className="w-7 h-7 rounded-lg bg-[#0B1E36] text-[#F59E0B] font-mono font-bold text-xs flex items-center justify-center flex-shrink-0"
                >
                  {userInitials}
                </div>

                <div className="hidden xl:flex flex-col justify-center text-left max-w-[110px] 2xl:max-w-[150px] min-w-0 px-1">
                  <div className="text-xs font-bold text-[#0B1E36] truncate leading-tight">
                    {user.displayName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate leading-tight">
                    {user.email}
                  </div>
                </div>

                <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />

                {/* Integrated Logout button */}
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="w-7 h-7 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
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
        <div className="md:hidden border-t-2 border-slate-200 bg-white px-4 py-4 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {/* Main Navigation tabs */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Navigation
            </span>
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
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#0B1E36] text-white border-2 border-[#0B1E36] shadow-[2px_2px_0px_#F59E0B]'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-2 border-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Workspace Switcher */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Workspace ({workspaces.length})
              </span>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded font-bold">
                {currentWsName}
              </span>
            </div>
            {workspaces.length > 1 && (
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {workspaces.map((w) => {
                  const id =
                    typeof w.workspace === 'object'
                      ? w.workspace._id || w.workspace.id
                      : w.workspace;
                  const name =
                    typeof w.workspace === 'object'
                      ? w.workspace.name || 'Workspace'
                      : 'Workspace';
                  const isSelected = id === currentWsId;

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        onSelectWorkspace(w);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center justify-between border cursor-pointer ${
                        isSelected
                          ? 'bg-amber-50 text-[#0B1E36] border-[#F59E0B]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#0055D4] flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mobile Role Switcher */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Active Role View
              </span>
              <span
                className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                  activeRole === 'ALL'
                    ? 'bg-slate-100 text-[#0B1E36] border-slate-300'
                    : getRoleBadgeStyle(activeRole)
                }`}
              >
                {activeRole}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {currentRoles.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectRole) onSelectRole('ALL');
                    setMobileMenuOpen(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase border cursor-pointer ${
                    activeRole === 'ALL'
                      ? 'bg-[#0B1E36] text-white border-[#0B1E36]'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  ALL
                </button>
              )}
              {currentRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    if (onSelectRole) onSelectRole(role);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase border cursor-pointer ${
                    activeRole === role
                      ? 'bg-[#0B1E36] text-white border-[#0B1E36]'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile User Profile & Sign Out */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-[#0B1E36] text-[#F59E0B] font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                {userInitials}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-[#0B1E36] truncate leading-tight">
                  {user.displayName}
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate leading-tight">
                  {user.email}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
