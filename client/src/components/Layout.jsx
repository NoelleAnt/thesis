import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { adminApi } from '../api/client.js';

export default function Layout() {
  const { user, logout, isLDRRMO } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  async function handleReset() {
    if (!window.confirm('Reset all demo data to defaults? This cannot be undone.')) return;
    await adminApi.resetDemo();
    window.location.reload();
  }

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-wrapper">
        <header className="navbar-top">
          <div className="d-flex align-items-center gap-3">
            <button className="btn-icon" aria-label="Toggle sidebar" onClick={() => setSidebarOpen(true)}>
              <i className="bi bi-list" />
            </button>
            {isLDRRMO && <span className="badge bg-danger d-none d-md-inline">Incident Response Active</span>}
          </div>
          <div className="dropdown user-dropdown">
            <button className="user-menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1e40af&color=fff`}
                alt=""
                className="avatar"
              />
              <span className="d-none d-sm-inline">{user.name}</span>
              <i className="bi bi-chevron-down text-muted" />
            </button>
            {menuOpen && (
              <ul className="dropdown-menu dropdown-menu-end show">
              <li className="dropdown-header">
                {user.name}
                <br />
                <small className="text-muted">{user.roleLabel}</small>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              {isLDRRMO && (
                <li>
                  <button type="button" className="dropdown-item" onClick={handleReset}>
                    <i className="bi bi-arrow-counterclockwise" /> Reset Demo Data
                  </button>
                </li>
              )}
              <li>
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                >
                  <i className="bi bi-box-arrow-right" /> Logout
                </button>
              </li>
            </ul>
            )}
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
