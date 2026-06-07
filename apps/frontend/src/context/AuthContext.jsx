import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.getMe().then((res) => setUser(res.data)).catch(() => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          authAPI.refresh(refreshToken).then(({ data }) => {
            localStorage.setItem('token', data.token);
            return authAPI.getMe();
          }).then((res) => setUser(res.data)).catch(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
          }).finally(() => setLoading(false));
        } else {
          localStorage.removeItem('token');
          setLoading(false);
        }
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
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

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const setUserFromToken = (token, refreshToken) => {
    localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    authAPI.getMe().then((res) => setUser(res.data)).catch(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUserFromToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
