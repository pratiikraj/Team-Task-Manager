import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { AuthFrame } from './LoginPage.jsx';

export default function SignupPage() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (pwd.length < 6) { setErr('Password must be at least 6 characters'); return; }
    setErr(''); setBusy(true);
    try {
      await signup(name, email, pwd);
      nav('/dashboard');
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame title="Pull up a chair" subtitle="Make an account to spin up your first project.">
      <form onSubmit={submit} className="stack">
        {err && <div className="error-banner">{err}</div>}
        <div>
          <label>Your name</label>
          <input value={name} onChange={e => setName(e.target.value)} required minLength={2} />
        </div>
        <div>
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div>
          <label>Password</label>
          <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} required minLength={6} autoComplete="new-password" />
        </div>
        <button className="btn" type="submit" disabled={busy} style={{ justifyContent: 'center', marginTop: 6 }}>
          {busy ? 'Creating…' : 'Create account →'}
        </button>
        <p style={{ fontSize: 13, marginTop: 8 }}>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </AuthFrame>
  );
}
