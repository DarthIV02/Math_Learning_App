import './styles/HomePage.css';
import BackgroundLayer from '../components/Background/BackgroundLayer';
import BottomNav from '../components/BottomNav/BottomNav';
import SurfaceCard from '../components/SurfaceCard/SurfaceCard';
import StatBubble from '../features/StatBubble/StatBubble';
import StartNow from '../features/StartNow/StartNow';
import UploadProblem from '../features/UploadProblem/UploadProblem';

export default function HomePage({ onNavigate, user, token, onTopicSelect }) {
  return (
    <div className="home-page">
      <BackgroundLayer />

      <div className="home-page__content">
        <header className="home-page__header">
          <div data-tutorial="home-welcome">
            <SurfaceCard soft={true} className='home-page__greeting'>
              <h1 className="home-page__greeting-title">
                Hey {user?.firstName || user?.firstname || 'du'}!
              </h1>
              <p className="home-page__greeting-subtitle">Bereit für eine Knobelei?</p>
            </SurfaceCard>
          </div>
          <StatBubble coins={6} user={user} data-tutorial="stat-bubble"/>
        </header>

        <main className="home-page__scroll">
          <section className="home-page__hero">
            <StartNow user={user} token={token} onTopicSelect={onTopicSelect} />
          </section>

          <section className="home-page__secondary">
            <UploadProblem />
          </section>
        </main>
      </div>
      
      <nav className="home-page__nav">
        <BottomNav onNavigate={onNavigate} activePage="home" />
      </nav>
    </div>
  );
}