import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { APP_NAME, APP_TAGLINE } from '../constants.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { user, login, register, loading } = useAuth();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="loading-screen">Loading…</div>;
  if (user) return <Navigate to={user.role === 'ldrrmo' ? '/dashboard' : '/overview'} replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') await login(username, password);
      else await register(username, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Sign-in failed. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <i className="bi bi-shield-exclamation" />
          <h1>{APP_NAME}</h1>
          <p>{APP_TAGLINE}</p>
        </div>

        <div className="limitation-banner">
          <i className="bi bi-info-circle" />
          Decision-support tool for local disaster response. Does not replace official ICS procedures or
          LDRRMO authority.
        </div>

        <div className="login-tabs" role="tablist">
          <button
            type="button"
            className={`login-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`login-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            Create Account
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div className="password-field">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={4}
                required
              />
              <button
                type="button"
                className="password-toggle"
                aria-label="Show password"
                onClick={() => setShowPassword((v) => !v)}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>
          </div>
          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
            <i className={`bi ${mode === 'login' ? 'bi-box-arrow-in-right' : 'bi-person-plus'}`} />{' '}
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="login-demo">
          <p className="login-demo-title">Demo accounts (Sign In)</p>
          <ul>
            <li>
              <code>ldrrmo</code> / <code>ldrrmo123</code> — LDRRMO Officer (full dashboard)
            </li>
            <li>
              <code>coordinator1</code> / <code>coord123</code> — San Jose Covered Court
            </li>
            <li>
              <code>campmgr</code> / <code>camp123</code> — Municipal Gymnasium
            </li>
            <li>
              <code>coordinator2</code> / <code>coord123</code> — Elementary School Hall
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
