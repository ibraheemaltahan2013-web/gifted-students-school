import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await authAPI.me();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials);
    setUser(data.user);
    return data;
  };

  const register = async (data) => {
    const result = await authAPI.register(data);
    setUser(result.user);
    return result;
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  const updateProfile = async (data) => {
    const { data: result } = await authAPI.updateProfile(data);
    setUser(result.user);
    return result;
  };

  const changePassword = async (data) => {
    return authAPI.changePassword(data);
  };

  const value = { user, loading, login, register, logout, updateProfile, changePassword, refreshUser: fetchUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}