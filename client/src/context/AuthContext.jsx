import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('asap-agap-token');
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(({ data }) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem('asap-agap-token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isLDRRMO: user?.role === 'ldrrmo',
      async login(username, password) {
        const { data } = await authApi.login(username, password);
        localStorage.setItem('asap-agap-token', data.token);
        setUser(data.user);
        return data.user;
      },
      async register(username, password) {
        const { data } = await authApi.register(username, password);
        localStorage.setItem('asap-agap-token', data.token);
        setUser(data.user);
        return data.user;
      },
      logout() {
        localStorage.removeItem('asap-agap-token');
        setUser(null);
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
