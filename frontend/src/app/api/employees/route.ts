import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { requireRoles } from '@/lib/roles';
import { createEmployeeSchema, formatZodError } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit-log';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.ADMIN, Role.APPROVER, Role.STAFF, Role.VIEWER);
    if (roleError) return roleError;

    // Deactivated employees are hidden by default so they cannot be picked as
    // a borrower. Callers that legitimately need them - the employee admin
    // screen and the history report selector - opt in explicitly. Borrowing
    // history is never filtered: it reads the employee through its own
    // relation, not through this list.
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const employees = await prisma.employee.findMany({
      where: includeInactive ? {} : { isActive: true },
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

    const { account, ...employeeData } = dto;

    // An employee row alone cannot sign in - the password lives on User - so the
    // admin may attach an account in the same step. Its email is the employee's,
    // which means the User table has to be free of it too.
    if (account) {
      const existingAccount = await prisma.user.findUnique({ where: { email: dto.email } });
      if (existingAccount) {
        return NextResponse.json(
          { message: 'อีเมลนี้ถูกใช้เป็นบัญชีผู้ใช้งานอยู่แล้ว กรุณาใช้อีเมลอื่น หรือสร้างบัญชีให้ภายหลัง' },
          { status: 400 },
        );
      }
    }

    // Hashed before the transaction opens on purpose: bcrypt is deliberately
    // slow and must not hold a database transaction open while it runs.
    const hashedPassword = account ? await bcrypt.hash(account.password, 10) : null;

    // Both rows are written together. A half-finished result - an employee whose
    // account creation failed - would leave someone unable to sign in with no
    // sign of why on the employee screen.
    const { employee, newUser } = await prisma.$transaction(async (tx) => {
      const employee = await tx.employee.create({ data: employeeData });

      if (!account || !hashedPassword) {
        return { employee, newUser: null };
      }

      const newUser = await tx.user.create({
        data: {
          email: employee.email,
          password: hashedPassword,
          name: employee.firstName + ' ' + employee.lastName,
          role: account.role as Role,
          employeeId: employee.id,
        },
      });

      return { employee, newUser };
    });

    await createAuditLog(user.sub, 'CREATE_EMPLOYEE', 'Employee', employee.id, null, employee);

    if (newUser) {
      const { password, ...userData } = newUser;
      await createAuditLog(user.sub, 'CREATE_USER', 'User', newUser.id, null, userData);
    }

    return NextResponse.json({ ...employee, accountCreated: Boolean(newUser) }, { status: 201 });
  } catch (error: any) {
    console.error('Create employee error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
