import React from 'react';
import { useDealership } from '../context/DealershipContext';
import { 
  LayoutDashboard, 
  Warehouse, 
  ReceiptText, 
  PlusCircle, 
  BarChart3 
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab, setIsAddBikeModalOpen, summary } = useDealership();

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 px-2 py-1.5 pb-safe shadow-2xl"
      aria-label="Mobile Navigation"
      role="navigation"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] px-2 py-1 rounded-xl transition-all ${
            activeTab === 'dashboard' ? 'text-sky-400 font-bold' : 'text-slate-300 hover:text-white'
          }`}
          aria-current={activeTab === 'dashboard' ? 'page' : undefined}
          aria-label="Overview Dashboard"
        >
          <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'stroke-[2.5]' : ''}`} aria-hidden="true" />
          <span className="text-[11px] tracking-tight mt-0.5">Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] px-2 py-1 rounded-xl relative transition-all ${
            activeTab === 'inventory' ? 'text-sky-400 font-bold' : 'text-slate-300 hover:text-white'
          }`}
          aria-current={activeTab === 'inventory' ? 'page' : undefined}
          aria-label={`Bikes Inventory (${summary.totalBikesInStock} in stock)`}
        >
          <Warehouse className={`w-5 h-5 ${activeTab === 'inventory' ? 'stroke-[2.5]' : ''}`} aria-hidden="true" />
          <span className="text-[11px] tracking-tight mt-0.5">Bikes</span>
          {summary.totalBikesInStock > 0 && (
            <span className="absolute top-1 right-2 min-w-[16px] h-4 px-1 bg-sky-500 text-slate-950 rounded-full text-[9px] font-black flex items-center justify-center tabular-nums shadow-sm">
              {summary.totalBikesInStock}
            </span>
          )}
        </button>

        {/* Center Primary Action CTA: Add Bike */}
        <button
          type="button"
          onClick={() => setIsAddBikeModalOpen(true)}
          className="flex flex-col items-center justify-center -mt-6 min-h-[48px] px-2 focus-visible:outline-none"
          aria-label="Add new vehicle to inventory"
        >
          <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-sky-400 flex items-center justify-center shadow-xl shadow-emerald-500/35 active:scale-95 transition-transform border-4 border-slate-950">
            <PlusCircle className="w-7 h-7 text-slate-950 stroke-[2.75]" aria-hidden="true" />
          </div>
          <span className="text-[11px] font-black text-emerald-400 mt-0.5">Add</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sales')}
          className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] px-2 py-1 rounded-xl relative transition-all ${
            activeTab === 'sales' ? 'text-sky-400 font-bold' : 'text-slate-300 hover:text-white'
          }`}
          aria-current={activeTab === 'sales' ? 'page' : undefined}
          aria-label={`Sales & Commissions (${summary.totalBikesSold} sold)`}
        >
          <ReceiptText className={`w-5 h-5 ${activeTab === 'sales' ? 'stroke-[2.5]' : ''}`} aria-hidden="true" />
          <span className="text-[11px] tracking-tight mt-0.5">Sales</span>
          {summary.totalBikesSold > 0 && (
            <span className="absolute top-1 right-2 min-w-[16px] h-4 px-1 bg-emerald-500 text-slate-950 rounded-full text-[9px] font-black flex items-center justify-center tabular-nums shadow-sm">
              {summary.totalBikesSold}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] px-2 py-1 rounded-xl transition-all ${
            activeTab === 'summary' || activeTab === 'calculator' ? 'text-sky-400 font-bold' : 'text-slate-300 hover:text-white'
          }`}
          aria-current={activeTab === 'summary' || activeTab === 'calculator' ? 'page' : undefined}
          aria-label="Monthly Financial Summary"
        >
          <BarChart3 className={`w-5 h-5 ${activeTab === 'summary' || activeTab === 'calculator' ? 'stroke-[2.5]' : ''}`} aria-hidden="true" />
          <span className="text-[11px] tracking-tight mt-0.5">Summary</span>
        </button>
      </div>
    </nav>
  );
};
