import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, ShoppingCart, Pill, RefreshCw, Users, FileText, BarChart3, Settings, LogOut, Moon, Sun
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const { currentUser, currentView, setView, logout, darkMode, toggleTheme, settings } = useApp();

  if (!currentUser) return null;

  // Collapse sidebar on all views except dashboard (Rule 5)
  const isCollapsed = currentView !== 'dashboard';

  // Navigation schema based on Role-Based Access Control (RBAC)
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER'] },
    { id: 'pos', label: 'POS Billing', icon: ShoppingCart, roles: ['ADMIN', 'CASHIER'] },
    { id: 'inventory', label: 'Inventory', icon: Pill, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { id: 'purchases', label: 'Purchases & Stock', icon: RefreshCw, roles: ['ADMIN', 'MANAGER'] },
    { id: 'people', label: 'People (Supp/Cust)', icon: Users, roles: ['ADMIN', 'MANAGER'] },
    { id: 'invoices', label: 'Invoices Log', icon: FileText, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
    { id: 'settings', label: 'System Settings', icon: Settings, roles: ['ADMIN'] },
  ];

  const allowedNavItems = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo">
          <span>+</span>
        </div>
        {!isCollapsed && (
          <div>
            <h2>{settings.pharmacyName}</h2>
            <span className="system-tag">Management System</span>
          </div>
        )}
      </div>
      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <ul>
          {allowedNavItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setView(item.id)}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon size={18} />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sidebar Footer - Settings and Theme */}
      <div className="sidebar-footer">
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={isCollapsed ? (darkMode ? "Switch to Light Mode" : "Switch to Dark Mode") : "Toggle Dark/Light Mode"}
        >
          {darkMode ? <Sun size={18} className="theme-icon" /> : <Moon size={18} className="theme-icon" />}
          {!isCollapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        <button
          className="logout-btn"
          onClick={logout}
          title={isCollapsed ? "Log Out" : undefined}
        >
          <LogOut size={18} />
          {!isCollapsed && <span>Log Out</span>}
        </button>
      </div>

      <style>{`
        .sidebar {
          background-color: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          height: 100vh;
          padding: 24px 16px;
          position: sticky;
          top: 0;
          z-index: 10;
          width: 260px;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Collapsed Sidebar overrides (Rule 5) */
        .sidebar.collapsed {
          width: 70px;
          padding: 24px 8px;
          align-items: center;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 30px;
          padding: 0 8px;
          transition: var(--transition);
        }

        .sidebar.collapsed .sidebar-brand {
          justify-content: center;
          gap: 0;
          padding: 0;
          margin-bottom: 24px;
        }

        .brand-logo {
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          color: white;
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 24px;
          flex-shrink: 0;
        }

        .sidebar-brand h2 {
          font-size: 16px;
          color: var(--text);
          font-family: var(--font-display);
        }

        .system-tag {
          font-size: 10px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .sidebar-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          background-color: var(--background);
          padding: 12px;
          border-radius: var(--radius-sm);
          margin-bottom: 24px;
          border: 1px solid var(--border);
          transition: var(--transition);
        }

        .sidebar.collapsed .sidebar-profile {
          padding: 8px;
          justify-content: center;
          margin-bottom: 20px;
          width: 100%;
          border: none;
          background: transparent;
        }

        .avatar {
          background-color: var(--primary-light);
          color: var(--primary);
          font-weight: 700;
          font-size: 16px;
          width: 38px;
          height: 38px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--primary);
          flex-shrink: 0;
        }

        .profile-details h4 {
          font-size: 13px;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }

        .role-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .role-admin { background-color: var(--danger-light); color: var(--danger); }
        .role-manager { background-color: var(--warning-light); color: var(--warning); }
        .role-cashier { background-color: var(--secondary-light); color: var(--secondary); }

        .sidebar-nav {
          flex: 1;
          width: 100%;
        }

        .sidebar-nav ul {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .nav-link {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-family: var(--font-sans);
          font-size: 14px;
          font-weight: 500;
          border-radius: var(--radius-sm);
          cursor: pointer;
          text-align: left;
          transition: var(--transition);
        }

        .sidebar.collapsed .nav-link {
          justify-content: center;
          padding: 12px;
          gap: 0;
        }

        .nav-link:hover {
          color: var(--primary);
          background-color: var(--primary-light);
          transform: translateX(4px);
        }

        .sidebar.collapsed .nav-link:hover {
          transform: scale(1.1);
        }

        .nav-link.active {
          color: var(--text-inverse);
          background-color: var(--primary);
          font-weight: 600;
          box-shadow: var(--shadow-glow);
        }

        .sidebar-footer {
          border-top: 1px solid var(--border);
          padding-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
        }

        .sidebar.collapsed .sidebar-footer {
          align-items: center;
          padding-top: 12px;
        }

        .theme-toggle-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border: 1px dashed var(--border);
          border-radius: var(--radius-sm);
          background: transparent;
          color: var(--text);
          font-family: var(--font-sans);
          font-size: 14px;
          cursor: pointer;
          transition: var(--transition);
        }

        .sidebar.collapsed .theme-toggle-btn {
          justify-content: center;
          padding: 10px;
          border: none;
          gap: 0;
        }

        .theme-icon {
          color: var(--primary);
          flex-shrink: 0;
        }

        .logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border: none;
          background: transparent;
          color: var(--danger);
          font-family: var(--font-sans);
          font-size: 14px;
          font-weight: 500;
          border-radius: var(--radius-sm);
          cursor: pointer;
          text-align: left;
          transition: var(--transition);
        }

        .sidebar.collapsed .logout-btn {
          justify-content: center;
          padding: 10px;
          gap: 0;
        }

        .logout-btn:hover {
          background-color: var(--danger-light);
          transform: translateX(4px);
        }

        .sidebar.collapsed .logout-btn:hover {
          transform: scale(1.1);
        }

        /* Dynamically resize container columns when collapsed globally */
        .app-container.sidebar-collapsed {
          grid-template-columns: 70px 1fr !important;
        }
      `}</style>
    </aside>
  );
};
