import React, { useState, useMemo } from 'react';
import { useDealership } from '../context/DealershipContext';
import { Bike } from '../types';
import { 
  Printer,
  Receipt, 
  ReceiptText, 
  Search, 
  Calendar, 
  User, 
  Building, 
  RotateCcw, 
  Plus,
  FileSpreadsheet,
  TrendingUp,
  Percent,
  Coins
} from 'lucide-react';
import { calculateFinancialSummary, formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../../context/AuthContext';

export const SalesView: React.FC = () => {
  const { isAdmin } = useAuth();
  const { 
    bikes, 
    settings, 
    summary, 
    openInvoiceForSale, 
    openSaleModalForBike, 
    revertSale, 
    openDetailModalForBike,
    setIsAddBikeModalOpen
  } = useDealership();

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'All' | 'Cash' | 'Finance'>('All');
  const [dateSort, setDateSort] = useState<'desc' | 'asc'>('desc');
  const [saleToRevert, setSaleToRevert] = useState<Bike | null>(null);
  const [ownerFilter, setOwnerFilter] = useState('All');
  const [isRevertingSale, setIsRevertingSale] = useState(false);

  const symbol = settings.currencySymbol;
  const ownerOptions = useMemo(() => {
    const owners = new Map<string, string>();
    bikes.forEach((bike) => {
      if (bike.ownerUid && !owners.has(bike.ownerUid)) {
        owners.set(bike.ownerUid, bike.createdByName || bike.createdByEmail || bike.ownerUid);
      }
    });
    return Array.from(owners, ([uid, label]) => ({ uid, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [bikes]);

  const filteredOwnerBikes = ownerFilter === 'All' ? bikes : bikes.filter((bike) => bike.ownerUid === ownerFilter);
  const displaySummary = isAdmin ? calculateFinancialSummary(filteredOwnerBikes) : summary;

  const soldBikes = useMemo(() => {
    return bikes
      .filter((b) => b.status === 'Sold' && b.sale)
      .filter((bike) => {
        if (isAdmin && ownerFilter !== 'All' && bike.ownerUid !== ownerFilter) return false;
        const sale = bike.sale!;
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery = 
          !query ||
          bike.make.toLowerCase().includes(query) ||
          bike.model.toLowerCase().includes(query) ||
          bike.regPlate.toLowerCase().includes(query) ||
          sale.customerName.toLowerCase().includes(query) ||
          (sale.financeProvider && sale.financeProvider.toLowerCase().includes(query));

        const matchesMethod = methodFilter === 'All' || sale.saleMethod === methodFilter;

        return matchesQuery && matchesMethod;
      })
      .sort((a, b) => {
        const timeA = new Date(a.sale!.saleDate).getTime();
        const timeB = new Date(b.sale!.saleDate).getTime();
        return dateSort === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [bikes, searchQuery, methodFilter, dateSort, isAdmin, ownerFilter]);

  const handleExportCSV = () => {
    if (soldBikes.length === 0) return;

    const headers = [
      'Sale ID',
      'Sale Date',
      'Make',
      'Model',
      'Year',
      'Reg Plate',
      'Customer Name',
      'Customer ID (NIC)',
      'Customer Phone',
      'Customer Second Phone',
      'Customer Address',
      'Guarantor Name',
      'Guarantor ID (NIC)',
      'Guarantor Phone',
      'Guarantor Address',
      'Sale Method',
      'Full Selling Price (LKR)',
      'Cost Price (LKR)',
      'Other Costs (LKR)',
      'Total Cost (LKR)',
      'Finance Amount (LKR)',
      'Finance Commission 3% (LKR)',
      'Total Cash Received (LKR)',
      'Net Profit (LKR)',
      'Profit Margin %'
    ];

    const rows = soldBikes.map((b) => {
      const s = b.sale!;
      return [
        s.id,
        s.saleDate,
        `"${b.make}"`,
        `"${b.model}"`,
        b.year,
        `"${b.regPlate}"`,
        `"${s.customerName}"`,
        `"${s.customerIdNumber || ''}"`,
        `"${s.customerPhone}"`,
        `"${s.customerSecondaryPhone || ''}"`,
        `"${s.customerAddress || ''}"`,
        `"${s.guarantorName || ''}"`,
        `"${s.guarantorIdNumber || ''}"`,
        `"${s.guarantorPhone || ''}"`,
        `"${s.guarantorAddress || ''}"`,
        s.saleMethod,
        s.saleAmount,
        s.purchasePrice,
        s.totalRepairCost,
        s.totalCost,
        s.financeAmount || 0,
        s.financeCommission || 0,
        s.totalCashReceived,
        s.netProfit,
        s.profitMarginPercent.toFixed(2)
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sales-POS-LKR-Sales-Ledger-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmRevert = async () => {
    if (!saleToRevert || isRevertingSale) return;
    setIsRevertingSale(true);
    try {
      await revertSale(saleToRevert.id);
      setSaleToRevert(null);
    } catch {
      // The dealership context reports persistence errors to the user.
    } finally {
      setIsRevertingSale(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Title & Action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Sales & <span className="text-sky-400">Profit Ledger</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Reconcile Cash and Finance sales transactions, 3% finance commissions, and net profit margins.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {soldBikes.length > 0 && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors border border-slate-700 focus-visible:ring-2 focus-visible:ring-sky-400"
              aria-label="Export sales ledger to CSV file"
            >
              <FileSpreadsheet className="w-4 h-4 text-sky-400" aria-hidden="true" />
              <span>Export CSV</span>
            </button>
          )}

          {bikes.some(b => b.status === 'In Stock') && (
            <button
              type="button"
              onClick={() => openSaleModalForBike(bikes.find(b => b.status === 'In Stock')!)}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-sky-500/25 transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-sky-400"
              aria-label="Record a vehicle sale"
            >
              <Plus className="w-4 h-4 stroke-[3]" aria-hidden="true" />
              <span>Record Sale</span>
            </button>
          )}
        </div>
      </div>

      {/* Financial Summary Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-full">
          <div className="h-6 flex items-center justify-between shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Total Sales Turnover</span>
          </div>
          <div className="my-2 flex items-center h-8 shrink-0">
            <span className="text-base sm:text-xl font-black text-white font-mono tracking-tight leading-none truncate">
              {formatCurrency(displaySummary.totalSalesRevenue, symbol)}
            </span>
          </div>
          <div className="mt-auto pt-2 border-t border-slate-800/80 text-xs text-slate-400 min-h-[28px] flex items-center shrink-0">
            {displaySummary.totalBikesSold} vehicles sold
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-full">
          <div className="h-6 flex items-center justify-between shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Total Cost Outflow</span>
          </div>
          <div className="my-2 flex items-center h-8 shrink-0">
            <span className="text-base sm:text-xl font-black text-slate-300 font-mono tracking-tight leading-none truncate">
              {formatCurrency(displaySummary.totalPurchaseCost + displaySummary.totalRepairCost, symbol)}
            </span>
          </div>
          <div className="mt-auto pt-2 border-t border-slate-800/80 text-xs text-slate-400 min-h-[28px] flex items-center shrink-0">
            Historical outflow across sold and in-stock vehicles
          </div>
        </div>

        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 bg-amber-950/10 shadow-sm flex flex-col justify-between h-full">
          <div className="h-6 flex items-center justify-between shrink-0">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider truncate">3% Commissions</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold shrink-0">3%</span>
          </div>
          <div className="my-2 flex items-center h-8 shrink-0">
            <span className="text-base sm:text-xl font-black text-amber-400 font-mono tracking-tight leading-none truncate">
              +{formatCurrency(displaySummary.totalFinanceCommission, symbol)}
            </span>
          </div>
          <div className="mt-auto pt-2 border-t border-slate-800/80 text-xs text-amber-400/90 min-h-[28px] flex items-center shrink-0">
            Dealer commission earned
          </div>
        </div>

        <div className="bg-gradient-to-br from-sky-950/30 to-slate-900/90 border border-sky-500/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-full">
          <div className="h-6 flex items-center justify-between shrink-0">
            <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider truncate">Total Net Profit</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold shrink-0">
              {displaySummary.averageProfitMarginPercent.toFixed(1)}%
            </span>
          </div>
          <div className="my-2 flex items-center h-8 shrink-0">
            <span className="text-base sm:text-xl font-black text-sky-400 font-mono tracking-tight leading-none truncate">
              {formatCurrency(displaySummary.totalNetProfit, symbol)}
            </span>
          </div>
          <div className="mt-auto pt-2 border-t border-slate-800/80 text-xs text-sky-400/90 min-h-[28px] flex items-center shrink-0">
            Net realized profit
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bike, buyer, finance provider..."
            aria-label="Search sold bikes, buyers, or finance providers"
            className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 rounded-xl pl-10 pr-4 py-2.5 min-h-[44px] text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all font-medium"
          />
        </div>

        {isAdmin && (
          <select
            value={ownerFilter}
            onChange={(event) => setOwnerFilter(event.target.value)}
            aria-label="Filter sales by user"
            className="w-full md:w-64 bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 rounded-xl px-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm text-slate-200 outline-none"
          >
            <option value="All">All Creators</option>
            {ownerOptions.map((owner) => <option key={owner.uid} value={owner.uid}>{owner.label}</option>)}
          </select>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 w-full sm:w-auto min-h-[44px]" role="group" aria-label="Filter by sale method">
            {(['All', 'Cash', 'Finance'] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setMethodFilter(method)}
                className={`flex-1 sm:flex-initial py-2 px-3.5 min-h-[36px] rounded-lg text-xs font-bold transition-all ${
                  methodFilter === method
                    ? 'bg-sky-500 text-slate-950 shadow-sm font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
                aria-pressed={methodFilter === method}
              >
                {method === 'All' ? 'All Sales' : `${method} Only`}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setDateSort(dateSort === 'desc' ? 'asc' : 'desc')}
            className="w-full sm:w-auto shrink-0 px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 hover:text-white transition-colors flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-sky-400"
            aria-label={`Sort by date: currently ${dateSort === 'desc' ? 'newest first' : 'oldest first'}`}
          >
            <span>Sort:</span>
            <span className="text-sky-400">{dateSort === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>
      </div>

      {/* Transactions Cards */}
      <div className="space-y-4">
        {soldBikes.map((bike) => {
          const sale = bike.sale!;
          const isFinance = sale.saleMethod === 'Finance';

          return (
            <div
              key={sale.id}
              className="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-5 shadow-xl transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div className="flex items-start gap-4">
                  <img
                    src={bike.imageUrl || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80'}
                    alt={bike.model}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-800 shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        isFinance
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      }`}>
                        {sale.saleMethod} SALE
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        {formatDate(sale.saleDate)}
                      </span>
                    </div>

                    <h3 
                      onClick={() => openDetailModalForBike(bike)}
                      className="text-base font-black text-white hover:text-sky-400 cursor-pointer"
                    >
                      {sale.bikeSummary}
                    </h3>

                    <div className="text-xs text-slate-300 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white">{sale.customerName}</span>
                      {sale.customerIdNumber && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
                          NIC: {sale.customerIdNumber}
                        </span>
                      )}
                      <span>•</span>
                      <span className="text-slate-400 font-mono">{sale.customerPhone}</span>
                    </div>

                    {isAdmin && (
                      <div className="text-[10px] text-sky-300 font-medium">
                        Owner: {bike.createdByName || bike.createdByEmail || bike.ownerUid}
                      </div>
                    )}

                    {isFinance && sale.guarantorName && (
                      <div className="text-[11px] text-amber-300/90 flex items-center gap-1.5">
                        <span className="font-semibold text-amber-400">Guarantor:</span>
                        <span>{sale.guarantorName}</span>
                        {sale.guarantorIdNumber && (
                          <span className="font-mono text-[10px] text-slate-400">({sale.guarantorIdNumber})</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Pillars */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex-1 lg:max-w-2xl">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Sale Amount</div>
                    <div className="text-sm font-black text-white mt-0.5 font-mono">
                      {formatCurrency(sale.saleAmount, symbol)}
                    </div>
                    <div className="text-[10px] text-slate-500">{sale.saleMethod}</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Cost</div>
                    <div className="text-sm font-bold text-slate-200 mt-0.5 font-mono">
                      {formatCurrency(sale.totalCost, symbol)}
                    </div>
                    <div className="text-[10px] text-slate-500">Cost + Other</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      {isFinance ? 'Finance Amount' : 'Cash Received'}
                    </div>
                    <div className="text-sm font-bold text-slate-100 mt-0.5 font-mono">
                      {isFinance ? formatCurrency(sale.financeAmount, symbol) : formatCurrency(sale.totalCashReceived, symbol)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {isFinance ? `Dep: ${formatCurrency(sale.customerDeposit, symbol)}` : 'Paid in full'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-amber-300 uppercase font-semibold">3% Finance Comm</div>
                    <div className="text-sm font-black text-amber-400 mt-0.5 font-mono">
                      {isFinance ? `+${formatCurrency(sale.financeCommission, symbol)}` : '—'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {isFinance ? 'Earned from lender' : 'Not applicable'}
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <div className="text-[10px] text-sky-400 uppercase font-bold">Net Profit</div>
                    <div className="text-base font-black text-sky-400 mt-0.5 font-mono">
                      +{formatCurrency(sale.netProfit, symbol)}
                    </div>
                    <div className="text-[10px] text-sky-500 font-semibold">
                      {sale.profitMarginPercent.toFixed(1)}% margin
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center justify-end gap-2 shrink-0 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  <button
                    type="button"
                    onClick={() => openInvoiceForSale(sale)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white text-xs font-bold transition-all border border-slate-700 active:scale-95 shadow-sm focus-visible:ring-2 focus-visible:ring-sky-400"
                    title="Print Official Business Letter or Modern Bill"
                    aria-label={`Print documents for sale of ${sale.bikeSummary}`}
                  >
                    <Printer className="w-4 h-4 text-sky-400" aria-hidden="true" />
                    <span>Print Bill / Letter</span>
                  </button>

                  <button
                    onClick={() => setSaleToRevert(bike)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 text-xs font-semibold transition-colors border border-slate-800 focus-visible:ring-2 focus-visible:ring-rose-400"
                    title="Void sale and return vehicle to inventory"
                    aria-label={`Void sale of ${sale.bikeSummary}`}
                  >
                    <RotateCcw className="w-4 h-4" aria-hidden="true" />
                    <span>Void Sale</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {soldBikes.length === 0 && (
          <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 p-8 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto mb-1">
              <ReceiptText className="w-7 h-7" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-white">No sales transactions recorded yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Select any in-stock vehicle in your inventory and click &quot;Record Sale&quot; to execute a Cash or Finance transaction.
            </p>
          </div>
        )}
      </div>

      {/* Accessible In-App Void Confirmation Dialog */}
      {saleToRevert && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="void-dialog-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                <RotateCcw className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h3 id="void-dialog-title" className="text-base font-black text-white">
                  Void Sale Transaction?
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  This will return the vehicle to active showroom inventory.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1 font-medium">
              <div><strong className="text-white">{saleToRevert.sale?.bikeSummary}</strong></div>
              <div className="text-slate-400 font-mono">
                Customer: {saleToRevert.sale?.customerName} • Amount: {formatCurrency(saleToRevert.sale?.saleAmount || 0, symbol)}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSaleToRevert(null)}
                disabled={isRevertingSale}
                className="px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
              >
                Keep Sale Record
              </button>
              <button
                type="button"
                onClick={handleConfirmRevert}
                disabled={isRevertingSale}
                className="px-5 py-2.5 min-h-[44px] rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs shadow-lg shadow-sky-500/25 transition-all active:scale-95"
              >
                {isRevertingSale ? 'Saving...' : 'Confirm Void Sale'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
