import React from 'react';
import { useApp } from '../context/AppContext';
import { LocalStorageDB } from '../db/LocalStorageDB';
import {
  TrendingUp, TrendingDown, DollarSign, AlertCircle, Users, ArrowUpRight, ShieldAlert, Calendar
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { setView, notifications } = useApp();

  // Calculate analytics in real-time from database state
  const stats = LocalStorageDB.getDashboardStats();
  const { kpis, charts, recentInvoices } = stats;

  // Format currency in PKR / Rs
  const formatPrice = (val: number) => {
    return 'Rs. ' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Generate SVG Coordinates for Area Chart
  const generateAreaChartPaths = () => {
    const data = charts.salesHistory.data;
    if (data.length === 0) return { path: '', area: '' };

    const width = 500;
    const height = 150;
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const maxVal = Math.max(...data, 1000); // Minimum scale limit

    const points = data.map((val, idx) => {
      const x = padding + (idx / (data.length - 1)) * chartWidth;
      const y = height - padding - (val / maxVal) * chartHeight;
      return { x, y };
    });

    // 1. Draw smooth curve path (cubic bezier)
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 3;
      const cpY1 = curr.y;
      const cpX2 = curr.x + 2 * (next.x - curr.x) / 3;
      const cpY2 = next.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }

    // 2. Draw closed area path for gradient
    const area = `${path} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return { path, area, points, maxVal };
  };

  const chartPaths = generateAreaChartPaths();

  return (
    <div className="dashboard-view">
      {/* 1. KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card sales">
          <div className="kpi-content">
            <span>Total Sales (Revenue)</span>
            <h3>{formatPrice(kpis.totalSales)}</h3>
            <span className="kpi-trend positive">
              <TrendingUp size={14} /> +12.4% vs last month
            </span>
          </div>
          <div className="kpi-icon-box bg-sales">
            <DollarSign size={22} />
          </div>
        </div>

        <div className="kpi-card purchases">
          <div className="kpi-content">
            <span>Total Purchases (Stock Cost)</span>
            <h3>{formatPrice(kpis.totalPurchases)}</h3>
            <span className="kpi-trend neutral">
              <Calendar size={14} /> Invoiced arrivals
            </span>
          </div>
          <div className="kpi-icon-box bg-purchases">
            <TrendingDown size={22} />
          </div>
        </div>

        <div className="kpi-card profit">
          <div className="kpi-content">
            <span>Net Margin / Profit</span>
            <h3>{formatPrice(kpis.monthlyProfit)}</h3>
            <span className="kpi-trend positive">
              <TrendingUp size={14} /> Active margins
            </span>
          </div>
          <div className="kpi-icon-box bg-profit">
            <TrendingUp size={22} />
          </div>
        </div>

        <div
          className={`kpi-card low-stock clickable ${kpis.lowStockCount > 0 ? 'alerting' : ''}`}
          onClick={() => setView('inventory')}
        >
          <div className="kpi-content">
            <span>Low Stock Items</span>
            <h3>{kpis.lowStockCount} Products</h3>
            <span className={`kpi-trend ${kpis.lowStockCount > 0 ? 'negative' : 'positive'}`}>
              <AlertCircle size={14} /> {kpis.lowStockCount > 0 ? 'Requires attention' : 'All stock stable'}
            </span>
          </div>
          <div className={`kpi-icon-box bg-low-stock ${kpis.lowStockCount > 0 ? 'pulse-danger' : ''}`}>
            <ShieldAlert size={22} />
          </div>
        </div>

        <div className="kpi-card customers">
          <div className="kpi-content">
            <span>Loyal Customers</span>
            <h3>{kpis.customersCount} Members</h3>
            <span className="kpi-trend positive">
              <Users size={14} /> Excluding walk-ins
            </span>
          </div>
          <div className="kpi-icon-box bg-customers">
            <Users size={22} />
          </div>
        </div>
      </div>

      {/* 2. Visual Analytics Section */}
      <div className="analytics-section">
        {/* Sales Curve Area Graph */}
        <div className="chart-card sales-history-chart">
          <div className="chart-header">
            <h3>Sales Revenue (Last 7 Days)</h3>
            <span className="chart-subtitle">Direct invoice revenue trends</span>
          </div>
          <div className="chart-body">
            {charts.salesHistory.data.length > 0 && chartPaths.points ? (
              <div className="svg-container">
                <svg viewBox="0 0 500 150" className="area-chart-svg">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines */}
                  <line x1="20" y1="20" x2="480" y2="20" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3" />
                  <line x1="20" y1="75" x2="480" y2="75" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3" />
                  <line x1="20" y1="130" x2="480" y2="130" stroke="var(--border)" strokeWidth="0.5" />

                  {/* Area fill */}
                  <path d={chartPaths.area} fill="url(#chartGradient)" />

                  {/* Curve stroke */}
                  <path d={chartPaths.path} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />

                  {/* Scatter plot points */}
                  {chartPaths.points.map((p, i) => (
                    <g key={i} className="chart-dot-group">
                      <circle cx={p.x} cy={p.y} r="5" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2.5" />
                      <title>{charts.salesHistory.labels[i]}: Rs. {charts.salesHistory.data[i]}</title>
                    </g>
                  ))}
                </svg>
                {/* Custom X Axis labels */}
                <div className="chart-labels-x">
                  {charts.salesHistory.labels.map((lbl, idx) => (
                    <span key={idx}>{lbl}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-chart">No sales records available yet.</div>
            )}
          </div>
        </div>

        {/* Top Selling Medicine Cards */}
        <div className="chart-card top-selling-card">
          <div className="chart-header">
            <h3>Top Selling Medicines</h3>
            <span className="chart-subtitle">By units sold in recent transactions</span>
          </div>
          <div className="chart-body">
            {charts.topSelling.length > 0 ? (
              <div className="top-selling-list">
                {charts.topSelling.map((med, idx) => {
                  const maxQty = charts.topSelling[0].quantity;
                  const percent = maxQty > 0 ? (med.quantity / maxQty) * 100 : 0;
                  const progressColor = `hsl(var(--primary-hue), 80%, ${35 + idx * 6}%)`;

                  return (
                    <div key={idx} className="top-med-row">
                      <div className="med-info">
                        <span className="med-name">{med.name}</span>
                        <span className="med-qty">{med.quantity} sold</span>
                      </div>
                      <div className="progress-bar-container">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${percent}%`, backgroundColor: progressColor }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-chart">Check out sales to list top sellers.</div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Operational Grid */}
      <div className="operational-grid">
        {/* Recent Invoices Table */}
        <div className="op-card recent-invoices">
          <div className="card-header">
            <h3>Recent Transactions</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setView('invoices')}>
              View All Invoices <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="table-container shadow-none">
            <table>
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Customer</th>
                  <th>Total Bill</th>
                  <th>Method</th>
                  <th>Cashier</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map(invoice => (
                  <tr key={invoice.id}>
                    <td>
                      <span className="invoice-num">{invoice.invoiceNumber}</span>
                    </td>
                    <td>{invoice.customerName}</td>
                    <td className="font-weight-600">{formatPrice(invoice.grandTotal)}</td>
                    <td>
                      <span className="badge badge-info">{invoice.paymentMethod}</span>
                    </td>
                    <td>{invoice.cashierName}</td>
                  </tr>
                ))}
                {recentInvoices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center">No invoices recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-time Alerts Panel */}
        <div className="op-card alerts-panel">
          <div className="card-header">
            <h3>Stock & Expiry Alerts</h3>
            {notifications.length > 0 && (
              <span className="badge badge-danger">{notifications.length} Alerts</span>
            )}
          </div>

          <div className="alerts-list">
            {notifications.length === 0 ? (
              <div className="empty-alerts">
                <span className="shield-icon">🛡️</span>
                <p>All stock levels and medicines are secure.</p>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`alert-item alert-${n.type}`}>
                  <div className="alert-content">
                    <h4 className="alert-title">{n.title}</h4>
                    <p className="alert-desc">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* KPIs */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
        }

        .kpi-card {
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: var(--shadow-sm);
          transition: var(--transition);
        }

        .kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .kpi-card.clickable {
          cursor: pointer;
        }

        .kpi-card.clickable.alerting {
          border-color: var(--danger);
          background-color: var(--danger-light);
        }

        .kpi-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .kpi-content span {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .kpi-content h3 {
          font-size: 20px;
          font-family: var(--font-display);
          font-weight: 700;
          color: var(--text);
        }

        .kpi-trend {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .kpi-trend.positive { color: var(--success); }
        .kpi-trend.negative { color: var(--danger); }
        .kpi-trend.neutral { color: var(--text-muted); }

        .kpi-icon-box {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bg-sales { background-color: var(--primary-light); color: var(--primary); }
        .bg-purchases { background-color: var(--secondary-light); color: var(--secondary); }
        .bg-profit { background-color: var(--success-light); color: var(--success); }
        .bg-low-stock { background-color: var(--warning-light); color: var(--warning); }
        .bg-customers { background-color: var(--primary-light); color: var(--primary); }

        .pulse-danger {
          animation: pulseBorder 1.5s infinite;
          background-color: var(--danger-light);
          color: var(--danger);
        }

        @keyframes pulseBorder {
          0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(220, 38, 38, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }

        /* Analytics Section */
        .analytics-section {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 24px;
        }

        .chart-card {
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 24px;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .chart-header {
          display: flex;
          flex-direction: column;
        }

        .chart-header h3 {
          font-size: 16px;
          font-weight: 600;
        }

        .chart-subtitle {
          font-size: 12px;
          color: var(--text-muted);
        }

        .chart-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .svg-container {
          width: 100%;
          position: relative;
        }

        .area-chart-svg {
          width: 100%;
          overflow: visible;
        }

        .chart-labels-x {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px 0 12px;
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .chart-dot-group {
          cursor: pointer;
        }

        .chart-dot-group:hover circle {
          r: 7;
          fill: var(--primary);
        }

        .top-selling-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .top-med-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .med-info {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 500;
        }

        .med-name {
          color: var(--text);
        }

        .med-qty {
          color: var(--text-muted);
          font-weight: 600;
        }

        .progress-bar-container {
          height: 8px;
          background-color: var(--background);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: var(--radius-full);
          transition: width 1s ease-out;
        }

        /* Operational Grid */
        .operational-grid {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 24px;
        }

        .op-card {
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 24px;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-header h3 {
          font-size: 16px;
          font-weight: 600;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
        }

        .invoice-num {
          font-family: monospace;
          font-weight: 600;
          color: var(--primary);
        }

        .font-weight-600 {
          font-weight: 600;
        }

        .shadow-none {
          box-shadow: none;
        }

        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 460px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .alert-item {
          padding: 12px 14px;
          border-radius: var(--radius-sm);
          border-left: 4px solid transparent;
        }

        .alert-low_stock {
          background-color: var(--warning-light);
          border-left-color: var(--warning);
          color: hsl(38, 92%, 25%);
        }

        .alert-expiring {
          background-color: var(--secondary-light);
          border-left-color: var(--secondary);
          color: hsl(215, 85%, 25%);
        }

        .alert-expired {
          background-color: var(--danger-light);
          border-left-color: var(--danger);
          color: hsl(350, 80%, 25%);
        }

        .alert-title {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .alert-desc {
          font-size: 11.5px;
          line-height: 1.3;
          opacity: 0.9;
        }

        .empty-alerts {
          text-align: center;
          padding: 40px 20px;
          color: var(--text-muted);
        }

        .shield-icon {
          font-size: 32px;
          display: block;
          margin-bottom: 10px;
        }

        .empty-alerts p {
          font-size: 13px;
        }

        /* Responsive Layouts */
        @media (max-width: 1200px) {
          .kpi-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .analytics-section, .operational-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};
