import { useState } from 'react';
import { registerStudent, registerClass } from '../api/auth';

export function useRegister() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function register(formData, klasse=false) {
    setLoading(true);
    setError(null);
    try {
      if (!klasse){
        const result = await registerStudent(formData);
        localStorage.setItem('token', result.token);
        return result;
      } else {
        const result = await registerClass(formData);
        localStorage.setItem('token', result.token);
        return result;
      }
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { register, loading, error };
}