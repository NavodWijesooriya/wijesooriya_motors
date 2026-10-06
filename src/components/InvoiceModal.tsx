import React, { useRef, useState } from 'react';
import { Bike as BikeIcon, CheckCircle2, Download, Loader2, X } from 'lucide-react';
import sinhalaFontUrl from '@fontsource/noto-sans-sinhala/files/noto-sans-sinhala-sinhala-400-normal.woff2';
import { useDealership } from '../context/DealershipContext';
import { Bike, SaleRecord } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

const sheetStyle: React.CSSProperties = {
  boxSizing: 'border-box',
  width: '794px',
  minHeight: '1123px',
  padding: '42px 48px 30px',
  background: '#fff',
  color: '#172033',
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
  fontFamily: '"Noto Sans Sinhala", "Nirmala UI", "Iskoola Pota", Arial, sans-serif',
  fontSize: '12px',
  lineHeight: 1.45
};

const sectionStyle: React.CSSProperties = {
  border: '1px solid #dce3eb',
  borderRadius: '8px',
  overflow: 'hidden'
};

const sectionHeadingStyle: React.CSSProperties = {
  margin: 0,
  padding: '8px 12px',
  background: '#f2f5f8',
  color: '#23334a',
  borderBottom: '1px solid #dce3eb',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.07em',
  textTransform: 'uppercase'
};

const labelStyle: React.CSSProperties = {
  color: '#69778a',
  fontSize: '10px',
  letterSpacing: '0.025em'
};

const valueStyle: React.CSSProperties = {
  color: '#172033',
  fontSize: '12px',
  fontWeight: 600,
  overflowWrap: 'anywhere'
};

const Detail: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
  <div style={{ minWidth: 0 }}>
    <div style={labelStyle}>{label}</div>
    <div style={valueStyle}>{value || 'Not recorded'}</div>
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 style={sectionHeadingStyle}>{children}</h2>
);

const CustomerDetails: React.FC<{ sale: SaleRecord }> = ({ sale }) => (
  <section style={sectionStyle} data-pdf-section>
    <SectionTitle>Customer Details</SectionTitle>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 22px', padding: '12px' }}>
      <Detail label="Customer Name" value={sale.customerName} />
      <Detail label="NIC No." value={sale.customerIdNumber} />
      <Detail label="Telephone No." value={sale.customerPhone} />
      <Detail label="Additional Telephone No." value={sale.customerSecondaryPhone} />
      <div style={{ gridColumn: '1 / -1' }}>
        <Detail label="Address" value={sale.customerAddress} />
      </div>
    </div>
  </section>
);

const VehicleDetails: React.FC<{ bike?: Bike; sale: SaleRecord }> = ({ bike, sale }) => (
  <section style={sectionStyle} data-pdf-section>
    <SectionTitle>Vehicle Details</SectionTitle>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 18px', padding: '12px' }}>
      <Detail label="Vehicle Type" value={bike?.vehicleType || sale.vehicleType} />
      <Detail label="Vehicle Category" value={bike?.category} />
      <Detail label="Condition" value={bike?.condition} />
      <Detail label="Make / Model" value={bike ? `${bike.make} ${bike.model}` : sale.bikeSummary} />
      <Detail label="Registration Number" value={bike?.regPlate} />
      <Detail label="Year of Manufacture" value={bike?.year} />
      <Detail label="Chassis Number" value={bike?.vin} />
      <Detail label="Engine Number" value="Not recorded" />
      <Detail label="Colour" value={bike?.color} />
      {bike?.engineCapacityCc ? <Detail label="Engine Capacity" value={`${bike.engineCapacityCc.toLocaleString()} cc`} /> : null}
      {bike?.mileage ? <Detail label="Mileage" value={`${bike.mileage.toLocaleString()} km`} /> : null}
      {bike?.notes ? (
        <div style={{ gridColumn: '1 / -1' }}>
          <Detail label="Additional Details" value={bike.notes} />
        </div>
      ) : null}
      {!bike?.notes && sale.notes ? (
        <div style={{ gridColumn: '1 / -1' }}>
          <Detail label="Additional Details" value={sale.notes} />
        </div>
      ) : null}
    </div>
  </section>
);

