import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ borderBottom: '1.5px solid var(--ink)' }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 32px'
        }}>
          <div>
            <span className="serif" style={{ fontSize: 26, fontStyle: 'italic', fontWeight: 500 }}>
              Foreman
            </span>
            <span className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', marginLeft: 10, color: 'var(--muted)' }}>
              EST. 2026
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/login" className="btn secondary tiny">Sign in</Link>
            <Link to="/signup" className="btn tiny">Get started</Link>
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: 80, paddingBottom: 60, flex: 1 }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--muted)', marginBottom: 20 }}>
          ── A WORKSHOP FOR TEAMS, NOT A FACTORY ──
        </div>

        <h1 style={{ fontSize: 'clamp(48px, 9vw, 120px)', marginBottom: 24, lineHeight: 0.95 }}>
          Run the work.<br />
          <em style={{ color: 'var(--accent)' }}>Skip the theatre.</em>
        </h1>

        <p style={{
          maxWidth: 580,
          fontSize: 18,
          color: 'var(--ink-soft)',
          marginBottom: 38
        }}>
          A no-frills task manager for small teams. Make a project, invite the people who'll
          actually do the work, hand out the cards, watch them move. That's it.
        </p>

        <div style={{ display: 'flex', gap: 14, marginBottom: 80 }}>
          <Link to="/signup" className="btn">Start a project →</Link>
          <Link to="/login" className="btn secondary">I have an account</Link>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 24,
          borderTop: '1.5px solid var(--ink)',
          paddingTop: 40
        }}>
          {[
            { n: '01', t: 'Projects', d: 'Group work into projects. Admins steer, members ship.' },
            { n: '02', t: 'Tasks', d: 'Title, priority, due date, assignee. Three columns: To Do, Doing, Done.' },
            { n: '03', t: 'Dashboard', d: 'See totals, status, overdues and load per person at a glance.' },
            { n: '04', t: 'Roles', d: 'Admins manage. Members update what they own. No ambiguity.' }
          ].map(f => (
            <div key={f.n}>
              <div className="mono" style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.15em' }}>
                {f.n}
              </div>
              <h3 className="serif" style={{ margin: '8px 0', fontStyle: 'italic' }}>{f.t}</h3>
              <p style={{ color: 'var(--ink-soft)', margin: 0 }}>{f.d}</p>
            </div>
          ))}
        </div>
      </main>

      <footer style={{ borderTop: '1.5px solid var(--ink)', padding: '20px 0' }}>
        <div className="container mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span>FOREMAN / TEAM TASK MGR</span>
          <span style={{ color: 'var(--muted)' }}>BUILT FOR SHIPPING</span>
        </div>
      </footer>
    </div>
  );
}
