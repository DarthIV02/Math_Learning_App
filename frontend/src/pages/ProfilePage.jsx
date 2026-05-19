import { useState, useEffect } from 'react';

import BackgroundLayer from '../components/Background/BackgroundLayer';
import BottomNav from '../components/BottomNav/BottomNav';

import ProfileCard from '../features/Profile/ProfileCard';
import ProfileEditForm from '../features/Profile/ProfileEditForm';
import ProfileStats from '../features/Profile/ProfileStats';

import { uploadAvatar, getFullAvatarUrl } from '../api/users';
import { logoutUser } from '../api/auth';
import { saveAvatarUrl } from '../lib/avatar';

import './styles/ProfilePage.css';

export default function ProfilePage({ onNavigate, user, token, onUserUpdate, onLogout }) {
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
  const [avatarSrc, setAvatarSrcState] = useState(null);

  useEffect(() => {
    setProfile((prev) => ({
      ...prev,
      firstName,
      lastName,
      email,
      grade,
    }));
  }, [firstName, lastName, email, grade]);

  const handleAvatarChange = async (file) => {
    setMessage(null);

    try {
      const previewUrl = URL.createObjectURL(file);
      setAvatarSrcState(previewUrl);

      const response = await uploadAvatar(file, token);
      const savedUser = response.user || response;

      const newAvatarUrl = savedUser.avatar_url || savedUser.avatarUrl;

      if (newAvatarUrl) {
        saveAvatarUrl(newAvatarUrl);
      }

      await onUserUpdate?.({
        ...user,
        avatarUrl: newAvatarUrl,
      });

      setMessage({
        type: 'success',
        text: 'Profilbild aktualisiert.',
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.message || 'Profilbild konnte nicht hochgeladen werden.',
      });
    }
  };

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

  const handleLogout = async () => {
    try {
      await logoutUser(token);
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      onLogout?.();
    }
  };

  const fullAvatarUrl = getFullAvatarUrl(user?.avatarUrl);

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
              avatarSrc={avatarSrc || fullAvatarUrl}
              onAvatarChange={handleAvatarChange}
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

            <button
              onClick={handleLogout}
              className="
                w-full mt-4 py-3 rounded-2xl
                bg-red-500 text-white font-semibold
                hover:bg-red-600 transition-all
              "
            >
              Abmelden
            </button>
          </div>
        </main>

        <nav className="profile-page__nav">
          <BottomNav onNavigate={onNavigate} activePage="profile" />
        </nav>
      </div>
    </div>
  );
}