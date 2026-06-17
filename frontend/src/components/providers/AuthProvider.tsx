'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'STAFF' | 'APPROVER' | 'VIEWER';
  employeeId?: string | null;
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    department: string;
    email: string;
    phone?: string | null;
  } | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: any) => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('tif_token');
      const storedUser = localStorage.getItem('tif_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setLoading(false);
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('tif_user', JSON.stringify(res.data));
        } catch {
          localStorage.removeItem('tif_token');
          localStorage.removeItem('tif_user');
          setUser(null);
          setToken(null);
        }
      } else {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Route guarding based on roles
  useEffect(() => {
    if (loading) return;

    const isPublicPath = pathname === '/login' || pathname === '/';

    if (!token && !isPublicPath) {
      router.push('/login');
    } else if (token && isPublicPath) {
      router.push('/dashboard');
    } else if (token && user) {
      // Role guards for frontend routes
      if (pathname.startsWith('/users') && user.role !== 'ADMIN') {
        router.push('/dashboard');
      }
      if (pathname.startsWith('/employees') && user.role !== 'ADMIN') {
        router.push('/dashboard');
      }
      if (
        pathname.startsWith('/returns/new') &&
        user.role !== 'ADMIN' &&
        user.role !== 'STAFF' &&
        user.role !== 'APPROVER'
      ) {
        router.push('/dashboard');
      }
      if (pathname.startsWith('/borrow/pending') && user.role !== 'ADMIN' && user.role !== 'APPROVER') {
        router.push('/dashboard');
      }
    }
  }, [pathname, token, user, loading, router]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, user: userData } = res.data;

      localStorage.setItem('tif_token', accessToken);
      localStorage.setItem('tif_user', JSON.stringify(userData));

      setToken(accessToken);
      setUser(userData);
      setLoading(false);

      router.push('/dashboard');
    } catch (error: any) {
      setLoading(false);
      throw error.response?.data?.message || 'การเข้าสู่ระบบล้มเหลว';
    }
  };

  const register = async (data: any) => {
    try {
      await api.post('/auth/register', data);
    } catch (error: any) {
      throw error.response?.data?.message || 'การลงทะเบียนล้มเหลว';
    }
  };

  const logout = () => {
    localStorage.removeItem('tif_token');
    localStorage.removeItem('tif_user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  const checkAuth = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
      localStorage.setItem('tif_user', JSON.stringify(res.data));
    } catch {
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
