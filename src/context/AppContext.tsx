import React, { createContext, useContext, useState, useEffect } from 'react';
import type { 
  User, Category, Medicine, Supplier, Customer, Sale, PurchaseOrder, PharmacySettings, UserRole 
} from '../types/db';
import { LocalStorageDB } from '../db/LocalStorageDB';

export interface AppNotification {
  id: string;
  type: 'low_stock' | 'expiring' | 'expired';
  title: string;
  message: string;
  medicineId: string;
}

interface AppContextType {
  currentUser: User | null;
  currentView: string;
  darkMode: boolean;
  settings: PharmacySettings;
  medicines: Medicine[];
  categories: Category[];
  suppliers: Supplier[];
  customers: Customer[];
  sales: Sale[];
  purchaseOrders: PurchaseOrder[];
  notifications: AppNotification[];
  users: User[];
  login: (email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  googleLogin: (role: UserRole) => Promise<{ success: boolean; error?: string; email?: string }>;
  facebookLogin: (role: UserRole) => Promise<{ success: boolean; error?: string; email?: string }>;
  changePassword: (userId: string, currentPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (name: string, email: string, passwordHash: string) => Promise<User>;
  approveUser: (userId: string, role: UserRole) => void;
  rejectUser: (userId: string) => void;
  setView: (view: string) => void;
  toggleTheme: () => void;
  checkoutSale: (saleData: Omit<Sale, 'id' | 'invoiceNumber' | 'date'>) => Sale;
  checkoutPurchase: (poData: Omit<PurchaseOrder, 'id' | 'date'>) => PurchaseOrder;
  updateMedicines: (medicines: Medicine[]) => void;
  updateCategories: (categories: Category[]) => void;
  updateSuppliers: (suppliers: Supplier[]) => void;
  updateCustomers: (customers: Customer[]) => void;
  updateSettings: (settings: PharmacySettings) => void;
  resetDatabase: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize Database
  useEffect(() => {
    LocalStorageDB.init();
  }, []);

  // State Management
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sehat_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentView, setView] = useState<string>(() => {
    return currentUser ? (currentUser.role === 'CASHIER' ? 'pos' : 'dashboard') : 'login';
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('sehat_theme') === 'dark';
  });

  // DB States
  const [settings, setSettings] = useState<PharmacySettings>(() => LocalStorageDB.getSettings());
  const [medicines, setMedicines] = useState<Medicine[]>(() => LocalStorageDB.getMedicines());
  const [categories, setCategories] = useState<Category[]>(() => LocalStorageDB.getCategories());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => LocalStorageDB.getSuppliers());
  const [customers, setCustomers] = useState<Customer[]>(() => LocalStorageDB.getCustomers());
  const [sales, setSales] = useState<Sale[]>(() => LocalStorageDB.getSales());
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => LocalStorageDB.getPurchaseOrders());
  const [users, setUsers] = useState<User[]>(() => LocalStorageDB.getUsers());
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // System Date Anchor: 2026-06-20
  const systemDate = new Date('2026-06-20');

  // Fetch / Sync Data
  const syncStates = () => {
    setSettings(LocalStorageDB.getSettings());
    setMedicines(LocalStorageDB.getMedicines());
    setCategories(LocalStorageDB.getCategories());
    setSuppliers(LocalStorageDB.getSuppliers());
    setCustomers(LocalStorageDB.getCustomers());
    setSales(LocalStorageDB.getSales());
    setPurchaseOrders(LocalStorageDB.getPurchaseOrders());
    setUsers(LocalStorageDB.getUsers());
  };

  // Recalculate Alerts and Notifications whenever medicine data changes
  useEffect(() => {
    const alerts: AppNotification[] = [];
    
    medicines.forEach(med => {
      // 1. Low Stock Alert
      if (med.stock <= med.minStockAlert) {
        alerts.push({
          id: `notif-stock-${med.id}`,
          type: 'low_stock',
          title: 'Low Stock Warning',
          message: `"${med.name}" has only ${med.stock} units remaining (Minimum threshold: ${med.minStockAlert}).`,
          medicineId: med.id
        });
      }

      // 2. Expiry Alerts
      const expDate = new Date(med.expiryDate);
      const timeDiff = expDate.getTime() - systemDate.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (daysDiff <= 0) {
        alerts.push({
          id: `notif-exp-out-${med.id}`,
          type: 'expired',
          title: 'Medicine Expired',
          message: `"${med.name}" (Batch ${med.batchNumber}) expired on ${med.expiryDate}! Please dispose.`,
          medicineId: med.id
        });
      } else if (daysDiff <= 90) {
        alerts.push({
          id: `notif-exp-soon-${med.id}`,
          type: 'expiring',
          title: 'Approaching Expiry',
          message: `"${med.name}" expires in ${daysDiff} days (${med.expiryDate}). Plan clearance sale.`,
          medicineId: med.id
        });
      }
    });

    setNotifications(alerts);
  }, [medicines]);

  // Apply Dark Mode Class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Actions
  const login = async (email: string, password: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
    const usersList = LocalStorageDB.getUsers();
    const user = usersList.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
    
    if (!user || user.password !== password) {
      return { success: false, error: 'INVALID_CREDENTIALS' };
    }

    if (user.status === 'PENDING_APPROVAL') {
      return { success: false, error: 'PENDING_APPROVAL' };
    }

    if (user.status === 'REJECTED') {
      return { success: false, error: 'ACCOUNT_REJECTED' };
    }

    setCurrentUser(user);
    localStorage.setItem('sehat_current_user', JSON.stringify(user));
    setView(role === 'CASHIER' ? 'pos' : 'dashboard');
    return { success: true };
  };

  const googleLogin = async (role: UserRole): Promise<{ success: boolean; error?: string; email?: string }> => {
    const email = window.prompt("Simulate Google Login:\nEnter your Google Email:", "jane.doe@gmail.com");
    if (!email) return { success: false, error: 'CANCELLED' };

    const usersList = LocalStorageDB.getUsers();
    const normalizedEmail = email.trim().toLowerCase();
    const user = usersList.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      // Rule 3: Reject if user does not exist. Do not auto-register on login.
      return { success: false, error: 'USER_NOT_REGISTERED', email: normalizedEmail };
    }

    if (user.status === 'PENDING_APPROVAL') {
      return { success: false, error: 'PENDING_APPROVAL', email: normalizedEmail };
    }

    if (user.status === 'REJECTED') {
      return { success: false, error: 'ACCOUNT_REJECTED', email: normalizedEmail };
    }

    // Role verification (ensure they login with the role assigned by the admin)
    if (user.role !== role) {
      return { success: false, error: 'ROLE_MISMATCH' };
    }

    setCurrentUser(user);
    localStorage.setItem('sehat_current_user', JSON.stringify(user));
    setView(role === 'CASHIER' ? 'pos' : 'dashboard');
    return { success: true };
  };

  const facebookLogin = async (role: UserRole): Promise<{ success: boolean; error?: string; email?: string }> => {
    const email = window.prompt("Simulate Facebook Login:\nEnter your Facebook Email:", "jane.doe@facebook.com");
    if (!email) return { success: false, error: 'CANCELLED' };

    const usersList = LocalStorageDB.getUsers();
    const normalizedEmail = email.trim().toLowerCase();
    const user = usersList.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      // Rule 3: Reject if user does not exist. Do not auto-register on login.
      return { success: false, error: 'USER_NOT_REGISTERED', email: normalizedEmail };
    }

    if (user.status === 'PENDING_APPROVAL') {
      return { success: false, error: 'PENDING_APPROVAL', email: normalizedEmail };
    }

    if (user.status === 'REJECTED') {
      return { success: false, error: 'ACCOUNT_REJECTED', email: normalizedEmail };
    }

    // Role verification (ensure they login with the role assigned by the admin)
    if (user.role !== role) {
      return { success: false, error: 'ROLE_MISMATCH' };
    }

    setCurrentUser(user);
    localStorage.setItem('sehat_current_user', JSON.stringify(user));
    setView(role === 'CASHIER' ? 'pos' : 'dashboard');
    return { success: true };
  };

  const changePassword = async (userId: string, currentPass: string, newPass: string): Promise<{ success: boolean; error?: string }> => {
    const usersList = LocalStorageDB.getUsers();
    const index = usersList.findIndex(u => u.id === userId);
    if (index === -1) return { success: false, error: 'USER_NOT_FOUND' };
    const user = usersList[index];
    
    // Check if current password is correct (for OAuth users, we check the simulated password)
    if (user.password !== currentPass) {
      return { success: false, error: 'INCORRECT_CURRENT_PASSWORD' };
    }

    user.password = newPass;
    usersList[index] = user;
    LocalStorageDB.saveUsers(usersList);
    syncStates();

    // If it is the current logged-in user, update state
    if (currentUser && currentUser.id === userId) {
      const updatedUser = { ...currentUser, password: newPass };
      setCurrentUser(updatedUser);
      localStorage.setItem('sehat_current_user', JSON.stringify(updatedUser));
    }

    return { success: true };
  };

  const register = async (name: string, email: string, passwordHash: string): Promise<User> => {
    const newUser = LocalStorageDB.registerUser(name, email, passwordHash);
    syncStates();
    return newUser;
  };

  const approveUser = (userId: string, role: UserRole) => {
    LocalStorageDB.approveUser(userId, role);
    syncStates();
  };

  const rejectUser = (userId: string) => {
    LocalStorageDB.rejectUser(userId);
    syncStates();
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sehat_current_user');
    setView('login');
  };

  const toggleTheme = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('sehat_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const checkoutSale = (saleData: Omit<Sale, 'id' | 'invoiceNumber' | 'date'>): Sale => {
    const sale = LocalStorageDB.addSale(saleData);
    syncStates();
    return sale;
  };

  const checkoutPurchase = (poData: Omit<PurchaseOrder, 'id' | 'date'>): PurchaseOrder => {
    const po = LocalStorageDB.addPurchaseOrder(poData);
    syncStates();
    return po;
  };

  const updateMedicines = (newMeds: Medicine[]) => {
    LocalStorageDB.saveMedicines(newMeds);
    syncStates();
  };

  const updateCategories = (newCats: Category[]) => {
    LocalStorageDB.saveCategories(newCats);
    syncStates();
  };

  const updateSuppliers = (newSups: Supplier[]) => {
    LocalStorageDB.saveSuppliers(newSups);
    syncStates();
  };

  const updateCustomers = (newCusts: Customer[]) => {
    LocalStorageDB.saveCustomers(newCusts);
    syncStates();
  };

  const updateSettings = (newSettings: PharmacySettings) => {
    LocalStorageDB.saveSettings(newSettings);
    syncStates();
  };

  const resetDatabase = () => {
    LocalStorageDB.resetDB();
    syncStates();
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      currentView,
      darkMode,
      settings,
      medicines,
      categories,
      suppliers,
      customers,
      sales,
      purchaseOrders,
      notifications,
      users,
      login,
      googleLogin,
      facebookLogin,
      changePassword,
      logout,
      register,
      approveUser,
      rejectUser,
      setView,
      toggleTheme,
      checkoutSale,
      checkoutPurchase,
      updateMedicines,
      updateCategories,
      updateSuppliers,
      updateCustomers,
      updateSettings,
      resetDatabase
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
