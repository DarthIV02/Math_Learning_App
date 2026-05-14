import { useState, useEffect } from 'react';
import './App.css';
import { normalizeUser } from './utils/normalizeUser';
import { saveAvatarUrl } from './lib/avatar';
import { updateUser } from './api/users';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import SolveProblemsPage from './pages/SolveProblemsPage';
import SelectTopic from './pages/SelectTopicPage';
import RegisterStudentPage from './pages/RegisterPage';
import RegisterClassPage from './pages/RegisterClass';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const restoreSession = async (savedToken) => {
    try {
      const response = await fetch(
        `${window.location.protocol}//${window.location.hostname}:3001/api/users/me`,
        {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Session expired');
      }

      const userData = await response.json();
      const normalizedUser = normalizeUser(userData);

      if (normalizedUser.avatarUrl) {
        saveAvatarUrl(normalizedUser.avatarUrl);
      }

      setUser(normalizedUser);
      setToken(savedToken);
      setIsLoggedIn(true);
      setCurrentPage('home');
    } catch (err) {
      localStorage.removeItem('token');
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      restoreSession(savedToken);
    }
  }, []);

  const handleAuthSuccess = (result) => {
    const rawUser = result.user || result;
    const normalizedUser = normalizeUser(rawUser);

    if (normalizedUser.avatarUrl) {
      saveAvatarUrl(normalizedUser.avatarUrl);
    }

    localStorage.setItem('token', result.token);

    setUser(normalizedUser);
    setToken(result.token);
    setIsLoggedIn(true);
    setCurrentPage('home');
  };

  const handleRegisterClassSuccess = (result) => {
    setCurrentPage('login');
  };

  const handleUserUpdate = async (updatedUser) => {
    const savedUser = await updateUser(
      user.id,
      {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        grade: updatedUser.grade,
        password: updatedUser.newPassword || undefined,
      },
      token
    );

    const normalizedUser = normalizeUser(savedUser);

    // Save avatar locally
    if (normalizedUser.avatarUrl) {
      saveAvatarUrl(normalizedUser.avatarUrl);
    }

    setUser(normalizedUser);
  };

  const handleLogout = async () => {
    try {
      await fetch(
        `${window.location.protocol}//${window.location.hostname}:3001/api/auth/logout`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (err) {
      console.error(err);
    }

    localStorage.removeItem('avatarUrl');
    localStorage.removeItem('token');

    setUser(null);
    setToken(null);
    setIsLoggedIn(false);
    setCurrentPage('login');
  };

  if (!isLoggedIn) {
    if (currentPage === 'register') {
        return (
          <RegisterStudentPage
              onRegisterSuccess={handleAuthSuccess}
              onBackToLogin={() => setCurrentPage('login')}
            />
        );
      }

    if (currentPage === 'register_class') {
        return (
          <RegisterClassPage
              onRegisterSuccess={handleRegisterClassSuccess}
              onBackToLogin={() => setCurrentPage('login')}
            />
        );
      }

    return (
      <LoginPage
        onLoginSuccess={handleAuthSuccess}
        onRegister={() => setCurrentPage('register')}
        onRegisterClass={() => setCurrentPage('register_class')}
      />
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'profile':
        return (
          <ProfilePage
            user={user}
            token={token}
            onUserUpdate={handleUserUpdate}
            onNavigate={setCurrentPage}
            onLogout={handleLogout}
          />
        );
      case 'solve-problems':
        return <SolveProblemsPage onNavigate={setCurrentPage} />;
      case 'select-topic':
        return <SelectTopic onNavigate={setCurrentPage} />;
      case 'home':
      default:
        return <HomePage onNavigate={setCurrentPage} user={user} />;
    }
  };

  return renderPage();
}

export default App;