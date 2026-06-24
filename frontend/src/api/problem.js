const API_PROTOCOL = window.location.protocol;
const API_HOST = window.location.hostname;

const BASE_URL =
  import.meta.env.VITE_API_URL || `${API_PROTOCOL}//${API_HOST}:3001/api`;

export async function fetchProblems({
  operation,
  theme,
  difficulty,
  grade,
}) {
  const params = new URLSearchParams();

  if (operation) params.set('operation', operation);
  if (theme) params.set('theme', theme);
  if (difficulty) params.set('difficulty', difficulty);
  if (grade) params.set('grade', grade);
  params.set('unsolvedOnly', true);

  console.log('Fetching problems with params:', Object.fromEntries(params.entries()));

  const token = localStorage.getItem('token');

  const res = await fetch(`${BASE_URL}/problems?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Aufgaben konnten nicht geladen werden.');
  }

  if (!data.length) {
    throw new Error('Keine Aufgaben für dieses Thema gefunden.');
  }

  return data;
}

export async function fetchGenerationStatus(requestId) {
  const token = localStorage.getItem('token');

  const res = await fetch(`${BASE_URL}/problems/generation-status?requestId=${requestId}`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
  });

  const data = await res.json();

  console.log(data)

  if (!res.ok) throw new Error(data.error || 'Status konnte nicht geladen werden.');
  return data;
}