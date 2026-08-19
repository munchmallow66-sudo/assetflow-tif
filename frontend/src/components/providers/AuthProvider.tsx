'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';
import { DEFAULT_REDIRECT, redirectTargetOrDefault } from '@/lib/redirect';

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
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Public paths that never need a session. Kept in step with proxy.ts. */
const PUBLIC_PATHS = ['/', '/login'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/scan');
}

/**
 * Where to land after signing in.
 *
 * proxy.ts records the page that was refused as ?from=. It is re-validated
 * here because it has been through the URL since: see lib/redirect.
 */
function redirectTargetAfterLogin(): string {
  if (typeof window === 'undefined') return DEFAULT_REDIRECT;
  return redirectTargetOrDefault(new URLSearchParams(window.location.search).get('from'));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  /**
   * The server is the only source of truth for who is signed in.
   *
   * There is no token to inspect on this side any more: the cookie is httpOnly,
   * so the session is confirmed by asking /api/auth/me, which reads it. A 401
   * simply means no session.
   */
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await api.get('/auth/me');
        if (active) setUser(res.data);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  /**
   * Client-side redirect for the signed-out case only.
   *
   * proxy.ts already refuses to serve a protected page without a session,
   * so this is a fallback for a session that lapses while the tab is open, not
   * the primary guard. Role checks are not repeated here: the middleware makes
   * that decision before any page is sent.
   */
  useEffect(() => {
    if (loading) return;
    if (!user && !isPublicPath(pathname)) {
      router.replace('/login');
    }
  }, [pathname, user, loading, router]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // The response carries the profile; the token comes back as a Set-Cookie
      // the browser stores and this code never sees.
      const res = await api.post('/auth/login', { email, password });
      setUser(res.data.user);
      setLoading(false);
      router.push(redirectTargetAfterLogin());
      router.refresh();
    } catch (error: any) {
      setLoading(false);
      throw error.response?.data?.message || 'การเข้าสู่ระบบล้มเหลว';
    }
  };

  const logout = async () => {
    try {
      // Only the server can expire an httpOnly cookie, so signing out is a
      // request, not a local state change.
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      setUser(null);
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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
