/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    let isMounted = true;
    const verifySession = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const freshUser = await authApi.getMe();
          if (isMounted) {
            setUser(freshUser);
            localStorage.setItem('auth_user', JSON.stringify(freshUser));
          }
        } catch (err) {
          console.warn('Session verification failed, logging out:', err?.message || err);
          if (isMounted) {
            localStorage.removeItem('token');
            localStorage.removeItem('auth_user');
            setToken(null);
            setUser(null);
          }
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    };

    verifySession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials);
    const sessionToken = data.token;
    const userData = data.user;

    localStorage.setItem('token', sessionToken);
    localStorage.setItem('auth_user', JSON.stringify(userData));

    setToken(sessionToken);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('auth_user');
      setToken(null);
      setUser(null);
    }
  }, []);

  // Role helper utilities
  const role = user?.role || null;
  const isPatient = role === 'PATIENT';
  const isReceptionist = role === 'RECEPTIONIST';
  const isDoctor = role === 'DOCTOR';
  const isAdmin = role === 'ADMIN';

  const hasRole = useCallback((requiredRole) => role === requiredRole, [role]);
  const hasAnyRole = useCallback((roles) => roles.includes(role), [role]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    role,
    isPatient,
    isReceptionist,
    isDoctor,
    isAdmin,
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function getRoleDashboardPath(role) {
  switch (role) {
    case 'PATIENT':
      return '/patient';
    case 'RECEPTIONIST':
      return '/reception';
    case 'DOCTOR':
      return '/doctor';
    case 'ADMIN':
      return '/reception'; // Or admin dashboard
    default:
      return '/';
  }
}
