import { useState } from 'react';
import logo from '../assets/icons/applicationIcon.webp';

import InputField from '../components/InputField/InputField';
import BackgroundLayer from '../components/Background/BackgroundLayer';
import { PrimaryButton, QRButton } from '../components/Buttons/AuthButtons';
import AppPresentation from '../features/Login/components/AppPresentation/AppPresentation';

import AuthCard from '../features/Login/components/AuthCard/AuthCard';
import QRScanner from '../features/Login/components/QRScanner/QRScanner';

import { loginUser } from '../api/auth';

import './styles/LoginPage.css';

export default function LoginPage({ onLoginSuccess, onRegister, onRegisterClass }) {
  const [showScanner, setShowScanner] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setError(null);

    if (!showPassword) {
      setShowPassword(true);
      return;
    }

    setLoading(true);

    try {
      const result = await loginUser(form);
      onLoginSuccess?.(result);
    } catch (err) {
      setError(err.message || 'Login fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  const handleQRResult = (data) => {
    console.log('QR scanned:', data);
    setShowScanner(false);

    // Later: validate QR data here
    onLoginSuccess();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="login-page">
      <BackgroundLayer />

      <AuthCard>
        
        <AppPresentation></AppPresentation>

        <div className="auth-title-block">
          <h2 className="auth-title">Willkommen zurück</h2>
          <p className="auth-subtitle">
            Melde dich mit deiner E-Mail und deinem Passwort an.
          </p>
        </div>

        <InputField
          label="E-Mail oder Username"
          name="email"
          type="email"
          placeholder="name@beispiel.de"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
        />

        {showPassword && (
          <InputField
            label="Passwort"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
          />
        )}

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        <PrimaryButton
          label={loading ? 'Einloggen...' : showPassword ? 'Einloggen' : 'Weiter'}
          type="button"
          onClick={handleSubmit}
          disabled={loading}
        />

        <QRButton onClick={() => setShowScanner(true)} />

        <div className="footer flex flex-col items-center text-center mt-2 gap-1">
          <p className="text-sm text-slate-600">
            Neu hier?{' '}
            <a
              href="#"
              className="font-semibold text-blue-600 hover:text-blue-700"
              onClick={(e) => {
                e.preventDefault();
                onRegister?.();
              }}
            >
              Registrieren {'>'}
            </a>
          </p>

          <p className="text-sm text-slate-600">
            Für Lehrkräfte?{' '}
            <a
              href="#"
              className="font-semibold text-blue-600 hover:text-blue-700"
              onClick={(e) => {
                e.preventDefault();
                onRegisterClass?.();
              }}
            >
              Eine Klasse registrieren {'>'}
            </a>
          </p>

          <p className="text-sm text-slate-600">
            Schnell testen?{' '}
            <a
              href="#"
              className="font-semibold text-blue-600 hover:text-blue-700"
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(); // same as "Anmelden"
              }}
            >
              Als Gast fortfahren {'>'}
            </a>
          </p>
        </div>
      </AuthCard>

      {showScanner && (
        <QRScanner
          onClose={() => setShowScanner(false)}
          onResult={handleQRResult}
        />
      )}
    </div>
  );
}