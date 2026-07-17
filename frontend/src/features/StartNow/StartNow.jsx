import { useEffect, useState } from 'react';

import './StartNow.css';

import SurfaceCard from '../../components/SurfaceCard/SurfaceCard.jsx';
import PlayfulButton from '../../components/Buttons/PlayfulButton';

import { fetchTargetProfile } from '../../api/users';

import { capitalizeFirstLetter } from '../../utils/stringManage';

export default function StartNow({ user, token, onTopicSelect }) {
  const [targetProfile, setTargetProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const completedTasks = 2;
  const totalTasks = 3;
  const progressPercent = (completedTasks / totalTasks) * 100;

  const germanOperationNames = {"addition": "Addition", "subtraction": "Subtraktion", "multiplication": "Multiplikation", "division": "Division"};

  useEffect(() => {
    let cancelled = false;

    async function loadTargetProfile() {
      try {
        setLoading(true);
        const profile = await fetchTargetProfile(token);
        console.log('Fetched target profile:', profile);
        if (!cancelled) setTargetProfile(profile);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTargetProfile();
    return () => { cancelled = true; };
  }, [token]);

  return (
    <SurfaceCard className="start-now">
      <h2 className="start-now__title">Genau richtig für dich!</h2>

      <div className="start-now__topic-row">
        <span className="start-now__goal-label" aria-hidden="true">📘</span>
        <div className="start-now__topic-text">
          <span className="start-now__topic-main">
            {loading ? '...' : capitalizeFirstLetter(targetProfile?.operation ? germanOperationNames[targetProfile.operation] : targetProfile.theme)}
          </span>
          <span className="start-now__topic-level">
            {targetProfile?.difficulty === 'easy' && '(⭐☆☆)'}
            {targetProfile?.difficulty === 'medium' && '(⭐⭐☆)'}
            {targetProfile?.difficulty === 'hard' && '(⭐⭐⭐)'}
          </span>
        </div>
      </div>

      <div className="start-now__goal">
        <span className="start-now__goal-label">🎯 Tagesziel</span>
        <div
          className="start-now__goal-bar"
          role="progressbar"
          aria-valuenow={completedTasks}
          aria-valuemin="0"
          aria-valuemax={totalTasks}
        >
          <div
            className="start-now__goal-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="start-now__goal-text">Nur noch 1 Aufgabe bis zum Ziel!</p>
      </div>

      <PlayfulButton
        label="Weiter machen!"
        icon="🚀"
        color="green"
        size="md"
        onClick={() => onTopicSelect({ ...targetProfile })}
        disabled={loading || !!error}
      />
    </SurfaceCard>
  );
}