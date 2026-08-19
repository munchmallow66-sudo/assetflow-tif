// Type-only: this module is imported by the browser bundle for its constants,
// so it must not pull any server runtime in with it.
import type { NextRequest } from 'next/server';

/**
 * Double-submit CSRF protection.
 *
 * Moving the session into a cookie means the browser now attaches it to every
 * same-site request automatically, including ones a third-party page triggers.
 * SameSite=Lax already blocks the cross-site POST case, but it is a single
 * control and it does not cover a same-site subdomain. So every mutating API
 * call must also echo a random token back in a header, which a cross-origin
 * caller cannot read out of the cookie jar to forge.
 */
export const CSRF_COOKIE = 'tif_csrf';
export const CSRF_HEADER = 'x-csrf-token';

/** Methods that cannot change state, and therefore need no token. */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Readable by scripts on purpose: the client has to copy it into the header. */
export function csrfCookieOptions() {
  return {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24,
  };
}

export function generateCsrfToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Length-independent comparison, so a mismatch cannot be timed out byte by byte. */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function requiresCsrfCheck(request: NextRequest): boolean {
  return !SAFE_METHODS.has(request.method) && request.nextUrl.pathname.startsWith('/api/');
}

export function isCsrfValid(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken) return false;
  return constantTimeEquals(cookieToken, headerToken);
}

/**
 * Same-origin check, applied alongside the token.
 *
 * Browsers always send Origin on a cross-origin mutating request, so a
 * mismatch is decisive. A missing Origin is left to the token check rather
 * than rejected outright, because non-browser callers omit it.
 */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  try {
    return new URL(origin).host === request.nextUrl.host;
  } catch {
    return false;
  }
}
