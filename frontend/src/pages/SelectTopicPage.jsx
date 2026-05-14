import './styles/SelectTopicPage.css';
import { DifficultyProvider } from '../context/DifficultyContext';

import BackgroundLayer from '../components/Background/BackgroundLayer';
import BottomNav from '../components/BottomNav/BottomNav';
import SurfaceCard from '../components/SurfaceCard/SurfaceCard';

import StatBubble from '../features/StatBubble/StatBubble';
import TopicSelector from '../features/TopicSelector/TopicSelector';
import hedgehog from '../assets/images/hedgehog_v2.png';

export default function SelectTopicPage({ onNavigate, user }) {
  return (
    <DifficultyProvider>
      <div className="select-topic-page">
        <BackgroundLayer />

        <div className="select-topic-page__content">
            <header className="select-topic__toprow">
              <SurfaceCard className="diff-header" soft={true}>
                <img src={hedgehog} className="diff-header__img" alt="Hedgehog" />
                <div className="diff-header__label">
                  <strong>Schwierigkeitsgrad wählen</strong>
                  <span>Du kannst ihn jederzeit ändern!</span>
                </div>
              </SurfaceCard>
              <StatBubble coins={6} user={user}/>
            </header>

          <main className="select-topic-page__main">
            <TopicSelector />
          </main>

          <BottomNav onNavigate={onNavigate} activePage="select-topic" />

        </div>
      </div>
    </DifficultyProvider>
  );
}