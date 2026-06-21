import type {
  User, Category, Medicine, Supplier, Customer, Sale, PurchaseOrder, PharmacySettings
} from '../types/db';
import {
  mockUsers, mockCategories, mockSuppliers, mockCustomers, mockMedicines, mockSettings, mockSales, mockPurchaseOrders
} from './mockData';

// Helper to interact with LocalStorage safely
const getStorageItem = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  if (!data) return defaultValue;
  try {
    return JSON.parse(data) as T;
  } catch (e) {
    console.error(`Error parsing localStorage key "${key}"`, e);
    return defaultValue;
  }
};

const setStorageItem = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

export class LocalStorageDB {
  static init() {
    if (!localStorage.getItem('sehat_initialized')) {
      setStorageItem('sehat_users', mockUsers);
      setStorageItem('sehat_categories', mockCategories);
      setStorageItem('sehat_suppliers', mockSuppliers);
      setStorageItem('sehat_customers', mockCustomers);
      setStorageItem('sehat_medicines', mockMedicines);
      setStorageItem('sehat_sales', mockSales);
      setStorageItem('sehat_purchase_orders', mockPurchaseOrders);
      setStorageItem('sehat_settings', mockSettings);
      localStorage.setItem('sehat_initialized', 'true');
    }
  }

  static resetDB() {
    localStorage.removeItem('sehat_initialized');
    this.init();
  }

  // --- SETTINGS ---
  static getSettings(): PharmacySettings {
    return getStorageItem('sehat_settings', mockSettings);
  }

  static saveSettings(settings: PharmacySettings): void {
    setStorageItem('sehat_settings', settings);
  }

  // --- USERS ---
  static getUsers(): User[] {
    const users = getStorageItem<User[]>('sehat_users', []);
    // Map existing seeded users to default APPROVED if status is missing
    return users.map(u => ({
      ...u,
      status: u.status || 'APPROVED'
    }));
  }

  static saveUsers(users: User[]): void {
    setStorageItem('sehat_users', users);
  }

  static registerUser(name: string, email: string, passwordHash: string): User {
    const users = this.getUsers();
    
    // Check if user already exists
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('Email is already registered.');
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      email,
      name,
      role: 'CASHIER', // default signup role
      password: passwordHash,
      status: 'PENDING_APPROVAL'
    };

    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  static approveUser(userId: string, role: any): User {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('User not found.');

    users[index] = {
      ...users[index],
      status: 'APPROVED',
      role
    };

    this.saveUsers(users);
    return users[index];
  }

  static rejectUser(userId: string): User {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('User not found.');

    users[index] = {
      ...users[index],
      status: 'REJECTED'
    };

    this.saveUsers(users);
    return users[index];
  }

  // --- CATEGORIES ---
  static getCategories(): Category[] {
    return getStorageItem('sehat_categories', []);
  }

  static saveCategories(categories: Category[]): void {
    setStorageItem('sehat_categories', categories);
  }

  // --- SUPPLIERS ---
  static getSuppliers(): Supplier[] {
    return getStorageItem('sehat_suppliers', []);
  }

  static saveSuppliers(suppliers: Supplier[]): void {
    setStorageItem('sehat_suppliers', suppliers);
  }

  // --- CUSTOMERS ---
  static getCustomers(): Customer[] {
    return getStorageItem('sehat_customers', []);
  }

  static saveCustomers(customers: Customer[]): void {
    setStorageItem('sehat_customers', customers);
  }

  // --- MEDICINES ---
  static getMedicines(): Medicine[] {
    const medicines = getStorageItem<Medicine[]>('sehat_medicines', []);
    const categories = this.getCategories();
    // Denormalize categoryName for display
    return medicines.map(med => ({
      ...med,
      categoryName: categories.find(cat => cat.id === med.categoryId)?.name || 'Unknown Category'
    }));
  }

  static saveMedicines(medicines: Medicine[]): void {
    setStorageItem('sehat_medicines', medicines);
  }

  // --- SALES (POS CHECKOUT) ---
  static getSales(): Sale[] {
    return getStorageItem('sehat_sales', []);
  }

  static saveSales(sales: Sale[]): void {
    setStorageItem('sehat_sales', sales);
  }

  static addSale(saleData: Omit<Sale, 'id' | 'invoiceNumber' | 'date'>): Sale {
    const sales = this.getSales();
    const medicines = this.getMedicines();
    const customers = this.getCustomers();

    // 1. Generate ID and Invoice Number
    const nextId = `sale-${sales.length + 1}`;
    const nextInvoiceNum = `INV-2026-${1000 + sales.length + 1}`;

    // 2. Build Sale Record
    const newSale: Sale = {
      ...saleData,
      id: nextId,
      invoiceNumber: nextInvoiceNum,
      date: new Date().toISOString()
    };

    // 3. Deduct stock from medicines & verify
    const updatedMedicines = medicines.map(med => {
      const cartItem = saleData.items.find(item => item.productId === med.id);
      if (cartItem) {
        return {
          ...med,
          stock: Math.max(0, med.stock - cartItem.quantity)
        };
      }
      return med;
    });
    this.saveMedicines(updatedMedicines);

    // 4. Update Customer loyalty points and purchase counts
    const updatedCustomers = customers.map(cust => {
      if (cust.id === saleData.customerId && cust.id !== 'walk-in') {
        const addedPoints = Math.floor(saleData.grandTotal / 100); // 1 point per 100 Rs spent
        return {
          ...cust,
          loyaltyPoints: cust.loyaltyPoints + addedPoints,
          purchaseCount: cust.purchaseCount + 1
        };
      } else if (cust.id === 'walk-in') {
        return {
          ...cust,
          purchaseCount: cust.purchaseCount + 1
        };
      }
      return cust;
    });
    this.saveCustomers(updatedCustomers);

    // 5. Save Sale
    sales.unshift(newSale); // Add to beginning
    this.saveSales(sales);

    return newSale;
  }

