import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Medicine, Category } from '../types/db';
import { Search, Plus, Edit, Trash2, Layers, Filter, ShieldAlert } from 'lucide-react';

export const Inventory: React.FC = () => {
  const { 
    medicines, categories, updateMedicines, updateCategories, currentUser 
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

  // Category CRUD Modal State
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const systemDate = new Date('2026-06-20');

  // Filter medicines
  const filteredMedicines = useMemo(() => {
    return medicines.filter(med => {
      const matchesSearch = 
        med.name.toLowerCase().includes(search.toLowerCase()) ||
        med.genericName.toLowerCase().includes(search.toLowerCase()) ||
        med.barcode.includes(search);
      
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
    // Check if category contains medicines
    const hasMedicines = medicines.some(m => m.categoryId === catId);
    if (hasMedicines) {
      alert('Cannot delete category. There are medicines registered under this category.');
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

  // Roles verification
  const canEdit = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';

  return (
    <div className="inventory-view">
      {/* Search and Action Bar */}
      <div className="control-bar">
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
              <option value="expired">Expired medicines</option>
            </select>
          </div>
        </div>

        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={() => setShowCatModal(true)}>
            <Layers size={16} /> Manage Categories
          </button>
          {canEdit && (
            <button className="btn btn-primary" onClick={openAddMedModal}>
              <Plus size={16} /> Add Product
            </button>
          )}
        </div>
      </div>

      {/* Medicines Data Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Barcode</th>
              <th>Medicine Details</th>
              <th>Category</th>
              <th>Purchase P.</th>
              <th>Retail P.</th>
              <th>Rack</th>
              <th>Stock</th>
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
                    <span className="batch-cell-tag">Batch: {med.batchNumber}</span>
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
                        title="Edit Medicine"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        className="btn-action delete" 
                        onClick={() => handleDeleteMedicine(med.id)}
                        title="Delete Medicine"
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
                <td colSpan={canEdit ? 9 : 8} className="text-center">No medicines match the selected filter.</td>
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

      {/* ================= MODALS ================= */}

      {/* 1. Medicine Entry Form Modal */}
      {showMedModal && (
        <div className="modal-overlay">
          <div className="modal-content med-form-modal">
            <div className="modal-header">
              <h3>{editingMed ? 'Edit Medicine Record' : 'Register New Medicine'}</h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowMedModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveMedicine}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group col-span-2">
                    <label>Medicine Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Panadol 500mg"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group col-span-2">
                    <label>Generic Name / Formula *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Paracetamol"
                      value={genericName}
                      onChange={(e) => setGenericName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Category *</label>
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>SKU / Barcode *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 8964000..."
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
                    <label>Rack Location / Location</label>
                    <input 
                      type="text" 
                      placeholder="e.g. A-12"
                      value={rackLocation}
                      onChange={(e) => setRackLocation(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Batch Number</label>
                    <input 
                      type="text" 
                      placeholder="e.g. BT-921"
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
                    <label>Min Stock Threshold</label>
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
                      disabled={!!editingMed} // Stock updates are recorded via Purchases orders once saved
                    />
                    {editingMed && <span className="helper-text">To update active stock levels, record a new supplier Purchase Order.</span>}
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

      {/* 2. Categories Drawer Modal */}
      {showCatModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3>Manage Medicine Categories</h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowCatModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {/* Category creation inline form */}
              {canEdit && (
                <form onSubmit={handleSaveCategory} className="category-inline-form">
                  <h4>{editingCat ? 'Modify Category' : 'Register New Category'}</h4>
                  <div className="form-group">
                    <label>Category Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Injections" 
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <input 
                      type="text" 
                      placeholder="Usage or description details" 
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                    />
                  </div>
                  <div className="btn-group-row">
                    {editingCat && (
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => {
                          setEditingCat(null);
                          setNewCatName('');
                          setNewCatDesc('');
                        }}
                      >
                        Cancel
                      </button>
                    )}
                    <button type="submit" className="btn btn-primary btn-sm">
                      {editingCat ? 'Save Changes' : 'Create Category'}
                    </button>
                  </div>
                  <hr className="divider-line" />
                </form>
              )}

              {/* Categories list */}
              <div className="categories-list-drawer">
                <h4>Registered Categories</h4>
                <ul className="category-drawer-ul">
                  {categories.map(c => (
                    <li key={c.id} className="category-drawer-li">
                      <div className="cat-meta-drawer">
                        <strong>{c.name}</strong>
                        <p>{c.description || 'No description provided'}</p>
                      </div>
                      {canEdit && (
                        <div className="cat-actions-drawer">
                          <button 
                            className="btn-action edit"
                            onClick={() => {
                              setEditingCat(c);
                              setNewCatName(c.name);
                              setNewCatDesc(c.description);
                            }}
                          >
                            <Edit size={12} />
                          </button>
                          <button 
                            className="btn-action delete"
                            onClick={() => handleDeleteCategory(c.id)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .inventory-view {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .control-bar {
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

        /* Medicine Cells */
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

        /* Pagination */
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

        /* Medicine Modal */
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

        /* Categories Modal */
        .category-inline-form {
          background-color: var(--background);
          padding: 16px;
          border-radius: var(--radius-sm);
          border: 1px dashed var(--border);
          margin-bottom: 20px;
        }

        .category-inline-form h4 {
          margin-bottom: 12px;
          font-size: 14px;
        }

        .btn-group-row {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 10px;
        }

        .divider-line {
          border: 0;
          border-top: 1px solid var(--border);
          margin: 16px 0;
        }

        .categories-list-drawer h4 {
          margin-bottom: 12px;
          font-size: 14px;
        }

        .category-drawer-ul {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 240px;
          overflow-y: auto;
        }

        .category-drawer-li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: var(--radius-xs);
          background-color: var(--surface);
        }

        .cat-meta-drawer strong {
          font-size: 13px;
          color: var(--text);
        }

        .cat-meta-drawer p {
          font-size: 11.5px;
          color: var(--text-muted);
        }

        .cat-actions-drawer {
          display: flex;
          gap: 6px;
        }
      `}</style>
    </div>
  );
};
