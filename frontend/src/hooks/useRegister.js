import { useState } from 'react';
import { registerStudent } from '../api/auth';

export function useRegister() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function register(formData) {
    setLoading(true);
    setError(null);
    try {
      const result = await registerStudent(formData);
      localStorage.setItem('token', result.token);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { register, loading, error };
}