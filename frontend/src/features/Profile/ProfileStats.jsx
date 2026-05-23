import './ProfileStats.css';
import SurfaceCard from '../../components/SurfaceCard/SurfaceCard';

export default function ProfileStats({
    coins = 0,
    streak = 0,
    solvedTasks = 0,
  }) {
    const stats = [
      { label: 'Coins', value: String(coins), icon: '🪙' },
      {
        label: streak === 1 ? 'Tag Streak' : 'Tage Streak',
        value: String(streak),
        icon: '🔥',
      },
      {
        label: 'Aufgaben gelöst',
        value: String(solvedTasks),
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