  // --- PURCHASES (STOCK INTAKE) ---
  static getPurchaseOrders(): PurchaseOrder[] {
    return getStorageItem('sehat_purchase_orders', []);
  }

  static savePurchaseOrders(pos: PurchaseOrder[]): void {
    setStorageItem('sehat_purchase_orders', pos);
  }

  static addPurchaseOrder(poData: Omit<PurchaseOrder, 'id' | 'date'>): PurchaseOrder {
    const pos = this.getPurchaseOrders();
    const medicines = this.getMedicines();
    const suppliers = this.getSuppliers();

    const nextId = `po-${pos.length + 1}`;
    const newPO: PurchaseOrder = {
      ...poData,
      id: nextId,
      date: new Date().toISOString()
    };

    // 1. Add Stock to Inventory
    const updatedMedicines = medicines.map(med => {
      const poItem = poData.items.find(item => item.productId === med.id);
      if (poItem) {
        return {
          ...med,
          stock: med.stock + poItem.quantity,
          purchasePrice: poItem.purchasePrice // Update purchase price based on last purchase order
        };
      }
      return med;
    });
    this.saveMedicines(updatedMedicines);

    // 2. Adjust Supplier Ledger
    const updatedSuppliers = suppliers.map(sup => {
      if (sup.id === poData.supplierId) {
        return {
          ...sup,
          ledgerBalance: sup.ledgerBalance + poData.totalAmount
        };
      }
      return sup;
    });
    this.saveSuppliers(updatedSuppliers);

    // 3. Save PO
    pos.unshift(newPO);
    this.savePurchaseOrders(pos);

    return newPO;
  }

  // --- ANALYTICS ENGINE ---
  static getDashboardStats() {
    const sales = this.getSales();
    const pos = this.getPurchaseOrders();
    const medicines = this.getMedicines();
    const customers = this.getCustomers();

    // 1. KPI Cards
    const totalSales = sales.reduce((acc, curr) => acc + curr.grandTotal, 0);
    const totalPurchases = pos.reduce((acc, curr) => acc + curr.totalAmount, 0);

    // Profit calculation: (Retail Price - Purchase Price) * soldQty for all sales items
    let monthlyProfit = 0;
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const med = medicines.find(m => m.id === item.productId);
        const costPrice = med ? med.purchasePrice : item.retailPrice * 0.7; // Fallback to 30% margin if deleted
        const profitPerUnit = item.retailPrice - costPrice;
        monthlyProfit += profitPerUnit * item.quantity;
      });
      // Deduct discount, add tax is net, but let's deduct the general discount amount from profit
      monthlyProfit -= sale.discountAmount;
    });

    const lowStockAlertCount = medicines.filter(m => m.stock <= m.minStockAlert).length;
    const totalCustomersCount = customers.length - 1; // Exclude walk-in customer from total loyal client base

    // 2. Top Selling Products (for Pie/Donut Chart)
    const productSalesMap: Record<string, { name: string; quantity: number }> = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = { name: item.productName, quantity: 0 };
        }
        productSalesMap[item.productId].quantity += item.quantity;
      });
    });
    const topSelling = Object.values(productSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5); // top 5

    // 3. Sales chart group by date (Last 7 Days)
    const salesByDay: Record<string, number> = {};
    const daysLabel: string[] = [];
    const salesValues: number[] = [];

    // Initialize last 7 days
    const today = new Date('2026-06-20T23:59:59Z'); // Use system anchor date
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      salesByDay[dateStr] = 0;

      // Formatting label e.g. "Jun 14"
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      daysLabel.push(label);
    }

    // Accumulate sales
    sales.forEach(sale => {
      const dateStr = sale.date.split('T')[0];
      if (salesByDay[dateStr] !== undefined) {
        salesByDay[dateStr] += sale.grandTotal;
      }
    });

    // Populate values
    Object.keys(salesByDay).sort().forEach(dateStr => {
      salesValues.push(parseFloat(salesByDay[dateStr].toFixed(2)));
    });

    return {
      kpis: {
        totalSales: parseFloat(totalSales.toFixed(2)),
        totalPurchases: parseFloat(totalPurchases.toFixed(2)),
        monthlyProfit: parseFloat(monthlyProfit.toFixed(2)),
        lowStockCount: lowStockAlertCount,
        customersCount: totalCustomersCount
      },
      charts: {
        salesHistory: {
          labels: daysLabel,
          data: salesValues
        },
        topSelling: topSelling
      },
      recentInvoices: sales.slice(0, 5)
    };
  }
}
