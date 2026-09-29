import React, { useState, useEffect } from 'react';
import { useDealership } from '../context/DealershipContext';
import { 
  X, 
  Printer, 
  Bike as BikeIcon,
  CheckCircle2,
  Landmark,
  User,
  Users,
  CreditCard,
  Phone,
  MapPin,
  Calendar,
  FileText,
  ArrowLeft,
  Coins,
  ShieldCheck,
  Download,
  Copy,
  Check,
  Loader2,
  Receipt,
  QrCode,
  Building2,
  BadgeCheck
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  printDocumentElement, 
  downloadDocumentAsHtml, 
  buildFormalLetterPlainText,
  buildModernBillPlainText
} from '../utils/printDocument';

export const InvoiceModal: React.FC = () => {
  const { 
    isInvoiceModalOpen, 
    setIsInvoiceModalOpen, 
    selectedSaleRecord, 
    selectedBike, 
    bikes, 
    settings 
  } = useDealership();

  // Document format: 'bill' (Modern Bill of Sale) or 'letter' (Formal Letter)
  const [documentFormat, setDocumentFormat] = useState<'bill' | 'letter'>('bill');
  const [hasPrinted, setHasPrinted] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const handleAfterPrint = () => {
      setHasPrinted(true);
      setIsPrinting(false);
    };

    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  // Reset print status when modal opens
  useEffect(() => {
    if (isInvoiceModalOpen) {
      setHasPrinted(false);
      setIsPrinting(false);
      setCopied(false);
      setDocumentFormat('bill'); // Default to Modern Bill Template
    }
  }, [isInvoiceModalOpen]);

  if (!isInvoiceModalOpen || !selectedSaleRecord) return null;

  const sale = selectedSaleRecord;
  const bike = selectedBike || bikes.find((b) => b.id === sale.bikeId);
  const symbol = settings.currencySymbol;
  const isFinance = sale.saleMethod === 'Finance';

  // For finance: Remaining balance owed under the financing agreement
  // Full price - down payment = remaining financed principal
  const remainingBalance = Math.max(0, sale.saleAmount - (sale.customerDeposit || 0));

  const activeElementId = documentFormat === 'bill' ? 'printable-bill-of-sale' : 'printable-formal-letter';
  const docTitle = `${settings.dealershipName} - ${documentFormat === 'bill' ? 'Modern Bill of Sale' : 'Formal Letter'} - ${bike?.regPlate || sale.id}`;

  const handlePrint = () => {
    setIsPrinting(true);
    setHasPrinted(true);

    // Call robust printer that handles hidden iframe + window.print fallbacks
    printDocumentElement(activeElementId, docTitle);

    setTimeout(() => {
      setIsPrinting(false);
    }, 1500);
  };

  const handleDownloadHtml = () => {
    const fileName = `${settings.dealershipName.replace(/\s+/g, '_')}_${documentFormat === 'bill' ? 'Bill_of_Sale' : 'Formal_Letter'}_${bike?.regPlate || sale.id}`;
    const success = downloadDocumentAsHtml(activeElementId, fileName);
    if (success) {
      setHasPrinted(true);
    }
  };

  const handleCopyText = async () => {
    const text = documentFormat === 'bill'
      ? buildModernBillPlainText(sale, bike, settings, isFinance)
      : buildFormalLetterPlainText(sale, bike, settings, isFinance);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Copy text failed:', e);
    }
  };

  const handleBack = () => {
    setIsInvoiceModalOpen(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto print-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-modal-title"
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-4 sm:my-6 print:border-none print:shadow-none print:bg-white print:text-black print:my-0 print:max-w-none print:overflow-visible print-modal-card">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950/90 print:hidden space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Left: Back Button & Document Title */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all border border-slate-700 active:scale-95 focus-visible:ring-2 focus-visible:ring-sky-400"
                title="Return to Sales"
                aria-label="Return to Sales view"
              >
                <ArrowLeft className="w-4 h-4 text-sky-400" aria-hidden="true" />
                <span>Back to Sales</span>
              </button>

              <div className="hidden sm:block h-6 w-px bg-slate-800" />

              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                  isFinance 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {isFinance ? 'Finance Sale' : 'Cash Sale'}
                </span>
                <span id="invoice-modal-title" className="text-xs font-mono text-slate-300 font-bold hidden sm:inline">
                  {bike?.regPlate || 'UNREGISTERED'}
                </span>
              </div>
            </div>

            {/* Center: Format Switcher */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setDocumentFormat('bill')}
                aria-pressed={documentFormat === 'bill'}
                className={`flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg font-bold transition-all focus-visible:ring-2 focus-visible:ring-sky-400 ${
                  documentFormat === 'bill'
                    ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Modern Bill</span>
              </button>

              <button
                type="button"
                onClick={() => setDocumentFormat('letter')}
                aria-pressed={documentFormat === 'letter'}
                className={`flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg font-bold transition-all focus-visible:ring-2 focus-visible:ring-sky-400 ${
                  documentFormat === 'letter'
                    ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Formal Letter</span>
              </button>
            </div>

            {/* Right: Print Button, Download PDF, Copy, and Close */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyText}
                className="hidden md:flex items-center gap-1 px-3 py-2 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-sky-400"
                title="Copy bill text to clipboard"
                aria-label="Copy document text to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadHtml}
                className="flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white text-xs font-bold border border-slate-700 transition-colors active:scale-95 focus-visible:ring-2 focus-visible:ring-sky-400"
                title="Save document as printable HTML/PDF file"
                aria-label="Download document as PDF or HTML"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
                <span className="hidden sm:inline">Save /</span><span>PDF</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                disabled={isPrinting}
                className="flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-75 focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-label={`Print ${documentFormat === 'bill' ? 'Modern Bill' : 'Formal Letter'}`}
              >
                {isPrinting ? (
                  <Loader2 className="w-4 h-4 text-slate-950 animate-spin" aria-hidden="true" />
                ) : (
                  <Printer className="w-4 h-4 text-slate-950 stroke-[2.5]" aria-hidden="true" />
                )}
                <span>{isPrinting ? 'Printing...' : `Print ${documentFormat === 'bill' ? 'Modern Bill' : 'Formal Letter'}`}</span>
              </button>

              <button
                type="button"
                onClick={handleBack}
                className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-sky-400"
                title="Close dialog"
                aria-label="Close document dialog"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Mobile Helper Hint */}
          <div className="sm:hidden text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
            <span>📄 Fit: 1-Page Official Document</span>
            <span>Pinch or scroll to preview</span>
          </div>
        </div>

        {/* Post-Print Notification Banner (shown if user has just printed, giving clear back guidance) */}
        {hasPrinted && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-300 print:hidden animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Document sent to printer or saved. Click <strong>Back to Sales</strong> to return to your records anytime:</span>
            </div>
            <button
              onClick={handleBack}
              className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors flex items-center gap-1 shrink-0 ml-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sales</span>
            </button>
          </div>
        )}

        {/* Document Scrollable Canvas with Desk Workspace Backdrop */}
        <div className="bg-slate-950/90 p-3 sm:p-8 max-h-[82vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0 print:bg-white flex justify-center">

        {/* ========================================================================= */}
        {/* DOCUMENT VIEW 1: FORMAL LETTER FORMAT (ONE PAGE GUARANTEED)               */}
        {/* ========================================================================= */}
        {documentFormat === 'letter' && (
          <div 
            id="printable-formal-letter" 
            className="bg-white text-slate-900 w-full max-w-[800px] p-4 sm:p-5 print:p-2 rounded-2xl shadow-2xl border border-slate-200/90 print:border-none print:shadow-none print:p-0 print:rounded-none font-sans text-xs leading-tight space-y-2.5 print:space-y-1.5"
          >
            {/* 1. Compact Executive Letterhead Header */}
            <div className="border-b-2 border-slate-900 pb-2.5">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center font-black shadow-md shrink-0">
                      <BikeIcon className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight uppercase">
                          {settings.dealershipName}
                        </h1>
                        <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-slate-100 border border-slate-300 text-slate-700 text-[9px] font-mono font-bold uppercase">
                          Authorized Dealership
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-600 tracking-wide mt-0.2">
                        {settings.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Dealership Coordinates */}
                  <div className="mt-1.5 text-[10px] sm:text-[11px] text-slate-600 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-700 shrink-0" />
                      <span>{settings.address}</span>
                    </div>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-700 shrink-0" />
                      <span>Hotline: <strong className="text-slate-900 font-mono">{settings.phone}</strong></span>
                    </span>
                    <span>•</span>
                    <span>Email: {settings.email}</span>
                    {settings.taxNumber && (
                      <>
                        <span>•</span>
                        <span className="font-mono">Reg: {settings.taxNumber}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Letter Reference & Date Box */}
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-left sm:text-right min-w-[190px] shrink-0">
                  <div className="text-[9px] uppercase font-mono tracking-wider text-slate-500 font-bold">
                    Official Formal Letter
                  </div>
                  <div className="font-mono text-[11px] font-bold text-slate-800 mt-0.2">
                    Ref: <strong className="text-slate-950 font-black">WM-LTR-{sale.id.toUpperCase()}</strong>
                  </div>
                  <div className="mt-0.5 flex sm:justify-end items-center gap-1 text-[10px] text-slate-600 font-mono">
                    <Calendar className="w-3 h-3 text-slate-600" />
                    <span>Date: <strong className="text-slate-900 font-mono">{formatDate(sale.saleDate)}</strong></span>
                  </div>
                  <div className="mt-1 pt-1 border-t border-slate-200 flex items-center sm:justify-end gap-1.5 text-[10px] font-bold">
                    <span className={`w-1.5 h-1.5 rounded-full ${isFinance ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <span className="uppercase tracking-wider text-slate-800">
                      {isFinance ? 'Finance Sale' : 'Cash Sale'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Addressee: Customer Details Card */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <div className="text-[9px] uppercase font-black text-slate-500 tracking-wider flex items-center justify-between border-b border-slate-200 pb-1">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-700" />
                  <span>To (Buyer / Customer / Hirer):</span>
                </span>
                <span className="text-[9px] font-mono text-emerald-700 font-semibold">Verified Purchaser</span>
              </div>
              <div className="text-xs font-black text-slate-950">
                {sale.customerName}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] text-slate-700">
                <div>
                  <span className="text-slate-500 font-semibold">Address: </span>
                  <span className="text-slate-900">{sale.customerAddress || 'Not Provided'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Customer ID (NIC): </span>
                  <span className="font-mono font-bold text-slate-950">{sale.customerIdNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Primary Phone: </span>
                  <span className="font-mono font-bold text-slate-950">{sale.customerPhone}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Second Phone: </span>
                  <span className="font-mono font-bold text-slate-950">{sale.customerSecondaryPhone || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* 3. Formal Letter Salutation & Subject */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-800">
                Dear <strong className="text-slate-950">{sale.customerName}</strong>,
              </div>

              <div className="p-2 rounded-lg bg-slate-100 border-l-4 border-slate-900 border border-slate-200">
                <div className="text-[11px] font-black text-slate-950 uppercase tracking-tight">
                  SUBJECT: OFFICIAL VEHICLE SALE CONFIRMATION & HANDOVER LETTER
                </div>
                <div className="text-[10px] text-slate-700 font-semibold mt-0.5 flex flex-wrap items-center gap-x-2.5">
                  <span>REG NUMBER: <strong className="text-slate-950 font-mono font-black">{bike?.regPlate || 'UNREGISTERED'}</strong></span>
                  <span>•</span>
                  <span>PAYMENT: <strong className="text-slate-950 uppercase font-black">{sale.saleMethod} SALE</strong></span>
                </div>
              </div>

              <p className="text-[10px] text-slate-700 leading-snug">
                We are pleased to officially confirm the successful sale, registration transfer, and delivery of the motor vehicle detailed below by <strong>{settings.dealershipName}</strong> to the designated purchaser. This letter acts as official proof of transaction, ownership transfer, and agreed settlement terms.
              </p>
            </div>

            {/* 4. Section 1: Motorbike Particulars Schedule */}
            <div className="space-y-1">
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-bold text-slate-600 uppercase">
                      <th className="py-1.5 px-3">Vehicle / Model</th>
                      <th className="py-1.5 px-3 font-mono text-center">Reg Number</th>
                      <th className="py-1.5 px-3 font-mono">Chassis / VIN</th>
                      <th className="py-1.5 px-3 text-center">Displacement</th>
                      <th className="py-1.5 px-3 text-right">Agreed Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-[11px]">
                      <td className="py-2 px-3">
                        <div className="font-black text-slate-950 text-xs">
                          {sale.bikeSummary}
                        </div>
                        {bike && (
                          <div className="text-[10px] text-slate-500 mt-0.2 flex flex-wrap items-center gap-1">
                            <span>Year: <strong>{bike.year}</strong></span>
                            <span>•</span>
                            <span>Color: <strong>{bike.color}</strong></span>
                            <span>•</span>
                            <span>{bike.mileage.toLocaleString()} km</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono font-black text-xs text-slate-950 text-center">
                        {bike?.regPlate || 'UNREGISTERED'}
                      </td>
                      <td className="py-2 px-3 font-mono text-[10px] text-slate-700">
                        {bike?.vin || 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-slate-700 text-center text-[10px]">
                        {bike ? `${bike.engineCapacityCc} cc` : 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-black text-xs text-slate-950">
                        {formatCurrency(sale.saleAmount, symbol)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. Section 2: Payment Terms & Settlement Details */}
            <div className="space-y-1">
              {!isFinance ? (
                /* CASH SALE FINANCIAL PARTICULARS */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">
                      Full Bike Selling Price
                    </span>
                    <div className="text-xs sm:text-sm font-black text-slate-950 font-mono mt-0.5">
                      {formatCurrency(sale.saleAmount, symbol)}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-[9px] text-emerald-700 uppercase font-bold block">
                      Total Amount Paid
                    </span>
                    <div className="text-xs sm:text-sm font-black text-emerald-800 font-mono mt-0.5">
                      {formatCurrency(sale.saleAmount, symbol)}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase font-bold block">
                        Payment Status
                      </span>
                      <div className="text-xs font-black text-emerald-700 uppercase mt-0.2 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Fully Paid (Settled)</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* FINANCE SALE FINANCIAL PARTICULARS */
                <div className="space-y-1">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <span className="text-[8px] text-slate-500 uppercase font-bold block">Full Selling Price</span>
                      <div className="text-xs font-black text-slate-950 font-mono">{formatCurrency(sale.saleAmount, symbol)}</div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <span className="text-[8px] text-emerald-700 uppercase font-bold block">Down Payment</span>
                      <div className="text-xs font-black text-emerald-800 font-mono">{formatCurrency(sale.customerDeposit, symbol)}</div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <span className="text-[8px] text-amber-700 uppercase font-bold block">Finance Amount</span>
                      <div className="text-xs font-black text-amber-800 font-mono">{formatCurrency(sale.financeAmount, symbol)}</div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <span className="text-[8px] text-slate-600 uppercase font-bold block">Remaining Balance</span>
                      <div className="text-xs font-black text-slate-900 font-mono">{formatCurrency(remainingBalance, symbol)}</div>
                    </div>
                  </div>

                  {/* Finance Company Details */}
                  <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] flex items-center justify-between gap-2">
                    <div>
                      <span className="text-slate-500 font-medium">Lessor: </span>
                      <strong className="text-slate-900">{sale.financeProvider || 'Commercial Leasing & Finance PLC'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Ref: </span>
                      <strong className="font-mono text-slate-900">{sale.financeAgreementNumber || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Term: </span>
                      <strong className="text-slate-900">{sale.financeTermMonths ? `${sale.financeTermMonths} Months` : '36 Months'}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Section 3: Guarantor Particulars (Required for Finance Sales) */}
            {isFinance && (
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px] flex items-center justify-between gap-2">
                <div>
                  <span className="text-slate-500">Guarantor: </span>
                  <strong className="text-slate-950 font-bold">{sale.guarantorName || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">NIC: </span>
                  <strong className="font-mono text-slate-900">{sale.guarantorIdNumber || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Phone: </span>
                  <strong className="font-mono text-slate-900">{sale.guarantorPhone || 'N/A'}</strong>
                </div>
              </div>
            )}

            {/* 7. Formal Declaration & Handover Warranty */}
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[9.5px] text-slate-700 leading-snug">
              <p>
                <strong>Certification & Warranty:</strong> <em>{settings.dealershipName}</em> certifies that the aforementioned vehicle is transferred free from undisclosed encumbrances, liens, or ownership disputes, and that vehicle documents, MTA forms, revenue license, and keys have been tendered and accepted.
              </p>
            </div>

            {/* 8. Formal Sign-off & Signatures with Official Seal */}
            <div className="pt-2 border-t-2 border-slate-900">
              <div className={`grid ${isFinance ? 'grid-cols-3' : 'grid-cols-2'} gap-3 text-xs text-slate-900`}>
                {/* Dealership Sign-off */}
                <div>
                  <div className="h-10 border-b border-dashed border-slate-400 mb-1 flex items-end justify-center pb-0.5 text-[9px] text-slate-400 font-mono">
                    (Authorized Seal & Stamp)
                  </div>
                  <div className="font-black text-slate-950 text-[11px] truncate">{settings.dealershipName}</div>
                  <div className="text-[9px] text-slate-600">Authorized Signatory • Date: ________</div>
                </div>

                {/* Customer Sign-off */}
                <div>
                  <div className="h-10 border-b border-dashed border-slate-400 mb-1 flex items-end justify-center pb-0.5 text-[9px] text-slate-400 font-mono">
                    (Customer Signature)
                  </div>
                  <div className="font-black text-slate-950 text-[11px] truncate">{sale.customerName}</div>
                  <div className="text-[9px] text-slate-600 font-mono">NIC: {sale.customerIdNumber || 'N/A'} • Date: ________</div>
                </div>

                {/* Guarantor Sign-off (if finance) */}
                {isFinance && (
                  <div>
                    <div className="h-10 border-b border-dashed border-slate-400 mb-1 flex items-end justify-center pb-0.5 text-[9px] text-slate-400 font-mono">
                      (Guarantor Signature)
                    </div>
                    <div className="font-black text-slate-950 text-[11px] truncate">{sale.guarantorName || 'Guarantor'}</div>
                    <div className="text-[9px] text-slate-600 font-mono">NIC: {sale.guarantorIdNumber || 'N/A'} • Date: ________</div>
                  </div>
                )}
              </div>
            </div>

            {/* Document Footer */}
            <div className="pt-1.5 border-t border-slate-200 text-center text-[9px] text-slate-500 font-mono">
              {settings.dealershipName} • Official Vehicle Handover & Formal Sale Letter • Ref: WM-LTR-{sale.id.toUpperCase()}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DOCUMENT VIEW 2: MODERN BILL OF SALE TEMPLATE (ONE PAGE GUARANTEED)        */}
        {/* ========================================================================= */}
        {documentFormat === 'bill' && (
          <div 
            id="printable-bill-of-sale" 
            className="bg-white text-slate-900 w-full max-w-[800px] p-4 sm:p-5 print:p-2 rounded-2xl shadow-2xl border border-slate-200/90 print:border-none print:shadow-none print:p-0 print:rounded-none font-sans text-xs leading-tight space-y-2.5 print:space-y-1.5"
          >
            {/* Top Executive Pinstripe Accent */}
            <div className="h-1 w-full bg-gradient-to-r from-slate-900 via-sky-600 to-amber-500 rounded-full" />

            {/* 1. Compact Executive Modern Dealership Header */}
            <div className="pb-2.5 border-b-2 border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center font-black shadow-md border border-slate-800 shrink-0">
                    <BikeIcon className="w-6 h-6 text-sky-400 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight uppercase">
                        {settings.dealershipName}
                      </h1>
                      <span className="hidden sm:inline-flex items-center text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-800 border border-slate-300">
                        Licensed Dealership
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-600 tracking-wide mt-0.2 uppercase">
                      Premier Automotive Sales & Vehicle Management · Colombo, Sri Lanka
                    </p>
                  </div>
                </div>

                {/* Dealership Coordinates Strip */}
                <div className="mt-1.5 text-[10px] sm:text-[11px] text-slate-600 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin className="w-3 h-3 text-slate-700 shrink-0" />
                    <span>{settings.address}</span>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-700 shrink-0" />
                    <span>Hotline: <strong className="text-slate-900 font-mono font-bold">{settings.phone}</strong></span>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-700">{settings.email}</span>
                  {settings.taxNumber && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="font-mono text-slate-700 font-semibold">Reg/VAT: {settings.taxNumber}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Modern Document Reference Lockup */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left sm:text-right min-w-[200px] shrink-0">
                <div className="text-[9px] uppercase font-mono tracking-widest font-black text-slate-500">
                  {isFinance ? 'VEHICLE FINANCE BILL' : 'COMMERCIAL BILL OF SALE'}
                </div>
                <div className="text-base sm:text-lg font-black font-mono text-slate-950 tracking-tight mt-0.2">
                  #WM-INV-{sale.id.toUpperCase()}
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5 flex sm:justify-end items-center gap-1 font-mono">
                  <Calendar className="w-3 h-3 text-slate-600" />
                  <span>Date: <strong className="text-slate-900">{formatDate(sale.saleDate)}</strong></span>
                </div>
                <div className="mt-1 pt-1 border-t border-slate-200 flex items-center sm:justify-end gap-1.5 text-[10px]">
                  <span className={`w-1.5 h-1.5 rounded-full ${isFinance ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <span className={`font-black uppercase tracking-wider text-[10px] ${
                    isFinance ? 'text-amber-800' : 'text-emerald-800'
                  }`}>
                    {isFinance ? 'Finance Sale Agreement' : 'Cash Sale · Paid in Full'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Structured Parties Information Grid */}
            <div className={`grid grid-cols-1 ${isFinance ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-2.5`}>
              
              {/* Buyer / Customer Card */}
              <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <span className="text-[9px] uppercase font-black tracking-wider text-slate-700 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-900" />
                    <span>Customer Details (Buyer / Hirer)</span>
                  </span>
                  <span className="text-[9px] font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded">
                    Verified Buyer
                  </span>
                </div>
                <div className="space-y-0.5 text-[11px]">
                  <div className="text-xs font-black text-slate-950">
                    {sale.customerName}
                  </div>
                  <div className="text-slate-700 flex items-center justify-between">
                    <span className="text-slate-500">NIC / ID:</span>
                    <strong className="font-mono text-slate-950">{sale.customerIdNumber || 'N/A'}</strong>
                  </div>
                  <div className="text-slate-700 flex items-center justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <strong className="font-mono text-slate-950">{sale.customerPhone}</strong>
                  </div>
                  <div className="text-slate-700 truncate" title={sale.customerAddress || 'Not Provided'}>
                    <span className="text-slate-500">Address: </span>
                    <span className="text-slate-950 font-medium">{sale.customerAddress || 'Not Provided'}</span>
                  </div>
                </div>
              </div>

              {/* Vendor / Dealership Card */}
              <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <span className="text-[9px] uppercase font-black tracking-wider text-slate-700 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-900" />
                    <span>Vendor / Dealership Origin</span>
                  </span>
                  <span className="text-[9px] font-mono text-slate-700 font-semibold bg-slate-200/80 px-1 py-0.2 rounded">
                    Authorized Seller
                  </span>
                </div>
                <div className="space-y-0.5 text-[11px]">
                  <div className="text-xs font-black text-slate-950">
                    {settings.dealershipName}
                  </div>
                  <div className="text-slate-700 flex items-center justify-between">
                    <span className="text-slate-500">Business Reg:</span>
                    <strong className="font-mono text-slate-950">{settings.taxNumber || 'WM-LK-REG'}</strong>
                  </div>
                  <div className="text-slate-700 flex items-center justify-between">
                    <span className="text-slate-500">Hotline:</span>
                    <strong className="font-mono text-slate-950">{settings.phone}</strong>
                  </div>
                  <div className="text-slate-700 truncate" title={settings.address}>
                    <span className="text-slate-500">Showroom: </span>
                    <span className="text-slate-950 font-medium">{settings.address}</span>
                  </div>
                </div>
              </div>

              {/* Guarantor / Co-Signer Card (if finance sale) */}
              {isFinance && (
                <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1">
                  <div className="flex items-center justify-between border-b border-amber-200 pb-1">
                    <span className="text-[9px] uppercase font-black tracking-wider text-amber-900 flex items-center gap-1">
                      <Users className="w-3 h-3 text-amber-800" />
                      <span>Guarantor Particulars</span>
                    </span>
                    <span className="text-[9px] font-mono text-amber-800 font-bold bg-amber-100 px-1 py-0.2 rounded">
                      Co-Signer / Surety
                    </span>
                  </div>
                  <div className="space-y-0.5 text-[11px]">
                    <div className="text-xs font-black text-slate-950">
                      {sale.guarantorName || 'N/A'}
                    </div>
                    <div className="text-slate-700 flex items-center justify-between">
                      <span className="text-slate-500">NIC:</span>
                      <strong className="font-mono text-slate-950">{sale.guarantorIdNumber || 'N/A'}</strong>
                    </div>
                    <div className="text-slate-700 flex items-center justify-between">
                      <span className="text-slate-500">Phone:</span>
                      <strong className="font-mono text-slate-950">{sale.guarantorPhone || 'N/A'}</strong>
                    </div>
                    <div className="text-slate-700 truncate" title={sale.guarantorAddress || 'Not Provided'}>
                      <span className="text-slate-500">Address: </span>
                      <span className="text-slate-950 font-medium">{sale.guarantorAddress || 'Not Provided'}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* 3. Compact High-Contrast Vehicle Ledger Table */}
            <div className="rounded-xl border border-slate-300 overflow-hidden shadow-sm">
              <div className="p-2 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-1.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <BikeIcon className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-white">
                    Schedule of Vehicle Particulars & Specification
                  </span>
                </div>
                <div className="text-[10px] font-mono font-bold text-sky-300 bg-slate-800 px-2 py-0.2 rounded border border-slate-700">
                  Reg Plate: {bike?.regPlate || 'UNREGISTERED'}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-300 text-[9px] font-black text-slate-700 uppercase tracking-wider">
                      <th className="py-1.5 px-3 w-8 text-center">#</th>
                      <th className="py-1.5 px-3">Vehicle Description</th>
                      <th className="py-1.5 px-3 font-mono text-center">Registration</th>
                      <th className="py-1.5 px-3 font-mono">Chassis / VIN</th>
                      <th className="py-1.5 px-3 text-center">Displacement</th>
                      <th className="py-1.5 px-3 text-right">Agreed Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="divide-x divide-slate-200 text-[11px]">
                      <td className="py-2 px-3 font-mono text-slate-400 font-bold text-center">01</td>
                      <td className="py-2 px-3">
                        <div className="font-black text-slate-950 text-xs">
                          {sale.bikeSummary}
                        </div>
                        {bike && (
                          <div className="text-[10px] text-slate-600 mt-0.2 flex flex-wrap items-center gap-x-1.5">
                            <span>Year: <strong>{bike.year}</strong></span>
                            <span>•</span>
                            <span>Color: <strong>{bike.color}</strong></span>
                            <span>•</span>
                            <span>Mileage: <strong>{bike.mileage.toLocaleString()} km</strong></span>
                            <span>•</span>
                            <span>{bike.condition}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono font-black text-xs text-slate-950 whitespace-nowrap text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-white border border-slate-800 font-mono text-[10px]">
                          {bike?.regPlate || 'UNREGISTERED'}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-[10px] text-slate-800 font-semibold whitespace-nowrap">
                        {bike?.vin || 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-slate-800 font-semibold whitespace-nowrap text-center text-[10px]">
                        {bike ? `${bike.engineCapacityCc} cc` : 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-black text-xs sm:text-sm text-slate-950 whitespace-nowrap">
                        {formatCurrency(sale.saleAmount, symbol)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Financial Statement & Settlement Schedule */}
            <div className="p-2.5 sm:p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <div className="flex items-center gap-1.5">
                  {isFinance ? (
                    <Landmark className="w-3.5 h-3.5 text-slate-900" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-900">
                    {isFinance ? 'Financed Structured Settlement & Repayment Terms' : 'Financial Settlement & Payment Reconciliation'}
                  </span>
                </div>
                <div className="text-[10px] font-mono font-bold text-slate-700">
                  Currency: {settings.currencyCode} ({symbol})
                </div>
              </div>

              {!isFinance ? (
                /* CASH SALE: HIGH-CONTRAST SETTLEMENT GRID & PAID IN FULL SEAL */
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                  
                  <div className="sm:col-span-8 grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-xs">
                      <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">
                        Full Agreed Price
                      </span>
                      <div className="text-sm sm:text-base font-black text-slate-950 font-mono mt-0.5">
                        {formatCurrency(sale.saleAmount, symbol)}
                      </div>
                      <span className="text-[9px] text-slate-500 block">
                        Agreed total value
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs">
                      <span className="text-[9px] text-emerald-800 uppercase font-black tracking-wider block">
                        Total Amount Paid
                      </span>
                      <div className="text-sm sm:text-base font-black text-emerald-700 font-mono mt-0.5">
                        {formatCurrency(sale.saleAmount, symbol)}
                      </div>
                      <span className="text-[9px] text-emerald-600 font-medium block">
                        Paid in full (Cash)
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-xs">
                      <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">
                        Outstanding Balance
                      </span>
                      <div className="text-sm sm:text-base font-black text-slate-900 font-mono mt-0.5">
                        {formatCurrency(0, symbol)}
                      </div>
                      <span className="text-[9px] text-slate-500 block">
                        Zero liability
                      </span>
                    </div>
                  </div>

                  {/* Circular Official Paid Stamp Seal */}
                  <div className="sm:col-span-4 flex items-center justify-center">
                    <div className="border border-emerald-600 rounded-xl p-2 bg-emerald-50/80 text-emerald-800 text-center shadow-sm w-full">
                      <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider">
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Officially Settled</span>
                      </div>
                      <div className="text-xs font-black mt-0.2 font-mono">PAID IN FULL</div>
                      <div className="text-[8px] text-emerald-700 uppercase font-semibold">
                        Full Title & Possession Conveyed
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                /* FINANCE SALE: 4-PILLAR RECONCILIATION & LENDER DETAILS */
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-xs">
                      <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">
                        Full Agreed Price
                      </span>
                      <div className="text-xs sm:text-sm font-black text-slate-950 font-mono mt-0.2">
                        {formatCurrency(sale.saleAmount, symbol)}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs">
                      <span className="text-[9px] text-emerald-800 uppercase font-black tracking-wider block">
                        Down Payment
                      </span>
                      <div className="text-xs sm:text-sm font-black text-emerald-700 font-mono mt-0.2">
                        {formatCurrency(sale.customerDeposit, symbol)}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-200 text-xs">
                      <span className="text-[9px] text-amber-900 uppercase font-black tracking-wider block">
                        Financed Amount
                      </span>
                      <div className="text-xs sm:text-sm font-black text-amber-800 font-mono mt-0.2">
                        {formatCurrency(sale.financeAmount, symbol)}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-xs">
                      <span className="text-[9px] text-slate-600 uppercase font-black tracking-wider block">
                        Remaining Contract Due
                      </span>
                      <div className="text-xs sm:text-sm font-black text-slate-900 font-mono mt-0.2">
                        {formatCurrency(remainingBalance, symbol)}
                      </div>
                    </div>
                  </div>

                  {/* Finance Company Details Bar */}
                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-[10px] grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Finance Institution / Lessor:</span>
                      <span className="font-black text-slate-900 truncate block">{sale.financeProvider || 'Commercial Leasing & Finance PLC'}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Facility Agreement Ref:</span>
                      <span className="font-mono font-bold text-slate-900 truncate block">{sale.financeAgreementNumber || 'CF-PENDING'}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Repayment Duration:</span>
                      <span className="font-bold text-slate-900 truncate block">{sale.financeTermMonths ? `${sale.financeTermMonths} Months` : '36 Months'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Compact Formal Legal Conveyance & Delivery Statement */}
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[9.5px] text-slate-700 leading-snug space-y-0.5">
              <p>
                <strong>Title Transfer & Statutory Delivery Warranty:</strong> <em>{settings.dealershipName}</em> hereby warrants that the motor vehicle described herein is conveyed free and clear of all undisclosed liens, legal charges, statutory encumbrances, or adverse claims.
              </p>
              <p>
                The Purchaser {isFinance && 'and Guarantor'} certify having inspected and received the vehicle in roadworthy condition along with statutory transfer documentation (MTA forms), current revenue license, and key set.
              </p>
            </div>

            {/* 6. Executive Three-Party Signatures with Official Dealership Seal */}
            <div className="pt-2 border-t-2 border-slate-900 space-y-2">
              <div className={`grid ${isFinance ? 'grid-cols-3' : 'grid-cols-2'} gap-3 text-xs text-slate-900`}>
                
                {/* Customer Signature Box */}
                <div className="p-2 rounded-lg bg-slate-50/50 border border-slate-200 space-y-0.5">
                  <div className="text-[9px] uppercase font-bold text-slate-500">Customer / Buyer Signature</div>
                  <div className="h-10 border-b border-dashed border-slate-400 mb-1 flex items-end justify-center pb-0.5 text-[9px] text-slate-400 font-mono">
                    (Authorized Signature)
                  </div>
                  <div className="font-black text-slate-950 text-[11px] truncate">{sale.customerName}</div>
                  <div className="text-[9px] text-slate-600 font-mono">
                    NIC: {sale.customerIdNumber || 'N/A'} • Date: ________
                  </div>
                </div>

                {/* Guarantor Signature Box (if finance) */}
                {isFinance && (
                  <div className="p-2 rounded-lg bg-amber-50/40 border border-amber-200/80 space-y-0.5">
                    <div className="text-[9px] uppercase font-bold text-amber-900">Guarantor / Surety Signature</div>
                    <div className="h-10 border-b border-dashed border-amber-400 mb-1 flex items-end justify-center pb-0.5 text-[9px] text-amber-500 font-mono">
                      (Authorized Signature)
                    </div>
                    <div className="font-black text-slate-950 text-[11px] truncate">{sale.guarantorName || 'Guarantor'}</div>
                    <div className="text-[9px] text-slate-600 font-mono">
                      NIC: {sale.guarantorIdNumber || 'N/A'} • Date: ________
                    </div>
                  </div>
                )}

                {/* Dealership Sign-off Box with Circular Stamp */}
                <div className="p-2 rounded-lg bg-slate-50/50 border border-slate-200 space-y-0.5">
                  <div className="text-[9px] uppercase font-bold text-slate-500">For {settings.dealershipName}</div>
                  <div className="h-10 border-b border-dashed border-slate-400 mb-1 flex items-end justify-center pb-0.5 text-[9px] text-slate-400 font-mono">
                    (Authorized Seal & Stamp)
                  </div>
                  <div className="font-black text-slate-950 text-[11px] truncate">{settings.dealershipName}</div>
                  <div className="text-[9px] text-slate-600 font-mono">
                    Authorized Signatory • Date: ________
                  </div>
                </div>

              </div>

              {/* Security Digital Footprint */}
              <div className="pt-1.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-1 text-[9px] text-slate-500 font-mono">
                <div className="flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                  <span>OFFICIAL DIGITAL RECORD #WM-BILL-{sale.id.toUpperCase()} · VERIFIED AUTHENTIC</span>
                </div>
                <div>
                  Generated on {new Date().toLocaleDateString()} · {settings.dealershipName} Showroom
                </div>
              </div>
            </div>

          </div>
        )}

        </div>

        {/* Modal Bottom Bar with prominent "Back" button (Always accessible after viewing or printing, hidden in print) */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/95 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ready to print or save. Click <strong>Back to Sales</strong> to return to your records.</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleBack}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all border border-slate-700 active:scale-95 shadow-md shadow-slate-950/50"
            >
              <ArrowLeft className="w-4 h-4 text-sky-400" />
              <span>Back to Sales</span>
            </button>

            <button
              onClick={handleCopyText}
              className="hidden sm:flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition-all border border-slate-700 active:scale-95"
              title="Copy text representation to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handleDownloadHtml}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white font-bold text-xs transition-all border border-slate-700 active:scale-95"
              title="Download standalone printable HTML / PDF document"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>Save / PDF</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs transition-all active:scale-95 shadow-lg shadow-emerald-500/20 disabled:opacity-75"
            >
              {isPrinting ? (
                <Loader2 className="w-4 h-4 text-slate-950 animate-spin" />
              ) : (
                <Printer className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              )}
              <span>{isPrinting ? 'Printing...' : `Print ${documentFormat === 'bill' ? 'Modern Bill' : 'Formal Letter'}`}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
