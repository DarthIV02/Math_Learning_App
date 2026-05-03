import { useState } from 'react';
import './App.css';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import SolveProblemsPage from './pages/SolveProblemsPage';
import SelectTopic from './pages/SelectTopicPage';
import RegisterStudentPage from './pages/RegisterPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');

  if (!isLoggedIn) {
  if (currentPage === 'register') {
      return (
        <RegisterStudentPage
          onRegisterSuccess={() => setIsLoggedIn(true)}
          onBackToLogin={() => setCurrentPage('login')}
        />
      );
    }

    return (
      <LoginPage
        onLoginSuccess={() => setIsLoggedIn(true)}
        onRegister={() => setCurrentPage('register')}
      />
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'profile':
        return <ProfilePage onNavigate={setCurrentPage} />;
      case 'solve-problems':
        return <SolveProblemsPage onNavigate={setCurrentPage} />;
      case 'select-topic':
        return <SelectTopic onNavigate={setCurrentPage} />;
      case 'home':
      default:
        return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  return renderPage();
}

export default App;