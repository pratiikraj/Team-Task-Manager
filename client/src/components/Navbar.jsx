import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const linkStyle = ({ isActive }) => ({
    padding: '6px 0',
    textDecoration: 'none',
    color: isActive ? 'var(--accent-deep)' : 'var(--ink)',
    fontWeight: isActive ? 600 : 500,
    fontSize: 14,
    borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent'
  });

  return (
    <header style={{
      borderBottom: '1.5px solid var(--ink)',
      background: 'var(--paper)',
      position: 'sticky',
      top: 0,
      zIndex: 20
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 32px'
      }}>
        <NavLink to="/dashboard" style={{ textDecoration: 'none', color: 'var(--ink)' }}>
          <span className="serif" style={{ fontSize: 26, fontStyle: 'italic', fontWeight: 500 }}>
            Foreman
          </span>
          <span className="mono" style={{
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginLeft: 10,
            color: 'var(--muted)'
          }}>
            № 001
          </span>
        </NavLink>

        <nav style={{ display: 'flex', gap: 26, alignItems: 'center' }}>
          <NavLink to="/dashboard" style={linkStyle}>Dashboard</NavLink>
          <NavLink to="/projects" style={linkStyle}>Projects</NavLink>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
            {user?.name}
          </span>
          <button
            className="btn tiny secondary"
            onClick={() => { logout(); nav('/'); }}
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
