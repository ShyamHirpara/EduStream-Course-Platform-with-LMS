import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem('eduuser') || 'null')
  );
  const [tokens, setTokens] = useState(() =>
    JSON.parse(localStorage.getItem('edutokens') || 'null')
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const saveSession = (userData, tokenData) => {
    setUser(userData);
    setTokens(tokenData);
    localStorage.setItem('eduuser', JSON.stringify(userData));
    localStorage.setItem('edutokens', JSON.stringify(tokenData));
  };

  const clearSession = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('eduuser');
    localStorage.removeItem('edutokens');
  };

  const register = async (formData) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/register/', formData);
      saveSession(data.user, { access: data.access, refresh: data.refresh });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Registration failed.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login/', { username, password });
      saveSession(data.user, { access: data.access, refresh: data.refresh });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => clearSession();

  return (
    <AuthContext.Provider value={{ user, tokens, loading, error, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
