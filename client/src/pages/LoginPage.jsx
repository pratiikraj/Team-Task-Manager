import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      await login(email, pwd);
      nav('/dashboard');
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame title="Welcome back" subtitle="Sign in to keep going.">
      <form onSubmit={submit} className="stack">
        {err && <div className="error-banner">{err}</div>}
        <div>
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div>
          <label>Password</label>
          <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} required autoComplete="current-password" />
        </div>
        <button className="btn" type="submit" disabled={busy} style={{ justifyContent: 'center', marginTop: 6 }}>
          {busy ? 'Signing in…' : 'Sign in →'}
        </button>
        <p style={{ fontSize: 13, marginTop: 8 }}>
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </form>
    </AuthFrame>
  );
}

export function AuthFrame({ title, subtitle, children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      <div style={{
        background: 'var(--ink)',
        color: 'var(--paper)',
        padding: '60px 50px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Link to="/" style={{ color: 'var(--paper)', textDecoration: 'none' }}>
            <span className="serif" style={{ fontSize: 30, fontStyle: 'italic' }}>Foreman</span>
          </Link>
        </div>

        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 30% 70%, rgba(194, 65, 12, 0.18), transparent 50%), radial-gradient(circle at 80% 20%, rgba(176, 128, 39, 0.15), transparent 50%)',
          zIndex: 1
        }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <p className="serif" style={{ fontSize: 28, fontStyle: 'italic', lineHeight: 1.2, maxWidth: 380 }}>
            "Done is better than perfect, but tracked is better than done."
          </p>
          <p className="mono" style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(244,236,220,0.5)', marginTop: 14 }}>
            — A SHOP FOREMAN, PROBABLY
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', placeItems: 'center', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <p className="mono" style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--muted)', marginBottom: 14 }}>
            ── ACCESS ──
          </p>
          <h2 className="serif" style={{ fontSize: 42, fontStyle: 'italic', marginBottom: 8 }}>{title}</h2>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 28 }}>{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
