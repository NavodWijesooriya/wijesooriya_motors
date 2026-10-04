import React, { useState } from 'react';
import { useDealership } from '../context/DealershipContext';
import { 
  Calculator, 
  Percent, 
  CheckCircle2,
  TrendingUp,
  Coins,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { formatCurrency, computeSaleFinancials } from '../utils/formatters';

export const FinanceSimulatorView: React.FC = () => {
  const { bikes, settings } = useDealership();
  const symbol = settings.currencySymbol;

  const [selectedStockBikeId, setSelectedStockBikeId] = useState<string>('');
  const [purchasePrice, setPurchasePrice] = useState<number>(750000);
  const [repairCost, setRepairCost] = useState<number>(45000);
  const [saleAmount, setSaleAmount] = useState<number>(950000);
  const [financeAmount, setFinanceAmount] = useState<number>(750000);
  const [commissionRate, setCommissionRate] = useState<number>(0.03);

  const handleSelectBike = (bikeId: string) => {
    setSelectedStockBikeId(bikeId);
    if (!bikeId) return;
    const bike = bikes.find(b => b.id === bikeId);
    if (bike) {
      setPurchasePrice(bike.purchasePrice);
      const otherSum = bike.repairCosts.reduce((s, r) => s + (Number(r.cost) || 0), 0);
      setRepairCost(otherSum);
      setSaleAmount(bike.targetSalePrice);
      setFinanceAmount(Math.round(bike.targetSalePrice * 0.8));
    }
  };

  const financeResult = computeSaleFinancials({
    saleMethod: 'Finance',
    saleAmount,
    purchasePrice,
    totalRepairCost: repairCost,
    financeAmount,
    financeCommissionRate: commissionRate
  });

  const cashResult = computeSaleFinancials({
    saleMethod: 'Cash',
    saleAmount,
    purchasePrice,
    totalRepairCost: repairCost
  });

  const additionalProfitFromCommission = financeResult.netProfit - cashResult.netProfit;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn max-w-5xl mx-auto">
      <div className="text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold mb-2">
          <Percent className="w-3.5 h-3.5" />
          <span>Automated 3.0% Lender Commission Engine (LKR)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          3% Finance Commission & Profit <span className="text-amber-400">Simulator</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
          Model vehicle finance deals before quoting customers. Compare Cash vs. Finance side-by-side in Sri Lankan Rupees (LKR) to see how the 3% lender commission maximizes dealership net profit.
        </p>
      </div>

      {bikes.some(b => b.status === 'In Stock') && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs">
            <span className="font-bold text-white">Load from Showroom Stock:</span>
            <p className="text-slate-400">Pre-fill cost price, other expenses, and target prices from existing bikes</p>
          </div>

          <select
            value={selectedStockBikeId}
            onChange={(e) => handleSelectBike(e.target.value)}
            className="bg-slate-950 border border-slate-800 focus:border-amber-400 text-xs text-white rounded-xl px-3 py-2 outline-none w-full sm:w-72"
          >
            <option value="">-- Choose In-Stock Bike (Optional) --</option>
            {bikes.filter(b => b.status === 'In Stock').map(b => (
              <option key={b.id} value={b.id}>
                {b.year} {b.make} {b.model} (Total Cost: {formatCurrency(b.totalCost, symbol)})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Calculator className="w-4 h-4 text-amber-400" />
            Cost & Finance Deal Parameters
          </h2>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label className="text-slate-300 font-semibold">1. Vehicle Cost Price ({symbol})</label>
              <span className="text-slate-400 font-mono">{formatCurrency(purchasePrice, symbol)}</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{symbol}</span>
              <input
                type="number"
                min="0"
                step="5000"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-3.5 py-2.5 text-xs text-white font-mono font-bold outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label className="text-slate-300 font-semibold">2. Other Costs & Expenses ({symbol})</label>
              <span className="text-amber-400 font-mono">+{formatCurrency(repairCost, symbol)}</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{symbol}</span>
              <input
                type="number"
                min="0"
                step="1000"
                value={repairCost}
                onChange={(e) => setRepairCost(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-3.5 py-2.5 text-xs text-white font-mono font-bold outline-none focus:border-amber-400"
              />
            </div>
            <div className="text-[10px] text-slate-500">Repairs, spare parts, transport, documentation</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-300">Total Deal Investment (Cost + Other):</span>
            <span className="font-black text-white font-mono text-sm">{formatCurrency(purchasePrice + repairCost, symbol)}</span>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <div className="flex justify-between text-xs">
              <label className="text-slate-300 font-semibold">3. Agreed Selling Price ({symbol})</label>
              <span className="text-sky-400 font-mono font-bold">{formatCurrency(saleAmount, symbol)}</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{symbol}</span>
              <input
                type="number"
                min="0"
                step="5000"
                value={saleAmount}
                onChange={(e) => setSaleAmount(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-3.5 py-2.5 text-xs text-white font-mono font-bold outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label className="text-slate-300 font-semibold">4. Financed Loan Amount ({symbol})</label>
              <span className="text-amber-400 font-mono font-bold">{formatCurrency(financeAmount, symbol)}</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{symbol}</span>
              <input
                type="number"
                min="0"
                max={saleAmount}
                step="5000"
                value={financeAmount}
                onChange={(e) => setFinanceAmount(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-3.5 py-2.5 text-xs text-amber-300 font-mono font-bold outline-none focus:border-amber-400"
              />
            </div>
            <div className="text-[10px] text-slate-400 flex justify-between">
              <span>Customer Cash Down Payment:</span>
              <strong className="text-white font-mono">{formatCurrency(Math.max(0, saleAmount - financeAmount), symbol)}</strong>
            </div>
          </div>
        </div>

        {/* Results Comparison Side-by-Side */}
        <div className="lg:col-span-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Cash Sale Column */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-slate-400" />
                  Cash Sale
                </span>
                <span className="text-[10px] text-slate-500">100% Cash</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Sale Amount:</span>
                  <span className="font-mono text-white">{formatCurrency(cashResult.saleAmount, symbol)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Cost:</span>
                  <span className="font-mono text-rose-400">-{formatCurrency(cashResult.totalCost, symbol)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Finance Comm:</span>
                  <span className="font-mono text-slate-500">—</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold">
                  <span className="text-slate-300">Total Cash Inflow:</span>
                  <span className="font-mono text-white">{formatCurrency(cashResult.totalCashReceived, symbol)}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Cash Net Profit</span>
                <div className="text-xl font-black text-white font-mono mt-0.5">
                  +{formatCurrency(cashResult.netProfit, symbol)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {cashResult.profitMarginPercent.toFixed(1)}% margin
                </div>
              </div>
            </div>

            {/* Finance Sale Column with 3% Commission */}
            <div className="bg-slate-900/80 border border-amber-500/40 rounded-2xl p-5 space-y-4 bg-amber-950/10 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-amber-400" />
                  Finance Sale
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                  +3% Comm
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Sale Amount:</span>
                  <span className="font-mono text-white">{formatCurrency(financeResult.saleAmount, symbol)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Cost:</span>
                  <span className="font-mono text-rose-400">-{formatCurrency(financeResult.totalCost, symbol)}</span>
                </div>
                <div className="flex justify-between text-amber-300 font-bold">
                  <span>3% Commission:</span>
                  <span className="font-mono text-amber-400">+{formatCurrency(financeResult.financeCommission, symbol)}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold">
                  <span className="text-slate-300">Total Cash Inflow:</span>
                  <span className="font-mono text-white">{formatCurrency(financeResult.totalCashReceived, symbol)}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-400">Finance Net Profit</span>
                <div className="text-xl font-black text-amber-300 font-mono mt-0.5">
                  +{formatCurrency(financeResult.netProfit, symbol)}
                </div>
                <div className="text-[10px] text-amber-400 mt-0.5 font-bold">
                  {financeResult.profitMarginPercent.toFixed(1)}% margin
                </div>
              </div>
            </div>
          </div>

          {/* Advantage Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-amber-950/40 border border-emerald-500/40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Finance Deal Bonus
                </span>
                <div className="text-sm font-black text-white">
                  Earn +{formatCurrency(additionalProfitFromCommission, symbol)} More via 3% Commission
                </div>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-amber-400 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 shrink-0">
              3% of Loan
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
