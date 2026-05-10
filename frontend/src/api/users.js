const BASE_URL = import.meta.env.VITE_API_URL || 'https://172.24.220.6:3001/api';

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