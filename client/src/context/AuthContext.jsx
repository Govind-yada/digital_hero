import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('dh_token');
    if (!token) {
      setUser(null);
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const data = await authApi.getMe();
      setUser(data.user);
      setSubscription(data.subscription);
    } catch {
      localStorage.removeItem('dh_token');
      setUser(null);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email, password) => {
    const data = await authApi.login({ email, password });
    localStorage.setItem('dh_token', data.token);
    setUser(data.user);
    setSubscription(data.subscription);
    return data;
  };

  const register = async (formData) => {
    const data = await authApi.register(formData);
    localStorage.setItem('dh_token', data.token);
    setUser(data.user);
    setSubscription(data.subscription);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('dh_token');
    setUser(null);
    setSubscription(null);
  };

  const isSubscribed = subscription?.status === 'ACTIVE' || user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        subscription,
        isSubscribed,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
