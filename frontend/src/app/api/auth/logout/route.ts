import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

/**
 * Ends the session by expiring the cookie.
 *
 * Deliberately unconditional: it does not require a valid session, so a client
 * holding an expired or malformed token can still clear it. The middleware
 * still enforces CSRF on this route, since forcing a sign-out is a real
 * nuisance attack.
 */
export async function POST() {
  return clearAuthCookie(
    NextResponse.json({ success: true, message: 'ออกจากระบบเรียบร้อยแล้ว' }),
  );
}
