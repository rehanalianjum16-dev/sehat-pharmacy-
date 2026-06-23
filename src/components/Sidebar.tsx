import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, ShoppingCart, Pill, RefreshCw, Users, 
  FileText, BarChart3, Settings, LogOut, ShieldAlert,
  ChevronDown, ChevronRight
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { 
    currentUser, currentView, setView, logout, 
    viewTab, setViewTab, activeModal, setActiveModal 
  } = useApp();

  const [isHovered, setIsHovered] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    products: false
  });

  if (!currentUser) return null;

  // Collapse sidebar on all views except dashboard (Rule 5)
  const isDashboard = currentView === 'dashboard';
  const isCollapsed = !isDashboard && !isHovered;

  // Auto-expand accordion when navigating to a view
  useEffect(() => {
    if (currentView === 'products') {
      setOpenMenus(prev => ({ ...prev, products: true }));
    }
  }, [currentView]);

  const toggleMenu = (menuId: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  // Navigation schema based on Role-Based Access Control (RBAC) and sub-menus
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER'] },
    { 
      id: 'products', 
      label: 'Product Management', 
      icon: Pill, 
      roles: ['ADMIN', 'MANAGER', 'CASHIER'],
      subItems: [
        { id: 'all-products', label: 'All Products', active: viewTab === 'all' && !activeModal, action: () => { setView('products'); setViewTab('all'); setActiveModal(null); } },
        { id: 'create-product', label: 'Create Product', active: activeModal === 'create-product', action: () => { setView('products'); setViewTab('all'); setActiveModal('create-product'); } },
        { id: 'edit-product', label: 'Update/Edit Product', active: activeModal === 'edit-product-selector', action: () => { setView('products'); setViewTab('all'); setActiveModal('edit-product-selector'); } },
        { id: 'categories', label: 'Category Management', active: viewTab === 'categories', action: () => { setView('products'); setViewTab('categories'); setActiveModal(null); } },
      ]
    },
    { id: 'pos', label: 'POS Billing', icon: ShoppingCart, roles: ['ADMIN', 'CASHIER'] },
    { id: 'inventory', label: 'Inventory & Alerts', icon: ShieldAlert, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { id: 'purchases', label: 'Purchases & Stock', icon: RefreshCw, roles: ['ADMIN', 'MANAGER'] },
    { id: 'people', label: 'People (Supp/Cust)', icon: Users, roles: ['ADMIN', 'MANAGER'] },
    { id: 'invoices', label: 'Invoices Log', icon: FileText, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
    { id: 'settings', label: 'System Settings', icon: Settings, roles: ['ADMIN'] },
  ];

  const allowedNavItems = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <aside 
      className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top spacing representing brand space height (Branding itself is in Topbar) */}
      <div className="sidebar-brand-spacer" />

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <ul>
          {allowedNavItems.map(item => {
            const Icon = item.icon;
            
            if (item.subItems) {
              const isMenuOpen = openMenus[item.id];
              const isSubActive = currentView === item.id;
              
              return (
                <li 
                  key={item.id} 
                  className="nav-item-has-submenu"
                  onMouseEnter={() => {
                    if (!isCollapsed) {
                      setOpenMenus(prev => ({ ...prev, [item.id]: true }));
                    }
                  }}
                  onMouseLeave={() => {
                    if (!isCollapsed) {
                      setOpenMenus(prev => ({ ...prev, [item.id]: false }));
                    }
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (currentView !== item.id) {
                        setView(item.id);
                        setViewTab('all');
                        setActiveModal(null);
                      } else {
                        toggleMenu(item.id);
                      }
                    }}
                    className={`nav-link ${isSubActive ? 'active' : ''}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon size={18} />
                    {!isCollapsed && (
                      <div className="nav-link-text-row">
                        <span>{item.label}</span>
                        {isMenuOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </div>
                    )}
                  </button>

                  {/* Sub-menu items sliding down */}
                  {!isCollapsed && (
                    <ul className={`sub-menu-list ${isMenuOpen ? 'open' : ''}`}>
                      {item.subItems.map(sub => (
                        <li key={sub.id}>
                          <button
                            type="button"
                            onClick={sub.action}
                            className={`sub-nav-link ${isSubActive && sub.active ? 'active' : ''}`}
                          >
                            <span>{sub.label}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }

            // Normal menu items
            const isActive = currentView === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
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

      {/* Sidebar Footer - Logout only (theme toggler moved to Topbar) */}
      <div className="sidebar-footer">
        {/* Short info badge in sidebar */}
        {!isCollapsed && (
          <div className="sidebar-role-indicator">
            <span className="user-role-lbl">{currentUser.name}</span>
            <span className={`role-badge role-${currentUser.role.toLowerCase()}`}>
              {currentUser.role}
            </span>
          </div>
        )}

        <button
          type="button"
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
          padding: 20px 14px;
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          z-index: 1000;
          width: 260px;
          overflow-x: hidden;
          overflow-y: auto;
          box-sizing: border-box;
          transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1), padding 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Collapsed Sidebar overrides */
        .sidebar.collapsed {
          width: 70px;
          padding: 20px 8px;
          align-items: center;
        }

        .sidebar:not(.collapsed) {
          box-shadow: 4px 0 24px rgba(0, 0, 0, 0.04);
        }

        .sidebar-brand-spacer {
          height: 70px; /* aligns with topbar height */
          flex-shrink: 0;
        }

        .sidebar-nav {
          flex: 1;
          width: 100%;
        }

        .sidebar-nav ul {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 4px;
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

        .nav-link-text-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex: 1;
        }

        /* Submenu sliding CSS */
        .sub-menu-list {
          list-style: none;
          padding-left: 32px;
          margin-top: 4px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow: hidden;
          max-height: 0;
          opacity: 0;
          transition: max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sub-menu-list.open {
          max-height: 200px;
          opacity: 1;
        }

        .sub-nav-link {
          width: 100%;
          display: flex;
          align-items: center;
          padding: 8px 12px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-family: var(--font-sans);
          font-size: 12.5px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          text-align: left;
          transition: var(--transition);
        }

        .sub-nav-link:hover {
          color: var(--primary);
          background-color: var(--primary-light);
          padding-left: 16px;
        }

        .sub-nav-link.active {
          color: var(--primary);
          font-weight: 600;
          background-color: var(--primary-light);
        }

        .sidebar-footer {
          border-top: 1px solid var(--border);
          padding-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        .sidebar.collapsed .sidebar-footer {
          align-items: center;
          padding-top: 12px;
        }

        .sidebar-role-indicator {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 8px 12px;
          background-color: var(--background);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
        }

        .user-role-lbl {
          font-size: 12px;
          font-weight: 600;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .role-badge {
          font-size: 8.5px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          width: fit-content;
        }

        .role-admin { background-color: var(--danger-light); color: var(--danger); }
        .role-manager { background-color: var(--warning-light); color: var(--warning); }
        .role-cashier { background-color: var(--secondary-light); color: var(--secondary); }

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
