'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { Eye, EyeOff, Lock, Mail, User, ShieldAlert, CheckCircle, Info, ArrowLeft, Shield } from 'lucide-react';
import type { UserRole } from '../../../types/db';

export default function RegisterPage() {
  const { setView, register } = useApp();

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [requestedRole, setRequestedRole] = useState<UserRole>('CASHIER');

  // Submit Feedback States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Google OAuth postMessage Callback Listener
  useEffect(() => {
    const handleOAuthMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'GOOGLE_OAUTH_SUCCESS') {
        const { name: googleName, email: googleEmail } = event.data.user;
        setLoading(true);
        setError('');
        try {
          // Simulate OAuth latency
          await new Promise((resolve) => setTimeout(resolve, 600));

          // Register user with Google profile details and selected requestedRole
          await register(`Google User (${googleName})`, googleEmail.trim().toLowerCase(), 'google-oauth-simulated', requestedRole);
          setSuccess(true);
        } catch (err: any) {
          setError(err?.message || 'Google registration failed.');
        } finally {
          setLoading(false);
        }
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [requestedRole, register]);

  // Password Rules Checked in real-time
  const rules = useMemo(() => {
    return {
      length: password.length >= 8,
      case: /[A-Z]/.test(password) && /[a-z]/.test(password),
      numOrSymbol: /[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)
    };
  }, [password]);

  // Handle Signup
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!rules.length || !rules.case || !rules.numOrSymbol) {
      setError('Please satisfy all password security requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // Call Context Register to persist user in mock database with requested role
      await register(name, email, password, requestedRole);
      setSuccess(true);
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth popup trigger
  const handleGoogleSignup = () => {
    setError('');
    const width = 500;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    window.open(
      window.location.origin + '?oauth=google-consent',
      'Google Consent Screen',
      `width=${width},height=${height},top=${top},left=${left},status=no,resizable=no`
    );

  };

  const selectMockGoogleAccount = (name: string, email: string) => {
    setGoogleName(name);
    setGoogleEmail(email);
    setIsCustomGoogle(false);
  };

  return (
    <div className="register-page">
      <div className="split-container">

        {/* Left Side: Form pane */}
        <div className="form-pane">
          {/* Back button */}
          {/* <button type="button" className="back-btn-circle" onClick={() => setView('login')} title="Back to Login">
            <ArrowLeft size={16} />
          </button> */}

          {/* Heading */}
          <div className="register-header">
            <h2>Sign Up</h2>
            <p>Secure your profile with Sehat Pharmacy System</p>
          </div>

          {/* Role pills indicator (Matches standard mockup design) */}
          <div className="role-pills-row">
            <span className="role-pill active">Staff Account</span>
          </div>

          {/* Status Alert Banner */}
          <div className="alert alert-warning">
            <Info className="flex-shrink-0" size={14} style={{ marginTop: '2px' }} />
            <div>
              New profiles default to a <strong>PENDING_APPROVAL</strong> state. Access to the dashboard or POS billing remains blocked until approved.
            </div>
          </div>

          {/* Error Feedback */}
          {error && (
            <div className="alert alert-error">
              <ShieldAlert size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form / Success Screen */}
          {success ? (
            <div className="success-screen">
              <CheckCircle className="mx-auto" size={52} style={{ color: 'var(--success)', marginBottom: '14px' }} />
              <h3>Registration Submitted!</h3>
              <p>
                Your profile has been created and set to <strong>Pending Approval</strong>. Please notify your Pharmacy Administrator to activate your account.
              </p>
              <button
                type="button"
                onClick={() => setView('login')}
                className="btn btn-primary btn-block"
              >
                Go to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="minimal-form">

              {/* Full Name */}
              <div className="form-group-minimal">
                <User size={16} className="field-icon" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {/* Email */}
              <div className="form-group-minimal">
                <Mail size={16} className="field-icon" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {/* Requested Role Dropdown */}
              <div className="form-group-minimal">
                <Shield size={16} className="field-icon" />
                <select
                  value={requestedRole}
                  onChange={(e) => setRequestedRole(e.target.value as UserRole)}
                  disabled={loading}
                  required
                  className="minimal-select"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="CASHIER">Sales Staff</option>
                </select>
              </div>

              {/* Password */}
              <div className="form-group-minimal">
                <Lock size={16} className="field-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-eye-btn"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password dynamic rules checklist */}
              <div className="password-rules-list">
                <div className={`rule-item ${rules.length ? 'valid' : ''}`}>
                  <span className="dot">•</span>
                  <span>Least 8 Characters</span>
                </div>
                <div className={`rule-item ${rules.case ? 'valid' : ''}`}>
                  <span className="dot">•</span>
                  <span>Lowercase (a-z) and uppercase (A-Z)</span>
                </div>
                <div className={`rule-item ${rules.numOrSymbol ? 'valid' : ''}`}>
                  <span className="dot">•</span>
                  <span>Least one number (0-9) or symbol</span>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group-minimal" style={{ marginTop: '16px' }}>
                <Lock size={16} className="field-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-Type Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {/* Action Buttons Row */}
              <div className="action-row-signup">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary pill-signup-btn"
                >
                  <span>Sign Up</span>
                  <span className="arrow">→</span>
                </button>

                <div className="social-signup-box">
                  <span className="or-label">Or</span>
                  <button type="button" className="social-circle-btn" title="Facebook registration mockup">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="social-circle-btn google"
                    onClick={handleGoogleSignup}
                    title="Sign up with Google"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.41 0-6.19-2.78-6.19-6.19s2.78-6.19 6.19-6.19c1.55 0 2.96.57 4.05 1.51l3.1-3.1C19.16 2.03 15.86 1 12.24 1 5.92 1 1 5.92 1 12s4.92 11 11.24 11c6.53 0 11.38-4.7 11.38-11.38 0-.66-.08-1.32-.22-1.94H12.24z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Already member toggle */}
              <div className="already-member-row">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="signin-link-minimal"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Side: Graphic pane with curvy waves - styled using website brand colors */}
        <div className="graphic-pane">
          {/* Organic Curvy SVG Wave Elements for high visual appeal */}
          <svg className="organic-waves" viewBox="0 0 400 640" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path opacity="0.15" d="M150 640C300 520 280 200 400 120V640H150Z" fill="var(--primary)" />
            <path opacity="0.3" d="M220 640C320 560 310 380 400 280V640H220Z" fill="var(--secondary)" />
            <path opacity="0.25" d="M100 640C280 580 220 180 400 0V640H100Z" fill="var(--primary)" />
          </svg>

          {/* Glow shapes for ambient visual depth */}
          <div className="glow-shape glow-1"></div>
          <div className="glow-shape glow-2"></div>
          <div className="glow-shape glow-3"></div>

          {/* Floating Card 1: Sparkline wave (Matches mockup) */}
          <div className="floating-card active-card animate-float-slow">
            <div className="card-header-inner">
              <span className="lbl">Active Catalog</span>
              <h4>Sehat Solutions</h4>
            </div>
            <div className="metric-row">
              <div className="circle-val">45</div>
              <p className="val-lbl">Low Stock Alerts</p>
            </div>
            {/* Sparkline chart SVG */}
            <svg viewBox="0 0 100 30" className="sparkline-chart">
              <path d="M0,22 Q15,4 35,20 T70,8 T90,24 T100,6" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Floating Card 2: Medicine info card with red cross (Matches mockup) */}
          <div className="floating-card medicine-card animate-float-delayed">
            <div className="info-txt">
              <h4>Medicine</h4>
              <p>
                Medicine is the science and practice of caring for a patient, managing the diagnosis, prognosis, prevention, treatment, palliation of their injury or disease, and promoting health.
              </p>
            </div>
            <div className="medical-icon-box">
              {/* Thick red medical cross */}
              <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor" style={{ color: 'var(--danger)' }}>
                <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3z" />
              </svg>
            </div>
          </div>

          {/* Floating Social Icons (Matches Dribbble Mockup details) */}
          <div className="float-social circle-fb animate-float-slow" title="Facebook Page Link">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </div>

          <div className="float-social circle-insta animate-float-delayed" title="Instagram Profile Link">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="url(#instaGradient)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="instaGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fdf497" />
                  <stop offset="5%" stopColor="#fdf497" />
                  <stop offset="45%" stopColor="#fd5949" />
                  <stop offset="60%" stopColor="#d6249f" />
                  <stop offset="90%" stopColor="#285AEB" />
                </linearGradient>
              </defs>
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </div>

        </div>

      </div>

      {/* Google Simulated OAuth Work Setup Modal */}
      {showGoogleModal && (
        <div className="google-modal-overlay">
          <div className="google-modal-card">
            <div className="google-modal-header">
              <svg viewBox="0 0 24 24" width="28" height="28" style={{ marginRight: '8px' }}>
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.41 0-6.19-2.78-6.19-6.19s2.78-6.19 6.19-6.19c1.55 0 2.96.57 4.05 1.51l3.1-3.1C19.16 2.03 15.86 1 12.24 1 5.92 1 1 5.92 1 12s4.92 11 11.24 11c6.53 0 11.38-4.7 11.38-11.38 0-.66-.08-1.32-.22-1.94H12.24z" />
              </svg>
              <h3>Google Simulated Sign Up</h3>
            </div>

            <div className="google-modal-body">
              <p className="google-desc">
                Select one of the mock Google accounts below, or specify a custom email profile. Simulated accounts default to <strong>PENDING_APPROVAL</strong>.
              </p>

              <div className="google-quick-profiles">
                <button
                  type="button"
                  className={`google-profile-tab ${googleEmail === 'jane.doe@gmail.com' && !isCustomGoogle ? 'active' : ''}`}
                  onClick={() => selectMockGoogleAccount('Jane Doe', 'jane.doe@gmail.com')}
                >
                  <div className="profile-name">Jane Doe</div>
                  <div className="profile-email">jane.doe@gmail.com</div>
                </button>

                <button
                  type="button"
                  className={`google-profile-tab ${googleEmail === 'tester@sehat.com' && !isCustomGoogle ? 'active' : ''}`}
                  onClick={() => selectMockGoogleAccount('Sehat Tester', 'tester@sehat.com')}
                >
                  <div className="profile-name">Sehat Tester</div>
                  <div className="profile-email">tester@sehat.com</div>
                </button>

                <button
                  type="button"
                  className={`google-profile-tab ${isCustomGoogle ? 'active' : ''}`}
                  onClick={() => setIsCustomGoogle(true)}
                >
                  <div className="profile-name">Custom Google Profile</div>
                  <div className="profile-email">Enter details manually</div>
                </button>
              </div>

              <form onSubmit={handleGoogleSignupSubmit} className="google-simulation-form">
                {isCustomGoogle && (
                  <div className="custom-fields-group">
                    <div className="form-group-google">
                      <label>Google Profile Name</label>
                      <input
                        type="text"
                        value={googleName}
                        onChange={(e) => setGoogleName(e.target.value)}
                        placeholder="e.g. Bilal Khan"
                        required
                      />
                    </div>

                    <div className="form-group-google">
                      <label>Google Account Email</label>
                      <input
                        type="email"
                        value={googleEmail}
                        onChange={(e) => setGoogleEmail(e.target.value)}
                        placeholder="e.g. name@gmail.com"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="google-modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowGoogleModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Continue as {googleEmail}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .register-page {
          background-color: var(--primary-light); /* Soft brand-color background backdrop */
          width: 100vw;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow-y: auto;
          padding: 40px 20px;
          box-sizing: border-box;
          font-family: var(--font-sans);
        }

        .split-container {
          display: flex;
          width: 980px;
          height: 640px;
          background-color: var(--surface);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border);
          overflow: hidden;
          z-index: 2;
          position: relative;
        }

        /* LEFT FORM PANE */
        .form-pane {
          flex: 1.15;
          padding: 40px 48px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow-y: auto;
          box-sizing: border-box;
        }

        .back-btn-circle {
          position: absolute;
          left: 40px;
          top: 36px;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border);
          background-color: var(--surface);
          color: var(--text);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition);
          z-index: 10;
        }

        .back-btn-circle:hover {
          background-color: var(--background);
          border-color: var(--text-muted);
        }

        .register-header {
          margin-top: 44px;
          margin-bottom: 16px;
        }

        .register-header h2 {
          font-size: 26px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 4px;
        }

        .register-header p {
          font-size: 13px;
          color: var(--text-muted);
        }

        /* Role selectors */
        .role-pills-row {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .role-pill {
          padding: 6px 14px;
          border-radius: var(--radius-full);
          font-size: 11px;
          font-weight: 700;
          background-color: var(--background);
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 1px solid var(--border);
        }

        .role-pill.active {
          background-color: var(--primary); /* active tag uses theme primary colors */
          color: var(--text-inverse);
          border-color: var(--primary);
        }

        .alert {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          font-size: 11.5px;
          margin-bottom: 20px;
          line-height: 1.4;
        }

        .alert-warning {
          background-color: var(--warning-light);
          color: var(--warning);
          border: 1px solid rgba(202, 138, 4, 0.15);
        }

        .alert-error {
          background-color: var(--danger-light);
          color: var(--danger);
          border: 1px solid rgba(220, 38, 38, 0.15);
        }

        /* Minimal lines form inputs */
        .minimal-form {
          display: flex;
          flex-direction: column;
        }

        .form-group-minimal {
          position: relative;
          margin-bottom: 18px;
          border-bottom: 1px solid var(--border);
          transition: var(--transition);
        }

        .form-group-minimal:focus-within {
          border-bottom-color: var(--primary);
        }

        .field-icon {
          position: absolute;
          left: 4px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          opacity: 0.7;
          pointer-events: none;
        }

        .form-group-minimal input {
          width: 100%;
          padding: 10px 14px 10px 32px;
          font-family: var(--font-sans);
          font-size: 13.5px;
          border: none !important;
          background: transparent !important;
          outline: none !important;
          box-shadow: none !important;
          color: var(--text);
          height: 38px;
        }

        .form-group-minimal input::placeholder {
          color: var(--text-muted);
          opacity: 0.6;
        }

        .password-eye-btn {
          position: absolute;
          right: 4px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
        }

        /* Password strength checklists */
        .password-rules-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: -10px;
          margin-bottom: 10px;
        }

        .rule-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10.5px;
          color: var(--text-muted);
          opacity: 0.6;
          transition: var(--transition);
        }

        .rule-item.valid {
          color: var(--success);
          opacity: 1;
          font-weight: 600;
        }

        .rule-item .dot {
          font-size: 14px;
          line-height: 1;
        }

        /* Action Row (rounded signup & social icons) */
        .action-row-signup {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 24px;
        }

        .pill-signup-btn {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 24px;
          border-radius: var(--radius-full);
          font-weight: 700;
          font-size: 14px;
          background-color: var(--primary); /* uses primary brand color */
          color: var(--text-inverse);
          border: none;
          cursor: pointer;
          transition: var(--transition);
          gap: 16px;
          height: 44px;
        }

        .pill-signup-btn:hover {
          background-color: var(--primary-hover);
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
        }

        .pill-signup-btn .arrow {
          font-size: 16px;
        }

        .social-signup-box {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .or-label {
          font-size: 12px;
          color: var(--text-muted);
          margin-right: 6px;
        }

        .social-circle-btn {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border);
          background-color: var(--surface);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition);
          padding: 0;
        }

        .social-circle-btn:hover {
          background-color: var(--background);
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }

        .already-member-row {
          text-align: center;
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }

        .signin-link-minimal {
          background: none;
          border: none;
          color: var(--primary);
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          font-size: 13px;
        }

        .signin-link-minimal:hover {
          text-decoration: underline;
        }

        /* RIGHT GRAPHIC PANE */
        .graphic-pane {
          flex: 0.85;
          background: linear-gradient(135deg, var(--primary), var(--secondary)); /* website color combination */
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          box-sizing: border-box;
        }

        .organic-waves {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .glow-shape {
          position: absolute;
          border-radius: var(--radius-full);
          opacity: 0.15;
          pointer-events: none;
          z-index: 2;
        }

        .glow-1 {
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, var(--primary) 0%, transparent 70%);
          top: -150px;
          right: -100px;
        }

        .glow-2 {
          width: 380px;
          height: 380px;
          background: radial-gradient(circle, var(--success) 0%, transparent 70%);
          bottom: -100px;
          left: -80px;
        }

        .glow-3 {
          width: 250px;
          height: 250px;
          background: radial-gradient(circle, var(--secondary) 0%, transparent 70%);
          top: 40%;
          left: 10%;
        }

        /* Floating Overlaid Cards */
        .floating-card {
          width: 240px;
          background-color: var(--surface);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          padding: 20px;
          z-index: 3;
          position: absolute;
          box-sizing: border-box;
        }

        .active-card {
          top: 100px;
          left: 40px;
        }

        .card-header-inner {
          margin-bottom: 12px;
        }

        .card-header-inner .lbl {
          font-size: 10px;
          background-color: var(--primary-light);
          color: var(--primary);
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          font-weight: 700;
        }

        .card-header-inner h4 {
          font-size: 13px;
          font-weight: 700;
          margin-top: 6px;
          color: var(--text);
        }

        .metric-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }

        .circle-val {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-full);
          background-color: var(--text);
          color: var(--surface);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
        }

        .val-lbl {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 600;
        }

        .sparkline-chart {
          width: 100%;
          height: 32px;
          overflow: visible;
        }

        /* Card 2: Medicine info card */
        .medicine-card {
          bottom: 100px;
          right: 40px;
          width: 280px;
          display: flex;
          gap: 16px;
          align-items: flex-start;
          padding: 24px;
        }

        .info-txt h4 {
          font-size: 14px;
          font-weight: 800;
          margin-bottom: 6px;
          color: var(--text);
        }

        .info-txt p {
          font-size: 11px;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .medical-icon-box {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          background-color: var(--danger-light);
        }

        /* Floating Social circles */
        .float-social {
          position: absolute;
          width: 42px;
          height: 42px;
          border-radius: var(--radius-full);
          background-color: var(--surface);
          box-shadow: var(--shadow-md);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 4;
        }

        .circle-fb {
          top: 180px;
          right: 60px;
        }

        .circle-insta {
          bottom: 220px;
          left: 60px;
        }

        .minimal-select {
          width: 100%;
          padding: 10px 14px 10px 32px;
          font-family: var(--font-sans);
          font-size: 13.5px;
          border: none !important;
          background: transparent !important;
          outline: none !important;
          box-shadow: none !important;
          color: var(--text);
          height: 38px;
          cursor: pointer;
        }

        .minimal-select option {
          background-color: var(--surface);
          color: var(--text);
        }

        /* Floating animations */
        .animate-float-slow {
          animation: floatingSlow 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: floatingSlow 6s ease-in-out infinite;
          animation-delay: 3s;
        }

        @keyframes floatingSlow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        /* Responsive styling */
        @media (max-width: 992px) {
          .split-container {
            width: 100%;
            height: auto;
            flex-direction: column;
          }
          .graphic-pane {
            display: none;
          }
          .form-pane {
            padding: 36px 28px;
          }
        }

        @media (max-width: 576px) {
          .register-page {
            padding: 16px 12px;
            background-color: var(--surface);
          }
          .split-container {
            border: none;
            box-shadow: none;
            background-color: transparent;
          }
          .form-pane {
            padding: 20px 16px;
          }
          .action-row-signup {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }
          .pill-signup-btn {
            width: 100%;
            justify-content: center;
          }
          .social-signup-box {
            justify-content: center;
            width: 100%;
          }
          .register-header {
            margin-top: 16px;
            text-align: center;
          }
          .role-pills-row {
            justify-content: center;
          }
        }

        .success-screen {
          text-align: center;
          padding: 20px 0;
        }
        
        .success-screen h3 {
          font-size: 20px;
          margin-bottom: 8px;
          color: var(--text);
        }

        .success-screen p {
          font-size: 13.5px;
          color: var(--text-muted);
          line-height: 1.5;
          margin-bottom: 24px;
        }
      `}</style>
    </div>
  );
}
