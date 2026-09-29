import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  Bike, 
  DealershipSettings, 
  FinancialSummary, 
  SaleRecord, 
  OtherCostItem, 
  AuthUser,
  StoredCredentials 
} from '../types';
import { sampleBikes, initialDealershipSettings } from '../data/initialData';
import { calculateFinancialSummary, calculateTotalOtherCosts, calculateTotalCost, formatCurrency } from '../utils/formatters';

interface ToastNotification {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'info' | 'error';
}

interface DealershipContextType {
  // Authentication
  isAuthenticated: boolean;
  currentUser: AuthUser | null;
  login: (username: string, password: string, rememberMe?: boolean) => { success: boolean; message?: string };
  logout: () => void;
  changeCredentials: (currentPassword: string, newUsername: string, newPassword: string) => { success: boolean; message?: string };
  resetCredentialsToDefault: () => void;

  bikes: Bike[];
  settings: DealershipSettings;
  summary: FinancialSummary;
  activeTab: 'dashboard' | 'inventory' | 'sales' | 'summary' | 'calculator' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'inventory' | 'sales' | 'summary' | 'calculator' | 'settings') => void;
  
  // Modals & Active selections
  selectedBike: Bike | null;
  setSelectedBike: (bike: Bike | null) => void;
  selectedSaleRecord: SaleRecord | null;
  setSelectedSaleRecord: (sale: SaleRecord | null) => void;
  
  isAddBikeModalOpen: boolean;
  setIsAddBikeModalOpen: (open: boolean) => void;
  isEditBikeModalOpen: boolean;
  setIsEditBikeModalOpen: (open: boolean) => void;
  isSaleModalOpen: boolean;
  setIsSaleModalOpen: (open: boolean) => void;
  isDetailModalOpen: boolean;
  setIsDetailModalOpen: (open: boolean) => void;
  isInvoiceModalOpen: boolean;
  setIsInvoiceModalOpen: (open: boolean) => void;
  
  // Actions
  addBike: (data: Partial<Bike>) => Bike;
  updateBike: (id: string, updates: Partial<Bike>) => void;
  deleteBike: (id: string) => void;
  recordSale: (bikeId: string, saleData: Omit<SaleRecord, 'id' | 'bikeId'>) => SaleRecord;
  revertSale: (bikeId: string) => void;
  addRepairItem: (bikeId: string, item: Omit<OtherCostItem, 'id'>) => void;
  removeRepairItem: (bikeId: string, repairId: string) => void;
  updateSettings: (updates: Partial<DealershipSettings>) => void;
  resetToDefaultData: () => void;
  clearAllData: () => void;
  exportDataToJson: () => void;
  importDataFromJson: (jsonStr: string) => boolean;
  
  // Toast & PWA
  toasts: ToastNotification[];
  dismissToast: (id: string) => void;
  showToast: (title: string, description?: string, type?: 'success' | 'info' | 'error') => void;
  isOnline: boolean;
  isPWAInstallable: boolean;
  installPWA: () => Promise<void>;
  
  // Quick triggers
  openSaleModalForBike: (bike: Bike) => void;
  openDetailModalForBike: (bike: Bike) => void;
  openEditModalForBike: (bike: Bike) => void;
  openInvoiceForSale: (sale: SaleRecord) => void;
}

const DealershipContext = createContext<DealershipContextType | undefined>(undefined);

const BIKES_STORAGE_KEY = 'wijesooriya_moto_bikes_v1';
const SETTINGS_STORAGE_KEY = 'wijesooriya_moto_settings_v1';
const AUTH_CREDENTIALS_KEY = 'wijesooriya_moto_credentials_v1';
const AUTH_SESSION_KEY = 'wijesooriya_moto_session_v1';

const DEFAULT_CREDENTIALS: StoredCredentials = {
  username: 'admin',
  passwordHash: 'admin',
  secondaryUser: 'wijesooriya',
  secondaryPassword: 'wijesooriya'
};

