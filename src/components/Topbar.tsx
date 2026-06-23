import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bell, Calendar, Shield, Pill, AlertTriangle, 
  Plus, ShoppingCart, UserPlus, FileText, Sun, Moon 
} from 'lucide-react';

export const Topbar: React.FC = () => {
  const { 
    currentView, notifications, currentUser, logout, changePassword, 
    settings, setView, setViewTab, setActiveModal, darkMode, toggleTheme 
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Live Digital Clock state
  const [time, setTime] = useState<Date | null>(null);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const quickCreateRef = useRef<HTMLDivElement>(null);

  // Initialize live ticking clock client-side
  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(target)) {
        setShowProfileDropdown(false);
      }
      if (quickCreateRef.current && !quickCreateRef.current.contains(target)) {
        setShowQuickCreate(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Analytics Dashboard';
      case 'pos': return 'Point of Sale (POS)';
      case 'inventory': return 'Inventory & Alerts';
      case 'products': return 'Product Management';
      case 'purchases': return 'Purchases & Stock';
      case 'people': return 'Suppliers & Customers';
      case 'invoices': return 'Invoices & Sales Log';
      case 'reports': return 'Financial Analytics';
      case 'settings': return 'System Configurations';
      default: return 'Sehat Pharmacy';
    }
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleOpenChangePassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setChangePasswordError('');
    setChangePasswordSuccess(false);
    setShowChangePasswordModal(true);
    setShowProfileDropdown(false);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError('');
    setChangePasswordSuccess(false);

    if (!currentUser) return;

    if (newPassword.length < 8) {
      setChangePasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setChangePasswordError('Passwords do not match.');
      return;
    }

    setChangePasswordLoading(true);

    try {
      const res = await changePassword(currentUser.id, currentPassword, newPassword);
      if (res.success) {
        setChangePasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => {
          setShowChangePasswordModal(false);
        }, 1500);
      } else {
        if (res.error === 'INCORRECT_CURRENT_PASSWORD') {
          setChangePasswordError('Incorrect current password.');
        } else {
          setChangePasswordError('Failed to change password. Please try again.');
        }
      }
    } catch (err: any) {
      setChangePasswordError(err?.message || 'An error occurred.');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  return (
    <header className="topbar no-print shadow-sm">
      
      {/* LEFT SIDE: Branding Logo (strictly out of Sidebar) and Dynamic View Title */}
      <div className="topbar-left">
        {currentUser && (
          <div className="topbar-brand" onClick={() => setView(currentUser.role === 'CASHIER' ? 'pos' : 'dashboard')}>
            <div className="brand-logo-small">
              <span>+</span>
            </div>
            <div className="brand-title-meta">
              <h2>{settings.pharmacyName}</h2>
              <span className="brand-system-tag">Management System</span>
            </div>
          </div>
        )}
        <div className="brand-divider"></div>
        <h1 className="view-title">{getViewTitle()}</h1>
      </div>

      {/* RIGHT SIDE: Quick Create, Clock, Alerts, Theme, and Profile */}
      <div className="topbar-right">
        
        {/* Quick Create Dropdown Menu */}
        {currentUser && currentUser.role !== 'CASHIER' && (
          <div className="quick-create-wrapper" ref={quickCreateRef}>
            <button
              type="button"
              className="btn btn-primary btn-sm quick-create-trigger"
              onClick={() => setShowQuickCreate(!showQuickCreate)}
              title="Quickly create system entities"
            >
              <Plus size={15} />
              <span>Quick Create</span>
            </button>
            {showQuickCreate && (
              <div className="quick-create-dropdown scale-up">
                <div className="dropdown-title">Quick Actions</div>
                <ul className="quick-create-menu">
                  <li>
                    <button onClick={() => { setView('products'); setViewTab('all'); setActiveModal('create-product'); setShowQuickCreate(false); }}>
                      <Pill size={14} className="icon-blue" />
                      <span>Create Product</span>
                    </button>
                  </li>
                  <li>
                    <button onClick={() => { setView('pos'); setShowQuickCreate(false); }}>
                      <ShoppingCart size={14} className="icon-green" />
                      <span>New POS Invoice</span>
                    </button>
                  </li>
                  <li>
                    <button onClick={() => { setView('people'); setActiveModal('add-customer'); setShowQuickCreate(false); }}>
                      <UserPlus size={14} className="icon-orange" />
                      <span>Add Customer</span>
                    </button>
                  </li>
                  <li>
                    <button onClick={() => { setView('people'); setActiveModal('add-supplier'); setShowQuickCreate(false); }}>
                      <UserPlus size={14} className="icon-purple" />
                      <span>Add Supplier</span>
                    </button>
                  </li>
                  <li>
                    <button onClick={() => { setView('purchases'); setActiveModal('create-po'); setShowQuickCreate(false); }}>
                      <FileText size={14} className="icon-indigo" />
                      <span>New Purchase Order</span>
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Live Digital Clock */}
        <div className="system-date-clock shadow-inner">
          <Calendar size={15} className="clock-calendar-icon" />
          <span className="clock-datetime">
            {formatDate(time)} • <strong className="ticking-time">{formatTime(time) || 'Loading...'}</strong>
          </span>
        </div>

        {/* Notifications Icon & Drawer */}
        <div className="notification-wrapper" ref={dropdownRef}>
          <button
            className={`icon-btn notification-trigger ${notifications.length > 0 ? 'pulse' : ''}`}
            onClick={() => setShowNotifications(!showNotifications)}
            title="System Alerts"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="notification-badge">{notifications.length}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="dropdown-header">
                <h3>Notifications & Alerts</h3>
                <span className="count-badge">{notifications.length} Alerts</span>
              </div>

              <div className="dropdown-body">
                {notifications.length === 0 ? (
                  <div className="empty-notifications">
                    <Shield size={24} className="success-icon" />
                    <p>All stock levels & expiry status are healthy!</p>
                  </div>
                ) : (
                  <ul className="notification-list">
                    {notifications.map(n => (
                      <li key={n.id} className={`notification-item type-${n.type}`}>
                        <div className="item-icon">
                          {n.type === 'low_stock' ? <Pill size={16} /> : <AlertTriangle size={16} />}
                        </div>
                        <div className="item-content">
                          <h4 className="item-title">{n.title}</h4>
                          <p className="item-desc">{n.message}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle Button next to profile avatar */}
        <button
          type="button"
          className="icon-btn theme-toggle-topbar"
          onClick={toggleTheme}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <Sun size={18} className="theme-icon-sun" /> : <Moon size={18} className="theme-icon-moon" />}
        </button>

        {/* User Profile Avatar and Dropdown */}
        <div className="profile-wrapper" ref={profileDropdownRef}>
          <button
            className="avatar-trigger-btn"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            title="User Profile Menu"
          >
            <div className="avatar-small">
              {currentUser ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="avatar-name">{currentUser ? currentUser.name : 'User'}</span>
          </button>

          {showProfileDropdown && (
            <div className="profile-dropdown">
              <div className="dropdown-profile-header">
                <strong>{currentUser ? currentUser.name : 'Staff Member'}</strong>
                <span className="role-tag">{currentUser ? currentUser.role : 'CASHIER'}</span>
              </div>
              <ul className="profile-menu-list">
                <li>
                  <button type="button" onClick={handleOpenChangePassword} className="profile-menu-item">
                    Change Password
                  </button>
                </li>
                <li>
                  <button type="button" onClick={logout} className="profile-menu-item logout">
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Change Password</h3>
              <button className="close-btn" onClick={() => setShowChangePasswordModal(false)}>×</button>
            </div>

            <form onSubmit={handleChangePasswordSubmit}>
              <div className="modal-body">
                {changePasswordError && (
                  <div className="alert alert-error" style={{ marginBottom: '14px' }}>
                    <span>{changePasswordError}</span>
                  </div>
                )}
                {changePasswordSuccess && (
                  <div className="alert alert-success" style={{ marginBottom: '14px' }}>
                    <span>Password updated successfully!</span>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Current Password</label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>New Password</label>
                  <input
                    type="password"
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Re-type new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowChangePasswordModal(false)}
                  disabled={changePasswordLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={changePasswordLoading}
                >
                  {changePasswordLoading ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .topbar {
          background-color: var(--surface);
          border-bottom: 1px solid var(--border);
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 24px;
          position: sticky;
          top: 0;
          z-index: 999;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        /* Far-Left Branding Logo in Topbar */
        .topbar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .topbar-brand:hover {
          transform: translateY(-1px);
        }

        .brand-logo-small {
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          color: white;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 20px;
          flex-shrink: 0;
        }

        .brand-title-meta h2 {
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
          line-height: 1.2;
          font-family: var(--font-display);
        }

        .brand-system-tag {
          font-size: 8px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: block;
        }

        .brand-divider {
          width: 1px;
          height: 28px;
          background-color: var(--border);
        }

        .view-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-muted);
          font-family: var(--font-sans);
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        /* Quick Create Dropdown Menu CSS */
        .quick-create-wrapper {
          position: relative;
        }

        .quick-create-trigger {
          height: 38px;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 16px;
          border-radius: var(--radius-full);
          font-weight: 600;
          font-size: 13px;
        }

        .quick-create-dropdown {
          position: absolute;
          right: 0;
          top: 48px;
          width: 220px;
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          padding: 8px 0;
          z-index: 1001;
        }

        .dropdown-title {
          font-size: 11px;
          text-transform: uppercase;
          font-weight: 700;
          color: var(--text-muted);
          padding: 6px 16px;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 4px;
        }

        .quick-create-menu {
          list-style: none;
          display: flex;
          flex-direction: column;
        }

        .quick-create-menu button {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 13px;
          color: var(--text);
          font-family: var(--font-sans);
          transition: var(--transition);
          text-align: left;
        }

        .quick-create-menu button:hover {
          background-color: var(--background);
          color: var(--primary);
        }

        .quick-create-menu button span {
          flex: 1;
        }

        .icon-blue { color: #3b82f6; }
        .icon-green { color: #10b981; }
        .icon-orange { color: #f59e0b; }
        .icon-purple { color: #8b5cf6; }
        .icon-indigo { color: #6366f1; }

        /* Live Digital Clock CSS */
        .system-date-clock {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: var(--background);
          border: 1px solid var(--border);
          padding: 8px 14px;
          border-radius: var(--radius-sm);
          font-size: 12.5px;
          font-weight: 500;
          color: var(--text);
          height: 38px;
          box-sizing: border-box;
        }

        .clock-calendar-icon {
          color: var(--primary);
        }

        .ticking-time {
          color: var(--primary);
          font-family: monospace;
          font-size: 13px;
        }

        .icon-btn {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text);
          width: 38px;
          height: 38px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          transition: var(--transition);
        }

        .icon-btn:hover {
          background-color: var(--background);
          border-color: var(--text-muted);
        }

        .notification-trigger.pulse {
          box-shadow: 0 0 0 0 rgba(13, 148, 136, 0.4);
          animation: pulseShadow 2s infinite;
        }

        @keyframes pulseShadow {
          0% { box-shadow: 0 0 0 0 rgba(13, 148, 136, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(13, 148, 136, 0); }
          100% { box-shadow: 0 0 0 0 rgba(13, 148, 136, 0); }
        }

        .notification-badge {
          background-color: var(--danger);
          color: white;
          font-size: 9px;
          font-weight: 700;
          width: 16px;
          height: 16px;
          border-radius: var(--radius-full);
          position: absolute;
          top: -3px;
          right: -3px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--surface);
        }

        .notification-wrapper {
          position: relative;
        }

        .notification-dropdown {
          position: absolute;
          right: 0;
          top: 48px;
          width: 360px;
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          z-index: 1001;
        }

        .dropdown-header {
          padding: 12px 18px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: var(--surface-header);
        }

        .dropdown-header h3 {
          font-size: 13.5px;
          font-weight: 600;
        }

        .count-badge {
          background-color: var(--primary-light);
          color: var(--primary);
          font-size: 10.5px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: var(--radius-full);
        }

        .dropdown-body {
          max-height: 360px;
          overflow-y: auto;
        }

        .empty-notifications {
          padding: 30px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .success-icon {
          color: var(--success);
        }

        .empty-notifications p {
          font-size: 13px;
          color: var(--text-muted);
        }

        .notification-list {
          list-style: none;
        }

        .notification-item {
          display: flex;
          gap: 12px;
          padding: 12px 18px;
          border-bottom: 1px solid var(--border);
          transition: var(--transition);
        }

        .notification-item:last-child {
          border-bottom: none;
        }

        .notification-item:hover {
          background-color: var(--background);
        }

        .item-icon {
          width: 30px;
          height: 30px;
          border-radius: var(--radius-xs);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .type-low_stock .item-icon {
          background-color: var(--warning-light);
          color: var(--warning);
        }

        .type-expiring .item-icon {
          background-color: var(--secondary-light);
          color: var(--secondary);
        }

        .type-expired .item-icon {
          background-color: var(--danger-light);
          color: var(--danger);
        }

        .item-content {
          flex: 1;
        }

        .item-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 2px;
        }

        .item-desc {
          font-size: 11.5px;
          color: var(--text-muted);
          line-height: 1.4;
        }

        /* Theme Toggle topbar icons */
        .theme-icon-sun { color: var(--warning); }
        .theme-icon-moon { color: var(--primary); }

        /* Profile wrapper */
        .profile-wrapper {
          position: relative;
        }

        .avatar-trigger-btn {
          background: transparent;
          border: 1px solid var(--border);
          padding: 4px 12px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: var(--transition);
          height: 38px;
        }

        .avatar-trigger-btn:hover {
          background-color: var(--background);
          border-color: var(--text-muted);
        }

        .avatar-small {
          background-color: var(--primary-light);
          color: var(--primary);
          width: 28px;
          height: 28px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 12.5px;
          border: 1.5px solid var(--primary);
        }

        .avatar-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
        }

        .profile-dropdown {
          position: absolute;
          right: 0;
          top: 48px;
          width: 180px;
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          z-index: 1001;
        }

        .dropdown-profile-header {
          padding: 10px 14px;
          background-color: var(--surface-header);
          border-bottom: 1px solid var(--border);
          display: flex;
          flex-direction: column;
        }

        .dropdown-profile-header strong {
          font-size: 12.5px;
          color: var(--text);
        }

        .role-tag {
          font-size: 8.5px;
          font-weight: 700;
          color: var(--primary);
          text-transform: uppercase;
          margin-top: 2px;
          letter-spacing: 0.5px;
        }

        .profile-menu-list {
          list-style: none;
          padding: 4px 0;
        }

        .profile-menu-item {
          width: 100%;
          padding: 8px 14px;
          border: none;
          background: transparent;
          text-align: left;
          font-size: 12.5px;
          color: var(--text);
          cursor: pointer;
          transition: var(--transition);
          font-family: var(--font-sans);
        }

        .profile-menu-item:hover {
          background-color: var(--background);
          color: var(--primary);
        }

        .profile-menu-item.logout {
          color: var(--danger);
          border-top: 1px solid var(--border);
          margin-top: 4px;
          padding-top: 10px;
        }

        .profile-menu-item.logout:hover {
          background-color: var(--danger-light);
          color: var(--danger);
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: var(--text-muted);
          line-height: 1;
        }

        /* Scale up animation */
        .scale-up {
          animation: scaleUp 0.15s ease-out;
        }

        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @media (max-width: 992px) {
          .view-title {
            display: none;
          }
          .brand-divider {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .system-date-clock {
            display: none;
          }
          .avatar-name {
            display: none;
          }
        }
      `}</style>
    </header>
  );
};
