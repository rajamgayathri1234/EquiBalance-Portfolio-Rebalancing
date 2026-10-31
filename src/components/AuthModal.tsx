import React, { useState } from 'react';
import { UserAccount, UserRole, RiskTolerance, PortfolioType } from '../types';
import { Lock, User, Mail, Phone, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onLogin: (user: UserAccount) => void;
  onRegister: (newUser: UserAccount) => void;
  registeredUsers: UserAccount[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onRegister,
  registeredUsers
}) => {
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('CUSTOMER');
  const [regPan, setRegPan] = useState('');
  const [regPortfolioType, setRegPortfolioType] = useState<PortfolioType>('DEMAT_INDIVIDUAL');
  const [regRisk, setRegRisk] = useState<RiskTolerance>('BALANCED');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  if (!isOpen) return null;

  // Handle Login submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail.trim()) {
      setLoginError('Please enter your email address or mobile number.');
      return;
    }

    // Match in registered users
    const found = registeredUsers.find(
      u => u.email.toLowerCase() === loginEmail.trim().toLowerCase() || u.phone === loginEmail.trim()
    );

    if (found) {
      if (found.password && loginPassword && found.password !== loginPassword) {
        setLoginError('Invalid password. Please verify your credentials.');
        return;
      }
      onLogin(found);
      onClose();
    } else {
      // Create user on the fly if not found
      const defaultUser: UserAccount = {
        id: `USR-${Date.now().toString().slice(-6)}`,
        name: loginEmail.split('@')[0].replace('.', ' ').toUpperCase(),
        email: loginEmail.trim(),
        phone: '+91 98765 43210',
        role: 'CUSTOMER',
        kycStatus: 'VERIFIED',
        createdAt: new Date().toISOString()
      };
      onLogin(defaultUser);
      onClose();
    }
  };

  // Quick 1-click Demo Login
  const handleQuickDemoLogin = (role: UserRole) => {
    const demoAccounts: Record<UserRole, UserAccount> = {
      CUSTOMER: {
        id: 'USR-IN-001',
        name: 'Rajesh Sharma',
        email: 'rajesh.sharma@investor.in',
        phone: '+91 98112 34567',
        role: 'CUSTOMER',
        panNumber: 'ABCPS1234F',
        kycStatus: 'VERIFIED',
        createdAt: '2024-01-15T09:00:00Z'
      },
      OPERATIONS: {
        id: 'USR-IN-002',
        name: 'Priya Patel',
        email: 'priya.patel@wealthops.in',
        phone: '+91 98223 45678',
        role: 'OPERATIONS',
        panNumber: 'BKPPA5678K',
        kycStatus: 'VERIFIED',
        createdAt: '2024-01-20T10:00:00Z'
      },
      COMPLIANCE: {
        id: 'USR-IN-003',
        name: 'Arun Verma',
        email: 'arun.verma@compliance.in',
        phone: '+91 98334 56789',
        role: 'COMPLIANCE',
        panNumber: 'CKPVE9012M',
        kycStatus: 'VERIFIED',
        createdAt: '2024-02-01T11:00:00Z'
      },
      ADMIN: {
        id: 'USR-IN-004',
        name: 'Suresh Gupta (Admin)',
        email: 'admin@equibalance.in',
        phone: '+91 98445 67890',
        role: 'ADMIN',
        panNumber: 'DKPGU3456N',
        kycStatus: 'VERIFIED',
        createdAt: '2024-01-01T08:00:00Z'
      }
    };

    onLogin(demoAccounts[role]);
    onClose();
  };

  // Handle Registration submission
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim()) {
      setRegError('Please provide your full legal name as per PAN / Aadhaar.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setRegError('Please provide a valid email address.');
      return;
    }
    if (!regPhone.trim()) {
      setRegError('Please provide a 10-digit mobile number.');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    const newUser: UserAccount = {
      id: `USR-${Date.now().toString().slice(-6)}`,
      name: regName.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim().startsWith('+91') ? regPhone.trim() : `+91 ${regPhone.trim()}`,
      role: regRole,
      panNumber: regPan.trim().toUpperCase() || 'ABCDE1234F',
      kycStatus: 'VERIFIED',
      password: regPassword,
      createdAt: new Date().toISOString()
    };

    onRegister(newUser);
    setRegSuccess(true);
    setTimeout(() => {
      onLogin(newUser);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-1 rounded-lg"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center pb-6 border-b border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center font-bold text-lg mb-3">
            ₹
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            EquiBalance Secure Portal
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            SEBI Compliant Portfolio Rebalancing & Demat Allocation Engine
          </p>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-2 mt-6 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setTab('LOGIN');
                setLoginError('');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === 'LOGIN'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In (Existing User)
            </button>
            <button
              onClick={() => {
                setTab('REGISTER');
                setRegError('');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === 'REGISTER'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              User Registration (New Account)
            </button>
          </div>
        </div>

        {/* 1. LOGIN TAB */}
        {tab === 'LOGIN' && (
          <div className="mt-6 space-y-6">
            {/* Quick 1-Click Role Login */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Quick 1-Click Role Access:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('CUSTOMER')}
                  className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors flex items-center justify-between group"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">Rajesh Sharma</span>
                    <span className="text-[10px] text-cyan-400">Investor / Demat Client</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('OPERATIONS')}
                  className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors flex items-center justify-between group"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">Priya Patel</span>
                    <span className="text-[10px] text-cyan-400">Operations Analyst</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('COMPLIANCE')}
                  className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors flex items-center justify-between group"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">Arun Verma</span>
                    <span className="text-[10px] text-amber-400">Compliance Reviewer</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('ADMIN')}
                  className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors flex items-center justify-between group"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">Suresh Gupta</span>
                    <span className="text-[10px] text-emerald-400">System Admin</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                </button>
              </div>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[11px] text-slate-500 uppercase">Or sign in with credentials</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/50 flex items-center gap-2 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Registered Email Address or Mobile Number:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="rajesh.sharma@investor.in or 9811234567"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    Account Password:
                  </label>
                  <span className="text-[11px] text-cyan-400 hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Sign In to EquiBalance</span>
              </button>
            </form>
          </div>
        )}

        {/* 2. REGISTRATION TAB */}
        {tab === 'REGISTER' && (
          <div className="mt-6">
            {regSuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-white">Registration Successful!</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Your Demat profile has been provisioned and KYC marked as VERIFIED. Logging you in now...
                </p>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {regError && (
                  <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/50 flex items-center gap-2 text-xs text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{regError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Full Legal Name:
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      placeholder="e.g. Vikram Malhotra"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Email Address:
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      placeholder="vikram@investor.in"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Mobile Number (+91):
                    </label>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={e => setRegPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      PAN Card Number:
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={regPan}
                      onChange={e => setRegPan(e.target.value.toUpperCase())}
                      placeholder="ABCDE1234F"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Select Account Role / Workspace:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { role: 'CUSTOMER' as UserRole, label: 'Investor', desc: 'Demat Portfolio' },
                      { role: 'OPERATIONS' as UserRole, label: 'Operations', desc: 'Batch Execution' },
                      { role: 'COMPLIANCE' as UserRole, label: 'Compliance', desc: 'Policy & Rules' },
                      { role: 'ADMIN' as UserRole, label: 'Admin', desc: 'Data Generator' }
                    ].map(item => (
                      <button
                        type="button"
                        key={item.role}
                        onClick={() => setRegRole(item.role)}
                        className={`p-2 rounded-lg border text-left transition-colors ${
                          regRole === item.role
                            ? 'bg-cyan-950/60 border-cyan-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="font-bold text-xs block">{item.label}</span>
                        <span className="text-[10px] opacity-75">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Demat & Risk Appetite (if customer) */}
                {regRole === 'CUSTOMER' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Demat Account Type:
                      </label>
                      <select
                        value={regPortfolioType}
                        onChange={e => setRegPortfolioType(e.target.value as PortfolioType)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      >
                        <option value="DEMAT_INDIVIDUAL">Demat Individual Resident</option>
                        <option value="HUF_ACCOUNT">HUF (Hindu Undivided Family)</option>
                        <option value="CORPORATE">Corporate Demat Account</option>
                        <option value="TRUST">Trust / Society Demat</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Risk Appetite:
                      </label>
                      <select
                        value={regRisk}
                        onChange={e => setRegRisk(e.target.value as RiskTolerance)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      >
                        <option value="CONSERVATIVE">Conservative Income (30/70)</option>
                        <option value="BALANCED">Balanced Core (60/40)</option>
                        <option value="GROWTH">Moderate Growth (70/30)</option>
                        <option value="AGGRESSIVE_GROWTH">Aggressive Growth (80/20)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Password Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Create Password:
                    </label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Confirm Password:
                    </label>
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={e => setRegConfirmPassword(e.target.value)}
                      placeholder="Re-type password"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Complete Registration & Open Demat Portal</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 text-center">
                  By registering, you agree to SEBI surveillance disclosures and educational simulation terms.
                </p>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
