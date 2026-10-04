import { Bike, DealershipSettings } from '../types';

export const initialDealershipSettings: DealershipSettings = {
  dealershipName: '',
  tagline: 'Business Sales & Inventory Management',
  address: '',
  phone: '',
  email: '',
  taxNumber: '',
  currencySymbol: 'Rs.',
  currencyCode: 'LKR',
  defaultFinanceCommissionRate: 0.03, // 3%
  theme: 'dark'
};

export const sampleBikes: Bike[] = [
  // 1. September 2026 - Car Sold via Finance
  {
    id: 'bike-car-1',
    vehicleType: 'Light Vehicle',
    make: 'Toyota',
    model: 'Vitz F LED Edition',
    year: 2019,
    category: 'Manual',
    vin: 'KSP130-2049182',
    regPlate: 'CBD-4821',
    mileage: 48200,
    color: 'Pearl White',
    engineCapacityCc: 996,
    condition: 'Used',
    purchasePrice: 4100000, // Vehicle Cost Price
    purchaseDate: '2026-08-15',
    supplierOrSeller: 'Direct Import / Japan Auction',
    repairCosts: [
      {
        id: 'c1-exp-1',
        category: 'Service',
        description: 'Engine Oil, Transmission Fluid & Filter Change',
        cost: 45000,
        date: '2026-09-02'
      },
      {
        id: 'c1-exp-2',
        category: 'Paint/Polish',
        description: 'Complete 3-Stage Cut & Interior Nano Detail',
        cost: 35000,
        date: '2026-09-04'
      },
      {
        id: 'c1-exp-3',
        category: 'Documentation',
        description: 'Revenue License & Transfer Documentation',
        cost: 40000,
        date: '2026-09-05'
      }
    ],
    totalCost: 4220000, // 4,100,000 + 120,000
    targetSalePrice: 4800000,
    status: 'Sold',
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    notes: 'Well maintained Japanese hatch. 1st Sri Lankan registered owner.',
    createdAt: '2026-08-15T10:00:00.000Z',
    updatedAt: '2026-09-12T14:30:00.000Z',
    sale: {
      id: 'sale-car-1',
      bikeId: 'bike-car-1',
      vehicleType: 'Light Vehicle',
      bikeSummary: '2019 Toyota Vitz F LED Edition',
      saleDate: '2026-09-12',
      saleMethod: 'Finance',
      saleAmount: 4800000, // Full Selling Price
      purchasePrice: 4100000, // Vehicle Cost Price
      totalRepairCost: 120000, // Additional Expenses
      totalCost: 4220000,
      financeAmount: 3300000,
      financeCommissionRate: 0.03,
      financeCommission: 99000,
      customerDeposit: 1500000, // Down payment
      totalCashReceived: 4899000,
      netProfit: 679000, // Gross Profit (700,000) - Expenses (120,000) + Commission (99,000)
      profitMarginPercent: 14.15,
      customerName: 'Kavindu Senanayake',
      customerPhone: '+94 77 884 1920',
      customerIdNumber: '199228401928',
      customerSecondaryPhone: '+94 71 394 8821',
      customerAddress: 'Mathammana, Minuwangoda, Sri Lanka',
      guarantorName: 'Sunil Senanayake',
      guarantorPhone: '+94 76 991 2283',
      guarantorIdNumber: '681940128V',
      guarantorAddress: 'Mathammana, Minuwangoda, Sri Lanka',
      financeProvider: 'Central Finance Company PLC',
      financeAgreementNumber: 'CF-2026-90412',
      financeTermMonths: 48
    }
  },

  // 2. September 2026 - Bike Sold via Cash
  {
    id: 'bike-moto-1',
    vehicleType: 'Bike',
    make: 'Honda',
    model: 'CB Hornet 160R Dual Disc',
    year: 2021,
    category: 'Manual',
    vin: 'ME4KC161HK802194',
    regPlate: 'BGT-7104',
    mileage: 18400,
    color: 'Striking Green / Matte Grey',
    engineCapacityCc: 162,
    condition: 'Used',
    purchasePrice: 620000, // Vehicle Cost Price
    purchaseDate: '2026-08-20',
    supplierOrSeller: 'Direct Purchase from Owner',
    repairCosts: [
      {
        id: 'm1-exp-1',
        category: 'Service',
        description: 'Complete periodic service and Motul synthetic oil',
        cost: 15000,
        date: '2026-09-03'
      },
      {
        id: 'm1-exp-2',
        category: 'Transport',
        description: 'Transport & showroom recovery',
        cost: 20000,
        date: '2026-09-04'
      }
    ],
    totalCost: 655000,
    targetSalePrice: 780000,
    status: 'Sold',
    imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
    notes: 'Pristine condition commuter bike.',
    createdAt: '2026-08-20T08:00:00.000Z',
    updatedAt: '2026-09-18T16:00:00.000Z',
    sale: {
      id: 'sale-moto-1',
      bikeId: 'bike-moto-1',
      vehicleType: 'Bike',
      bikeSummary: '2021 Honda CB Hornet 160R Dual Disc',
      saleDate: '2026-09-18',
      saleMethod: 'Cash',
      saleAmount: 780000, // Full Selling Price
      purchasePrice: 620000, // Vehicle Cost Price
      totalRepairCost: 35000, // Additional Expenses
      totalCost: 655000,
      financeAmount: 0,
      financeCommissionRate: 0,
      financeCommission: 0,
      customerDeposit: 780000,
      totalCashReceived: 780000,
      netProfit: 125000, // Gross Profit (160,000) - Expenses (35,000)
      profitMarginPercent: 16.03,
      customerName: 'Nuwan Bandara',
      customerPhone: '+94 71 445 6789',
      customerIdNumber: '199581902847',
      customerAddress: 'No. 18, Galle Road, Kalutara'
    }
  },

  // 3. August 2026 - Car Sold via Cash
  {
    id: 'bike-car-2',
    vehicleType: 'Light Vehicle',
    make: 'Suzuki',
    model: 'Alto 800 LXi',
    year: 2018,
    category: 'Manual',
    vin: 'MA3EYA61S0091823',
    regPlate: 'CAM-8912',
    mileage: 52000,
    color: 'Silky Silver',
    engineCapacityCc: 796,
    condition: 'Used',
    purchasePrice: 2650000, // Vehicle Cost Price
    purchaseDate: '2026-07-28',
    supplierOrSeller: 'Trade-in Customer',
    repairCosts: [
      {
        id: 'c2-exp-1',
        category: 'Repair',
        description: 'New front suspension bushes & alignment',
        cost: 45000,
        date: '2026-08-02'
      },
      {
        id: 'c2-exp-2',
        category: 'Documentation',
        description: 'Ownership transfer & revenue renewal',
        cost: 30000,
        date: '2026-08-04'
      }
    ],
    totalCost: 2725000,
    targetSalePrice: 3100000,
    status: 'Sold',
    imageUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
    notes: 'Economical city car. Verified service history.',
    createdAt: '2026-07-28T09:00:00.000Z',
    updatedAt: '2026-08-10T11:00:00.000Z',
    sale: {
      id: 'sale-car-2',
      bikeId: 'bike-car-2',
      vehicleType: 'Light Vehicle',
      bikeSummary: '2018 Suzuki Alto 800 LXi',
      saleDate: '2026-08-10',
      saleMethod: 'Cash',
      saleAmount: 3100000,
      purchasePrice: 2650000,
      totalRepairCost: 75000,
      totalCost: 2725000,
      financeAmount: 0,
      financeCommissionRate: 0,
      financeCommission: 0,
      customerDeposit: 3100000,
      totalCashReceived: 3100000,
      netProfit: 375000,
      profitMarginPercent: 12.1,
      customerName: 'Tharindu Wickramasinghe',
      customerPhone: '+94 77 332 9901',
      customerIdNumber: '198912304910',
      customerAddress: 'No. 88, Kandy Road, Gampaha'
    }
  },

  // 4. August 2026 - Bike Sold via Finance
  {
    id: 'bike-moto-2',
    vehicleType: 'Bike',
    make: 'Yamaha',
    model: 'FZ-S V3 ABS FI',
    year: 2022,
    category: 'Manual',
    vin: 'ME1RG441J008129',
    regPlate: 'BHM-3290',
    mileage: 14200,
    color: 'Matte Blue',
    engineCapacityCc: 149,
    condition: 'Brand New',
    purchasePrice: 780000,
    purchaseDate: '2026-07-25',
    supplierOrSeller: 'Direct Purchase',
    repairCosts: [
      {
        id: 'm2-exp-1',
        category: 'Service',
        description: 'Yamalube full synthetic service & wash',
        cost: 20000,
        date: '2026-08-01'
      },
      {
        id: 'm2-exp-2',
        category: 'Spare Parts',
        description: 'Original brake pads replacement',
        cost: 20000,
        date: '2026-08-03'
      }
    ],
    totalCost: 820000,
    targetSalePrice: 950000,
    status: 'Sold',
    imageUrl: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
    notes: 'Single owner, pristine condition with single channel ABS.',
    createdAt: '2026-07-25T11:00:00.000Z',
    updatedAt: '2026-08-22T15:00:00.000Z',
    sale: {
      id: 'sale-moto-2',
      bikeId: 'bike-moto-2',
      vehicleType: 'Bike',
      bikeSummary: '2022 Yamaha FZ-S V3 ABS FI',
      saleDate: '2026-08-22',
      saleMethod: 'Finance',
      saleAmount: 950000,
      purchasePrice: 780000,
      totalRepairCost: 40000,
      totalCost: 820000,
      financeAmount: 600000,
      financeCommissionRate: 0.03,
      financeCommission: 18000,
      customerDeposit: 350000,
      totalCashReceived: 968000,
      netProfit: 148000,
      profitMarginPercent: 15.58,
      customerName: 'Sachith Fernando',
      customerPhone: '+94 75 889 0012',
      customerIdNumber: '199849201948',
      customerAddress: 'No. 12/B, Negombo Road, Ja-Ela',
      guarantorName: 'Malik Fernando',
      guarantorPhone: '+94 77 114 9902',
      guarantorIdNumber: '711940192V',
      guarantorAddress: 'No. 12/B, Negombo Road, Ja-Ela',
      financeProvider: 'Commercial Leasing & Finance PLC',
      financeAgreementNumber: 'CLC-2026-8812',
      financeTermMonths: 36
    }
  },

  // 5. In-Stock Bike
  {
    id: 'bike-moto-3',
    vehicleType: 'Bike',
    make: 'Honda',
    model: 'Dio 110 Deluxe',
    year: 2023,
    category: 'Auto',
    vin: 'ME4JF541MK901824',
    regPlate: 'BJR-8012',
    mileage: 9500,
    color: 'Matte Axis Grey Metallic',
    engineCapacityCc: 109,
    condition: 'Used',
    purchasePrice: 580000,
    purchaseDate: '2026-09-10',
    supplierOrSeller: 'Direct Purchase from Lady Owner',
    repairCosts: [
      {
        id: 'm3-exp-1',
        category: 'Service',
        description: 'Complete engine tuning & CVT belt inspection',
        cost: 18000,
        date: '2026-09-14'
      }
    ],
    totalCost: 598000,
    targetSalePrice: 690000,
    status: 'In Stock',
    imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
    notes: 'Well maintained automatic scooter.',
    createdAt: '2026-09-10T10:00:00.000Z',
    updatedAt: '2026-09-14T12:00:00.000Z'
  },

  // 6. In-Stock Car
  {
    id: 'bike-car-3',
    vehicleType: 'Light Vehicle',
    make: 'Suzuki',
    model: 'Wagon R Stingray Hybrid',
    year: 2018,
    category: 'Manual',
    vin: 'MH55S-192840',
    regPlate: 'CBH-1049',
    mileage: 61000,
    color: 'Midnight Black Metallic',
    engineCapacityCc: 658,
    condition: 'Used',
    purchasePrice: 5200000,
    purchaseDate: '2026-09-15',
    supplierOrSeller: 'Registered Dealer Exchange',
    repairCosts: [
      {
        id: 'c3-exp-1',
        category: 'Service',
        description: 'Hybrid cooling fan cleaning & filter change',
        cost: 25000,
        date: '2026-09-16'
      },
      {
        id: 'c3-exp-2',
        category: 'Paint/Polish',
        description: 'Ceramic paint protection coat',
        cost: 35000,
        date: '2026-09-17'
      }
    ],
    totalCost: 5260000,
    targetSalePrice: 5950000,
    status: 'In Stock',
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    notes: 'Safety package with heads-up display and dual sensor brake support.',
    createdAt: '2026-09-15T09:00:00.000Z',
    updatedAt: '2026-09-17T14:00:00.000Z'
  }
];
