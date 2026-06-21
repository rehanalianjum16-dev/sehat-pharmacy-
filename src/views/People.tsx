import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Customer, Supplier } from '../types/db';
import { Search, Plus, Edit, Trash2, Users, Truck, Award, CreditCard } from 'lucide-react';

export const People: React.FC = () => {
  const {
    customers, suppliers, updateCustomers, updateSuppliers, currentUser, users, approveUser, rejectUser
  } = useApp();

  // Active Tab: customers / suppliers / staff
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers' | 'staff'>('customers');
  const [searchQuery, setSearchQuery] = useState('');

  // Customer Modal States
  const [showCustModal, setShowCustModal] = useState(false);
  const [editingCust, setEditingCust] = useState<Customer | null>(null);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddr, setCustAddr] = useState('');
  const [custPoints, setCustPoints] = useState(0);
  const [custPurchases, setCustPurchases] = useState(0);

  // Supplier Modal States
  const [showSuppModal, setShowSuppModal] = useState(false);
  const [editingSupp, setEditingSupp] = useState<Supplier | null>(null);
  const [suppCompany, setSuppCompany] = useState('');
  const [suppContact, setSuppContact] = useState('');
  const [suppPhone, setSuppPhone] = useState('');
  const [suppEmail, setSuppEmail] = useState('');
  const [suppLedger, setSuppLedger] = useState(0);

  // Settle Supplier Balance Modal State
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [activeSettleSupplier, setActiveSettleSupplier] = useState<Supplier | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);

  // Filter lists based on tab and search query
  const filteredCustomers = customers.filter(c => {
    // Hide walk-in customer from editable grid but keep listed
    return c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);
  });

  const filteredSuppliers = suppliers.filter(s => {
    return s.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery);
  });

  const filteredUsers = users.filter(u => {
    return u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.status || 'APPROVED').toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Open Customer Modal
  const openAddCustModal = () => {
    setEditingCust(null);
    setCustName('');
    setCustPhone('');
    setCustAddr('');
    setCustPoints(0);
    setCustPurchases(0);
    setShowCustModal(true);
  };

  const openEditCustModal = (cust: Customer) => {
    setEditingCust(cust);
    setCustName(cust.name);
    setCustPhone(cust.phone);
    setCustAddr(cust.address);
    setCustPoints(cust.loyaltyPoints);
    setCustPurchases(cust.purchaseCount);
    setShowCustModal(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custPhone) return;

    if (editingCust) {
      const updated = customers.map(c => c.id === editingCust.id ? {
        ...c, name: custName, phone: custPhone, address: custAddr, loyaltyPoints: custPoints, purchaseCount: custPurchases
      } : c);
      updateCustomers(updated);
    } else {
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        name: custName,
        phone: custPhone,
        address: custAddr,
        loyaltyPoints: 0,
        purchaseCount: 0
      };
      updateCustomers([...customers, newCust]);
    }
    setShowCustModal(false);
  };

  const handleDeleteCustomer = (id: string) => {
    if (id === 'walk-in') {
      alert('Cannot delete the default Walk-in profile.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this customer profile?')) {
      const updated = customers.filter(c => c.id !== id);
      updateCustomers(updated);
    }
  };

  // Open Supplier Modal
  const openAddSuppModal = () => {
    setEditingSupp(null);
    setSuppCompany('');
    setSuppContact('');
    setSuppPhone('');
    setSuppEmail('');
    setSuppLedger(0);
    setShowSuppModal(true);
  };

  const openEditSuppModal = (supp: Supplier) => {
    setEditingSupp(supp);
    setSuppCompany(supp.companyName);
    setSuppContact(supp.contactPerson);
    setSuppPhone(supp.phone);
    setSuppEmail(supp.email);
    setSuppLedger(supp.ledgerBalance);
    setShowSuppModal(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suppCompany || !suppContact || !suppPhone) return;

    if (editingSupp) {
      const updated = suppliers.map(s => s.id === editingSupp.id ? {
        ...s, companyName: suppCompany, contactPerson: suppContact, phone: suppPhone, email: suppEmail, ledgerBalance: suppLedger
      } : s);
      updateSuppliers(updated);
    } else {
      const newSupp: Supplier = {
        id: `sup-${Date.now()}`,
        companyName: suppCompany,
        contactPerson: suppContact,
        phone: suppPhone,
        email: suppEmail,
        ledgerBalance: suppLedger
      };
      updateSuppliers([...suppliers, newSupp]);
    }
    setShowSuppModal(false);
  };

  const handleDeleteSupplier = (id: string) => {
    if (window.confirm('Are you sure you want to remove this medical distributor?')) {
      const updated = suppliers.filter(s => s.id !== id);
      updateSuppliers(updated);
    }
  };

  // Settle Balance Action
  const openSettleModal = (supp: Supplier) => {
    setActiveSettleSupplier(supp);
    setSettleAmount(supp.ledgerBalance);
    setShowSettleModal(true);
  };

  const handleSettleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSettleSupplier) return;

    const payment = Math.min(settleAmount, activeSettleSupplier.ledgerBalance);
    const updated = suppliers.map(s => {
      if (s.id === activeSettleSupplier.id) {
        return {
          ...s,
          ledgerBalance: Math.max(0, s.ledgerBalance - payment)
        };
      }
      return s;
    });

    updateSuppliers(updated);
    setShowSettleModal(false);
    alert(`Ledger balance adjusted. Settle payment of Rs. ${payment} registered.`);
  };

  const formatPrice = (val: number) => {
    return 'Rs. ' + val.toLocaleString('en-US', { minimumFractionDigits: 2 });
  };

  const canEdit = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';

  return (
    <div className="people-view">
      {/* Navigation Header */}
      <div className="tabs-header">
        <div className="tab-triggers">
          <button
            className={`tab-trg ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => { setActiveTab('customers'); setSearchQuery(''); }}
          >
            <Users size={16} /> Customers Directory
          </button>
          <button
            className={`tab-trg ${activeTab === 'suppliers' ? 'active' : ''}`}
            onClick={() => { setActiveTab('suppliers'); setSearchQuery(''); }}
          >
            <Truck size={16} /> Suppliers / Distributors
          </button>
          {currentUser?.role === 'ADMIN' && (
            <button
              className={`tab-trg ${activeTab === 'staff' ? 'active' : ''}`}
              onClick={() => { setActiveTab('staff'); setSearchQuery(''); }}
            >
              <Users size={16} /> Staff Registrations
            </button>
          )}
        </div>

        <div className="action-row">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'staff' ? 'Staff' : activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {canEdit && activeTab !== 'staff' && (
            <button
              className="btn btn-primary"
              onClick={activeTab === 'customers' ? openAddCustModal : openAddSuppModal}
            >
              <Plus size={16} /> Add {activeTab === 'customers' ? 'Customer' : 'Supplier'}
            </button>
          )}
        </div>
      </div>

      {/* Lists display */}
      {activeTab === 'customers' ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Phone Number</th>
                <th>Address</th>
                <th className="text-center">Purchases Count</th>
                <th className="text-center">Loyalty Points</th>
                {canEdit && <th className="text-center no-print">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(cust => (
                <tr key={cust.id} className={cust.id === 'walk-in' ? 'walk-in-row' : ''}>
                  <td>
                    <strong>{cust.name}</strong>
                    {cust.id === 'walk-in' && <span className="default-tag">Default System Profile</span>}
                  </td>
                  <td>{cust.phone}</td>
                  <td>{cust.address}</td>
                  <td className="text-center font-weight-600">{cust.purchaseCount} visits</td>
                  <td className="text-center">
                    <span className="points-badge">
                      <Award size={13} /> {cust.loyaltyPoints} pts
                    </span>
                  </td>
                  {canEdit && (
                    <td className="text-center no-print">
                      {cust.id !== 'walk-in' ? (
                        <div className="action-cell-btns justify-center">
                          <button className="btn-action edit" onClick={() => openEditCustModal(cust)}>
                            <Edit size={14} />
                          </button>
                          <button className="btn-action delete" onClick={() => handleDeleteCustomer(cust.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted text-xs">System Profile</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'suppliers' ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Contact Representative</th>
                <th>Phone Number</th>
                <th>Email Address</th>
                <th>Pending Ledger Balance</th>
                {canEdit && <th className="text-center no-print">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map(supp => (
                <tr key={supp.id}>
                  <td>
                    <strong>{supp.companyName}</strong>
                  </td>
                  <td>{supp.contactPerson}</td>
                  <td>{supp.phone}</td>
                  <td>{supp.email || 'N/A'}</td>
                  <td>
                    <span className={`ledger-amount-span ${supp.ledgerBalance > 0 ? 'arrears' : ''}`}>
                      {formatPrice(supp.ledgerBalance)}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="text-center no-print">
                      <div className="action-cell-btns justify-center">
                        {supp.ledgerBalance > 0 && (
                          <button
                            className="btn btn-secondary btn-sm settle-balance-btn"
                            onClick={() => openSettleModal(supp)}
                          >
                            <CreditCard size={12} /> Settle Due
                          </button>
                        )}
                        <button className="btn-action edit" onClick={() => openEditSuppModal(supp)}>
                          <Edit size={14} />
                        </button>
                        <button className="btn-action delete" onClick={() => handleDeleteSupplier(supp.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Staff Name</th>
                <th>Email Address</th>
                <th>System Role</th>
                <th>Status</th>
                <th className="text-center no-print">Actions / Role Assignment</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`role-badge role-${u.role.toLowerCase()}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${(u.status || 'APPROVED').toLowerCase()}`} style={{
                      fontWeight: 600,
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      backgroundColor: (u.status || 'APPROVED') === 'APPROVED' ? 'rgba(16,185,129,0.1)' : (u.status || 'APPROVED') === 'PENDING_APPROVAL' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                      color: (u.status || 'APPROVED') === 'APPROVED' ? 'rgb(16,185,129)' : (u.status || 'APPROVED') === 'PENDING_APPROVAL' ? 'rgb(245,158,11)' : 'rgb(239,68,68)'
                    }}>
                      {u.status || 'APPROVED'}
                    </span>
                  </td>
                  <td className="text-center no-print">
                    {u.id === currentUser?.id ? (
                      <span className="text-muted text-xs font-semibold">You (Current Admin Session)</span>
                    ) : (u.status || 'APPROVED') === 'PENDING_APPROVAL' ? (
                      <div className="action-cell-btns justify-center" style={{ gap: '8px', alignItems: 'center' }}>
                        <select 
                          className="role-selector" 
                          defaultValue={u.role}
                          id={`role-select-${u.id}`}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--background)',
                            color: 'var(--text)',
                            fontSize: '12px',
                            height: '28px',
                            outline: 'none'
                          }}
                        >
                          <option value="CASHIER">Cashier</option>
                          <option value="MANAGER">Manager</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <button 
                          className="btn btn-primary btn-sm"
                          style={{ padding: '2px 8px', fontSize: '11px', height: '28px', backgroundColor: 'var(--primary)', color: 'white' }}
                          onClick={() => {
                            const selectEl = document.getElementById(`role-select-${u.id}`) as HTMLSelectElement;
                            const role = selectEl ? selectEl.value : 'CASHIER';
                            approveUser(u.id, role as any);
                            alert(`Approved ${u.name} as ${role}`);
                          }}
                        >
                          Approve
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 8px', fontSize: '11px', height: '28px', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.2)' }}
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to reject ${u.name}'s registration request?`)) {
                              rejectUser(u.id);
                            }
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="action-cell-btns justify-center" style={{ gap: '8px', alignItems: 'center' }}>
                        <select 
                          className="role-selector" 
                          value={u.role}
                          onChange={(e) => {
                            const newRole = e.target.value as any;
                            approveUser(u.id, newRole);
                            alert(`Promoted ${u.name} to ${newRole}`);
                          }}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--background)',
                            color: 'var(--text)',
                            fontSize: '12px',
                            height: '28px',
                            outline: 'none'
                          }}
                        >
                          <option value="CASHIER">Cashier</option>
                          <option value="MANAGER">Manager</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 8px', fontSize: '11px', height: '28px', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.2)' }}
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to revoke access and suspend ${u.name}?`)) {
                              rejectUser(u.id);
                            }
                          }}
                        >
                          Revoke Access
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* 1. Customer Modal */}
      {showCustModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>{editingCust ? 'Edit Customer Details' : 'Register Customer Profile'}</h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowCustModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveCustomer}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. 03001234567"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Residential Address</label>
                  <input
                    type="text"
                    value={custAddr}
                    onChange={(e) => setCustAddr(e.target.value)}
                  />
                </div>

                {editingCust && (
                  <div className="form-row-two">
                    <div className="form-group">
                      <label>Loyalty Points</label>
                      <input
                        type="number"
                        value={custPoints}
                        onChange={(e) => setCustPoints(parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Visits Count</label>
                      <input
                        type="number"
                        value={custPurchases}
                        onChange={(e) => setCustPurchases(parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCustModal(false)}>
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

      {/* 2. Supplier Modal */}
      {showSuppModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>{editingSupp ? 'Edit Supplier Ledger' : 'Add Medical Distributor'}</h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowSuppModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveSupplier}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Company / Distributor Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. GlaxoSmithKline"
                    value={suppCompany}
                    onChange={(e) => setSuppCompany(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Contact Representative Name *</label>
                  <input
                    type="text"
                    value={suppContact}
                    onChange={(e) => setSuppContact(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="text"
                    value={suppPhone}
                    onChange={(e) => setSuppPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={suppEmail}
                    onChange={(e) => setSuppEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Opening Ledger Balance (PKR)</label>
                  <input
                    type="number"
                    value={suppLedger || ''}
                    onChange={(e) => setSuppLedger(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSuppModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Settle Balance Modal */}
      {showSettleModal && activeSettleSupplier && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Settle Ledger Balance</h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowSettleModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSettleSubmit}>
              <div className="modal-body">
                <div className="settle-summary-box">
                  <p>Distributor: <strong>{activeSettleSupplier.companyName}</strong></p>
                  <p>Pending Balance: <strong className="arrears">{formatPrice(activeSettleSupplier.ledgerBalance)}</strong></p>
                </div>

                <div className="form-group">
                  <label>Amount Settle Payment (PKR) *</label>
                  <input
                    type="number"
                    max={activeSettleSupplier.ledgerBalance}
                    min={1}
                    value={settleAmount || ''}
                    onChange={(e) => setSettleAmount(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSettleModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .people-view {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .tabs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 12px 18px;
          box-shadow: var(--shadow-sm);
        }

        .tab-triggers {
          display: flex;
          gap: 6px;
        }

        .tab-trg {
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

        .tab-trg:hover {
          color: var(--primary);
        }

        .tab-trg.active {
          background-color: var(--primary-light);
          color: var(--primary);
        }

        .action-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .action-row .search-box input {
          width: 220px;
        }

        .action-cell-btns.justify-center {
          justify-content: center;
        }

        .points-badge {
          background-color: var(--success-light);
          color: var(--success);
          font-weight: 600;
          font-size: 11px;
          padding: 4px 8px;
          border-radius: var(--radius-full);
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .default-tag {
          font-size: 10px;
          background-color: var(--secondary-light);
          color: var(--secondary);
          padding: 1px 4px;
          border-radius: 4px;
          margin-left: 6px;
          text-transform: uppercase;
          font-weight: 600;
        }

        .walk-in-row {
          background-color: var(--primary-light);
        }

        .ledger-amount-span {
          font-weight: 700;
          color: var(--text);
        }

        .ledger-amount-span.arrears {
          color: var(--danger);
        }

        .settle-balance-btn {
          padding: 4px 8px;
          font-size: 11px;
          height: 28px;
          border-radius: var(--radius-xs);
        }

        .settle-summary-box {
          background-color: var(--background);
          padding: 14px;
          border-radius: var(--radius-xs);
          border: 1px solid var(--border);
          font-size: 13px;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .settle-summary-box strong.arrears {
          color: var(--danger);
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
      `}</style>
    </div>
  );
};
