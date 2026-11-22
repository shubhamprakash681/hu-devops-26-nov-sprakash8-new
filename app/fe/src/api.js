const baseUrl = () => (window.APP_CONFIG && window.APP_CONFIG.apiUrl) || '';

async function request(path, { token, ...options } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${baseUrl()}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

export const login = (username, password) =>
  request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });

export const listItems = (search = '') => request(`/api/items?search=${encodeURIComponent(search)}`);

export const addItem = (token, item) => request('/api/items', { method: 'POST', token, body: JSON.stringify(item) });

export const deleteItem = (token, id) => request(`/api/items/${id}`, { method: 'DELETE', token });

export const health = () => request('/api/health/db');
