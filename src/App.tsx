/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
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
import { Bike as BikeIcon } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab, settings, summary, isAuthenticated } = useDealership();

  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-sky-500 selection:text-slate-950 transition-colors print:bg-white print:text-black print:min-h-0">
      
      {/* PWA Banner */}
      <div className="print:hidden">
        <PWAInstallBanner />
      </div>

      {/* Navigation Header */}
      <div className="print:hidden">
        <Header />
      </div>

      {/* Main Content Area (Hidden during printing so only printable documents print) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-12 print:hidden">
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
      <footer className="hidden md:block border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-300 flex items-center gap-1">
              <BikeIcon className="w-4 h-4 text-sky-400" />
              WIJESOORIYA<span className="text-sky-400">MOTORS</span>
            </span>
            <span>•</span>
            <span>{settings.dealershipName} Dealership Management Operating System</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Showroom: {summary.totalBikesInStock} in stock</span>
            <span>•</span>
            <span>Closed Deals: {summary.totalBikesSold}</span>
            <span>•</span>
            <span>3% Finance Commission Active</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DealershipProvider>
        <MainLayout />
      </DealershipProvider>
    </AuthProvider>
  );
}
