import React, { useState } from 'react';
import { useDealership } from '../context/DealershipContext';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart3,
  Bike,
  Bell,
  ChevronDown,
  ChevronLeft,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  ReceiptText,
  Settings,
  Store,
  User,
  Wifi,
  WifiOff,
  X
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();
  const {
    activeTab,
    setActiveTab,
    setIsAddBikeModalOpen,
    isOnline,
    isPWAInstallable,
    installPWA,
    currentUser,
    logout
  } = useDealership();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const username = currentUser?.displayName || user?.email?.split('@')[0] || 'Account';
  const role = isAdmin ? 'Administrator' : 'Staff';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sales', label: 'Sell Vehicle', icon: ReceiptText },
    { id: 'inventory', label: 'Current Stock', icon: Package },
    { id: 'add', label: 'Add Vehicle', icon: Plus },
    { id: 'sales', label: 'Sales', icon: BarChart3 },
    { id: 'summary', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings }
  ] as const;

  const navigate = (id: typeof navItems[number]['id']) => {
    if (id === 'add') {
      setIsAddBikeModalOpen(true);
    } else {
      setActiveTab(id);
    }
    setIsMobileMenuOpen(false);
  };

  const isItemActive = (id: typeof navItems[number]['id']) => (
    id !== 'add' && activeTab === id
  );

  return (
    <>
      <aside className="workspace-sidebar print:hidden">
        <button
          type="button"
          className="workspace-brand"
          onClick={() => setActiveTab('dashboard')}
          aria-label="Sales POS dashboard"
        >
          <span className="workspace-brand-icon"><Bike aria-hidden="true" /></span>
          <span className="workspace-brand-copy">
            <strong>Sale POS</strong>
            <small>Vehicle Dealership</small>
          </span>
          <ChevronLeft className="workspace-sidebar-collapse" aria-hidden="true" />
        </button>

        <nav className="workspace-side-nav" aria-label="Main navigation">
          {navItems.map(({ id, label, icon: Icon }, index) => {
            const active = isItemActive(id);
            return (
              <button
                key={`${id}-${index}`}
                type="button"
                onClick={() => navigate(id)}
                className={`workspace-nav-link${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          className="workspace-business"
          onClick={() => setActiveTab('settings')}
          aria-label={`Business settings for ${profile?.businessName || 'your business'}`}
        >
          <span className="workspace-business-mark"><Store aria-hidden="true" /></span>
          <span><small>Your Business</small><strong>{profile?.businessName || 'Dealership'}</strong></span>
          <ChevronDown aria-hidden="true" />
        </button>
      </aside>

      <header className="workspace-topbar print:hidden">
        <div className="workspace-topbar-business">
          <Store aria-hidden="true" />
          <span>{profile?.businessName || 'Sale POS'}</span>
          <ChevronDown aria-hidden="true" />
        </div>

        <div className="workspace-topbar-actions">
          <span className={`workspace-connection${isOnline ? '' : ' is-offline'}`} role="status">
            {isOnline ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </span>
          {isPWAInstallable && (
            <button type="button" className="workspace-install" onClick={() => void installPWA()}>
              Install app
            </button>
          )}
          <span className="workspace-topbar-divider" />
          <button
            type="button"
            className="workspace-notifications"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell aria-hidden="true" />
            <span />
          </button>
          <span className="workspace-topbar-divider" />
          <button
            type="button"
            className="workspace-user"
            onClick={() => setActiveTab('settings')}
            aria-label={`Open ${role} account settings`}
          >
            <span className="workspace-avatar">{username.slice(0, 1).toUpperCase()}</span>
            <span className="workspace-user-copy"><strong>{username}</strong><small>{role}</small></span>
            <ChevronDown aria-hidden="true" />
          </button>
          <button
            type="button"
            className="workspace-mobile-menu"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? 'Close account menu' : 'Open account menu'}
          >
            {isMobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="workspace-mobile-dropdown">
            <div className="workspace-mobile-account">
              <span className="workspace-avatar">{username.slice(0, 1).toUpperCase()}</span>
              <span><strong>{username}</strong><small>{role}</small></span>
            </div>
            <button type="button" onClick={() => navigate('settings')}>
              <Settings aria-hidden="true" /> Settings
            </button>
            {isPWAInstallable && (
              <button type="button" onClick={() => { void installPWA(); setIsMobileMenuOpen(false); }}>
                <Store aria-hidden="true" /> Install app
              </button>
            )}
            <button type="button" onClick={() => { setIsMobileMenuOpen(false); void logout().catch(() => undefined); }}>
              <LogOut aria-hidden="true" /> Sign out
            </button>
          </div>
        )}
      </header>
    </>
  );
};
