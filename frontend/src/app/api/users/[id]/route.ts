import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { requireRoles } from '@/lib/roles';
import { updateUserSchema, formatZodError } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit-log';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.ADMIN);
    if (roleError) return roleError;

    const { id } = await params;
    const foundUser = await prisma.user.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!foundUser) {
      return NextResponse.json({ message: 'ไม่พบผู้ใช้งานในระบบ' }, { status: 404 });
    }
    const { password, ...result } = foundUser;
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.ADMIN);
    if (roleError) return roleError;

    const { id } = await params;
    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const dto = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ message: 'ไม่พบผู้ใช้งานในระบบ' }, { status: 404 });
    }

    if (dto.email && dto.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({ where: { email: dto.email } });
      if (emailExists) {
        return NextResponse.json({ message: 'อีเมลนี้ถูกใช้งานแล้วในระบบ' }, { status: 400 });
      }
    }

    if (dto.employeeId && dto.employeeId !== existingUser.employeeId) {
      const emp = await prisma.employee.findUnique({ where: { id: dto.employeeId } });
      if (!emp) {
        return NextResponse.json({ message: 'ไม่พบข้อมูลพนักงานที่ระบุ' }, { status: 404 });
      }
      const link = await prisma.user.findUnique({ where: { employeeId: dto.employeeId } });
      if (link && link.id !== id) {
        return NextResponse.json({ message: 'พนักงานท่านนี้ได้รับการเชื่อมโยงกับบัญชีผู้ใช้แล้ว' }, { status: 400 });
      }
    }

    const data: any = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      include: { employee: true },
    });

    const { password: oldPass, ...oldResult } = existingUser;
    const { password: newPass, ...newResult } = updated;
    await createAuditLog(user.sub, 'UPDATE_USER', 'User', id, oldResult, newResult);
    return NextResponse.json(newResult);
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.ADMIN);
    if (roleError) return roleError;

    const { id } = await params;
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ message: 'ไม่พบผู้ใช้งานในระบบ' }, { status: 404 });
    }

    if (existingUser.id === user.sub) {
      return NextResponse.json({ message: 'คุณไม่สามารถลบบัญชีผู้ใช้งานของตนเองได้' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });

    const { password, ...result } = existingUser;
    await createAuditLog(user.sub, 'DELETE_USER', 'User', id, result, null);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
