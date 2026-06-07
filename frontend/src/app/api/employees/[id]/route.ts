import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { requireRoles } from '@/lib/roles';
import { updateEmployeeSchema, formatZodError } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit-log';
import { Role } from '@prisma/client';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.ADMIN, Role.APPROVER);
    if (roleError) return roleError;

    const { id } = await params;
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!employee) {
      return NextResponse.json({ message: 'ไม่พบข้อมูลพนักงานที่ระบุ' }, { status: 404 });
    }
    return NextResponse.json(employee);
  } catch (error: any) {
    console.error('Get employee error:', error);
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
    const parsed = updateEmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const dto = parsed.data;

    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      return NextResponse.json({ message: 'ไม่พบข้อมูลพนักงานที่ระบุ' }, { status: 404 });
    }

    if (dto.employeeCode && dto.employeeCode !== employee.employeeCode) {
      const existingCode = await prisma.employee.findUnique({
        where: { employeeCode: dto.employeeCode },
      });
      if (existingCode) {
        return NextResponse.json({ message: 'รหัสพนักงานนี้ถูกใช้งานแล้วในระบบ' }, { status: 400 });
      }
    }

    if (dto.email && dto.email !== employee.email) {
      const existingEmail = await prisma.employee.findUnique({
        where: { email: dto.email },
      });
      if (existingEmail) {
        return NextResponse.json({ message: 'อีเมลพนักงานนี้ถูกใช้งานแล้วในระบบ' }, { status: 400 });
      }
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: dto,
    });

    await createAuditLog(user.sub, 'UPDATE_EMPLOYEE', 'Employee', id, employee, updated);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update employee error:', error);
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
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      return NextResponse.json({ message: 'ไม่พบข้อมูลพนักงานที่ระบุ' }, { status: 404 });
    }

    await prisma.employee.delete({ where: { id } });
    await createAuditLog(user.sub, 'DELETE_EMPLOYEE', 'Employee', id, employee, null);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete employee error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
