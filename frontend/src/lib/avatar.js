const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : `${window.location.protocol}//${window.location.hostname}:3001`;

const DEFAULT_AVATAR = '/uploads/avatars/StudentAvatarPlaceholder.png';

export function getAvatarSrc(user) {
  const savedAvatar = localStorage.getItem('avatarUrl');
  const avatarUrl = user?.avatarUrl || savedAvatar || DEFAULT_AVATAR;

  if (avatarUrl.startsWith('http')) return avatarUrl;

  return `${API_BASE}${avatarUrl}`;
}

export function saveAvatarUrl(avatarUrl) {
  localStorage.setItem('avatarUrl', avatarUrl);
  window.dispatchEvent(new Event('avatar-updated'));
}

export function clearAvatarUrl() {
  localStorage.removeItem('avatarUrl');
}