import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Calendar, Shield, Pill, AlertTriangle } from 'lucide-react';

export const Topbar: React.FC = () => {
  const { currentView, notifications, currentUser, logout, changePassword } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Analytics Dashboard';
      case 'pos': return 'Point of Sale (POS) Billing';
      case 'inventory': return 'Inventory & Product Directory';
      case 'purchases': return 'Purchases & Stock Intake';
      case 'people': return 'Suppliers & Customers Ledger';
      case 'invoices': return 'Invoices & Sales Log';
      case 'reports': return 'Financial Reports';
      case 'settings': return 'System Configurations';
      default: return 'Sehat Pharmacy';
    }
  };

  const systemDateFormatted = new Date('2026-06-20').toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

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
    <header className="topbar no-print">
      <div className="topbar-left">
        <h1 className="view-title">{getViewTitle()}</h1>
      </div>

      <div className="topbar-right">
        {/* System Date Calendar */}
        <div className="system-date">
          <Calendar size={16} className="text-primary" />
          <span>{systemDateFormatted}</span>
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

        {/* User Profile Avatar directly next to notifications (Rule 4) */}
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
          z-index: 9;
        }

        .view-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--text);
          font-family: var(--font-display);
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .system-date {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: var(--background);
          border: 1px solid var(--border);
          padding: 8px 14px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
        }

        .text-primary {
          color: var(--primary);
        }

        .icon-btn {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text);
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
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
          0% {
            box-shadow: 0 0 0 0 rgba(13, 148, 136, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(13, 148, 136, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(13, 148, 136, 0);
          }
        }

        .notification-badge {
          background-color: var(--danger);
          color: white;
          font-size: 10px;
          font-weight: 700;
          width: 18px;
          height: 18px;
          border-radius: var(--radius-full);
          position: absolute;
          top: -4px;
          right: -4px;
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
          top: 50px;
          width: 360px;
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          animation: slideUp 0.2s ease-out;
        }

        .dropdown-header {
          padding: 14px 18px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: var(--surface-header);
        }

        .dropdown-header h3 {
          font-size: 14px;
          font-weight: 600;
        }

        .count-badge {
          background-color: var(--primary-light);
          color: var(--primary);
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: var(--radius-full);
        }

        .dropdown-body {
          max-height: 380px;
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
          padding: 14px 18px;
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
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.4;
        }

        /* Profile Dropdown Menu Styling (Rule 4) */
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
          height: 40px;
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
          font-size: 13px;
          border: 1.5px solid var(--primary);
        }

        .avatar-name {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--text);
        }

        .profile-dropdown {
          position: absolute;
          right: 0;
          top: 50px;
          width: 200px;
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          z-index: 100;
          animation: slideUp 0.2s ease-out;
        }

        .dropdown-profile-header {
          padding: 12px 16px;
          background-color: var(--surface-header);
          border-bottom: 1px solid var(--border);
          display: flex;
          flex-direction: column;
        }

        .dropdown-profile-header strong {
          font-size: 13px;
          color: var(--text);
        }

        .role-tag {
          font-size: 9px;
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
          padding: 10px 16px;
          border: none;
          background: transparent;
          text-align: left;
          font-size: 13px;
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
          padding-top: 12px;
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
      `}</style>
    </header>
  );
};
