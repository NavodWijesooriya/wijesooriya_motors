import React, { useState, useMemo } from 'react';
import { useDealership } from '../context/DealershipContext';
import { MonthlySummary, Bike } from '../types';
import { 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Coins, 
  Wrench, 
  CheckCircle, 
  CreditCard, 
  ChevronLeft, 
  ChevronRight, 
  BarChart3, 
  Table as TableIcon, 
  ShieldCheck, 
  ArrowUpRight, 
  Layers, 
  Receipt,
  FileText,
  Printer,
  Calculator,
  Percent,
  Clock,
  Car,
  Bike as BikeIcon,
  Archive,
  ArrowRight
} from 'lucide-react';
import { 
  formatCurrency, 
  formatDate, 
  calculateMonthlySummary, 
  generateMonthByMonthComparison,
  computeSaleFinancials
} from '../utils/formatters';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MonthlySummaryView: React.FC = () => {
  const { bikes, settings, openInvoiceForSale } = useDealership();
  const symbol = settings.currencySymbol;

  // Active sub-tab: 'summary' (Monthly Financial Summary) or 'simulator' (3% Finance Simulator)
  const [subTab, setSubTab] = useState<'summary' | 'simulator'>('summary');

  // Month & Year state
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1); // 1-12
  const [historyViewMode, setHistoryViewMode] = useState<'table' | 'cards'>('table');

  // 3% Finance Simulator State
  const [simStockBikeId, setSimStockBikeId] = useState<string>('');
  const [simPurchasePrice, setSimPurchasePrice] = useState<number>(750000);
  const [simRepairCost, setSimRepairCost] = useState<number>(45000);
  const [simSaleAmount, setSimSaleAmount] = useState<number>(950000);
  const [simFinanceAmount, setSimFinanceAmount] = useState<number>(750000);

  // Month-by-month comparative data across all recorded months (retained permanently)
  const monthlyComparisons = useMemo(() => {
    return generateMonthByMonthComparison(bikes, 24);
  }, [bikes]);

  // Extract all available years across historical data + current year
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([now.getFullYear(), now.getFullYear() - 1, 2026]);
    bikes.forEach((b) => {
      if (b.sale?.saleDate) {
        const y = new Date(b.sale.saleDate).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [bikes, now]);

  // Calculate the 9 exact metrics for the selected month
  const currentMonthSummary: MonthlySummary = useMemo(() => {
    return calculateMonthlySummary(bikes, selectedYear, selectedMonth);
  }, [bikes, selectedYear, selectedMonth]);

  // Retrieve vehicles sold strictly within the selected month and year
  const soldVehiclesInMonth = useMemo(() => {
    return bikes.filter((b) => {
      if (b.status !== 'Sold' || !b.sale) return false;
      const saleDate = new Date(b.sale.saleDate);
      return (
        saleDate.getFullYear() === selectedYear &&
        saleDate.getMonth() + 1 === selectedMonth
      );
    }).sort((a, b) => new Date(b.sale!.saleDate).getTime() - new Date(a.sale!.saleDate).getTime());
  }, [bikes, selectedYear, selectedMonth]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleJumpToCurrentMonth = () => {
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth() + 1);
  };

  const isCurrentCalendarMonth = 
    selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;

  // Simulator calculation
  const simFinanceResult = computeSaleFinancials({
    saleMethod: 'Finance',
    saleAmount: simSaleAmount,
    purchasePrice: simPurchasePrice,
    totalRepairCost: simRepairCost,
    financeAmount: simFinanceAmount,
    financeCommissionRate: 0.03
  });

  const simCashResult = computeSaleFinancials({
    saleMethod: 'Cash',
    saleAmount: simSaleAmount,
    purchasePrice: simPurchasePrice,
    totalRepairCost: simRepairCost
  });

  const handleSelectSimStockBike = (bikeId: string) => {
    setSimStockBikeId(bikeId);
    if (!bikeId) return;
    const bike = bikes.find(b => b.id === bikeId);
    if (bike) {
      setSimPurchasePrice(bike.purchasePrice);
      const otherSum = bike.repairCosts.reduce((s, r) => s + (Number(r.cost) || 0), 0);
      setSimRepairCost(otherSum);
      setSimSaleAmount(bike.targetSalePrice);
      setSimFinanceAmount(Math.round(bike.targetSalePrice * 0.8));
    }
  };

  // Cumulative historical totals across all recorded comparison months
  const cumulativeHistoryTotals = useMemo(() => {
    return monthlyComparisons.reduce(
      (acc, m) => {
        acc.totalVehiclesSold += m.totalVehiclesSold;
        acc.totalSalesRevenue += m.totalSalesRevenue;
        acc.totalVehicleCost += m.totalVehicleCost;
        acc.totalExpenses += m.totalExpenses;
        acc.grossProfit += m.grossProfit;
        acc.netProfit += m.netProfit;
        acc.cashSales += m.cashSales;
        acc.financeSales += m.financeSales;
        acc.totalDownPayments += m.totalDownPayments;
        acc.totalFinanceAmount += m.totalFinanceAmount;
        return acc;
      },
      {
        totalVehiclesSold: 0,
        totalSalesRevenue: 0,
        totalVehicleCost: 0,
        totalExpenses: 0,
        grossProfit: 0,
        netProfit: 0,
        cashSales: 0,
        financeSales: 0,
        totalDownPayments: 0,
        totalFinanceAmount: 0
      }
    );
  }, [monthlyComparisons]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn max-w-7xl mx-auto">
      
      {/* Top Section Header & Sub-Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-sky-500/20 to-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1.5 shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              Monthly Financial Operating Ledger
            </span>

            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/20 flex items-center gap-1">
              <Archive className="w-3 h-3 text-sky-400" />
              Historical Records Retained
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            Monthly Financial <span className="bg-gradient-to-r from-sky-400 to-sky-300 bg-clip-text text-transparent">Summary & Reports</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Select and analyze performance for each month separately. Previous monthly sales and profits are permanently retained and automatically calculated.
          </p>
        </div>

        {/* View Switcher: Summary Report vs 3% Finance Simulator */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setSubTab('summary')}
            className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-sky-400 ${
              subTab === 'summary'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" aria-hidden="true" />
            <span>Monthly Summary</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('simulator')}
            className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-sky-400 ${
              subTab === 'simulator'
                ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-lg shadow-sky-500/25 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calculator className="w-4 h-4 text-sky-400" aria-hidden="true" />
            <span>3% Finance Sim</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: MONTHLY FINANCIAL SUMMARY (Primary View)                          */}
      {/* ========================================================================= */}
      {subTab === 'summary' && (
        <div className="space-y-6">

          {/* Month & Year Interactive Selector Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  Active Reporting Period:
                </span>
                <div className="text-2xl sm:text-3xl font-black text-white mt-0.5 tracking-tight flex items-center gap-3">
                  <span>{currentMonthSummary.monthLabel}</span>
                  {!isCurrentCalendarMonth && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      Previous Month Record
                    </span>
                  )}
                </div>
              </div>

              {/* Selector Controls */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-slate-950 p-2 sm:p-2.5 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-sky-400"
                  title="Previous Month"
                  aria-label="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </button>

                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  aria-label="Select month"
                  className="bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-xl px-3 py-2 min-h-[44px] border border-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  aria-label="Select year"
                  className="bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-xl px-3 py-2 min-h-[44px] border border-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer font-mono"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-sky-400"
                  title="Next Month"
                  aria-label="Next Month"
                >
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>

                {!isCurrentCalendarMonth && (
                  <button
                    type="button"
                    onClick={handleJumpToCurrentMonth}
                    className="px-3.5 py-2 min-h-[44px] rounded-xl bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/30 text-xs font-bold transition-colors flex items-center justify-center"
                    aria-label="Jump to current calendar month"
                  >
                    Current Month
                  </button>
                )}
              </div>
            </div>

            {/* Quick Month Selector Buttons */}
            {monthlyComparisons.length > 0 && (
              <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  Select Month:
                </span>
                <div className="flex items-center gap-1.5 flex-nowrap" role="group" aria-label="Quick month selector">
                  {monthlyComparisons.map((m) => {
                    const isSelected = m.year === selectedYear && m.month === selectedMonth;
                    return (
                      <button
                        key={m.monthKey}
                        type="button"
                        onClick={() => {
                          setSelectedYear(m.year);
                          setSelectedMonth(m.month);
                        }}
                        className={`px-3.5 py-2 min-h-[38px] rounded-xl font-bold text-xs shrink-0 transition-all border ${
                          isSelected
                            ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md font-black'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                        aria-pressed={isSelected}
                      >
                        {m.shortMonthLabel}
                        {m.totalVehiclesSold > 0 && (
                          <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] tabular-nums ${
                            isSelected ? 'bg-slate-950 text-sky-300' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {m.totalVehiclesSold}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* THE 9 CORE METRICS FOR THE SELECTED MONTH                              */}
          {/* 1. Total vehicles sold                                               */}
          {/* 2. Total sales revenue                                               */}
          {/* 3. Total vehicle costs                                               */}
          {/* 4. Total expenses                                                    */}
          {/* 5. Total profit (Gross & Net)                                         */}
          {/* 6. Total cash sales                                                  */}
          {/* 7. Total finance sales                                               */}
          {/* 8. Total down payments                                               */}
          {/* 9. Total finance amounts                                             */}
          {/* ===================================================================== */}
          <div className="space-y-4">
            
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                <span>{currentMonthSummary.monthLabel} Financial Summary (9 Key Metrics)</span>
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                {currentMonthSummary.totalVehiclesSold} closed transactions
              </span>
            </div>

            {/* Row 1: Volume, Revenue, Costs, and Expenses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Metric 1: Total Vehicles Sold */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between h-full">
                <div className="flex items-center justify-between gap-2 h-8 shrink-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">Total Vehicles Sold</span>
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20">
                    <CheckCircle className="w-4 h-4" aria-hidden="true" />
                  </div>
                </div>
                <div className="my-3 flex items-baseline gap-2 h-9 shrink-0">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight leading-none">
                    {currentMonthSummary.totalVehiclesSold}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">units sold</span>
                </div>
                <div className="mt-auto pt-3 border-t border-slate-800/80 min-h-[46px] flex items-center shrink-0">
                  <div className="w-full flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1.5">
                      🚗 Cars: <strong className="text-white">{currentMonthSummary.carsSold}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      🏍️ Bikes: <strong className="text-white">{currentMonthSummary.bikesSold}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Metric 2: Total Sales Revenue */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between h-full">
                <div className="flex items-center justify-between gap-2 h-8 shrink-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">Total Sales Revenue</span>
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20">
                    <DollarSign className="w-4 h-4" aria-hidden="true" />
                  </div>
                </div>
                <div className="my-3 flex items-center h-9 shrink-0">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight leading-none truncate">
                    {formatCurrency(currentMonthSummary.totalSalesRevenue, symbol)}
                  </span>
                </div>
                <div className="mt-auto pt-3 border-t border-slate-800/80 min-h-[46px] flex items-center shrink-0">
                  <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                    Full selling price before deducting costs or expenses
                  </p>
                </div>
              </div>

              {/* Metric 3: Total Vehicle Costs */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between h-full">
                <div className="flex items-center justify-between gap-2 h-8 shrink-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 truncate">Total Vehicle Costs</span>
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20">
                    <Coins className="w-4 h-4" aria-hidden="true" />
                  </div>
                </div>
                <div className="my-3 flex items-center h-9 shrink-0">
                  <span className="text-2xl sm:text-3xl font-black text-sky-400 font-mono tracking-tight leading-none truncate">
                    {formatCurrency(currentMonthSummary.totalVehicleCost, symbol)}
                  </span>
                </div>
                <div className="mt-auto pt-3 border-t border-slate-800/80 min-h-[46px] flex items-center shrink-0">
                  <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                    Total purchase/cost price of all vehicles sold
                  </p>
                </div>
              </div>

              {/* Metric 4: Total Expenses */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between h-full">
                <div className="flex items-center justify-between gap-2 h-8 shrink-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 truncate">Total Expenses</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                    <Wrench className="w-4 h-4" aria-hidden="true" />
                  </div>
                </div>
                <div className="my-3 flex items-center h-9 shrink-0">
                  <span className="text-2xl sm:text-3xl font-black text-rose-400 font-mono tracking-tight leading-none truncate">
                    {formatCurrency(currentMonthSummary.totalExpenses, symbol)}
                  </span>
                </div>
                <div className="mt-auto pt-3 border-t border-slate-800/80 min-h-[46px] flex items-center shrink-0">
                  <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                    Transport, repairs, registration, commissions, detailing
                  </p>
                </div>
              </div>

            </div>

            {/* Row 2: Metric 5 - Total Profit Equation Cards (Gross & Net Profit) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Gross Profit */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950/40 border border-sky-500/30 p-5 shadow-xl flex flex-col justify-between h-full">
                <div className="flex items-center justify-between h-8 shrink-0">
                  <span className="text-xs font-black uppercase tracking-wider text-sky-400">
                    Gross Profit (Sales Revenue − Vehicle Costs)
                  </span>
                  <span className="text-xs font-bold text-sky-300 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 font-mono shrink-0">
                    {currentMonthSummary.grossMarginPercent.toFixed(1)}% margin
                  </span>
                </div>
                <div className="my-3 flex items-center h-10 shrink-0">
                  <span className="text-3xl sm:text-4xl font-black text-sky-300 font-mono tracking-tight leading-none truncate">
                    {formatCurrency(currentMonthSummary.grossProfit, symbol)}
                  </span>
                </div>
                <div className="mt-auto pt-3 border-t border-slate-800/80 text-xs text-slate-400 font-mono flex items-center justify-between min-h-[38px] shrink-0">
                  <span>Revenue − Vehicle Costs:</span>
                  <span className="text-white font-bold truncate ml-2">
                    {formatCurrency(currentMonthSummary.totalSalesRevenue, symbol)} − {formatCurrency(currentMonthSummary.totalVehicleCost, symbol)}
                  </span>
                </div>
              </div>

              {/* Metric 5: Total Net Profit */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950/40 border border-sky-500/30 p-5 shadow-xl flex flex-col justify-between h-full">
                <div className="flex items-center justify-between h-8 shrink-0">
                  <span className="text-xs font-black uppercase tracking-wider text-sky-400">
                    Total Net Profit (Gross Profit − Expenses)
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border font-mono shrink-0 ${
                    currentMonthSummary.netProfit >= 0
                      ? 'bg-sky-500/10 text-sky-300 border-sky-500/20'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                  }`}>
                    {currentMonthSummary.netMarginPercent.toFixed(1)}% margin
                  </span>
                </div>
                <div className="my-3 flex items-center h-10 shrink-0">
                  <span className={`text-3xl sm:text-4xl font-black font-mono tracking-tight leading-none truncate ${
                    currentMonthSummary.netProfit >= 0 ? 'text-sky-400' : 'text-rose-400'
                  }`}>
                    {formatCurrency(currentMonthSummary.netProfit, symbol)}
                  </span>
                </div>
                <div className="mt-auto pt-3 border-t border-slate-800/80 text-xs text-slate-400 font-mono flex items-center justify-between min-h-[38px] shrink-0">
                  <span>Gross Profit − Total Expenses:</span>
                  <span className="text-white font-bold truncate ml-2">
                    {formatCurrency(currentMonthSummary.grossProfit, symbol)} − {formatCurrency(currentMonthSummary.totalExpenses, symbol)}
                  </span>
                </div>
              </div>

            </div>

            {/* Row 3: Metrics 6, 7, 8, 9 - Cash, Finance, Down Payments, Finance Amounts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Metric 6: Total Cash Sales */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col justify-between h-full">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider h-5 flex items-center">
                  Total Cash Sales
                </div>
                <div className="my-2.5 flex items-center h-8 shrink-0">
                  <span className="text-xl sm:text-2xl font-black text-white font-mono truncate">
                    {formatCurrency(currentMonthSummary.cashSales, symbol)}
                  </span>
                </div>
                <div className="mt-auto pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 min-h-[32px] flex items-center">
                  {currentMonthSummary.cashSalesCount} vehicle(s) paid fully in cash
                </div>
              </div>

              {/* Metric 7: Total Finance Sales */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col justify-between h-full">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-amber-400 h-5 flex items-center">
                  Total Finance Sales
                </div>
                <div className="my-2.5 flex items-center h-8 shrink-0">
                  <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono truncate">
                    {formatCurrency(currentMonthSummary.financeSales, symbol)}
                  </span>
                </div>
                <div className="mt-auto pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 min-h-[32px] flex items-center">
                  {currentMonthSummary.financeSalesCount} vehicle(s) sold via financing
                </div>
              </div>

              {/* Metric 8: Total Down Payments */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col justify-between h-full">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-teal-400 h-5 flex items-center">
                  Total Down Payments
                </div>
                <div className="my-2.5 flex items-center h-8 shrink-0">
                  <span className="text-xl sm:text-2xl font-black text-teal-400 font-mono truncate">
                    {formatCurrency(currentMonthSummary.totalDownPayments, symbol)}
                  </span>
                </div>
                <div className="mt-auto pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 min-h-[32px] flex items-center">
                  Upfront cash collected on finance deals
                </div>
              </div>

              {/* Metric 9: Total Finance Amounts */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col justify-between h-full">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-sky-400 h-5 flex items-center">
                  Total Finance Amounts
                </div>
                <div className="my-2.5 flex items-center h-8 shrink-0">
                  <span className="text-xl sm:text-2xl font-black text-sky-400 font-mono truncate">
                    {formatCurrency(currentMonthSummary.totalFinanceAmount, symbol)}
                  </span>
                </div>
                <div className="mt-auto pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 min-h-[32px] flex items-center">
                  Principal financed via leasing institutions
                </div>
              </div>

            </div>

          </div>

          {/* ===================================================================== */}
          {/* MONTHLY REPORT: ITEMISED SALES LEDGER FOR SELECTED MONTH              */}
          {/* ===================================================================== */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-sky-400" />
                  <span>{currentMonthSummary.monthLabel} Sales Report & Ledger</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {soldVehiclesInMonth.length} Record{soldVehiclesInMonth.length === 1 ? '' : 's'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Detailed breakdown of every transaction recorded in {currentMonthSummary.monthLabel}.
                </p>
              </div>

              <div className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                🔒 Cost prices & profit remain strictly confidential for internal business review.
              </div>
            </div>

            {soldVehiclesInMonth.length > 0 ? (
              <>
                {/* Mobile Cards View (Visible on small screens) */}
                <div className="md:hidden space-y-3">
                  {soldVehiclesInMonth.map((bike) => {
                    const sale = bike.sale!;
                    const vehicleType = bike.vehicleType || 'Bike';
                    const vehicleIcon = vehicleType === 'Bike' ? '🏍️' : vehicleType === 'Three-Wheeler' ? '🛺' : vehicleType === 'Heavy Vehicle' ? '🚚' : '🚗';
                    const isFinance = sale.saleMethod === 'Finance';
                    const vehicleCost = Number(sale.purchasePrice ?? bike.purchasePrice) || 0;
                    const expenses = Number(sale.totalRepairCost) || 0;

                    return (
                      <div
                        key={bike.id}
                        className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5 text-sm">
                              <span>{vehicleIcon}</span>
                              <span>{bike.year} {bike.make} {bike.model}</span>
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">
                              {bike.regPlate} • {vehicleType} • {bike.category}
                            </div>
                          </div>

                          <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 ${
                            isFinance ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          }`}>
                            {sale.saleMethod}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Customer</span>
                            <span className="text-white font-medium truncate block">{sale.customerName}</span>
                            <span className="text-[10px] text-slate-400">{sale.customerPhone}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Sale Date</span>
                            <span className="text-slate-300">{formatDate(sale.saleDate)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Revenue</span>
                            <span className="text-white font-bold">{formatCurrency(sale.saleAmount, symbol)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-sky-400 block uppercase font-bold">Net Profit</span>
                            <span className="text-sky-400 font-black">+{formatCurrency(sale.netProfit, symbol)}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <div className="text-[10px] text-slate-400 font-mono">
                            Cost: {formatCurrency(vehicleCost, symbol)} • Exp: {formatCurrency(expenses, symbol)}
                          </div>
                          <button
                            type="button"
                            onClick={() => openInvoiceForSale(sale)}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-700 text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-sky-400"
                            title="Print Bill of Sale or Handover Letter"
                            aria-label={`Print documents for sale of ${bike.year} ${bike.make} ${bike.model}`}
                          >
                            <FileText className="w-4 h-4 text-sky-400" aria-hidden="true" />
                            <span>Bill / Letter</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View (Visible on tablet & desktop) */}
                <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Vehicle</th>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3">Payment Method</th>
                        <th className="py-3 px-3">Customer</th>
                        <th className="py-3 px-4 text-right">Sale Revenue</th>
                        <th className="py-3 px-4 text-right text-sky-400">Vehicle Cost</th>
                        <th className="py-3 px-4 text-right text-rose-400">Expenses</th>
                        <th className="py-3 px-4 text-right text-sky-400">Net Profit</th>
                        <th className="py-3 px-3 text-center">Customer Document</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {soldVehiclesInMonth.map((bike) => {
                        const sale = bike.sale!;
                        const vehicleType = bike.vehicleType || 'Bike';
                        const vehicleIcon = vehicleType === 'Bike' ? '🏍️' : vehicleType === 'Three-Wheeler' ? '🛺' : vehicleType === 'Heavy Vehicle' ? '🚚' : '🚗';
                        const isFinance = sale.saleMethod === 'Finance';
                        const vehicleCost = Number(sale.purchasePrice ?? bike.purchasePrice) || 0;
                        const expenses = Number(sale.totalRepairCost) || 0;

                        return (
                          <tr key={bike.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{vehicleIcon}</span>
                                <span>{bike.year} {bike.make} {bike.model}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {bike.regPlate} • {bike.category}
                              </div>
                            </td>

                            <td className="py-3.5 px-3 font-mono text-slate-300">
                              {formatDate(sale.saleDate)}
                            </td>

                            <td className="py-3.5 px-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                isFinance ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              }`}>
                                {sale.saleMethod}
                                {isFinance && sale.financeAmount ? ` (${formatCurrency(sale.financeAmount, symbol)})` : ''}
                              </span>
                            </td>

                            <td className="py-3.5 px-3">
                              <div className="text-white font-medium">{sale.customerName}</div>
                              <div className="text-[10px] text-slate-400">{sale.customerPhone}</div>
                            </td>

                            <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                              {formatCurrency(sale.saleAmount, symbol)}
                            </td>

                            <td className="py-3.5 px-4 text-right font-mono text-sky-400">
                              {formatCurrency(vehicleCost, symbol)}
                            </td>

                            <td className="py-3.5 px-4 text-right font-mono text-rose-400">
                              {formatCurrency(expenses, symbol)}
                            </td>

                            <td className="py-3.5 px-4 text-right font-mono font-black text-sky-400">
                              +{formatCurrency(sale.netProfit, symbol)}
                            </td>

                            <td className="py-3.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => openInvoiceForSale(sale)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-bold transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-sky-400"
                                title="Print Bill of Sale or Handover Letter"
                                aria-label={`Print documents for sale of ${bike.year} ${bike.make} ${bike.model}`}
                              >
                                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Bill / Letter</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-950/40 border border-slate-800 text-center space-y-2">
                <p className="text-sm font-bold text-slate-300">
                  No sales recorded in {currentMonthSummary.monthLabel}.
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  When a vehicle is sold, its record is preserved permanently in this month&apos;s ledger.
                </p>
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* MONTH-BY-MONTH HISTORY: PERFORMANCE REVIEW ACROSS ALL MONTHS          */}
          {/* ===================================================================== */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-sky-400" />
                  <span>Month-by-Month History & Performance</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete historical record of all previous and current months. Select any month to view its detailed report.
                </p>
              </div>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                <button
                  onClick={() => setHistoryViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    historyViewMode === 'table'
                      ? 'bg-sky-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Historical Table</span>
                </button>
                <button
                  onClick={() => setHistoryViewMode('cards')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    historyViewMode === 'cards'
                      ? 'bg-sky-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Visual Comparison</span>
                </button>
              </div>
            </div>

            {historyViewMode === 'table' ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Month / Year</th>
                      <th className="py-3 px-3 text-center">Vehicles Sold</th>
                      <th className="py-3 px-4 text-right">Sales Revenue</th>
                      <th className="py-3 px-4 text-right text-sky-400">Vehicle Costs</th>
                      <th className="py-3 px-4 text-right text-rose-400">Expenses</th>
                      <th className="py-3 px-4 text-right text-sky-400">Gross Profit</th>
                      <th className="py-3 px-4 text-right text-sky-400">Net Profit</th>
                      <th className="py-3 px-3 text-center">Net Margin</th>
                      <th className="py-3 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {monthlyComparisons.map((m) => {
                      const isSelected = m.year === selectedYear && m.month === selectedMonth;

                      return (
                        <tr
                          key={m.monthKey}
                          className={`hover:bg-slate-900/50 transition-colors ${
                            isSelected ? 'bg-sky-950/25 font-semibold' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{m.monthLabel}</span>
                              {isSelected && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                  Viewing
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Cash: {m.cashSalesCount} • Finance: {m.financeSalesCount}
                            </div>
                          </td>

                          <td className="py-3.5 px-3 text-center font-mono">
                            <div className="text-white font-bold text-sm">{m.totalVehiclesSold}</div>
                            <div className="text-[10px] text-slate-400">
                              {m.carsSold}C / {m.bikesSold}B
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono font-bold text-white text-sm">
                            {formatCurrency(m.totalSalesRevenue, symbol)}
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono text-sky-400">
                            {formatCurrency(m.totalVehicleCost, symbol)}
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono text-rose-400">
                            {formatCurrency(m.totalExpenses, symbol)}
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono font-bold text-sky-300">
                            {formatCurrency(m.grossProfit, symbol)}
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono font-black text-sm">
                            <span className={m.netProfit >= 0 ? 'text-sky-400' : 'text-rose-400'}>
                              {formatCurrency(m.netProfit, symbol)}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-center font-mono">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              m.netMarginPercent > 0
                                ? 'bg-sky-500/20 text-sky-300'
                                : m.netMarginPercent === 0
                                ? 'bg-slate-800 text-slate-400'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}>
                              {m.netMarginPercent.toFixed(1)}%
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-center">
                            <button
                              onClick={() => {
                                setSelectedYear(m.year);
                                setSelectedMonth(m.month);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                isSelected
                                  ? 'bg-sky-500 text-slate-950 font-black'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                              }`}
                            >
                              {isSelected ? 'Active' : 'View Month'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Cumulative Totals Row */}
                  <tfoot className="bg-slate-900 text-xs font-mono font-bold border-t-2 border-slate-700">
                    <tr>
                      <td className="py-3.5 px-4 text-slate-200 uppercase font-black">All Retained Months</td>
                      <td className="py-3.5 px-3 text-center text-white font-black">{cumulativeHistoryTotals.totalVehiclesSold}</td>
                      <td className="py-3.5 px-4 text-right text-white font-black">{formatCurrency(cumulativeHistoryTotals.totalSalesRevenue, symbol)}</td>
                      <td className="py-3.5 px-4 text-right text-sky-400">{formatCurrency(cumulativeHistoryTotals.totalVehicleCost, symbol)}</td>
                      <td className="py-3.5 px-4 text-right text-rose-400">{formatCurrency(cumulativeHistoryTotals.totalExpenses, symbol)}</td>
                      <td className="py-3.5 px-4 text-right text-sky-300">{formatCurrency(cumulativeHistoryTotals.grossProfit, symbol)}</td>
                      <td className="py-3.5 px-4 text-right text-sky-400 font-black">{formatCurrency(cumulativeHistoryTotals.netProfit, symbol)}</td>
                      <td className="py-3.5 px-3 text-center text-slate-300" colSpan={2}>
                        {cumulativeHistoryTotals.totalSalesRevenue > 0
                          ? `${((cumulativeHistoryTotals.netProfit / cumulativeHistoryTotals.totalSalesRevenue) * 100).toFixed(1)}% avg net`
                          : 'N/A'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="space-y-3">
                {monthlyComparisons.map((m) => {
                  const isSelected = m.year === selectedYear && m.month === selectedMonth;
                  const hasSales = m.totalSalesRevenue > 0;
                  const costPct = hasSales ? Math.min(100, Math.round((m.totalVehicleCost / m.totalSalesRevenue) * 100)) : 0;
                  const expPct = hasSales ? Math.min(100 - costPct, Math.round((m.totalExpenses / m.totalSalesRevenue) * 100)) : 0;
                  const netPct = hasSales ? Math.max(0, 100 - costPct - expPct) : 0;

                  return (
                    <div
                      key={m.monthKey}
                      onClick={() => {
                        setSelectedYear(m.year);
                        setSelectedMonth(m.month);
                      }}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-950 border-sky-500 shadow-xl shadow-sky-500/10'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                          <span className={`text-base font-black ${isSelected ? 'text-sky-300' : 'text-white'}`}>
                            {m.monthLabel}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {m.totalVehiclesSold} sold ({m.carsSold} Cars • {m.bikesSold} Bikes)
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono">
                          <div>Revenue: <strong className="text-white">{formatCurrency(m.totalSalesRevenue, symbol)}</strong></div>
                          <div>Profit: <strong className="text-sky-400 font-black">{formatCurrency(m.netProfit, symbol)}</strong></div>
                        </div>
                      </div>

                      {hasSales && (
                        <div className="mt-3">
                          <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex">
                            <div style={{ width: `${costPct}%` }} className="bg-sky-500/80" title={`Cost: ${costPct}%`} />
                            <div style={{ width: `${expPct}%` }} className="bg-rose-500/80" title={`Expenses: ${expPct}%`} />
                            <div style={{ width: `${netPct}%` }} className="bg-sky-400" title={`Net Profit: ${netPct}%`} />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
                            <span>Cost: {costPct}%</span>
                            <span>Expenses: {expPct}%</span>
                            <span>Net Profit: {netPct}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: 3% FINANCE SIMULATOR (Retained as Secondary Simulation Tool)      */}
      {/* ========================================================================= */}
      {subTab === 'simulator' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-amber-400" />
                  <span>3% Finance Commission & Profit Simulator</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Model vehicle finance deals and calculate 3% lender commissions in Sri Lankan Rupees.
                </p>
              </div>

              <button
                onClick={() => setSubTab('summary')}
                className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                <span>Back to Monthly Summary</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Load from stock selector */}
            {bikes.some(b => b.status === 'In Stock') && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="font-bold text-white">Load from Current Inventory:</span>
                  <p className="text-slate-400">Pre-fill vehicle cost, expenses, and selling prices from in-stock vehicles</p>
                </div>

                <select
                  value={simStockBikeId}
                  onChange={(e) => handleSelectSimStockBike(e.target.value)}
                  aria-label="Select in-stock vehicle to simulate"
                  className="bg-slate-900 border border-slate-700 focus:border-amber-400 text-xs sm:text-sm text-white rounded-xl px-3 py-2.5 min-h-[44px] outline-none w-full sm:w-80 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <option value="">-- Select In-Stock Vehicle (Optional) --</option>
                  {bikes.filter(b => b.status === 'In Stock').map(b => (
                    <option key={b.id} value={b.id}>
                      {b.year} {b.make} {b.model} ({formatCurrency(b.totalCost, symbol)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Simulation Parameter Inputs & Live Results */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Inputs */}
              <div className="lg:col-span-6 space-y-4">
                <div>
                  <label htmlFor="sim-cost-price" className="block text-xs font-semibold text-slate-400 mb-1">
                    1. Vehicle Cost Price (Rs.) *
                  </label>
                  <input
                    id="sim-cost-price"
                    type="number"
                    value={simPurchasePrice}
                    onChange={(e) => setSimPurchasePrice(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 min-h-[44px] text-sm sm:text-base font-mono text-white focus:outline-none focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400"
                  />
                </div>

                <div>
                  <label htmlFor="sim-repair-cost" className="block text-xs font-semibold text-slate-400 mb-1">
                    2. Other Expenses & Costs (Rs.)
                  </label>
                  <input
                    id="sim-repair-cost"
                    type="number"
                    value={simRepairCost}
                    onChange={(e) => setSimRepairCost(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 min-h-[44px] text-sm sm:text-base font-mono text-white focus:outline-none focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400"
                  />
                </div>

                <div>
                  <label htmlFor="sim-sale-amount" className="block text-xs font-semibold text-slate-400 mb-1">
                    3. Agreed Selling Price (Rs.) *
                  </label>
                  <input
                    id="sim-sale-amount"
                    type="number"
                    value={simSaleAmount}
                    onChange={(e) => setSimSaleAmount(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 min-h-[44px] text-sm sm:text-base font-mono text-white focus:outline-none focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400"
                  />
                </div>

                <div>
                  <label htmlFor="sim-finance-amount" className="block text-xs font-semibold text-slate-400 mb-1">
                    4. Finance Loan Amount (Rs.) *
                  </label>
                  <input
                    id="sim-finance-amount"
                    type="number"
                    value={simFinanceAmount}
                    onChange={(e) => setSimFinanceAmount(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 min-h-[44px] text-sm sm:text-base font-mono text-white focus:outline-none focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400"
                  />
                </div>
              </div>

              {/* Side-by-Side Comparison */}
              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Cash Deal */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4.5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white uppercase">Cash Sale</span>
                    <span className="text-slate-400">100% Cash</span>
                  </div>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Sale Amount:</span>
                      <span className="text-white">{formatCurrency(simCashResult.saleAmount, symbol)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Total Cost:</span>
                      <span className="text-sky-400">-{formatCurrency(simCashResult.totalCost, symbol)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Finance Comm:</span>
                      <span>—</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-800 text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Cash Net Profit</div>
                    <div className="text-xl font-black text-sky-400 font-mono mt-0.5">
                      +{formatCurrency(simCashResult.netProfit, symbol)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {simCashResult.profitMarginPercent.toFixed(1)}% margin
                    </div>
                  </div>
                </div>

                {/* Finance Deal */}
                <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4.5 space-y-3 shadow-lg shadow-amber-500/5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-300 uppercase">Finance Sale</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                      +3% Comm
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Sale Amount:</span>
                      <span className="text-white">{formatCurrency(simFinanceResult.saleAmount, symbol)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Total Cost:</span>
                      <span className="text-sky-400">-{formatCurrency(simFinanceResult.totalCost, symbol)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>3% Commission:</span>
                      <span className="text-amber-400 font-bold">+{formatCurrency(simFinanceResult.financeCommission, symbol)}</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-800 text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Finance Net Profit</div>
                    <div className="text-xl font-black text-amber-400 font-mono mt-0.5">
                      +{formatCurrency(simFinanceResult.netProfit, symbol)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {simFinanceResult.profitMarginPercent.toFixed(1)}% margin
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
