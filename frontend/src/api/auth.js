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

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Registration failed');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${className}_credentials.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(url);

  return { success: true };
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

export async function qrLogin(qrToken) {
  const response = await fetch(`${BASE_URL}/auth/qr`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ qr_token: qrToken }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'QR Login fehlgeschlagen.');
  }

  return result;
}

export async function guestLogin() {
  const response = await fetch(`${BASE_URL}/auth/anonymous`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ display_name: 'Gast' }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Gast-Login fehlgeschlagen.');
  }

  return result;
}