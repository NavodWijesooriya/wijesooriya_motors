import React, { useState } from 'react';
import { AlertCircle, Building2, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const BusinessNameSetup: React.FC = () => {
  const { saveBusinessName, user } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSaving(true);
    try {
      await saveBusinessName(businessName);
    } catch (error) {
      console.error('Failed to save business profile', error);
      setErrorMessage('Your Business Name could not be saved. Please check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-7 sm:p-9 shadow-2xl space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-400">
            <Building2 className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-black text-white">Sales POS</h1>
          <h2 className="text-lg font-bold text-slate-200">Business Name Setup</h2>
          <p className="text-sm text-slate-400">Signed in as {user?.email}</p>
        </div>

        {errorMessage && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="business-name" className="block text-sm font-semibold text-slate-200">
            Enter your Business Name
          </label>
          <input
            id="business-name"
            type="text"
            required
            autoFocus
            maxLength={120}
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            placeholder="Your business name"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
          />
        </div>

        <button
          type="submit"
          disabled={isSaving || !businessName.trim()}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 font-bold text-slate-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          <span>{isSaving ? 'Saving...' : 'Save and Continue'}</span>
        </button>
      </form>
    </main>
  );
};
