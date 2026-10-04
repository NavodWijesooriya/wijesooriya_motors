import React, { useState, useMemo } from 'react';
import { useDealership } from '../context/DealershipContext';
import { MonthlySummary, Bike } from '../types';
import { 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Coins, 
  Wrench, 
  Car, 
  Bike as BikeIcon, 
  CheckCircle, 
  CreditCard, 
  ChevronLeft, 
  ChevronRight, 
  BarChart3, 
  Table as TableIcon, 
  ShieldCheck, 
  ArrowUpRight, 
  Layers, 
  Sparkles,
  Receipt,
  FileText
} from 'lucide-react';
import { 
  formatCurrency, 
  formatDate, 
  calculateMonthlySummary, 
  generateMonthByMonthComparison 
} from '../utils/formatters';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MonthlySummarySection: React.FC = () => {
  const { bikes, settings, openInvoiceForSale } = useDealership();
  const symbol = settings.currencySymbol;

  // Current date initialization
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1); // 1-12
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Month-by-month comparative data across all recorded months
  const monthlyComparisons = useMemo(() => {
    return generateMonthByMonthComparison(bikes, 12);
  }, [bikes]);

  // Extract all distinct years available in records, plus current & adjacent years
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

  // Compute selected month's 12 exact metric definitions
  const currentMonthSummary: MonthlySummary = useMemo(() => {
    return calculateMonthlySummary(bikes, selectedYear, selectedMonth);
  }, [bikes, selectedYear, selectedMonth]);

  // Vehicles sold specifically within the selected month and year
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

  // Quick navigation handlers
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

  // Check if selected month is the active current calendar month
  const isCurrentCalendarMonth = 
    selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;

  // Comparison totals across all recorded comparison months
  const comparisonTotals = useMemo(() => {
    return monthlyComparisons.reduce(
      (acc, m) => {
        acc.totalVehiclesSold += m.totalVehiclesSold;
        acc.totalSalesRevenue += m.totalSalesRevenue;
        acc.totalVehicleCost += m.totalVehicleCost;
        acc.totalExpenses += m.totalExpenses;
        acc.grossProfit += m.grossProfit;
        acc.netProfit += m.netProfit;
        return acc;
      },
      {
        totalVehiclesSold: 0,
        totalSalesRevenue: 0,
        totalVehicleCost: 0,
        totalExpenses: 0,
        grossProfit: 0,
        netProfit: 0
      }
    );
  }, [monthlyComparisons]);

  return (
    <section className="space-y-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl">
      
      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-sky-500/20 to-emerald-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1.5 shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              Monthly Summary & Internal P&L
            </span>

            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              Internal Business Reporting Only (Cost Figures Hidden From Customer Documents)
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>{currentMonthSummary.monthLabel}</span>
            <span className="text-slate-500 text-lg font-normal font-sans">Performance</span>
          </h2>
          
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            All figures calculated strictly based on transactions recorded within <strong className="text-slate-200">{currentMonthSummary.monthLabel}</strong>.
          </p>
        </div>

        {/* Date Selector Navigation Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-slate-950/80 p-2 sm:p-2.5 rounded-2xl border border-slate-800 self-start lg:self-center">
          
          {/* Previous Month */}
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Month Selector Dropdown */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={name} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>

          {/* Year Selector Dropdown */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer font-mono"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Next Month */}
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Current Month Quick Jump */}
          {!isCurrentCalendarMonth && (
            <button
              onClick={handleJumpToCurrentMonth}
              className="px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/30 text-xs font-bold transition-colors"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Quick Month Badges Selector (Fast-switching between recorded months) */}
      {monthlyComparisons.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            Months:
          </span>
          <div className="flex items-center gap-1.5 flex-nowrap">
            {monthlyComparisons.map((m) => {
              const isSelected = m.year === selectedYear && m.month === selectedMonth;
              return (
                <button
                  key={m.monthKey}
                  onClick={() => {
                    setSelectedYear(m.year);
                    setSelectedMonth(m.month);
                  }}
                  className={`px-3 py-1 rounded-xl font-bold text-xs shrink-0 transition-all border ${
                    isSelected
                      ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-lg shadow-sky-500/20 font-black'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {m.shortMonthLabel}
                  {m.totalVehiclesSold > 0 && (
                    <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected ? 'bg-slate-950 text-sky-300' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {m.totalVehiclesSold} sold
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12 METRIC DEFINITIONS CARDS GRID                                          */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        
        {/* Section Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">
              {currentMonthSummary.monthLabel} Metric Definitions
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {currentMonthSummary.totalVehiclesSold} transactions recorded
          </span>
        </div>

        {/* 1. Core Volume & High-Level Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Metric 1: Total Vehicles Sold */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-md flex flex-col justify-between h-full">
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
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-md flex flex-col justify-between h-full">
            <div className="flex items-center justify-between gap-2 h-8 shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">Total Sales Revenue</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
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

          {/* Metric 3: Total Vehicle Cost */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-md flex flex-col justify-between h-full">
            <div className="flex items-center justify-between gap-2 h-8 shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 truncate">Total Vehicle Cost</span>
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/20">
                <Coins className="w-4 h-4" aria-hidden="true" />
              </div>
            </div>
            <div className="my-3 flex items-center h-9 shrink-0">
              <span className="text-2xl sm:text-3xl font-black text-orange-400 font-mono tracking-tight leading-none truncate">
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
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-md flex flex-col justify-between h-full">
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
                Transport, repairs, registration, commissions & other expenses
              </p>
            </div>
          </div>
        </div>

        {/* 2. Primary Profitability Equations Ribbon (Gross Profit & Net Profit) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Metric 7: Gross Profit (Total Sales Revenue − Total Vehicle Cost) */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950/40 border border-sky-500/30 p-5 shadow-xl flex flex-col justify-between h-full">
            <div className="flex items-center justify-between h-8 shrink-0">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Gross Profit Metric
                </span>
                <h4 className="text-lg font-black text-white mt-1">
                  Gross Profit
                </h4>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-sky-400 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                  Margin: {currentMonthSummary.grossMarginPercent.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="my-3 flex items-center h-10 shrink-0">
              <span className="text-3xl sm:text-4xl font-black text-sky-300 font-mono tracking-tight leading-none truncate">
                {formatCurrency(currentMonthSummary.grossProfit, symbol)}
              </span>
            </div>

            {/* Formula Callout */}
            <div className="mt-auto pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300 font-mono min-h-[38px] shrink-0">
              <span>Formula:</span>
              <span className="font-bold text-slate-100 truncate ml-2">
                Revenue ({formatCurrency(currentMonthSummary.totalSalesRevenue, symbol)}) − Vehicle Cost ({formatCurrency(currentMonthSummary.totalVehicleCost, symbol)})
              </span>
            </div>
          </div>

          {/* Metric 8: Net Profit (Gross Profit − Total Expenses) */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 border border-emerald-500/30 p-5 shadow-xl flex flex-col justify-between h-full">
            <div className="flex items-center justify-between h-8 shrink-0">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Net Profit Metric
                </span>
                <h4 className="text-lg font-black text-white mt-1">
                  Net Profit
                </h4>
              </div>
              <div className="text-right">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                  currentMonthSummary.netProfit >= 0
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                }`}>
                  Margin: {currentMonthSummary.netMarginPercent.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="my-3 flex items-center h-10 shrink-0">
              <span className={`text-3xl sm:text-4xl font-black font-mono tracking-tight leading-none truncate ${
                currentMonthSummary.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {formatCurrency(currentMonthSummary.netProfit, symbol)}
              </span>
            </div>

            {/* Formula Callout */}
            <div className="mt-auto pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300 font-mono min-h-[38px] shrink-0">
              <span>Formula:</span>
              <span className="font-bold text-slate-100 truncate ml-2">
                Gross Profit ({formatCurrency(currentMonthSummary.grossProfit, symbol)}) − Total Expenses ({formatCurrency(currentMonthSummary.totalExpenses, symbol)})
              </span>
            </div>
          </div>
        </div>

        {/* 3. Sales Breakdown & Financing Pillars */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          
          {/* Metric 9: Cash Sales */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between h-full">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider h-5 flex items-center shrink-0">Cash Sales</div>
            <div className="my-1.5 flex items-center h-7 shrink-0">
              <span className="text-base sm:text-lg font-black text-white font-mono truncate">
                {formatCurrency(currentMonthSummary.cashSales, symbol)}
              </span>
            </div>
            <div className="mt-auto pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-500 min-h-[26px] flex items-center shrink-0">
              {currentMonthSummary.cashSalesCount} cash deals
            </div>
          </div>

          {/* Metric 10: Finance Sales */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between h-full">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-amber-400 h-5 flex items-center shrink-0">Finance Sales</div>
            <div className="my-1.5 flex items-center h-7 shrink-0">
              <span className="text-base sm:text-lg font-black text-amber-400 font-mono truncate">
                {formatCurrency(currentMonthSummary.financeSales, symbol)}
              </span>
            </div>
            <div className="mt-auto pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-500 min-h-[26px] flex items-center shrink-0">
              {currentMonthSummary.financeSalesCount} finance deals
            </div>
          </div>

          {/* Metric 4: Total Down Payments */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between h-full">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-teal-400 h-5 flex items-center shrink-0">Total Down Payments</div>
            <div className="my-1.5 flex items-center h-7 shrink-0">
              <span className="text-base sm:text-lg font-black text-teal-400 font-mono truncate">
                {formatCurrency(currentMonthSummary.totalDownPayments, symbol)}
              </span>
            </div>
            <div className="mt-auto pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-500 min-h-[26px] flex items-center shrink-0">
              Collected from buyers
            </div>
          </div>

          {/* Metric 5: Total Finance Amount */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between h-full">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-sky-400 h-5 flex items-center shrink-0">Total Finance Amount</div>
            <div className="my-1.5 flex items-center h-7 shrink-0">
              <span className="text-base sm:text-lg font-black text-sky-400 font-mono truncate">
                {formatCurrency(currentMonthSummary.totalFinanceAmount, symbol)}
              </span>
            </div>
            <div className="mt-auto pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-500 min-h-[26px] flex items-center shrink-0">
              Financed via providers
            </div>
          </div>

          {/* Metric 11: Cars Sold */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between h-full">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 h-5 shrink-0">
              <span>🚗</span> Cars Sold
            </div>
            <div className="my-1.5 flex items-center h-7 shrink-0">
              <span className="text-base sm:text-lg font-black text-white font-mono">
                {currentMonthSummary.carsSold}
              </span>
            </div>
            <div className="mt-auto pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-500 min-h-[26px] flex items-center shrink-0">
              Four-wheeler cars
            </div>
          </div>

          {/* Metric 12: Bikes Sold */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between h-full">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 h-5 shrink-0">
              <span>🏍️</span> Bikes Sold
            </div>
            <div className="my-1.5 flex items-center h-7 shrink-0">
              <span className="text-base sm:text-lg font-black text-white font-mono">
                {currentMonthSummary.bikesSold}
              </span>
            </div>
            <div className="mt-auto pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-500 min-h-[26px] flex items-center shrink-0">
              Two-wheeler bikes
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* MONTH-BY-MONTH VIEW FOR COMPARING                                         */}
      {/* Sales Revenue, Vehicle Costs, Expenses, Gross Profit, and Net Profit      */}
      {/* ========================================================================= */}
      <div className="mt-8 pt-6 border-t border-slate-800 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sky-400" />
              Month-by-Month Comparative Analysis
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Side-by-side comparison of <strong>Sales Revenue</strong>, <strong>Vehicle Costs</strong>, <strong>Expenses</strong>, <strong>Gross Profit</strong>, and <strong>Net Profit</strong> across all active months.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'cards'
                  ? 'bg-sky-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Comparative Bars</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-sky-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Financial Ledger</span>
            </button>
          </div>
        </div>

        {/* View Mode 1: Comparative Progress Bars & Cards */}
        {viewMode === 'cards' && (
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
                      ? 'bg-slate-950 border-sky-500/60 shadow-xl shadow-sky-500/10 ring-1 ring-sky-500/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950/90'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm sm:text-base font-black ${isSelected ? 'text-sky-300' : 'text-white'}`}>
                        {m.monthLabel}
                      </span>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-sky-500/20 text-sky-400 border border-sky-500/30">
                          Selected Active
                        </span>
                      )}
                      <span className="text-xs text-slate-400 font-mono">
                        {m.totalVehiclesSold} sold ({m.carsSold} Cars • {m.bikesSold} Bikes)
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div>
                        <span className="text-slate-400">Gross: </span>
                        <strong className="text-sky-300">{formatCurrency(m.grossProfit, symbol)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Net: </span>
                        <strong className={m.netProfit >= 0 ? 'text-emerald-400 font-black' : 'text-rose-400 font-black'}>
                          {formatCurrency(m.netProfit, symbol)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* 5 Comparative Metrics Columns */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3 pt-1 text-xs">
                    <div>
                      <div className="text-[10px] uppercase text-slate-400 font-bold">1. Sales Revenue</div>
                      <div className="text-sm font-black text-white font-mono mt-0.5">
                        {formatCurrency(m.totalSalesRevenue, symbol)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-orange-400/80 font-bold">2. Vehicle Costs</div>
                      <div className="text-sm font-bold text-orange-400 font-mono mt-0.5">
                        {formatCurrency(m.totalVehicleCost, symbol)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-rose-400/80 font-bold">3. Expenses</div>
                      <div className="text-sm font-bold text-rose-400 font-mono mt-0.5">
                        {formatCurrency(m.totalExpenses, symbol)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-sky-400/80 font-bold">4. Gross Profit</div>
                      <div className="text-sm font-bold text-sky-300 font-mono mt-0.5">
                        {formatCurrency(m.grossProfit, symbol)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-emerald-400 font-black">5. Net Profit</div>
                      <div className={`text-sm font-black font-mono mt-0.5 ${
                        m.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {formatCurrency(m.netProfit, symbol)}
                      </div>
                    </div>
                  </div>

                  {/* Comparative Visual Distribution Bar */}
                  {hasSales && (
                    <div className="mt-3 pt-2">
                      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${costPct}%` }}
                          title={`Vehicle Cost: ${costPct}%`}
                          className="bg-orange-500/80 transition-all"
                        />
                        <div
                          style={{ width: `${expPct}%` }}
                          title={`Expenses: ${expPct}%`}
                          className="bg-rose-500/80 transition-all"
                        />
                        <div
                          style={{ width: `${netPct}%` }}
                          title={`Net Profit: ${netPct}%`}
                          className="bg-emerald-400 transition-all"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Cost: {costPct}%
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Expenses: {expPct}%
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Net Profit: {netPct}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* View Mode 2: Full Tabular Ledger Comparison */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-3 text-center">Vehicles</th>
                  <th className="py-3 px-4 text-right">Sales Revenue</th>
                  <th className="py-3 px-4 text-right text-orange-400">Vehicle Costs</th>
                  <th className="py-3 px-4 text-right text-rose-400">Expenses</th>
                  <th className="py-3 px-4 text-right text-sky-400">Gross Profit</th>
                  <th className="py-3 px-4 text-right text-emerald-400">Net Profit</th>
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
                        isSelected ? 'bg-sky-950/20 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          {m.monthLabel}
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {m.cashSalesCount} cash • {m.financeSalesCount} finance
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center font-mono">
                        <div className="text-white font-bold">{m.totalVehiclesSold}</div>
                        <div className="text-[10px] text-slate-400">
                          {m.carsSold}C / {m.bikesSold}B
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        {formatCurrency(m.totalSalesRevenue, symbol)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-orange-400">
                        {formatCurrency(m.totalVehicleCost, symbol)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-rose-400">
                        {formatCurrency(m.totalExpenses, symbol)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-sky-300">
                        {formatCurrency(m.grossProfit, symbol)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-black">
                        <span className={m.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {formatCurrency(m.netProfit, symbol)}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          m.netMarginPercent > 0
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : m.netMarginPercent === 0
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {m.netMarginPercent.toFixed(1)}%
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedYear(m.year);
                            setSelectedMonth(m.month);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-sky-500 text-slate-950 font-black'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          {isSelected ? 'Active' : 'Select'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Total Footers */}
              <tfoot className="bg-slate-900 text-xs font-mono font-bold border-t-2 border-slate-700">
                <tr>
                  <td className="py-3 px-4 text-slate-300 uppercase">Cumulative Totals</td>
                  <td className="py-3 px-3 text-center text-white font-black">{comparisonTotals.totalVehiclesSold}</td>
                  <td className="py-3 px-4 text-right text-white font-black">{formatCurrency(comparisonTotals.totalSalesRevenue, symbol)}</td>
                  <td className="py-3 px-4 text-right text-orange-400">{formatCurrency(comparisonTotals.totalVehicleCost, symbol)}</td>
                  <td className="py-3 px-4 text-right text-rose-400">{formatCurrency(comparisonTotals.totalExpenses, symbol)}</td>
                  <td className="py-3 px-4 text-right text-sky-300">{formatCurrency(comparisonTotals.grossProfit, symbol)}</td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-black">{formatCurrency(comparisonTotals.netProfit, symbol)}</td>
                  <td className="py-3 px-3 text-center text-slate-400" colSpan={2}>
                    {comparisonTotals.totalSalesRevenue > 0
                      ? `${((comparisonTotals.netProfit / comparisonTotals.totalSalesRevenue) * 100).toFixed(1)}% avg net`
                      : 'N/A'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* ITEMIZED TRANSACTIONS FOR SELECTED MONTH                                  */}
      {/* ========================================================================= */}
      <div className="mt-8 pt-6 border-t border-slate-800 space-y-3">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">
              {currentMonthSummary.monthLabel} Itemized Sales Ledger ({soldVehiclesInMonth.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Click &quot;View Document&quot; for customer bill / formal letter (Cost price hidden)
          </span>
        </div>

        {soldVehiclesInMonth.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-3">Date & Type</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-4 text-right">Sale Revenue</th>
                  <th className="py-3 px-4 text-right text-orange-400">Cost Price</th>
                  <th className="py-3 px-4 text-right text-rose-400">Expenses</th>
                  <th className="py-3 px-4 text-right text-sky-400">Gross Profit</th>
                  <th className="py-3 px-4 text-right text-emerald-400">Net Profit</th>
                  <th className="py-3 px-3 text-center">Customer Doc</th>
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
                  const grossProfit = sale.saleAmount - vehicleCost;
                  const netProfit = sale.netProfit;

                  return (
                    <tr key={bike.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span className="text-sm">{vehicleIcon}</span>
                          <span>{bike.year} {bike.make} {bike.model}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {bike.regPlate} • {vehicleType}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-white font-medium">{formatDate(sale.saleDate)}</div>
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          isFinance ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {sale.saleMethod}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-white font-medium">{sale.customerName}</div>
                        <div className="text-[10px] text-slate-400">{sale.customerPhone}</div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        {formatCurrency(sale.saleAmount, symbol)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-orange-400">
                        {formatCurrency(vehicleCost, symbol)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-rose-400">
                        {formatCurrency(expenses, symbol)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-sky-300">
                        {formatCurrency(grossProfit, symbol)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-400">
                        +{formatCurrency(netProfit, symbol)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => openInvoiceForSale(sale)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-bold transition-all hover:scale-105"
                          title="Generate Modern Bill / Formal Letter"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Bill / Letter</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800 text-center space-y-2">
            <p className="text-sm font-bold text-slate-400">
              No transactions recorded for {currentMonthSummary.monthLabel}.
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Vehicles sold during this period will automatically update the 12 Monthly Summary figures above.
            </p>
          </div>
        )}

      </div>

    </section>
  );
};
