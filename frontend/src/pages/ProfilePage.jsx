import { useState, useEffect } from 'react';

import BackgroundLayer from '../components/Background/BackgroundLayer';
import BottomNav from '../components/BottomNav/BottomNav';

import ProfileCard from '../features/Profile/ProfileCard';
import ProfileEditForm from '../features/Profile/ProfileEditForm';
import ProfileStats from '../features/Profile/ProfileStats';

import './styles/ProfilePage.css';

export default function ProfilePage({ onNavigate, user, onUserUpdate }) {
  const {
    firstName = '',
    lastName = '',
    email = '',
    grade = '',
    streak = 0,
    xp = 0,
    solvedTasks = 0,
  } = user || {};

  const [profile, setProfile] = useState({
    firstName,
    lastName,
    email,
    grade,
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setProfile((prev) => ({
      ...prev,
      firstName,
      lastName,
      email,
      grade,
    }));
  }, [firstName, lastName, email, grade]);

  const handleChange = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setMessage(null);

    if (profile.newPassword && profile.newPassword !== profile.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwörter stimmen nicht überein.' });
      return;
    }

    setLoading(true);

    try {
      await onUserUpdate?.({
        ...user,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        grade: profile.grade,
        newPassword: profile.newPassword,
      });

      setMessage({ type: 'success', text: 'Profil erfolgreich aktualisiert.' });

      setProfile((prev) => ({
        ...prev,
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.message || 'Profil konnte nicht aktualisiert werden.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <BackgroundLayer />

      <div className="profile-page__content">
        <main className="profile-page__scroll">
          <div className="profile-page__stack">
            <ProfileCard
              firstName={profile.firstName}
              lastName={profile.lastName}
              email={profile.email}
            />

            <ProfileStats
              xp={xp}
              streak={streak}
              solvedTasks={solvedTasks}
            />

            <ProfileEditForm
              profile={profile}
              onChange={handleChange}
              onSave={handleSave}
              loading={loading}
              message={message}
            />
          </div>
        </main>

        <nav className="profile-page__nav">
          <BottomNav onNavigate={onNavigate} activePage="profile" />
        </nav>
      </div>
    </div>
  );
}