import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function MembersPanel({ project, isAdmin, isOwner, onClose, onChanged }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const add = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      await api.addMember(project._id, { email: email.trim().toLowerCase(), role });
      setEmail('');
      onChanged();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (userId) => {
    if (!confirm('Remove this member from the project?')) return;
    try {
      await api.removeMember(project._id, userId);
      onChanged();
    } catch (ex) {
      alert(ex.message);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(26,22,18,0.55)',
        backdropFilter: 'blur(2px)',
        display: 'grid', placeItems: 'center',
        zIndex: 100, padding: 20
      }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--paper)',
          border: '1.5px solid var(--ink)',
          width: '100%', maxWidth: 520,
          maxHeight: '90vh', overflowY: 'auto',
          padding: 28,
          boxShadow: '6px 6px 0 var(--ochre)'
        }}>
        <div className="row-between" style={{ marginBottom: 18 }}>
          <div>
            <p className="eyebrow">Crew</p>
            <h3 className="serif" style={{ fontStyle: 'italic', fontSize: 26 }}>Project members</h3>
          </div>
          <button onClick={onClose} className="mono" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>

        {isAdmin && (
          <form onSubmit={add} style={{ marginBottom: 18, padding: 14, background: 'var(--paper-2)', border: '1.5px solid var(--ink)' }}>
            {err && <div className="error-banner">{err}</div>}
            <label>Add by email</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px auto', gap: 8 }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="person@example.com"
                required
              />
              <select value={role} onChange={e => setRole(e.target.value)}>
                <option>Member</option><option>Admin</option>
              </select>
              <button className="btn tiny" type="submit" disabled={busy}>
                {busy ? '…' : 'Add'}
              </button>
            </div>
            <p className="mono" style={{ fontSize: 10, color: 'var(--muted)', marginTop: 8 }}>
              The user must already have a Foreman account.
            </p>
          </form>
        )}

        <div className="stack" style={{ gap: 8 }}>
          {project.members.map(m => {
            const ownerOfThis = String(project.owner?._id || project.owner) === String(m.user._id || m.user);
            return (
              <div key={m.user._id || m.user} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                border: '1.5px solid var(--ink)',
                background: 'var(--paper)'
              }}>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <strong style={{ fontSize: 14 }}>{m.user.name}</strong>
                    <span className={`tag ${m.role === 'Admin' ? 'admin' : ''}`}>{m.role}</span>
                    {ownerOfThis && <span className="mono" style={{ fontSize: 10, color: 'var(--accent-deep)' }}>OWNER</span>}
                  </div>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{m.user.email}</span>
                </div>
                {isAdmin && !ownerOfThis && (
                  <button className="btn tiny danger" onClick={() => remove(m.user._id || m.user)}>
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
