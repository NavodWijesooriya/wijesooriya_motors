import React, { useState } from 'react';
import { useDealership } from '../context/DealershipContext';
import { 
  X, 
  Wrench, 
  DollarSign, 
  Receipt, 
  CheckCircle2, 
  Plus,
  Trash2,
  TrendingUp,
  Truck,
  FileText,
  SlidersHorizontal,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate, calculateTotalOtherCosts } from '../utils/formatters';
import { OtherCostCategory } from '../types';
import { useAuth } from '../../context/AuthContext';

export const BikeDetailModal: React.FC = () => {
  const { isAdmin } = useAuth();
  const { 
    selectedBike: selectedBikeSnapshot,
    bikes,
    isDetailModalOpen, 
    setIsDetailModalOpen, 
    openSaleModalForBike, 
    openEditModalForBike, 
    openInvoiceForSale, 
    addRepairItem, 
    removeRepairItem,
    settings 
  } = useDealership();

  const [showAddOtherCost, setShowAddOtherCost] = useState(false);
  const [costCategory, setCostCategory] = useState<OtherCostCategory>('Repair');
  const [costDesc, setCostDesc] = useState('');
  const [costAmount, setCostAmount] = useState<number | ''>('');
  const [costInvoice, setCostInvoice] = useState('');
  const [costError, setCostError] = useState('');
  const [isSavingCost, setIsSavingCost] = useState(false);

  if (!isDetailModalOpen || !selectedBikeSnapshot) return null;

  const selectedBike = bikes.find((bike) => bike.id === selectedBikeSnapshot.id) || selectedBikeSnapshot;
  const symbol = settings.currencySymbol;
  const isSold = selectedBike.status === 'Sold';
  const totalOtherCosts = calculateTotalOtherCosts(selectedBike.repairCosts);
  const costPrice = selectedBike.purchasePrice;
  const totalCost = selectedBike.totalCost;
  const sellingPrice = isSold && selectedBike.sale ? selectedBike.sale.saleAmount : selectedBike.targetSalePrice;
  const netProfit = isSold && selectedBike.sale ? selectedBike.sale.netProfit : (sellingPrice - totalCost);
  const profitMarginPercent = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;

  const handleSaveOtherCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!costAmount || Number(costAmount) <= 0) return;
    if (isSavingCost) return;
    setCostError('');
    setIsSavingCost(true);
    try {
      await addRepairItem(selectedBike.id, {
        category: costCategory,
        description: costDesc.trim() || `${costCategory} Expense`,
        cost: Number(costAmount),
        date: new Date().toISOString().split('T')[0],
        ...(costInvoice.trim() ? { invoiceRef: costInvoice.trim() } : {})
      });
      setCostDesc('');
      setCostAmount('');
      setCostInvoice('');
      setShowAddOtherCost(false);
    } catch (error) {
      setCostError(error instanceof Error ? error.message : 'The expense could not be saved.');
    } finally {
      setIsSavingCost(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bike-detail-title"
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-4 sm:my-6">
        
        {/* Hero Photo Header */}
        <div className="relative min-h-[280px] sm:h-72 w-full bg-slate-950 overflow-hidden flex flex-col justify-between">
          <img
            src={selectedBike.imageUrl || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80'}
            alt={`${selectedBike.year} ${selectedBike.make} ${selectedBike.model}`}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/30" />

          {/* Top badges & close */}
          <div className="relative z-10 p-4 flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide shadow-lg ${
                isSold ? 'bg-emerald-500 text-slate-950' : 'bg-sky-500 text-slate-950'
              }`}>
                {selectedBike.status.toUpperCase()}
              </span>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-950/80 backdrop-blur-md text-slate-200 border border-slate-700">
                {selectedBike.category}
              </span>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-950/80 backdrop-blur-md text-amber-300 border border-slate-700">
                {selectedBike.condition}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsDetailModalOpen(false)}
              className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-950/80 text-slate-300 hover:text-white border border-slate-700 backdrop-blur-md transition-colors focus-visible:ring-2 focus-visible:ring-sky-400 shrink-0"
              aria-label="Close vehicle details dialog"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Title & Action Buttons */}
          <div className="relative z-10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h1 id="bike-detail-title" className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight drop-shadow-md">
                {selectedBike.year} {selectedBike.make} {selectedBike.model}
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-300 mt-1 font-mono">
                <span className="bg-slate-950/80 px-2.5 py-1 rounded border border-slate-700">
                  Plate: <strong className="text-white">{selectedBike.regPlate}</strong>
                </span>
                {selectedBike.vin && (
                  <span className="bg-slate-950/80 px-2.5 py-1 rounded border border-slate-700">
                    VIN: {selectedBike.vin}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  openEditModalForBike(selectedBike);
                }}
                className="px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                Edit Specs
              </button>

              {!isSold ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    openSaleModalForBike(selectedBike);
                  }}
                  className="px-5 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/25 transition-transform active:scale-95 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  Record Sale
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    openInvoiceForSale(selectedBike.sale!);
                  }}
                  className="px-5 py-2.5 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs sm:text-sm border border-emerald-500/30 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <Receipt className="w-4 h-4" aria-hidden="true" />
                  <span>View Bill of Sale</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[62vh] overflow-y-auto">
          {/* Quick Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Engine Capacity</span>
              <div className="text-sm font-bold text-white mt-0.5">{selectedBike.engineCapacityCc} cc</div>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Mileage</span>
              <div className="text-sm font-bold text-white mt-0.5">{formatNumber(selectedBike.mileage)} km</div>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Color</span>
              <div className="text-sm font-bold text-white mt-0.5">{selectedBike.color}</div>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Acquired On</span>
              <div className="text-sm font-bold text-white mt-0.5">{formatDate(selectedBike.purchaseDate)}</div>
            </div>
          </div>

          {isAdmin && (
            <section className="p-4 rounded-xl bg-slate-950 border border-sky-500/20 space-y-3" aria-label="Record creator and audit information">
              <h3 className="text-xs font-bold text-sky-300 uppercase">Creator & Audit</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-slate-400">Created by</div>
                  <div className="mt-1 text-white font-semibold">{selectedBike.createdByName || 'Unknown creator'}</div>
                  <div className="text-slate-300 break-all">{selectedBike.createdByEmail || 'Email unavailable'}</div>
                  <div className="text-slate-500 font-mono break-all">UID: {selectedBike.createdBy || 'Unavailable'}</div>
                </div>
                <div>
                  <div className="text-slate-400">Last updated</div>
                  <div className="mt-1 text-white">{formatDate(selectedBike.updatedAt)}</div>
                  <div className="text-slate-300">{selectedBike.updatedByName || 'Unknown user'}{selectedBike.updatedByEmail ? ` (${selectedBike.updatedByEmail})` : ''}</div>
                  <div className="text-slate-500 font-mono break-all">UID: {selectedBike.updatedBy || 'Unavailable'}</div>
                </div>
                <div className="text-slate-400">Created <span className="text-slate-200">{formatDate(selectedBike.createdAt)}</span></div>
              </div>
            </section>
          )}

          {/* Financial Statement & Profit Feature */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Cost, Expense & Profit Statement (LKR)
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                ID: {selectedBike.id}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">1. Cost Price</span>
                <div className="text-base font-black text-slate-100 mt-1 font-mono">
                  {formatCurrency(costPrice, symbol)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Base purchase</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-amber-400 uppercase font-semibold">2. Other Costs</span>
                <div className="text-base font-black text-amber-400 mt-1 font-mono">
                  +{formatCurrency(totalOtherCosts, symbol)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{selectedBike.repairCosts.length} expenses logged</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-white uppercase font-black">3. Total Cost</span>
                <div className="text-base font-black text-white mt-1 font-mono">
                  {formatCurrency(totalCost, symbol)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Cost Price + Other Expenses</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-sky-400 uppercase font-semibold">
                  {isSold ? '4. Sale Amount' : '4. Target Price'}
                </span>
                <div className="text-base font-black text-sky-400 mt-1 font-mono">
                  {formatCurrency(sellingPrice, symbol)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {isSold ? 'Agreed price' : 'Listing price'}
                </div>
              </div>
            </div>

            {/* Profit Result Card */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  {isSold ? 'Realized Net Profit' : 'Projected Profit'}
                </span>
                <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                  +{formatCurrency(netProfit, symbol)}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-black text-emerald-300">
                  {profitMarginPercent.toFixed(1)}% Profit Margin
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Formula: {formatCurrency(sellingPrice, symbol)} − {formatCurrency(totalCost, symbol)}
                </div>
              </div>
            </div>

            {/* Sale details if already sold */}
            {isSold && selectedBike.sale && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white uppercase tracking-wider">
                      Sold via {selectedBike.sale.saleMethod} on {formatDate(selectedBike.sale.saleDate)}
                    </span>
                  </div>
                  <span className="text-slate-400">Customer: <strong className="text-white">{selectedBike.sale.customerName}</strong> ({selectedBike.sale.customerPhone})</span>
                </div>

                {selectedBike.sale.saleMethod === 'Finance' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-800">
                    <div>
                      <span className="text-slate-400 text-[10px]">Finance Amount:</span>
                      <div className="font-bold text-amber-400 font-mono">{formatCurrency(selectedBike.sale.financeAmount, symbol)}</div>
                    </div>
                    <div>
                      <span className="text-amber-300 text-[10px] font-bold">3% Finance Commission:</span>
                      <div className="font-black text-amber-400 font-mono">+{formatCurrency(selectedBike.sale.financeCommission, symbol)}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">Deposit Received:</span>
                      <div className="font-bold text-white font-mono">{formatCurrency(selectedBike.sale.customerDeposit, symbol)}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section: Other Costs (Additional Expenses) */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                Other Costs & Additional Expenses ({selectedBike.repairCosts.length})
              </h3>

              {!isSold && (
                <button
                  type="button"
                  onClick={() => setShowAddOtherCost(!showAddOtherCost)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddOtherCost ? 'Close' : 'Add Other Cost'}</span>
                </button>
              )}
            </div>

            {showAddOtherCost && (
              <form onSubmit={handleSaveOtherCost} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                {costError && <p role="alert" className="text-xs text-rose-300">{costError}</p>}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-3">
                    <select
                      value={costCategory}
                      onChange={(e) => setCostCategory(e.target.value as OtherCostCategory)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white outline-none"
                    >
                      <option value="Repair">Repair</option>
                      <option value="Spare Parts">Spare Parts</option>
                      <option value="Transport">Transport</option>
                      <option value="Documentation">Documentation</option>
                      <option value="Service">Service</option>
                      <option value="Paint/Polish">Paint/Polish</option>
                      <option value="Insurance">Insurance</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      placeholder="Expense description..."
                      value={costDesc}
                      onChange={(e) => setCostDesc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">{symbol}</span>
                    <input
                      type="number"
                      placeholder="Amount"
                      required
                      min="1"
                      step="50"
                      value={costAmount}
                      onChange={(e) => setCostAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-2 text-xs text-white font-mono font-bold outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={isSavingCost}
                      className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
                    >
                      {isSavingCost ? 'Saving...' : 'Save Cost'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {selectedBike.repairCosts.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedBike.repairCosts.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 shrink-0">
                        {item.category || 'Expense'}
                      </span>
                      <span className="font-semibold text-white truncate">{item.description}</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono font-bold text-amber-400">
                        +{formatCurrency(item.cost, symbol)}
                      </span>
                      {!isSold && (
                        <button
                          type="button"
                          onClick={() => void removeRepairItem(selectedBike.id, item.id).catch(() => undefined)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-3 text-xs text-slate-500 bg-slate-900/50 rounded-lg border border-dashed border-slate-800">
                No additional other costs recorded for this vehicle.
              </div>
            )}
          </div>

          {selectedBike.notes && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Notes & History</span>
              <p className="text-slate-200 mt-1 whitespace-pre-wrap leading-relaxed">{selectedBike.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
