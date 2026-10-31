import React, { useState } from 'react';
import { UserRole } from '../types';
import { authService } from '../services/authService';
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Info
} from 'lucide-react';

interface RegistrationPageProps {
  onNavigateToLogin: (registeredEmail?: string) => void;
}

export const RegistrationPage: React.FC<RegistrationPageProps> = ({ onNavigateToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [adminCode, setAdminCode] = useState('');
  const [panNumber, setPanNumber] = useState('');

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Client validation
  const validate = (): string | null => {
    if (!name.trim() || name.trim().length < 2) {
      return 'Please enter your full legal name (minimum 2 characters).';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      return 'Please enter a valid email address (e.g., investor@domain.com).';
    }
    const cleanPhone = phone.replace(/[\s\-\+]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      return 'Please enter a valid 10-digit mobile number.';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters in length.';
    }
    if (password !== confirmPassword) {
      return 'Password and Confirm Password do not match.';
    }
    if (role !== 'CUSTOMER' && !adminCode.trim()) {
      return `Privileged role '${role}' requires an Administrative Authorization Key.`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        confirmPassword,
        role,
        panNumber: panNumber.trim().toUpperCase() || undefined,
        adminCode: role !== 'CUSTOMER' ? adminCode.trim() : undefined
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Registration failed.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg('Account registered successfully! Redirecting to login page...');
      setTimeout(() => {
        onNavigateToLogin(email.trim());
      }, 1500);
    } catch (err: any) {
      setErrorMsg('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[300px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Registration Card */}
      <div className="w-full max-w-xl z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-bold text-xl mb-3 shadow-lg shadow-cyan-500/10">
            ₹
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            EquiBalance Account Registration
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-md mx-auto">
            Institutional portfolio rebalancing & policy compliance platform for Indian wealth managers and investors.
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 flex items-start gap-3 text-xs text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/80 flex items-start gap-3 text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{successMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Vikram Malhotra"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/60 focus:border-cyan-500 transition-all"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="vikram@investor.in"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/60 focus:border-cyan-500 transition-all"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Mobile Number & PAN Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mobile Number <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/60 focus:border-cyan-500 transition-all font-mono"
                  />
                  <Phone className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  PAN Number (Optional)
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={panNumber}
                  onChange={e => setPanNumber(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-cyan-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/60 focus:border-cyan-500 transition-all font-mono uppercase"
                />
              </div>
            </div>

            {/* User Role Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Select User Role <span className="text-cyan-400">*</span>
                </label>
                {role !== 'CUSTOMER' && (
                  <span className="text-[11px] text-amber-400 flex items-center gap-1 font-medium">
                    <KeyRound className="w-3 h-3" /> Privileged Role
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { r: 'CUSTOMER' as UserRole, title: 'Customer', desc: 'Investor Portal' },
                  { r: 'OPERATIONS' as UserRole, title: 'Operations', desc: 'Batch Execution' },
                  { r: 'COMPLIANCE' as UserRole, title: 'Risk & Compliance', desc: 'Policy & Audit' },
                  { r: 'ADMIN' as UserRole, title: 'Admin', desc: 'System & Schema' }
                ].map(item => {
                  const isSelected = role === item.r;
                  return (
                    <button
                      type="button"
                      key={item.r}
                      onClick={() => {
                        setRole(item.r);
                        setErrorMsg('');
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs truncate">{item.title}</div>
                      <div className="text-[10px] text-slate-500 truncate">{item.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* Administrative Passcode requirement for privileged roles */}
              {role !== 'CUSTOMER' && (
                <div className="mt-3 p-3.5 rounded-xl bg-amber-950/40 border border-amber-900/60 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                    <Info className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Administrative Process Verification Required</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Admin, Operations, and Compliance roles cannot be publicly claimed without verified administrative authorization.
                  </p>
                  <div>
                    <label className="block text-[11px] font-medium text-amber-200 mb-1">
                      Enter Administrative Authorization Key:
                    </label>
                    <input
                      type="password"
                      value={adminCode}
                      onChange={e => setAdminCode(e.target.value)}
                      placeholder="Enter organizational authorization key (For testing: EQUI2026)"
                      className="w-full bg-slate-950 border border-amber-800/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/60 focus:border-cyan-500 transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-500 hover:text-slate-300 absolute right-3 top-2.5 p-0.5"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm Password <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/60 focus:border-cyan-500 transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-slate-500 hover:text-slate-300 absolute right-3 top-2.5 p-0.5"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                {isSubmitting ? (
                  <span>Registering Account in Database...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Create EquiBalance Account</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Already have an account? Login here */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigateToLogin()}
                className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 ml-1"
              >
                <span>Login here</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </p>
          </div>
        </div>

        {/* Footer Disclaimers */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          Encrypted with Scrypt hashing & timing-safe authentication. SEBI compliance sandbox.
        </p>
      </div>
    </div>
  );
};
