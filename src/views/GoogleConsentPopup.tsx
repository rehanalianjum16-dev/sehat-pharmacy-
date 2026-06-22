import React, { useState } from 'react';
import { User, Mail, ShieldAlert, ArrowLeft, Check, Plus } from 'lucide-react';

interface GoogleProfile {
  name: string;
  email: string;
  avatarColor: string;
}

const MOCK_PROFILES: GoogleProfile[] = [
  { name: 'Jane Doe', email: 'jane.doe@gmail.com', avatarColor: '#3b82f6' },
  { name: 'Sehat Tester', email: 'tester@sehat.com', avatarColor: '#10b981' }
];

export const GoogleConsentPopup: React.FC = () => {
  const [selectedProfile, setSelectedProfile] = useState<GoogleProfile | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [error, setError] = useState('');

  const handleSelectMock = (profile: GoogleProfile) => {
    setSelectedProfile(profile);
    setIsCustom(false);
    setError('');
  };

  const handleCustomSelect = () => {
    setIsCustom(true);
    setSelectedProfile(null);
    setError('');
  };

  const handleCancel = () => {
    window.close();
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();

    let name = '';
    let email = '';

    if (isCustom) {
      if (!customName.trim() || !customEmail.trim()) {
        setError('Please fill in both name and email.');
        return;
      }
      if (!customEmail.includes('@')) {
        setError('Please enter a valid Google email.');
        return;
      }
      name = customName.trim();
      email = customEmail.trim().toLowerCase();
    } else if (selectedProfile) {
      name = selectedProfile.name;
      email = selectedProfile.email;
    } else {
      setError('Please select an account or add a custom profile.');
      return;
    }

    // Send payload back to parent window
    if (window.opener) {
      window.opener.postMessage(
        {
          type: 'GOOGLE_OAUTH_SUCCESS',
          user: { name, email }
        },
        window.location.origin
      );
      window.close();
    } else {
      setError('Parent window communication failed. Please close and try again.');
    }
  };

  return (
    <div className="google-consent-viewport">
      <div className="google-consent-card">
        {/* Google Header */}
        <div className="google-header">
          <svg viewBox="0 0 24 24" width="40" height="40" className="google-logo">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <h2>Sign in with Google</h2>
          <p className="app-subtitle">to continue to <strong className="brand-accent">Sehat Pharmacy</strong></p>
        </div>

        {/* Content body */}
        <div className="google-body">
          {error && (
            <div className="google-error">
              <ShieldAlert size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <p className="google-label">Choose an account</p>

          <div className="google-accounts-list">
            {MOCK_PROFILES.map((profile) => (
              <button
                key={profile.email}
                type="button"
                className={`google-account-row ${selectedProfile?.email === profile.email ? 'selected' : ''}`}
                onClick={() => handleSelectMock(profile)}
              >
                <div className="google-avatar" style={{ backgroundColor: profile.avatarColor }}>
                  {profile.name[0]}
                </div>
                <div className="google-account-info">
                  <span className="profile-name">{profile.name}</span>
                  <span className="profile-email">{profile.email}</span>
                </div>
                {selectedProfile?.email === profile.email && (
                  <Check size={16} className="google-check-icon" />
                )}
              </button>
            ))}

            <button
              type="button"
              className={`google-account-row ${isCustom ? 'selected' : ''}`}
              onClick={handleCustomSelect}
            >
              <div className="google-avatar custom-avatar">
                <Plus size={16} />
              </div>
              <div className="google-account-info">
                <span className="profile-name">Use another account</span>
                <span className="profile-email">Sign in with a custom profile</span>
              </div>
              {isCustom && <Check size={16} className="google-check-icon" />}
            </button>
          </div>

          {isCustom && (
            <form onSubmit={handleConfirm} className="google-custom-form">
              <div className="google-input-group">
                <label>Name</label>
                <input
                  type="text"
                  placeholder="e.g. Bilal Khan"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  required
                />
              </div>
              <div className="google-input-group">
                <label>Google Email address</label>
                <input
                  type="email"
                  placeholder="e.g. bilal@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  required
                />
              </div>
            </form>
          )}

          <div className="google-terms">
            To continue, Google will share your name, email address, language preference, and profile picture with Sehat Pharmacy. Before using this app, you can review its privacy policy and terms of service.
          </div>
        </div>

        {/* Footer actions */}
        <div className="google-footer">
          <button type="button" className="btn-google-cancel" onClick={handleCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-google-confirm"
            onClick={handleConfirm}
            disabled={!selectedProfile && !isCustom}
          >
            Confirm
          </button>
        </div>
      </div>

      <style>{`
        .google-consent-viewport {
          background-color: #f0f4f9;
          width: 100vw;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          padding: 20px;
          box-sizing: border-box;
        }

        .google-consent-card {
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
          width: 100%;
          max-width: 450px;
          padding: 36px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          border: 1px solid #dadce0;
        }

        .google-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .google-logo {
          margin-bottom: 12px;
        }

        .google-header h2 {
          font-size: 22px;
          font-weight: 500;
          color: #202124;
          margin: 0 0 6px 0;
          letter-spacing: -0.2px;
        }

        .app-subtitle {
          font-size: 14px;
          color: #5f6368;
          margin: 0;
        }

        .brand-accent {
          color: #0d9488; /* Sehat brand primary color */
          font-weight: 600;
        }

        .google-body {
          flex: 1;
        }

        .google-error {
          background-color: #fdf2f2;
          color: #dc2626;
          border: 1px solid #fee2e2;
          border-radius: 4px;
          padding: 8px 12px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .google-label {
          font-size: 15px;
          font-weight: 500;
          color: #202124;
          margin: 0 0 12px 0;
        }

        .google-accounts-list {
          display: flex;
          flex-direction: column;
          border: 1px solid #dadce0;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .google-account-row {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          background: none;
          border: none;
          border-bottom: 1px solid #dadce0;
          cursor: pointer;
          transition: background-color 0.15s;
          text-align: left;
          width: 100%;
          outline: none;
        }

        .google-account-row:last-child {
          border-bottom: none;
        }

        .google-account-row:hover {
          background-color: #f8f9fa;
        }

        .google-account-row.selected {
          background-color: #e8f0fe;
        }

        .google-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .custom-avatar {
          background-color: #f1f3f4;
          color: #5f6368;
          border: 1px dashed #dadce0;
        }

        .google-account-info {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .google-account-info .profile-name {
          font-size: 13.5px;
          font-weight: 500;
          color: #3c4043;
        }

        .google-account-info .profile-email {
          font-size: 11px;
          color: #5f6368;
        }

        .google-check-icon {
          color: #1a73e8;
          margin-left: 8px;
        }

        .google-custom-form {
          background-color: #f8f9fa;
          border: 1px solid #dadce0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .google-input-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .google-input-group label {
          font-size: 11px;
          font-weight: 600;
          color: #5f6368;
          text-transform: uppercase;
        }

        .google-input-group input {
          border: 1px solid #dadce0;
          border-radius: 4px;
          height: 36px;
          padding: 0 10px;
          font-size: 13px;
          outline: none;
          box-shadow: none;
          transition: border-color 0.15s;
        }

        .google-input-group input:focus {
          border-color: #1a73e8;
        }

        .google-terms {
          font-size: 11px;
          color: #5f6368;
          line-height: 1.4;
        }

        .google-footer {
          display: flex;
          justify-content: space-between;
          margin-top: 28px;
          align-items: center;
        }

        .btn-google-cancel {
          background: none;
          border: none;
          color: #1a73e8;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          padding: 8px 16px;
          border-radius: 4px;
          transition: background-color 0.15s;
        }

        .btn-google-cancel:hover {
          background-color: rgba(26, 115, 232, 0.04);
        }

        .btn-google-confirm {
          background-color: #1a73e8;
          color: #ffffff;
          border: none;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          padding: 8px 24px;
          border-radius: 4px;
          transition: background-color 0.15s, opacity 0.15s;
        }

        .btn-google-confirm:hover {
          background-color: #1b66ca;
        }

        .btn-google-confirm:disabled {
          background-color: #ccc;
          color: #666;
          cursor: not-allowed;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
};
