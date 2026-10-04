import React, { useState } from 'react';
import { auth } from '../../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { 
  Bike as BikeIcon, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  ShieldCheck, 
  AlertCircle
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-4 sm:p-6 relative overflow-hidden selection:bg-sky-500 selection:text-slate-950">
      
      {/* Background Ambience & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden">
        
        {/* Top Brand Banner */}
        <div className="p-6 sm:p-8 text-center border-b border-slate-800/80 bg-gradient-to-b from-slate-900 to-slate-950/70">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 via-cyan-400 to-amber-400 p-[2px] shadow-xl shadow-sky-500/20 mb-4 animate-fadeIn">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <BikeIcon className="w-8 h-8 text-sky-400 transform -rotate-12" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Sales POS</h1>

          <p className="text-xs text-slate-400 font-medium mt-1">
            Motorbike Dealership & Sales Management System
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Authorized Dealership Terminal</span>
          </div>
        </div>

        {/* Login Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {errorMessage && (
            <div 
              role="alert"
              className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Email *
            </label>
            <div className="relative">
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Enter your email"
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 rounded-xl px-4 py-3 min-h-[44px] text-xs sm:text-sm text-white placeholder-slate-600 outline-none transition-all font-medium"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="login-password" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Enter password"
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 rounded-xl pl-10 pr-12 py-3 min-h-[44px] text-xs sm:text-sm text-white placeholder-slate-600 outline-none transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:ring-sky-400"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 min-h-[44px] rounded-xl bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-sky-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogIn className="w-4 h-4 stroke-[3]" aria-hidden="true" />
            )}
            <span>Sign In</span>
          </button>

        </form>

        {/* Card Footer */}
        {/* <div className="p-4 bg-slate-950/80 border-t border-slate-800/60 text-center text-[11px] text-slate-500">
          Sri Lankan Rupees (LKR) • 3% Finance Commission • PWA Offline Ready
        </div> */}
      </div>

      <div className="mt-8 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} Sales POS • All rights reserved
      </div>
    </div>
  );
};
