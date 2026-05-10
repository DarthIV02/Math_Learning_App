import { useState } from 'react';
import './App.css';
import { normalizeUser } from './utils/normalizeUser';
import { updateUser } from './api/users';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import SolveProblemsPage from './pages/SolveProblemsPage';
import SelectTopic from './pages/SelectTopicPage';
import RegisterStudentPage from './pages/RegisterPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const handleAuthSuccess = (result) => {
    const rawUser = result.user || result;
    const normalizedUser = normalizeUser(rawUser);

    setUser(normalizedUser);
    setToken(result.token);
    setIsLoggedIn(true);
    setCurrentPage('home');
  };

  const handleUserUpdate = async (updatedUser) => {
    const savedUser = await updateUser(user.id, {
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      grade: updatedUser.grade,
      password: updatedUser.newPassword || undefined,
    }, token);

    setUser(normalizeUser(savedUser));
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

    return (
      <LoginPage
        onLoginSuccess={handleAuthSuccess}
        onRegister={() => setCurrentPage('register')}
      />
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'profile':
        return (
          <ProfilePage
            user={user}
            onUserUpdate={handleUserUpdate}
            onNavigate={setCurrentPage}
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