const PaymentDetails: React.FC<{
  sale: SaleRecord;
  amountPaid: number;
  remainingBalance: number;
  symbol: string;
}> = ({ sale, amountPaid, remainingBalance, symbol }) => (
  <section style={sectionStyle} data-pdf-section>
    <SectionTitle>Payment & Sale Details</SectionTitle>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 18px', padding: '12px' }}>
      <Detail label="Payment Method" value={sale.saleMethod} />
      <Detail label="Advance / Down Payment" value={formatCurrency(sale.customerDeposit || 0, symbol)} />
      <Detail label="Amount Paid" value={formatCurrency(amountPaid, symbol)} />
      {sale.saleMethod === 'Finance' ? (
        <>
          <Detail label="Finance Amount" value={formatCurrency(sale.financeAmount || 0, symbol)} />
          <Detail label="Balance Amount" value={formatCurrency(remainingBalance, symbol)} />
          <Detail label="Finance Provider" value={sale.financeProvider} />
          <Detail label="Finance Agreement No." value={sale.financeAgreementNumber} />
        </>
      ) : (
        <Detail label="Balance Amount" value={formatCurrency(remainingBalance, symbol)} />
      )}
    </div>
  </section>
);

const smallNumberWords = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen'
];
const tensNumberWords = [
  '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
];

const numberUnderThousandInWords = (value: number): string => {
  const words: string[] = [];
  if (value >= 100) {
    words.push(`${smallNumberWords[Math.floor(value / 100)]} hundred`);
    value %= 100;
  }
  if (value >= 20) {
    words.push(tensNumberWords[Math.floor(value / 10)] + (value % 10 ? `-${smallNumberWords[value % 10]}` : ''));
  } else if (value > 0 || words.length === 0) {
    words.push(smallNumberWords[value]);
  }
  return words.join(' ');
};

const amountInWords = (amount: number, currencyCode: string): string => {
  let remaining = Math.round(Math.abs(amount));
  const scales = [
    { value: 1_000_000_000, label: 'billion' },
    { value: 1_000_000, label: 'million' },
    { value: 1_000, label: 'thousand' }
  ];
  const words: string[] = [];

  for (const scale of scales) {
    const count = Math.floor(remaining / scale.value);
    if (count > 0) {
      words.push(`${numberUnderThousandInWords(count)} ${scale.label}`);
      remaining %= scale.value;
    }
  }
  if (remaining > 0 || words.length === 0) words.push(numberUnderThousandInWords(remaining));

  const currencyName = currencyCode === 'LKR' ? 'Sri Lankan Rupees' : currencyCode;
  return `${currencyName} ${words.join(' ')} only`;
};

const AgreementRow: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(125px, 0.85fr) minmax(0, 1.6fr)', gap: '8px', padding: '5px 0', borderBottom: '1px dotted #9aa9b9', alignItems: 'baseline' }}>
    <span style={{ color: '#536277' }}>{label}</span>
    <span style={{ color: '#172033', fontWeight: 600, overflowWrap: 'anywhere' }}>{value || 'Not recorded in system'}</span>
  </div>
);

const AgreementSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section style={{ minWidth: 0 }}>
    <h2 style={{ margin: '0 0 7px', padding: '6px 9px', background: '#eff3f7', borderLeft: '3px solid #172d48', color: '#172033', fontSize: '12px', fontWeight: 700 }}>
      {title}
    </h2>
    <div style={{ padding: '0 8px' }}>{children}</div>
  </section>
);