export const DealershipProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Authentication State
  const [credentials, setCredentials] = useState<StoredCredentials>(() => {
    try {
      const stored = localStorage.getItem(AUTH_CREDENTIALS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load credentials', e);
    }
    return DEFAULT_CREDENTIALS;
  });

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      // Check persistent session in localStorage first
      const storedLocal = localStorage.getItem(AUTH_SESSION_KEY);
      if (storedLocal) {
        return JSON.parse(storedLocal);
      }
      // Check temporary session in sessionStorage
      const storedSession = sessionStorage.getItem(AUTH_SESSION_KEY);
      if (storedSession) {
        return JSON.parse(storedSession);
      }
    } catch (e) {
      console.error('Failed to load auth session', e);
    }
    return null;
  });

  const isAuthenticated = !!currentUser;

  // Bikes Inventory State
  const [bikes, setBikes] = useState<Bike[]>(() => {
    try {
      // Check current storage key
      const stored = localStorage.getItem(BIKES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // Check previous key for smooth migration
      const legacy = localStorage.getItem('apex_moto_bikes_v2_lkr');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (err) {
      console.error('Failed to load bikes from storage', err);
    }
    return sampleBikes;
  });

  // Dealership Settings State
  const [settings, setSettings] = useState<DealershipSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed: DealershipSettings = JSON.parse(stored);
        // Automatically migrate any legacy name to Wijesooriya Motors
        if (!parsed.dealershipName || parsed.dealershipName === 'Apex Motorbike Sales' || parsed.dealershipName.includes('Apex')) {
          parsed.dealershipName = 'Wijesooriya Motors';
          parsed.email = 'sales@wijesooriyamotors.lk';
          parsed.tagline = 'Premier Motorbike Dealership & Sales Management System';
        }
        return parsed;
      }
      const legacy = localStorage.getItem('apex_moto_settings_v2_lkr');
      if (legacy) {
        const parsed: DealershipSettings = JSON.parse(legacy);
        parsed.dealershipName = 'Wijesooriya Motors';
        parsed.email = 'sales@wijesooriyamotors.lk';
        parsed.tagline = 'Premier Motorbike Dealership & Sales Management System';
        return parsed;
      }
    } catch (err) {
      console.error('Failed to load settings from storage', err);
    }
    return initialDealershipSettings;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'sales' | 'summary' | 'calculator' | 'settings'>('dashboard');
  
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null);
  const [selectedSaleRecord, setSelectedSaleRecord] = useState<SaleRecord | null>(null);
  
  const [isAddBikeModalOpen, setIsAddBikeModalOpen] = useState(false);
  const [isEditBikeModalOpen, setIsEditBikeModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPWAInstallable, setIsPWAInstallable] = useState<boolean>(false);

  // Sync bikes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(BIKES_STORAGE_KEY, JSON.stringify(bikes));
    } catch (e) {
      console.error('Failed to persist bikes', e);
    }
  }, [bikes]);

  // Sync settings to localStorage and apply theme
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to persist settings', e);
    }
    if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [settings]);

  // Network & PWA listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Dealership Online', 'Connected to network. Real-time sync enabled.', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Offline Mode Active', 'Operating offline with local PWA storage.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsPWAInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const showToast = (title: string, description?: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Authentication Handlers
  const login = (inputUser: string, inputPass: string, rememberMe = true): { success: boolean; message?: string } => {
    const cleanUser = inputUser.trim();
    const cleanPass = inputPass.trim();

    const isPrimaryMatch = 
      cleanUser.toLowerCase() === credentials.username.toLowerCase() && 
      cleanPass === credentials.passwordHash;

    const isSecondaryMatch = 
      credentials.secondaryUser && 
      credentials.secondaryPassword &&
      cleanUser.toLowerCase() === credentials.secondaryUser.toLowerCase() && 
      cleanPass === credentials.secondaryPassword;

    if (isPrimaryMatch || isSecondaryMatch) {
      const userObj: AuthUser = {
        username: cleanUser,
        displayName: cleanUser === 'admin' ? 'Administrator' : 'Wijesooriya Staff',
        role: cleanUser === 'admin' ? 'Administrator' : 'Sales Manager',
        lastLogin: new Date().toISOString()
      };

      setCurrentUser(userObj);

      if (rememberMe) {
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(userObj));
        sessionStorage.removeItem(AUTH_SESSION_KEY);
      } else {
        sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(userObj));
        localStorage.removeItem(AUTH_SESSION_KEY);
      }

      showToast(
        'Welcome to Wijesooriya Motors',
        `Logged in as ${userObj.displayName} (${userObj.username}).`,
        'success'
      );
      return { success: true };
    }

    return { 
      success: false, 
      message: 'Invalid username or password. Default login: admin / admin' 
    };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_SESSION_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    showToast('Logged Out', 'You have been safely logged out.', 'info');
  };

  const changeCredentials = (
    currentPassword: string,
    newUsername: string,
    newPassword: string
  ): { success: boolean; message?: string } => {
    if (!newUsername.trim() || !newPassword.trim()) {
      return { success: false, message: 'Username and password cannot be empty.' };
    }

    // Check if current password matches primary or secondary
    const isCurrentValid = 
      currentPassword === credentials.passwordHash || 
      (credentials.secondaryPassword && currentPassword === credentials.secondaryPassword);

    if (!isCurrentValid) {
      return { success: false, message: 'Current password does not match.' };
    }

    const updated: StoredCredentials = {
      ...credentials,
      username: newUsername.trim(),
      passwordHash: newPassword.trim()
    };

    setCredentials(updated);
    try {
      localStorage.setItem(AUTH_CREDENTIALS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save updated credentials', e);
    }

    if (currentUser) {
      const updatedUser: AuthUser = {
        ...currentUser,
        username: newUsername.trim()
      };
      setCurrentUser(updatedUser);
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(updatedUser));
    }

    showToast('Credentials Updated', 'Your login username and password have been saved.', 'success');
    return { success: true };
  };

  const resetCredentialsToDefault = () => {
    setCredentials(DEFAULT_CREDENTIALS);
    try {
      localStorage.setItem(AUTH_CREDENTIALS_KEY, JSON.stringify(DEFAULT_CREDENTIALS));
    } catch (e) {
      console.error(e);
    }
    showToast('Credentials Reset', 'Reset to defaults: admin / admin', 'info');
  };

  const installPWA = async () => {
    if (!deferredPrompt) {
      showToast('PWA Installed or Not Supported', 'App is already installed or running as standalone PWA.', 'info');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      showToast('App Installed', 'Wijesooriya Motors has been added to your home screen!', 'success');
    }
    setDeferredPrompt(null);
    setIsPWAInstallable(false);
  };

  const summary = useMemo(() => calculateFinancialSummary(bikes), [bikes]);

  const addBike = (data: Partial<Bike>): Bike => {
    const newId = `bike-${Date.now()}`;
    const otherCosts: OtherCostItem[] = data.repairCosts || [];
    const totalOtherCosts = calculateTotalOtherCosts(otherCosts);
    const costPrice = Number(data.purchasePrice) || 0;
    const totalCost = costPrice + totalOtherCosts;
    const targetSalePrice = Number(data.targetSalePrice) || Math.round(totalCost * 1.25);
    const estimatedProfit = targetSalePrice - totalCost;

    const newBike: Bike = {
      id: newId,
      vehicleType: data.vehicleType || 'Bike',
      make: data.make?.trim() || 'Honda',
      model: data.model?.trim() || 'Motorbike',
      year: Number(data.year) || new Date().getFullYear(),
      category: data.category || 'Standard / Commuter',
      vin: data.vin?.toUpperCase().trim() || `VIN-${Date.now().toString().slice(-8)}`,
      regPlate: data.regPlate?.toUpperCase().trim() || 'UNREG',
      mileage: Number(data.mileage) || 0,
      color: data.color?.trim() || 'Black',
      engineCapacityCc: Number(data.engineCapacityCc) || 125,
      condition: data.condition || 'Excellent',
      purchasePrice: costPrice,
      purchaseDate: data.purchaseDate || new Date().toISOString().split('T')[0],
      supplierOrSeller: data.supplierOrSeller?.trim() || 'Direct Purchase',
      repairCosts: otherCosts,
      totalCost,
      targetSalePrice,
      status: 'In Stock',
      imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setBikes((prev) => [newBike, ...prev]);
    showToast(
      'Motorbike Saved',
      `${newBike.year} ${newBike.make} ${newBike.model} added to Wijesooriya Motors. Cost: ${formatCurrency(costPrice, settings.currencySymbol)} | Est. Profit: +${formatCurrency(estimatedProfit, settings.currencySymbol)}`,
      'success'
    );
    return newBike;
  };

  const updateBike = (id: string, updates: Partial<Bike>) => {
    setBikes((prev) =>
      prev.map((bike) => {
        if (bike.id !== id) return bike;
        const newCostPrice = updates.purchasePrice !== undefined ? Number(updates.purchasePrice) : bike.purchasePrice;
        const newOtherCosts = updates.repairCosts !== undefined ? updates.repairCosts : bike.repairCosts;
        const newTotalCost = calculateTotalCost(newCostPrice, newOtherCosts);

        const updated: Bike = {
          ...bike,
          ...updates,
          purchasePrice: newCostPrice,
          repairCosts: newOtherCosts,
          totalCost: newTotalCost,
          updatedAt: new Date().toISOString()
        };

        if (updated.sale) {
          const totalOtherCosts = calculateTotalOtherCosts(newOtherCosts);
          const saleMethod = updated.sale.saleMethod;
          const saleAmount = updated.sale.saleAmount;
          let netProfit = 0;
          let totalCashReceived = saleAmount;

          if (saleMethod === 'Cash') {
            netProfit = saleAmount - newTotalCost;
          } else {
            const comm = updated.sale.financeCommission;
            totalCashReceived = saleAmount + comm;
            netProfit = (saleAmount + comm) - newTotalCost;
          }

          updated.sale = {
            ...updated.sale,
            purchasePrice: newCostPrice,
            totalRepairCost: totalOtherCosts,
            totalCost: newTotalCost,
            totalCashReceived,
            netProfit,
            profitMarginPercent: saleAmount > 0 ? (netProfit / saleAmount) * 100 : 0
          };
        }

        return updated;
      })
    );
    showToast('Motorbike Updated', 'Cost price, other costs, and profit calculations updated.', 'success');
  };

  const deleteBike = (id: string) => {
    const bikeToDelete = bikes.find((b) => b.id === id);
    setBikes((prev) => prev.filter((b) => b.id !== id));
    if (selectedBike?.id === id) {
      setSelectedBike(null);
      setIsDetailModalOpen(false);
      setIsEditBikeModalOpen(false);
    }
    showToast('Motorbike Deleted', `${bikeToDelete ? `${bikeToDelete.make} ${bikeToDelete.model}` : 'Bike'} removed.`, 'info');
  };

  const recordSale = (bikeId: string, saleData: Omit<SaleRecord, 'id' | 'bikeId'>): SaleRecord => {
    const saleId = `sale-${Date.now()}`;
    const bike = bikes.find((b) => b.id === bikeId);
    if (!bike) throw new Error('Bike not found');

    const newSale: SaleRecord = {
      ...saleData,
      id: saleId,
      bikeId: bikeId,
      vehicleType: saleData.vehicleType || bike.vehicleType || 'Bike',
      bikeSummary: `${bike.year} ${bike.make} ${bike.model}`
    };

    setBikes((prev) =>
      prev.map((b) => {
        if (b.id !== bikeId) return b;
        return {
          ...b,
          status: 'Sold',
          sale: newSale,
          updatedAt: new Date().toISOString()
        };
      })
    );

    const commissionNotice = newSale.saleMethod === 'Finance'
      ? ` Included 3% finance commission of ${formatCurrency(newSale.financeCommission, settings.currencySymbol)}.`
      : '';
    showToast(
      'Sale Recorded!',
      `${newSale.bikeSummary} sold for ${formatCurrency(newSale.saleAmount, settings.currencySymbol)} (${newSale.saleMethod}). Net Profit: ${formatCurrency(newSale.netProfit, settings.currencySymbol)}.${commissionNotice}`,
      'success'
    );

    return newSale;
  };

  const revertSale = (bikeId: string) => {
    setBikes((prev) =>
      prev.map((b) => {
        if (b.id !== bikeId) return b;
        const { sale, ...rest } = b;
        return {
          ...rest,
          status: 'In Stock',
          updatedAt: new Date().toISOString()
        };
      })
    );
    showToast('Sale Voided', 'Motorbike returned to In Stock inventory.', 'info');
  };

  const addRepairItem = (bikeId: string, item: Omit<OtherCostItem, 'id'>) => {
    const newOtherCost: OtherCostItem = {
      ...item,
      id: `cost-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`
    };

    setBikes((prev) =>
      prev.map((bike) => {
        if (bike.id !== bikeId) return bike;
        const newOtherCosts = [...bike.repairCosts, newOtherCost];
        const newTotalCost = calculateTotalCost(bike.purchasePrice, newOtherCosts);
        return {
          ...bike,
          repairCosts: newOtherCosts,
          totalCost: newTotalCost,
          updatedAt: new Date().toISOString()
        };
      })
    );
    showToast(
      'Other Cost Added',
      `Logged "${item.description}" (${formatCurrency(item.cost, settings.currencySymbol)}).`,
      'success'
    );
  };

  const removeRepairItem = (bikeId: string, repairId: string) => {
    setBikes((prev) =>
      prev.map((bike) => {
        if (bike.id !== bikeId) return bike;
        const newOtherCosts = bike.repairCosts.filter((r) => r.id !== repairId);
        const newTotalCost = calculateTotalCost(bike.purchasePrice, newOtherCosts);
        return {
          ...bike,
          repairCosts: newOtherCosts,
          totalCost: newTotalCost,
          updatedAt: new Date().toISOString()
        };
      })
    );
    showToast('Expense Removed', 'Total cost and profit margin adjusted.', 'info');
  };

  const updateSettings = (updates: Partial<DealershipSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    showToast('Settings Saved', 'Wijesooriya Motors configuration updated.', 'success');
  };

  const resetToDefaultData = () => {
    setBikes(sampleBikes);
    setSettings(initialDealershipSettings);
    showToast('Reset Complete', 'Loaded realistic dealership sales records (Cars & Bikes).', 'info');
  };

  const clearAllData = () => {
    setBikes([]);
    showToast('Data Cleared', 'All inventory motorbikes and sales have been cleared.', 'info');
  };

  const exportDataToJson = () => {
    const backup = {
      version: '3.0',
      dealership: 'Wijesooriya Motors',
      currency: 'LKR',
      exportedAt: new Date().toISOString(),
      settings,
      bikes
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Wijesooriya-Motors-LKR-Backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Database Exported', 'Downloaded complete Wijesooriya Motors JSON backup.', 'success');
  };

  const importDataFromJson = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.bikes)) {
        setBikes(data.bikes);
        if (data.settings) setSettings(data.settings);
        showToast('Backup Restored', `Restored ${data.bikes.length} motorbikes from JSON.`, 'success');
        return true;
      }
      throw new Error('Invalid JSON structure');
    } catch (e) {
      showToast('Import Error', 'File is corrupted or has an invalid structure.', 'error');
      return false;
    }
  };

  const openSaleModalForBike = (bike: Bike) => {
    setSelectedBike(bike);
    setIsSaleModalOpen(true);
  };

  const openDetailModalForBike = (bike: Bike) => {
    setSelectedBike(bike);
    setIsDetailModalOpen(true);
  };

  const openEditModalForBike = (bike: Bike) => {
    setSelectedBike(bike);
    setIsEditBikeModalOpen(true);
  };

  const openInvoiceForSale = (sale: SaleRecord) => {
    setSelectedSaleRecord(sale);
    const bike = bikes.find((b) => b.id === sale.bikeId) || null;
    setSelectedBike(bike);
    setIsInvoiceModalOpen(true);
  };

  return (
    <DealershipContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        login,
        logout,
        changeCredentials,
        resetCredentialsToDefault,
        bikes,
        settings,
        summary,
        activeTab,
        setActiveTab,
        selectedBike,
        setSelectedBike,
        selectedSaleRecord,
        setSelectedSaleRecord,
        isAddBikeModalOpen,
        setIsAddBikeModalOpen,
        isEditBikeModalOpen,
        setIsEditBikeModalOpen,
        isSaleModalOpen,
        setIsSaleModalOpen,
        isDetailModalOpen,
        setIsDetailModalOpen,
        isInvoiceModalOpen,
        setIsInvoiceModalOpen,
        addBike,
        updateBike,
        deleteBike,
        recordSale,
        revertSale,
        addRepairItem,
        removeRepairItem,
        updateSettings,
        resetToDefaultData,
        clearAllData,
        exportDataToJson,
        importDataFromJson,
        toasts,
        dismissToast,
        showToast,
        isOnline,
        isPWAInstallable,
        installPWA,
        openSaleModalForBike,
        openDetailModalForBike,
        openEditModalForBike,
        openInvoiceForSale
      }}
    >
      {children}
    </DealershipContext.Provider>
  );
};

export const useDealership = (): DealershipContextType => {
  const context = useContext(DealershipContext);
  if (!context) {
    throw new Error('useDealership must be used within a DealershipProvider');
  }
  return context;
};
