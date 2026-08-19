import { SignJWT, jwtVerify } from 'jose';
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

/** Seconds the session cookie survives. Kept in step with JWT_EXPIRES_IN's default. */
const COOKIE_MAX_AGE = 60 * 60 * 24;

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

export function authCookieOptions(maxAge: number = COOKIE_MAX_AGE) {
  return {
    httpOnly: true,
    // Plain http in local development would drop a Secure cookie entirely.
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

/** Attach a fresh session cookie to a response. */
export function setAuthCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(AUTH_COOKIE, token, authCookieOptions());
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
