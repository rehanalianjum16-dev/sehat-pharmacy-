import type { User, Category, Medicine, Supplier, Customer, Sale, PurchaseOrder, PharmacySettings } from '../types/db';

export const mockUsers: User[] = [
  { id: 'usr-1', email: 'admin@sehat.com', name: 'Dr. Bilal Khan (Admin)', role: 'ADMIN', password: 'admin123' },
  { id: 'usr-2', email: 'manager@sehat.com', name: 'Zahid Mahmood (Manager)', role: 'MANAGER', password: 'manager123' },
  { id: 'usr-3', email: 'cashier@sehat.com', name: 'Ayesha Siddiqa (Cashier)', role: 'CASHIER', password: 'cashier123' }
];

export const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Tablets', description: 'Solid dosage forms containing medicinal substances', createdAt: '2026-01-10T10:00:00Z' },
  { id: 'cat-2', name: 'Syrups & Liquids', description: 'Liquid preparations containing high concentration of sucrose', createdAt: '2026-01-12T11:00:00Z' },
  { id: 'cat-3', name: 'Injections & Vials', description: 'Sterile solutions or suspensions for parenteral administration', createdAt: '2026-01-15T09:30:00Z' },
  { id: 'cat-4', name: 'Inhalers & Sprays', description: 'Aerosol medicines for pulmonary or nasal use', createdAt: '2026-02-01T14:00:00Z' },
  { id: 'cat-5', name: 'Capsules', description: 'Soluble gelatin shells containing medication', createdAt: '2026-02-05T15:20:00Z' }
];

export const mockSuppliers: Supplier[] = [
  { id: 'sup-1', companyName: 'GlaxoSmithKline (GSK) Pak', contactPerson: 'Waseem Riaz', phone: '021-111-475-725', email: 'pk.info@gsk.com', ledgerBalance: 24500 },
  { id: 'sup-2', companyName: 'Pfizer Pakistan Ltd', contactPerson: 'Faisal Malik', phone: '021-35200000', email: 'pakistan.pfizer@pfizer.com', ledgerBalance: 0 },
  { id: 'sup-3', companyName: 'Abbott Laboratories', contactPerson: 'Haris Munir', phone: '021-111-222-688', email: 'support@abbott.com.pk', ledgerBalance: 58000 },
  { id: 'sup-4', companyName: 'Getz Pharma', contactPerson: 'Dr. Salman Shah', phone: '021-38405000', email: 'info@getzpharma.com', ledgerBalance: 12500 },
  { id: 'sup-5', companyName: 'Ferozsons Laboratories', contactPerson: 'Tariq Saeed', phone: '042-36300111', email: 'sales@ferozsons-labs.com', ledgerBalance: 0 }
];

export const mockCustomers: Customer[] = [
  { id: 'walk-in', name: 'Walk-in Customer', phone: 'N/A', address: 'N/A', loyaltyPoints: 0, purchaseCount: 420 },
  { id: 'cust-1', name: 'Muhammad Rizwan', phone: '03001234567', address: 'House 42, Street 3, G-11/2, Islamabad', loyaltyPoints: 120, purchaseCount: 14 },
  { id: 'cust-2', name: 'Sana Fatima', phone: '03335558899', address: 'Apartment 4B, Silver Heights, Gulberg, Lahore', loyaltyPoints: 85, purchaseCount: 8 },
  { id: 'cust-3', name: 'Tariq Jameel', phone: '03214567890', address: 'Main Road Sector Y, DHA Phase 3, Karachi', loyaltyPoints: 240, purchaseCount: 22 },
  { id: 'cust-4', name: 'Dr. Asma Khan', phone: '03451122334', address: 'Staff Colony, PIMS Hospital, Islamabad', loyaltyPoints: 310, purchaseCount: 19 }
];

