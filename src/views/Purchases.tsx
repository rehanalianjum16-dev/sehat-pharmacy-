import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { PurchaseOrderItem, PurchaseOrder } from '../types/db';
import { Plus, Trash2, Calendar, ClipboardCheck, ShieldAlert, Sparkles, MapPin } from 'lucide-react';

export const Purchases: React.FC = () => {
  const {
    suppliers, medicines, checkoutPurchase
  } = useApp();

  // PO Form States
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [poInvoiceNum, setPoInvoiceNum] = useState<string>('');
  const [poItems, setPoItems] = useState<{ productId: string; quantity: number; purchasePrice: number }[]>([]);

  // Selected item being added to form
  const [selectedMedId, setSelectedMedId] = useState<string>(medicines[0]?.id || '');
  const [itemQty, setItemQty] = useState<number>(100);
  const [itemCost, setItemCost] = useState<number>(0);

  // Active Alert tabs
  const [activeTab, setActiveTab] = useState<'low' | 'expiry'>('low');

  const systemDate = new Date('2026-06-20');

  // Sync default cost when selecting medicine in form
  const activeMed = useMemo(() => {
    return medicines.find(m => m.id === selectedMedId);
  }, [medicines, selectedMedId]);

  // Adjust cost price field when medicine selection changes
  React.useEffect(() => {
    if (activeMed) {
      setItemCost(activeMed.purchasePrice);
    }
  }, [selectedMedId, activeMed]);

  // Calculations for PO Total
  const totalAmount = useMemo(() => {
    return poItems.reduce((sum, item) => {
      return sum + item.quantity * item.purchasePrice;
    }, 0);
  }, [poItems]);

  // Add Item to Purchase Order grid
  const addItemToPO = () => {
    if (!selectedMedId) return;
    const med = medicines.find(m => m.id === selectedMedId);
    if (!med) return;

    // Check if already exists in grid
    const existing = poItems.find(item => item.productId === selectedMedId);
    if (existing) {
      alert('This medicine is already added to the list below. Edit or delete it there.');
      return;
    }

    setPoItems(prev => [
      ...prev,
      { productId: selectedMedId, quantity: itemQty, purchasePrice: itemCost }
    ]);

    // Reset entry values
    setItemQty(100);
  };

  // Remove Item from grid
  const removeItemFromPO = (idx: number) => {
    setPoItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Submit PO
  const handleSavePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (poItems.length === 0) {
      alert('Please add at least one item to the purchase receipt list.');
      return;
    }

    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    if (!supplier) return;

    const items: PurchaseOrderItem[] = poItems.map((item, idx) => {
      const med = medicines.find(m => m.id === item.productId);
      return {
        id: `poi-tmp-${idx}`,
        purchaseOrderId: 'temp',
        productId: item.productId,
        productName: med?.name || 'Unknown',
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        totalAmount: item.quantity * item.purchasePrice
      };
    });

    const poRecord: Omit<PurchaseOrder, 'id' | 'date'> = {
      invoiceNumber: poInvoiceNum || `PO-${Date.now().toString().slice(-6)}`,
      supplierId: selectedSupplierId,
      supplierName: supplier.companyName,
      items,
      totalAmount,
      status: 'Received'
    };

    // Save purchase order (relational deductions, ledger postings automatic)
    checkoutPurchase(poRecord);

    // Reset PO Form
    setPoItems([]);
    setPoInvoiceNum('');
    alert('Purchase Order saved successfully. Stocks have been updated.');
  };

  // Compute Alerts list
  const lowStockAlerts = useMemo(() => {
    return medicines.filter(m => m.stock <= m.minStockAlert);
  }, [medicines]);

  const expiryAlerts = useMemo(() => {
    return medicines.filter(m => {
      const expDate = new Date(m.expiryDate);
      const daysDiff = Math.ceil((expDate.getTime() - systemDate.getTime()) / (1000 * 3600 * 24));
      return daysDiff <= 90; // Less than 3 months
    });
  }, [medicines]);

  const formatPrice = (val: number) => {
    return 'Rs. ' + val.toLocaleString('en-US', { minimumFractionDigits: 2 });
  };

  return (
    <div className="purchases-view">
      {/* 1. Purchase Intake Form Panel */}
      <div className="purchase-form-card">
        <div className="card-header">
          <h3>Record Supplier Purchase Order</h3>
          <p>Increases medicine stock and adjusts supplier balance due.</p>
        </div>

        <form onSubmit={handleSavePO} className="po-form">
          <div className="form-row-three">
            <div className="form-group">
              <label>Select Supplier *</label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                required
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.companyName} (Balance: Rs. {s.ledgerBalance})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Supplier Invoice / PO Number</label>
              <input
                type="text"
                placeholder="e.g. GSK-7389"
                value={poInvoiceNum}
                onChange={(e) => setPoInvoiceNum(e.target.value)}
              />
            </div>
          </div>

          <hr className="form-divider" />

          {/* Add Item Widget */}
          <div className="add-item-widget">
            <h4>Add Medicines to List</h4>
            <div className="widget-inputs">
              <div className="form-group flex-2">
                <label>Medicine Name</label>
                <select
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                >
                  {medicines.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.genericName}) [Stock: {m.stock}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Arrival Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={itemQty}
                  onChange={(e) => setItemQty(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label>Unit Cost (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={itemCost || ''}
                  onChange={(e) => setItemCost(parseFloat(e.target.value) || 0)}
                />
              </div>

              <button
                type="button"
                className="btn btn-secondary add-widget-btn"
                onClick={addItemToPO}
              >
                <Plus size={16} /> Add Item
              </button>
            </div>
          </div>

          {/* PO items list */}
          <div className="po-items-table">
            <table>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th className="text-center">Quantity</th>
                  <th className="text-right">Unit Cost</th>
                  <th className="text-right">Line Total</th>
                  <th className="text-center">Remove</th>
                </tr>
              </thead>
              <tbody>
                {poItems.map((item, idx) => {
                  const med = medicines.find(m => m.id === item.productId);
                  return (
                    <tr key={idx}>
                      <td>
                        <strong>{med?.name}</strong>
                        <span className="generic-cell-formula">{med?.genericName}</span>
                      </td>
                      <td className="text-center">{item.quantity} units</td>
                      <td className="text-right">{formatPrice(item.purchasePrice)}</td>
                      <td className="text-right font-weight-600">
                        {formatPrice(item.quantity * item.purchasePrice)}
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="delete-po-item"
                          onClick={() => removeItemFromPO(idx)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {poItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center">No medicines added to the arrival list.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Checkout block */}
          <div className="po-checkout-footer">
            <div className="total-block">
              <span>Grand Cost Total:</span>
              <h3>{formatPrice(totalAmount)}</h3>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={poItems.length === 0}
            >
              <ClipboardCheck size={18} /> File Purchase & Load Stocks
            </button>
          </div>
        </form>
      </div>

      {/* 2. Side Panel Alerts Manager */}
      <div className="purchases-alerts-panel">
        <div className="alert-tab-headers">
          <button
            className={`tab-hdr ${activeTab === 'low' ? 'active' : ''}`}
            onClick={() => setActiveTab('low')}
          >
            <ShieldAlert size={16} />
            <span>Low Stock ({lowStockAlerts.length})</span>
          </button>
          <button
            className={`tab-hdr ${activeTab === 'expiry' ? 'active' : ''}`}
            onClick={() => setActiveTab('expiry')}
          >
            <Calendar size={16} />
            <span>Expiry Warnings ({expiryAlerts.length})</span>
          </button>
        </div>

        <div className="tab-contents">
          {activeTab === 'low' ? (
            <div className="alerts-sub-list">
              {lowStockAlerts.map(med => (
                <div key={med.id} className="stock-alert-card">
                  <div className="alert-card-left">
                    <h4>{med.name}</h4>
                    <p>Formula: {med.genericName}</p>
                    <span className="location-tag"><MapPin size={11} /> Rack: {med.rackLocation}</span>
                  </div>
                  <div className="alert-card-right">
                    <span className="stock-qty-val red">{med.stock}</span>
                    <span className="sub-label">Min limit: {med.minStockAlert}</span>
                  </div>
                </div>
              ))}
              {lowStockAlerts.length === 0 && (
                <div className="empty-alerts">
                  <Sparkles size={32} className="success-icon" />
                  <p>All product stocks are above minimum thresholds.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="alerts-sub-list">
              {expiryAlerts.map(med => {
                const expDate = new Date(med.expiryDate);
                const daysDiff = Math.ceil((expDate.getTime() - systemDate.getTime()) / (1000 * 3600 * 24));
                const isExpired = daysDiff <= 0;

                return (
                  <div key={med.id} className={`stock-alert-card ${isExpired ? 'expired-alert' : 'expiring-alert'}`}>
                    <div className="alert-card-left">
                      <h4>{med.name}</h4>
                      <p>Batch: {med.batchNumber} | Rack: {med.rackLocation}</p>
                      <span className="location-tag">Expires: {med.expiryDate}</span>
                    </div>
                    <div className="alert-card-right">
                      <span className={`stock-qty-val ${isExpired ? 'red' : 'orange'}`}>
                        {isExpired ? 'EXPIRED' : `${daysDiff}d`}
                      </span>
                      <span className="sub-label">Stock: {med.stock} left</span>
                    </div>
                  </div>
                );
              })}
              {expiryAlerts.length === 0 && (
                <div className="empty-alerts">
                  <Sparkles size={32} className="success-icon" />
                  <p>No products are approaching expiration dates.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .purchases-view {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 24px;
        }

        /* PO Form Card */
        .purchase-form-card {
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 24px;
          box-shadow: var(--shadow-sm);
        }

        .card-header h3 {
          font-size: 16px;
          font-weight: 600;
        }

        .card-header p {
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 16px;
        }

        .form-row-three {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .form-divider {
          border: 0;
          border-top: 1px dashed var(--border);
          margin: 20px 0;
        }

        /* Widget inputs */
        .add-item-widget h4 {
          font-size: 13.5px;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .widget-inputs {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          background-color: var(--background);
          padding: 14px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          margin-bottom: 18px;
        }

        .flex-2 {
          flex: 2;
        }

        .add-widget-btn {
          height: 38px;
          margin-bottom: 2px;
        }

        /* Table PO */
        .po-items-table {
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          overflow: hidden;
          margin-bottom: 18px;
        }

        .po-items-table table {
          box-shadow: none;
        }

        .delete-po-item {
          background: transparent;
          border: none;
          color: var(--danger);
          cursor: pointer;
          opacity: 0.7;
          transition: var(--transition);
        }

        .delete-po-item:hover {
          opacity: 1;
        }

        .po-checkout-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--border);
          padding-top: 16px;
        }

        .total-block span {
          font-size: 12px;
          color: var(--text-muted);
        }

        .total-block h3 {
          font-size: 22px;
          color: var(--primary);
          font-weight: 800;
        }

        /* Alerts Side Panel */
        .purchases-alerts-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .alert-tab-headers {
          display: flex;
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 4px;
          box-shadow: var(--shadow-sm);
        }

        .tab-hdr {
          flex: 1;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-family: var(--font-sans);
          font-size: 12.5px;
          font-weight: 600;
          padding: 10px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: var(--transition);
        }

        .tab-hdr.active {
          background-color: var(--primary-light);
          color: var(--primary);
        }

        .tab-contents {
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 18px;
          box-shadow: var(--shadow-sm);
          flex: 1;
          overflow-y: auto;
          max-height: calc(100vh - 190px);
        }

        .alerts-sub-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .stock-alert-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid var(--border);
          padding: 12px 14px;
          border-radius: var(--radius-xs);
          transition: var(--transition);
        }

        .stock-alert-card:hover {
          background-color: var(--background);
        }

        .alert-card-left h4 {
          font-size: 13.5px;
          font-weight: 600;
        }

        .alert-card-left p {
          font-size: 11px;
          color: var(--text-muted);
        }

        .location-tag {
          font-size: 10.5px;
          color: var(--primary);
          display: flex;
          align-items: center;
          gap: 2px;
          margin-top: 4px;
        }

        .alert-card-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .stock-qty-val {
          font-size: 16px;
          font-weight: 700;
        }

        .stock-qty-val.red { color: var(--danger); }
        .stock-qty-val.orange { color: var(--warning); }

        .sub-label {
          font-size: 10px;
          color: var(--text-muted);
        }

        /* Expiring classes */
        .expired-alert {
          border-left: 4px solid var(--danger);
          background-color: var(--danger-light);
        }

        .expiring-alert {
          border-left: 4px solid var(--warning);
          background-color: var(--warning-light);
        }

        .empty-alerts {
          text-align: center;
          padding: 50px 20px;
          color: var(--text-muted);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
      `}</style>
    </div>
  );
};
