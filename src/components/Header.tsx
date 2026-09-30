import React, { useState } from 'react';
import { useDealership } from '../context/DealershipContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Bike as BikeIcon, 
  LayoutDashboard, 
  Warehouse, 
  ReceiptText, 
  BarChart3, 
  PlusCircle, 
  Settings, 
  Download, 
  Wifi, 
  WifiOff,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user } = useAuth();
  const { 
    settings, 
    activeTab, 
    setActiveTab, 
    setIsAddBikeModalOpen, 
    isOnline, 
    isPWAInstallable, 
    installPWA,
    summary,
    currentUser,
    logout
  } = useDealership();
  const username = currentUser?.username || user?.email;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Bikes Inventory', icon: Warehouse, count: summary.totalBikesInStock },
    { id: 'sales', label: 'Sales & Commissions', icon: ReceiptText, count: summary.totalBikesSold },
    { id: 'summary', label: 'Summary', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          
          {/* Logo & Dealership Identity */}
          <button 
            type="button"
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer shrink-0 text-left focus-visible:ring-2 focus-visible:ring-sky-400 rounded-xl p-1"
            onClick={() => setActiveTab('dashboard')}
            aria-label="Wijesooriya Motors Dashboard Home"
          >
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-sky-600 via-cyan-500 to-amber-400 p-[2px] shadow-lg shadow-sky-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <BikeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400 transform -rotate-12 transition-transform hover:scale-110" aria-hidden="true" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base sm:text-xl tracking-tight text-white flex items-center truncate">
                  WIJESOORIYA<span className="text-sky-400 ml-1">MOTORS</span>
                </span>
                <span className="hidden lg:inline-flex items-center text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Dealership OS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-[200px] md:max-w-none">
                {settings.dealershipName} • Colombo, Sri Lanka
              </p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 min-h-[40px] ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.count !== undefined && (
                    <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold tabular-nums ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Actions & Utilities */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {isPWAInstallable && (
              <button
                onClick={installPWA}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-xs font-bold transition-all shadow-sm"
                title="Install Wijesooriya Motors App to Home Screen"
                aria-label="Install app to home screen"
              >
                <Download className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <span>Install</span>
              </button>
            )}

            <div 
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border min-h-[36px] ${
                isOnline 
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30 animate-pulse'
              }`}
              title={isOnline ? 'Online - Local storage synced' : 'Offline Mode active'}
              role="status"
              aria-label={isOnline ? 'Online status: Connected' : 'Offline status: Offline mode'}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" /> : <WifiOff className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />}
              <span className="hidden xl:inline">{isOnline ? 'Ready' : 'Offline'}</span>
            </div>

            {/* Quick Add Vehicle CTA */}
            <button
              onClick={() => setIsAddBikeModalOpen(true)}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              aria-label="Add new motorbike to inventory"
            >
              <PlusCircle className="w-4 h-4 text-slate-950 shrink-0" aria-hidden="true" />
              <span>Add Bike</span>
            </button>

            {/* Desktop Settings & User Lockup */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => setActiveTab('settings')}
                className={`p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Dealership Settings & Data Backup"
                aria-label="Open Dealership Settings"
              >
                <Settings className="w-4 h-4" aria-hidden="true" />
              </button>

              {username && (
                <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-800">
                  <div 
                    onClick={() => setActiveTab('settings')}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 min-h-[44px] rounded-xl bg-slate-900 border border-slate-800 text-xs hover:border-slate-700 cursor-pointer"
                    title={`Logged in as ${username}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setActiveTab('settings')}
                    aria-label={`User profile: ${username}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs" aria-hidden="true">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-white font-mono text-xs">{username}</span>
                  </div>

                  <button
                    onClick={logout}
                    className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition-colors"
                    title="Log out of terminal"
                    aria-label="Log out of dealership terminal"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle Button (Touch size >= 44x44px) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-dealership-menu"
              aria-label={isMobileMenuOpen ? 'Close dealership menu' : 'Open dealership menu'}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-sky-400" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5 text-slate-200" aria-hidden="true" />
              )}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Drawer for Settings, Profile & Extra Tools */}
        {isMobileMenuOpen && (
          <div 
            id="mobile-dealership-menu"
            className="md:hidden py-3 px-2 border-t border-slate-800 bg-slate-950/98 rounded-b-2xl shadow-2xl space-y-2 animate-fadeIn"
          >
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                  <User className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white font-mono">{username}</div>
                  <div className="text-[10px] text-slate-400">Authorized Terminal Staff</div>
                </div>
              </div>

              <div 
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                  isOnline 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                {isOnline ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-rose-400" />}
                <span>{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  setActiveTab('settings');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center justify-center gap-2 p-3 min-h-[44px] rounded-xl text-xs font-bold border transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    : 'bg-slate-900 text-slate-200 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Settings className="w-4 h-4 text-sky-400" aria-hidden="true" />
                <span>Settings & DB</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="flex items-center justify-center gap-2 p-3 min-h-[44px] rounded-xl bg-slate-900 text-rose-300 hover:bg-rose-500/20 border border-slate-800 text-xs font-bold transition-colors"
              >
                <LogOut className="w-4 h-4 text-rose-400" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </div>

            {isPWAInstallable && (
              <button
                onClick={() => {
                  installPWA();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 p-3 min-h-[44px] rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold"
              >
                <Download className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <span>Install Dealership App to Phone</span>
              </button>
            )}
          </div>
        )}

      </div>
    </header>
  );
};
