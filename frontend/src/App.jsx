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
  const [pageState, setPageState] = useState({});

  const restoreSession = async (savedToken) => {
    try {
      const response = await fetch(
       `${import.meta.env.VITE_API_URL}/users/me`,
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
      handleNavigate('home');
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
    handleNavigate('home');
  };

  const handleRegisterClassSuccess = (result) => {
    handleNavigate('login');
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

  const handleNavigate = (page, state = {}) => {
    setCurrentPage(page);
    setPageState(state);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('avatarUrl');

    setUser(null);
    setToken(null);
    setIsLoggedIn(false);
    setCurrentPage('login');
    setPageState({});
  };

  if (!isLoggedIn) {
    if (currentPage === 'register') {
        return (
          <RegisterStudentPage
              onRegisterSuccess={handleAuthSuccess}
              onBackToLogin={() => handleNavigate('login')}
            />
        );
      }

    if (currentPage === 'register_class') {
        return (
          <RegisterClassPage
              onRegisterSuccess={handleRegisterClassSuccess}
              onBackToLogin={() => handleNavigate('login')}
            />
        );
      }

    return (
      <LoginPage
        onLoginSuccess={handleAuthSuccess}
        onRegister={() => handleNavigate('register')}
        onRegisterClass={() => handleNavigate('register_class')}
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
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        );
      case 'solve-problems':
        return <SolveProblemsPage 
          onNavigate={handleNavigate} 
          problems={pageState.problems ?? []}
        />;
      case 'select-topic':
        return <SelectTopic onNavigate={handleNavigate} user={user}/>;
      case 'home':
      default:
        return <HomePage onNavigate={handleNavigate} user={user} />;
    }
  };

  return renderPage();
}

export default App;