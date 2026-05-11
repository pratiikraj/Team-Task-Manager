import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import TaskModal from '../components/TaskModal.jsx';
import MembersPanel from '../components/MembersPanel.jsx';

const COLUMNS = ['To Do', 'In Progress', 'Done'];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  const refresh = async () => {
    try {
      const [{ project }, { tasks }] = await Promise.all([
        api.project(id),
        api.tasks({ project: id })
      ]);
      setProject(project);
      setTasks(tasks);
    } catch (ex) {
      setErr(ex.message);
    }
  };

  useEffect(() => { refresh(); }, [id]);

  const myRole = useMemo(() => {
    if (!project) return null;
    const m = project.members?.find(m => String(m.user?._id || m.user) === String(user.id));
    return m?.role || null;
  }, [project, user]);

  const isAdmin = myRole === 'Admin';

  const tasksByStatus = useMemo(() => {
    const out = { 'To Do': [], 'In Progress': [], 'Done': [] };
    tasks.forEach(t => { (out[t.status] || out['To Do']).push(t); });
    return out;
  }, [tasks]);

  const onDrop = async (taskId, newStatus) => {
    const t = tasks.find(x => x._id === taskId);
    if (!t || t.status === newStatus) return;
    const prev = [...tasks];
    setTasks(tasks.map(x => x._id === taskId ? { ...x, status: newStatus } : x));
    try {
      await api.updateTask(taskId, { status: newStatus });
    } catch (ex) {
      setTasks(prev);
      alert(ex.message);
    }
  };

  if (err) return <div className="container page-pad"><div className="error-banner">{err}</div></div>;
  if (!project) return <div className="container page-pad mono" style={{ fontSize: 12 }}>Loading…</div>;

  return (
    <div className="container page-pad">
      <div style={{ marginBottom: 8 }}>
        <Link to="/projects" className="mono" style={{ fontSize: 11, letterSpacing: '0.15em', color: 'var(--muted)' }}>
          ← BACK TO INDEX
        </Link>
      </div>

      <div className="row-between" style={{ marginBottom: 8, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <p className="eyebrow">Project</p>
          <h1 className="serif" style={{ fontStyle: 'italic', marginBottom: 8 }}>{project.name}</h1>
          {project.description && (
            <p style={{ color: 'var(--ink-soft)', maxWidth: 720 }}>{project.description}</p>
          )}
          <div className="cluster" style={{ marginTop: 12 }}>
            <span className={`tag ${isAdmin ? 'admin' : ''}`}>{myRole}</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
              {project.members.length} members · {tasks.length} tasks
            </span>
          </div>
        </div>
        <div className="cluster">
          <button className="btn secondary" onClick={() => setShowMembers(true)}>Members</button>
          {isAdmin && <button className="btn" onClick={() => setCreating(true)}>New task +</button>}
        </div>
      </div>

      <hr style={{ border: 0, borderTop: '1.5px solid var(--ink)', margin: '24px 0' }} />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16
      }}>
        {COLUMNS.map(col => (
          <Column
            key={col}
            title={col}
            tasks={tasksByStatus[col]}
            onDrop={onDrop}
            onSelect={(t) => setEditing(t)}
            currentUser={user}
            isAdmin={isAdmin}
          />
        ))}
      </div>

      {creating && (
        <TaskModal
          mode="create"
          project={project}
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); refresh(); }}
        />
      )}

      {editing && (
        <TaskModal
          mode="edit"
          task={editing}
          project={project}
          isAdmin={isAdmin}
          currentUser={user}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
        />
      )}

      {showMembers && (
        <MembersPanel
          project={project}
          isAdmin={isAdmin}
          isOwner={String(project.owner?._id || project.owner) === String(user.id)}
          onClose={() => setShowMembers(false)}
          onChanged={refresh}
        />
      )}
    </div>
  );
}

function Column({ title, tasks, onDrop, onSelect, currentUser, isAdmin }) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const taskId = e.dataTransfer.getData('text/plain');
        if (taskId) onDrop(taskId, title);
      }}
      style={{
        border: '1.5px solid var(--ink)',
        background: over ? 'var(--paper-2)' : 'transparent',
        padding: 14,
        minHeight: 400,
        transition: 'background 0.15s'
      }}
    >
      <div className="row-between" style={{ marginBottom: 14 }}>
        <h3 className="serif" style={{ fontStyle: 'italic', fontSize: 22 }}>{title}</h3>
        <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{tasks.length}</span>
      </div>
      <div className="stack" style={{ gap: 10 }}>
        {tasks.length === 0 && (
          <p className="muted" style={{ fontSize: 12, fontStyle: 'italic', textAlign: 'center', padding: 20 }}>
            Nothing here.
          </p>
        )}
        {tasks.map(t => (
          <TaskCard key={t._id} task={t} onClick={() => onSelect(t)} currentUser={currentUser} isAdmin={isAdmin} />
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task, onClick, currentUser, isAdmin }) {
  const canDrag = isAdmin || String(task.assignee?._id) === String(currentUser.id);
  const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';
  const due = task.dueDate ? new Date(task.dueDate) : null;

  return (
    <div
      draggable={canDrag}
      onDragStart={(e) => e.dataTransfer.setData('text/plain', task._id)}
      onClick={onClick}
      style={{
        background: 'var(--paper)',
        border: '1.5px solid var(--ink)',
        padding: 12,
        cursor: canDrag ? 'grab' : 'pointer',
        position: 'relative',
        transition: 'transform 0.1s, box-shadow 0.1s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translate(-2px,-2px)';
        e.currentTarget.style.boxShadow = '3px 3px 0 var(--ink)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <div className="cluster" style={{ marginBottom: 6 }}>
        <span className={`tag ${task.priority.toLowerCase()}`}>{task.priority}</span>
        {overdue && <span className="tag" style={{ background: 'var(--rose)', color: 'var(--paper)', borderColor: 'var(--rose)' }}>Overdue</span>}
      </div>
      <p style={{ fontWeight: 500, fontSize: 14, margin: '4px 0' }}>{task.title}</p>
      <div className="row-between" style={{ marginTop: 8, fontSize: 12 }}>
        <span className="muted" style={{ fontFamily: 'var(--mono)' }}>
          {task.assignee ? task.assignee.name : 'Unassigned'}
        </span>
        {due && (
          <span className="mono" style={{ color: overdue ? 'var(--rose)' : 'var(--muted)', fontSize: 11 }}>
            {due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  );
}
