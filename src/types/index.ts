export type VehicleType = 'Bike' | 'Car';

export type BikeCategory = 
  | 'Sport' 
  | 'Cruiser' 
  | 'Adventure' 
  | 'Naked' 
  | 'Touring' 
  | 'Scooter' 
  | 'Off-Road' 
  | 'Cafe Racer' 
  | 'Standard / Commuter'
  | 'Sedan'
  | 'SUV'
  | 'Hatchback'
  | 'Van / Wagon'
  | 'Pickup Truck'
  | 'Coupe';

export type BikeCondition = 'Brand New' | 'Excellent' | 'Good' | 'Fair';

export type BikeStatus = 'In Stock' | 'Reserved' | 'Sold';

export type SaleMethod = 'Cash' | 'Finance';

export type OtherCostCategory = 
  | 'Repair' 
  | 'Spare Parts' 
  | 'Transport' 
  | 'Documentation' 
  | 'Paint/Polish' 
  | 'Service' 
  | 'Insurance' 
  | 'Other';

export interface OtherCostItem {
  id: string;
  category?: OtherCostCategory;
  description: string;
  cost: number;
  date: string;
  invoiceRef?: string;
}

// Backward compatibility alias
export type RepairCostItem = OtherCostItem;

export interface SaleRecord {
  id: string;
  bikeId: string;
  vehicleType?: VehicleType;
  bikeSummary: string;
  saleDate: string;
  saleMethod: SaleMethod;
  saleAmount: number;
  
  // Financial breakdown
  purchasePrice: number; // Cost Price
  totalRepairCost: number; // Total Other Costs
  totalCost: number; // Cost Price + Total Other Costs
  
  // Finance specific fields
  financeAmount: number;
  financeCommissionRate: number; // 0.03 for 3%
  financeCommission: number; // 3% of financeAmount
  customerDeposit: number;
  
  // Summary outputs
  totalCashReceived: number;
  netProfit: number;
  profitMarginPercent: number;
  
  // Customer info
  customerName: string;
  customerPhone: string;
  customerIdNumber?: string; // Customer ID / NIC
  customerSecondaryPhone?: string; // Customer second phone number
  customerEmail?: string;
  customerAddress?: string;
  
  // Guarantor info (for finance sales)
  guarantorName?: string;
  guarantorAddress?: string;
  guarantorPhone?: string;
  guarantorIdNumber?: string; // Guarantor ID / NIC
  
  // Finance provider info
  financeProvider?: string;
  financeAgreementNumber?: string;
  financeTermMonths?: number;
  
  notes?: string;
}

export interface Bike {
  id: string;
  vehicleType?: VehicleType;
  make: string;
  model: string;
  year: number;
  category: BikeCategory;
  vin: string;
  regPlate: string;
  mileage: number;
  color: string;
  engineCapacityCc: number;
  condition: BikeCondition;
  
  // Cost breakdown
  purchasePrice: number; // Cost Price
  purchaseDate: string;
  supplierOrSeller: string;
  repairCosts: OtherCostItem[]; // Additional expenses / Other Costs
  totalCost: number; // Cost Price + Other Costs
  
  targetSalePrice: number; // Selling Price / Target Selling Price
  status: BikeStatus;
  imageUrl: string;
  notes?: string;
  
  sale?: SaleRecord;
  createdAt: string;
  updatedAt: string;
}

export interface DealershipSettings {
  dealershipName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  taxNumber?: string;
  currencySymbol: string;
  currencyCode: string;
  defaultFinanceCommissionRate: number;
  theme: 'dark' | 'light';
}

export interface MonthlySummary {
  monthKey: string;           // "YYYY-MM" e.g. "2026-09"
  monthLabel: string;         // e.g. "September 2026"
  shortMonthLabel: string;    // e.g. "Sep 2026"
  year: number;
  month: number;              // 1 to 12

  // The 12 exact metric definitions requested:
  totalVehiclesSold: number;  // Cars + Bikes sold during selected month
  totalSalesRevenue: number;  // Full selling price of vehicles sold during selected month
  totalVehicleCost: number;   // Purchase/cost price of all vehicles sold during selected month
  totalDownPayments: number;  // Down payments collected for finance sales during selected month
  totalFinanceAmount: number; // Financed amount for finance sales during selected month
  totalExpenses: number;      // Additional business expenses during selected month (transport, repairs, reg, etc.)
  grossProfit: number;        // Total Sales Revenue − Total Vehicle Cost
  netProfit: number;          // Gross Profit − Total Expenses
  cashSales: number;          // Total sales revenue from fully cash sales during selected month
  financeSales: number;       // Total sales revenue from financed sales during selected month
  carsSold: number;           // Total cars sold during selected month
  bikesSold: number;          // Total bikes sold during selected month

  // Analytical ratios:
  grossMarginPercent: number; // (grossProfit / totalSalesRevenue) * 100
  netMarginPercent: number;   // (netProfit / totalSalesRevenue) * 100
  cashSalesCount: number;
  financeSalesCount: number;
}

export interface FinancialSummary {
  totalBikesInStock: number;
  totalBikesSold: number;
  totalBikesInventoryCount: number;
  
  totalPurchaseCost: number; // Total Cost Prices
  totalRepairCost: number; // Total Other Costs
  totalInventoryCost: number; // Cost Prices + Other Costs of in-stock
  
  totalSalesRevenue: number;
  totalFinanceAmount: number;
  totalFinanceCommission: number;
  
  totalNetProfit: number;
  cashFlowBalance: number;
  
  cashSalesCount: number;
  financeSalesCount: number;
  averageProfitPerBike: number;
  averageProfitMarginPercent: number;
}

export interface AuthUser {
  username: string;
  displayName: string;
  role: 'Administrator' | 'Sales Manager' | 'Staff';
  lastLogin: string;
}

export interface StoredCredentials {
  username: string;
  passwordHash: string; // Stored plain or hash for local simplicity
  secondaryUser?: string;
  secondaryPassword?: string;
}
