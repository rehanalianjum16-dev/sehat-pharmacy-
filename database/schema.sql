-- ==========================================
-- Sehat Pharmacy Database Schema
-- Target Database: PostgreSQL 14+
-- Production Ready Relational Schema
-- ==========================================

-- Enable UUID extension for secure identifier generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & ROLES TABLE
CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'MANAGER', 'CASHIER');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'CASHIER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- 2. MEDICINE CATEGORIES TABLE
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. MEDICAL DISTRIBUTORS / SUPPLIERS TABLE
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(150) UNIQUE NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255),
    ledger_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (ledger_balance >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CUSTOMERS TABLE
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) UNIQUE,
    address TEXT,
    loyalty_points INTEGER NOT NULL DEFAULT 0 CHECK (loyalty_points >= 0),
    purchase_count INTEGER NOT NULL DEFAULT 0 CHECK (purchase_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_phone ON customers(phone);

-- 5. MEDICINES / PRODUCTS TABLE
CREATE TABLE medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    generic_name VARCHAR(255) NOT NULL, -- Chemical formula (e.g. Paracetamol)
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    barcode VARCHAR(100) UNIQUE NOT NULL, -- Barcode/SKU
    purchase_price NUMERIC(10, 2) NOT NULL CHECK (purchase_price >= 0),
    retail_price NUMERIC(10, 2) NOT NULL CHECK (retail_price >= 0),
    rack_location VARCHAR(50), -- Shelf location (e.g., A-12)
    batch_number VARCHAR(100),
    expiry_date DATE NOT NULL,
    min_stock_alert INTEGER NOT NULL DEFAULT 10 CHECK (min_stock_alert >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_retail_vs_purchase CHECK (retail_price >= purchase_price)
);

CREATE INDEX idx_medicines_barcode ON medicines(barcode);
CREATE INDEX idx_medicines_name ON medicines(name);
CREATE INDEX idx_medicines_generic ON medicines(generic_name);

-- 6. SALES INVOICES (POS TRANSACTIONS) TABLE
CREATE TYPE payment_method_enum AS ENUM ('Cash', 'Card', 'Digital Wallet', 'Bank Transfer');

CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    discount_type VARCHAR(20) DEFAULT 'percentage',
    discount_value NUMERIC(10, 2) DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) DEFAULT 0.00,
    grand_total NUMERIC(12, 2) NOT NULL CHECK (grand_total >= 0),
    payment_method payment_method_enum NOT NULL DEFAULT 'Cash',
    cashier_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sales_invoice ON sales(invoice_number);
CREATE INDEX idx_sales_date ON sales(date);

-- 7. SALES ITEMS TABLE
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    retail_price NUMERIC(10, 2) NOT NULL CHECK (retail_price >= 0),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0)
);

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);

-- 8. SUPPLIER PURCHASE ORDERS (STOCK REPLENISHMENT) TABLE
CREATE TYPE po_status_enum AS ENUM ('Received', 'Pending');

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(100) NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    status po_status_enum NOT NULL DEFAULT 'Received',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);

-- 9. PURCHASE ORDER ITEMS TABLE
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    purchase_price NUMERIC(10, 2) NOT NULL CHECK (purchase_price >= 0),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0)
);

-- 10. SYSTEM SETTINGS TABLE
CREATE TABLE settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- RELATIONAL CONSTRAINTS & AUTOMATED TRIGGER LOGIC
-- Automatically update inventory stock levels when a transaction occurs
-- ==========================================

-- Trigger to deduct stock upon sale insertion
CREATE OR REPLACE FUNCTION deduct_medicine_stock_on_sale() 
RETURNS TRIGGER AS $$
BEGIN
    UPDATE medicines
    SET stock = stock - NEW.quantity
    WHERE id = NEW.product_id;
    
    -- Verify that stock does not fall below zero
    IF (SELECT stock FROM medicines WHERE id = NEW.product_id) < 0 THEN
        RAISE EXCEPTION 'Transaction aborted: Insufficient inventory levels for medicine ID %', NEW.product_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_deduct_stock
AFTER INSERT ON sale_items
FOR EACH ROW
EXECUTE FUNCTION deduct_medicine_stock_on_sale();

-- Trigger to increment stock upon purchase receipt
CREATE OR REPLACE FUNCTION load_medicine_stock_on_purchase() 
RETURNS TRIGGER AS $$
BEGIN
    UPDATE medicines
    SET stock = stock + NEW.quantity,
        purchase_price = NEW.purchase_price
    WHERE id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_stock
AFTER INSERT ON purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION load_medicine_stock_on_purchase();


-- ==========================================
-- SEED INITIALIZATION DATA (SAMPLE ROWS)
-- ==========================================

-- Default Users (Password Hash represented)
INSERT INTO users (email, name, password_hash, role) VALUES 
('admin@sehat.com', 'Dr. Bilal Khan (Admin)', '$2b$10$xyz...', 'ADMIN'),
('manager@sehat.com', 'Zahid Mahmood (Manager)', '$2b$10$abc...', 'MANAGER'),
('cashier@sehat.com', 'Ayesha Siddiqa (Cashier)', '$2b$10$pqr...', 'CASHIER');

-- Categories
INSERT INTO categories (name, description) VALUES
('Tablets', 'Solid dosage forms containing medicinal substances'),
('Syrups & Liquids', 'Liquid preparations containing high concentration of sucrose'),
('Injections & Vials', 'Sterile solutions for parenteral administration');

-- Default Walk-in Customer
INSERT INTO customers (id, name, phone, address, loyalty_points) VALUES
('00000000-0000-0000-0000-000000000000', 'Walk-in Customer', NULL, NULL, 0);
