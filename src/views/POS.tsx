import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import type { Medicine, Customer, SaleItem, Sale } from '../types/db';
import { Search, Plus, Minus, Trash2, ShoppingCart, UserPlus, Receipt, CreditCard, Wallet, Banknote, DollarSign, MapPin } from 'lucide-react';

export const POS: React.FC = () => {
  const { 
    medicines, customers, categories, currentUser, settings, checkoutSale, updateCustomers 
  } = useApp();

  // POS State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('walk-in');
  const [cart, setCart] = useState<{ medicine: Medicine; quantity: number }[]>([]);
  
  // Discount & Taxes
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Digital Wallet' | 'Bank Transfer'>('Cash');

  // Checkout modal
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Quick Customer Creation modal
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddr, setNewCustAddr] = useState('');

  // Auto focus search on mount
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Filter products based on search query and category
  const filteredProducts = useMemo(() => {
    return medicines.filter(med => {
      const matchesSearch = 
        med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.barcode.includes(searchQuery);
      
      const matchesCategory = selectedCategory === 'all' || med.categoryId === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [medicines, searchQuery, selectedCategory]);

  // Selected Customer Details
  const activeCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || customers[0];
  }, [customers, selectedCustomerId]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.medicine.retailPrice * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountType === 'percentage') {
      return (subtotal * discountValue) / 100;
    }
    return Math.min(discountValue, subtotal);
  }, [subtotal, discountType, discountValue]);

  const taxAmount = useMemo(() => {
    const netAmount = subtotal - discountAmount;
    return (netAmount * settings.taxPercentage) / 100;
  }, [subtotal, discountAmount, settings.taxPercentage]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + taxAmount);
  }, [subtotal, discountAmount, taxAmount]);

  // Add Item to Cart
  const addToCart = (med: Medicine) => {
    if (med.stock <= 0) {
      alert(`"${med.name}" is OUT of stock!`);
      return;
    }

    setCart(prevCart => {
      const existing = prevCart.find(item => item.medicine.id === med.id);
      if (existing) {
        if (existing.quantity >= med.stock) {
          alert(`Cannot add more. Only ${med.stock} units available in stock.`);
          return prevCart;
        }
        return prevCart.map(item => 
          item.medicine.id === med.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prevCart, { medicine: med, quantity: 1 }];
    });
  };

  // Adjust Quantity
  const updateQuantity = (medId: string, val: number) => {
    const med = medicines.find(m => m.id === medId);
    if (!med) return;

    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.medicine.id === medId) {
          const newQty = item.quantity + val;
          if (newQty <= 0) return null;
          if (newQty > med.stock) {
            alert(`Only ${med.stock} units available in stock.`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as typeof cart;
    });
  };

  // Remove Item
  const removeFromCart = (medId: string) => {
    setCart(prevCart => prevCart.filter(item => item.medicine.id !== medId));
  };

  // Checkout order
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Your billing cart is empty.');
      return;
    }

    if (!currentUser) return;

    const saleItems: SaleItem[] = cart.map((item, idx) => ({
      id: `sitem-tmp-${idx}`,
      saleId: 'temp',
      productId: item.medicine.id,
      productName: item.medicine.name,
      quantity: item.quantity,
      retailPrice: item.medicine.retailPrice,
      totalAmount: item.medicine.retailPrice * item.quantity
    }));

    const saleRecord: Omit<Sale, 'id' | 'invoiceNumber' | 'date'> = {
      customerId: selectedCustomerId,
      customerName: activeCustomer.name,
      items: saleItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discountType,
      discountValue,
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2)),
      paymentMethod,
      cashierId: currentUser.id,
      cashierName: currentUser.name
    };

    // Commit transaction
    const savedSale = checkoutSale(saleRecord);
    setCompletedSale(savedSale);
    setShowCheckoutModal(true);
    
    // Reset state
    setCart([]);
    setDiscountValue(0);
    setSelectedCustomerId('walk-in');
  };

  // Quick Customer Creation Form
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) {
      alert('Please enter a Customer Name and Phone Number.');
      return;
    }

    const newId = `cust-${customers.length + 1}`;
    const newCustomer: Customer = {
      id: newId,
      name: newCustName,
      phone: newCustPhone,
      address: newCustAddr || 'Islamabad, Pakistan',
      loyaltyPoints: 0,
      purchaseCount: 0
    };

    updateCustomers([...customers, newCustomer]);
    setSelectedCustomerId(newId);
    setShowCustomerModal(false);

    // Reset fields
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddr('');
  };

  const handlePrint = () => {
    window.print();
  };

  const formatPrice = (val: number) => {
    return 'Rs. ' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="pos-view">
      {/* Search and Product Selection */}
      <div className="pos-products-panel">
        <div className="search-filters">
          <div className="search-bar-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Search by Name, Formula, or Barcode (Scan)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="category-scroll">
            <button 
              className={`cat-pill ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All Medicines
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                className={`cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="product-grid">
          {filteredProducts.map(med => {
            const isOutOfStock = med.stock <= 0;
            const isLowStock = med.stock > 0 && med.stock <= med.minStockAlert;
            
            return (
              <div 
                key={med.id} 
                className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}
                onClick={() => !isOutOfStock && addToCart(med)}
              >
                <div className="card-top">
                  <span className="med-sku">{med.barcode}</span>
                  {isOutOfStock ? (
                    <span className="stock-badge badge-danger">Out of Stock</span>
                  ) : isLowStock ? (
                    <span className="stock-badge badge-warning">Low Stock ({med.stock})</span>
                  ) : (
                    <span className="stock-badge badge-success">{med.stock} left</span>
                  )}
                </div>
                <div className="card-info">
                  <h4>{med.name}</h4>
                  <p className="generic-name">{med.genericName}</p>
                  <div className="card-footer">
                    <span className="price">{formatPrice(med.retailPrice)}</span>
                    <span className="rack-loc"><MapPin size={12} /> {med.rackLocation}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="empty-search">
              <p>No medicines matched your filter query.</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Billing Sidebar */}
      <div className="pos-billing-panel">
        <div className="billing-header">
          <div className="cart-title">
            <ShoppingCart size={18} />
            <h3>Billing Cart</h3>
            <span className="item-count">{cart.length} items</span>
          </div>

          <button 
            type="button" 
            className="btn btn-secondary btn-icon"
            onClick={() => setShowCustomerModal(true)}
            title="Register New Customer"
          >
            <UserPlus size={18} />
          </button>
        </div>

        {/* Customer Select */}
        <div className="customer-selection-box">
          <label>Select Customer Profile</label>
          <select 
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
          >
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone !== 'N/A' ? `(${c.phone})` : ''}
              </option>
            ))}
          </select>
          {activeCustomer.id !== 'walk-in' && (
            <div className="loyalty-badge">
              Loyalty Points: <strong>{activeCustomer.loyaltyPoints}</strong>
            </div>
          )}
        </div>

        {/* Cart Listing */}
        <div className="cart-list">
          {cart.length === 0 ? (
            <div className="empty-cart-view">
              <ShoppingCart size={40} className="empty-icon" />
              <p>Your cart is empty. Click medicines on the left to add items.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.medicine.id} className="cart-item-row">
                <div className="item-details">
                  <h4>{item.medicine.name}</h4>
                  <span>{formatPrice(item.medicine.retailPrice)} each</span>
                </div>
                <div className="quantity-controls">
                  <button onClick={() => updateQuantity(item.medicine.id, -1)}>
                    <Minus size={14} />
                  </button>
                  <span className="qty-val">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.medicine.id, 1)}>
                    <Plus size={14} />
                  </button>
                </div>
                <div className="item-pricing">
                  <span className="item-total">
                    {formatPrice(item.medicine.retailPrice * item.quantity)}
                  </span>
                  <button 
                    className="delete-item"
                    onClick={() => removeFromCart(item.medicine.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Billing Calculations */}
        <div className="billing-summary">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          <div className="discount-adjuster">
            <div className="discount-type-toggles">
              <button 
                className={`type-toggle ${discountType === 'percentage' ? 'active' : ''}`}
                onClick={() => setDiscountType('percentage')}
              >
                % Discount
              </button>
              <button 
                className={`type-toggle ${discountType === 'fixed' ? 'active' : ''}`}
                onClick={() => setDiscountType('fixed')}
              >
                Rs. Discount
              </button>
            </div>
            <input 
              type="number" 
              min={0}
              placeholder="0"
              value={discountValue || ''}
              onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="summary-row">
            <span>Tax ({settings.taxPercentage}%)</span>
            <span>{formatPrice(taxAmount)}</span>
          </div>

          <div className="summary-row grand-total-row">
            <span>Grand Total</span>
            <span className="total-val">{formatPrice(grandTotal)}</span>
          </div>

          {/* Payment Methods */}
          <div className="payment-options">
            <label>Payment Method</label>
            <div className="payment-grid">
              <button 
                className={`pay-pill ${paymentMethod === 'Cash' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('Cash')}
              >
                <Banknote size={16} /> Cash
              </button>
              <button 
                className={`pay-pill ${paymentMethod === 'Card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('Card')}
              >
                <CreditCard size={16} /> Card
              </button>
              <button 
                className={`pay-pill ${paymentMethod === 'Digital Wallet' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('Digital Wallet')}
              >
                <Wallet size={16} /> Mobile Wallet
              </button>
              <button 
                className={`pay-pill ${paymentMethod === 'Bank Transfer' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('Bank Transfer')}
              >
                <DollarSign size={16} /> Bank Transfer
              </button>
            </div>
          </div>

          <button 
            className="btn btn-primary checkout-btn"
            disabled={cart.length === 0}
            onClick={handleCheckout}
          >
            <Receipt size={18} /> Complete Order & Print Invoice
          </button>
        </div>
      </div>

      {/* ================= MODALS ================= */}

      {/* 1. Invoicing Receipt Modal */}
      {showCheckoutModal && completedSale && (
        <div className="modal-overlay">
          <div className="modal-content invoice-modal">
            <div className="modal-header no-print">
              <h3>Invoice Generated</h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowCheckoutModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="modal-body invoice-print-area">
              {/* Thermal Invoice (80mm) container */}
              <div className="receipt-container">
                <div className="receipt-header">
                  <h2>{settings.pharmacyName}</h2>
                  <p>{settings.address}</p>
                  <p>Ph: {settings.phone}</p>
                  <div className="receipt-divider"></div>
                </div>

                <div className="receipt-meta">
                  <p><strong>Invoice #:</strong> {completedSale.invoiceNumber}</p>
                  <p><strong>Date:</strong> {new Date(completedSale.date).toLocaleString('en-US')}</p>
                  <p><strong>Customer:</strong> {completedSale.customerName}</p>
                  <p><strong>Cashier:</strong> {completedSale.cashierName}</p>
                  <div className="receipt-divider"></div>
                </div>

                <table className="receipt-table">
                  <thead>
                    <tr>
                      <th>Medicine Name</th>
                      <th className="text-center">Qty</th>
                      <th className="text-right">Price</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedSale.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.productName}</td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-right">{item.retailPrice.toFixed(2)}</td>
                        <td className="text-right">{item.totalAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="receipt-divider"></div>
                
                <div className="receipt-pricing">
                  <div className="pricing-row">
                    <span>Subtotal:</span>
                    <span>{completedSale.subtotal.toFixed(2)}</span>
                  </div>
                  {completedSale.discountAmount > 0 && (
                    <div className="pricing-row">
                      <span>Discount:</span>
                      <span>-{completedSale.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pricing-row">
                    <span>Tax ({settings.taxPercentage}%):</span>
                    <span>{completedSale.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="pricing-row total">
                    <span>Grand Total (PKR):</span>
                    <span>{completedSale.grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="receipt-divider"></div>

                <div className="receipt-footer">
                  <p>Paid via: <strong>{completedSale.paymentMethod}</strong></p>
                  {completedSale.customerId !== 'walk-in' && (
                    <p>Points Earned: +{Math.floor(completedSale.grandTotal / 100)}</p>
                  )}
                  <br />
                  <p className="footer-msg">{settings.invoiceFooter}</p>
                </div>
              </div>
            </div>

            <div className="modal-footer no-print">
              <button className="btn btn-secondary" onClick={() => setShowCheckoutModal(false)}>
                Close Billing Panel
              </button>
              <button className="btn btn-primary" onClick={handlePrint}>
                Print Receipt (Thermal/A4)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Customer quick creation Modal */}
      {showCustomerModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>Register New Customer</h3>
              <button 
                className="btn btn-secondary btn-icon" 
                onClick={() => setShowCustomerModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateCustomer}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Customer Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Asif Raza"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 03001234567"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Residential Address</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Sector F-7, Islamabad"
                    value={newCustAddr}
                    onChange={(e) => setNewCustAddr(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowCustomerModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .pos-view {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 24px;
          height: calc(100vh - 120px);
          overflow: hidden;
        }

        /* Products Panel */
        .pos-products-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
          height: 100%;
          overflow: hidden;
        }

        .search-filters {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .search-bar-wrapper {
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .search-bar-wrapper input {
          padding-left: 44px;
          padding-top: 12px;
          padding-bottom: 12px;
          font-size: 15px;
          border-radius: var(--radius-md);
        }

        .category-scroll {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .cat-pill {
          padding: 6px 14px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border);
          background-color: var(--surface);
          color: var(--text-muted);
          font-family: var(--font-sans);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: var(--transition);
        }

        .cat-pill:hover {
          color: var(--primary);
          border-color: var(--primary);
        }

        .cat-pill.active {
          background-color: var(--primary);
          color: var(--text-inverse);
          border-color: var(--primary);
          box-shadow: var(--shadow-glow);
        }

        .product-grid {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 14px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .product-card {
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 16px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: var(--transition);
        }

        .product-card:hover {
          transform: translateY(-2px);
          border-color: var(--primary);
          box-shadow: var(--shadow-md);
        }

        .product-card.out-of-stock {
          opacity: 0.55;
          cursor: not-allowed;
          background-color: var(--background);
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .med-sku {
          font-size: 10px;
          font-family: monospace;
          color: var(--text-muted);
        }

        .stock-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: var(--radius-full);
        }

        .card-info h4 {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 2px;
        }

        .generic-name {
          font-size: 11px;
          color: var(--text-muted);
          margin-bottom: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--border);
          padding-top: 8px;
        }

        .card-footer .price {
          font-weight: 700;
          font-size: 13.5px;
          color: var(--primary);
        }

        .rack-loc {
          font-size: 10.5px;
          color: var(--text-muted);
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }

        .empty-search {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px;
          color: var(--text-muted);
        }

        /* Billing panel */
        .pos-billing-panel {
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }

        .billing-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .cart-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cart-title h3 {
          font-size: 15px;
          font-weight: 600;
        }

        .item-count {
          background-color: var(--primary-light);
          color: var(--primary);
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: var(--radius-full);
        }

        .customer-selection-box {
          padding: 12px 20px;
          border-bottom: 1px solid var(--border);
          background-color: var(--surface-header);
        }

        .loyalty-badge {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 6px;
        }

        .loyalty-badge strong {
          color: var(--primary);
        }

        .cart-list {
          flex: 1;
          overflow-y: auto;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .empty-cart-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: var(--text-muted);
          height: 100%;
          text-align: center;
          padding: 20px;
        }

        .empty-icon {
          opacity: 0.2;
        }

        .cart-item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border);
          padding-bottom: 12px;
        }

        .cart-item-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .item-details h4 {
          font-size: 13.5px;
          font-weight: 600;
        }
        
        .item-details span {
          font-size: 11px;
          color: var(--text-muted);
        }

        .quantity-controls {
          display: flex;
          align-items: center;
          border: 1px solid var(--border);
          border-radius: var(--radius-xs);
          overflow: hidden;
        }

        .quantity-controls button {
          border: none;
          background-color: var(--background);
          color: var(--text);
          width: 26px;
          height: 26px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition);
        }

        .quantity-controls button:hover {
          background-color: var(--border);
        }

        .qty-val {
          width: 32px;
          text-align: center;
          font-size: 13px;
          font-weight: 600;
        }

        .item-pricing {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .item-total {
          font-weight: 600;
          font-size: 13.5px;
          width: 80px;
          text-align: right;
        }

        .delete-item {
          background: transparent;
          border: none;
          color: var(--danger);
          cursor: pointer;
          opacity: 0.7;
          transition: var(--transition);
        }

        .delete-item:hover {
          opacity: 1;
        }

        /* Billing summary */
        .billing-summary {
          padding: 16px 20px;
          background-color: var(--surface-header);
          border-top: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-muted);
        }

        .discount-adjuster {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 10px;
          align-items: center;
        }

        .discount-type-toggles {
          display: flex;
          border: 1px solid var(--border);
          border-radius: var(--radius-xs);
          overflow: hidden;
          background-color: var(--surface);
        }

        .type-toggle {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 11px;
          font-weight: 600;
          padding: 6px;
          cursor: pointer;
          color: var(--text-muted);
          transition: var(--transition);
        }

        .type-toggle.active {
          background-color: var(--primary-light);
          color: var(--primary);
        }

        .grand-total-row {
          font-size: 16px;
          font-weight: 700;
          color: var(--text);
          border-top: 1px dashed var(--border);
          padding-top: 10px;
        }

        .total-val {
          color: var(--primary);
          font-size: 18px;
        }

        .payment-options {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .payment-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px;
        }

        .pay-pill {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 6px 2px;
          font-size: 10px;
          font-weight: 600;
          border: 1px solid var(--border);
          border-radius: var(--radius-xs);
          background-color: var(--surface);
          color: var(--text-muted);
          cursor: pointer;
          transition: var(--transition);
        }

        .pay-pill:hover {
          color: var(--primary);
          border-color: var(--primary);
        }

        .pay-pill.active {
          background-color: var(--primary-light);
          color: var(--primary);
          border-color: var(--primary);
        }

        .checkout-btn {
          width: 100%;
          padding: 12px;
          font-size: 15px;
        }

        /* Invoice Modal Print Details */
        .invoice-modal {
          max-width: 450px;
        }

        .receipt-container {
          background-color: white;
          color: black !important;
          font-family: 'Courier New', Courier, monospace;
          padding: 12px;
          border-radius: 4px;
          box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.05);
        }

        .receipt-container * {
          color: black !important;
        }

        .receipt-header {
          text-align: center;
          margin-bottom: 8px;
        }

        .receipt-header h2 {
          font-size: 18px;
          font-weight: 700;
          font-family: inherit;
        }

        .receipt-header p {
          font-size: 11px;
          margin-bottom: 2px;
        }

        .receipt-divider {
          border-bottom: 1px dashed black;
          margin: 8px 0;
        }

        .receipt-meta {
          font-size: 11px;
          margin-bottom: 8px;
        }
        
        .receipt-meta p {
          margin-bottom: 2px;
        }

        .receipt-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          margin-bottom: 8px;
        }

        .receipt-table th {
          background: transparent !important;
          border-bottom: 1px dashed black;
          padding: 4px 0;
          font-size: 11px;
          font-weight: 700;
        }

        .receipt-table td {
          padding: 4px 0;
          font-size: 11px;
          border-bottom: none;
        }

        .receipt-table tr:hover td {
          background: transparent !important;
        }

        .receipt-pricing {
          font-size: 11px;
        }

        .pricing-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }

        .pricing-row.total {
          font-weight: 700;
          font-size: 12.5px;
          margin-top: 4px;
        }

        .receipt-footer {
          text-align: center;
          font-size: 11px;
        }

        .footer-msg {
          font-style: italic;
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
      `}</style>
    </div>
  );
};
