import React, { useState } from 'react';
import { useDealership } from '../context/DealershipContext';
import { Download, X, Smartphone } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isPWAInstallable, installPWA } = useDealership();
  const [dismissed, setDismissed] = useState(false);

  if (!isPWAInstallable || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border-b border-sky-500/30 text-white px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xs sm:text-sm">
            <span className="font-bold text-white flex items-center gap-1.5">
              Install Sales POS
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                PWA Enabled
              </span>
            </span>
            <p className="text-slate-400 text-[11px] sm:text-xs">
              Install on your phone or desktop for instant offline inventory access & rapid sales calculations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={installPWA}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md shadow-sky-500/20 transition-transform active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-slate-950" />
            <span>Install Now</span>
          </button>
          
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
