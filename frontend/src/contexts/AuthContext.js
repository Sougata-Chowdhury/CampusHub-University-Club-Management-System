import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw || raw === 'undefined') return null;
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

const persistUser = (nextUser) => {
  try {
    if (nextUser) {
      localStorage.setItem('user', JSON.stringify(nextUser));
    } else {
      localStorage.removeItem('user');
    }
  } catch (error) {
    /* storage may be unavailable */
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem('token');
    persistUser(null);
    setUser(null);
  }, []);

  // Validate the stored token once on app start.
  useEffect(() => {
    let active = true;

    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        if (active) setLoading(false);
        return;
      }

      try {
        const response = await api.get('/users/profile');
        if (!active) return;
        setUser(response.data);
        persistUser(response.data);
      } catch (error) {
        if (!active) return;
        // 401/403 means the token is no longer valid; network errors keep the cached user.
        if (error.response?.status === 401 || error.response?.status === 403) {
          clearSession();
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    checkAuthStatus();
    return () => {
      active = false;
    };
  }, [clearSession]);

  const login = useCallback(async (email, password, isAdmin = false) => {
    try {
      const endpoint = isAdmin ? '/auth/admin/login' : '/auth/login';
      const response = await api.post(endpoint, { email, password });
      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      persistUser(userData);
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed. Please check your details.',
      };
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      const response = await api.post('/auth/register', {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
      });
      const { token, user: newUser } = response.data;

      localStorage.setItem('token', token);
      persistUser(newUser);
      setUser(newUser);

      return { success: true, user: newUser };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed. Please try again.',
      };
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const updateUser = useCallback(async (userData) => {
    try {
      const response = await api.put('/users/profile', userData);
      setUser(response.data);
      persistUser(response.data);
      return { success: true, user: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Update failed',
      };
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const response = await api.get('/users/profile');
      setUser(response.data);
      persistUser(response.data);
      return response.data;
    } catch (error) {
      return null;
    }
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    loading,
    login,
    register,
    logout,
    updateUser,
    refreshProfile,
    api,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
