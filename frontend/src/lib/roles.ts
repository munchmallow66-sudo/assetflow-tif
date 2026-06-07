import { Role } from '@prisma/client';
import { JwtPayload, forbidden } from './auth';
import { NextResponse } from 'next/server';

/**
 * Check if the user has one of the required roles.
 * Returns a 403 NextResponse if not authorized, or null if OK.
 */
export function requireRoles(
  user: JwtPayload,
  ...roles: Role[]
): NextResponse | null {
  if (!roles || roles.length === 0) return null;
  if (!roles.includes(user.role)) {
    return forbidden('คุณไม่มีสิทธิ์ในการเข้าถึงข้อมูลนี้');
  }
  return null;
}
