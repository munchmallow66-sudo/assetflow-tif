import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import { registerSchema, formatZodError } from '@/lib/validations';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const dto = parsed.data;

    // Check if email already exists in User
    const existingUser = await prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      return NextResponse.json({ message: 'อีเมลนี้ถูกใช้งานแล้วในระบบ' }, { status: 400 });
    }

    // Check if employee code or email exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeCode: dto.employeeCode },
    });
    if (existingEmployee) {
      return NextResponse.json({ message: 'รหัสพนักงานนี้ถูกใช้งานแล้วในระบบ' }, { status: 400 });
    }

    const existingEmployeeEmail = await prisma.employee.findUnique({
      where: { email: dto.email },
    });
    if (existingEmployeeEmail) {
      return NextResponse.json({ message: 'อีเมลพนักงานนี้ถูกใช้งานแล้วในระบบ' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create Employee and User in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const employee = await tx.employee.create({
        data: {
          employeeCode: dto.employeeCode,
          firstName: dto.firstName,
          lastName: dto.lastName,
          department: dto.department,
          email: dto.email,
          phone: dto.phone,
        },
      });

      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          name: dto.name,
          role: Role.STAFF,
          employeeId: employee.id,
        },
      });

      // Log action in audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'REGISTER',
          entityType: 'User',
          entityId: user.id,
          newData: {
            email: user.email,
            name: user.name,
            role: user.role,
          } as any,
        },
      });

      const { password, ...userResult } = user;
      return userResult;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
