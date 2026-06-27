import { NavLink } from 'react-router-dom';
import { APP_NAME } from '../constants.js';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { to: '/dashboard', label: 'LDRRMO Dashboard', icon: 'bi-speedometer2', ldrrmoOnly: true },
  { to: '/overview', label: 'My Center', icon: 'bi-house-heart', fieldOnly: true },
  { to: '/centers', label: 'Evacuation Centers', icon: 'bi-building' },
  { to: '/resources', label: 'Resource Monitoring', icon: 'bi-box-seam' },
  { to: '/requests', label: 'Resource Requests', icon: 'bi-send' },
  { to: '/logs', label: 'Activity Logs', icon: 'bi-journal-text' },
];

export default function Sidebar({ open, onClose }) {
  const { isLDRRMO } = useAuth();

  return (
    <>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <i className="bi bi-shield-exclamation" />
          <div>
            {APP_NAME}
            <small>LGU Disaster Response</small>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            if (item.ldrrmoOnly && !isLDRRMO) return null;
            if (item.fieldOnly && isLDRRMO) return null;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <i className={`bi ${item.icon}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <p className="sidebar-note">ICS-aligned documentation · LGU-level operations</p>
        </div>
      </aside>
      <div className={`sidebar-overlay ${open ? 'show' : ''}`} onClick={onClose} />
    </>
  );
}
