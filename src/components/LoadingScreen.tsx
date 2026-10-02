import React from 'react';
import { Bike as BikeIcon, LoaderCircle, ShieldCheck } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4 relative overflow-hidden selection:bg-sky-500 selection:text-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/85 shadow-2xl shadow-slate-950/40 backdrop-blur-xl overflow-hidden">
          <div className="p-8 sm:p-10 text-center border-b border-slate-800/80 bg-gradient-to-b from-slate-900 to-slate-950/80">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-sky-500 via-cyan-400 to-amber-400 p-[2px] shadow-xl shadow-sky-500/20 mb-5">
              <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                <BikeIcon className="w-9 h-9 text-sky-400 transform -rotate-12" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
              <span>WIJESOORIYA</span>
              <span className="text-sky-400">MOTORS</span>
            </h1>

            <p className="text-xs text-slate-400 font-medium mt-2 tracking-[0.18em] uppercase">
              Dealership Operating System
            </p>
          </div>

          <div className="p-8 sm:p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-sky-400/20 bg-sky-500/10 shadow-lg shadow-sky-500/10">
              <LoaderCircle className="h-8 w-8 text-sky-400 animate-spin" />
            </div>

            <p className="mt-6 text-lg font-semibold text-white">Loading dealership dashboard...</p>
            <p className="mt-2 text-sm text-slate-400">Syncing account access and live inventory data</p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure access
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
