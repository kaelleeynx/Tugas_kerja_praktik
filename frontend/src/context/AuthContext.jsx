import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { loadUserFromStorage, saveUserToStorage } from '../utils/storage';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const saved = loadUserFromStorage();
    if (saved && saved.token) {
      setUser(saved);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((userObj) => {
    setUser(userObj);
    saveUserToStorage(userObj);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('activeUser');
    localStorage.removeItem('token');
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    saveUserToStorage(updatedUser);
  }, []);

  const token = user?.token || null;
  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      isLoading,
      login,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
