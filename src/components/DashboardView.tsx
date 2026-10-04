import React from 'react';
import { useDealership } from '../context/DealershipContext';
import { 
  Warehouse, 
  CheckCircle, 
  Coins, 
  Wrench, 
  TrendingUp, 
  Landmark, 
  Percent, 
  ArrowUpRight, 
  DollarSign, 
  Plus, 
  Receipt, 
  ChevronRight, 
  Calendar,
  Calculator,
  Bike as BikeIcon,
  Sparkles,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { calculateFinancialSummary, formatCurrency, formatDate } from '../utils/formatters';
import { MonthlySummarySection } from './MonthlySummarySection';
import { useAuth } from '../../context/AuthContext';

export const DashboardView: React.FC = () => {
  const { isAdmin, profile } = useAuth();
  const { 
    bikes, 
    settings, 
    summary, 
    setActiveTab, 
    setIsAddBikeModalOpen, 
    openSaleModalForBike,
    openInvoiceForSale,
    openDetailModalForBike,
    resetToDefaultData
  } = useDealership();

  const soldBikes = bikes
    .filter((b) => b.status === 'Sold' && b.sale)
    .sort((a, b) => new Date(b.sale!.saleDate).getTime() - new Date(a.sale!.saleDate).getTime());

  const inStockBikes = bikes.filter((b) => b.status === 'In Stock');

  const symbol = settings.currencySymbol;

  const totalCostSold = soldBikes.reduce((sum, b) => sum + (b.sale?.totalCost || 0), 0);
  const totalNetProfit = summary.totalNetProfit;
  const totalRevenue = summary.totalSalesRevenue;

  const userSummaries = Array.from(
    bikes.reduce((users, bike) => {
      const ownerUid = bike.ownerUid || 'unassigned';
      const existing = users.get(ownerUid);
      if (existing) {
        existing.bikes.push(bike);
      } else {
        users.set(ownerUid, {
          ownerUid,
          label: bike.createdByName || bike.createdByEmail || ownerUid,
          bikes: [bike]
        });
      }
      return users;
    }, new Map<string, { ownerUid: string; label: string; bikes: typeof bikes }>()).values()
  ).map((owner) => ({ ...owner, summary: calculateFinancialSummary(owner.bikes) }))
    .sort((a, b) => a.label.localeCompare(b.label));
  
  const costPercent = totalRevenue > 0 ? Math.min(100, Math.round((totalCostSold / totalRevenue) * 100)) : 0;
  const profitPercent = totalRevenue > 0 ? Math.min(100, Math.round((totalNetProfit / totalRevenue) * 100)) : 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      
      {/* Top Welcome / Dealership Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-slate-800 p-4 sm:p-7 shadow-2xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <p className="text-sm font-bold uppercase tracking-wider text-sky-300">Welcome to Sales POS</p>
            <h2 className="text-2xl sm:text-3xl font-black text-white">{profile?.businessName || 'Loading...'}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true"></span>
                Dealership Operations Active (LKR)
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline" aria-hidden="true">•</span>
              <span className="text-slate-300 text-xs">
                Finance Commission: <strong className="text-amber-400">3.0%</strong>
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Vehicle Sales & <span className="bg-gradient-to-r from-sky-400 to-emerald-300 bg-clip-text text-transparent">Profit Command</span>
            </h1>
            
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Manage motorcycle inventory, cost prices, other repair and transport costs, selling prices, and automatic 3% finance commission calculations in Sri Lankan Rupees (LKR).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0 pt-2 md:pt-0">
            <button
              type="button"
              onClick={() => setIsAddBikeModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 flex-1 sm:flex-initial"
              aria-label="Add new vehicle"
            >
              <Plus className="w-4 h-4 stroke-[3]" aria-hidden="true" />
              <span>Add Vehicle</span>
            </button>
            
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className="flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700 font-bold text-xs sm:text-sm transition-all flex-1 sm:flex-initial"
              aria-label="View Monthly Summary"
            >
              <BarChart3 className="w-4 h-4 text-sky-400" aria-hidden="true" />
              <span>Monthly Summary</span>
            </button>
          </div>
        </div>

        {/* Highlight ticker with responsive wrapping */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-slate-950/40 p-2.5 sm:p-3 rounded-xl border border-slate-800/60">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Showroom Inventory Cost</div>
            <div className="text-sm sm:text-base lg:text-lg font-black text-white mt-0.5 font-mono truncate">
              {formatCurrency(summary.totalInventoryCost, symbol)}
            </div>
          </div>
          <div className="bg-slate-950/40 p-2.5 sm:p-3 rounded-xl border border-slate-800/60">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Realized Net Profit</div>
            <div className="text-sm sm:text-base lg:text-lg font-black text-emerald-400 mt-0.5 flex flex-wrap items-center gap-1 font-mono truncate">
              <span>{formatCurrency(summary.totalNetProfit, symbol)}</span>
              {summary.totalSalesRevenue > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  {summary.averageProfitMarginPercent.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
          <div className="bg-slate-950/40 p-2.5 sm:p-3 rounded-xl border border-slate-800/60">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">3% Finance Commissions</div>
            <div className="text-sm sm:text-base lg:text-lg font-black text-amber-400 mt-0.5 font-mono truncate">
              {formatCurrency(summary.totalFinanceCommission, symbol)}
            </div>
          </div>
          <div className="bg-slate-950/40 p-2.5 sm:p-3 rounded-xl border border-slate-800/60">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Dealership Cash Flow</div>
            <div className={`text-sm sm:text-base lg:text-lg font-black mt-0.5 font-mono truncate ${summary.cashFlowBalance >= 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
              {formatCurrency(summary.cashFlowBalance, symbol)}
            </div>
          </div>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        
        {/* Total In Stock */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab('inventory')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveTab('inventory')}
          className="group cursor-pointer rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 focus-visible:border-sky-400 p-4 sm:p-5 transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/10 flex flex-col justify-between h-full"
          aria-label={`View Bikes Inventory: ${summary.totalBikesInStock} in stock`}
        >
          <div className="flex items-center justify-between h-11 shrink-0">
            <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
              <Warehouse className="w-5 h-5" aria-hidden="true" />
            </div>
            <span className="text-xs font-bold text-sky-400 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20">
              <span>View Inventory</span> <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-4 flex-1 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Bikes In Stock</span>
              <div className="flex items-baseline gap-2 mt-1 h-9">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight leading-none">{summary.totalBikesInStock}</span>
                <span className="text-xs text-slate-400 font-medium">units available</span>
              </div>
            </div>
            <div className="mt-auto pt-2.5 border-t border-slate-800/80 text-xs text-slate-400 font-mono min-h-[30px] flex items-center">
              Asset Value: {formatCurrency(summary.totalInventoryCost, symbol)}
            </div>
          </div>
        </div>

        {/* Total Bikes Sold */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab('sales')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveTab('sales')}
          className="group cursor-pointer rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 focus-visible:border-emerald-400 p-4 sm:p-5 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 flex flex-col justify-between h-full"
          aria-label={`View Sales Ledger: ${summary.totalBikesSold} sold`}
        >
          <div className="flex items-center justify-between h-11 shrink-0">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle className="w-5 h-5" aria-hidden="true" />
            </div>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span>Sales Ledger</span> <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-4 flex-1 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Bikes Sold</span>
              <div className="flex items-baseline gap-2 mt-1 h-9">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight leading-none">{summary.totalBikesSold}</span>
                <span className="text-xs text-slate-400 font-medium">completed transactions</span>
              </div>
            </div>
            <div className="mt-auto pt-2.5 border-t border-slate-800/80 text-xs text-slate-400 font-mono min-h-[30px] flex items-center">
              Cash: {summary.cashSalesCount} • Finance: {summary.financeSalesCount}
            </div>
          </div>
        </div>

        {/* Total Cost Prices + Other Expenses */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between h-11 shrink-0">
            <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Coins className="w-5 h-5" aria-hidden="true" />
            </div>
            <span className="text-xs font-bold text-orange-300 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20">
              Other Costs: +{formatCurrency(summary.totalRepairCost, symbol)}
            </span>
          </div>
          <div className="mt-4 flex-1 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Total Purchase & Costs</span>
              <div className="flex items-center mt-1 h-9">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight leading-none truncate">
                  {formatCurrency(summary.totalPurchaseCost + summary.totalRepairCost, symbol)}
                </span>
              </div>
            </div>
            <div className="mt-auto pt-2.5 border-t border-slate-800/80 text-xs text-slate-400 font-mono min-h-[30px] flex items-center">
              Cost Price: {formatCurrency(summary.totalPurchaseCost, symbol)}
            </div>
          </div>
        </div>

        {/* Total Sales & Commission */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between h-11 shrink-0">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-5 h-5" aria-hidden="true" />
            </div>
            <span className="text-xs font-bold text-amber-300 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
              3% Comm: +{formatCurrency(summary.totalFinanceCommission, symbol)}
            </span>
          </div>
          <div className="mt-4 flex-1 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Total Sales Turnover</span>
              <div className="flex items-center mt-1 h-9">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight leading-none truncate">
                  {formatCurrency(summary.totalSalesRevenue, symbol)}
                </span>
              </div>
            </div>
            <div className="mt-auto pt-2.5 border-t border-slate-800/80 text-xs text-slate-400 font-mono min-h-[30px] flex items-center">
              Financed: {formatCurrency(summary.totalFinanceAmount, symbol)}
            </div>
          </div>
        </div>
      </div>

      {isAdmin && (
        <section className="space-y-3" aria-labelledby="admin-user-summary-title">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="admin-user-summary-title" className="text-lg font-black text-white">Inventory Owner: Stock & Sales</h2>
              <p className="text-xs text-slate-400">Totals for records in this business account.</p>
            </div>
            <span className="text-xs font-semibold text-sky-300">{userSummaries.length} record owners</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-slate-950/80 text-[10px] uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-bold">User</th>
                  <th className="px-4 py-3 text-right font-bold">In Stock</th>
                  <th className="px-4 py-3 text-right font-bold">Stock Cost</th>
                  <th className="px-4 py-3 text-right font-bold">Sold</th>
                  <th className="px-4 py-3 text-right font-bold">Total Sales</th>
                  <th className="px-4 py-3 text-right font-bold">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {userSummaries.map(({ ownerUid, label, summary: userSummary }) => (
                  <tr key={ownerUid}>
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">{label}</div>
                      <div className="mt-0.5 font-mono text-[10px] text-slate-500">{ownerUid}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-200">{userSummary.totalBikesInStock}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-200">{formatCurrency(userSummary.totalInventoryCost, symbol)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-200">{userSummary.totalBikesSold}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-200">{formatCurrency(userSummary.totalSalesRevenue, symbol)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">{formatCurrency(userSummary.totalNetProfit, symbol)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-950/70 font-bold">
                  <td className="px-4 py-3 text-white">Overall</td>
                  <td className="px-4 py-3 text-right font-mono text-white">{summary.totalBikesInStock}</td>
                  <td className="px-4 py-3 text-right font-mono text-white">{formatCurrency(summary.totalInventoryCost, symbol)}</td>
                  <td className="px-4 py-3 text-right font-mono text-white">{summary.totalBikesSold}</td>
                  <td className="px-4 py-3 text-right font-mono text-white">{formatCurrency(summary.totalSalesRevenue, symbol)}</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-400">{formatCurrency(summary.totalNetProfit, symbol)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Monthly Summary & Metric Definitions Section (Calculates strictly for selected month & year) */}
      <MonthlySummarySection />

      {/* When Empty: Show Welcome & Action Card */}
      {bikes.length === 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-8 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
            <BikeIcon className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-black text-white">Welcome to Your Dealership Management System</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              Start adding vehicles (cars or bikes) with purchase cost price, repair/transport expenses, and record cash or finance sales in Sri Lankan Rupees.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setIsAddBikeModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Vehicle</span>
            </button>

            <button
              onClick={resetToDefaultData}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-sm border border-slate-700 transition-transform active:scale-95"
            >
              <RefreshCw className="w-4 h-4 text-sky-400" />
              <span>Load Sample Dealership Records</span>
            </button>
          </div>
        </div>
      )}

      {/* In-Stock Showroom Preview & Recent Sales Table */}
      {bikes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* In-Stock Units */}
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-sky-400" />
                  Showroom Vehicles in Stock ({inStockBikes.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Ready for sale with cost price & profit targets</p>
              </div>

              <button
                onClick={() => setActiveTab('inventory')}
                className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                <span>All Inventory</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {inStockBikes.length > 0 ? (
              <div className="space-y-3">
                {inStockBikes.slice(0, 4).map((bike) => {
                  const targetProfit = bike.targetSalePrice - bike.totalCost;
                  const profitMargin = bike.targetSalePrice > 0 ? (targetProfit / bike.targetSalePrice) * 100 : 0;

                  return (
                    <div
                      key={bike.id}
                      className="p-3 sm:p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={bike.imageUrl || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80'}
                          alt={`${bike.year} ${bike.make} ${bike.model}`}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-lg object-cover border border-slate-800 shrink-0"
                        />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => openDetailModalForBike(bike)}
                            className="font-bold text-white text-xs sm:text-sm hover:text-sky-400 cursor-pointer text-left truncate block max-w-full focus-visible:outline-none focus-visible:text-sky-400"
                          >
                            {bike.year} {bike.make} {bike.model}
                          </button>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            Cost: <strong className="text-slate-200">{formatCurrency(bike.totalCost, symbol)}</strong> • Plate: {bike.regPlate}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-900">
                        <div className="text-left sm:text-right">
                          <div className="text-xs sm:text-sm font-black text-sky-400 font-mono">
                            {formatCurrency(bike.targetSalePrice, symbol)}
                          </div>
                          <div className="text-[11px] text-emerald-400 font-bold font-mono">
                            Est. Profit: +{formatCurrency(targetProfit, symbol)} ({profitMargin.toFixed(0)}%)
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => openSaleModalForBike(bike)}
                          className="px-4 py-2.5 min-h-[44px] min-w-[72px] flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95"
                          aria-label={`Sell ${bike.make} ${bike.model}`}
                        >
                          Sell
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                All vehicles have been sold! Click &quot;Add Vehicle&quot; to replenish stock.
              </div>
            )}
          </div>

          {/* Recent Sales History */}
          <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  Recent Sales & Net Profit
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Realized net returns on closed sales</p>
              </div>

              <button
                onClick={() => setActiveTab('sales')}
                className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {soldBikes.length > 0 ? (
              <div className="space-y-3">
                {soldBikes.slice(0, 4).map((bike) => {
                  const sale = bike.sale!;
                  const isFinance = sale.saleMethod === 'Finance';

                  return (
                    <div
                      key={sale.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white truncate">{sale.bikeSummary}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className={`px-1.5 py-0.2 rounded font-bold ${
                            isFinance ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {sale.saleMethod}
                          </span>
                          <span>{sale.customerName}</span>
                          <span>•</span>
                          <span>{formatDate(sale.saleDate)}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-bold text-white font-mono">
                          {formatCurrency(sale.saleAmount, symbol)}
                        </div>
                        <div className="font-black text-emerald-400 font-mono text-[11px]">
                          +{formatCurrency(sale.netProfit, symbol)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                No completed sales yet. When you sell a vehicle, profits will appear here.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
