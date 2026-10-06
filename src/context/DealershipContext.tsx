import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import { collection, deleteDoc, deleteField, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, setDoc, where, writeBatch } from 'firebase/firestore';
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
  isBusinessDataLoading: boolean;
  businessDataError: string | null;
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
  addBike: (data: Partial<Bike>) => Promise<Bike>;
  updateBike: (id: string, updates: Partial<Bike>) => Promise<void>;
  deleteBike: (id: string) => Promise<void>;
  recordSale: (bikeId: string, saleData: Omit<SaleRecord, 'id' | 'bikeId' | 'customerId'>) => Promise<SaleRecord>;
  revertSale: (bikeId: string) => Promise<void>;
  addRepairItem: (bikeId: string, item: Omit<OtherCostItem, 'id'>) => Promise<void>;
  removeRepairItem: (bikeId: string, repairId: string) => Promise<void>;
  updateSettings: (updates: Partial<DealershipSettings>) => Promise<void>;
  resetToDefaultData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  exportDataToJson: () => void;
  importDataFromJson: (jsonStr: string) => Promise<boolean>;
  
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
  const { user, profile, isAdmin, saveBusinessName } = useAuth();
  const businessNameRef = useRef(profile?.businessName || '');
  businessNameRef.current = profile?.businessName || '';
  const currentUser: AuthUser | null = user ? {
    username: user.email || user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || user.uid,
    role: isAdmin ? 'Administrator' : 'Staff',
    lastLogin: user.metadata.lastSignInTime || ''
  } : null;
  const isAuthenticated = !!currentUser;

  const [bikes, setBikes] = useState<Bike[]>([]);
  const [settings, setSettings] = useState<DealershipSettings>(initialDealershipSettings);
  const [isBusinessDataLoading, setIsBusinessDataLoading] = useState(true);
  const [businessDataError, setBusinessDataError] = useState<string | null>(null);

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
    setSettings({ ...initialDealershipSettings, dealershipName: profile?.businessName || '' });
    setSelectedBike(null);
    setSelectedSaleRecord(null);
    setIsAddBikeModalOpen(false);
    setIsEditBikeModalOpen(false);
    setIsSaleModalOpen(false);
    setIsDetailModalOpen(false);
    setIsInvoiceModalOpen(false);
    setActiveTab('dashboard');
    setToasts([]);
    setBusinessDataError(null);
    if (!user || !profile?.businessName.trim()) return;

    setIsBusinessDataLoading(true);
    let bikesLoaded = false;
    let settingsLoaded = false;
    let migrationLoaded = false;
    const finishLoading = () => {
      if (bikesLoaded && settingsLoaded && migrationLoaded) setIsBusinessDataLoading(false);
    };
    const bikesCollection = collection(db, 'users', user.uid, 'bikes');
    const unsubscribeBikes = onSnapshot(
      bikesCollection,
      (snapshot) => {
        setBikes(snapshot.docs.map((bikeDoc) => {
          const data = bikeDoc.data();
          const toIsoString = (value: any) => value?.toDate ? value.toDate().toISOString() : value || '';
          return {
            ...data,
            id: bikeDoc.id,
            vehicleType: data.vehicleType === 'Car' ? 'Light Vehicle' : data.vehicleType || 'Bike',
            category: data.category === 'Auto' ? 'Auto' : 'Manual',
            condition: data.condition === 'Brand New' ? 'Brand New' : 'Used',
            createdAt: toIsoString(data.createdAt),
            updatedAt: toIsoString(data.updatedAt)
          } as Bike;
        }));
        bikesLoaded = true;
        finishLoading();
      },
      (error) => {
        console.error('Failed to load dealership records', error);
        setBusinessDataError('Your saved inventory could not be loaded. Check your connection and Firebase security rules, then retry.');
        showToast('Data Could Not Load', 'Check your connection and Firebase security rules.', 'error');
        bikesLoaded = true;
        finishLoading();
      }
    );
    const unsubscribeSettings = onSnapshot(
      doc(db, 'users', user.uid, 'settings', 'preferences'),
      (snapshot) => {
        setSettings(snapshot.exists()
          ? { ...initialDealershipSettings, ...snapshot.data(), dealershipName: businessNameRef.current } as DealershipSettings
          : { ...initialDealershipSettings, dealershipName: businessNameRef.current });
        settingsLoaded = true;
        finishLoading();
      },
      (error) => {
        console.error('Failed to load dealership settings', error);
        setBusinessDataError('Your saved dealership settings could not be loaded. Check your connection and Firebase security rules, then retry.');
        showToast('Settings Could Not Load', 'Check your connection and Firestore security rules.', 'error');
        settingsLoaded = true;
        finishLoading();
      }
    );
    void (async () => {
      try {
        const migrationRef = doc(db, 'users', user.uid, 'migration', 'legacy-v1');
        if (!(await getDoc(migrationRef)).exists()) {
          const legacyBikes = await getDocs(query(
            collection(db, 'bikes'),
            where('ownerUid', '==', user.uid)
          ));
          const existingBikes = await getDocs(bikesCollection);
          const existingIds = new Set(existingBikes.docs.map((bikeDoc) => bikeDoc.id));
          const recordsToMigrate = legacyBikes.docs.filter((bikeDoc) => !existingIds.has(bikeDoc.id));

          for (let offset = 0; offset < recordsToMigrate.length; offset += 450) {
            const batch = writeBatch(db);
            recordsToMigrate.slice(offset, offset + 450).forEach((bikeDoc) => {
              batch.set(doc(db, 'users', user.uid, 'bikes', bikeDoc.id), {
                ...bikeDoc.data(),
                id: bikeDoc.id,
                ownerUid: user.uid
              });
            });
            await batch.commit();
          }

          const legacySettings = await getDoc(doc(db, 'userSettings', user.uid));
          const userSettingsRef = doc(db, 'users', user.uid, 'settings', 'preferences');
          const existingSettings = await getDoc(userSettingsRef);
          if (legacySettings.exists() && !existingSettings.exists()) {
            await setDoc(userSettingsRef, {
              ...legacySettings.data(),
              dealershipName: profile.businessName
            });
          }

          await setDoc(migrationRef, { completedAt: serverTimestamp() });
        }

        const salesMigrationRef = doc(db, 'users', user.uid, 'migration', 'sales-v1');
        if (!(await getDoc(salesMigrationRef)).exists()) {
          const userBikes = await getDocs(bikesCollection);
          const batchOperations: Array<{ ref: ReturnType<typeof doc>; data: Record<string, unknown> }> = [];

          for (const bikeDocument of userBikes.docs) {
            const bike = bikeDocument.data();
            const sale = bike.sale;
            if (!sale || typeof sale.id !== 'string') continue;

            const customerId = typeof sale.customerId === 'string' ? sale.customerId : sale.id;
            const saleWithCustomerId = { ...sale, customerId };
            const customerRef = doc(db, 'users', user.uid, 'customers', customerId);
            const saleRef = doc(db, 'users', user.uid, 'sales', sale.id);
            const invoiceRef = doc(db, 'users', user.uid, 'invoices', sale.id);
            const [customerSnapshot, saleSnapshot, invoiceSnapshot] = await Promise.all([
              getDoc(customerRef),
              getDoc(saleRef),
              getDoc(invoiceRef)
            ]);
            const timestamp = serverTimestamp();
            const customer = {
              id: customerId,
              ownerUid: user.uid,
              name: sale.customerName || '',
              phone: sale.customerPhone || '',
              secondaryPhone: sale.customerSecondaryPhone || '',
              email: sale.customerEmail || '',
              idNumber: sale.customerIdNumber || '',
              address: sale.customerAddress || '',
              createdAt: timestamp,
              updatedAt: timestamp,
              saleIds: [sale.id]
            };

            if (!saleSnapshot.exists()) {
              batchOperations.push({
                ref: saleRef,
                data: { ...saleWithCustomerId, ownerUid: user.uid, status: 'completed', createdAt: timestamp, updatedAt: timestamp }
              });
            }
            if (!customerSnapshot.exists()) {
              batchOperations.push({ ref: customerRef, data: customer });
            }
            if (!invoiceSnapshot.exists()) {
              batchOperations.push({
                ref: invoiceRef,
                data: {
                  id: sale.id,
                  ownerUid: user.uid,
                  saleId: sale.id,
                  customerId,
                  bikeId: bikeDocument.id,
                  customer,
                  vehicle: {
                    id: bikeDocument.id,
                    make: bike.make || '',
                    model: bike.model || '',
                    year: bike.year || 0,
                    vehicleType: bike.vehicleType || 'Bike',
                    registration: bike.regPlate || '',
                    vin: bike.vin || '',
                    imageUrl: bike.imageUrl || ''
                  },
                  sale: { ...saleWithCustomerId, ownerUid: user.uid },
                  paymentStatus: sale.saleMethod === 'Cash' ? 'paid' : 'financed',
                  createdAt: timestamp,
                  updatedAt: timestamp
                }
              });
            }
            if (sale.customerId !== customerId) {
              batchOperations.push({
                ref: doc(db, 'users', user.uid, 'bikes', bikeDocument.id),
                data: { sale: saleWithCustomerId, updatedAt: timestamp }
              });
            }
          }

          for (let offset = 0; offset < batchOperations.length; offset += 450) {
            const batch = writeBatch(db);
            batchOperations.slice(offset, offset + 450).forEach(({ ref, data }) => batch.set(ref, data, { merge: true }));
            await batch.commit();
          }
          await setDoc(salesMigrationRef, { completedAt: serverTimestamp() });
        }
      } catch (error) {
        console.error('Failed to migrate legacy dealership records', error);
        showToast('Migration Incomplete', 'Some older records could not be copied. Existing records were not deleted.', 'error');
      } finally {
        migrationLoaded = true;
        finishLoading();
      }
    })();

    return () => {
      unsubscribeBikes();
      unsubscribeSettings();
    };
  }, [user?.uid, Boolean(profile?.businessName.trim())]);

  useEffect(() => {
    if (profile?.businessName) {
      setSettings((currentSettings) => ({ ...currentSettings, dealershipName: profile.businessName }));
    }
  }, [profile?.businessName]);

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

  const saveBike = (bike: Bike, isNew = false): Promise<void> => {
    if (!user) return Promise.reject(new Error('You must be signed in to save a vehicle.'));
    const ownedBike = { ...bike, ownerUid: user.uid };
    const updatedBy = {
      updatedBy: user.uid,
      updatedByName: user.displayName || user.email?.split('@')[0] || user.uid,
      updatedByEmail: user.email || ''
    };
    return isNew
      ? setDoc(doc(db, 'users', user.uid, 'bikes', bike.id), {
          ...ownedBike,
          createdBy: user.uid,
          createdByName: user.displayName || user.email?.split('@')[0] || user.uid,
          createdByEmail: user.email || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...updatedBy
        })
      : (() => {
          const { createdAt, createdBy, createdByName, createdByEmail, ...recordUpdates } = ownedBike;
        return setDoc(doc(db, 'users', user.uid, 'bikes', bike.id), {
            ...recordUpdates,
            sale: bike.sale ?? deleteField(),
            updatedAt: serverTimestamp(),
            ...updatedBy
          }, { merge: true });
        })();
  };

  const persistSettings = (nextSettings: DealershipSettings): Promise<void> => {
    if (!user) return Promise.reject(new Error('You must be signed in to save dealership settings.'));
    return setDoc(doc(db, 'users', user.uid, 'settings', 'preferences'), nextSettings);
  };

  const saveSaleDocuments = async (bike: Bike): Promise<Bike> => {
    if (!user) throw new Error('You must be signed in to save sale documents.');
    if (!bike.sale) return bike;
    const customerId = bike.sale.customerId || doc(collection(db, 'users', user.uid, 'customers')).id;
    const sale = { ...bike.sale, customerId, bikeId: bike.id };
    const timestamp = serverTimestamp();
    const customer = {
      id: customerId,
      ownerUid: user.uid,
      name: sale.customerName,
      phone: sale.customerPhone,
      secondaryPhone: sale.customerSecondaryPhone || '',
      email: sale.customerEmail || '',
      idNumber: sale.customerIdNumber || '',
      address: sale.customerAddress || '',
      createdAt: timestamp,
      updatedAt: timestamp,
      saleIds: [sale.id]
    };
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', user.uid, 'sales', sale.id), {
      ...sale,
      ownerUid: user.uid,
      status: 'completed',
      createdAt: timestamp,
      updatedAt: timestamp
    });
    batch.set(doc(db, 'users', user.uid, 'customers', customerId), customer);
    batch.set(doc(db, 'users', user.uid, 'invoices', sale.id), {
      id: sale.id,
      ownerUid: user.uid,
      saleId: sale.id,
      customerId,
      bikeId: bike.id,
      customer,
      vehicle: {
        id: bike.id,
        make: bike.make,
        model: bike.model,
        year: bike.year,
        vehicleType: bike.vehicleType || 'Bike',
        registration: bike.regPlate,
        vin: bike.vin,
        imageUrl: bike.imageUrl
      },
      sale: { ...sale, ownerUid: user.uid },
      paymentStatus: sale.saleMethod === 'Cash' ? 'paid' : 'financed',
      createdAt: timestamp,
      updatedAt: timestamp
    });
    await batch.commit();
    return { ...bike, sale };
  };

  const replaceVisibleBikes = async (nextBikes: Bike[]) => {
    if (!user) throw new Error('You must be signed in to replace dealership records.');
    const userBikes = bikes;
    const ownedNextBikes = nextBikes.map((bike) => ({ ...bike, ownerUid: user.uid }));
    const retainedIds = new Set(ownedNextBikes.map((bike) => bike.id));
    const removedBikes = userBikes.filter((bike) => !retainedIds.has(bike.id));
    await Promise.all(
      removedBikes.flatMap((bike) => [
        deleteDoc(doc(db, 'users', user.uid, 'bikes', bike.id)),
        ...(bike.sale ? [
          deleteDoc(doc(db, 'users', user.uid, 'sales', bike.sale.id)),
          deleteDoc(doc(db, 'users', user.uid, 'invoices', bike.sale.id)),
          deleteDoc(doc(db, 'users', user.uid, 'customers', bike.sale.customerId || bike.sale.id))
        ] : [])
      ])
    );
    const savedBikes = await Promise.all(ownedNextBikes.map(async (bike) => {
      const bikeWithSale = await saveSaleDocuments(bike);
      await saveBike(bikeWithSale, true);
      return bikeWithSale;
    }));
    setBikes(savedBikes);
  };

  const logout = () => {
    setBikes([]);
    setSettings(initialDealershipSettings);
    setSelectedBike(null);
    setSelectedSaleRecord(null);
    setToasts([]);
    void signOut(auth).catch((error) => {
      console.error('Failed to sign out of Firebase', error);
      showToast('Sign Out Failed', 'Your Firebase session could not be closed.', 'error');
    });
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
      showToast('App Installed', 'Sales POS has been added to your home screen!', 'success');
    }
    setDeferredPrompt(null);
    setIsPWAInstallable(false);
  };

  const summary = useMemo(() => calculateFinancialSummary(bikes), [bikes]);

  const addBike = async (data: Partial<Bike>): Promise<Bike> => {
    if (!user) throw new Error('You must be signed in to add a vehicle.');
    const newId = doc(collection(db, 'users', user.uid, 'bikes')).id;
    const otherCosts: OtherCostItem[] = data.repairCosts || [];
    const totalOtherCosts = calculateTotalOtherCosts(otherCosts);
    const costPrice = Number(data.purchasePrice) || 0;
    const totalCost = costPrice + totalOtherCosts;
    const targetSalePrice = Number(data.targetSalePrice) || Math.round(totalCost * 1.25);
    const estimatedProfit = targetSalePrice - totalCost;

    const newBike: Bike = {
      id: newId,
      ownerUid: user?.uid,
      createdBy: user?.uid,
      createdByName: user?.displayName || user?.email?.split('@')[0] || user?.uid,
      createdByEmail: user?.email || '',
      vehicleType: data.vehicleType || 'Bike',
      make: data.make?.trim() || 'Honda',
      model: data.model?.trim() || 'Vehicle',
      year: Number(data.year) || new Date().getFullYear(),
      category: data.category || 'Manual',
      vin: data.vin?.toUpperCase().trim() || `VIN-${Date.now().toString().slice(-8)}`,
      regPlate: data.regPlate?.toUpperCase().trim() || 'UNREG',
      mileage: Number(data.mileage) || 0,
      color: data.color?.trim() || 'Black',
      engineCapacityCc: Number(data.engineCapacityCc) || 125,
      condition: data.condition || 'Used',
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

    try {
      await saveBike(newBike, true);
    } catch (error) {
      console.error('Failed to save new dealership record', error);
      throw new Error('Vehicle could not be saved. Check your connection and try again.');
    }
    setBikes((prev) => [newBike, ...prev]);
    showToast(
      'Vehicle Saved',
      `${newBike.year} ${newBike.make} ${newBike.model} added to ${profile?.businessName || 'your business'}. Cost: ${formatCurrency(costPrice, settings.currencySymbol)} | Est. Profit: +${formatCurrency(estimatedProfit, settings.currencySymbol)}`,
      'success'
    );
    return newBike;
  };

  const updateBike = async (id: string, updates: Partial<Bike>) => {
    const bike = bikes.find((item) => item.id === id);
    if (!bike) throw new Error('Vehicle not found.');
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

    try {
      await saveBike(updated);
    } catch (error) {
      console.error('Failed to update dealership record', error);
      showToast('Save Failed', 'Your changes could not be saved to the database.', 'error');
      throw error;
    }
    setBikes((prev) => prev.map((item) => item.id === id ? updated : item));
    showToast('Vehicle Updated', 'Cost price, other costs, and profit calculations updated.', 'success');
  };

  const deleteBike = async (id: string) => {
    const bikeToDelete = bikes.find((b) => b.id === id);
    if (!user) throw new Error('You must be signed in to delete a vehicle.');
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'bikes', id));
    } catch (error) {
      console.error('Failed to delete dealership record', error);
      showToast('Delete Failed', 'The record could not be removed from the database.', 'error');
      throw error;
    }
    if (selectedBike?.id === id) {
      setSelectedBike(null);
      setIsDetailModalOpen(false);
      setIsEditBikeModalOpen(false);
    }
    showToast('Vehicle Deleted', `${bikeToDelete ? `${bikeToDelete.make} ${bikeToDelete.model}` : 'Bike'} removed.`, 'info');
  };

  const recordSale = async (bikeId: string, saleData: Omit<SaleRecord, 'id' | 'bikeId' | 'customerId'>): Promise<SaleRecord> => {
    if (!user) throw new Error('You must be signed in to record a sale.');
    const saleId = doc(collection(db, 'users', user.uid, 'sales')).id;
    const bike = bikes.find((b) => b.id === bikeId);
    if (!bike) throw new Error('Bike not found');
    const customerId = doc(collection(db, 'users', user.uid, 'customers')).id;

    const definedSaleData = Object.fromEntries(
      Object.entries(saleData).filter(([, value]) => value !== undefined)
    ) as Omit<SaleRecord, 'id' | 'bikeId' | 'customerId'>;
    const newSale: SaleRecord = {
      ...definedSaleData,
      id: saleId,
      bikeId: bikeId,
      customerId,
      vehicleType: saleData.vehicleType || bike.vehicleType || 'Bike',
      bikeSummary: `${bike.year} ${bike.make} ${bike.model}`
    };

    const updatedBike = { ...bike, status: 'Sold' as const, sale: newSale, updatedAt: new Date().toISOString() };
    const timestamp = serverTimestamp();
    const batch = writeBatch(db);
    const bikeRef = doc(db, 'users', user.uid, 'bikes', bikeId);
    const customerRef = doc(db, 'users', user.uid, 'customers', customerId);
    const saleRef = doc(db, 'users', user.uid, 'sales', saleId);
    const invoiceRef = doc(db, 'users', user.uid, 'invoices', saleId);
    const customer = {
      id: customerId,
      ownerUid: user.uid,
      name: newSale.customerName,
      phone: newSale.customerPhone,
      secondaryPhone: newSale.customerSecondaryPhone || '',
      email: newSale.customerEmail || '',
      idNumber: newSale.customerIdNumber || '',
      address: newSale.customerAddress || '',
      createdAt: timestamp,
      updatedAt: timestamp,
      saleIds: [saleId]
    };
    const persistedSale = { ...newSale, ownerUid: user.uid, status: 'completed', createdAt: timestamp, updatedAt: timestamp };
    const { createdAt, createdBy, createdByName, createdByEmail, ...bikeUpdates } = updatedBike;
    batch.set(bikeRef, {
      ...bikeUpdates,
      ownerUid: user.uid,
      updatedAt: timestamp,
      updatedBy: user.uid,
      sale: newSale
    }, { merge: true });
    batch.set(saleRef, persistedSale);
    batch.set(customerRef, customer);
    batch.set(invoiceRef, {
      id: saleId,
      ownerUid: user.uid,
      saleId,
      customerId,
      bikeId,
      customer,
      vehicle: {
        id: bike.id,
        make: bike.make,
        model: bike.model,
        year: bike.year,
        vehicleType: bike.vehicleType || 'Bike',
        registration: bike.regPlate,
        vin: bike.vin,
        imageUrl: bike.imageUrl
      },
      sale: persistedSale,
      paymentStatus: newSale.saleMethod === 'Cash' ? 'paid' : 'financed',
      createdAt: timestamp,
      updatedAt: timestamp
    });
    try {
      await batch.commit();
    } catch (error) {
      console.error('Failed to save sale, customer, and invoice', error);
      showToast('Sale Save Failed', 'The sale, customer, and invoice could not be saved to the database.', 'error');
      throw new Error('The sale could not be saved. Check your connection and try again.');
    }
    setBikes((prev) => prev.map((item) => item.id === bikeId ? updatedBike : item));

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

  const revertSale = async (bikeId: string) => {
    const bike = bikes.find((item) => item.id === bikeId);
    if (!bike) throw new Error('Vehicle not found.');
    const { sale, ...rest } = bike;
    const updatedBike = { ...rest, status: 'In Stock' as const, updatedAt: new Date().toISOString() };
    if (!user) throw new Error('You must be signed in to revert a sale.');
    const timestamp = serverTimestamp();
    const batch = writeBatch(db);
    const { createdAt, createdBy, createdByName, createdByEmail, ...bikeUpdates } = updatedBike;
    batch.set(doc(db, 'users', user.uid, 'bikes', bikeId), {
      ...bikeUpdates,
      ownerUid: user.uid,
      sale: deleteField(),
      updatedAt: timestamp,
      updatedBy: user.uid
    }, { merge: true });
    if (sale) {
      batch.set(doc(db, 'users', user.uid, 'sales', sale.id), {
        status: 'voided',
        voidedAt: timestamp,
        updatedAt: timestamp
      }, { merge: true });
      batch.set(doc(db, 'users', user.uid, 'invoices', sale.id), {
        paymentStatus: 'voided',
        voidedAt: timestamp,
        updatedAt: timestamp
      }, { merge: true });
    }
    try {
      await batch.commit();
    } catch (error) {
      console.error('Failed to revert dealership sale', error);
      showToast('Sale Reversal Failed', 'The sale could not be reverted in the database.', 'error');
      throw error;
    }
    setBikes((prev) => prev.map((item) => item.id === bikeId ? updatedBike : item));
    showToast('Sale Voided', 'Vehicle returned to In Stock inventory.', 'info');
  };

  const addRepairItem = async (bikeId: string, item: Omit<OtherCostItem, 'id'>) => {
    if (!user) throw new Error('You must be signed in to add an expense.');
    const newOtherCost: OtherCostItem = {
      ...item,
      id: doc(collection(db, 'users', user.uid, 'bikes')).id
    };
    const bike = bikes.find((item) => item.id === bikeId);
    if (!bike) throw new Error('Vehicle not found.');
    const newOtherCosts = [...bike.repairCosts, newOtherCost];
    const updatedBike = {
      ...bike,
      repairCosts: newOtherCosts,
      totalCost: calculateTotalCost(bike.purchasePrice, newOtherCosts),
      updatedAt: new Date().toISOString()
    };
    try {
      await saveBike(updatedBike);
    } catch (error) {
      console.error('Failed to save dealership expense', error);
      showToast('Save Failed', 'The expense could not be saved to the database.', 'error');
      throw error;
    }
    setBikes((prev) => prev.map((item) => item.id === bikeId ? updatedBike : item));
    showToast(
      'Other Cost Added',
      `Logged "${item.description}" (${formatCurrency(item.cost, settings.currencySymbol)}).`,
      'success'
    );
  };

  const removeRepairItem = async (bikeId: string, repairId: string) => {
    const bike = bikes.find((item) => item.id === bikeId);
    if (!bike) throw new Error('Vehicle not found.');
    const newOtherCosts = bike.repairCosts.filter((repair) => repair.id !== repairId);
    const updatedBike = {
      ...bike,
      repairCosts: newOtherCosts,
      totalCost: calculateTotalCost(bike.purchasePrice, newOtherCosts),
      updatedAt: new Date().toISOString()
    };
    try {
      await saveBike(updatedBike);
    } catch (error) {
      console.error('Failed to remove dealership expense', error);
      showToast('Save Failed', 'The expense could not be removed from the database.', 'error');
      throw error;
    }
    setBikes((prev) => prev.map((item) => item.id === bikeId ? updatedBike : item));
    showToast('Expense Removed', 'Total cost and profit margin adjusted.', 'info');
  };

  const updateSettings = async (updates: Partial<DealershipSettings>) => {
    const nextSettings = { ...settings, ...updates };
    if (updates.dealershipName?.trim() && updates.dealershipName.trim() !== profile?.businessName) {
      try {
        await saveBusinessName(updates.dealershipName);
      } catch (error) {
        console.error('Failed to update business name', error);
        showToast('Business Name Save Failed', 'Your Business Name could not be updated.', 'error');
        throw error;
      }
    }
    try {
      await persistSettings(nextSettings);
    } catch (error) {
      console.error('Failed to save dealership settings', error);
      showToast('Settings Save Failed', 'Your settings could not be saved to the database.', 'error');
      throw error;
    }
    setSettings(nextSettings);
    showToast('Settings Saved', 'Business configuration updated.', 'success');
  };

  const resetToDefaultData = async () => {
    if (!user) throw new Error('You must be signed in to reset dealership data.');
    const newIds = new Map(sampleBikes.map((bike) => [bike.id, doc(collection(db, 'users', user.uid, 'bikes')).id]));
    const resetBikes = sampleBikes.map((bike) => ({
      ...bike,
      id: newIds.get(bike.id)!,
      ownerUid: user?.uid,
      sale: bike.sale ? { ...bike.sale, bikeId: newIds.get(bike.id)! } : undefined
    }));
    try {
      await replaceVisibleBikes(resetBikes);
      const resetSettings = { ...initialDealershipSettings, dealershipName: profile?.businessName || '' };
      await persistSettings(resetSettings);
      setSettings(resetSettings);
      showToast('Reset Complete', 'Loaded realistic dealership sales records (Cars & Bikes).', 'info');
    } catch (error) {
      console.error('Failed to reset dealership data', error);
      showToast('Reset Failed', 'Dealership data could not be fully saved. Please retry.', 'error');
      throw error;
    }
  };

  const clearAllData = async () => {
    try {
      await replaceVisibleBikes([]);
      showToast('Data Cleared', 'All inventory vehicles and sales have been cleared.', 'info');
    } catch (error) {
      console.error('Failed to clear dealership data', error);
      showToast('Clear Failed', 'Dealership data could not be fully cleared. Please retry.', 'error');
      throw error;
    }
  };

  const exportDataToJson = () => {
    const backup = {
      version: '3.0',
      application: 'Sales POS',
      businessName: profile?.businessName || '',
      currency: 'LKR',
      exportedAt: new Date().toISOString(),
      settings,
      bikes
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sales-POS-LKR-Backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Database Exported', 'Downloaded complete Sales POS JSON backup.', 'success');
  };

  const importDataFromJson = async (jsonStr: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.bikes)) {
        if (!user) throw new Error('You must be signed in to import business records.');
        const importedIds = new Map(data.bikes.map((bike: Bike) => [bike.id, doc(collection(db, 'users', user.uid, 'bikes')).id]));
        const importedBikes = data.bikes.map((bike: Bike) => ({
          ...bike,
          id: importedIds.get(bike.id)!,
          ownerUid: user?.uid,
          sale: bike.sale ? { ...bike.sale, bikeId: importedIds.get(bike.id)! } : undefined
        }));
        await replaceVisibleBikes(importedBikes);
        if (data.settings) {
          const importedSettings = { ...initialDealershipSettings, ...data.settings };
          await persistSettings(importedSettings);
          setSettings(importedSettings);
        }
        showToast('Backup Restored', `Restored ${data.bikes.length} vehicles from JSON.`, 'success');
        return true;
      }
      throw new Error('Invalid JSON structure');
    } catch (e) {
      console.error('Failed to import dealership backup', e);
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
        isBusinessDataLoading,
        businessDataError,
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
