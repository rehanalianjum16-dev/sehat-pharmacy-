import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Login } from './views/Login';
import RegisterPage from './app/(auth)/register/page';
import { GoogleConsentPopup } from './views/GoogleConsentPopup';
import { Dashboard } from './views/Dashboard';
import { POS } from './views/POS';
import { Inventory } from './views/Inventory';
import { Products } from './views/Products';
import { Purchases } from './views/Purchases';
import { People } from './views/People';
import { Invoices } from './views/Invoices';
import { Reports } from './views/Reports';
import { Settings } from './views/Settings';

const AppContent: React.FC = () => {
  const { currentUser, currentView } = useApp();

  // Route OAuth popups
  if (window.location.search.includes('oauth=google-consent')) {
    return <GoogleConsentPopup />;
  }

  // If user is not authenticated, check if they are trying to register
  if (currentView === 'register') {
    return <RegisterPage />;
  }

  if (!currentUser || currentView === 'login') {
    return <Login />;
  }

  // Active Main views router
  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'pos':
        return <POS />;
      case 'inventory':
        return <Inventory />;
      case 'products':
        return <Products />;
      case 'purchases':
        return <Purchases />;
      case 'people':
        return <People />;
      case 'invoices':
        return <Invoices />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className={`app-container ${currentView !== 'dashboard' ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main content grid */}
      <div className="main-content">
        {/* Header Topbar */}
        <Topbar />

        {/* Dynamic page content */}
        <main className="content-body">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
