import './ProfileEditForm.css';
import SurfaceCard from '../../components/SurfaceCard/SurfaceCard';
import InputField from '../../components/InputField/InputField';

export default function ProfileEditForm({
  profile,
  onChange,
  onSave,
  loading,
  message,
}) {
  return (
    <SurfaceCard className="profile-edit-form">
      <p className="profile-edit-form__title">Profil bearbeiten</p>

      {message && (
        <div className={`profile-edit-form__message profile-edit-form__message--${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="profile-edit-form__grid">
        <InputField
          label="Vorname"
          value={profile.firstName}
          onChange={(e) => onChange('firstName', e.target.value)}
        />

        <InputField
          label="Nachname"
          value={profile.lastName}
          onChange={(e) => onChange('lastName', e.target.value)}
        />

        <InputField
          label="E-Mail"
          type="email"
          value={profile.email}
          readOnly
        />

        <InputField
          label="Klassenstufe"
          type="number"
          value={profile.grade}
          onChange={(e) => onChange('grade', e.target.value)}
          min={3}
          max={4} 
        />

        <InputField
          label="Neues Passwort"
          type="password"
          value={profile.newPassword}
          onChange={(e) => onChange('newPassword', e.target.value)}
          placeholder="••••••••"
        />

        <InputField
          label="Passwort bestätigen"
          type="password"
          value={profile.confirmPassword}
          onChange={(e) => onChange('confirmPassword', e.target.value)}
          placeholder="••••••••"
        />
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={loading}
        className="profile-edit-form__button"
      >
        {loading ? 'Speichere...' : 'Änderungen speichern'}
      </button>
    </SurfaceCard>
  );
}