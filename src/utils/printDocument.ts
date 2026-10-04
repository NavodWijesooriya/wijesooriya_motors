/**
 * Sales POS - Document Printing & Export Utility
 * Handles printing across standard web, sandboxed iframes, and mobile devices.
 */

import { Bike, DealershipSettings, SaleRecord } from '../types';
import { formatCurrency, formatDate } from './formatters';

/**
 * Generates clean, standalone HTML with professional letterhead & print styles
 */
export const generatePrintableHtml = (contentHtml: string, title: string): string => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm 8mm 10mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      background-color: #ffffff;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 11.5px;
      line-height: 1.45;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    .print-wrapper {
      max-width: 840px;
      margin: 15px auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      padding: 0;
    }
    /* Robust Fallback Grid & Flex Styles for Print / Offline */
    .flex { display: flex !important; }
    .flex-col { flex-direction: column !important; }
    .flex-row { flex-direction: row !important; }
    .flex-wrap { flex-wrap: wrap !important; }
    .items-center { align-items: center !important; }
    .items-start { align-items: flex-start !important; }
    .justify-between { justify-content: space-between !important; }
    .justify-center { justify-content: center !important; }
    .justify-end { justify-content: flex-end !important; }
    .grid { display: grid !important; }
    .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
    .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
    .gap-1 { gap: 4px !important; }
    .gap-1\\.5 { gap: 6px !important; }
    .gap-2 { gap: 8px !important; }
    .gap-2\\.5 { gap: 10px !important; }
    .gap-3 { gap: 12px !important; }
    .gap-4 { gap: 16px !important; }
    .gap-5 { gap: 20px !important; }
    .gap-6 { gap: 24px !important; }
    .block { display: block !important; }
    .inline-block { display: inline-block !important; }
    .inline-flex { display: inline-flex !important; }
    
    /* Typography & Spacing */
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace !important; }
    .font-bold { font-weight: 700 !important; }
    .font-black { font-weight: 900 !important; }
    .font-semibold { font-weight: 600 !important; }
    .font-medium { font-weight: 500 !important; }
    .uppercase { text-transform: uppercase !important; }
    .tracking-tight { letter-spacing: -0.025em !important; }
    .tracking-wider { letter-spacing: 0.05em !important; }
    .tracking-widest { letter-spacing: 0.1em !important; }

    /* Modern Card & Background Elements */
    .bg-white { background-color: #ffffff !important; }
    .bg-slate-50 { background-color: #f8fafc !important; }
    .bg-slate-100 { background-color: #f1f5f9 !important; }
    .bg-slate-900 { background-color: #0f172a !important; color: #ffffff !important; }
    .bg-slate-950 { background-color: #020617 !important; color: #ffffff !important; }
    .bg-emerald-50 { background-color: #ecfdf5 !important; }
    .bg-amber-50 { background-color: #fffbeb !important; }
    .text-slate-950 { color: #020617 !important; }
    .text-slate-900 { color: #0f172a !important; }
    .text-slate-800 { color: #1e293b !important; }
    .text-slate-700 { color: #334155 !important; }
    .text-slate-600 { color: #475569 !important; }
    .text-slate-500 { color: #64748b !important; }
    .text-slate-400 { color: #94a3b8 !important; }
    .text-white { color: #ffffff !important; }
    .text-emerald-700 { color: #047857 !important; }
    .text-emerald-800 { color: #065f46 !important; }
    .text-amber-800 { color: #92400e !important; }
    .text-amber-900 { color: #78350f !important; }
    .text-sky-400 { color: #38bdf8 !important; }
    .border { border: 1px solid #e2e8f0 !important; }
    .border-2 { border: 2px solid #cbd5e1 !important; }
    .border-b { border-bottom: 1px solid #e2e8f0 !important; }
    .border-b-2 { border-bottom: 2px solid #0f172a !important; }
    .border-t { border-top: 1px solid #e2e8f0 !important; }
    .border-t-2 { border-top: 2px solid #0f172a !important; }
    .border-dashed { border-style: dashed !important; }
    .rounded-xl { border-radius: 10px !important; }
    .rounded-2xl { border-radius: 14px !important; }
    .rounded-full { border-radius: 9999px !important; }
    .p-3 { padding: 12px !important; }
    .p-4 { padding: 16px !important; }
    .p-5 { padding: 20px !important; }
    .p-6 { padding: 24px !important; }
    .px-3 { padding-left: 12px !important; padding-right: 12px !important; }
    .px-4 { padding-left: 16px !important; padding-right: 16px !important; }
    .py-2 { padding-top: 8px !important; padding-bottom: 8px !important; }
    .py-3 { padding-top: 12px !important; padding-bottom: 12px !important; }
    .space-y-1 > * + * { margin-top: 4px !important; }
    .space-y-2 > * + * { margin-top: 8px !important; }
    .space-y-3 > * + * { margin-top: 12px !important; }
    .space-y-4 > * + * { margin-top: 16px !important; }
    .space-y-6 > * + * { margin-top: 24px !important; }
    
    /* Table Styling */
    table {
      width: 100% !important;
      border-collapse: collapse !important;
    }
    th, td {
      padding: 8px 12px !important;
      text-align: left !important;
      vertical-align: middle !important;
    }
    th {
      background-color: #f1f5f9 !important;
      font-weight: 700 !important;
      color: #334155 !important;
      font-size: 10.5px !important;
      text-transform: uppercase !important;
      letter-spacing: 0.05em !important;
      border-bottom: 2px solid #cbd5e1 !important;
    }
    td {
      border-bottom: 1px solid #e2e8f0 !important;
    }
    
    /* SVG Icons sizing */
    svg {
      display: inline-block !important;
      vertical-align: middle !important;
      flex-shrink: 0 !important;
    }

    /* Screen Notification bar */
    @media screen {
      .screen-notice {
        max-width: 860px;
        margin: 20px auto 0 auto;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 14px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      }
      .screen-notice-title {
        font-weight: 700;
        font-size: 13px;
        color: #0f172a;
      }
      .screen-notice-sub {
        font-size: 11px;
        color: #64748b;
        margin-top: 2px;
      }
      .print-btn {
        background: #0284c7;
        color: #ffffff;
        border: none;
        padding: 9px 18px;
        border-radius: 8px;
        font-weight: 700;
        font-size: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: background 0.15s ease;
      }
      .print-btn:hover {
        background: #0369a1;
      }
    }

    /* Crisp Single-Page Print Output */
    @media print {
      @page {
        size: A4 portrait;
        margin: 6mm 8mm 6mm 8mm;
      }
      html, body {
        background: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        height: 100% !important;
        overflow: hidden !important;
        page-break-after: avoid !important;
      }
      .screen-notice {
        display: none !important;
      }
      .print-wrapper {
        max-width: 100% !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        max-height: 282mm !important;
        overflow: hidden !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      .no-print {
        display: none !important;
      }
      * {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div class="screen-notice">
    <div>
      <div class="screen-notice-title">Official Document Ready • Sales POS</div>
      <div class="screen-notice-sub">Use the button on the right or press Ctrl+P (Cmd+P) to print or save as PDF.</div>
    </div>
    <button class="print-btn" onclick="window.focus(); window.print();">
      <span>Print / Save as PDF</span>
    </button>
  </div>

  <div class="print-wrapper">
    ${contentHtml}
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        try {
          window.focus();
          window.print();
        } catch(e) {}
      }, 400);
    };
  </script>
</body>
</html>`;
};

/**
 * Triggers printing using an isolated hidden iframe with fallback to window.print()
 */
export const printDocumentElement = (elementId: string, docTitle: string): boolean => {
  const targetElement = document.getElementById(elementId);
  if (!targetElement) {
    try {
      window.focus();
      window.print();
      return true;
    } catch (e) {
      console.error('Print failed:', e);
      return false;
    }
  }

  const html = generatePrintableHtml(targetElement.innerHTML, docTitle);

  try {
    // Look for existing print frame or create new
    let printFrame = document.getElementById('sales-pos-print-frame') as HTMLIFrameElement;
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'sales-pos-print-frame';
      printFrame.style.position = 'fixed';
      printFrame.style.top = '-9999px';
      printFrame.style.left = '-9999px';
      printFrame.style.width = '210mm';
      printFrame.style.height = '297mm';
      printFrame.style.border = 'none';
      printFrame.style.zIndex = '-9999';
      document.body.appendChild(printFrame);
    }

    const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(html);
      frameDoc.close();

      setTimeout(() => {
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
        } catch (iframeErr) {
          console.warn('Iframe print failed, falling back to window.print()', iframeErr);
          window.focus();
          window.print();
        }
      }, 350);

      return true;
    }
  } catch (err) {
    console.warn('Could not use iframe print, falling back to window.print()', err);
  }

  // Direct window print fallback
  try {
    window.focus();
    window.print();
    return true;
  } catch (windowErr) {
    console.error('Direct window print also failed:', windowErr);
    return false;
  }
};

/**
 * Generates and downloads a clean, self-contained HTML file that can be opened in any browser
 * and automatically triggers the print/save-as-PDF dialog.
 */
export const downloadDocumentAsHtml = (elementId: string, fileName: string): boolean => {
  const targetElement = document.getElementById(elementId);
  if (!targetElement) return false;

  const html = generatePrintableHtml(targetElement.innerHTML, fileName);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
};

/**
 * Builds plain-text modern bill of sale representation for easy copy-pasting
 */
export const buildModernBillPlainText = (
  sale: SaleRecord,
  bike: Bike | undefined,
  settings: DealershipSettings,
  isFinance: boolean
): string => {
  const symbol = settings.currencySymbol;
  const remainingBalance = Math.max(0, sale.saleAmount - (sale.customerDeposit || 0));

  let text = `========================================================================\n`;
  text += `                     ${settings.dealershipName.toUpperCase()}\n`;
  text += `           OFFICIAL COMMERCIAL BILL OF SALE & VEHICLE INVOICE\n`;
  text += `========================================================================\n`;
  text += `Showroom Address: ${settings.address}\n`;
  text += `Hotline: ${settings.phone} | Email: ${settings.email}\n`;
  if (settings.taxNumber) text += `Business Reg / Tax ID: ${settings.taxNumber}\n`;
  text += `------------------------------------------------------------------------\n`;
  text += `Bill Reference:   WM-BILL-${sale.id.toUpperCase()}\n`;
  text += `Date of Issue:    ${formatDate(sale.saleDate)}\n`;
  text += `Transaction Type: ${sale.saleMethod.toUpperCase()} SALE\n`;
  text += `Payment Status:   ${isFinance ? 'FINANCE APPROVED & DISBURSED' : 'FULLY PAID'}\n`;
  text += `------------------------------------------------------------------------\n\n`;

  text += `1. BUYER / CUSTOMER PARTICULARS\n`;
  text += `   Full Name:        ${sale.customerName}\n`;
  text += `   National ID (NIC):${sale.customerIdNumber || 'N/A'}\n`;
  text += `   Primary Phone:    ${sale.customerPhone}\n`;
  text += `   Second Phone:     ${sale.customerSecondaryPhone || 'N/A'}\n`;
  text += `   Address:          ${sale.customerAddress || 'Not Provided'}\n\n`;

  if (isFinance) {
    text += `2. GUARANTOR PARTICULARS (FINANCE SALE)\n`;
    text += `   Guarantor Name:   ${sale.guarantorName || 'N/A'}\n`;
    text += `   Guarantor NIC:    ${sale.guarantorIdNumber || 'N/A'}\n`;
    text += `   Guarantor Phone:  ${sale.guarantorPhone || 'N/A'}\n`;
    text += `   Guarantor Address:${sale.guarantorAddress || 'Not Provided'}\n\n`;
  }

  text += `3. MOTORBIKE SPECIFICATION SCHEDULE\n`;
  text += `   Make & Model:     ${sale.bikeSummary}\n`;
  text += `   Registration No:  ${bike?.regPlate || 'UNREGISTERED'}\n`;
  text += `   Chassis / VIN:    ${bike?.vin || 'N/A'}\n`;
  text += `   Engine Capacity:  ${bike ? `${bike.engineCapacityCc} cc` : 'N/A'}\n`;
  if (bike) {
    text += `   Color / Mileage:  ${bike.color} | ${bike.mileage.toLocaleString()} km\n`;
  }
  text += `   Agreed Full Price:${formatCurrency(sale.saleAmount, symbol)}\n\n`;

  text += `4. FINANCIAL SETTLEMENT BREAKDOWN\n`;
  text += `   Full Bike Selling Price: ${formatCurrency(sale.saleAmount, symbol)}\n`;

  if (!isFinance) {
    text += `   Total Amount Paid:       ${formatCurrency(sale.saleAmount, symbol)} (Paid in Full)\n`;
    text += `   Remaining Balance:       ${formatCurrency(0, symbol)}\n`;
    text += `   Payment Status:          Fully Paid\n`;
  } else {
    text += `   Customer Down Payment:   ${formatCurrency(sale.customerDeposit || 0, symbol)}\n`;
    text += `   Financed Loan Amount:    ${formatCurrency(sale.financeAmount || 0, symbol)}\n`;
    text += `   Remaining Contract Due:  ${formatCurrency(remainingBalance, symbol)}\n`;
    text += `   Finance Institution:     ${sale.financeProvider || 'Commercial Leasing & Finance'}\n`;
    text += `   Agreement Reference:     ${sale.financeAgreementNumber || 'N/A'}\n`;
    text += `   Repayment Duration:      ${sale.financeTermMonths ? `${sale.financeTermMonths} Months` : '36 Months'}\n`;
  }

  text += `\nTITLE & DELIVERY DECLARATION:\n`;
  text += `Sales POS hereby transfers legal ownership of the specified vehicle with clear title and zero undisclosed encumbrances. The Buyer acknowledges receipt in good working order.\n\n`;

  text += `SIGNATURES & OFFICIAL ENDORSEMENT:\n`;
  text += `Customer / Buyer: ________________________   Date: _____________\n`;
  text += `Name: ${sale.customerName} (NIC: ${sale.customerIdNumber || 'N/A'})\n\n`;

  if (isFinance) {
    text += `Guarantor:        ________________________   Date: _____________\n`;
    text += `Name: ${sale.guarantorName || 'Guarantor'} (NIC: ${sale.guarantorIdNumber || 'N/A'})\n\n`;
  }

  text += `Authorized Seal:  ________________________   Date: _____________\n`;
  text += `For ${settings.dealershipName} (Official Stamp)\n`;
  text += `========================================================================\n`;

  return text;
};

/**
 * Builds plain-text formal letter representation for easy copy-pasting
 */
export const buildFormalLetterPlainText = (
  sale: SaleRecord,
  bike: Bike | undefined,
  settings: DealershipSettings,
  isFinance: boolean
): string => {
  const symbol = settings.currencySymbol;
  const remainingBalance = Math.max(0, sale.saleAmount - (sale.customerDeposit || 0));

  let text = `========================================================================\n`;
  text += `${settings.dealershipName.toUpperCase()}\n`;
  text += `${settings.tagline}\n`;
  text += `${settings.address}\n`;
  text += `Phone: ${settings.phone} | Email: ${settings.email}\n`;
  if (settings.taxNumber) text += `Business Reg / Tax No: ${settings.taxNumber}\n`;
  text += `========================================================================\n\n`;

  text += `Ref: WM-LTR-${sale.id.toUpperCase()}\n`;
  text += `Date: ${formatDate(sale.saleDate)}\n`;
  text += `Sale Method: ${sale.saleMethod.toUpperCase()} SALE\n\n`;

  text += `TO (BUYER / CUSTOMER):\n`;
  text += `Customer Name: ${sale.customerName}\n`;
  text += `Customer Address: ${sale.customerAddress || 'Not Provided'}\n`;
  text += `Customer ID (NIC): ${sale.customerIdNumber || 'N/A'}\n`;
  text += `Primary Phone: ${sale.customerPhone}\n`;
  text += `Second Phone: ${sale.customerSecondaryPhone || 'N/A'}\n\n`;

  text += `SUBJECT: OFFICIAL VEHICLE SALE CONFIRMATION & HANDOVER LETTER\n`;
  text += `BIKE NUMBER (PLATE): ${bike?.regPlate || 'UNREGISTERED'}\n`;
  text += `PAYMENT METHOD: ${sale.saleMethod.toUpperCase()} SALE\n\n`;

  text += `1. MOTORBIKE PARTICULARS\n`;
  text += `- Bike Number (Plate): ${bike?.regPlate || 'UNREGISTERED'}\n`;
  text += `- Make & Model: ${sale.bikeSummary}\n`;
  text += `- Chassis / VIN: ${bike?.vin || 'N/A'}\n`;
  text += `- Engine Capacity: ${bike ? `${bike.engineCapacityCc} cc` : 'N/A'}\n\n`;

  text += `2. PAYMENT TERMS & SETTLEMENT DETAILS (${isFinance ? 'FINANCE SALE' : 'CASH SALE'})\n`;
  text += `- Full Bike Selling Price: ${formatCurrency(sale.saleAmount, symbol)}\n`;

  if (!isFinance) {
    text += `- Total Amount Paid: ${formatCurrency(sale.saleAmount, symbol)}\n`;
    text += `- Payment Status: Fully Paid (Settled in full via direct cash payment)\n`;
    text += `- Remaining Balance: ${formatCurrency(0, symbol)}\n\n`;
  } else {
    text += `- Down Payment: ${formatCurrency(sale.customerDeposit || 0, symbol)}\n`;
    text += `- Finance Amount: ${formatCurrency(sale.financeAmount || 0, symbol)}\n`;
    text += `- Remaining Balance: ${formatCurrency(remainingBalance, symbol)}\n`;
    text += `- Finance Company / Institution: ${sale.financeProvider || 'Commercial Leasing & Finance'}\n`;
    text += `- Agreement / Reference Ref: ${sale.financeAgreementNumber || 'N/A'}\n`;
    text += `- Repayment Term: ${sale.financeTermMonths ? `${sale.financeTermMonths} Months` : '36 Months'}\n\n`;

    text += `3. GUARANTOR PARTICULARS\n`;
    text += `- Guarantor Name: ${sale.guarantorName || 'N/A'}\n`;
    text += `- Guarantor ID (NIC): ${sale.guarantorIdNumber || 'N/A'}\n`;
    text += `- Guarantor Phone: ${sale.guarantorPhone || 'N/A'}\n`;
    text += `- Guarantor Address: ${sale.guarantorAddress || 'Not Provided'}\n\n`;
  }

  text += `CERTIFICATION & WARRANTY:\n`;
  text += `${settings.dealershipName} certifies that the aforementioned motorbike is transferred free from any undisclosed encumbrances, legal liens, or ownership disputes, and that full delivery of the vehicle documents, revenue license, and keys have been tendered.\n\n`;

  text += `Yours faithfully,\n\n`;
  text += `___________________________________        ___________________________________\n`;
  text += `Authorized Signatory (${settings.dealershipName})        Customer / Buyer (${sale.customerName})\n`;
  text += `Official Dealership Stamp & Date           NIC: ${sale.customerIdNumber || 'N/A'} • Date: ________\n\n`;

  if (isFinance) {
    text += `___________________________________\n`;
    text += `Guarantor Signature (${sale.guarantorName || 'Guarantor'})\n`;
    text += `NIC: ${sale.guarantorIdNumber || 'N/A'} • Date: ________\n\n`;
  }

  text += `------------------------------------------------------------------------\n`;
  text += `${settings.dealershipName} • Official Vehicle Handover & Formal Sale Letter\n`;
  text += `Record #${sale.id.toUpperCase()} • Generated on ${new Date().toLocaleDateString()}\n`;

  return text;
};
