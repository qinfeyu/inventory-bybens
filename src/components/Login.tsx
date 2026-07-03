import React, { useState } from 'react';
import { api } from '../utils/api';
import { User } from '../types';
import { Lock, User as UserIcon, LogIn, Dumbbell } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (token: string, user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    api.login(usernameOrEmail.trim(), password)
      .then(res => {
        onLoginSuccess(res.token, res.user);
      })
      .catch(err => {
        console.error('Login failed:', err);
        setError(err.message || 'Invalid credentials. Please try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #1e1e24 0%, #0e0e11 100%)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Outfit', 'Inter', sans-serif"
    }}>
      {/* Background decorative glows */}
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 70%)',
        top: '-150px',
        left: '-150px',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, rgba(168, 85, 247, 0) 70%)',
        bottom: '-150px',
        right: '-150px',
        pointerEvents: 'none'
      }} />

      {/* Main Login Card */}
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '40px',
        background: 'rgba(23, 23, 28, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(16px)',
        zIndex: 10,
        position: 'relative'
      }}>
        {/* Portal Logo & Branding */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)'
          }}>
            <Dumbbell size={28} color="white" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.5px' }}>
            POTY PORTAL
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Enter your credentials to access the portal
          </p>
        </div>

        {/* Error Message display */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '8px',
            color: '#f87171',
            padding: '12px 16px',
            fontSize: '0.85rem',
            marginBottom: '24px',
            textAlign: 'center',
            fontWeight: 500
          }}>
            {error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'var(--text-secondary)',
              marginBottom: '8px'
            }}>
              Username or Email
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}>
                <UserIcon size={16} />
              </div>
              <input
                type="text"
                className="form-control"
                placeholder="Enter username or email"
                value={usernameOrEmail}
                onChange={e => setUsernameOrEmail(e.target.value)}
                disabled={loading}
                style={{
                  paddingLeft: '42px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  height: '46px',
                  fontSize: '0.92rem',
                  borderRadius: '10px',
                  width: '100%',
                  color: 'white',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'var(--text-secondary)',
              marginBottom: '8px'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}>
                <Lock size={16} />
              </div>
              <input
                type="password"
                className="form-control"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                style={{
                  paddingLeft: '42px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  height: '46px',
                  fontSize: '0.92rem',
                  borderRadius: '10px',
                  width: '100%',
                  color: 'white',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              height: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '0.95rem',
              fontWeight: 700,
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'transform 0.2s, filter 0.2s',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
              border: 'none',
              color: 'white'
            }}
          >
            {loading ? (
              <span className="spinner" style={{
                width: '18px',
                height: '18px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
            ) : (
              <>
                <LogIn size={16} />
                Sign In
              </>
            )}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .form-control:focus {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15) !important;
          background: rgba(255, 255, 255, 0.05) !important;
          outline: none;
        }
      `}</style>
    </div>
  );
};
