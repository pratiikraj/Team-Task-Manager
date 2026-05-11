import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, tokenStore } from '../api/client';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = tokenStore.get();
    if (!t) { setLoading(false); return; }
    api.me()
      .then(({ user }) => setUser(user))
      .catch(() => { tokenStore.clear(); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user } = await api.login({ email, password });
    tokenStore.set(token);
    setUser(user);
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const { token, user } = await api.signup({ name, email, password });
    tokenStore.set(token);
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
