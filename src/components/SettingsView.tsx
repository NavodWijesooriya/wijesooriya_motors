import React, { useState, useRef } from 'react';
import { useDealership } from '../context/DealershipContext';
import { 
  Settings as SettingsIcon, 
  Building, 
  DollarSign, 
  Download, 
  Upload, 
  RotateCcw, 
  Moon, 
  Sun, 
  Check,
  Trash2,
  Lock,
  User,
  ShieldCheck,
  KeyRound,
  LogOut,
  AlertCircle
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    resetToDefaultData, 
    clearAllData,
    exportDataToJson, 
    importDataFromJson,
    currentUser,
    logout,
    changeCredentials,
    resetCredentialsToDefault
  } = useDealership();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dealership info state
  const [dealershipName, setDealershipName] = useState(settings.dealershipName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [taxNumber, setTaxNumber] = useState(settings.taxNumber || '');
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);
  const [theme, setTheme] = useState<'dark' | 'light'>(settings.theme);

  // Security & Credentials State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState(currentUser?.username || 'admin');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Confirmation Modal for Clear All Data
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      dealershipName,
      tagline,
      address,
      phone,
      email,
      taxNumber,
      currencySymbol,
      theme
    });
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (newPassword !== confirmPassword) {
      setAuthError('New password and confirmation do not match.');
      return;
    }

    if (!newPassword.trim()) {
      setAuthError('Password cannot be empty.');
      return;
    }

    const res = changeCredentials(currentPassword, newUsername, newPassword);
    if (!res.success) {
      setAuthError(res.message || 'Failed to update credentials.');
    } else {
      setAuthSuccess('Username & password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importDataFromJson(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const currencyOptions = [
    { label: 'Rs. (LKR)', symbol: 'Rs.' },
    { label: 'LKR', symbol: 'LKR' },
    { label: '$ (USD)', symbol: '$' },
    { label: '₹ (INR)', symbol: '₹' },
    { label: '£ (GBP)', symbol: '£' },
    { label: '€ (EUR)', symbol: '€' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-7 h-7 text-sky-400" />
          Dealership Profile & <span className="text-sky-400">Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Customize your dealership branding (Wijesooriya Motors), staff authentication credentials, currency options, and manage database backups.
        </p>
      </div>

      {/* Section 1: Authentication & Staff Credentials */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Staff Authentication & Security
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Protect your dealership terminal with custom username and password.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-950 text-slate-300 border border-slate-800">
              User: <strong className="text-white">{currentUser?.username}</strong>
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {authError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {authSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{authSuccess}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Current Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Login Username *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. admin or wijesooriya"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white outline-none focus:border-sky-500 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                New Password *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={resetCredentialsToDefault}
              className="text-xs text-slate-400 hover:text-slate-200 underline py-2 min-h-[44px] flex items-center"
            >
              Reset credentials to default (admin / admin)
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white font-bold text-xs transition-colors border border-slate-700 flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Update Login Credentials</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Dealership Information */}
      <form onSubmit={handleSaveSettings} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 shadow-xl">
        <div className="space-y-4">
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-sky-400" aria-hidden="true" />
            Dealership Information (Printed on Bills of Sale)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dealership-name" className="block text-xs font-semibold text-slate-300 mb-1">
                Dealership Commercial Name *
              </label>
              <input
                id="dealership-name"
                type="text"
                required
                value={dealershipName}
                onChange={(e) => setDealershipName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm text-white outline-none focus:border-sky-500 font-bold focus-visible:ring-2 focus-visible:ring-sky-400"
              />
            </div>

            <div>
              <label htmlFor="tagline" className="block text-xs font-semibold text-slate-300 mb-1">
                Tagline / Business Motto
              </label>
              <input
                id="tagline"
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm text-white outline-none focus:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-400"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-xs font-semibold text-slate-300 mb-1">
                Physical Address
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm text-white outline-none focus:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-400"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                id="phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm text-white outline-none focus:border-sky-500 font-mono focus-visible:ring-2 focus-visible:ring-sky-400"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-1">
                Sales Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm text-white outline-none focus:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-400"
              />
            </div>

            <div>
              <label htmlFor="tax-number" className="block text-xs font-semibold text-slate-300 mb-1">
                Business Registration / Tax ID
              </label>
              <input
                id="tax-number"
                type="text"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                placeholder="e.g. LK-BR-902148"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm text-white outline-none focus:border-sky-500 font-mono focus-visible:ring-2 focus-visible:ring-sky-400"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Currency & Commission */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            Currency & Commission Rules
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Active Currency Symbol</label>
              <div className="grid grid-cols-3 gap-2">
                {currencyOptions.map((opt) => (
                  <button
                    key={opt.symbol}
                    type="button"
                    onClick={() => setCurrencySymbol(opt.symbol)}
                    className={`py-2.5 px-2 min-h-[44px] rounded-xl border text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-sky-400 ${
                      currencySymbol === opt.symbol
                        ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md font-black'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Finance Commission Formula</label>
              <div className="p-3 min-h-[44px] rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                <span>Dealer Finance Commission:</span>
                <span className="font-black text-amber-400 px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/30">
                  3.0% of Financed Amount
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Theme */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <label className="block text-xs font-semibold text-slate-300">Theme Appearance</label>
          <div className="flex flex-col sm:flex-row gap-3 max-w-sm">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex-1 p-3 min-h-[44px] rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-sky-400 ${
                theme === 'dark'
                  ? 'bg-sky-500/20 border-sky-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <Moon className="w-4 h-4 text-sky-400" aria-hidden="true" />
              <span>Dark Mode</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex-1 p-3 min-h-[44px] rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-amber-400 ${
                theme === 'light'
                  ? 'bg-sky-500/20 border-sky-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <span>Light Mode</span>
            </button>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 min-h-[44px] rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-sky-500/20 transition-transform active:scale-95 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />
            <span>Save Dealership Settings</span>
          </button>
        </div>
      </form>

      {/* Section 5: Database & Local Storage Management */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
        <h2 className="text-sm font-black text-white uppercase tracking-wider">
          Database & PWA Local Storage Management
        </h2>
        <p className="text-xs text-slate-400">
          Your inventory and sales data for Wijesooriya Motors are preserved in local storage with PWA offline resilience. You can export complete JSON backups or restore previous data anytime.
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-2">
          <button
            type="button"
            onClick={exportDataToJson}
            className="flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors border border-slate-700 focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <Download className="w-4 h-4 text-sky-400" aria-hidden="true" />
            <span>Export JSON Database Backup</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors border border-slate-700 focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <Upload className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <span>Restore Backup from JSON</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs font-semibold transition-colors border border-slate-800 focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>

      {/* Accessible In-App Clear Data Confirmation Dialog */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-dialog-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                <Trash2 className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h3 id="clear-dialog-title" className="text-base font-black text-white">
                  Clear All Data?
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  This will erase all motorbike inventory and sales records from local storage.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              We recommend clicking <strong>Export JSON Database Backup</strong> first if you wish to retain a backup copy.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllData();
                  setShowClearConfirm(false);
                }}
                className="px-5 py-2.5 min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 transition-all active:scale-95"
              >
                Yes, Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
