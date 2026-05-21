const BASE_URL = 'https://unimate.runasp.net/api';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });

  if (res.status === 401) {
    const error = await res.json().catch(() => null);
    const errorMessage = error?.errorMessage || error?.message || 'Invalid email or password.';
    const isAuthRequest = path.includes('/Authentication/');
    const hasToken = !!localStorage.getItem('token');
    if (!isAuthRequest && hasToken) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error(errorMessage);
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));

    // Backend returns errors as array of strings: { errors: ["msg1", "msg2"] }
    if (Array.isArray(error.errors)) {
      throw new Error(error.errors.join(' | '));
    }

    // ASP.NET validation errors as object: { errors: { Field: ["msg"] } }
    if (error.errors && typeof error.errors === 'object') {
      const messages = Object.values(error.errors)
        .flat()
        .join(' | ');
      throw new Error(messages);
    }

    throw new Error(error.errorMessage || error.message || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// Shared multipart upload logic — supports both POST and PUT
async function multipartRequest<T>(path: string, method: 'POST' | 'PUT', formData: FormData): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired.');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));

    if (Array.isArray(error.errors)) {
      throw new Error(error.errors.join(' | '));
    }
    if (error.errors && typeof error.errors === 'object') {
      const messages = Object.values(error.errors).flat().join(' | ');
      throw new Error(messages);
    }

    throw new Error(error.errorMessage || error.message || `Upload failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get:    <T>(path: string)                => request<T>(path),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: <T>(path: string)                => request<T>(path, { method: 'DELETE' }),
  patch:  <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH',  body: JSON.stringify(body) }),

  // Multipart POST — create listing
  upload:    <T>(path: string, formData: FormData) => multipartRequest<T>(path, 'POST', formData),

  // Multipart PUT — edit listing or room (fixes 405 Method Not Allowed)
  uploadPut: <T>(path: string, formData: FormData) => multipartRequest<T>(path, 'PUT',  formData),
};
