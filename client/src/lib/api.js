const BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export async function fetchApi(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
  }
  if (res.status === 204) return; // Handle no content
  return res.json();
}