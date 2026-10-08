import React from 'react';
import {
  ArrowRight,
  BarChart3,
  CarFront,
  FileText,
  Package,
  Plus,
  ReceiptText,
  Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDealership } from '../context/DealershipContext';

export const DashboardView: React.FC = () => {
  const { setActiveTab, setIsAddBikeModalOpen } = useDealership();
  const { profile } = useAuth();

  const shortcuts = [
    {
      label: 'Sell Vehicle',
      description: 'Process a new vehicle sale, manage customer details and generate invoices.',
      action: 'Start Selling',
      icon: ReceiptText,
      tone: 'blue',
      decoration: CarFront,
      onClick: () => setActiveTab('sales')
    },
    {
      label: 'Current Stock',
      description: 'View available vehicles, check stock levels and manage inventory.',
      action: 'View Stock',
      icon: Package,
      tone: 'green',
      decoration: CarFront,
      onClick: () => setActiveTab('inventory')
    },
    {
      label: 'Add Vehicle',
      description: 'Register a new vehicle with complete details and photos.',
      action: 'Add Now',
      icon: Plus,
      tone: 'purple',
      decoration: CarFront,
      onClick: () => setIsAddBikeModalOpen(true)
    },
    {
      label: 'Sales',
      description: 'View and manage all vehicle sales and transactions.',
      action: 'View Sales',
      icon: BarChart3,
      tone: 'orange',
      decoration: ReceiptText,
      onClick: () => setActiveTab('sales')
    },
    {
      label: 'Summary / Reports',
      description: 'Get detailed reports and insights for your business.',
      action: 'View Reports',
      icon: FileText,
      tone: 'blue',
      decoration: BarChart3,
      onClick: () => setActiveTab('summary')
    },
    {
      label: 'Settings',
      description: 'Manage your business details, users and system preferences.',
      action: 'Open Settings',
      icon: Settings,
      tone: 'purple',
      decoration: Settings,
      onClick: () => setActiveTab('settings')
    }
  ] as const;

  return (
    <div className="dashboard-workspace">
      <section className="dashboard-welcome" aria-labelledby="dashboard-greeting">
        <div className="dashboard-welcome-copy">
          <span className="dashboard-greeting-icon"><span aria-hidden="true">✦</span></span>
          <div>
            <p>Welcome back,</p>
            <h1 id="dashboard-greeting">{profile?.businessName || 'Your dealership'}</h1>
          </div>
          <p className="dashboard-welcome-description">
            Manage your vehicles, sales and dealership operations all in one place.
          </p>
        </div>
        <div className="dashboard-vehicle-art" aria-hidden="true">
          <svg viewBox="0 0 660 190" role="presentation">
            <defs>
              <linearGradient id="vehicle-blue" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#45baff" />
                <stop offset=".55" stopColor="#1265c9" />
                <stop offset="1" stopColor="#092754" />
              </linearGradient>
              <linearGradient id="vehicle-glass" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#a8e5ff" stopOpacity=".9" />
                <stop offset="1" stopColor="#15365f" stopOpacity=".35" />
              </linearGradient>
              <linearGradient id="vehicle-road" x1="0" x2="1">
                <stop stopColor="#06316a" stopOpacity="0" />
                <stop offset=".5" stopColor="#137ad9" stopOpacity=".7" />
                <stop offset="1" stopColor="#06316a" stopOpacity="0" />
              </linearGradient>
              <filter id="vehicle-glow" x="-40%" y="-100%" width="180%" height="300%">
                <feGaussianBlur stdDeviation="11" />
              </filter>
            </defs>
            <ellipse cx="350" cy="159" rx="290" ry="17" fill="url(#vehicle-road)" filter="url(#vehicle-glow)" />
            <path d="M109 133h152l-8-25-30-14-28-40h-47l-31 39-20 11z" fill="url(#vehicle-blue)" stroke="#359de8" strokeWidth="2" />
            <path d="m160 61-27 35h83l-16-35z" fill="url(#vehicle-glass)" />
            <path d="M136 101h91M117 122h140" stroke="#8bd8ff" strokeOpacity=".5" strokeWidth="2" />
            <circle cx="145" cy="135" r="18" fill="#050e1b" stroke="#648bad" strokeWidth="4" />
            <circle cx="145" cy="135" r="7" fill="#73cfff" />
            <circle cx="230" cy="135" r="18" fill="#050e1b" stroke="#648bad" strokeWidth="4" />
            <circle cx="230" cy="135" r="7" fill="#73cfff" />
            <path d="M252 133 267 78q5-13 19-17l37-8 34-31q8-8 21-8h82q18 0 27 14l22 39 30 13q12 6 12 20v34h-27a26 26 0 0 0-51 0H333a27 27 0 0 0-53 0z" fill="url(#vehicle-blue)" stroke="#41aaff" strokeWidth="2.5" />
            <path d="m338 52 31-28q5-5 14-5h47q9 0 14 8l18 31z" fill="url(#vehicle-glass)" />
            <path d="M272 83h268M301 104h225" stroke="#83d6ff" strokeOpacity=".4" strokeWidth="2" />
            <path d="M273 115h29m243 0h26" stroke="#d3f5ff" strokeWidth="5" strokeLinecap="round" />
            <circle cx="306" cy="134" r="22" fill="#050e1b" stroke="#7c9ebf" strokeWidth="5" />
            <circle cx="306" cy="134" r="9" fill="#8fd9ff" />
            <circle cx="489" cy="134" r="22" fill="#050e1b" stroke="#7c9ebf" strokeWidth="5" />
            <circle cx="489" cy="134" r="9" fill="#8fd9ff" />
            <path d="M505 124V76q0-9 9-13l24-10 13-34q3-8 13-8h63q11 0 14 9l16 37 20 9q8 4 8 14v44h-20a20 20 0 0 0-40 0h-93a19 19 0 0 0-38 0z" fill="#25496f" stroke="#8ab8e3" strokeWidth="2" />
            <path d="M566 19h58l14 39h-88z" fill="url(#vehicle-glass)" />
            <path d="M518 73h154M522 91h158" stroke="#b7d9f4" strokeOpacity=".45" strokeWidth="2" />
            <circle cx="554" cy="126" r="17" fill="#07111e" stroke="#89a6bf" strokeWidth="4" />
            <circle cx="554" cy="126" r="6" fill="#8bd7ff" />
            <circle cx="650" cy="126" r="17" fill="#07111e" stroke="#89a6bf" strokeWidth="4" />
            <circle cx="650" cy="126" r="6" fill="#8bd7ff" />
          </svg>
        </div>
      </section>

      <section className="dashboard-shortcuts" aria-label="Dashboard shortcuts">
        {shortcuts.map(({ label, description, action, icon: Icon, tone, decoration: Decoration, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className={`dashboard-card tone-${tone}`}
            aria-label={`${label}: ${action}`}
          >
            <span className="dashboard-card-icon"><Icon aria-hidden="true" /></span>
            <Decoration className="dashboard-card-decoration" aria-hidden="true" />
            <span className="dashboard-card-content">
              <strong>{label}</strong>
              <span className="dashboard-card-description">{description}</span>
              <span className="dashboard-card-action">{action}<ArrowRight aria-hidden="true" /></span>
            </span>
          </button>
        ))}
      </section>
    </div>
  );
};
