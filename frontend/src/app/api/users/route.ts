import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { requireRoles } from '@/lib/roles';
import { createUserSchema, formatZodError } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit-log';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.ADMIN);
    if (roleError) return roleError;

    const users = await prisma.user.findMany({
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(users.map(({ password, ...u }) => u));
  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.ADMIN);
    if (roleError) return roleError;

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const dto = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      return NextResponse.json({ message: 'อีเมลนี้ถูกใช้งานแล้วในระบบ' }, { status: 400 });
    }

    if (dto.employeeId) {
      const emp = await prisma.employee.findUnique({ where: { id: dto.employeeId } });
      if (!emp) {
        return NextResponse.json({ message: 'ไม่พบข้อมูลพนักงานที่ระบุ' }, { status: 404 });
      }
      const link = await prisma.user.findUnique({ where: { employeeId: dto.employeeId } });
      if (link) {
        return NextResponse.json({ message: 'พนักงานท่านนี้ได้รับการเชื่อมโยงกับบัญชีผู้ใช้แล้ว' }, { status: 400 });
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newUser = await prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: dto.role as Role,
        employeeId: dto.employeeId || null,
      },
      include: { employee: true },
    });

    const { password, ...result } = newUser;
    await createAuditLog(user.sub, 'CREATE_USER', 'User', newUser.id, null, result);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
