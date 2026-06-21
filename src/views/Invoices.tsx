import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Sale } from '../types/db';
import { Search, Filter, Calendar, Eye, Printer } from 'lucide-react';

export const Invoices: React.FC = () => {
  const { sales, settings } = useApp();

  // Filter States
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [cashierFilter, setCashierFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Details Modal State
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Extract unique cashiers for filter dropdown
  const uniqueCashiers = useMemo(() => {
    const cashiersMap: Record<string, string> = {};
    sales.forEach(s => {
      cashiersMap[s.cashierId] = s.cashierName;
    });
    return Object.entries(cashiersMap);
  }, [sales]);

  // Filter Sales list
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // 1. Search Query (invoice number, customer name, cashier name)
      const matchesSearch =
        sale.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        sale.customerName.toLowerCase().includes(search.toLowerCase());

      // 2. Date Filter
      const matchesDate = !dateFilter || sale.date.startsWith(dateFilter);

      // 3. Cashier Filter
      const matchesCashier = cashierFilter === 'all' || sale.cashierId === cashierFilter;

      // 4. Payment Method Filter
      const matchesPayment = paymentFilter === 'all' || sale.paymentMethod === paymentFilter;

      return matchesSearch && matchesDate && matchesCashier && matchesPayment;
    });
  }, [sales, search, dateFilter, cashierFilter, paymentFilter]);

  const handlePrint = () => {
    window.print();
  };

  const formatPrice = (val: number) => {
    return 'Rs. ' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="invoices-view">
      {/* Filters Bar */}
      <div className="filters-card">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search invoice number, customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filters-grid">
          <div className="input-with-icon-small">
            <Calendar size={14} className="input-icon-small" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              title="Filter by Date"
            />
          </div>

          <div className="select-wrapper">
            <Filter size={13} className="select-icon" />
            <select value={cashierFilter} onChange={(e) => setCashierFilter(e.target.value)}>
              <option value="all">All Cashiers</option>
              {uniqueCashiers.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>

          <div className="select-wrapper">
            <Filter size={13} className="select-icon" />
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
              <option value="all">All Payment Modes</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Digital Wallet">Mobile Wallet</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Date & Time</th>
              <th>Customer</th>
              <th>Payment Mode</th>
              <th>Billed Amount</th>
              <th>Billed By</th>
              <th className="text-center no-print">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map(sale => (
              <tr key={sale.id}>
                <td>
                  <span className="invoice-num-badge">{sale.invoiceNumber}</span>
                </td>
                <td>
                  <div className="date-cell">
                    <span>{new Date(sale.date).toLocaleDateString('en-US')}</span>
                    <span className="time-sub-cell">{new Date(sale.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </td>
                <td>{sale.customerName}</td>
                <td>
                  <span className="badge badge-info">{sale.paymentMethod}</span>
                </td>
                <td className="font-weight-700 color-primary">{formatPrice(sale.grandTotal)}</td>
                <td>{sale.cashierName}</td>
                <td className="text-center no-print">
                  <button
                    className="btn btn-secondary btn-sm table-details-btn"
                    onClick={() => setSelectedSale(sale)}
                  >
                    <Eye size={12} /> View Details & Reprint
                  </button>
                </td>
              </tr>
            ))}
            {filteredSales.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center">No sales invoices match your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= MODALS ================= */}

      {/* Invoicing Receipt Detail Reprint Modal */}
      {selectedSale && (
        <div className="modal-overlay">
          <div className="modal-content invoice-modal">
            <div className="modal-header no-print">
              <h3>Sales Receipt Archive</h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setSelectedSale(null)}>✕</button>
            </div>

            <div className="modal-body invoice-print-area">
              <div className="receipt-container">
                <div className="receipt-header">
                  <h2>{settings.pharmacyName}</h2>
                  <p>{settings.address}</p>
                  <p>Ph: {settings.phone}</p>
                  <div className="receipt-divider"></div>
                </div>

                <div className="receipt-meta">
                  <p><strong>Invoice #:</strong> {selectedSale.invoiceNumber}</p>
                  <p><strong>Date:</strong> {new Date(selectedSale.date).toLocaleString('en-US')}</p>
                  <p><strong>Customer:</strong> {selectedSale.customerName}</p>
                  <p><strong>Cashier:</strong> {selectedSale.cashierName}</p>
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
                    {selectedSale.items.map((item, index) => (
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
                    <span>{selectedSale.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedSale.discountAmount > 0 && (
                    <div className="pricing-row">
                      <span>Discount:</span>
                      <span>-{selectedSale.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pricing-row">
                    <span>Tax ({settings.taxPercentage}%):</span>
                    <span>{selectedSale.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="pricing-row total">
                    <span>Grand Total (PKR):</span>
                    <span>{selectedSale.grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="receipt-divider"></div>

                <div className="receipt-footer">
                  <p>Paid via: <strong>{selectedSale.paymentMethod}</strong></p>
                  {selectedSale.customerId !== 'walk-in' && (
                    <p>Points Earned: +{Math.floor(selectedSale.grandTotal / 100)}</p>
                  )}
                  <br />
                  <p className="footer-msg">{settings.invoiceFooter}</p>
                </div>
              </div>
            </div>

            <div className="modal-footer no-print">
              <button className="btn btn-secondary" onClick={() => setSelectedSale(null)}>
                Close Invoice Viewer
              </button>
              <button className="btn btn-primary" onClick={handlePrint}>
                <Printer size={14} /> Reprint / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .invoices-view {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .filters-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 16px;
          box-shadow: var(--shadow-sm);
        }

        .filters-card .search-box {
          position: relative;
          flex: 1;
        }

        .filters-card .search-box input {
          padding-left: 38px;
        }

        .filters-card .search-box .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .filters-grid {
          display: flex;
          gap: 10px;
        }

        .input-with-icon-small {
          position: relative;
        }

        .input-icon-small {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--primary);
        }

        .input-with-icon-small input {
          padding-left: 30px;
          width: 140px;
          font-size: 13px;
        }

        .select-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--primary);
        }

        .select-wrapper select {
          padding-left: 28px;
          width: 160px;
          font-size: 13px;
        }

        /* Invoice Number cells */
        .invoice-num-badge {
          font-family: monospace;
          font-weight: 700;
          color: var(--primary);
          background-color: var(--primary-light);
          padding: 4px 8px;
          border-radius: var(--radius-xs);
          border: 1px solid rgba(13, 148, 136, 0.2);
        }

        .date-cell {
          display: flex;
          flex-direction: column;
        }

        .time-sub-cell {
          font-size: 11px;
          color: var(--text-muted);
        }

        .color-primary {
          color: var(--primary);
        }

        .table-details-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          font-size: 11.5px;
          height: 28px;
        }

        /* Invoicing layout consistency styles */
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
