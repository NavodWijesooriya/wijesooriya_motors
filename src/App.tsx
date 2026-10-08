/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { DealershipProvider, useDealership } from './context/DealershipContext';
import { Header } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { ToastContainer } from './components/ToastContainer';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { SalesView } from './components/SalesView';
import { MonthlySummaryView } from './components/MonthlySummaryView';
import { SettingsView } from './components/SettingsView';
import { BikeModal } from './components/BikeModal';
import { SaleModal } from './components/SaleModal';
import { BikeDetailModal } from './components/BikeDetailModal';
import { InvoiceModal } from './components/InvoiceModal';
import { LoginScreen } from './components/LoginScreen';
import { BusinessNameSetup } from './components/BusinessNameSetup';
import { LoadingScreen } from './components/LoadingScreen';
import { PWAUpdateNotice } from './components/PWAUpdateNotice';
import { Bike as BikeIcon } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab, isBusinessDataLoading, businessDataError } = useDealership();
  const { profile } = useAuth();

  if (!profile?.businessName.trim()) return <BusinessNameSetup />;
  if (businessDataError) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-950 p-6 text-center text-slate-100">
        <h1 className="text-2xl font-black">Saved data unavailable</h1>
        <p role="alert" className="max-w-lg text-sm text-rose-300">{businessDataError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl bg-sky-500 px-5 py-3 font-bold text-slate-950"
        >
          Retry
        </button>
      </main>
    );
  }
  if (isBusinessDataLoading) return <LoadingScreen />;

  return (
    <div className="app-shell workspace-app min-h-screen print:bg-white print:text-black print:min-h-0">
      
      {/* PWA Banner */}
      <div className="print:hidden">
        <PWAInstallBanner />
      </div>

      {/* Navigation Header */}
      <div className="print:hidden">
        <Header />
      </div>

      {/* Main Content Area (Hidden during printing so only printable documents print) */}
      <main className="workspace-main print:hidden">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'inventory' && <InventoryView />}
        {activeTab === 'sales' && <SalesView />}
        {(activeTab === 'summary' || activeTab === 'calculator') && <MonthlySummaryView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Interactive Modals */}
      <div className="print:hidden">
        <BikeModal isEdit={false} />
        <BikeModal isEdit={true} />
        <SaleModal />
        <BikeDetailModal />
      </div>
      
      {/* Invoice & Formal Letter Document Modal */}
      <InvoiceModal />

      {/* Toast Notifications */}
      <div className="print:hidden">
        <ToastContainer />
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="print:hidden">
        <MobileNav />
      </div>

      {/* Desktop Footer */}
      <footer className="workspace-footer print:hidden">
        <span><BikeIcon aria-hidden="true" /> Sale POS <i>·</i> Vehicle Dealership Management System</span>
        <span>Build for a better tomorrow <BikeIcon aria-hidden="true" /></span>
      </footer>

    </div>
  );
};

const AuthenticatedApp: React.FC = () => {
  const { user, profile, approvalStatus, approvalStatusVerified, authError, authNotice, logout } = useAuth();

  if (!user) {
    return (
      <LoginScreen />
    );
  }

  if (authError) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-950 p-6 text-center text-slate-100">
        <h1 className="text-2xl font-black">Sales POS</h1>
        <p role="alert" className="max-w-lg text-sm text-rose-300">{authError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl bg-sky-500 px-5 py-3 font-bold text-slate-950"
        >
          Retry
        </button>
        <button type="button" onClick={() => void logout()} className="text-sm font-semibold text-slate-400 hover:text-white">
          Sign out
        </button>
      </main>
    );
  }

  if (approvalStatus !== 'approved') {
    const message = !approvalStatusVerified
      ? 'Checking your latest account approval status...'
      : approvalStatus === 'pending'
        ? 'Your registration is pending administrator approval.'
        : approvalStatus === 'rejected'
          ? 'Your registration request was not approved. You cannot access the system.'
          : 'No registration request was found for this account.';

    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-950 p-6 text-center text-slate-100">
        <BikeIcon className="h-10 w-10 text-sky-400" aria-hidden="true" />
        <h1 className="text-2xl font-black">Account approval required</h1>
        <p role="status" className="max-w-md text-sm text-slate-300">{authNotice || message}</p>
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-xl bg-sky-500 px-5 py-3 font-bold text-slate-950"
        >
          Sign out
        </button>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-950 p-6 text-center text-slate-100">
        <p role="alert" className="text-sm text-rose-300">Your approved profile could not be loaded. Please try again.</p>
        <button type="button" onClick={() => void logout()} className="text-sm font-semibold text-slate-400 hover:text-white">
          Sign out
        </button>
      </main>
    );
  }

  return (
    <DealershipProvider>
      <>
        <MainLayout />
        <PWAUpdateNotice />
      </>
    </DealershipProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
