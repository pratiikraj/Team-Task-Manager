import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function TaskModal({ mode, task, project, isAdmin, currentUser, onClose, onSaved }) {
  const init = task || {};
  const [title, setTitle] = useState(init.title || '');
  const [description, setDescription] = useState(init.description || '');
  const [priority, setPriority] = useState(init.priority || 'Medium');
  const [status, setStatus] = useState(init.status || 'To Do');
  const [assignee, setAssignee] = useState(init.assignee?._id || '');
  const [dueDate, setDueDate] = useState(init.dueDate ? init.dueDate.slice(0, 10) : '');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const canEdit = mode === 'create' ? isAdmin : isAdmin || String(task.assignee?._id) === String(currentUser?.id);
  const memberOnlyEdit = !isAdmin && mode === 'edit';

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      if (mode === 'create') {
        await api.createTask({
          project: project._id,
          title: title.trim(),
          description,
          priority,
          status,
          assignee: assignee || null,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null
        });
      } else {
        const payload = memberOnlyEdit
          ? { status }
          : {
              title: title.trim(),
              description,
              priority,
              status,
              assignee: assignee || null,
              dueDate: dueDate ? new Date(dueDate).toISOString() : null
            };
        await api.updateTask(task._id, payload);
      }
      onSaved();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.deleteTask(task._id);
      onSaved();
    } catch (ex) { alert(ex.message); }
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
          width: '100%', maxWidth: 560,
          maxHeight: '90vh', overflowY: 'auto',
          padding: 28,
          boxShadow: '6px 6px 0 var(--accent)'
        }}>
        <div className="row-between" style={{ marginBottom: 18 }}>
          <p className="eyebrow">{mode === 'create' ? 'New task' : 'Edit task'}</p>
          <button onClick={onClose} className="mono" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>

        {memberOnlyEdit && (
          <p className="mono" style={{ fontSize: 11, color: 'var(--accent-deep)', marginBottom: 12 }}>
            You can update the status of this task.
          </p>
        )}

        <form onSubmit={save} className="stack">
          {err && <div className="error-banner">{err}</div>}

          <div>
            <label>Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              required maxLength={200}
              disabled={memberOnlyEdit}
              autoFocus
            />
          </div>

          <div>
            <label>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={4000}
              disabled={memberOnlyEdit}
              rows={3}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} disabled={memberOnlyEdit}>
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
            </div>
            <div>
              <label>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}>
                <option>To Do</option><option>In Progress</option><option>Done</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label>Assignee</label>
              <select value={assignee} onChange={e => setAssignee(e.target.value)} disabled={memberOnlyEdit}>
                <option value="">— Unassigned —</option>
                {project.members.map(m => (
                  <option key={m.user._id || m.user} value={m.user._id || m.user}>
                    {m.user.name || 'User'} {m.role === 'Admin' ? '(Admin)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Due date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} disabled={memberOnlyEdit} />
            </div>
          </div>

          <div className="row-between" style={{ marginTop: 8 }}>
            <div>
              {mode === 'edit' && isAdmin && (
                <button type="button" className="btn tiny danger" onClick={del}>Delete</button>
              )}
            </div>
            <div className="cluster">
              <button type="button" className="btn secondary tiny" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn" disabled={busy || !canEdit}>
                {busy ? 'Saving…' : mode === 'create' ? 'Create task' : 'Save changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
