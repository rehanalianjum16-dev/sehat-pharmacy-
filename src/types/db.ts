// TypeScript definitions for Sehat Pharmacy Relational Data Model

export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string; // stored as plain-text for simple client-side verification
  status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
}

export interface Category {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string; // Generic formula
  categoryId: string;
  categoryName?: string; // Denormalized helper
  barcode: string; // SKU or Barcode
  purchasePrice: number;
  retailPrice: number;
  rackLocation: string; // Rack Number/Location
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  minStockAlert: number; // Minimum stock alert quantity
  stock: number; // Current stock count
}

export interface Supplier {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  ledgerBalance: number; // Pending Balance
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  loyaltyPoints: number;
  purchaseCount: number;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  retailPrice: number;
  totalAmount: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string; // ISO String
  customerId: string;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  paymentMethod: 'Cash' | 'Card' | 'Digital Wallet' | 'Bank Transfer';
  cashierId: string;
  cashierName: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
  totalAmount: number;
}

export interface PurchaseOrder {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: 'Received' | 'Pending';
}

export interface PharmacySettings {
  pharmacyName: string;
  logoText: string;
  address: string;
  phone: string;
  invoiceFooter: string;
  taxPercentage: number;
  activePaymentMethods: {
    cash: boolean;
    card: boolean;
    digitalWallet: boolean; // EasyPaisa/JazzCash
    bankTransfer: boolean;
  };
}
