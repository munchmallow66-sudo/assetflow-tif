import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import { loginSchema, formatZodError } from '@/lib/validations';
import * as bcrypt from 'bcryptjs';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

/** Five sign-in attempts per minute, per client address. */
const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 60_000;

export async function POST(request: NextRequest) {
  try {
    // Throttle before parsing the body or touching the database, so a flood
    // costs us a map lookup rather than a bcrypt comparison.
    const ip = getClientIp(request);
    const limit = rateLimit(`login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          message:
            'พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอ ' +
            limit.retryAfterSeconds +
            ' วินาทีแล้วลองใหม่อีกครั้ง',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(limit.retryAfterSeconds),
            'RateLimit-Limit': String(limit.limit),
            'RateLimit-Remaining': '0',
          },
        },
      );
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const dto = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: dto.email },
      include: { employee: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
    };

    const accessToken = await signToken(payload);

    // Create Audit Log for Login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
      },
    });

    const { password, ...result } = user;
    return NextResponse.json({
      accessToken,
      user: result,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