export const mockMedicines: Medicine[] = [
  {
    id: 'med-1',
    name: 'Panadol 500mg',
    genericName: 'Paracetamol',
    categoryId: 'cat-1',
    barcode: '8964000100101',
    purchasePrice: 1.8,
    retailPrice: 2.5,
    rackLocation: 'A-12',
    batchNumber: 'PNT-385',
    expiryDate: '2027-12-15',
    minStockAlert: 100,
    stock: 450
  },
  {
    id: 'med-2',
    name: 'Augmentin 625mg',
    genericName: 'Co-Amoxiclav',
    categoryId: 'cat-1',
    barcode: '8964000100200',
    purchasePrice: 22.0,
    retailPrice: 28.5,
    rackLocation: 'B-04',
    batchNumber: 'AUG-912',
    expiryDate: '2027-05-20',
    minStockAlert: 30,
    stock: 85
  },
  {
    id: 'med-3',
    name: 'Arinac Forte',
    genericName: 'Ibuprofen + Pseudoephedrine',
    categoryId: 'cat-1',
    barcode: '8964000100309',
    purchasePrice: 6.5,
    retailPrice: 9.0,
    rackLocation: 'A-08',
    batchNumber: 'ARN-115',
    expiryDate: '2026-11-30',
    minStockAlert: 50,
    stock: 140
  },
  {
    id: 'med-4',
    name: 'Cac-1000 Plus (Orange)',
    genericName: 'Calcium Lactate + Carbonate + Vitamin C',
    categoryId: 'cat-2',
    barcode: '8964000100408',
    purchasePrice: 18.0,
    retailPrice: 24.0,
    rackLocation: 'D-02',
    batchNumber: 'CAC-228',
    expiryDate: '2026-08-10',
    minStockAlert: 20,
    stock: 8
  },
  {
    id: 'med-5',
    name: 'Surbex-Z',
    genericName: 'Zinc + Vitamin B-Complex + Vitamin C',
    categoryId: 'cat-1',
    barcode: '8964000100507',
    purchasePrice: 15.0,
    retailPrice: 19.5,
    rackLocation: 'B-10',
    batchNumber: 'SBZ-804',
    expiryDate: '2026-07-25',
    minStockAlert: 40,
    stock: 110
  },
  {
    id: 'med-6',
    name: 'Ventolin Inhaler',
    genericName: 'Salbutamol',
    categoryId: 'cat-4',
    barcode: '8964000100606',
    purchasePrice: 120.0,
    retailPrice: 145.0,
    rackLocation: 'F-01',
    batchNumber: 'VNT-404',
    expiryDate: '2027-01-15',
    minStockAlert: 15,
    stock: 35
  },
  {
    id: 'med-7',
    name: 'Hydryllin Syrup 120ml',
    genericName: 'Aminophylline + Diphenhydramine',
    categoryId: 'cat-2',
    barcode: '8964000100705',
    purchasePrice: 65.0,
    retailPrice: 80.0,
    rackLocation: 'C-05',
    batchNumber: 'HYD-510',
    expiryDate: '2026-09-05',
    minStockAlert: 25,
    stock: 6
  },
  {
    id: 'med-8',
    name: 'Risek 40mg',
    genericName: 'Omeprazole',
    categoryId: 'cat-5',
    barcode: '8964000100804',
    purchasePrice: 32.0,
    retailPrice: 40.0,
    rackLocation: 'B-02',
    batchNumber: 'RSK-990',
    expiryDate: '2028-03-10',
    minStockAlert: 50,
    stock: 210
  },
  {
    id: 'med-9',
    name: 'Amoxil 250mg Susp',
    genericName: 'Amoxicillin Trihydrate',
    categoryId: 'cat-2',
    barcode: '8964000100903',
    purchasePrice: 42.0,
    retailPrice: 55.0,
    rackLocation: 'C-12',
    batchNumber: 'AMX-004',
    expiryDate: '2026-06-25', // EXPIRED or close to expiry (system date is 2026-06-20)
    minStockAlert: 15,
    stock: 12
  },
  {
    id: 'med-10',
    name: 'Avil Injection 2ml',
    genericName: 'Pheniramine Maleate',
    categoryId: 'cat-3',
    barcode: '8964000101009',
    purchasePrice: 12.0,
    retailPrice: 16.5,
    rackLocation: 'E-03',
    batchNumber: 'AVL-731',
    expiryDate: '2026-05-01', // Expired
    minStockAlert: 30,
    stock: 45
  },
  {
    id: 'med-11',
    name: 'Brufen 400mg',
    genericName: 'Ibuprofen',
    categoryId: 'cat-1',
    barcode: '8964000101108',
    purchasePrice: 3.5,
    retailPrice: 4.8,
    rackLocation: 'A-02',
    batchNumber: 'BUF-214',
    expiryDate: '2027-10-18',
    minStockAlert: 80,
    stock: 300
  },
  {
    id: 'med-12',
    name: 'Flagyl 400mg',
    genericName: 'Metronidazole',
    categoryId: 'cat-1',
    barcode: '8964000101207',
    purchasePrice: 2.2,
    retailPrice: 3.1,
    rackLocation: 'A-05',
    batchNumber: 'FGL-552',
    expiryDate: '2027-02-14',
    minStockAlert: 100,
    stock: 5
  },
  {
    id: 'med-13',
    name: 'Loprin 75mg',
    genericName: 'Aspirin (Low Dose)',
    categoryId: 'cat-1',
    barcode: '8964000101306',
    purchasePrice: 1.1,
    retailPrice: 1.6,
    rackLocation: 'A-10',
    batchNumber: 'LPR-808',
    expiryDate: '2028-01-22',
    minStockAlert: 120,
    stock: 400
  },
  {
    id: 'med-14',
    name: 'Gravinate 50mg',
    genericName: 'Dimenhydrinate',
    categoryId: 'cat-1',
    barcode: '8964000101405',
    purchasePrice: 2.5,
    retailPrice: 3.5,
    rackLocation: 'A-07',
    batchNumber: 'GRV-001',
    expiryDate: '2027-08-30',
    minStockAlert: 50,
    stock: 120
  },
  {
    id: 'med-15',
    name: 'Secnidazole 1g',
    genericName: 'Secnidazole',
    categoryId: 'cat-1',
    barcode: '8964000101504',
    purchasePrice: 45.0,
    retailPrice: 58.0,
    rackLocation: 'B-08',
    batchNumber: 'SEC-333',
    expiryDate: '2026-07-02', // Very close expiry
    minStockAlert: 20,
    stock: 65
  }
];

