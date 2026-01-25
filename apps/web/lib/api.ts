export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function fetchWithAuth(url: string, token: string | null, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
     const error = await res.json().catch(() => ({ error: 'Unknown error' }));
     throw new Error(error.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}
