import './StatBubble.css';
import SurfaceCard from '../../components/SurfaceCard/SurfaceCard.jsx';
import { getAvatarSrc } from '../../lib/avatar';
import { useEffect, useState } from 'react';

export default function StatBubble({ user }) {
  const [avatar, setAvatar] = useState(getAvatarSrc());

  useEffect(() => {
    setAvatar(getAvatarSrc(user));
  }, [user]);

  return (
    <SurfaceCard className='stat-bubble' soft={true}>
      <div className="stat-bubble__pill">
        <span className="stat-bubble__icon">🪙</span>
        <span className="stat-bubble__value">{user.coins}</span>
      </div>

      <div className="stat-bubble__divider" />

      <div className="stat-bubble__avatar-shell">
        <div className="stat-bubble__avatar-inner">
          <img
            src={avatar}
            alt="Kinderprofil"
            className="stat-bubble__avatar"
          />
        </div>
      </div>
    </SurfaceCard>
  );
}