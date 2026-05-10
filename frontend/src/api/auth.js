const BASE_URL = import.meta.env.VITE_API_URL || 'https://172.24.220.6:3001/api';;

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