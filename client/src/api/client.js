const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const tokenStore = {
  get: () => localStorage.getItem('ttm_token'),
  set: (t) => localStorage.setItem('ttm_token', t),
  clear: () => localStorage.removeItem('ttm_token')
};

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  let data = null;
  try { data = await res.json(); } catch (_) {}

  if (!res.ok) {
    const msg = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  signup: (body) => request('/auth/signup', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  me: () => request('/auth/me'),

  projects: () => request('/projects'),
  project: (id) => request(`/projects/${id}`),
  createProject: (body) => request('/projects', { method: 'POST', body }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
  addMember: (id, body) => request(`/projects/${id}/members`, { method: 'POST', body }),
  removeMember: (id, userId) => request(`/projects/${id}/members/${userId}`, { method: 'DELETE' }),

  tasks: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/tasks${qs ? `?${qs}` : ''}`);
  },
  createTask: (body) => request('/tasks', { method: 'POST', body }),
  updateTask: (id, body) => request(`/tasks/${id}`, { method: 'PATCH', body }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),

  dashboard: (project) => {
    const qs = project ? `?project=${project}` : '';
    return request(`/dashboard${qs}`);
  },

  searchUsers: (q) => request(`/users/search?q=${encodeURIComponent(q)}`)
};

export { tokenStore };
