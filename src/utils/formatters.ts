import { Bike, FinancialSummary, OtherCostItem, MonthlySummary } from '../types';

export const calculateTotalOtherCosts = (otherCosts: OtherCostItem[] = []): number => {
  return otherCosts.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);
};

// Compatibility alias
export const calculateTotalRepairs = calculateTotalOtherCosts;

export const calculateTotalCost = (costPrice: number, otherCosts: OtherCostItem[] = []): number => {
  return (Number(costPrice) || 0) + calculateTotalOtherCosts(otherCosts);
};

export interface SaleCalculationParams {
  saleMethod: 'Cash' | 'Finance';
  saleAmount: number;
  purchasePrice: number; // Cost Price
  totalRepairCost: number; // Total Other Costs
  financeAmount?: number;
  financeCommissionRate?: number;
}

export interface SaleCalculationResult {
  totalCost: number;
  saleAmount: number;
  financeAmount: number;
  financeCommissionRate: number;
  financeCommission: number;
  customerDeposit: number;
  totalCashReceived: number;
  netProfit: number;
  profitMarginPercent: number;
}

export const computeSaleFinancials = (params: SaleCalculationParams): SaleCalculationResult => {
  const saleAmount = Number(params.saleAmount) || 0;
  const purchasePrice = Number(params.purchasePrice) || 0; // Cost price
  const totalOtherCosts = Number(params.totalRepairCost) || 0; // Other costs
  const totalCost = purchasePrice + totalOtherCosts;
  const commissionRate = params.financeCommissionRate ?? 0.03;

  if (params.saleMethod === 'Cash') {
    const netProfit = saleAmount - totalCost;
    const profitMarginPercent = saleAmount > 0 ? (netProfit / saleAmount) * 100 : 0;
    return {
      totalCost,
      saleAmount,
      financeAmount: 0,
      financeCommissionRate: 0,
      financeCommission: 0,
      customerDeposit: saleAmount,
      totalCashReceived: saleAmount,
      netProfit,
      profitMarginPercent
    };
  } else {
    const financeAmount = Math.max(0, Math.min(Number(params.financeAmount) || 0, saleAmount));
    const financeCommission = Number((financeAmount * commissionRate).toFixed(2));
    const customerDeposit = Math.max(0, saleAmount - financeAmount);
    const totalCashReceived = saleAmount + financeCommission;
    const netProfit = (saleAmount + financeCommission) - totalCost;
    const profitMarginPercent = saleAmount > 0 ? (netProfit / saleAmount) * 100 : 0;

    return {
      totalCost,
      saleAmount,
      financeAmount,
      financeCommissionRate: commissionRate,
      financeCommission,
      customerDeposit,
      totalCashReceived,
      netProfit,
      profitMarginPercent
    };
  }
};

/**
 * User-friendly currency formatter for Sri Lankan Rupees (LKR) and other currencies.
 * For LKR / Rs., displays whole numbers cleanly without .00, e.g. "Rs. 1,250,000".
 * Adds a clean space after 'Rs.' or 'LKR' for great readability.
 */
export const formatCurrency = (amount: number, symbol = 'Rs.', decimals?: number): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    const sym = symbol === 'Rs.' || symbol === 'LKR' ? `${symbol} ` : symbol;
    return `${sym}0`;
  }
  
  const absAmount = Math.abs(amount);
  const isLKR = symbol === 'Rs.' || symbol === 'LKR';
  
  // For LKR, default to 0 decimals unless specifically requested or has fractional cents
  let decCount = decimals;
  if (decCount === undefined) {
    if (isLKR) {
      decCount = Number.isInteger(absAmount) ? 0 : 2;
    } else {
      decCount = 2;
    }
  }

  const formatted = absAmount.toLocaleString('en-US', {
    minimumFractionDigits: decCount,
    maximumFractionDigits: decCount,
  });

  const displayPrefix = isLKR ? `${symbol} ` : symbol;

  return amount < 0 ? `-${displayPrefix}${formatted}` : `${displayPrefix}${formatted}`;
};

export const formatNumber = (num: number): string => {
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US');
};

export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

export const calculateFinancialSummary = (bikes: Bike[]): FinancialSummary => {
  let inStockCount = 0;
  let soldCount = 0;
  let totalPurchaseCost = 0;
  let totalRepairCost = 0;
  let totalInventoryCost = 0;
  let totalSalesRevenue = 0;
  let totalFinanceAmount = 0;
  let totalFinanceCommission = 0;
  let totalNetProfit = 0;
  let cashSalesCount = 0;
  let financeSalesCount = 0;
  let totalCashInflow = 0;

  bikes.forEach((bike) => {
    const bikeOtherCost = calculateTotalOtherCosts(bike.repairCosts);
    const bikeTotalCost = (Number(bike.purchasePrice) || 0) + bikeOtherCost;

    totalPurchaseCost += Number(bike.purchasePrice) || 0;
    totalRepairCost += bikeOtherCost;

    if (bike.status === 'Sold' && bike.sale) {
      soldCount++;
      const sale = bike.sale;
      totalSalesRevenue += sale.saleAmount;
      totalNetProfit += sale.netProfit;
      totalCashInflow += sale.totalCashReceived;

      if (sale.saleMethod === 'Finance') {
        financeSalesCount++;
        totalFinanceAmount += sale.financeAmount;
        totalFinanceCommission += sale.financeCommission;
      } else {
        cashSalesCount++;
      }
    } else {
      inStockCount++;
      totalInventoryCost += bikeTotalCost;
    }
  });

  const totalOutflows = totalPurchaseCost + totalRepairCost;
  const cashFlowBalance = totalCashInflow - totalOutflows;
  const averageProfitPerBike = soldCount > 0 ? totalNetProfit / soldCount : 0;
  const averageProfitMarginPercent = totalSalesRevenue > 0 ? (totalNetProfit / totalSalesRevenue) * 100 : 0;

  return {
    totalBikesInStock: inStockCount,
    totalBikesSold: soldCount,
    totalBikesInventoryCount: bikes.length,
    totalPurchaseCost,
    totalRepairCost,
    totalInventoryCost,
    totalSalesRevenue,
    totalFinanceAmount,
    totalFinanceCommission,
    totalNetProfit,
    cashFlowBalance,
    cashSalesCount,
    financeSalesCount,
    averageProfitPerBike,
    averageProfitMarginPercent
  };
};

