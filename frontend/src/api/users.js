const API_PROTOCOL = window.location.protocol;
const API_HOST = window.location.hostname; 
const BASE_URL =
  import.meta.env.VITE_API_URL || `${API_PROTOCOL}//${API_HOST}:3001/api`;

export async function updateUser(userId, data, token) {
  const response = await fetch(`${BASE_URL}/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Profil konnte nicht aktualisiert werden.');
  }

  return result.user || result;
}