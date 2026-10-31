import React, { useState } from 'react';
import { UserRole, PortfolioType } from '../types';
import { authApi } from '../services/api';
import {
  User,
  Mail,
  Phone,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';

interface RegisterPageProps {
  onNavigateToLogin: (registeredEmail?: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [privilegedKey, setPrivilegedKey] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [portfolioType, setPortfolioType] = useState<PortfolioType>('DEMAT_INDIVIDUAL');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password strength calculation
  const passwordStrength = React.useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // 1. Validate Full Name
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage('Please enter your full legal name (at least 2 characters).');
      return;
    }

    // 2. Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address (e.g., name@domain.in).');
      return;
    }

    // 3. Validate Mobile Number
    const cleanMobile = mobileNumber.replace(/[\s\-+]/g, '');
    const indianMobileRegex = /^(?:91)?[6-9]\d{9}$/;
    if (!cleanMobile || !indianMobileRegex.test(cleanMobile)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number starting with 6-9.');
      return;
    }

    // 4. Validate Password Complexity
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    // 5. Ensure Passwords Match
    if (password !== confirmPassword) {
      setErrorMessage('Password and Confirm Password do not match.');
      return;
    }

    // 6. Privileged Role Check
    if (role !== 'CUSTOMER') {
      if (!privilegedKey.trim()) {
        setErrorMessage(
          'Privileged role registration requires an Administrative Authorization Key. (For verification testing, use key: EQUI-PRIVILEGED-2026).'
        );
        return;
      }
    }

    setIsLoading(true);

    try {
      const response = await authApi.register({
        name: fullName.trim(),
        email: email.trim(),
        phone: cleanMobile,
        password,
        confirmPassword,
        role,
        panNumber: panNumber.trim().toUpperCase() || undefined,
        portfolioType,
        privilegedKey: role !== 'CUSTOMER' ? privilegedKey.trim() : undefined
      });

      if (response.success) {
        setSuccessMessage('Registration successful! Redirecting to login...');
        setTimeout(() => {
          onNavigateToLogin(email.trim());
        }, 1200);
      } else {
        setErrorMessage(response.error || 'Registration failed. Please review your details.');
      }
    } catch (err: any) {
      setErrorMessage('Network error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Background Decorative Mesh Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-25">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400 mb-3 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>SEBI-Compliant Indian Portfolio Management Engine</span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center font-bold text-slate-950 text-xl shadow-lg shadow-cyan-500/20 font-mono">
              ₹
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              EquiBalance
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-2">
            Create your account to access policy-constrained portfolio rebalancing & allocation workflows.
          </p>
        </div>

        {/* Registration Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-white tracking-tight">
              User Registration
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your verified details to initialize your personalized investor or administrative profile.
            </p>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 flex items-start gap-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 flex items-center gap-3 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name (as per PAN / Official ID) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar Sharma"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* 2. Email Address & Mobile Number in 2-column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="rajesh@investor.in"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mobile Number (+91) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={e => setMobileNumber(e.target.value)}
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-mono"
                  />
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>
            </div>

            {/* 3. User Role Selection (Customer, Operations, Risk & Compliance, Admin) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Select User Role & Workspace <span className="text-rose-400">*</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  Privileged roles require admin key
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'CUSTOMER' as UserRole, label: 'Customer', desc: 'Investor Portal' },
                  { id: 'OPERATIONS' as UserRole, label: 'Operations', desc: 'Batch Cockpit' },
                  { id: 'COMPLIANCE' as UserRole, label: 'Compliance', desc: 'Policy Engine' },
                  { id: 'ADMIN' as UserRole, label: 'Admin', desc: 'Data & Schema' }
                ].map(item => {
                  const isSelected = role === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => {
                        setRole(item.id);
                        setErrorMessage('');
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-sm ring-1 ring-cyan-400'
                          : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-bold block">{item.label}</span>
                      <span className="text-[10px] opacity-75">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Privileged Key Field (Appears only if non-Customer role chosen) */}
            {role !== 'CUSTOMER' && (
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/50 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>Administrative Authorization Key Required</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  To prevent unauthorized privilege escalation, non-Customer roles require a verified security key.
                  <span className="text-amber-300 font-mono ml-1 font-semibold">Demo Key: EQUI-PRIVILEGED-2026</span>
                </p>
                <input
                  type="text"
                  required
                  value={privilegedKey}
                  onChange={e => setPrivilegedKey(e.target.value)}
                  placeholder="Enter security key e.g. EQUI-PRIVILEGED-2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            )}

            {/* 5. Optional PAN Number (for Customer Demat setup) */}
            {role === 'CUSTOMER' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Demat Account Type
                  </label>
                  <select
                    value={portfolioType}
                    onChange={e => setPortfolioType(e.target.value as PortfolioType)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="DEMAT_INDIVIDUAL">Demat Individual Resident</option>
                    <option value="HUF_ACCOUNT">HUF (Hindu Undivided Family)</option>
                    <option value="CORPORATE">Corporate Demat Account</option>
                    <option value="TRUST">Trust / Institutional Account</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    PAN Card Number (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={panNumber}
                    onChange={e => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. ABCDE1234F"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 uppercase"
                  />
                </div>
              </div>
            )}

            {/* 6. Password & Confirm Password in 2-column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password (min 8 chars) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 pr-10 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-mono"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-500 hover:text-slate-300 absolute right-3 top-2.5 p-0.5"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 pr-10 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-mono"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-slate-500 hover:text-slate-300 absolute right-3 top-2.5 p-0.5"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Password Security:</span>
                  <span
                    className={
                      passwordStrength <= 1
                        ? 'text-rose-400 font-bold'
                        : passwordStrength <= 2
                        ? 'text-amber-400 font-bold'
                        : 'text-emerald-400 font-bold'
                    }
                  >
                    {passwordStrength <= 1 ? 'Weak' : passwordStrength <= 2 ? 'Moderate' : 'Strong'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 h-1.5">
                  <div className={`rounded-full ${passwordStrength >= 1 ? 'bg-cyan-500' : 'bg-slate-800'}`}></div>
                  <div className={`rounded-full ${passwordStrength >= 2 ? 'bg-cyan-500' : 'bg-slate-800'}`}></div>
                  <div className={`rounded-full ${passwordStrength >= 3 ? 'bg-cyan-500' : 'bg-slate-800'}`}></div>
                  <div className={`rounded-full ${passwordStrength >= 4 ? 'bg-emerald-400' : 'bg-slate-800'}`}></div>
                </div>
              </div>
            )}

            {/* Register Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-[0.99]"
              >
                {isLoading ? (
                  <span>Encrypting Credentials & Provisioning...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Register Account & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Already have an account footer */}
          <div className="border-t border-slate-800 pt-5 text-center text-xs text-slate-400">
            <span>Already have an account? </span>
            <button
              type="button"
              onClick={() => onNavigateToLogin()}
              className="font-bold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors ml-1 cursor-pointer"
            >
              Login here
            </button>
          </div>
        </div>

        {/* Quiet Footnote */}
        <p className="text-[11px] text-slate-500 text-center mt-6">
          EquiBalance uses server-side scrypt cryptographic key derivation. All communications are TLS encrypted.
        </p>
      </div>
    </div>
  );
};
