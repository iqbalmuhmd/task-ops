const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function req(path, method = 'GET', body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  getTasks:      ()         => req('/tasks'),
  createTask:    (data)     => req('/tasks', 'POST', data),
  updateTask:    (id, data) => req(`/tasks/${id}`, 'PATCH', data),
  deleteTask:    (id)       => req(`/tasks/${id}`, 'DELETE'),
};
