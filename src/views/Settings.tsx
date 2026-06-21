import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings as SettingsIcon, ShieldCheck, Database, RefreshCw, Sun, Moon } from 'lucide-react';

export const Settings: React.FC = () => {
  const {
    settings, updateSettings, resetDatabase, darkMode, toggleTheme
  } = useApp();

  // Profile Form states
  const [pharmacyName, setPharmacyName] = useState(settings.pharmacyName);
  const [logoText, setLogoText] = useState(settings.logoText);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [invoiceFooter, setInvoiceFooter] = useState(settings.invoiceFooter);
  const [taxPercentage, setTaxPercentage] = useState(settings.taxPercentage);

  // Payment Toggles states
  const [payCash, setPayCash] = useState(settings.activePaymentMethods.cash);
  const [payCard, setPayCard] = useState(settings.activePaymentMethods.card);
  const [payDigital, setPayDigital] = useState(settings.activePaymentMethods.digitalWallet);
  const [payBank, setPayBank] = useState(settings.activePaymentMethods.bankTransfer);

  // Saving settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedSettings = {
      pharmacyName,
      logoText,
      address,
      phone,
      invoiceFooter,
      taxPercentage,
      activePaymentMethods: {
        cash: payCash,
        card: payCard,
        digitalWallet: payDigital,
        bankTransfer: payBank
      }
    };

    updateSettings(updatedSettings);
    alert('System settings updated successfully.');
  };

  const handleResetDB = () => {
    if (window.confirm('WARNING: This will reset the entire system database and wipe all customized changes, reverting inventory, customers, suppliers, and sales back to factory seed data. Do you wish to proceed?')) {
      resetDatabase();
      alert('System database has been reset to seed defaults.');
      window.location.reload(); // Reload to refresh contexts completely
    }
  };

  return (
    <div className="settings-view">
      <form onSubmit={handleSaveSettings} className="settings-form-layout">

        {/* Left Column: Profile & Payments */}
        <div className="settings-column">
          {/* Pharmacy Profile Card */}
          <div className="settings-card">
            <div className="card-header-iconic">
              <SettingsIcon size={18} className="icon-header" />
              <h3>Pharmacy Profile</h3>
            </div>

            <div className="card-body">
              <div className="form-group">
                <label>Pharmacy Name *</label>
                <input
                  type="text"
                  value={pharmacyName}
                  onChange={(e) => setPharmacyName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row-two">
                <div className="form-group">
                  <label>Logo Abbreviation *</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={logoText}
                    onChange={(e) => setLogoText(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Standard Tax Percentage (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={taxPercentage}
                    onChange={(e) => setTaxPercentage(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Official Address *</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Contact Phone Number *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Invoicing Receipt Footer Message</label>
                <textarea
                  rows={2}
                  value={invoiceFooter}
                  onChange={(e) => setInvoiceFooter(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Payment Methods card */}
          <div className="settings-card">
            <div className="card-header-iconic">
              <ShieldCheck size={18} className="icon-header" />
              <h3>Active Checkout Payments</h3>
            </div>

            <div className="card-body">
              <p className="section-desc-settings">
                Enable or disable payment options appearing inside the POS Billing panel:
              </p>

              <div className="toggle-group-list">
                <label className="toggle-switch-row">
                  <span>Standard Cash Transactions</span>
                  <input
                    type="checkbox"
                    checked={payCash}
                    onChange={(e) => setPayCash(e.target.checked)}
                  />
                </label>

                <label className="toggle-switch-row">
                  <span>Credit / Debit Card Terminal</span>
                  <input
                    type="checkbox"
                    checked={payCard}
                    onChange={(e) => setPayCard(e.target.checked)}
                  />
                </label>

                <label className="toggle-switch-row">
                  <span>Digital Wallets (EasyPaisa / JazzCash)</span>
                  <input
                    type="checkbox"
                    checked={payDigital}
                    onChange={(e) => setPayDigital(e.target.checked)}
                  />
                </label>

                <label className="toggle-switch-row">
                  <span>Direct Bank Wire Transfer</span>
                  <input
                    type="checkbox"
                    checked={payBank}
                    onChange={(e) => setPayBank(e.target.checked)}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Theme & DB resets */}
        <div className="settings-column">

          {/* Theme Setup */}
          <div className="settings-card">
            <div className="card-header-iconic">
              {darkMode ? <Moon size={18} className="icon-header" /> : <Sun size={18} className="icon-header" />}
              <h3>Display Themes</h3>
            </div>
            <div className="card-body theme-body">
              <p className="section-desc-settings">Switch layout display styles:</p>
              <button
                type="button"
                className={`theme-toggle-settings-btn ${darkMode ? 'dark-active' : 'light-active'}`}
                onClick={toggleTheme}
              >
                {darkMode ? <Moon size={16} /> : <Sun size={16} />}
                <span>Active Theme: {darkMode ? 'Dark Mode' : 'Light Mode'}</span>
              </button>
            </div>
          </div>

          {/* Database Control card */}
          <div className="settings-card db-card">
            <div className="card-header-iconic">
              <Database size={18} className="icon-header text-red" />
              <h3>Database Utilities</h3>
            </div>

            <div className="card-body">
              <p className="section-desc-settings text-red">
                System backup control and testing tools. Use this to reset data parameters during testing:
              </p>

              <button
                type="button"
                className="btn btn-danger btn-block reset-db-btn"
                onClick={handleResetDB}
              >
                <RefreshCw size={16} /> Reset Database to Factory Seeds
              </button>
            </div>
          </div>

          {/* Submission Panel */}
          <div className="settings-action-panel">
            <button type="submit" className="btn btn-primary btn-block save-settings-submit">
              Save Configurations
            </button>
          </div>
        </div>

      </form>

      <style>{`
        .settings-view {
          height: 100%;
        }

        .settings-form-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .settings-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .settings-card {
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }

        .card-header-iconic {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          background-color: var(--surface-header);
        }

        .card-header-iconic h3 {
          font-size: 14.5px;
          font-weight: 600;
        }

        .icon-header {
          color: var(--primary);
        }

        .card-body {
          padding: 20px;
        }

        .section-desc-settings {
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 16px;
        }

        .section-desc-settings.text-red {
          color: hsl(350, 80%, 40%);
        }

        .helper-text {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        /* Toggle switches */
        .toggle-group-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .toggle-switch-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13.5px;
          font-weight: 500;
          color: var(--text);
          cursor: pointer;
        }

        .toggle-switch-row input {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        /* Theme selection */
        .theme-body {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .theme-toggle-settings-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-family: var(--font-sans);
          font-size: 13.5px;
          font-weight: 600;
          border: 1px solid var(--border);
          transition: var(--transition);
        }

        .theme-toggle-settings-btn.light-active {
          background-color: hsl(38, 92%, 95%);
          color: var(--warning);
          border-color: var(--warning);
        }

        .theme-toggle-settings-btn.dark-active {
          background-color: rgba(30, 41, 59, 0.4);
          color: var(--primary);
          border-color: var(--primary);
        }

        /* DB buttons */
        .reset-db-btn {
          padding: 12px;
        }

        .save-settings-submit {
          padding: 14px;
          font-size: 15px;
        }

        .text-red {
          color: var(--danger) !important;
        }
      `}</style>
    </div>
  );
};
