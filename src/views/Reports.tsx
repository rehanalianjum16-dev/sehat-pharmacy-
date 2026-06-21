import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TrendingUp, TrendingDown, DollarSign, Archive, BarChart3, Printer, Calendar } from 'lucide-react';

export const Reports: React.FC = () => {
  const { sales, medicines, settings } = useApp();

  // Selected report type
  const [reportType, setReportType] = useState<'sales' | 'pl' | 'valuation'>('sales');

  // Date Range state (sales report & P/L report)
  const [startDate, setStartDate] = useState<string>('2026-06-01');
  const [endDate, setEndDate] = useState<string>('2026-06-20');

  // 1. Sales Report calculations
  const salesReportData = useMemo(() => {
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate + 'T23:59:59Z') : new Date();

    const filtered = sales.filter(s => {
      const date = new Date(s.date);
      return date >= start && date <= end;
    });

    const totalRevenue = filtered.reduce((acc, s) => acc + s.grandTotal, 0);
    const totalTransactions = filtered.length;
    const avgTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    
    // Payment mode count
    const paymentBreakdown = filtered.reduce((acc, s) => {
      acc[s.paymentMethod] = (acc[s.paymentMethod] || 0) + s.grandTotal;
      return acc;
    }, {} as Record<string, number>);

    return {
      transactions: filtered,
      totalRevenue,
      totalTransactions,
      avgTicket,
      paymentBreakdown
    };
  }, [sales, startDate, endDate]);

  // 2. Profit & Loss Statement calculations
  const plReportData = useMemo(() => {
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate + 'T23:59:59Z') : new Date();

    const filteredSales = sales.filter(s => {
      const date = new Date(s.date);
      return date >= start && date <= end;
    });

    let grossSales = 0;
    let costOfGoods = 0;
    let totalDiscount = 0;

    filteredSales.forEach(sale => {
      grossSales += sale.subtotal;
      totalDiscount += sale.discountAmount;
      
      sale.items.forEach(item => {
        const med = medicines.find(m => m.id === item.productId);
        const costPrice = med ? med.purchasePrice : item.retailPrice * 0.7; // fallback
        costOfGoods += costPrice * item.quantity;
      });
    });

    const grossProfit = grossSales - costOfGoods;
    const netProfit = grossProfit - totalDiscount;
    const marginPercent = grossSales > 0 ? (netProfit / grossSales) * 100 : 0;

    return {
      grossSales,
      costOfGoods,
      totalDiscount,
      grossProfit,
      netProfit,
      marginPercent
    };
  }, [sales, medicines, startDate, endDate]);

  // 3. Inventory Valuation calculations
  const valuationData = useMemo(() => {
    let totalItems = 0;
    let totalUnits = 0;
    let costValuation = 0;
    let retailValuation = 0;

    const list = medicines.map(med => {
      totalItems += 1;
      totalUnits += med.stock;
      
      const itemCostValue = med.stock * med.purchasePrice;
      const itemRetailValue = med.stock * med.retailPrice;

      costValuation += itemCostValue;
      retailValuation += itemRetailValue;

      return {
        ...med,
        costValue: itemCostValue,
        retailValue: itemRetailValue
      };
    });

    const potentialProfit = retailValuation - costValuation;

    return {
      list,
      totalItems,
      totalUnits,
      costValuation,
      retailValuation,
      potentialProfit
    };
  }, [medicines]);

  const handlePrint = () => {
    window.print();
  };

  const formatPrice = (val: number) => {
    return 'Rs. ' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="reports-view">
      {/* 1. Report Selector Header */}
      <div className="reports-navbar no-print">
        <div className="navbar-tabs">
          <button 
            className={`nav-tab ${reportType === 'sales' ? 'active' : ''}`}
            onClick={() => setReportType('sales')}
          >
            <BarChart3 size={16} /> Sales Performance Report
          </button>
          <button 
            className={`nav-tab ${reportType === 'pl' ? 'active' : ''}`}
            onClick={() => setReportType('pl')}
          >
            <DollarSign size={16} /> Profit & Loss Statement
          </button>
          <button 
            className={`nav-tab ${reportType === 'valuation' ? 'active' : ''}`}
            onClick={() => setReportType('valuation')}
          >
            <Archive size={16} /> Stock Valuation Report
          </button>
        </div>

        <button className="btn btn-secondary" onClick={handlePrint}>
          <Printer size={16} /> Print Report
        </button>
      </div>

      {/* Date filter selector for date-reliant reports */}
      {reportType !== 'valuation' && (
        <div className="date-filter-row no-print">
          <div className="input-group-field">
            <label>Start Date</label>
            <div className="date-input-wrap">
              <Calendar size={14} className="input-icon" />
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
          </div>
          <div className="input-group-field">
            <label>End Date</label>
            <div className="date-input-wrap">
              <Calendar size={14} className="input-icon" />
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* 2. REPORT VIEW CONTAINER (Printable) */}
      <div className="report-print-container">
        
        {/* Print Header */}
        <div className="print-only print-header-block">
          <h2>{settings.pharmacyName}</h2>
          <p>{settings.address} | Tel: {settings.phone}</p>
          <div className="print-divider-line"></div>
        </div>

        {/* ================= A. SALES PERFORMANCE REPORT ================= */}
        {reportType === 'sales' && (
          <div className="report-subview">
            <div className="report-title-section">
              <h3>Sales Performance Report</h3>
              <p className="report-date-tag">
                Period: {startDate || 'All Time'} to {endDate || 'Today'}
              </p>
            </div>

            {/* KPI Cards */}
            <div className="report-kpis">
              <div className="report-kpi-card text-emerald">
                <span>Gross Revenue</span>
                <h4>{formatPrice(salesReportData.totalRevenue)}</h4>
              </div>
              <div className="report-kpi-card">
                <span>Total Transactions</span>
                <h4>{salesReportData.totalTransactions} Invoices</h4>
              </div>
              <div className="report-kpi-card">
                <span>Average Invoice Value</span>
                <h4>{formatPrice(salesReportData.avgTicket)}</h4>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="payment-breakdown-card">
              <h4>Sales by Payment Method</h4>
              <div className="breakdown-pills">
                {Object.entries(salesReportData.paymentBreakdown).map(([mode, amt]) => (
                  <div key={mode} className="breakdown-pill">
                    <span className="pill-name">{mode}</span>
                    <strong className="pill-val">{formatPrice(amt)}</strong>
                  </div>
                ))}
                {Object.keys(salesReportData.paymentBreakdown).length === 0 && (
                  <p className="text-muted text-sm">No payment records in selected date range.</p>
                )}
              </div>
            </div>

            {/* Transactions List */}
            <div className="report-table-section">
              <h4>Transactions Log</h4>
              <div className="table-container shadow-none">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice No</th>
                      <th>Date</th>
                      <th>Customer Name</th>
                      <th>Payment Mode</th>
                      <th>Cashier</th>
                      <th className="text-right">Grand Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesReportData.transactions.map(sale => (
                      <tr key={sale.id}>
                        <td><span className="monospace-text">{sale.invoiceNumber}</span></td>
                        <td>{new Date(sale.date).toLocaleDateString('en-US')}</td>
                        <td>{sale.customerName}</td>
                        <td>{sale.paymentMethod}</td>
                        <td>{sale.cashierName}</td>
                        <td className="text-right font-weight-600">{formatPrice(sale.grandTotal)}</td>
                      </tr>
                    ))}
                    {salesReportData.transactions.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center">No invoices recorded in this range.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= B. PROFIT & LOSS STATEMENT ================= */}
        {reportType === 'pl' && (
          <div className="report-subview">
            <div className="report-title-section">
              <h3>Profit & Loss (P&L) Statement</h3>
              <p className="report-date-tag">
                Statement Date Range: {startDate} to {endDate}
              </p>
            </div>

            {/* Visual Health Indicator */}
            <div className={`pl-health-banner ${plReportData.netProfit >= 0 ? 'profitable' : 'loss'}`}>
              <div className="health-left">
                {plReportData.netProfit >= 0 ? <TrendingUp size={28} /> : <TrendingDown size={28} />}
                <div>
                  <h4>{plReportData.netProfit >= 0 ? 'Operational Net Profit' : 'Operational Net Loss'}</h4>
                  <p>Net profit margin ratio: {plReportData.marginPercent.toFixed(2)}%</p>
                </div>
              </div>
              <h2 className="net-profit-val">{formatPrice(plReportData.netProfit)}</h2>
            </div>

            {/* P/L Breakdown Table */}
            <div className="pl-breakdown-details">
              <h4 className="breakdown-header-title">Accounting Breakdown</h4>
              <div className="pl-lines-container">
                <div className="pl-line">
                  <span>Gross Sales (Retail values before tax & discount)</span>
                  <strong>{formatPrice(plReportData.grossSales)}</strong>
                </div>
                <div className="pl-line indent">
                  <span>(-) Cost of Goods Sold (COGS) (Medicine Purchase Price sum)</span>
                  <span className="text-red font-semibold">({formatPrice(plReportData.costOfGoods)})</span>
                </div>
                <div className="pl-line divider">
                  <span>Gross Operating Profit Margin</span>
                  <strong>{formatPrice(plReportData.grossProfit)}</strong>
                </div>
                <div className="pl-line indent">
                  <span>(-) Store Discounts Allowed (Invoices price deductions)</span>
                  <span className="text-red font-semibold">({formatPrice(plReportData.totalDiscount)})</span>
                </div>
                <div className="pl-line total">
                  <span>Net Operating Profit</span>
                  <span className="color-primary font-bold">{formatPrice(plReportData.netProfit)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= C. STOCK VALUATION REPORT ================= */}
        {reportType === 'valuation' && (
          <div className="report-subview">
            <div className="report-title-section">
              <h3>Stock & Inventory Valuation Report</h3>
              <p className="report-date-tag">
                As of Active System Date: June 20, 2026
              </p>
            </div>

            {/* KPI Cards */}
            <div className="report-kpis">
              <div className="report-kpi-card">
                <span>Unique Stock Items</span>
                <h4>{valuationData.totalItems} Medicines</h4>
              </div>
              <div className="report-kpi-card">
                <span>Total Stock Units</span>
                <h4>{valuationData.totalUnits} Packages</h4>
              </div>
              <div className="report-kpi-card text-blue">
                <span>Inventory Value (Cost)</span>
                <h4>{formatPrice(valuationData.costValuation)}</h4>
              </div>
              <div className="report-kpi-card text-emerald">
                <span>Inventory Value (Retail)</span>
                <h4>{formatPrice(valuationData.retailValuation)}</h4>
              </div>
              <div className="report-kpi-card text-purple">
                <span>Potential Profit (Valuation)</span>
                <h4>{formatPrice(valuationData.potentialProfit)}</h4>
              </div>
            </div>

            {/* Stock Valuation Details Table */}
            <div className="report-table-section">
              <h4>Stock Valuation Audit Sheet</h4>
              <div className="table-container shadow-none">
                <table>
                  <thead>
                    <tr>
                      <th>Barcode</th>
                      <th>Medicine Name</th>
                      <th className="text-center">Stock Level</th>
                      <th className="text-right">Unit Cost</th>
                      <th className="text-right">Valuation (Cost)</th>
                      <th className="text-right">Unit Retail</th>
                      <th className="text-right">Valuation (Retail)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {valuationData.list.map(med => (
                      <tr key={med.id}>
                        <td><span className="monospace-text">{med.barcode}</span></td>
                        <td>
                          <strong>{med.name}</strong>
                          <span className="generic-cell-formula">{med.genericName}</span>
                        </td>
                        <td className="text-center font-weight-600">{med.stock} units</td>
                        <td className="text-right">{formatPrice(med.purchasePrice)}</td>
                        <td className="text-right">{formatPrice(med.costValue)}</td>
                        <td className="text-right">{formatPrice(med.retailPrice)}</td>
                        <td className="text-right font-weight-600 color-primary">{formatPrice(med.retailValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      <style>{`
        .reports-view {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .reports-navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 12px 18px;
          box-shadow: var(--shadow-sm);
        }

        .navbar-tabs {
          display: flex;
          gap: 6px;
        }

        .nav-tab {
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-family: var(--font-sans);
          font-size: 13.5px;
          font-weight: 600;
          padding: 8px 14px;
          border-radius: var(--radius-xs);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: var(--transition);
        }

        .nav-tab:hover {
          color: var(--primary);
        }

        .nav-tab.active {
          background-color: var(--primary-light);
          color: var(--primary);
        }

        .date-filter-row {
          display: flex;
          gap: 16px;
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 16px;
          box-shadow: var(--shadow-sm);
        }

        .input-group-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .date-input-wrap {
          position: relative;
        }

        .date-input-wrap .input-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--primary);
        }

        .date-input-wrap input {
          padding-left: 32px;
          width: 180px;
          font-size: 13px;
        }

        /* Print Container printable styling */
        .report-print-container {
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 28px;
          box-shadow: var(--shadow-sm);
          min-height: 500px;
        }

        .report-title-section {
          margin-bottom: 24px;
          border-bottom: 2px solid var(--border);
          padding-bottom: 12px;
        }

        .report-title-section h3 {
          font-size: 20px;
          color: var(--text);
          font-family: var(--font-display);
        }

        .report-date-tag {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        /* Report KPIs */
        .report-kpis {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .report-kpi-card {
          background-color: var(--background);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .report-kpi-card span {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .report-kpi-card h4 {
          font-size: 18px;
          font-weight: 800;
          font-family: var(--font-display);
          color: var(--text);
        }

        .report-kpi-card.text-emerald h4 { color: var(--success); }
        .report-kpi-card.text-blue h4 { color: var(--secondary); }
        .report-kpi-card.text-purple h4 { color: hsl(270, 70%, 45%); }

        /* Payment breakdown */
        .payment-breakdown-card {
          background-color: var(--background);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 16px;
          margin-bottom: 24px;
        }

        .payment-breakdown-card h4 {
          font-size: 13.5px;
          margin-bottom: 12px;
        }

        .breakdown-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .breakdown-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: var(--surface);
          border: 1px solid var(--border);
          padding: 6px 12px;
          border-radius: var(--radius-xs);
          font-size: 12px;
        }

        .pill-name {
          color: var(--text-muted);
          font-weight: 500;
        }

        .pill-val {
          color: var(--primary);
        }

        /* Report tables and cells */
        .report-table-section h4 {
          font-size: 14px;
          margin-bottom: 10px;
        }

        .monospace-text {
          font-family: monospace;
          font-weight: 600;
        }

        /* Profit / Loss classes */
        .pl-health-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-radius: var(--radius-sm);
          border-left: 5px solid transparent;
          margin-bottom: 28px;
        }

        .pl-health-banner.profitable {
          background-color: var(--success-light);
          border-left-color: var(--success);
          color: hsl(142, 70%, 20%);
        }

        .pl-health-banner.loss {
          background-color: var(--danger-light);
          border-left-color: var(--danger);
          color: hsl(350, 80%, 20%);
        }

        .health-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .health-left h4 {
          font-size: 16px;
          color: inherit;
        }

        .health-left p {
          font-size: 12px;
          opacity: 0.8;
        }

        .net-profit-val {
          font-size: 24px;
          font-weight: 800;
          font-family: var(--font-display);
        }

        /* P/L Breakdown lines */
        .pl-breakdown-details {
          background-color: var(--background);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 20px;
        }

        .breakdown-header-title {
          font-size: 14px;
          margin-bottom: 16px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 8px;
        }

        .pl-lines-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .pl-line {
          display: flex;
          justify-content: space-between;
          font-size: 13.5px;
          color: var(--text);
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.02);
        }

        .pl-line.indent {
          padding-left: 20px;
          font-size: 12.5px;
          color: var(--text-muted);
        }

        .pl-line.divider {
          border-top: 1px solid var(--border);
          padding-top: 10px;
          font-weight: 600;
        }

        .pl-line.total {
          border-top: 2px solid var(--text);
          padding-top: 14px;
          font-weight: 700;
          font-size: 15px;
        }

        .text-red { color: var(--danger); }
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }

        /* Print formatting */
        .print-header-block {
          display: none;
        }

        @media print {
          .report-print-container {
            border: none;
            box-shadow: none;
            padding: 0;
            margin: 0;
            background: white;
            color: black !important;
          }
          .report-print-container * {
            color: black !important;
          }
          .print-header-block {
            display: block;
            text-align: center;
            margin-bottom: 20px;
          }
          .print-divider-line {
            border-bottom: 2px solid black;
            margin: 8px 0;
          }
          .pl-breakdown-details, .pl-health-banner, .report-kpi-card, .payment-breakdown-card {
            background-color: transparent !important;
            border: 1px solid black !important;
            color: black !important;
          }
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
      `}</style>
    </div>
  );
};
