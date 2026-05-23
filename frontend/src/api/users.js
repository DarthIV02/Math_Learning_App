const API_PROTOCOL = window.location.protocol;
const API_HOST = window.location.hostname;

const BASE_URL =
  import.meta.env.VITE_API_URL || `${API_PROTOCOL}//${API_HOST}:3001/api`;

const API_ORIGIN = BASE_URL.replace('/api', '');

export function getFullAvatarUrl(avatarUrl) {
  if (!avatarUrl) return null;

  if (avatarUrl.startsWith('http')) {
    return avatarUrl;
  }

  return `${API_ORIGIN}${avatarUrl}`;
}

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

export async function fetchCurrentUser(token) {
  const response = await fetch(`${BASE_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'User konnte nicht geladen werden.');
  }

  return result;
}

export async function uploadAvatar(file, token) {
  const formData = new FormData();
  formData.append('avatar', file);

  const res = await fetch(`${BASE_URL}/users/me/avatar`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Avatar upload failed');
  }

  return data;
}

export async function awardProblemCoins(problemId, amount, token) {
  const response = await fetch(`${BASE_URL}/users/me/coins/award`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      problemId,
      amount,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Coins konnten nicht aktualisiert werden.');
  }

  return result.user || result;
}