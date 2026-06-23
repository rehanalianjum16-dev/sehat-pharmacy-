import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { Medicine, Category } from '../types/db';
import { 
  Search, Plus, Edit, Trash2, Layers, Filter, ShieldAlert, 
  Tag, BarChart3, Package, TrendingUp, AlertTriangle, Archive
} from 'lucide-react';

export const Products: React.FC = () => {
  const { 
    medicines, categories, updateMedicines, updateCategories, currentUser,
    viewTab, setViewTab, activeModal, setActiveModal
  } = useApp();

  // Search & Pagination States
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [alertFilter, setAlertFilter] = useState<'all' | 'low_stock' | 'expiring' | 'expired'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Medicine Edit Modal State
  const [showMedModal, setShowMedModal] = useState(false);
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);
  
  // Medicine Form States
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [barcode, setBarcode] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [retailPrice, setRetailPrice] = useState<number>(0);
  const [rackLocation, setRackLocation] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [minStockAlert, setMinStockAlert] = useState<number>(10);
  const [stock, setStock] = useState<number>(0);

  // Category CRUD inline/modal State
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  // Product Edit Selector Modal State
  const [showEditSelector, setShowEditSelector] = useState(false);
  const [editSelectorSearch, setEditSelectorSearch] = useState('');

  // Quick Stock Audit State
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditingMed, setAuditingMed] = useState<Medicine | null>(null);
  const [auditStock, setAuditStock] = useState<number>(0);
  const [auditReason, setAuditReason] = useState('Physical Count Discrepancy');
  const [auditNotes, setAuditNotes] = useState('');

  // Export Feedback State
  const [exportSuccessMessage, setExportSuccessMessage] = useState('');

  const systemDate = new Date('2026-06-20');

  // Sync with global activeModal and viewTab triggers
  useEffect(() => {
    if (activeModal === 'create-product') {
      openAddMedModal();
      setActiveModal(null); // Reset global trigger
    } else if (activeModal === 'edit-product-selector') {
      setShowEditSelector(true);
      setActiveModal(null); // Reset global trigger
    }
  }, [activeModal]);

  // Filter medicines
  const filteredMedicines = useMemo(() => {
    return medicines.filter(med => {
      const matchesSearch = 
        med.name.toLowerCase().includes(search.toLowerCase()) ||
        med.genericName.toLowerCase().includes(search.toLowerCase()) ||
        med.barcode.includes(search) ||
        (med.rackLocation && med.rackLocation.toLowerCase().includes(search.toLowerCase())) ||
        (med.batchNumber && med.batchNumber.toLowerCase().includes(search.toLowerCase()));
      
      const matchesCategory = catFilter === 'all' || med.categoryId === catFilter;
      
      // Stock & Expiry alert status filters
      const isLowStock = med.stock <= med.minStockAlert;
      const expDate = new Date(med.expiryDate);
      const daysDiff = Math.ceil((expDate.getTime() - systemDate.getTime()) / (1000 * 3600 * 24));
      const isExpired = daysDiff <= 0;
      const isExpiring = daysDiff > 0 && daysDiff <= 90;

      let matchesAlert = true;
      if (alertFilter === 'low_stock') matchesAlert = isLowStock;
      else if (alertFilter === 'expired') matchesAlert = isExpired;
      else if (alertFilter === 'expiring') matchesAlert = isExpiring;

      return matchesSearch && matchesCategory && matchesAlert;
    });
  }, [medicines, search, catFilter, alertFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage);
  const paginatedMedicines = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMedicines.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMedicines, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Export and Audit handlers
  const handleExportCatalog = () => {
    setExportSuccessMessage(`Exported ${medicines.length} products to SEHAT_CATALOG_${new Date().toISOString().slice(0, 10)}.csv successfully!`);
    setTimeout(() => setExportSuccessMessage(''), 5000);
  };

  const openAuditModal = (med: Medicine) => {
    setAuditingMed(med);
    setAuditStock(med.stock);
    setAuditReason('Physical Count Discrepancy');
    setAuditNotes('');
    setShowAuditModal(true);
  };

  const handleSaveAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditingMed) return;

    const updated = medicines.map(m => m.id === auditingMed.id ? {
      ...m, stock: auditStock
    } : m);
    updateMedicines(updated);

    setExportSuccessMessage(`Stock audit logged: "${auditingMed.name}" stock count adjusted to ${auditStock} units.`);
    setTimeout(() => setExportSuccessMessage(''), 5000);
    setShowAuditModal(false);
  };

  const filteredEditSelectorMeds = useMemo(() => {
    return medicines.filter(med => 
      med.name.toLowerCase().includes(editSelectorSearch.toLowerCase()) ||
      med.genericName.toLowerCase().includes(editSelectorSearch.toLowerCase()) ||
      med.barcode.includes(editSelectorSearch)
    );
  }, [medicines, editSelectorSearch]);

  // Open Add Medicine Modal
  const openAddMedModal = () => {
    setEditingMed(null);
    setName('');
    setGenericName('');
    setCategoryId(categories[0]?.id || '');
    setBarcode('');
    setPurchasePrice(0);
    setRetailPrice(0);
    setRackLocation('');
    setBatchNumber('');
    setExpiryDate('');
    setMinStockAlert(10);
    setStock(0);
    setShowMedModal(true);
  };

  // Open Edit Medicine Modal
  const openEditMedModal = (med: Medicine) => {
    setEditingMed(med);
    setName(med.name);
    setGenericName(med.genericName);
    setCategoryId(med.categoryId);
    setBarcode(med.barcode);
    setPurchasePrice(med.purchasePrice);
    setRetailPrice(med.retailPrice);
    setRackLocation(med.rackLocation);
    setBatchNumber(med.batchNumber);
    setExpiryDate(med.expiryDate);
    setMinStockAlert(med.minStockAlert);
    setStock(med.stock);
    setShowMedModal(true);
  };

  // Save/Update Medicine
  const handleSaveMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !barcode || !categoryId || !expiryDate) {
      alert('Please fill out all required fields.');
      return;
    }

    if (editingMed) {
      // Update
      const updated = medicines.map(m => m.id === editingMed.id ? {
        ...m, name, genericName, categoryId, barcode, purchasePrice, retailPrice, rackLocation, batchNumber, expiryDate, minStockAlert, stock
      } : m);
      updateMedicines(updated);
    } else {
      // Create
      const newMed: Medicine = {
        id: `med-${Date.now()}`,
        name, genericName, categoryId, barcode, purchasePrice, retailPrice, rackLocation, batchNumber, expiryDate, minStockAlert, stock
      };
      updateMedicines([...medicines, newMed]);
    }
    setShowMedModal(false);
  };

  // Delete Medicine
  const handleDeleteMedicine = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const updated = medicines.filter(m => m.id !== id);
      updateMedicines(updated);
    }
  };

  // Save Category
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    if (editingCat) {
      const updated = categories.map(c => c.id === editingCat.id ? {
        ...c, name: newCatName, description: newCatDesc
      } : c);
      updateCategories(updated);
      setEditingCat(null);
    } else {
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: newCatName,
        description: newCatDesc,
        createdAt: new Date().toISOString()
      };
      updateCategories([...categories, newCat]);
    }

    setNewCatName('');
    setNewCatDesc('');
  };

  // Delete Category
  const handleDeleteCategory = (catId: string) => {
    const hasMedicines = medicines.some(m => m.categoryId === catId);
    if (hasMedicines) {
      alert('Cannot delete category. There are products registered under this category.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this category?')) {
      const updated = categories.filter(c => c.id !== catId);
      updateCategories(updated);
    }
  };

  const getExpiryBadge = (expStr: string) => {
    const expDate = new Date(expStr);
    const daysDiff = Math.ceil((expDate.getTime() - systemDate.getTime()) / (1000 * 3600 * 24));
    
    if (daysDiff <= 0) return <span className="badge badge-danger">Expired</span>;
    if (daysDiff <= 90) return <span className="badge badge-warning">{daysDiff} days</span>;
    return <span className="badge badge-success">{expStr}</span>;
  };

  const getStockBadge = (stockQty: number, minQty: number) => {
    if (stockQty <= 0) return <span className="badge badge-danger">Out of Stock</span>;
    if (stockQty <= minQty) return <span className="badge badge-warning">Low ({stockQty})</span>;
    return <span className="badge badge-success">{stockQty}</span>;
  };

  const formatPrice = (val: number) => {
    return 'Rs. ' + val.toLocaleString('en-US', { minimumFractionDigits: 2 });
  };

  // Enterprise metrics
  const enterpriseMetrics = useMemo(() => {
    const totalCount = medicines.length;
    const totalStock = medicines.reduce((acc, curr) => acc + curr.stock, 0);
    const totalInventoryValue = medicines.reduce((acc, curr) => acc + (curr.stock * curr.purchasePrice), 0);
    const retailInventoryValue = medicines.reduce((acc, curr) => acc + (curr.stock * curr.retailPrice), 0);
    const potentialProfit = retailInventoryValue - totalInventoryValue;
    const lowStockAlerts = medicines.filter(m => m.stock <= m.minStockAlert).length;
    const expiredCount = medicines.filter(m => {
      const expDate = new Date(m.expiryDate);
      return expDate.getTime() <= systemDate.getTime();
    }).length;

    return {
      totalCount,
      totalStock,
      totalInventoryValue,
      potentialProfit,
      lowStockAlerts,
      expiredCount
    };
  }, [medicines]);

  const avgProfitMargin = useMemo(() => {
    if (medicines.length === 0) return 0;
    let count = 0;
    const totalMargin = medicines.reduce((acc, curr) => {
      const cost = curr.purchasePrice;
      const retail = curr.retailPrice;
      if (cost <= 0) return acc;
      count++;
      return acc + ((retail - cost) / cost) * 100;
    }, 0);
    return count > 0 ? totalMargin / count : 0;
  }, [medicines]);

  const potentialRevenue = useMemo(() => {
    return medicines.reduce((acc, curr) => acc + (curr.stock * curr.retailPrice), 0);
  }, [medicines]);

  const canEdit = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';

  return (
    <div className="products-view">
      
      {/* Export/Audit Alert banner */}
      {exportSuccessMessage && (
        <div className="alert-banner animate-fade-in" style={{ marginBottom: '16px' }}>
          <span>{exportSuccessMessage}</span>
        </div>
      )}

      {/* Tab Navigation header */}
      <div className="products-tabs-row">
        <button 
          className={`tab-btn ${viewTab === 'all' ? 'active' : ''}`}
          onClick={() => setViewTab('all')}
        >
          <Package size={16} />
          <span>All Products</span>
        </button>
        <button 
          className={`tab-btn ${viewTab === 'categories' ? 'active' : ''}`}
          onClick={() => setViewTab('categories')}
        >
          <Layers size={16} />
          <span>Category Management</span>
        </button>
        <button 
          className={`tab-btn ${viewTab === 'tracking' ? 'active' : ''}`}
          onClick={() => setViewTab('tracking')}
        >
          <TrendingUp size={16} />
          <span>Enterprise Tracking</span>
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}
      {viewTab === 'all' && (
        <div className="tab-panel animate-fade-in">
          {/* Search and Action Bar */}
          <div className="control-bar-products">
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search by name, chemical formula, barcode..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <div className="filter-group">
              <div className="select-wrapper">
                <Filter size={14} className="select-icon" />
                <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setCurrentPage(1); }}>
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="select-wrapper">
                <ShieldAlert size={14} className="select-icon" />
                <select value={alertFilter} onChange={(e) => { setAlertFilter(e.target.value as any); setCurrentPage(1); }}>
                  <option value="all">No Status Filters</option>
                  <option value="low_stock">Low Stock Alerts</option>
                  <option value="expiring">Expiring Soon (&lt;90 days)</option>
                  <option value="expired">Expired Products</option>
                </select>
              </div>
            </div>

            <div className="action-buttons">
              {canEdit && (
                <button className="btn btn-primary" onClick={openAddMedModal}>
                  <Plus size={16} /> Create Product
                </button>
              )}
              <button className="btn btn-secondary" onClick={handleExportCatalog}>
                Export CSV
              </button>
            </div>
          </div>

          {/* Medicines Data Table */}
          <div className="table-container shadow-premium">
            <table>
              <thead>
                <tr>
                  <th>Barcode</th>
                  <th>Product Details</th>
                  <th>Category</th>
                  <th>Purchase P.</th>
                  <th>Retail P.</th>
                  <th>Rack</th>
                  <th>Stock Status</th>
                  <th>Expiry</th>
                  {canEdit && <th className="no-print">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {paginatedMedicines.map(med => (
                  <tr key={med.id}>
                    <td>
                      <span className="barcode-tag">{med.barcode}</span>
                    </td>
                    <td>
                      <div className="med-title-cell">
                        <strong>{med.name}</strong>
                        <span className="generic-cell-formula">{med.genericName}</span>
                        <span className="batch-cell-tag">Batch: {med.batchNumber || 'N/A'}</span>
                      </div>
                    </td>
                    <td>{med.categoryName}</td>
                    <td>{formatPrice(med.purchasePrice)}</td>
                    <td className="font-weight-600">{formatPrice(med.retailPrice)}</td>
                    <td>
                      <span className="rack-badge">{med.rackLocation || 'N/A'}</span>
                    </td>
                    <td>{getStockBadge(med.stock, med.minStockAlert)}</td>
                    <td>{getExpiryBadge(med.expiryDate)}</td>
                    {canEdit && (
                      <td className="no-print">
                        <div className="action-cell-btns">
                          <button 
                            className="btn-action edit" 
                            onClick={() => openEditMedModal(med)}
                            title="Edit Product"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            className="btn-action audit-btn" 
                            onClick={() => openAuditModal(med)}
                            title="Quick Stock Audit"
                          >
                            <Plus size={14} />
                          </button>
                          <button 
                            className="btn-action delete" 
                            onClick={() => handleDeleteMedicine(med.id)}
                            title="Delete Product"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredMedicines.length === 0 && (
                  <tr>
                    <td colSpan={canEdit ? 9 : 8} className="text-center">No products match the criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Prev
              </button>
              
              <div className="page-nums">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button 
                    key={idx}
                    className={currentPage === idx + 1 ? 'active' : ''}
                    onClick={() => handlePageChange(idx + 1)}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <button 
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {viewTab === 'categories' && (
        <div className="tab-panel animate-fade-in">
          <div className="category-layout-grid">
            
            {/* Left side: Category Management Form */}
            {canEdit && (
              <div className="category-card-panel shadow-premium">
                <h3>{editingCat ? 'Modify Category' : 'Create New Category'}</h3>
                <p className="panel-desc">Register unique category nodes to classify pharmaceutical entities.</p>
                
                <form onSubmit={handleSaveCategory} className="category-form-element">
                  <div className="form-group">
                    <label>Category Title *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Antibiotics" 
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Description / Usage details</label>
                    <textarea 
                      rows={4}
                      placeholder="Specify therapeutic classification or shelf conditions..." 
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                    />
                  </div>
                  <div className="btn-group-row-end">
                    {editingCat && (
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={() => {
                          setEditingCat(null);
                          setNewCatName('');
                          setNewCatDesc('');
                        }}
                      >
                        Cancel
                      </button>
                    )}
                    <button type="submit" className="btn btn-primary">
                      {editingCat ? 'Save Changes' : 'Create Category'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Right side: Categories Directory */}
            <div className="category-card-panel shadow-premium">
              <h3>Registered Product Categories</h3>
              <p className="panel-desc">List of classification categories currently configured in Sehat Pharmacy.</p>

              <div className="categories-directory-list">
                {categories.map(c => {
                  const productCount = medicines.filter(m => m.categoryId === c.id).length;
                  return (
                    <div key={c.id} className="category-item-row">
                      <div className="category-item-meta">
                        <div className="title-row-item">
                          <h4>{c.name}</h4>
                          <span className="prod-count-badge">{productCount} items</span>
                        </div>
                        <p>{c.description || 'No description provided'}</p>
                      </div>
                      {canEdit && (
                        <div className="category-item-actions">
                          <button 
                            className="btn-action edit"
                            onClick={() => {
                              setEditingCat(c);
                              setNewCatName(c.name);
                              setNewCatDesc(c.description);
                            }}
                            title="Edit Category"
                          >
                            <Edit size={12} />
                          </button>
                          <button 
                            className="btn-action delete"
                            onClick={() => handleDeleteCategory(c.id)}
                            title="Delete Category"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewTab === 'tracking' && (
        <div className="tab-panel animate-fade-in">
          {/* Dashboard KPI cards */}
          <div className="enterprise-stats-grid">
            <div className="stats-kpi-card shadow-premium">
              <div className="icon-wrap-stats bg-primary-light">
                <Package className="color-primary" size={20} />
              </div>
              <div className="meta-stats">
                <span>Total Active Catalog</span>
                <h3>{enterpriseMetrics.totalCount} Products</h3>
              </div>
            </div>

            <div className="stats-kpi-card shadow-premium">
              <div className="icon-wrap-stats bg-success-light">
                <TrendingUp className="color-success" size={20} />
              </div>
              <div className="meta-stats">
                <span>Stock Assets Cost</span>
                <h3>{formatPrice(enterpriseMetrics.totalInventoryValue)}</h3>
              </div>
            </div>

            <div className="stats-kpi-card shadow-premium">
              <div className="icon-wrap-stats bg-primary-light">
                <TrendingUp className="color-primary" size={20} />
              </div>
              <div className="meta-stats">
                <span>Potential Revenue</span>
                <h3>{formatPrice(potentialRevenue)}</h3>
              </div>
            </div>

            <div className="stats-kpi-card shadow-premium">
              <div className="icon-wrap-stats bg-success-light">
                <TrendingUp className="color-success" size={20} />
              </div>
              <div className="meta-stats">
                <span>Avg Markup Margin</span>
                <h3>{avgProfitMargin.toFixed(1)}%</h3>
              </div>
            </div>

            <div className="stats-kpi-card shadow-premium">
              <div className="icon-wrap-stats bg-warning-light">
                <AlertTriangle className="color-warning" size={20} />
              </div>
              <div className="meta-stats">
                <span>Low Stock Warns</span>
                <h3>{enterpriseMetrics.lowStockAlerts} items</h3>
              </div>
            </div>

            <div className="stats-kpi-card shadow-premium">
              <div className="icon-wrap-stats bg-danger-light">
                <Archive className="color-danger" size={20} />
              </div>
              <div className="meta-stats">
                <span>Expired batches</span>
                <h3>{enterpriseMetrics.expiredCount} items</h3>
              </div>
            </div>
          </div>

          {/* Low Stock Reorder details */}
          <div className="reorder-analysis-card shadow-premium">
            <div className="card-header-inner-section">
              <h3>Inventory Replenishment Analysis</h3>
              <p>Below are products requiring immediate procurement. Reorder thresholds are evaluated based on batch levels.</p>
            </div>
            <div className="procurement-table-wrapper">
              <table className="procurement-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Current Stock</th>
                    <th>Minimum Threshold</th>
                    <th>Suggested Reorder</th>
                    <th>Value Estimation</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.filter(m => m.stock <= m.minStockAlert).map(m => {
                    const suggested = Math.max(50, m.minStockAlert * 3 - m.stock);
                    const cost = suggested * m.purchasePrice;
                    return (
                      <tr key={m.id}>
                        <td>
                          <strong>{m.name}</strong>
                          <span className="generic-cell-formula">{m.genericName}</span>
                        </td>
                        <td className="color-danger font-weight-600">{m.stock} units</td>
                        <td>{m.minStockAlert} units</td>
                        <td className="color-primary font-weight-600">+{suggested} units</td>
                        <td>{formatPrice(cost)}</td>
                      </tr>
                    );
                  })}
                  {medicines.filter(m => m.stock <= m.minStockAlert).length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted">All active inventory is stocked above alert thresholds.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADD/EDIT PRODUCT MODAL ================= */}
      {showMedModal && (
        <div className="modal-overlay">
          <div className="modal-content med-form-modal shadow-premium">
            <div className="modal-header">
              <h3>{editingMed ? 'Edit Product Record' : 'Register Enterprise Product'}</h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowMedModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveMedicine}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group col-span-2">
                    <label>Product / Medicine Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Amoxil 250mg"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group col-span-2">
                    <label>Generic Formula *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Amoxicillin Trihydrate"
                      value={genericName}
                      onChange={(e) => setGenericName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Classification Category *</label>
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>SKU / Barcode ID *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 89012345..."
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Purchase Price (Rs.) *</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      value={purchasePrice || ''}
                      onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Retail Price (Rs.) *</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      value={retailPrice || ''}
                      onChange={(e) => setRetailPrice(parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Rack Location</label>
                    <input 
                      type="text" 
                      placeholder="e.g. B-04"
                      value={rackLocation}
                      onChange={(e) => setRackLocation(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Batch Code / ID</label>
                    <input 
                      type="text" 
                      placeholder="e.g. BC-103"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Expiry Date *</label>
                    <input 
                      type="date" 
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Min Stock Alert Level</label>
                    <input 
                      type="number" 
                      min="0"
                      value={minStockAlert || ''}
                      onChange={(e) => setMinStockAlert(parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="form-group col-span-2">
                    <label>Opening Stock Quantity</label>
                    <input 
                      type="number" 
                      min="0"
                      value={stock || ''}
                      onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                      disabled={!!editingMed} 
                    />
                    {editingMed && <span className="helper-text">Product stock updates must be logged via Purchase Orders.</span>}
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMedModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT PRODUCT SELECTOR MODAL ================= */}
      {showEditSelector && (
        <div className="modal-overlay">
          <div className="modal-content shadow-premium" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Select Product to Edit/Update</h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowEditSelector(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="search-box" style={{ marginBottom: '16px' }}>
                <Search size={18} className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search products by name, formula, SKU..."
                  value={editSelectorSearch}
                  onChange={(e) => setEditSelectorSearch(e.target.value)}
                  style={{ paddingLeft: '38px' }}
                />
              </div>
              <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto', marginBottom: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Barcode</th>
                      <th>Stock</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEditSelectorMeds.map(med => (
                      <tr key={med.id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong>{med.name}</strong>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{med.genericName}</span>
                          </div>
                        </td>
                        <td><span className="barcode-tag">{med.barcode}</span></td>
                        <td>{med.stock}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => {
                              openEditMedModal(med);
                              setShowEditSelector(false);
                            }}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredEditSelectorMeds.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center">No products found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditSelector(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= QUICK STOCK AUDIT MODAL ================= */}
      {showAuditModal && auditingMed && (
        <div className="modal-overlay">
          <div className="modal-content shadow-premium" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>Quick Stock Audit</h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowAuditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveAudit}>
              <div className="modal-body">
                <div style={{ marginBottom: '16px', background: 'var(--primary-light)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: 0, color: 'var(--primary)', fontSize: '14px' }}>{auditingMed.name}</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{auditingMed.genericName}</p>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Current Stock: <strong>{auditingMed.stock} units</strong></label>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>New Audited Stock Count *</label>
                  <input 
                    type="number" 
                    min="0"
                    value={auditStock}
                    onChange={(e) => setAuditStock(parseInt(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Audit/Adjustment Reason *</label>
                  <select value={auditReason} onChange={(e) => setAuditReason(e.target.value)} required>
                    <option value="Physical Count Discrepancy">Physical Count Discrepancy</option>
                    <option value="Damaged / Spoiled Stock">Damaged / Spoiled Stock</option>
                    <option value="Expiry Disposal">Expiry Disposal</option>
                    <option value="Data Entry Correction">Data Entry Correction</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Audit Notes / Remarks</label>
                  <textarea 
                    rows={3}
                    placeholder="Enter details about this stock audit..."
                    value={auditNotes}
                    onChange={(e) => setAuditNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAuditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .products-view {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Tabs Styling */
        .products-tabs-row {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 1px;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: 1px solid transparent;
          border-bottom: none;
          background: transparent;
          color: var(--text-muted);
          font-family: var(--font-sans);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border-top-left-radius: var(--radius-sm);
          border-top-right-radius: var(--radius-sm);
          transition: var(--transition);
          margin-bottom: -1px;
        }

        .tab-btn:hover {
          color: var(--primary);
          background-color: var(--primary-light);
        }

        .tab-btn.active {
          color: var(--primary);
          background-color: var(--surface);
          border-color: var(--border);
          font-weight: 600;
        }

        .tab-panel {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .control-bar-products {
          display: flex;
          align-items: center;
          gap: 16px;
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 16px;
          box-shadow: var(--shadow-sm);
        }

        .search-box {
          position: relative;
          flex: 1;
        }

        .search-box input {
          padding-left: 38px;
        }

        .search-box .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .filter-group {
          display: flex;
          gap: 12px;
        }

        .select-wrapper {
          position: relative;
        }

        .select-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--primary);
        }

        .select-wrapper select {
          padding-left: 34px;
          width: 180px;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .med-title-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .generic-cell-formula {
          font-size: 11px;
          color: var(--text-muted);
          font-style: italic;
        }

        .batch-cell-tag {
          font-size: 10px;
          font-family: monospace;
          background-color: var(--background);
          width: fit-content;
          padding: 1px 4px;
          border-radius: 4px;
          color: var(--text-muted);
          border: 1px solid var(--border);
        }

        .barcode-tag {
          font-family: monospace;
          font-size: 11px;
          color: var(--text-muted);
          background-color: var(--surface-header);
          padding: 4px 8px;
          border-radius: var(--radius-xs);
          border: 1px solid var(--border);
        }

        .rack-badge {
          background-color: var(--primary-light);
          color: var(--primary);
          font-weight: 600;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .action-cell-btns {
          display: flex;
          gap: 6px;
        }

        .btn-action {
          width: 28px;
          height: 28px;
          border-radius: var(--radius-xs);
          border: 1px solid var(--border);
          background-color: var(--surface);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition);
        }

        .btn-action.edit { color: var(--secondary); }
        .btn-action.edit:hover { background-color: var(--secondary-light); border-color: var(--secondary); }

        .btn-action.delete { color: var(--danger); }
        .btn-action.delete:hover { background-color: var(--danger-light); border-color: var(--danger); }

        .pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 12px 24px;
          box-shadow: var(--shadow-sm);
        }

        .pagination button {
          border: 1px solid var(--border);
          background-color: var(--surface);
          color: var(--text);
          padding: 6px 14px;
          border-radius: var(--radius-xs);
          font-size: 13px;
          cursor: pointer;
          transition: var(--transition);
        }

        .pagination button:hover:not(:disabled) {
          border-color: var(--primary);
          color: var(--primary);
        }

        .pagination button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .page-nums {
          display: flex;
          gap: 6px;
        }

        .page-nums button {
          padding: 6px 10px;
        }

        .page-nums button.active {
          background-color: var(--primary);
          color: var(--text-inverse);
          border-color: var(--primary);
        }

        /* Category Layout */
        .category-layout-grid {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 24px;
          align-items: start;
        }

        .category-card-panel {
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 24px;
        }

        .category-card-panel h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .panel-desc {
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 20px;
        }

        .category-form-element {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .btn-group-row-end {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 10px;
        }

        .categories-directory-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 480px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .category-item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background-color: var(--background);
        }

        .category-item-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .title-row-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .title-row-item h4 {
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
        }

        .prod-count-badge {
          font-size: 10px;
          background-color: var(--primary-light);
          color: var(--primary);
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-weight: 700;
        }

        .category-item-meta p {
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.4;
          max-width: 90%;
        }

        .category-item-actions {
          display: flex;
          gap: 8px;
        }

        /* Enterprise Tracking KPI Grid */
        .enterprise-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
        }

        .alert-banner {
          background-color: var(--success-light);
          color: var(--success);
          border: 1px solid rgba(22, 163, 74, 0.15);
          padding: 12px 18px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: var(--shadow-sm);
        }

        .btn-action.audit-btn {
          color: var(--success);
        }

        .btn-action.audit-btn:hover {
          background-color: var(--success-light);
          border-color: var(--success);
        }

        .stats-kpi-card {
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .icon-wrap-stats {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .meta-stats {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .meta-stats span {
          font-size: 11.5px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .meta-stats h3 {
          font-size: 18px;
          font-weight: 700;
          color: var(--text);
        }

        .bg-primary-light { background-color: var(--primary-light); }
        .bg-success-light { background-color: var(--success-light); }
        .bg-warning-light { background-color: var(--warning-light); }
        .bg-danger-light { background-color: var(--danger-light); }

        .color-primary { color: var(--primary); }
        .color-success { color: var(--success); }
        .color-warning { color: var(--warning); }
        .color-danger { color: var(--danger); }

        .reorder-analysis-card {
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 24px;
        }

        .card-header-inner-section {
          margin-bottom: 20px;
        }

        .card-header-inner-section h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .card-header-inner-section p {
          font-size: 12.5px;
          color: var(--text-muted);
        }

        .procurement-table-wrapper {
          overflow-x: auto;
        }

        .procurement-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .procurement-table th,
        .procurement-table td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          font-size: 13.5px;
        }

        .procurement-table th {
          font-weight: 600;
          color: var(--text-muted);
          background-color: var(--surface-header);
        }

        .procurement-table tr:hover td {
          background-color: var(--background);
        }

        /* Modal Layout */
        .med-form-modal {
          max-width: 650px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .col-span-2 {
          grid-column: 1 / -1;
        }

        .helper-text {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 4px;
          display: block;
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
      `}</style>
    </div>
  );
};