export const InvoiceModal: React.FC = () => {
  const {
    isInvoiceModalOpen,
    setIsInvoiceModalOpen,
    selectedSaleRecord,
    selectedBike,
    bikes,
    settings
  } = useDealership();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [downloaded, setDownloaded] = useState(false);
  const [documentType, setDocumentType] = useState<'bill' | 'agreement'>('bill');

  if (!isInvoiceModalOpen || !selectedSaleRecord) return null;

  const sale = selectedSaleRecord;
  const bike = selectedBike?.id === sale.bikeId ? selectedBike : bikes.find((item) => item.id === sale.bikeId);
  const billNumber = `WM-BILL-${sale.id.toUpperCase()}`;
  const agreementNumber = `WM-AGR-${sale.id.toUpperCase()}`;
  const documentNumber = documentType === 'agreement' ? agreementNumber : billNumber;
  const documentName = documentType === 'agreement' ? 'Sale Agreement' : 'Vehicle Sale Bill';
  const isFinance = sale.saleMethod === 'Finance';
  const symbol = settings.currencySymbol;
  const amountPaid = isFinance ? sale.customerDeposit || 0 : sale.saleAmount;
  const remainingBalance = Math.max(0, sale.saleAmount - amountPaid);

  const handleDownload = async () => {
    if (!sheetRef.current) return;

    setIsDownloading(true);
    setDownloaded(false);
    setDownloadError('');
    let renderFrame: HTMLIFrameElement | null = null;

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);

      renderFrame = document.createElement('iframe');
      renderFrame.setAttribute('aria-hidden', 'true');
      renderFrame.title = 'PDF rendering surface';
      renderFrame.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0;';
      document.body.appendChild(renderFrame);

      const renderDocument = renderFrame.contentDocument;
      if (!renderDocument) throw new Error('Could not create the PDF rendering document.');
      renderDocument.open();
      renderDocument.write(`<!doctype html><html><head><meta charset="utf-8"><style>@font-face{font-family:"Noto Sans Sinhala";src:url("${sinhalaFontUrl}") format("woff2");font-style:normal;font-weight:400;unicode-range:U+0D80-0DFF;}</style></head><body style="margin:0;padding:0;background:#fff;"></body></html>`);
      renderDocument.close();
      const pdfSheet = renderDocument.importNode(sheetRef.current, true);
      renderDocument.body.appendChild(pdfSheet);

      await document.fonts.ready;
      await renderDocument.fonts.ready;
      renderFrame.style.height = `${Math.max(pdfSheet.scrollHeight, 1123)}px`;
      const canvas = await html2canvas(pdfSheet, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        windowWidth: 794,
        windowHeight: Math.max(pdfSheet.scrollHeight, 1123),
        scrollX: 0,
        scrollY: 0
      });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      const pageHeightPx = Math.floor(canvas.width * (297 / 210));
      const pages = Math.ceil(canvas.height / pageHeightPx);

      for (let page = 0; page < pages; page += 1) {
        if (page > 0) pdf.addPage();

        const startY = page * pageHeightPx;
        const sliceHeight = Math.min(pageHeightPx, canvas.height - startY);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        const context = pageCanvas.getContext('2d');
        if (!context) throw new Error('Could not prepare the PDF page image.');

        context.drawImage(canvas, 0, startY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
        pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', 0, 0, 210, sliceHeight * (210 / canvas.width), undefined, 'FAST');
      }

      const safeDocumentNumber = documentNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeDocumentName = documentType === 'agreement' ? 'Sale-Agreement' : 'Vehicle-Bill';
      pdf.save(`Wijesooriya-Motors-${safeDocumentName}-${safeDocumentNumber}.pdf`);
      setDownloaded(true);
    } catch (error) {
      console.error('Vehicle bill PDF generation failed:', error);
      setDownloadError('The PDF could not be generated. Please try again.');
    } finally {
      renderFrame?.remove();
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-modal-title"
    >
      <div className="flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3 sm:px-6">
          <div>
            <h2 id="invoice-modal-title" className="text-sm font-black text-white sm:text-base">{documentName}</h2>
            <p className="mt-0.5 text-xs text-slate-400">{documentNumber} · {formatDate(sale.saleDate)}</p>
            <div className="mt-2 flex items-center gap-1 rounded-lg bg-slate-950 p-1" role="group" aria-label="Choose document">
              <button
                type="button"
                onClick={() => { setDocumentType('bill'); setDownloaded(false); setDownloadError(''); }}
                disabled={isDownloading}
                aria-pressed={documentType === 'bill'}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${documentType === 'bill' ? 'bg-sky-400 text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                Sale Bill
              </button>
              <button
                type="button"
                onClick={() => { setDocumentType('agreement'); setDownloaded(false); setDownloadError(''); }}
                disabled={isDownloading}
                aria-pressed={documentType === 'agreement'}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${documentType === 'agreement' ? 'bg-sky-400 text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                Agreement
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading || !bike}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-black text-slate-950 transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
              <span>{isDownloading ? 'Generating PDF…' : `Download ${documentType === 'agreement' ? 'Agreement' : 'Bill'} PDF`}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsInvoiceModalOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              aria-label="Close bill"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="overflow-auto bg-slate-950 p-3 sm:p-6">
          {!bike && (
            <div className="mx-auto mb-4 max-w-[794px] rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
              The saved vehicle record for this sale could not be found, so a complete {documentType === 'agreement' ? 'agreement' : 'bill'} cannot be generated.
            </div>
          )}
          {downloadError && <p role="alert" className="mx-auto mb-3 max-w-[794px] text-sm text-rose-300">{downloadError}</p>}
          {downloaded && (
            <p role="status" className="mx-auto mb-3 flex max-w-[794px] items-center gap-2 text-sm text-emerald-300">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Bill PDF downloaded.
            </p>
          )}

          {documentType === 'agreement' ? (
            <article ref={sheetRef} style={{ ...sheetStyle, gap: '17px', padding: '55px 65px 42px', fontSize: '12px' }}>
              <header data-pdf-section style={{ textAlign: 'center', paddingBottom: '7px' }}>
                <div lang="si" style={{ color: '#172033', fontSize: '20px', fontWeight: 700 }}>වාහන විකුණුම් ගිවිසුම</div>
                <div style={{ color: '#303b4b', fontSize: '15px', fontWeight: 800 }}>VEHICLE SALE AGREEMENT</div>
              </header>

              <div data-pdf-section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', margin: '0 4px 13px' }}>
                <AgreementRow label="දිනය (Date)" value={formatDate(sale.saleDate)} />
                <AgreementRow label="ස්ථානය (Place)" value={settings.address} />
              </div>

              <div data-pdf-section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '26px' }}>
                <AgreementSection title="1. විකුණුම්කරුගේ විස්තර (Seller's Details)">
                  <AgreementRow label="නම (Name)" value={settings.dealershipName} />
                  <AgreementRow label="ජා.හැ.අ (NIC No.)" />
                  <AgreementRow label="ලිපිනය (Address)" value={settings.address} />
                  <AgreementRow label="දුරකථන (Phone)" value={settings.phone} />
                </AgreementSection>
                <AgreementSection title="2. ගැනුම්කරුගේ විස්තර (Buyer's Details)">
                  <AgreementRow label="නම (Name)" value={sale.customerName} />
                  <AgreementRow label="ජා.හැ.අ (NIC No.)" value={sale.customerIdNumber} />
                  <AgreementRow label="ලිපිනය (Address)" value={sale.customerAddress} />
                  <AgreementRow label="දුරකථන (Phone)" value={sale.customerPhone} />
                </AgreementSection>
              </div>

              <AgreementSection title="3. වාහනය පිළිබඳ විස්තර (Vehicle Details)">
                <div data-pdf-section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
                  <AgreementRow label="මාදිලිය (Make / Model)" value={bike ? `${bike.make} ${bike.model}` : sale.bikeSummary} />
                  <AgreementRow label="ලියාපදිංචි අංකය (Reg No.)" value={bike?.regPlate} />
                  <AgreementRow label="චැසි අංකය (Chassis No.)" value={bike?.vin} />
                  <AgreementRow label="එන්ජින් අංකය (Engine No.)" />
                  <AgreementRow label="නිෂ්පාදිත වර්ෂය (Year)" value={bike?.year} />
                  <AgreementRow label="වර්ණය (Colour)" value={bike?.color} />
                </div>
              </AgreementSection>

              <AgreementSection title="4. මුදල් ගෙවීමේ විස්තර (Payment Details)">
                <div data-pdf-section>
                  <AgreementRow label="මුළු විකුණුම් මිල (Total Sale Price)" value={formatCurrency(sale.saleAmount, symbol)} />
                  <AgreementRow label="අකුරින් (In Words)" value={amountInWords(sale.saleAmount, settings.currencyCode)} />
                  <AgreementRow label="ගෙවීමේ ක්‍රමය (Payment Method)" value={sale.saleMethod} />
                  <AgreementRow label="අත්තිකාරම / මූලික ගෙවීම (Advance / Down Payment)" value={formatCurrency(amountPaid, symbol)} />
                  <AgreementRow label="මූල්‍යකරණය / ඉතිරි මුදල (Finance / Balance)" value={formatCurrency(remainingBalance, symbol)} />
                  {isFinance && sale.financeProvider && (
                    <AgreementRow label="මූල්‍ය ආයතනය (Finance Provider)" value={sale.financeProvider} />
                  )}
                </div>
              </AgreementSection>

              <AgreementSection title="5. ප්‍රකාශය (Declaration / Terms)">
                <div data-pdf-section lang="si" style={{ border: '1px solid #d2dce7', borderRadius: '4px', background: '#f8fafc', padding: '13px', lineHeight: 1.8 }}>
                  මෙම ලේඛනයේ සඳහන් වාහනය සහ විකුණුම් මිල පිළිබඳ විස්තර දෙපාර්ශ්වය විසින් පරීක්ෂා කර එකඟ වූ බව මෙයින් තහවුරු කරයි. වාහනයේ අයිතිය පැවරීම සහ ගෙවීම් ඉහත සඳහන් විස්තර හා දෙපාර්ශ්වය අතර ඇති අදාළ එකඟතාව අනුව සිදු කෙරේ.
                </div>
              </AgreementSection>

              <div data-pdf-section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginTop: 'auto', padding: '14px 8px 0', textAlign: 'center', fontWeight: 700 }}>
                <div>
                  <div style={{ borderTop: '1px dashed #303b4b', paddingTop: '7px' }}>විකුණුම්කරුගේ අත්සන<br />(Seller's Signature)</div>
                </div>
                <div>
                  <div style={{ borderTop: '1px dashed #303b4b', paddingTop: '7px' }}>ගැනුම්කරුගේ අත්සන<br />(Buyer's Signature)</div>
                </div>
              </div>
              <footer data-pdf-section style={{ textAlign: 'center', color: '#68778a', fontSize: '9px' }}>
                {agreementNumber} · {settings.dealershipName}
              </footer>
            </article>
          ) : (
          <article ref={sheetRef} style={sheetStyle}>
            <header data-pdf-section style={{ borderBottom: '2px solid #1d3552', paddingBottom: '17px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: '#172d48', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BikeIcon size={30} aria-hidden="true" />
                  </div>
                  <div>
                    <div style={{ color: '#172d48', fontSize: '23px', fontWeight: 800, letterSpacing: '0.035em' }}>WIJESORIYA MOTORS</div>
                    <div style={{ color: '#5d6d80', fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em' }}>Vehicle Sales &amp; Services</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', color: '#627187', fontSize: '10px', lineHeight: 1.6 }}>
                  {settings.address && <div>{settings.address}</div>}
                  {settings.phone && <div>{settings.phone}</div>}
                  {settings.email && <div>{settings.email}</div>}
                </div>
              </div>
            </header>

            <div data-pdf-section style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
              <div>
                <div style={{ color: '#172d48', fontSize: '23px', fontWeight: 800 }}>Vehicle Sale Bill</div>
                <div lang="si" style={{ color: '#42556c', fontSize: '17px', fontWeight: 600 }}>වාහන විකුණුම් බිල්පත</div>
              </div>
              <div style={{ minWidth: '235px', border: '1px solid #dce3eb', borderRadius: '8px', background: '#f7f9fb', padding: '10px 14px', textAlign: 'right' }}>
                <div style={labelStyle}>BILL / INVOICE NUMBER</div>
                <div style={{ ...valueStyle, fontFamily: 'Arial, sans-serif', fontSize: '13px' }}>{billNumber}</div>
                <div style={{ ...labelStyle, marginTop: '5px' }}>DATE OF ISSUE</div>
                <div style={valueStyle}>{formatDate(sale.saleDate)}</div>
                <div style={{ ...labelStyle, marginTop: '5px' }}>BILLED TO</div>
                <div style={valueStyle}>{sale.customerName}</div>
              </div>
            </div>

            <CustomerDetails sale={sale} />
            <VehicleDetails bike={bike} sale={sale} />
            <PaymentDetails sale={sale} amountPaid={amountPaid} remainingBalance={remainingBalance} symbol={symbol} />

            <section data-pdf-section style={{ border: '1px solid #d6e0e9', borderRadius: '8px', overflow: 'hidden' }}>
              <SectionTitle>Sale Summary</SectionTitle>
              <div style={{ padding: '8px 14px' }}>
                <SummaryRow label="Vehicle Sale Price" value={formatCurrency(sale.saleAmount, symbol)} />
                <SummaryRow label="Discount" value="Not recorded" />
                <SummaryRow label="Amount Paid" value={formatCurrency(amountPaid, symbol)} />
                <SummaryRow label="Balance / Finance Amount" value={formatCurrency(remainingBalance, symbol)} />
                <div style={{ marginTop: '8px', padding: '12px 14px', borderRadius: '6px', background: '#172d48', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em' }}>GRAND TOTAL</span>
                  <span style={{ fontFamily: 'Arial, sans-serif', fontSize: '20px', fontWeight: 800 }}>{formatCurrency(sale.saleAmount, symbol)}</span>
                </div>
              </div>
            </section>

            <footer data-pdf-section style={{ marginTop: 'auto', borderTop: '1px solid #dce3eb', paddingTop: '13px', textAlign: 'center', color: '#637187' }}>
              <div style={{ color: '#172d48', fontSize: '14px', fontWeight: 700 }}>Thank you for choosing Wijesooriya Motors.</div>
              <div style={{ marginTop: '4px', fontSize: '10px' }}>
                {settings.address}{settings.phone ? ` · ${settings.phone}` : ''}{settings.email ? ` · ${settings.email}` : ''}
              </div>
              {settings.taxNumber && <div style={{ marginTop: '3px', fontSize: '10px' }}>Business / Tax No. {settings.taxNumber}</div>}
              <div style={{ marginTop: '8px', color: '#8a96a5', fontSize: '9px' }}>Official vehicle sale bill · {billNumber}</div>
            </footer>
          </article>
          )}
        </div>
      </div>
    </div>
  );
};

const SummaryRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', padding: '5px 0', borderBottom: '1px solid #edf0f4', color: '#36445a', fontSize: '11px' }}>
    <span>{label}</span>
    <span style={{ minWidth: '150px', textAlign: 'right', color: '#172033', fontFamily: 'Arial, sans-serif', fontWeight: 600 }}>{value}</span>
  </div>
);
