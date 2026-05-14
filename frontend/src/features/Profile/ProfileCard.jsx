import './ProfileCard.css';
import SurfaceCard from '../../components/SurfaceCard/SurfaceCard';
import { getAvatarSrc } from '../../lib/avatar';

export default function ProfileCard({
  firstName,
  lastName,
  email,
  avatarSrc,
  onAvatarChange,
}) {
  const avatar = avatarSrc || getAvatarSrc();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onAvatarChange?.(file);
  };

  return (
    <SurfaceCard className="profile-card">
      <div className="profile-card__avatar-wrapper">
        <img
          src={avatar}
          alt="Avatar"
          className="profile-card__avatar"
        />

        {/* Hidden file input — triggered by the button below */}
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          className="profile-card__avatar-input"
          onChange={handleFileChange}
        />

        {/* Camera badge — always visible, works on touch + mouse */}
        <label
          htmlFor="avatar-upload"
          className="profile-card__avatar-edit"
          aria-label="Change profile picture"
        >
          {/* SVG camera icon or use your icon library */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </label>
      </div>

      <div className="profile-card__info">
        <p className="profile-card__name">{firstName} {lastName}</p>
        <p className="profile-card__email">{email}</p>
      </div>
    </SurfaceCard>
  );
}