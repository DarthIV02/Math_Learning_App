import './ProfileStats.css';
import SurfaceCard from '../../components/SurfaceCard/SurfaceCard';

export default function ProfileStats({ xp, streak, solvedTasks }) {
  const stats = [
    { label: 'Coins', value: xp.toString(), icon: '🪙' },
    {
      label: streak === 1 ? 'Tag Streak' : 'Tage Streak',
      value: streak.toString(),
      icon: '🔥',
    },
    {
      label: 'Aufgaben gelöst',
      value: solvedTasks.toString(),
      icon: '✅',
    },
  ];

  return (
    <div className="profile-stats">
      {stats.map((stat) => (
        <SurfaceCard key={stat.label} className="profile-stats__item">
          <div className="profile-stats__icon" aria-hidden="true">
            {stat.icon}
          </div>
          <div className="profile-stats__value">{stat.value}</div>
          <div className="profile-stats__label">{stat.label}</div>
        </SurfaceCard>
      ))}
    </div>
  );
}