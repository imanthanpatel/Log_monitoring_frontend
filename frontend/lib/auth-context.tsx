'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  clearAuth,
  getCurrentUser,
  getStoredUser,
  getToken,
  login as apiLogin,
  logout as apiLogout,
  setStoredUser,
  setTokens,
} from './api';
import type { Role, User } from './types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    const stored = getStoredUser();
    if (stored) setUser(stored);
    getCurrentUser()
      .then((u) => {
        setUser(u);
        setStoredUser(u);
      })
      .catch(() => {
        clearAuth();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await apiLogin(username, password);
    const access = res.access || res.access_token;
    if (!access) throw new Error('No access token returned');
    setTokens(access, res.refresh || res.refresh_token);
    if (res.user) {
      setUser(res.user);
      setStoredUser(res.user);
    } else {
      const u = await getCurrentUser();
      setUser(u);
      setStoredUser(u);
    }
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    router.push('/login');
  }, [router]);

  const refreshUser = useCallback(async () => {
    const u = await getCurrentUser();
    setUser(u);
    setStoredUser(u);
  }, []);

  const hasRole = useCallback(
    (...roles: Role[]) => (user ? roles.includes(user.role) : false),
    [user]
  );

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, refreshUser, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