export const mockSettings: PharmacySettings = {
  pharmacyName: 'Sehat Pharmacy',
  logoText: 'SEHAT',
  address: 'Shop #12, Ground Floor, Beverly Centre, Blue Area, Islamabad',
  phone: '051-2824040',
  invoiceFooter: 'Thank you for choosing Sehat Pharmacy. Get well soon!',
  taxPercentage: 5.0,
  activePaymentMethods: {
    cash: true,
    card: true,
    digitalWallet: true,
    bankTransfer: true
  }
};

// Generates sales history over the past 30 days
const generatePastSales = (): Sale[] => {
  const sales: Sale[] = [];
  const paymentMethods: ('Cash' | 'Card' | 'Digital Wallet' | 'Bank Transfer')[] = ['Cash', 'Card', 'Digital Wallet', 'Bank Transfer'];
  const cashiers = [
    { id: 'usr-3', name: 'Ayesha Siddiqa' },
    { id: 'usr-1', name: 'Dr. Bilal Khan' }
  ];
  
  const currentDate = new Date('2026-06-20T12:00:00Z');
  
  // Create 30 mock sales over the last month
  for (let i = 25; i >= 0; i--) {
    const saleDate = new Date(currentDate.getTime() - i * 24 * 60 * 60 * 1000 - Math.random() * 8 * 60 * 60 * 1000);
    const cashier = cashiers[Math.floor(Math.random() * cashiers.length)];
    const customer = mockCustomers[Math.floor(Math.random() * (mockCustomers.length - 1) + 1)]; // Avoid walk-in mostly to show customers
    const payMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    
    // Choose 1-3 random medicines
    const medicineItems = [
      mockMedicines[0], // Panadol
      mockMedicines[1], // Augmentin
      mockMedicines[2], // Arinac
      mockMedicines[4], // Surbex
      mockMedicines[7], // Risek
      mockMedicines[10], // Brufen
    ];
    
    const selectedCount = Math.floor(Math.random() * 2) + 1; // 1 or 2 items
    const items = [];
    let subtotal = 0;
    
    for (let j = 0; j < selectedCount; j++) {
      const med = medicineItems[Math.floor(Math.random() * medicineItems.length)];
      const qty = Math.floor(Math.random() * 3) + 1;
      const totalAmount = med.retailPrice * qty;
      subtotal += totalAmount;
      
      items.push({
        id: `sitem-${i}-${j}`,
        saleId: `sale-${30 - i}`,
        productId: med.id,
        productName: med.name,
        quantity: qty,
        retailPrice: med.retailPrice,
        totalAmount: totalAmount
      });
    }

    const discountType = Math.random() > 0.5 ? 'percentage' : 'fixed';
    const discountValue = discountType === 'percentage' ? (Math.random() > 0.6 ? 10 : 0) : (Math.random() > 0.8 ? 50 : 0);
    
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (subtotal * discountValue) / 100;
    } else {
      discountAmount = Math.min(discountValue, subtotal);
    }
    
    const taxAmount = ((subtotal - discountAmount) * 5) / 100;
    const grandTotal = subtotal - discountAmount + taxAmount;
    
    sales.push({
      id: `sale-${30 - i}`,
      invoiceNumber: `INV-2026-${1000 + (30 - i)}`,
      date: saleDate.toISOString(),
      customerId: customer.id,
      customerName: customer.name,
      items: items,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discountType: discountType as 'percentage' | 'fixed',
      discountValue: discountValue,
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2)),
      paymentMethod: payMethod,
      cashierId: cashier.id,
      cashierName: cashier.name
    });
  }
  
  return sales;
};

export const mockSales = generatePastSales();

export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po-1',
    invoiceNumber: 'PO-2026-001',
    supplierId: 'sup-1',
    supplierName: 'GlaxoSmithKline (GSK) Pak',
    date: '2026-05-10T11:00:00Z',
    items: [
      { id: 'poi-1', purchaseOrderId: 'po-1', productId: 'med-1', productName: 'Panadol 500mg', quantity: 200, purchasePrice: 1.8, totalAmount: 360 },
      { id: 'poi-2', purchaseOrderId: 'po-1', productId: 'med-6', productName: 'Ventolin Inhaler', quantity: 30, purchasePrice: 120.0, totalAmount: 3600 }
    ],
    totalAmount: 3960,
    status: 'Received'
  },
  {
    id: 'po-2',
    invoiceNumber: 'PO-2026-002',
    supplierId: 'sup-3',
    supplierName: 'Abbott Laboratories',
    date: '2026-06-02T15:30:00Z',
    items: [
      { id: 'poi-3', purchaseOrderId: 'po-2', productId: 'med-5', productName: 'Surbex-Z', quantity: 100, purchasePrice: 15.0, totalAmount: 1500 },
      { id: 'poi-4', purchaseOrderId: 'po-2', productId: 'med-11', productName: 'Brufen 400mg', quantity: 150, purchasePrice: 3.5, totalAmount: 525 }
    ],
    totalAmount: 2025,
    status: 'Received'
  }
];
