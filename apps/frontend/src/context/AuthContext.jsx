import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/client';
import { AuthContext } from './authContext';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    authAPI.getMe().then((res) => setUser(res.data)).catch(() => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.removeItem('token');
        return;
      }

      return authAPI.refresh(refreshToken).then(({ data }) => {
        localStorage.setItem('token', data.token);
        return authAPI.getMe();
      }).then((res) => setUser(res.data)).catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      });
    }).finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await authAPI.register({ name, email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data);
    return data;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }, []);

  const setUserFromToken = useCallback(async (token, refreshToken) => {
    localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    try {
      const res = await authAPI.getMe();
      setUser(res.data);
      return res.data;
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      throw new Error('Failed to fetch user');
    }
  }, []);

  const value = { user, loading, login, register, logout, setUserFromToken };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
