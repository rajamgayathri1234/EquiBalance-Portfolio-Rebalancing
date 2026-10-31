import React, { useState } from 'react';
import { UserRole, UserAccount } from '../types';
import { SlidersHorizontal, ShieldAlert, BarChart3, Database, Lock, LogOut, User } from 'lucide-react';

interface HeaderProps {
  activeRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  onQuickAction: () => void;
  totalPortfolios: number;
  criticalDriftCount: number;
  currentUser: UserAccount | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeRole,
  onSelectRole,
  onQuickAction,
  totalPortfolios,
  criticalDriftCount,
  currentUser,
  onOpenAuth,
  onLogout
}) => {
  const [deniedRoleMsg, setDeniedRoleMsg] = useState<string | null>(null);

  // Check if current user is authorized to view a specific role view
  const canAccessRole = (targetRole: UserRole): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return true;
    if (currentUser.role === 'COMPLIANCE') {
      return targetRole === 'COMPLIANCE' || targetRole === 'OPERATIONS' || targetRole === 'CUSTOMER';
    }
    if (currentUser.role === 'OPERATIONS') {
      return targetRole === 'OPERATIONS' || targetRole === 'CUSTOMER';
    }
    if (currentUser.role === 'CUSTOMER') {
      return targetRole === 'CUSTOMER';
    }
    return false;
  };

  const handleRoleClick = (targetRole: UserRole) => {
    if (canAccessRole(targetRole)) {
      setDeniedRoleMsg(null);
      onSelectRole(targetRole);
    } else {
      setDeniedRoleMsg(
        `Access Restricted: Your active role is ${currentUser?.role || 'Guest'}. You do not have clearance for ${targetRole} workspace.`
      );
      setTimeout(() => setDeniedRoleMsg(null), 4000);
    }
  };

  return (
    <>
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
        {/* Zone 1: Brand Wordmark (Single text element wordmark in display face) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center font-bold text-white shadow-sm font-mono">
            ₹
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap block">
              EquiBalance
            </span>
            <span className="text-[10px] text-slate-400 font-mono -mt-1 block">
              Portfolio Rebalance Engine
            </span>
          </div>
        </div>

        {/* Zone 2: 4 Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {/* Customer Portal */}
          <button
            onClick={() => handleRoleClick('CUSTOMER')}
            className={`flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeRole === 'CUSTOMER'
                ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Customer Portal</span>
          </button>

          {/* Operations Cockpit */}
          <button
            onClick={() => handleRoleClick('OPERATIONS')}
            className={`flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeRole === 'OPERATIONS'
                ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                : canAccessRole('OPERATIONS')
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Operations Cockpit</span>
            {!canAccessRole('OPERATIONS') && <Lock className="w-3 h-3 text-slate-600" />}
            {criticalDriftCount > 0 && canAccessRole('OPERATIONS') && (
              <span className="text-xs text-amber-400 font-mono">({criticalDriftCount})</span>
            )}
          </button>

          {/* Risk & Compliance */}
          <button
            onClick={() => handleRoleClick('COMPLIANCE')}
            className={`flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeRole === 'COMPLIANCE'
                ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                : canAccessRole('COMPLIANCE')
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Risk & Compliance</span>
            {!canAccessRole('COMPLIANCE') && <Lock className="w-3 h-3 text-slate-600" />}
          </button>

          {/* Admin & Data Hub */}
          <button
            onClick={() => handleRoleClick('ADMIN')}
            className={`flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeRole === 'ADMIN'
                ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                : canAccessRole('ADMIN')
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Admin & Data Hub</span>
            {!canAccessRole('ADMIN') && <Lock className="w-3 h-3 text-slate-600" />}
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action & User Session */}
        <div className="flex items-center gap-3 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-3">
              {/* User details */}
              <div className="text-right text-xs">
                <span className="font-semibold text-white block truncate max-w-[140px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider">
                  {currentUser.role}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                title="Sign out of current session"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-300 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900/60 rounded-lg border border-rose-800/60 transition-colors whitespace-nowrap shrink-0 font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>

              {/* Run Batch Action for Ops/Admin */}
              {(currentUser.role === 'OPERATIONS' || currentUser.role === 'ADMIN') && (
                <button
                  onClick={onQuickAction}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
                >
                  Run Batch
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
            >
              Sign In / Register
            </button>
          )}
        </div>
      </header>

      {/* Role Access Restriction Banner */}
      {deniedRoleMsg && (
        <div className="bg-amber-950/90 border-b border-amber-800/80 px-6 py-2 text-xs text-amber-200 flex items-center justify-between sticky top-[69px] z-40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{deniedRoleMsg}</span>
          </div>
          <button
            onClick={() => setDeniedRoleMsg(null)}
            className="text-[11px] text-amber-400 hover:text-amber-100 font-bold ml-4 underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  );
};
