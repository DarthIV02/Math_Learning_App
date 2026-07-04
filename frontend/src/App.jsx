import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { normalizeUser } from './utils/normalizeUser';
import { saveAvatarUrl } from './lib/avatar';

import { TutorialProvider } from './context/TutorialContext';
import TutorialOverlay from './components/Tutorial/TutorialOverlay';

import { updateUser, fetchCurrentUser } from './api/users';
import { fetchProblems } from './api/problem';

import { useGenerationPolling } from './hooks/useGenerationPolling';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import SolveProblemsPage from './pages/SolveProblemsPage';
import SelectTopic from './pages/SelectTopicPage';
import RegisterStudentPage from './pages/RegisterPage';
import RegisterClassPage from './pages/RegisterClass';
import AssessmentPage from './pages/AssessmentPage';

const needsAssessment = (user) =>
  user?.authType !== 'anonymous' &&
  !user?.hasCompletedAssessment;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [pageState, setPageState] = useState({});
  const [problemFilter, setProblemFilter] = useState(null);
  const [showAssessment, setShowAssessment] = useState(false);
  const startTutorialRef = useRef(null);
  const tutorialGoToStepRef = useRef(null);
  const hasTriedStartingTutorialRef = useRef(false);
  const tutorialCurrentStepRef = useRef(null);

  const restoreSession = async (savedToken) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/me`,
        { headers: { Authorization: `Bearer ${savedToken}` } }
      );

      if (!response.ok) throw new Error('Session expired');

      const userData = await response.json();
      const normalizedUser = normalizeUser(userData);

      if (normalizedUser.avatarUrl) saveAvatarUrl(normalizedUser.avatarUrl);

      setUser(normalizedUser);
      setToken(savedToken);
      setIsLoggedIn(true);
      setShowAssessment(needsAssessment(normalizedUser)); // re-check on every session restore
      handleNavigate('home');
    } catch (err) {
      localStorage.removeItem('token');
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) restoreSession(savedToken);
  }, []);

  // Start tutorial only after assessment is done
  useEffect(() => {
    if (!isLoggedIn || !user || showAssessment) return;
    if (hasTriedStartingTutorialRef.current) return;

    hasTriedStartingTutorialRef.current = true;

    const shouldStartTutorial = !user.hasCompletedTutorial;
    console.log('Should start tutorial:', shouldStartTutorial);

    if (shouldStartTutorial) {
      setTimeout(() => {
        startTutorialRef.current?.();
      }, 500);
    }
  }, [isLoggedIn, user, showAssessment]);

  const setProblems = useCallback((updater) => {
    setPageState((prev) => ({
      ...prev,
      problems:
        typeof updater === 'function'
          ? updater(prev.problems ?? [])
          : updater,
    }));
  }, []);

  useGenerationPolling({
    problems: pageState.problems ?? [],
    setProblems,
  });

  // Called after login (existing users, guest) — assessment shown if not yet completed
  const handleAuthSuccess = (result) => {
    const rawUser = result.user || result;
    const normalizedUser = normalizeUser(rawUser);

    if (normalizedUser.avatarUrl) saveAvatarUrl(normalizedUser.avatarUrl);

    localStorage.setItem('token', result.token);

    setUser(normalizedUser);
    setToken(result.token);
    setIsLoggedIn(true);
    setShowAssessment(needsAssessment(normalizedUser));
    handleNavigate('home');
  };

  // Registration uses the same handler — assessment shown if not yet completed
  const handleRegisterStudentSuccess = handleAuthSuccess;

  const handleRegisterClassSuccess = () => {
    handleNavigate('login');
  };

  // Called when child finishes the assessment
  const handleAssessmentComplete = async () => {
    setShowAssessment(false);

    setUser((prev) => ({
      ...prev,
      hasCompletedAssessment: true,
    }));

    try {
      await updateUser(
        user.id,
        {
          hasCompletedAssessment: true,
        },
        token
      );
    } catch (err) {
      console.error('Could not mark assessment as completed:', err);
    }
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
    if (normalizedUser.avatarUrl) saveAvatarUrl(normalizedUser.avatarUrl);
    setUser(normalizedUser);
  };

  const handleNavigate = (page, state = {}) => {
    setCurrentPage(page);
    setPageState(state);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('avatarUrl');
    localStorage.removeItem('attempt_queue');
    hasTriedStartingTutorialRef.current = false;

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('session:')) localStorage.removeItem(key);
    });

    setUser(null);
    setToken(null);
    setProblemFilter(null);
    setIsLoggedIn(false);
    setCurrentPage('login');
    setPageState({});
    setShowAssessment(false);
  };

  const handleRefreshCurrentUser = async () => {
    if (!token) return null;

    const userData = await fetchCurrentUser(token);
    const normalizedUser = normalizeUser(userData);

    if (normalizedUser.avatarUrl) saveAvatarUrl(normalizedUser.avatarUrl);

    setUser(normalizedUser);
    return normalizedUser;
  };

  const loadProblemsForFilter = async (filter) => {
    const finalFilter = { ...filter, grade: user?.grade, is_assessment: false };
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

    setPageState((prev) => ({ ...prev, problems: [] }));

    try {
      const problems = await fetchProblems(problemFilter);
      setPageState((prev) => ({ ...prev, problems }));
    } catch (err) {
      setPageState((prev) => ({ ...prev, problems: [], error: err.message }));
    }
  };

  const handleCoinsEarned = (amount) => {
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, coins: (prev.coins ?? 0) + amount };
    });
  };

  const handleTutorialComplete = useCallback(async () => {
    if (!user?.id || !token) return;

    await updateUser(user.id, { hasCompletedTutorial: true }, token);
    setUser((prev) => ({ ...prev, hasCompletedTutorial: true }));
  }, [user?.id, token]);

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    if (currentPage === 'register') {
      return (
        <RegisterStudentPage
          onRegisterSuccess={handleRegisterStudentSuccess}
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

  // ── Assessment (non-guest users who haven't completed it yet) ──────────────
  if (showAssessment) {
    return (
      <AssessmentPage
        token={token}
        user={user}
        onAssessmentComplete={handleAssessmentComplete}
      />
    );
  }

  // ── Main app ───────────────────────────────────────────────────────────────
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