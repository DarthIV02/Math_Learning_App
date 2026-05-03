import { useState, useEffect } from 'react';

import BackgroundLayer from '../components/Background/BackgroundLayer';
import BottomNav from '../components/BottomNav/BottomNav';

import ProfileCard from '../features/Profile/ProfileCard';
import ProfileEditForm from '../features/Profile/ProfileEditForm';
import ProfileStats from '../features/Profile/ProfileStats';

import './styles/ProfilePage.css';

export default function ProfilePage({ onNavigate, ...props }) {
  const {
    firstName,
    lastName,
    email,
    role,
    classGrade,
    classLabel,
    streak = 0,
    xp = 0,
    solvedTasks = 0,
    gender,
  } = props;

  const classDisplayName = classLabel || (classGrade ? `${classGrade}` : '');

  const [profile, setProfile] = useState({
    firstName: firstName ?? 'Max',
    lastName: lastName ?? 'Mustermann',
    email: email ?? 'max@example.com',
    role: role ?? 'student',
    klasse: classDisplayName,
    gender: gender ?? 'male',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const updatedClass = classLabel || (classGrade ? `${classGrade}` : '');

    setProfile((prev) => ({
      ...prev,
      firstName: firstName ?? prev.firstName,
      lastName: lastName ?? prev.lastName,
      email: email ?? prev.email,
      role: role ?? prev.role,
      klasse: updatedClass || prev.klasse,
      gender: gender ?? prev.gender,
    }));
  }, [firstName, lastName, email, role, classGrade, classLabel, gender]);

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
      setMessage({ type: 'success', text: 'Profil erfolgreich aktualisiert.' });
      setProfile((prev) => ({
        ...prev,
        newPassword: '',
        confirmPassword: '',
      }));
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
              gender={profile.gender}
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