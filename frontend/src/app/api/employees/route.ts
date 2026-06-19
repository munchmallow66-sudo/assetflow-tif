import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { requireRoles } from '@/lib/roles';
import { createEmployeeSchema, formatZodError } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit-log';
import { Role } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.ADMIN, Role.APPROVER, Role.STAFF, Role.VIEWER);
    if (roleError) return roleError;

    const employees = await prisma.employee.findMany({
      orderBy: { employeeCode: 'asc' },
    });
    return NextResponse.json(employees);
  } catch (error: any) {
    console.error('Get employees error:', error);
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
    const parsed = createEmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const dto = parsed.data;

    const existingCode = await prisma.employee.findUnique({
      where: { employeeCode: dto.employeeCode },
    });
    if (existingCode) {
      return NextResponse.json({ message: 'รหัสพนักงานนี้ถูกใช้งานแล้วในระบบ' }, { status: 400 });
    }

    const existingEmail = await prisma.employee.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      return NextResponse.json({ message: 'อีเมลพนักงานนี้ถูกใช้งานแล้วในระบบ' }, { status: 400 });
    }

    const employee = await prisma.employee.create({ data: dto });
    await createAuditLog(user.sub, 'CREATE_EMPLOYEE', 'Employee', employee.id, null, employee);
    return NextResponse.json(employee, { status: 201 });
  } catch (error: any) {
    console.error('Create employee error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