export const parseDateParts = (dateStr?: string): { year: number; month: number } | null => {
  if (!dateStr) return null;
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length >= 2) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(y) && !isNaN(m)) {
      return { year: y, month: m };
    }
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }
  return null;
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Calculates all 12 Monthly Summary figures based strictly on transactions
 * recorded within the selected month and year.
 */
export const calculateMonthlySummary = (
  bikes: Bike[],
  year: number,
  month: number
): MonthlySummary => {
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const monthLabel = `${MONTH_NAMES[month - 1] || 'Month'} ${year}`;
  const shortMonthLabel = `${SHORT_MONTH_NAMES[month - 1] || 'M'} ${year}`;

  // Filter sold vehicles whose saleDate matches the selected month & year
  const soldInMonth = bikes.filter((b) => {
    if (b.status !== 'Sold' || !b.sale) return false;
    const dp = parseDateParts(b.sale.saleDate);
    return dp !== null && dp.year === year && dp.month === month;
  });

  let totalSalesRevenue = 0;
  let totalVehicleCost = 0;
  let totalDownPayments = 0;
  let totalFinanceAmount = 0;
  let totalExpenses = 0;
  let cashSales = 0;
  let financeSales = 0;
  let carsSold = 0;
  let bikesSold = 0;
  let cashSalesCount = 0;
  let financeSalesCount = 0;

  soldInMonth.forEach((b) => {
    const sale = b.sale!;
    const isCar = b.vehicleType === 'Car';
    if (isCar) {
      carsSold++;
    } else {
      bikesSold++;
    }

    const saleAmount = Number(sale.saleAmount) || 0;
    const vehicleCost = Number(sale.purchasePrice ?? b.purchasePrice) || 0;
    const repairCost = Number(sale.totalRepairCost) || calculateTotalOtherCosts(b.repairCosts);

    totalSalesRevenue += saleAmount;
    totalVehicleCost += vehicleCost;
    totalExpenses += repairCost;

    if (sale.saleMethod === 'Finance') {
      financeSalesCount++;
      financeSales += saleAmount;
      totalDownPayments += Number(sale.customerDeposit) || 0;
      totalFinanceAmount += Number(sale.financeAmount) || 0;
    } else {
      cashSalesCount++;
      cashSales += saleAmount;
    }
  });

  const totalVehiclesSold = carsSold + bikesSold;
  
  // Gross Profit = Total Sales Revenue − Total Vehicle Cost
  const grossProfit = totalSalesRevenue - totalVehicleCost;
  
  // Net Profit = Gross Profit − Total Expenses
  const netProfit = grossProfit - totalExpenses;

  const grossMarginPercent = totalSalesRevenue > 0 ? (grossProfit / totalSalesRevenue) * 100 : 0;
  const netMarginPercent = totalSalesRevenue > 0 ? (netProfit / totalSalesRevenue) * 100 : 0;

  return {
    monthKey,
    monthLabel,
    shortMonthLabel,
    year,
    month,
    totalVehiclesSold,
    totalSalesRevenue,
    totalVehicleCost,
    totalDownPayments,
    totalFinanceAmount,
    totalExpenses,
    grossProfit,
    netProfit,
    cashSales,
    financeSales,
    carsSold,
    bikesSold,
    grossMarginPercent,
    netMarginPercent,
    cashSalesCount,
    financeSalesCount
  };
};

/**
 * Generates month-by-month financial summary list for trend comparison.
 * Extracts all months with recorded sales, plus recent months up to current date.
 */
export const generateMonthByMonthComparison = (
  bikes: Bike[],
  maxMonths = 12
): MonthlySummary[] => {
  const monthMap = new Map<string, { year: number; month: number }>();

  // Ensure current month is always present
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  monthMap.set(currentKey, { year: currentYear, month: currentMonth });

  // Add all months where a sale was recorded
  bikes.forEach((b) => {
    if (b.status === 'Sold' && b.sale?.saleDate) {
      const dp = parseDateParts(b.sale.saleDate);
      if (dp) {
        const key = `${dp.year}-${String(dp.month).padStart(2, '0')}`;
        monthMap.set(key, dp);
      }
    }
  });

  // Sort descending by monthKey (most recent first)
  const sortedKeys = Array.from(monthMap.keys()).sort((a, b) => b.localeCompare(a));
  
  // Take up to maxMonths
  const selectedKeys = sortedKeys.slice(0, maxMonths);

  return selectedKeys.map((key) => {
    const { year, month } = monthMap.get(key)!;
    return calculateMonthlySummary(bikes, year, month);
  });
};
