import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../types/db';
import { Lock, Mail, ShieldAlert, KeyRound, ArrowLeft, Eye, EyeOff, User, Info } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, googleLogin, facebookLogin, setView } = useApp();

  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('ADMIN');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password States
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'none' | 'email' | 'otp' | 'reset'>('none');
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // OAuth Simulation Modal States
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<'google' | 'facebook'>('google');

  // Handle Login Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }

    setLoading(true);
    // Mimic API latency
    setTimeout(async () => {
      const result = await login(email, password, role);
      setLoading(false);
      if (!result.success) {
        if (result.error === 'PENDING_APPROVAL') {
          setError('Security Notice: Your registration is PENDING APPROVAL. An administrator must approve your account before you can log in.');
        } else if (result.error === 'ACCOUNT_REJECTED') {
          setError('Security Notice: Your registration request has been REJECTED by an administrator.');
        } else {
          setError(`Invalid credentials or role mismatch. Try using:
- admin@sehat.com (pwd: admin123) for ADMIN
- manager@sehat.com (pwd: manager123) for MANAGER
- cashier@sehat.com (pwd: cashier123) for CASHIER`);
        }
      }
    }, 800);
  };

  // Google OAuth simulator
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    setTimeout(async () => {
      const result = await googleLogin(role);
      setLoading(false);
      if (!result.success && result.error !== 'CANCELLED') {
        if (result.error === 'PENDING_APPROVAL') {
          setError(`Security Notice: Google profile (${result.email}) is PENDING APPROVAL. An administrator must approve your account and assign your system role before you can log in.`);
        } else if (result.error === 'ACCOUNT_REJECTED') {
          setError(`Security Notice: Google profile (${result.email}) has been REJECTED by an administrator.`);
        } else if (result.error === 'ROLE_MISMATCH') {
          setError(`Security Notice: Google profile is registered under a different role. Please select the correct role matching your profile.`);
        } else if (result.error === 'USER_NOT_REGISTERED') {
          // Rule 3: Reject if unregistered
          setError(`Authentication Failed: No account found for Google profile (${result.email}). Please sign up first.`);
        } else {
          setError('Google authentication failed. Please try again.');
        }
      }
    }, 600);
  };

  // Facebook OAuth simulator
  const handleFacebookLogin = async () => {
    setError('');
    setLoading(true);
    setTimeout(async () => {
      const result = await facebookLogin(role);
      setLoading(false);
      if (!result.success && result.error !== 'CANCELLED') {
        if (result.error === 'PENDING_APPROVAL') {
          setError(`Security Notice: Facebook profile (${result.email}) is PENDING APPROVAL. An administrator must approve your account and assign your system role before you can log in.`);
        } else if (result.error === 'ACCOUNT_REJECTED') {
          setError(`Security Notice: Facebook profile (${result.email}) has been REJECTED by an administrator.`);
        } else if (result.error === 'ROLE_MISMATCH') {
          setError(`Security Notice: Facebook profile is registered under a different role. Please select the correct role matching your profile.`);
        } else if (result.error === 'USER_NOT_REGISTERED') {
          // Rule 3: Reject if unregistered
          setError(`Authentication Failed: No account found for Facebook profile (${result.email}). Please sign up first.`);
        } else {
          setError('Facebook authentication failed. Please try again.');
        }
      }
    }, 600);
  };

  // Simulated Recovery API
  const handleSendRecoveryEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setForgotPasswordStep('otp');
      setSuccessMessage('Recovery code (OTP: 5824) sent to your email.');
    }, 800);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode === '5824') {
      setForgotPasswordStep('reset');
      setError('');
      setSuccessMessage('OTP Verified successfully. Please enter a new password.');
    } else {
      setError('Invalid OTP code. Use "5824" to verify.');
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setForgotPasswordStep('none');
      setSuccessMessage('Password reset successfully. Please login with your new password.');
      setPassword('');
      setError('');
    }, 800);
  };

  return (
    <div className="login-page">
      <div className="split-container">
        
        {/* Left Side: Form pane */}
        <div className="form-pane">
          
          {/* Header & Flow Switcher */}
          {forgotPasswordStep === 'none' ? (
            <>
              {/* Back button link to main landing (mock) */}
              <button type="button" className="back-btn-circle" title="Home">
                <ArrowLeft size={16} />
              </button>

              <div className="register-header">
                <h2>Sign In</h2>
                <p>Sign in to access Sehat Pharmacy System</p>
              </div>

              {/* Role selection tab (Rule 1: Unified pill row UI) */}
              <div className="role-pills-row">
                <button
                  type="button"
                  className={`role-pill-btn ${role === 'ADMIN' ? 'active' : ''}`}
                  onClick={() => setRole('ADMIN')}
                >
                  Admin
                </button>
                <button
                  type="button"
                  className={`role-pill-btn ${role === 'MANAGER' ? 'active' : ''}`}
                  onClick={() => setRole('MANAGER')}
                >
                  Manager
                </button>
                <button
                  type="button"
                  className={`role-pill-btn ${role === 'CASHIER' ? 'active' : ''}`}
                  onClick={() => setRole('CASHIER')}
                >
                  Cashier
                </button>
              </div>

              {/* Display errors */}
              {error && (
                <div className="alert alert-error">
                  <ShieldAlert size={14} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {successMessage && (
                <div className="alert alert-success">
                  <KeyRound size={14} className="flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="minimal-form">
                {/* Email Address */}
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

                {/* Password & Forgot link */}
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

                {/* Forgot Password Link */}
                <div className="forgot-password-row">
                  <button
                    type="button"
                    className="forgot-link-minimal"
                    onClick={() => {
                      setForgotPasswordStep('email');
                      setSuccessMessage('');
                      setError('');
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Action Buttons Row */}
                <div className="action-row-signup" style={{ marginTop: '16px' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary pill-signup-btn"
                  >
                    <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                    <span className="arrow">→</span>
                  </button>

                  <div className="social-signup-box">
                    <span className="or-label">Or</span>
                    {/* Facebook OAuth Button */}
                    <button 
                      type="button" 
                      className="social-circle-btn" 
                      onClick={handleFacebookLogin}
                      disabled={loading}
                      title="Sign in with Facebook"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="#1877F2">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </button>
                    {/* Google OAuth Button */}
                    <button 
                      type="button" 
                      className="social-circle-btn google" 
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      title="Sign in with Google"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.41 0-6.19-2.78-6.19-6.19s2.78-6.19 6.19-6.19c1.55 0 2.96.57 4.05 1.51l3.1-3.1C19.16 2.03 15.86 1 12.24 1 5.92 1 1 5.92 1 12s4.92 11 11.24 11c6.53 0 11.38-4.7 11.38-11.38 0-.66-.08-1.32-.22-1.94H12.24z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Footer Switcher */}
                <div className="already-member-row">
                  Don't have a staff account?{' '}
                  <button 
                    type="button"
                    onClick={() => setView('register')}
                    className="signin-link-minimal"
                  >
                    Sign Up
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div style={{ marginTop: '24px' }}>
              {/* BACK BUTTON CIRCLE FOR RECOVERY FLOW */}
              <button 
                type="button" 
                className="back-btn-circle" 
                onClick={() => setForgotPasswordStep('none')}
                title="Back to login"
              >
                <ArrowLeft size={16} />
              </button>

              {/* Display errors / success */}
              {error && (
                <div className="alert alert-error" style={{ marginTop: '44px' }}>
                  <ShieldAlert size={14} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {successMessage && (
                <div className="alert alert-success" style={{ marginTop: '44px' }}>
                  <KeyRound size={14} className="flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Forgot password flows */}
              {forgotPasswordStep === 'email' && (
                <form onSubmit={handleSendRecoveryEmail} className="minimal-form" style={error || successMessage ? {} : { marginTop: '44px' }}>
                  <div className="register-header" style={{ marginTop: 0 }}>
                    <h2>Forgot Password</h2>
                    <p>Enter your email and we'll send you a 4-digit code to recover your account.</p>
                  </div>

                  <div className="form-group-minimal">
                    <Mail size={16} className="field-icon" />
                    <input
                      type="email"
                      placeholder="Enter registered email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary pill-signup-btn" style={{ marginTop: '16px', width: '100%' }}>
                    <span>Send Recovery OTP</span>
                    <span className="arrow">→</span>
                  </button>
                </form>
              )}

              {forgotPasswordStep === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="minimal-form" style={error || successMessage ? {} : { marginTop: '44px' }}>
                  <div className="register-header" style={{ marginTop: 0 }}>
                    <h2>Verify Code</h2>
                    <p>Type the 4-digit code sent to your email box (Use code: <strong>5824</strong>).</p>
                  </div>

                  <div className="form-group-minimal">
                    <KeyRound size={16} className="field-icon" />
                    <input
                      type="text"
                      placeholder="e.g. 5824"
                      maxLength={4}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary pill-signup-btn" style={{ marginTop: '16px', width: '100%' }}>
                    <span>Verify OTP</span>
                    <span className="arrow">→</span>
                  </button>
                </form>
              )}

              {forgotPasswordStep === 'reset' && (
                <form onSubmit={handleResetPassword} className="minimal-form" style={error || successMessage ? {} : { marginTop: '44px' }}>
                  <div className="register-header" style={{ marginTop: 0 }}>
                    <h2>Create New Password</h2>
                    <p>Choose a strong, secure password for your Sehat account.</p>
                  </div>

                  <div className="form-group-minimal">
                    <Lock size={16} className="field-icon" />
                    <input
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary pill-signup-btn" style={{ marginTop: '16px', width: '100%' }}>
                    <span>Reset & Log In</span>
                    <span className="arrow">→</span>
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Right Side: Graphic pane with curvy waves - identical layout and visual structure */}
        <div className="graphic-pane">
          {/* Organic Curvy SVG Wave Elements */}
          <svg className="organic-waves" viewBox="0 0 400 640" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path opacity="0.15" d="M150 640C300 520 280 200 400 120V640H150Z" fill="var(--primary)" />
            <path opacity="0.3" d="M220 640C320 560 310 380 400 280V640H220Z" fill="var(--secondary)" />
            <path opacity="0.25" d="M100 640C280 580 220 180 400 0V640H100Z" fill="var(--primary)" />
          </svg>

          {/* Glow shapes */}
          <div className="glow-shape glow-1"></div>
          <div className="glow-shape glow-2"></div>
          <div className="glow-shape glow-3"></div>

          {/* Floating Card 1: Active Catalog sparkline */}
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

          {/* Floating Card 2: Medicine info card */}
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

          {/* Floating Social Icons */}
          <div className="float-social circle-fb animate-float-slow" title="Facebook Page Link">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </div>
          
          <div className="float-social circle-insta animate-float-delayed" title="Instagram Profile Link">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="url(#instaGradientLogin)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="instaGradientLogin" x1="0%" y1="100%" x2="100%" y2="0%">
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

      <style>{`
        .login-page {
          background-color: var(--primary-light); /* Soft brand-color background backdrop (matching signup) */
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

        /* Role selectors (Admin / Manager / Cashier pills) */
        .role-pills-row {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .role-pill-btn {
          padding: 6px 14px;
          border-radius: var(--radius-full);
          font-size: 11px;
          font-weight: 700;
          background-color: var(--background);
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 1px solid var(--border);
          cursor: pointer;
          transition: var(--transition);
        }

        .role-pill-btn.active {
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
          white-space: pre-wrap;
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

        .alert-success {
          background-color: var(--success-light);
          color: var(--success);
          border: 1px solid rgba(22, 163, 74, 0.15);
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

        .forgot-password-row {
          text-align: right;
          margin-top: -10px;
          margin-bottom: 10px;
        }

        .forgot-link-minimal {
          background: none;
          border: none;
          font-size: 12px;
          color: var(--primary);
          cursor: pointer;
          font-weight: 500;
          padding: 0;
        }

        .forgot-link-minimal:hover {
          text-decoration: underline;
        }

        /* Action Row (rounded button & social icons) */
        .action-row-signup {
          display: flex;
          justify-content: space-between;
          align-items: center;
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
      `}</style>
    </div>
  );
};
