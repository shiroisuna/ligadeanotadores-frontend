const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function obtenerToken() {
  return localStorage.getItem('liga_token');
}

async function peticion(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = obtenerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || `Error ${res.status}`);
  }
  return data;
}

// Métodos de lectura (públicos, sin token)
async function subirImagen(path, file) {
  const formData = new FormData();
  formData.append('imagen', file);

  const headers = {};
  const token = obtenerToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { method: 'POST', headers, body: formData });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
  return data; // { url }
}

export const api = {
  get: (path) => peticion(path),
  getAuth: (path) => peticion(path, { auth: true }),
  post: (path, body) => peticion(path, { method: 'POST', body, auth: true }),
  put: (path, body) => peticion(path, { method: 'PUT', body, auth: true }),
  delete: (path) => peticion(path, { method: 'DELETE', auth: true }),
  subirImagen,
  // login no manda token (todavía no lo tenemos)
  login: (email, password) => peticion('/auth/login', { method: 'POST', body: { email, password } }),
};

export { obtenerToken };
