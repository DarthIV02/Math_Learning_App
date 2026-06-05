import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { normalizeUser } from './utils/normalizeUser';
import { saveAvatarUrl } from './lib/avatar';

import { TutorialProvider } from './context/TutorialContext';
import TutorialOverlay from './components/Tutorial/TutorialOverlay';

import { updateUser, fetchCurrentUser } from './api/users';
import { fetchProblems } from './api/problem';

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
  const [problemFilter, setProblemFilter] = useState(null);
  const startTutorialRef = useRef(null); // TutorialProvider will register its start() here
  const tutorialGoToStepRef = useRef(null);
  const hasTriedStartingTutorialRef = useRef(false);
  const tutorialCurrentStepRef = useRef(null);

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

  useEffect(() => {
    if (!isLoggedIn || !user) return;
    if (hasTriedStartingTutorialRef.current) return;

    hasTriedStartingTutorialRef.current = true;

    const shouldStartTutorial = !user.hasCompletedTutorial;

    console.log('Should start tutorial:', shouldStartTutorial);

    if (shouldStartTutorial) {
      setTimeout(() => {
        startTutorialRef.current?.();
      }, 500);
    }
  }, [isLoggedIn, user]);

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
    // Remove auth data
    localStorage.removeItem('token');
    localStorage.removeItem('avatarUrl');
    hasTriedStartingTutorialRef.current = false;

    // Remove queued attempts
    localStorage.removeItem('attempt_queue');

    // Remove saved problem sessions
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('session:')) {
        localStorage.removeItem(key);
      }
    });

    setUser(null);
    setToken(null);
    setProblemFilter(null);
    setIsLoggedIn(false);
    setCurrentPage('login');
    setPageState({});
  };

  const handleRefreshCurrentUser = async () => {
    if (!token) return null;

    const userData = await fetchCurrentUser(token);
    const normalizedUser = normalizeUser(userData);

    if (normalizedUser.avatarUrl) {
      saveAvatarUrl(normalizedUser.avatarUrl);
    }

    setUser(normalizedUser);
    return normalizedUser;
  };

  const loadProblemsForFilter = async (filter) => {
    const finalFilter = {
      ...filter,
      grade: user?.grade,
    };

    const problems = await fetchProblems(finalFilter);

    setProblemFilter(finalFilter);
    handleNavigate('solve-problems', { problems });

    const isTutorialRandomStep =
      tutorialCurrentStepRef.current?.id === 'random';

    if (isTutorialRandomStep) {
      setTimeout(() => {
        tutorialGoToStepRef.current?.('whiteboard', { navigate: false });
      }, 500);
    }
  };
  
  const handlePlayAgain = async () => {
    if (!problemFilter) return;

    setPageState((prev) => ({
      ...prev,
      problems: [],
    }));

    try {
      const problems = await fetchProblems(problemFilter);

      setPageState((prev) => ({
        ...prev,
        problems,
      }));
    } catch (err) {
      setPageState((prev) => ({
        ...prev,
        problems: [],
        error: err.message,
      }));
    }
  };

  const handleCoinsEarned = (amount) => {
    setUser((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        coins: (prev.coins ?? 0) + amount,
      };
    });
  };

  const handleTutorialComplete = useCallback(async () => {
    if (!user?.id || !token) return;

    await updateUser(
      user.id,
      { hasCompletedTutorial: true },
      token
    );

    setUser((prev) => ({
      ...prev,
      hasCompletedTutorial: true,
    }));
  }, [user?.id, token]);

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
            onRefreshUser={handleRefreshCurrentUser}
            onUserUpdate={handleUserUpdate}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        );
      case 'solve-problems':
        return (
          <SolveProblemsPage
            onNavigate={handleNavigate}
            problems={pageState.problems ?? []}
            difficulty={problemFilter?.difficulty}
            user={user}
            token={token}
            onPlayAgain={handlePlayAgain}
            onCoinsEarned={handleCoinsEarned}
          />
        );

      case 'select-topic':
        return (
          <SelectTopic
            onNavigate={handleNavigate}
            user={user}
            onTopicSelect={loadProblemsForFilter}
          />
        );
      case 'home':
      default:
        return <HomePage onNavigate={handleNavigate} user={user} />;
    }
  };

  return (
    <TutorialProvider
      onNavigate={handleNavigate}
      startRef={startTutorialRef}
      goToStepRef={tutorialGoToStepRef}
      onComplete={handleTutorialComplete}
      currentStepRef={tutorialCurrentStepRef}
    >
      <TutorialOverlay />
      {renderPage()}
    </TutorialProvider>
  );
}

export default App;