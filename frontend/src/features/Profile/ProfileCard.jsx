import './ProfileCard.css';
import SurfaceCard from '../../components/SurfaceCard/SurfaceCard';
import { getAvatarSrc } from '../../lib/avatar';

export default function ProfileCard({ firstName, lastName, email }) {
  const avatar = getAvatarSrc();

  return (
    <SurfaceCard className="profile-card">
      <img
        src={avatar}
        alt="Avatar"
        className="profile-card__avatar"
      />

      <div className="profile-card__info">
        <p className="profile-card__name">
          {firstName} {lastName}
        </p>
        <p className="profile-card__email">{email}</p>
      </div>
    </SurfaceCard>
  );
}