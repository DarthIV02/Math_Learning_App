import './SurfaceCard.css';

export default function SurfaceCard({ children, soft = false, className = '' }) {
  return (
    <div className={`surface-card ${soft ? 'surface-card--soft' : ''} ${className}`}>
      {children}
    </div>
  );
}