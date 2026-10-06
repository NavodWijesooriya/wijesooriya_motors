import React, { useState, useEffect } from 'react';
import { useDealership } from '../context/DealershipContext';
import { SaleMethod } from '../types';
import { 
  X, 
  Percent, 
  Coins, 
  CheckCircle2, 
  User, 
  AlertCircle,
  TrendingUp,
  Landmark,
  ShieldCheck,
  Phone,
  CreditCard,
  MapPin,
  Users
} from 'lucide-react';
import { formatCurrency, computeSaleFinancials, calculateTotalOtherCosts } from '../utils/formatters';

export const SaleModal: React.FC = () => {
  const { 
    isSaleModalOpen, 
    setIsSaleModalOpen, 
    selectedBike, 
    bikes, 
    recordSale, 
    settings,
    openInvoiceForSale
  } = useDealership();

  const inStockBikes = bikes.filter((b) => b.status === 'In Stock');

  const [currentBikeId, setCurrentBikeId] = useState<string>(
    selectedBike?.id || (inStockBikes[0]?.id || '')
  );

  const activeBike = bikes.find((b) => b.id === currentBikeId) || selectedBike || inStockBikes[0];

  const [saleMethod, setSaleMethod] = useState<SaleMethod>('Cash');
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [saleAmount, setSaleAmount] = useState<number>(activeBike?.targetSalePrice || 750000);
  const [financeAmount, setFinanceAmount] = useState<number>(
    Math.round((activeBike?.targetSalePrice || 750000) * 0.8)
  );

  // Customer Details (Printed on Document)
  const [customerName, setCustomerName] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerIdNumber, setCustomerIdNumber] = useState<string>('');
  const [customerSecondaryPhone, setCustomerSecondaryPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');

  // Guarantor Details (For Finance Sales - Printed on Document)
  const [guarantorName, setGuarantorName] = useState<string>('');
  const [guarantorAddress, setGuarantorAddress] = useState<string>('');
  const [guarantorPhone, setGuarantorPhone] = useState<string>('');
  const [guarantorIdNumber, setGuarantorIdNumber] = useState<string>('');

  // Finance Provider info
  const [financeProvider, setFinanceProvider] = useState<string>('Commercial Leasing & Finance');
  const [financeAgreementNumber, setFinanceAgreementNumber] = useState<string>(
    `WM-FIN-${Date.now().toString().slice(-6)}`
  );
  const [financeTermMonths, setFinanceTermMonths] = useState<number>(36);
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeBike) {
      setCurrentBikeId(activeBike.id);
      setSaleAmount(activeBike.targetSalePrice);
      setFinanceAmount(Math.round(activeBike.targetSalePrice * 0.8));
    }
    setFormError('');
  }, [activeBike?.id, isSaleModalOpen]);

  if (!isSaleModalOpen) return null;

  if (!activeBike) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full text-center">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No In-Stock Vehicles</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            You currently have no vehicles in stock to sell. Please add a vehicle first.
          </p>
          <button
            onClick={() => setIsSaleModalOpen(false)}
            className="px-5 py-2.5 min-h-[44px] rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const symbol = settings.currencySymbol;
  const costPrice = activeBike.purchasePrice;
  const totalOtherCosts = calculateTotalOtherCosts(activeBike.repairCosts);
  const totalCost = activeBike.totalCost;

  const financials = computeSaleFinancials({
    saleMethod,
    saleAmount,
    purchasePrice: costPrice,
    totalRepairCost: totalOtherCosts,
    financeAmount,
    financeCommissionRate: 0.03
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setFormError('');

    if (!customerName.trim()) {
      setFormError('Please enter the customer name.');
      return;
    }

    if (saleMethod === 'Finance') {
      if (!customerAddress.trim()) {
        setFormError('Please enter the customer address for the finance sale document.');
        return;
      }
      if (!customerPhone.trim()) {
        setFormError('Please enter the customer phone number for the finance sale document.');
        return;
      }
      if (!customerIdNumber.trim()) {
        setFormError('Please enter the customer ID / NIC number for the finance sale document.');
        return;
      }
      if (!customerSecondaryPhone.trim()) {
        setFormError('Please enter the customer’s second phone number for the finance sale document.');
        return;
      }
      if (!guarantorName.trim()) {
        setFormError('Please enter the guarantor’s name for the finance sale document.');
        return;
      }
      if (!guarantorAddress.trim()) {
        setFormError('Please enter the guarantor’s address for the finance sale document.');
        return;
      }
      if (!guarantorPhone.trim()) {
        setFormError('Please enter the guarantor’s phone number for the finance sale document.');
        return;
      }
      if (!guarantorIdNumber.trim()) {
        setFormError('Please enter the guarantor’s ID / NIC number for the finance sale document.');
        return;
      }
      if (financeAmount <= 0 || financeAmount > saleAmount) {
        setFormError(`Please specify a valid finance amount between ${symbol} 1 and ${formatCurrency(saleAmount, symbol)}.`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const saleRecord = await recordSale(activeBike.id, {
      saleDate,
      saleMethod,
      saleAmount,
      purchasePrice: costPrice,
      totalRepairCost: totalOtherCosts,
      totalCost,
      financeAmount: saleMethod === 'Finance' ? financials.financeAmount : 0,
      financeCommissionRate: saleMethod === 'Finance' ? 0.03 : 0,
      financeCommission: financials.financeCommission,
      customerDeposit: financials.customerDeposit,
      totalCashReceived: financials.totalCashReceived,
      netProfit: financials.netProfit,
      profitMarginPercent: financials.profitMarginPercent,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || 'N/A',
      customerIdNumber: customerIdNumber.trim() || undefined,
      customerSecondaryPhone: customerSecondaryPhone.trim() || undefined,
      customerAddress: customerAddress.trim() || undefined,
      customerEmail: customerEmail.trim() || undefined,
      guarantorName: saleMethod === 'Finance' ? guarantorName.trim() : undefined,
      guarantorAddress: saleMethod === 'Finance' ? guarantorAddress.trim() : undefined,
      guarantorPhone: saleMethod === 'Finance' ? guarantorPhone.trim() : undefined,
      guarantorIdNumber: saleMethod === 'Finance' ? guarantorIdNumber.trim() : undefined,
      financeProvider: saleMethod === 'Finance' ? financeProvider.trim() : undefined,
      financeAgreementNumber: saleMethod === 'Finance' ? financeAgreementNumber.trim() : undefined,
      financeTermMonths: saleMethod === 'Finance' ? financeTermMonths : undefined,
      notes: notes.trim() || undefined,
      bikeSummary: `${activeBike.year} ${activeBike.make} ${activeBike.model}`
      });

      setIsSaleModalOpen(false);
    
      setTimeout(() => {
        openInvoiceForSale(saleRecord);
      }, 200);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Sale could not be saved. Check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sale-modal-title"
    >
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-4 sm:my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                Sales POS
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Sales & Agreement Terminal
              </span>
            </div>
            <h2 id="sale-modal-title" className="text-lg sm:text-xl font-black text-white mt-1">
              Record Vehicle Sale ({saleMethod === 'Finance' ? 'Finance Sale' : 'Cash Sale'})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsSaleModalOpen(false)}
            disabled={isSaving}
            className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-sky-400"
            aria-label="Close sale modal"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Accessible Form Error Alert */}
          {formError && (
            <div 
              role="alert"
              className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn"
            >
              <div className="w-6 h-6 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-rose-400" aria-hidden="true" />
              </div>
              <span className="font-semibold">{formError}</span>
            </div>
          )}

          {/* Vehicle Selection */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={activeBike.imageUrl || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80'}
                alt={activeBike.model}
                className="w-14 h-14 rounded-xl object-cover border border-slate-800"
              />
              <div>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Selected Vehicle</span>
                <div className="text-base font-black text-white">
                  {activeBike.year} {activeBike.make} {activeBike.model}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Plate: <strong className="text-slate-200">{activeBike.regPlate}</strong> • VIN: <strong className="text-slate-200">{activeBike.vin || 'N/A'}</strong>
                </div>
              </div>
            </div>

            {inStockBikes.length > 1 && (
              <select
                value={currentBikeId}
                onChange={(e) => setCurrentBikeId(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 outline-none font-bold"
              >
                {inStockBikes.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.year} {b.make} {b.model} ({b.regPlate})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Sale Method Selector: Cash vs Finance */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              1. Choose Payment Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSaleMethod('Cash')}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                  saleMethod === 'Cash'
                    ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Coins className={`w-6 h-6 ${saleMethod === 'Cash' ? 'text-emerald-400' : 'text-slate-500'}`} />
                <div>
                  <div className="text-sm font-black">Cash Sale</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Paid directly in full</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSaleMethod('Finance')}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                  saleMethod === 'Finance'
                    ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Percent className={`w-6 h-6 ${saleMethod === 'Finance' ? 'text-amber-400' : 'text-slate-500'}`} />
                <div>
                  <div className="text-sm font-black flex items-center justify-center gap-1">
                    <span>Finance Sale</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 text-[10px] font-bold">Guarantor & Terms</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">With customer & guarantor agreement</div>
                </div>
              </button>
            </div>
          </div>

          {/* Pricing & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Selling Price of the Bike ({symbol}) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{symbol}</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={saleAmount}
                  onChange={(e) => {
                    const newAmount = Number(e.target.value) || 0;
                    setSaleAmount(newAmount);
                    if (financeAmount > newAmount) {
                      setFinanceAmount(newAmount);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-3.5 py-2.5 text-sm text-white font-mono font-black outline-none focus:border-emerald-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                This is the total agreed selling price shown on the customer document.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Sale Date *</label>
              <input
                type="date"
                required
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none"
              />
            </div>
          </div>

          {/* Finance Loan Particulars (When Finance Sale is Selected) */}
          {saleMethod === 'Finance' && (
            <div className="p-4 sm:p-5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                    Finance Particulars (Printed on Finance Agreement)
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                  Hire Purchase / Loan
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Finance Amount ({symbol}) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{symbol}</span>
                    <input
                      type="number"
                      required
                      min="0"
                      max={saleAmount}
                      step="1000"
                      value={financeAmount}
                      onChange={(e) => setFinanceAmount(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-amber-500/40 rounded-xl pl-12 pr-3.5 py-2.5 text-sm text-amber-300 font-mono font-black outline-none"
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                    <span>Customer Down Payment:</span>
                    <strong className="text-white font-mono">{formatCurrency(financials.customerDeposit, symbol)}</strong>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Finance Institution / Bank *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Commercial Leasing, LB Finance, LOLC, People's Leasing"
                    value={financeProvider}
                    onChange={(e) => setFinanceProvider(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                  />
                  <div className="text-[10px] text-slate-400 mt-1">
                    Name of financing company printed on customer document.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Agreement / File Reference Number</label>
                  <input
                    type="text"
                    value={financeAgreementNumber}
                    onChange={(e) => setFinanceAgreementNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Repayment Term (Months)</label>
                  <input
                    type="number"
                    min="1"
                    max="84"
                    value={financeTermMonths}
                    onChange={(e) => setFinanceTermMonths(Number(e.target.value) || 36)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Customer Details */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-sky-400" />
                Customer Information {saleMethod === 'Finance' ? '(Buyer / Borrower)' : '(Buyer)'}
              </h3>
              <span className="text-[10px] text-slate-400">
                Printed on customer sale document
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kasun Chamara Perera"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-sky-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Customer ID Number (NIC) {saleMethod === 'Finance' && '*'}
                </label>
                <div className="relative">
                  <CreditCard className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required={saleMethod === 'Finance'}
                    placeholder="e.g. 199012345678 / 901234567V"
                    value={customerIdNumber}
                    onChange={(e) => setCustomerIdNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white font-mono outline-none focus:border-sky-500 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Customer Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 077 123 4567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white font-mono outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Customer’s Second Phone Number {saleMethod === 'Finance' && '*'}
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required={saleMethod === 'Finance'}
                    placeholder="e.g. 071 987 6543 / 011 234 5678"
                    value={customerSecondaryPhone}
                    onChange={(e) => setCustomerSecondaryPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white font-mono outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Customer Address {saleMethod === 'Finance' && '*'}
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <textarea
                    rows={2}
                    required={saleMethod === 'Finance'}
                    placeholder="e.g. No. 45, Temple Road, Maharagama, Sri Lanka"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Guarantor Details (Required for Finance Sales) */}
          {saleMethod === 'Finance' && (
            <div className="p-4 sm:p-5 rounded-xl bg-slate-950 border border-amber-500/30 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                    Guarantor Information (Printed on Finance Agreement)
                  </h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                  Required for Finance
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Guarantor’s Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nimal Jayasuriya"
                    value={guarantorName}
                    onChange={(e) => setGuarantorName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Guarantor’s ID Number (NIC) *
                  </label>
                  <div className="relative">
                    <CreditCard className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 198598765432 / 859876543V"
                      value={guarantorIdNumber}
                      onChange={(e) => setGuarantorIdNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white font-mono outline-none focus:border-amber-500 uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Guarantor’s Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 076 543 2109"
                      value={guarantorPhone}
                      onChange={(e) => setGuarantorPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white font-mono outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Guarantor’s Residential Address *
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <textarea
                      rows={2}
                      required
                      placeholder="e.g. No. 12, Kandy Road, Kiribathgoda, Sri Lanka"
                      value={guarantorAddress}
                      onChange={(e) => setGuarantorAddress(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Internal Business Profit Reconciliation (Private for Dealer) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Internal Profit Calculator (Dealer Terminal Only)
              </h3>
              <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-bold">
                Private — Not printed on customer document
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">Cost Price</span>
                <div className="text-sm font-bold text-slate-200 mt-1 font-mono">
                  {formatCurrency(costPrice, symbol)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-amber-400 uppercase">+ Other Costs</span>
                <div className="text-sm font-bold text-amber-400 mt-1 font-mono">
                  +{formatCurrency(totalOtherCosts, symbol)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-white uppercase font-black">= Total Cost</span>
                <div className="text-sm font-black text-white mt-1 font-mono">
                  {formatCurrency(totalCost, symbol)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-sky-400 uppercase font-semibold">Total Cash Inflow</span>
                <div className="text-sm font-black text-sky-400 mt-1 font-mono">
                  {formatCurrency(financials.totalCashReceived, symbol)}
                </div>
                {saleMethod === 'Finance' && (
                  <div className="text-[9px] text-amber-400 mt-0.5 font-bold">Includes 3% Commission</div>
                )}
              </div>
            </div>

            {/* Net Profit Banner */}
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Net Dealership Profit
                </span>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5">
                  +{formatCurrency(financials.netProfit, symbol)}
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-black text-emerald-300">
                  {financials.profitMarginPercent.toFixed(1)}% Margin
                </span>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {saleMethod === 'Cash'
                    ? 'Sale Amount − Total Cost'
                    : 'Sale Amount + 3% Comm − Total Cost'}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-3 border-t border-slate-800 sticky bottom-0 bg-slate-900/95 py-2.5 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setIsSaleModalOpen(false)}
              className="px-5 py-2.5 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 sm:flex-initial px-8 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-transform active:scale-95 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
              <span>{isSaving ? 'Saving...' : 'Finalize Sale & Generate Customer Document'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
