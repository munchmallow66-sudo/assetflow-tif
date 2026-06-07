import { SignJWT, jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { Role } from '@prisma/client';

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
    let envVal = process.env.JWT_EXPIRES_IN.trim().replace(/^['"]|['"]$/g, '');
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

export async function getAuthUser(request: NextRequest): Promise<JwtPayload | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const [type, token] = authHeader.split(' ');
  if (type !== 'Bearer' || !token) return null;

  return verifyToken(token);
}

export function unauthorized(message = 'กรุณาเข้าสู่ระบบก่อนใช้งาน') {
  return NextResponse.json({ message }, { status: 401 });
}

export function forbidden(message = 'คุณไม่มีสิทธิ์ในการเข้าถึงข้อมูลนี้') {
  return NextResponse.json({ message }, { status: 403 });
}
