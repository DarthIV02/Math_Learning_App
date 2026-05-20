const API_PROTOCOL = window.location.protocol;
const API_HOST = window.location.hostname;

const BASE_URL =
  import.meta.env.VITE_API_URL || `${API_PROTOCOL}//${API_HOST}:3001/api`;

// Exported so the hook can use it for sendBeacon
export const PROGRESS_URL = `${BASE_URL}/progress`;

export async function flushAttempts(attempts, token) {
  const response = await fetch(PROGRESS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ attempts }),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || 'Failed to save attempts');
  }

  return response.json();
}