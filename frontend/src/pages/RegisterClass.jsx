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
    className: '',
    grade: '3',
    students: [
      {
        firstName: '',
        lastName: '',
      },
    ],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStudentChange = (index, field, value) => {
    setForm((prev) => {
      const updatedStudents = [...prev.students];

      updatedStudents[index] = {
        ...updatedStudents[index],
        [field]: value,
      };

      return {
        ...prev,
        students: updatedStudents,
      };
    });
  };

  const addStudent = () => {
    setForm((prev) => ({
      ...prev,
      students: [
        ...prev.students,
        {
          firstName: '',
          lastName: '',
        },
      ],
    }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    const result = await register(form, klasse=true);

    if (result) {
      onRegisterSuccess?.(result);
    }
  };

  return (
    <div className="login-page">
      <BackgroundLayer />

      <AuthCard>
        
        <AppPresentation></AppPresentation>

        <div className="auth-title-block">
          <h2 className="auth-title">In registrieren Klasse</h2>
          <p className="auth-subtitle">
            Erstelle ein Konto, um direkt loszulegen.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">

            <InputField
              label="Klassenname"
              name="className"
              placeholder="Mathe 101"
              value={form.className}
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
            </label>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-700">
                Register Students
              </h3>

              <button
                type="button"
                onClick={addStudent}
                className="
                  w-10 h-10 rounded-full
                  bg-blue-600 text-white
                  text-xl font-bold
                  hover:bg-blue-700
                  transition-all
                "
              >
                +
              </button>
            </div>

            {form.students.map((student, index) => (
              <div
                key={index}
                className="
                  border border-slate-200
                  rounded-2xl
                  p-4
                  bg-slate-50
                  space-y-4
                "
              >
                <h4 className="font-semibold text-slate-600">
                  Student {index + 1}
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Vorname"
                    placeholder="Max"
                    value={student.firstName}
                    onChange={(e) =>
                      handleStudentChange(index, 'firstName', e.target.value)
                    }
                  />

                  <InputField
                    label="Nachname"
                    placeholder="Mustermann"
                    value={student.lastName}
                    onChange={(e) =>
                      handleStudentChange(index, 'lastName', e.target.value)
                    }
                  />
                </div>
              </div>
            ))}
          </div>

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