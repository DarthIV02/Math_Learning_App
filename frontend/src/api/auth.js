const API_PROTOCOL = window.location.protocol;
const API_HOST = window.location.hostname;
const BASE_URL =
  import.meta.env.VITE_API_URL || `${API_PROTOCOL}//${API_HOST}:3001/api`;

export async function registerStudent({ firstName, lastName, email, password, grade }) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName, lastName, email, password, grade }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function registerClass({ className, grade, students }) {
  const res = await fetch(`${BASE_URL}/auth/register_class`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ className, grade, students }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function loginUser({ email, password }) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Login fehlgeschlagen.');
  }

  return result;
}