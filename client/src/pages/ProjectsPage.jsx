import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    api.projects()
      .then(({ projects }) => setProjects(projects))
      .catch(e => setErr(e.message));
  };

  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true); setErr('');
    try {
      await api.createProject({ name: name.trim(), description: desc.trim() });
      setName(''); setDesc(''); setShowForm(false);
      load();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  const del = async (id) => {
    if (!confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    try {
      await api.deleteProject(id);
      load();
    } catch (ex) {
      alert(ex.message);
    }
  };

  return (
    <div className="container page-pad">
      <div className="row-between" style={{ marginBottom: 22 }}>
        <div>
          <p className="eyebrow">Index</p>
          <h1 className="serif" style={{ fontStyle: 'italic' }}>Projects</h1>
        </div>
        <button className="btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New project +'}
        </button>
      </div>

      {err && <div className="error-banner">{err}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 24, background: 'var(--paper-2)' }}>
          <form onSubmit={submit} className="stack">
            <div>
              <label>Project name</label>
              <input value={name} onChange={e => setName(e.target.value)} required maxLength={120} autoFocus />
            </div>
            <div>
              <label>Description (optional)</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} maxLength={1000} />
            </div>
            <div>
              <button className="btn" disabled={busy} type="submit">
                {busy ? 'Creating…' : 'Create project'}
              </button>
            </div>
          </form>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <p className="serif" style={{ fontSize: 22, fontStyle: 'italic', marginBottom: 8 }}>
            Nothing here yet.
          </p>
          <p className="muted">Spin up your first project to get going.</p>
        </div>
      ) : (
        <div className="stack" style={{ gap: 14 }}>
          {projects.map(p => {
            const myRole = p.members?.find(m => String(m.user?._id || m.user) === String(user.id))?.role || 'Member';
            return (
              <div key={p._id} className="card" style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 18,
                alignItems: 'center'
              }}>
                <div>
                  <div className="cluster" style={{ marginBottom: 6 }}>
                    <Link to={`/projects/${p._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h3 className="serif" style={{ fontStyle: 'italic' }}>{p.name}</h3>
                    </Link>
                    <span className={`tag ${myRole === 'Admin' ? 'admin' : ''}`}>{myRole}</span>
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: '4px 0 8px' }}>
                    {p.description || <em className="muted">No description</em>}
                  </p>
                  <p className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {p.members?.length || 0} members · created {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="cluster">
                  <Link to={`/projects/${p._id}`} className="btn tiny secondary">Open →</Link>
                  {String(p.owner?._id || p.owner) === String(user.id) && (
                    <button className="btn tiny danger" onClick={() => del(p._id)}>Delete</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
