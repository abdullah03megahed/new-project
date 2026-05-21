import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  accountId?: string; // GUID from JWT — used for GET /LandLord/Account/{accountId}
  type: 'student' | 'landlord' | 'admin';
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  gender?: 'male' | 'female';
  nationalId: string;
  dateOfBirth?: string;
  address: string;
  faculty?: string;
  lookingForRoommate?: boolean;
  photoUrl?: string;
  homeTown?: string;
  age?: number;
  governorate?: string;
  hometown?: string;
  budgetRange?: string;
  wantsRoommate?: boolean;
  sleepCode?: 'Early Bird' | 'Night Owl' | 'Flexible';
  bio?: string;
  minBudget?: number;
  maxBudget?: number;
  sleepingHabits?: number;
}

export interface SignupPayload {
  displayName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: 'Student' | 'LandLord';
}

interface AuthResponse {
  displayName: string;
  email: string;
  token: string;
  role: string;
}

interface LandlordProfile {
  id: number;
  firstName: string;
  lastName: string;
  birthDate?: string;
  nationalId: string;
  homeTown?: string;
  email: string;
  phoneNumber?: string;
  status?: number;
}

interface StudentProfile {
  id: number;
  firstName: string;
  lastName: string;
  birthDate?: string;
  age?: number;
  homeTown?: string;
  gender?: number;
  bio?: string;
  facultyField?: string;
  lookingForRoommate?: boolean;
  sleepingHabits?: number;
  minBudget?: number;
  maxBudget?: number;
  nationalCard?: string;
  email: string;
  phoneNumber?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (payload: SignupPayload) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roleToType(role: string): 'student' | 'landlord' | 'admin' {
  const r = role.toLowerCase();
  if (r === 'student') return 'student';
  if (r === 'landlord') return 'landlord';
  return 'admin';
}

function genderToString(gender?: number): 'male' | 'female' | undefined {
  if (gender === 1) return 'male';
  if (gender === 2) return 'female';
  return undefined;
}

// Extract the account GUID (sub claim) from the JWT token
function getAccountIdFromToken(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return (
      payload.sub ||
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
      ''
    );
  } catch {
    return '';
  }
}

function buildUserFromAuth(data: AuthResponse, token: string): User {
  const nameParts = data.displayName?.split(' ') || ['', ''];
  return {
    id: '',
    accountId: getAccountIdFromToken(token),
    type: roleToType(data.role),
    displayName: data.displayName,
    firstName: nameParts[0] || data.displayName,
    lastName: nameParts.slice(1).join(' ') || '',
    email: data.email,
    nationalId: '',
    address: '',
  };
}

function mergeWithLandlordProfile(base: User, p: LandlordProfile): User {
  return {
    ...base,
    id: String(p.id),
    firstName: p.firstName || base.firstName,
    lastName: p.lastName || base.lastName,
    displayName: `${p.firstName} ${p.lastName}`.trim() || base.displayName,
    nationalId: p.nationalId || '',
    dateOfBirth: p.birthDate || '',
    homeTown: p.homeTown || '',
    phoneNumber: p.phoneNumber || '',
  };
}

function mergeWithStudentProfile(base: User, p: StudentProfile): User {
  return {
    ...base,
    id: String(p.id),
    firstName: p.firstName || base.firstName,
    lastName: p.lastName || base.lastName,
    displayName: `${p.firstName} ${p.lastName}`.trim() || base.displayName,
    nationalId: p.nationalCard || '',
    dateOfBirth: p.birthDate || '',
    homeTown: p.homeTown || '',
    phoneNumber: p.phoneNumber || '',
    gender: genderToString(p.gender),
    faculty: p.facultyField || '',
    lookingForRoommate: p.lookingForRoommate || false,
    age: p.age,
    bio: p.bio || '',
    minBudget: p.minBudget,
    maxBudget: p.maxBudget,
    sleepingHabits: p.sleepingHabits,
  };
}

// ── Fetch landlord profile — tries Account/{accountId} first, falls back to Email ──
async function fetchLandlordProfile(base: User): Promise<User> {
  if (base.accountId) {
    try {
      const profile = await api.get<LandlordProfile>(`/LandLord/Account/${base.accountId}`);
      if (profile?.id) return mergeWithLandlordProfile(base, profile);
    } catch { /* fall through */ }
  }
  try {
    const profile = await api.get<LandlordProfile>(`/LandLord/Email?email=${encodeURIComponent(base.email)}`);
    if (profile?.id) return mergeWithLandlordProfile(base, profile);
  } catch { /* continue with minimal data */ }
  return base;
}

async function fetchStudentProfile(base: User): Promise<User> {
  try {
    const profile = await api.get<StudentProfile>(`/Student/Email?email=${encodeURIComponent(base.email)}`);
    if (profile?.id) return mergeWithStudentProfile(base, profile);
  } catch { /* continue with minimal data */ }
  return base;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Rehydrate synchronously — user is never null on first render if already logged in
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('token')
  );

  // loading = true only while silently refreshing a stale profile in the background
  const [loading, setLoading] = useState(false);

  // On mount: if token exists but profile id is missing, re-fetch silently
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!storedToken || !storedUser) return;

    let parsed: User;
    try { parsed = JSON.parse(storedUser); } catch { return; }

    // Profile already complete — nothing to do
    if (parsed.id) return;

    setLoading(true);
    const refresh = async () => {
      try {
        let updated: User;
        if (parsed.type === 'landlord') {
          updated = await fetchLandlordProfile(parsed);
        } else if (parsed.type === 'student') {
          updated = await fetchStudentProfile(parsed);
        } else {
          return;
        }
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
      } catch {
        // Keep cached user — don't log out just because refresh failed
      } finally {
        setLoading(false);
      }
    };
    refresh();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.post<AuthResponse>('/Authentication/Login', { email, password });
    localStorage.setItem('token', data.token);
    setToken(data.token);

    let newUser = buildUserFromAuth(data, data.token);

    if (newUser.type === 'landlord') {
      newUser = await fetchLandlordProfile(newUser);
    } else if (newUser.type === 'student') {
      newUser = await fetchStudentProfile(newUser);
    }

    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const signup = async (payload: SignupPayload) => {
    const data = await api.post<AuthResponse>('/Authentication/Register', payload);
    // Extract accountId from token immediately so CompleteProfile can use it
    const newUser = buildUserFromAuth(data, data.token);
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
    <AuthContext.Provider value={{ user, token, loading, login, logout, signup, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
