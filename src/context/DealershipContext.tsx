import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { collection, deleteDoc, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { 
  Bike, 
  DealershipSettings, 
  FinancialSummary, 
  SaleRecord, 
  OtherCostItem, 
  AuthUser,
} from '../types';
import { sampleBikes, initialDealershipSettings } from '../data/initialData';
import { calculateFinancialSummary, calculateTotalOtherCosts, calculateTotalCost, formatCurrency } from '../utils/formatters';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

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
  logout: () => void;

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

export const DealershipProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const currentUser: AuthUser | null = user ? {
    username: user.email || user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || user.uid,
    role: isAdmin ? 'Administrator' : 'Staff',
    lastLogin: user.metadata.lastSignInTime || ''
  } : null;
  const isAuthenticated = !!currentUser;

  const [bikes, setBikes] = useState<Bike[]>([]);
  const [settings, setSettings] = useState<DealershipSettings>(initialDealershipSettings);

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

  // Apply the account's theme.
  useEffect(() => {
    if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [settings]);

  useEffect(() => {
    setBikes([]);
    setSettings(initialDealershipSettings);
    setSelectedBike(null);
    setSelectedSaleRecord(null);
    if (!user) return;

    const bikesCollection = collection(db, 'bikes');
    const bikesQuery = isAdmin
      ? bikesCollection
      : query(bikesCollection, where('ownerUid', '==', user.uid));
    const unsubscribeBikes = onSnapshot(
      bikesQuery,
      (snapshot) => setBikes(snapshot.docs.map((bikeDoc) => ({ ...bikeDoc.data(), id: bikeDoc.id } as Bike))),
      (error) => {
        console.error('Failed to load dealership records', error);
        showToast('Data Could Not Load', 'Check your connection and Firebase security rules.', 'error');
      }
    );
    const unsubscribeSettings = onSnapshot(
      doc(db, 'userSettings', user.uid),
      (snapshot) => setSettings(snapshot.exists()
        ? { ...initialDealershipSettings, ...snapshot.data() } as DealershipSettings
        : initialDealershipSettings),
      (error) => console.error('Failed to load dealership settings', error)
    );

    return () => {
      unsubscribeBikes();
      unsubscribeSettings();
    };
  }, [user?.uid, isAdmin]);

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

  const persistBike = (bike: Bike) => {
    if (!user) return;
    const ownedBike = { ...bike, ownerUid: bike.ownerUid || user.uid };
    void setDoc(doc(db, 'bikes', bike.id), ownedBike).catch((error) => {
      console.error('Failed to save dealership record', error);
      showToast('Save Failed', 'Your changes could not be saved to the database.', 'error');
    });
  };

  const persistSettings = (nextSettings: DealershipSettings) => {
    if (!user) return;
    void setDoc(doc(db, 'userSettings', user.uid), nextSettings).catch((error) => {
      console.error('Failed to save dealership settings', error);
      showToast('Settings Save Failed', 'Your settings could not be saved to the database.', 'error');
    });
  };

  const replaceVisibleBikes = (nextBikes: Bike[]) => {
    if (!user) return;
    const userBikes = bikes.filter((bike) => bike.ownerUid === user.uid);
    const ownedNextBikes = nextBikes.map((bike) => ({ ...bike, ownerUid: user.uid }));
    const retainedIds = new Set(ownedNextBikes.map((bike) => bike.id));
    for (const bike of userBikes) {
      if (!retainedIds.has(bike.id)) {
        void deleteDoc(doc(db, 'bikes', bike.id)).catch((error) => {
          console.error('Failed to remove dealership record', error);
          showToast('Delete Failed', 'A record could not be removed from the database.', 'error');
        });
      }
    }
    setBikes((currentBikes) => isAdmin
      ? [...ownedNextBikes, ...currentBikes.filter((bike) => bike.ownerUid !== user.uid)]
      : ownedNextBikes);
    ownedNextBikes.forEach(persistBike);
  };

  const logout = () => {
    void signOut(auth).catch((error) => console.error('Failed to sign out of Firebase', error));
    showToast('Logged Out', 'You have been safely logged out.', 'info');
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
    const newId = doc(collection(db, 'bikes')).id;
    const otherCosts: OtherCostItem[] = data.repairCosts || [];
    const totalOtherCosts = calculateTotalOtherCosts(otherCosts);
    const costPrice = Number(data.purchasePrice) || 0;
    const totalCost = costPrice + totalOtherCosts;
    const targetSalePrice = Number(data.targetSalePrice) || Math.round(totalCost * 1.25);
    const estimatedProfit = targetSalePrice - totalCost;

    const newBike: Bike = {
      id: newId,
      ownerUid: user?.uid,
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
    persistBike(newBike);
    showToast(
      'Motorbike Saved',
      `${newBike.year} ${newBike.make} ${newBike.model} added to Wijesooriya Motors. Cost: ${formatCurrency(costPrice, settings.currencySymbol)} | Est. Profit: +${formatCurrency(estimatedProfit, settings.currencySymbol)}`,
      'success'
    );
    return newBike;
  };

  const updateBike = (id: string, updates: Partial<Bike>) => {
    const bike = bikes.find((item) => item.id === id);
    if (!bike) return;
    const newCostPrice = updates.purchasePrice !== undefined ? Number(updates.purchasePrice) : bike.purchasePrice;
    const newOtherCosts = updates.repairCosts !== undefined ? updates.repairCosts : bike.repairCosts;
    const newTotalCost = calculateTotalCost(newCostPrice, newOtherCosts);
    const updated: Bike = {
      ...bike,
      ...updates,
      id: bike.id,
      ownerUid: bike.ownerUid,
      purchasePrice: newCostPrice,
      repairCosts: newOtherCosts,
      totalCost: newTotalCost,
      updatedAt: new Date().toISOString()
    };

    if (updated.sale) {
      const totalOtherCosts = calculateTotalOtherCosts(newOtherCosts);
      const saleAmount = updated.sale.saleAmount;
      const totalCashReceived = updated.sale.saleMethod === 'Cash'
        ? saleAmount
        : saleAmount + updated.sale.financeCommission;
      const netProfit = totalCashReceived - newTotalCost;
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

    setBikes((prev) => prev.map((item) => item.id === id ? updated : item));
    persistBike(updated);
    showToast('Motorbike Updated', 'Cost price, other costs, and profit calculations updated.', 'success');
  };

  const deleteBike = (id: string) => {
    const bikeToDelete = bikes.find((b) => b.id === id);
    setBikes((prev) => prev.filter((b) => b.id !== id));
    void deleteDoc(doc(db, 'bikes', id)).catch((error) => {
      console.error('Failed to delete dealership record', error);
      showToast('Delete Failed', 'The record could not be removed from the database.', 'error');
    });
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

    const updatedBike = { ...bike, status: 'Sold' as const, sale: newSale, updatedAt: new Date().toISOString() };
    setBikes((prev) => prev.map((item) => item.id === bikeId ? updatedBike : item));
    persistBike(updatedBike);

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
    const bike = bikes.find((item) => item.id === bikeId);
    if (!bike) return;
    const { sale, ...rest } = bike;
    const updatedBike = { ...rest, status: 'In Stock' as const, updatedAt: new Date().toISOString() };
    setBikes((prev) => prev.map((item) => item.id === bikeId ? updatedBike : item));
    persistBike(updatedBike);
    showToast('Sale Voided', 'Motorbike returned to In Stock inventory.', 'info');
  };

  const addRepairItem = (bikeId: string, item: Omit<OtherCostItem, 'id'>) => {
    const newOtherCost: OtherCostItem = {
      ...item,
      id: doc(collection(db, 'bikes')).id
    };
    const bike = bikes.find((item) => item.id === bikeId);
    if (!bike) return;
    const newOtherCosts = [...bike.repairCosts, newOtherCost];
    const updatedBike = {
      ...bike,
      repairCosts: newOtherCosts,
      totalCost: calculateTotalCost(bike.purchasePrice, newOtherCosts),
      updatedAt: new Date().toISOString()
    };
    setBikes((prev) => prev.map((item) => item.id === bikeId ? updatedBike : item));
    persistBike(updatedBike);
    showToast(
      'Other Cost Added',
      `Logged "${item.description}" (${formatCurrency(item.cost, settings.currencySymbol)}).`,
      'success'
    );
  };

  const removeRepairItem = (bikeId: string, repairId: string) => {
    const bike = bikes.find((item) => item.id === bikeId);
    if (!bike) return;
    const newOtherCosts = bike.repairCosts.filter((repair) => repair.id !== repairId);
    const updatedBike = {
      ...bike,
      repairCosts: newOtherCosts,
      totalCost: calculateTotalCost(bike.purchasePrice, newOtherCosts),
      updatedAt: new Date().toISOString()
    };
    setBikes((prev) => prev.map((item) => item.id === bikeId ? updatedBike : item));
    persistBike(updatedBike);
    showToast('Expense Removed', 'Total cost and profit margin adjusted.', 'info');
  };

  const updateSettings = (updates: Partial<DealershipSettings>) => {
    const nextSettings = { ...settings, ...updates };
    setSettings(nextSettings);
    persistSettings(nextSettings);
    showToast('Settings Saved', 'Wijesooriya Motors configuration updated.', 'success');
  };

  const resetToDefaultData = () => {
    const newIds = new Map(sampleBikes.map((bike) => [bike.id, doc(collection(db, 'bikes')).id]));
    const resetBikes = sampleBikes.map((bike) => ({
      ...bike,
      id: newIds.get(bike.id)!,
      ownerUid: user?.uid,
      sale: bike.sale ? { ...bike.sale, bikeId: newIds.get(bike.id)! } : undefined
    }));
    replaceVisibleBikes(resetBikes);
    setSettings(initialDealershipSettings);
    persistSettings(initialDealershipSettings);
    showToast('Reset Complete', 'Loaded realistic dealership sales records (Cars & Bikes).', 'info');
  };

  const clearAllData = () => {
    replaceVisibleBikes([]);
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
        const importedIds = new Map(data.bikes.map((bike: Bike) => [bike.id, doc(collection(db, 'bikes')).id]));
        const importedBikes = data.bikes.map((bike: Bike) => ({
          ...bike,
          id: importedIds.get(bike.id)!,
          ownerUid: user?.uid,
          sale: bike.sale ? { ...bike.sale, bikeId: importedIds.get(bike.id)! } : undefined
        }));
        replaceVisibleBikes(importedBikes);
        if (data.settings) {
          const importedSettings = { ...initialDealershipSettings, ...data.settings };
          setSettings(importedSettings);
          persistSettings(importedSettings);
        }
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
        logout,
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
