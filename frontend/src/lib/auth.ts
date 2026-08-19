import { SignJWT, jwtVerify, decodeJwt } from 'jose';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Type-only: proxy.ts runs on the edge runtime, where the Prisma client
// cannot be loaded. A value import here would drag it into that bundle.
import type { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  employeeId?: string | null;
}

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(secret);
};

export async function signToken(payload: JwtPayload): Promise<string> {
  let expiresIn: string | number = '1d';
  
  if (process.env.JWT_EXPIRES_IN) {
    const envVal = process.env.JWT_EXPIRES_IN.trim().replace(/^['"]|['"]$/g, '');
    if (/^\d+$/.test(envVal)) {
      expiresIn = Math.floor(Date.now() / 1000) + parseInt(envVal, 10);
    } else {
      expiresIn = envVal;
    }
  }

  try {
    return await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(getSecret());
  } catch (error) {
    console.warn('Invalid JWT_EXPIRES_IN format, falling back to "1d":', error);
    return await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d')
      .sign(getSecret());
  }
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

/** Name of the httpOnly session cookie. Never readable from document.cookie. */
export const AUTH_COOKIE = 'tif_session';

/**
 * The only place a request's identity is read.
 *
 * The token lives in an httpOnly cookie and nowhere else: no Authorization
 * header is accepted, so a stolen or forged header cannot stand in for a
 * session, and no script on the page can reach the credential.
 */
export async function getAuthUser(request: NextRequest): Promise<JwtPayload | null> {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  return verifyToken(token);
}

/**
 * Cookie attributes. maxAge is left to the caller because there is no default
 * lifetime to fall back on: how long the cookie lives is decided by the token
 * it carries. Omitting it yields a session cookie, which the browser drops when
 * it closes.
 */
export function authCookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    // Plain http in local development would drop a Secure cookie entirely.
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    ...(maxAge === undefined ? {} : { maxAge }),
  };
}

/**
 * Seconds until this token expires, or undefined if it carries no usable exp.
 *
 * Read from the token itself rather than from a constant, so JWT_EXPIRES_IN
 * stays the single thing that decides session length. Decoding without
 * verifying is fine here: we signed this token moments ago, and the value is
 * used only to tell the browser when to stop sending it back.
 */
function secondsUntilExpiry(token: string): number | undefined {
  try {
    const { exp } = decodeJwt(token);
    if (typeof exp !== 'number') return undefined;
    const remaining = exp - Math.floor(Date.now() / 1000);
    return remaining > 0 ? remaining : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Attach a fresh session cookie, expiring exactly when its token does.
 *
 * If the lifetime cannot be derived the cookie becomes a session cookie rather
 * than falling back to some invented duration: outliving the token it holds is
 * the one behaviour worth ruling out.
 */
export function setAuthCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(AUTH_COOKIE, token, authCookieOptions(secondsUntilExpiry(token)));
  return response;
}

/** Expire the session cookie. maxAge 0 tells the browser to drop it now. */
export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set(AUTH_COOKIE, '', authCookieOptions(0));
  return response;
}

export function unauthorized(message = 'กรุณาเข้าสู่ระบบก่อนใช้งาน') {
  return NextResponse.json({ message }, { status: 401 });
}

export function forbidden(message = 'คุณไม่มีสิทธิ์ในการเข้าถึงข้อมูลนี้') {
  return NextResponse.json({ message }, { status: 403 });
}
