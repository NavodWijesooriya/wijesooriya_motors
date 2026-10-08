/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  BarChart3,
  Bike,
  LayoutDashboard,
  Plus,
  ReceiptText,
  Warehouse
} from 'lucide-react';
import { useDealership } from '../context/DealershipContext';

export const DashboardView: React.FC = () => {
  const { setActiveTab, setIsAddBikeModalOpen } = useDealership();

  const shortcuts = [
    {
      label: 'Sell',
      description: 'Record a vehicle sale',
      icon: ReceiptText,
      iconStyle: 'bg-sky-50 text-sky-600',
      onClick: () => setActiveTab('sales')
    },
    {
      label: 'Current Stock',
      description: 'Browse vehicles in stock',
      icon: Warehouse,
      iconStyle: 'bg-sky-50 text-sky-600',
      onClick: () => setActiveTab('inventory')
    },
    {
      label: 'Add Vehicle',
      description: 'Add a vehicle to inventory',
      icon: Plus,
      iconStyle: 'bg-sky-50 text-sky-600',
      onClick: () => setIsAddBikeModalOpen(true)
    },
    {
      label: 'Overview',
      description: 'Return to your dashboard',
      icon: LayoutDashboard,
      iconStyle: 'bg-violet-50 text-violet-600',
      onClick: () => setActiveTab('dashboard')
    },
    {
      label: 'Reports',
      description: 'Review business summaries',
      icon: BarChart3,
      iconStyle: 'bg-rose-50 text-rose-600',
      onClick: () => setActiveTab('summary')
    }
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-7 py-2 sm:space-y-9 sm:py-6">
      <section className="relative isolate overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-br from-white via-sky-50/80 to-blue-50/70 p-6 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/[0.04] sm:p-9">
        <div className="pointer-events-none absolute -right-12 -top-24 -z-10 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 right-1/4 -z-10 h-56 w-56 rounded-full bg-indigo-200/20 blur-3xl" />
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-[0_8px_22px_-8px_rgba(2,132,199,0.45)] ring-1 ring-sky-100 sm:h-16 sm:w-16">
            <Bike className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700 sm:text-sm">Dealership workspace</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Dashboard</h1>
          </div>
        </div>
        <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          Choose an action to manage your vehicles and dealership.
        </p>
      </section>

      <section aria-label="Dashboard shortcuts" className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
        {shortcuts.map(({ label, description, icon: Icon, iconStyle, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className="group relative flex aspect-square flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-white/90 bg-white/95 p-4 text-center shadow-[0_8px_24px_-12px_rgba(15,23,42,0.24)] ring-1 ring-slate-900/[0.045] transition duration-300 hover:-translate-y-1.5 hover:border-sky-200 hover:shadow-[0_22px_38px_-16px_rgba(15,23,42,0.28)] hover:ring-sky-200/80 focus-visible:outline-sky-600"
            aria-label={label}
          >
            <span className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_18px_-10px_rgba(15,23,42,0.28)] transition duration-300 group-hover:-translate-y-1 group-hover:scale-105 sm:h-20 sm:w-20 ${iconStyle}`}>
              <Icon className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-bold tracking-tight text-slate-900 sm:text-base">{label}</span>
              <span className="mt-1 hidden text-xs leading-5 text-slate-500 sm:block">{description}</span>
            </span>
            <span className="pointer-events-none absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-sky-200/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </button>
        ))}
      </section>
    </div>
  );
};
