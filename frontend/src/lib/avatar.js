import studentAvatar from '../assets/icons/studentAvatarPlaceholder.png';
import studentFemaleAvatar from '../assets/icons/female_AvatarPlaceholder.png';

export function getAvatarSrc() {
  const gender = "male"; // Change to API call or hook
  if (gender === 'female') return studentFemaleAvatar;
  return studentAvatar; // default fallback
}