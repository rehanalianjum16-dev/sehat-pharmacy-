import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldAlert, AlertTriangle, Calendar, Layers, Search, 
  ArrowUpRight, RefreshCw, Archive, MapPin 
} from 'lucide-react';

export const Inventory: React.FC = () => {
  const { medicines, categories, setView, setViewTab } = useApp();
  const [search, setSearch] = useState('');

  const systemDate = new Date('2026-06-20');

  // Filtered Stock Alerts
  const lowStockItems = useMemo(() => {
    return medicines.filter(med => {
      const matchesSearch = med.name.toLowerCase().includes(search.toLowerCase()) || 
                            med.genericName.toLowerCase().includes(search.toLowerCase());
      return med.stock <= med.minStockAlert && matchesSearch;
    });
  }, [medicines, search]);

  // Filtered Expiry Risks (Expired or Expiring in 90 days)
  const expiryRiskItems = useMemo(() => {
    return medicines.filter(med => {
      const expDate = new Date(med.expiryDate);
      const daysDiff = Math.ceil((expDate.getTime() - systemDate.getTime()) / (1000 * 3600 * 24));
      
      const matchesSearch = med.name.toLowerCase().includes(search.toLowerCase()) || 
                            med.genericName.toLowerCase().includes(search.toLowerCase());
      
      return (daysDiff <= 90) && matchesSearch;
    }).sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }, [medicines, search]);

  // Category Distribution & Valuation
  const categoryAssets = useMemo(() => {
    return categories.map(cat => {
      const catMeds = medicines.filter(m => m.categoryId === cat.id);
      const uniqueCount = catMeds.length;
      const totalStock = catMeds.reduce((acc, curr) => acc + curr.stock, 0);
      const assetValue = catMeds.reduce((acc, curr) => acc + (curr.stock * curr.purchasePrice), 0);
      return {
        id: cat.id,
        name: cat.name,
        uniqueCount,
        totalStock,
        assetValue
      };
    }).sort((a, b) => b.assetValue - a.assetValue);
  }, [categories, medicines]);

  const formatPrice = (val: number) => {
    return 'Rs. ' + val.toLocaleString('en-US', { minimumFractionDigits: 2 });
  };

  const getDaysDiffLabel = (expiryStr: string) => {
    const expDate = new Date(expiryStr);
    const daysDiff = Math.ceil((expDate.getTime() - systemDate.getTime()) / (1000 * 3600 * 24));
    
    if (daysDiff <= 0) {
      return <span className="label-risk expired">EXPIRED ({expiryStr})</span>;
    } else if (daysDiff <= 30) {
      return <span className="label-risk high-risk">Critical Expiry ({daysDiff} days)</span>;
    } else {
      return <span className="label-risk warning-risk">Expiring soon ({daysDiff} days)</span>;
    }
  };

  const handleNavigateToPurchases = () => {
    setView('purchases');
  };

  const handleNavigateToProducts = () => {
    setView('products');
    setViewTab('all');
  };

  return (
    <div className="inventory-dashboard-view animate-fade-in">
      
      {/* Top Header Card */}
      <div className="inventory-header-panel">
        <div className="header-meta">
          <h2>Inventory Operations & Alerts Dashboard</h2>
          <p>Real-time monitoring of batch thresholds, expiry warnings, and asset allocations.</p>
        </div>

        <div className="search-box-inventory">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search alerts by medicine name or formula..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Primary Analytics Grid */}
      <div className="inventory-analytics-row">
        <div className="analytics-box-small shadow-premium border-left-danger">
          <div className="meta-icon-container bg-danger-light text-danger">
            <ShieldAlert size={20} />
          </div>
          <div className="analytics-value">
            <span>Critical Stock Shortages</span>
            <h3>{medicines.filter(m => m.stock <= 0).length} Items Out of Stock</h3>
          </div>
        </div>

        <div className="analytics-box-small shadow-premium border-left-warning">
          <div className="meta-icon-container bg-warning-light text-warning">
            <AlertTriangle size={20} />
          </div>
          <div className="analytics-value">
            <span>Low Stock Reorders</span>
            <h3>{medicines.filter(m => m.stock > 0 && m.stock <= m.minStockAlert).length} Items Below Threshold</h3>
          </div>
        </div>

        <div className="analytics-box-small shadow-premium border-left-success">
          <div className="meta-icon-container bg-success-light text-success">
            <Calendar size={20} />
          </div>
          <div className="analytics-value">
            <span>Expiry Danger Zone</span>
            <h3>{medicines.filter(m => {
              const exp = new Date(m.expiryDate);
              return exp.getTime() - systemDate.getTime() <= 90 * 24 * 60 * 60 * 1000;
            }).length} Batches Under Risk</h3>
          </div>
        </div>
      </div>

      {/* Main Content split */}
      <div className="inventory-content-split">
        
        {/* Left Side: Stock Alerts Directory */}
        <div className="inventory-card shadow-premium">
          <div className="card-header-action">
            <div className="header-text-block">
              <ShieldAlert className="text-red-icon" size={18} />
              <h3>Stock Threshold Violations</h3>
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleNavigateToPurchases}>
              Record Stock Intake <ArrowUpRight size={14} />
            </button>
          </div>

          <p className="card-description">Products requiring immediate procurement order requests to maintain operations.</p>

          <div className="alerts-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>Shelf Loc.</th>
                  <th>Active Qty</th>
                  <th>Min Alert</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map(med => (
                  <tr key={med.id}>
                    <td>
                      <div className="alert-med-meta">
                        <strong>{med.name}</strong>
                        <span className="generic-subtitle">{med.genericName}</span>
                      </div>
                    </td>
                    <td>
                      <span className="rack-label-tag"><MapPin size={10} /> {med.rackLocation || 'N/A'}</span>
                    </td>
                    <td className={`font-weight-700 ${med.stock === 0 ? 'text-red' : 'text-orange'}`}>
                      {med.stock} units
                    </td>
                    <td>{med.minStockAlert} units</td>
                    <td>
                      {med.stock === 0 ? (
                        <span className="badge badge-danger">OUT OF STOCK</span>
                      ) : (
                        <span className="badge badge-warning">LOW STOCK</span>
                      )}
                    </td>
                  </tr>
                ))}
                {lowStockItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted">No stock alert warnings found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Expiry Risk Warnings */}
        <div className="inventory-card shadow-premium">
          <div className="card-header-action">
            <div className="header-text-block">
              <Calendar className="text-orange-icon" size={18} />
              <h3>Expiry Risk Analysis</h3>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={handleNavigateToProducts}>
              View Product Details
            </button>
          </div>

          <p className="card-description">Batches approaching expiry within 90 days. Plan clearance or record batch disposal.</p>

          <div className="alerts-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product & Batch</th>
                  <th>Shelf Location</th>
                  <th>Stock Qty</th>
                  <th>Status / Expiry</th>
                </tr>
              </thead>
              <tbody>
                {expiryRiskItems.map(med => (
                  <tr key={med.id}>
                    <td>
                      <div className="alert-med-meta">
                        <strong>{med.name}</strong>
                        <span className="generic-subtitle">Batch: {med.batchNumber || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="rack-label-tag"><MapPin size={10} /> {med.rackLocation || 'N/A'}</span>
                    </td>
                    <td>{med.stock} units</td>
                    <td>{getDaysDiffLabel(med.expiryDate)}</td>
                  </tr>
                ))}
                {expiryRiskItems.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-muted">No impending expiry warning risks detected.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Category Asset Valuation Distribution */}
      <div className="inventory-card shadow-premium category-assets-section">
        <div className="card-header-action">
          <div className="header-text-block">
            <Layers className="text-primary-icon" size={18} />
            <h3>Category Assets Valuation Distribution</h3>
          </div>
        </div>
        <p className="card-description">Monetary asset allocation and total stock volumes grouped by therapeutics category nodes.</p>

        <div className="category-valuation-grid">
          {categoryAssets.map(asset => (
            <div key={asset.id} className="category-value-card">
              <div className="value-meta-info">
                <h4>{asset.name}</h4>
                <span className="unique-count-label">{asset.uniqueCount} products</span>
              </div>
              <div className="value-metrics-row">
                <div className="metric-col">
                  <span>Stock Volume</span>
                  <strong>{asset.totalStock.toLocaleString()} units</strong>
                </div>
                <div className="metric-col">
                  <span>Asset Value (Cost)</span>
                  <strong className="text-primary-val">{formatPrice(asset.assetValue)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .inventory-dashboard-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .inventory-header-panel {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 20px 24px;
          gap: 20px;
          box-shadow: var(--shadow-sm);
        }

        .header-meta h2 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .header-meta p {
          font-size: 12.5px;
          color: var(--text-muted);
        }

        .search-box-inventory {
          position: relative;
          width: 350px;
        }

        .search-box-inventory input {
          padding-left: 36px;
          height: 38px;
        }

        .search-box-inventory .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .inventory-analytics-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .analytics-box-small {
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .border-left-danger { border-left: 4px solid var(--danger); }
        .border-left-warning { border-left: 4px solid var(--warning); }
        .border-left-success { border-left: 4px solid var(--success); }

        .meta-icon-container {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .analytics-value {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .analytics-value span {
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .analytics-value h3 {
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
        }

        .inventory-content-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .inventory-card {
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 24px;
          display: flex;
          flex-direction: column;
        }

        .card-header-action {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .header-text-block {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-text-block h3 {
          font-size: 15px;
          font-weight: 600;
          color: var(--text);
        }

        .text-red-icon { color: var(--danger); }
        .text-orange-icon { color: var(--warning); }
        .text-primary-icon { color: var(--primary); }

        .card-description {
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 20px;
        }

        .alerts-table-wrapper {
          overflow-y: auto;
          max-height: 340px;
          padding-right: 4px;
        }

        .alerts-table-wrapper table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .alerts-table-wrapper th,
        .alerts-table-wrapper td {
          padding: 10px 12px;
          border-bottom: 1px solid var(--border);
          font-size: 13px;
        }

        .alerts-table-wrapper th {
          background-color: var(--surface-header);
          color: var(--text-muted);
          font-weight: 600;
          position: sticky;
          top: 0;
          z-index: 2;
        }

        .alert-med-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .generic-subtitle {
          font-size: 11px;
          color: var(--text-muted);
        }

        .rack-label-tag {
          font-size: 11px;
          color: var(--text-muted);
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .text-red { color: var(--danger); }
        .text-orange { color: var(--warning); }

        .label-risk {
          font-size: 10.5px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .label-risk.expired { background-color: var(--danger-light); color: var(--danger); }
        .label-risk.high-risk { background-color: #fee2e2; color: #b91c1c; }
        .label-risk.warning-risk { background-color: #fef3c7; color: #d97706; }

        /* Category Assets Valuation Section */
        .category-assets-section {
          width: 100%;
        }

        .category-valuation-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .category-value-card {
          background-color: var(--background);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: var(--transition);
        }

        .category-value-card:hover {
          transform: translateY(-2px);
          border-color: var(--primary);
        }

        .value-meta-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border);
          padding-bottom: 8px;
        }

        .value-meta-info h4 {
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
        }

        .unique-count-label {
          font-size: 11px;
          color: var(--text-muted);
        }

        .value-metrics-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .metric-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .metric-col span {
          font-size: 10px;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .metric-col strong {
          font-size: 12.5px;
          color: var(--text);
        }

        .text-primary-val {
          color: var(--primary) !important;
          font-weight: 700 !important;
        }

        .shadow-premium {
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--border);
        }

        .animate-fade-in {
          animation: fadeIn 0.25s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 992px) {
          .inventory-analytics-row {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .inventory-content-split {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .category-valuation-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 576px) {
          .category-valuation-grid {
            grid-template-columns: 1fr;
          }
          .inventory-header-panel {
            flex-direction: column;
            align-items: flex-start;
          }
          .search-box-inventory {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
