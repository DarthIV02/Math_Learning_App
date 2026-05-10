import { useState } from 'react';

import BackgroundLayer from '../components/Background/BackgroundLayer';
import AuthCard from '../features/Login/components/AuthCard/AuthCard';
import InputField from '../components/InputField/InputField';
import AppPresentation from '../features/Login/components/AppPresentation/AppPresentation';
import { PrimaryButton } from '../components/Buttons/AuthButtons';
import { useRegister } from '../hooks/useRegister';

import './styles/LoginPage.css';

export default function RegisterStudentPage({ onRegisterSuccess, onBackToLogin }) {
  const { register, loading, error } = useRegister();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    classId: '',
    grade: '3',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const result = await register(form);
    if (result) onRegisterSuccess?.();
  };

  return (
    <div className="login-page">
      <BackgroundLayer />

      <AuthCard>
        
        <AppPresentation></AppPresentation>

        <div className="auth-title-block">
          <h2 className="auth-title">In registrieren</h2>
          <p className="auth-subtitle">
            Erstelle ein Konto, um direkt loszulegen.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Vorname (optional)"
            name="firstName"
            placeholder="Alex"
            value={form.firstName}
            onChange={handleChange}
          />

          <InputField
            label="Nachname (optional)"
            name="lastName"
            placeholder="Mustermann"
            value={form.lastName}
            onChange={handleChange}
          />

          <InputField
            label="E-Mail"
            name="email"
            type="email"
            placeholder="name@beispiel.de"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
          />

          <InputField
            label="Passwort"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
          />

          <label className="block relative z-10">
            <span className="block mb-2 ml-1 text-sm font-semibold text-slate-700">
              Klassenstufe
            </span>

            <select
              name="grade"
              value={form.grade}
              onChange={handleChange}
              className="
                w-full rounded-xl border-2 border-slate-200 bg-white
                px-4 py-3 text-base text-slate-900
                transition-all outline-none
                focus:border-green-500 focus:ring-4 focus:ring-green-100
                relative z-10
              "
            >
              <option value="3">3. Klasse</option>
              <option value="4">4. Klasse</option>
            </select>

            <p className="mt-1 ml-1 text-xs text-slate-500">
              Falls keine Klassen-ID vorhanden ist, wird diese Stufe für dich hinterlegt.
            </p>
          </label>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          {/* 2. Disable button while loading: */}
          <PrimaryButton
            label={loading ? 'Wird registriert...' : 'Registrieren'}
            type="submit"
            disabled={loading}
          />
        </form>

        <div className="footer flex flex-col items-center text-center mt-4 gap-1">
          <p className="text-sm text-slate-600">
            Bereits ein Konto?{' '}
            <a
              href="#"
              className="font-semibold text-blue-600 hover:text-blue-700"
              onClick={(e) => {
                e.preventDefault();
                onBackToLogin?.();
              }}
            >
              Zum Login {'>'}
            </a>
          </p>
        </div>
      </AuthCard>
    </div>
  );
}