import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [scope, setScope] = useState('');
  const [err, setErr] = useState('');

  const load = async (projectId = '') => {
    try {
      const [d, p] = await Promise.all([
        api.dashboard(projectId || null),
        api.projects()
      ]);
      setStats(d);
      setProjects(p.projects);
    } catch (ex) {
      setErr(ex.message);
    }
  };

  useEffect(() => { load(scope); }, [scope]);

  if (err) return <div className="container page-pad"><div className="error-banner">{err}</div></div>;
  if (!stats) return <div className="container page-pad mono" style={{ fontSize: 12 }}>Loading…</div>;

  const { total, byStatus, perUser, overdue } = stats;
  const doneRatio = total ? Math.round((byStatus['Done'] / total) * 100) : 0;

  return (
    <div className="container page-pad">
      <div className="row-between" style={{ marginBottom: 32 }}>
        <div>
          <p className="eyebrow">Greetings, {user?.name?.split(' ')[0]?.toLowerCase()}</p>
          <h1 className="serif" style={{ fontStyle: 'italic' }}>The workshop floor.</h1>
        </div>
        <select value={scope} onChange={e => setScope(e.target.value)} style={{ maxWidth: 260 }}>
          <option value="">All projects</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>

      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 18,
        marginBottom: 32
      }}>
        <StatCard label="Total tasks" value={total} accent="ink" />
        <StatCard label="In progress" value={byStatus['In Progress']} accent="ochre" />
        <StatCard label="Done" value={byStatus['Done']} hint={`${doneRatio}% of total`} accent="moss" />
        <StatCard label="Overdue" value={overdue} accent="rose" />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18, marginBottom: 32 }}>
        <div className="card">
          <p className="eyebrow" style={{ marginBottom: 14 }}>By status</p>
          <StatusBars byStatus={byStatus} total={total} />
        </div>

        <div className="card">
          <p className="eyebrow" style={{ marginBottom: 14 }}>Load per person</p>
          {perUser.length === 0 && <p className="muted" style={{ fontSize: 13 }}>No tasks yet.</p>}
          <div className="stack">
            {perUser.slice(0, 8).map((u, i) => {
              const max = Math.max(...perUser.map(p => p.count), 1);
              const w = (u.count / max) * 100;
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span>{u.name}</span>
                    <span className="mono">{u.count}</span>
                  </div>
                  <div style={{ background: 'var(--paper-2)', height: 8, border: '1px solid var(--ink)' }}>
                    <div style={{
                      width: `${w}%`,
                      height: '100%',
                      background: 'var(--accent)',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section>
        <div className="row-between" style={{ marginBottom: 14 }}>
          <h3 className="serif" style={{ fontStyle: 'italic', fontSize: 26 }}>Your projects</h3>
          <Link to="/projects" className="btn tiny secondary">View all →</Link>
        </div>
        {projects.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ marginBottom: 14 }}>You're not in any projects yet.</p>
            <Link to="/projects" className="btn">Create your first project</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {projects.slice(0, 6).map(p => (
              <Link key={p._id} to={`/projects/${p._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card" style={{ minHeight: 110, transition: 'transform 0.12s, box-shadow 0.12s', cursor: 'pointer' }}
                     onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '4px 4px 0 var(--accent)'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                  <div className="row-between" style={{ alignItems: 'flex-start' }}>
                    <h3 className="serif" style={{ fontStyle: 'italic' }}>{p.name}</h3>
                    {p.members?.some(m => String(m.user?._id || m.user) === String(user.id) && m.role === 'Admin') &&
                      <span className="tag admin">Admin</span>}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '6px 0 12px' }}>
                    {p.description || <em className="muted">No description</em>}
                  </p>
                  <p className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {p.members?.length || 0} members
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, hint, accent }) {
  const accentColor = {
    ink: 'var(--ink)',
    ochre: 'var(--ochre)',
    moss: 'var(--moss)',
    rose: 'var(--rose)'
  }[accent] || 'var(--ink)';

  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 4,
        height: '100%',
        background: accentColor
      }} />
      <p className="eyebrow" style={{ marginBottom: 6 }}>{label}</p>
      <div className="serif" style={{ fontSize: 48, fontWeight: 400, lineHeight: 1 }}>{value}</div>
      {hint && <p className="mono" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>{hint}</p>}
    </div>
  );
}

function StatusBars({ byStatus, total }) {
  const items = [
    { key: 'To Do', color: '#e8e1cc' },
    { key: 'In Progress', color: '#f5d57a' },
    { key: 'Done', color: '#b8c89e' }
  ];
  return (
    <div className="stack">
      {items.map(({ key, color }) => {
        const v = byStatus[key] || 0;
        const pct = total ? Math.round((v / total) * 100) : 0;
        return (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span>{key}</span>
              <span className="mono">{v} · {pct}%</span>
            </div>
            <div style={{ background: 'var(--paper-2)', height: 14, border: '1px solid var(--ink)' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.4s' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
