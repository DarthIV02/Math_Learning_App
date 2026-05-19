const API_PROTOCOL = window.location.protocol;
const API_HOST = window.location.hostname;

const BASE_URL =
  import.meta.env.VITE_API_URL || `${API_PROTOCOL}//${API_HOST}:3001/api`;

export async function fetchProblems({
  operation_id,
  theme_id,
  difficulty,
  grade,
}) {
  const params = new URLSearchParams();

  if (operation_id) params.set('operation_id', operation_id);
  if (theme_id) params.set('theme_id', theme_id);
  if (difficulty) params.set('difficulty', difficulty);
  if (grade) params.set('grade', grade);

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