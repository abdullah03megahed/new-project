import React, { createContext, useContext, useState, ReactNode } from 'react';
import { api } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  type: 'student' | 'landlord' | 'admin';
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: 'male' | 'female';
  nationalId: string;
  dateOfBirth?: string;
  address: string;
  faculty?: string;
  lookingForRoommate?: boolean;
  photoUrl?: string;
  // Matching preferences (stored locally after Matching page)
  age?: number;
  governorate?: string;
  hometown?: string;
  budgetRange?: string;
  wantsRoommate?: boolean;
  sleepCode?: 'Early Bird' | 'Night Owl' | 'Flexible';
}

export interface SignupPayload {
  displayName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: 'Student' | 'LandLord';
}

// Backend login/register response shape
interface AuthResponse {
  displayName: string;
  email: string;
  token: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (payload: SignupPayload) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Converts backend role string → frontend user type
function roleToType(role: string): 'student' | 'landlord' | 'admin' {
  const r = role.toLowerCase();
  if (r === 'student') return 'student';
  if (r === 'landlord') return 'landlord';
  return 'admin';
}

// Builds a minimal User object from what the backend returns on auth
function buildUserFromAuth(data: AuthResponse): User {
  const nameParts = data.displayName?.split(' ') || ['', ''];
  return {
    id: '',                       // Backend doesn't return id on login — update if your Swagger does
    type: roleToType(data.role),
    displayName: data.displayName,
    firstName: nameParts[0] || data.displayName,
    lastName: nameParts.slice(1).join(' ') || '',
    email: data.email,
    nationalId: '',
    address: '',
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('token')
  );

  const login = async (email: string, password: string) => {
    // POST /api/Authentication/Login
    const data = await api.post<AuthResponse>('/Authentication/Login', {
      email,
      password,
    });

    const newUser = buildUserFromAuth(data);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(data.token);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const signup = async (payload: SignupPayload) => {
    // POST /api/Authentication/Register
    const data = await api.post<AuthResponse>('/Authentication/Register', payload);

    const newUser = buildUserFromAuth(data);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(data.token);
    setUser(newUser);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...userData };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, signup, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
