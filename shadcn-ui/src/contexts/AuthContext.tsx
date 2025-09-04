import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'affiliate' | 'client' | 'coordinator';
  referral_code: string;
  tier: string;
}

interface RegisterUserData {
  email: string;
  password: string;
  name: string;
  role?: string;
  referralCode?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterUserData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // This function now optimistically loads the user from local storage
      // without waiting for server verification. This makes the UI load instantly
      // and more resilient if the backend is temporarily down.
      // Token validity will be checked by the API interceptor on the first protected call.
      const token = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Failed to parse user from localStorage:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login({ email, password });
      const { user: userData, token } = response.data;
      
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsLoading(false);
      return { success: true };
    } catch (error: unknown) {
      let errorMessage = 'An unexpected error occurred during login.';
      if (axios.isAxiosError(error)) {
        if (error.response) {
          errorMessage = error.response.data?.error || error.response.data?.message || `Login failed with status ${error.response.status}`;
        } else if (error.request) {
          errorMessage = 'Could not connect to the server. Please ensure it is running.';
        } else {
          errorMessage = error.message;
        }
      }
      console.error('AuthContext Login Error:', error);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData: RegisterUserData) => {
    setIsLoading(true);
    try {
      const backendUserData = {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        referral_code: userData.referralCode,
      };
      const response = await authAPI.register(backendUserData);
      const { user: newUser, token } = response.data;
      
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      setIsLoading(false);
      return { success: true };
    } catch (error: unknown) {
      let errorMessage = 'An unexpected error occurred during registration.';
      if (axios.isAxiosError(error)) {
        if (error.response) {
          errorMessage = error.response.data?.error || error.response.data?.message || `Registration failed with status ${error.response.status}`;
        } else if (error.request) {
          errorMessage = 'Could not connect to the server. Please ensure it is running.';
        } else {
          errorMessage = error.message;
        }
      }

      console.error('AuthContext Register Error:', error);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};