import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { requireRoles } from '@/lib/roles';
import { updateEmployeeSchema, formatZodError } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit-log';
import { BorrowStatus, Role } from '@prisma/client';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.ADMIN, Role.APPROVER, Role.STAFF, Role.VIEWER);
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

/**
 * Statuses that mean the employee is still committed to an open borrow flow.
 */
const OPEN_BORROW_STATUSES = [
  BorrowStatus.PENDING,
  BorrowStatus.APPROVED,
  BorrowStatus.BORROWED,
  BorrowStatus.OVERDUE,
  BorrowStatus.RETURN_PENDING,
];

/**
 * Soft-delete only. Employees are never physically removed, because their
 * BorrowRequest rows carry the borrowing history of the organisation.
 */
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

    if (!employee.isActive) {
      return NextResponse.json(
        { message: 'พนักงานท่านนี้ถูกปิดการใช้งานไปแล้ว ไม่จำเป็นต้องดำเนินการซ้ำ' },
        { status: 400 },
      );
    }

    const [openBorrowCount, heldAssetCount] = await Promise.all([
      prisma.borrowRequest.count({
        where: { borrowerId: id, status: { in: OPEN_BORROW_STATUSES } },
      }),
      prisma.asset.count({ where: { currentHolderId: id } }),
    ]);

    if (openBorrowCount > 0 || heldAssetCount > 0) {
      return NextResponse.json(
        {
          message:
            'ไม่สามารถปิดการใช้งานพนักงานท่านนี้ได้ เนื่องจากยังมีรายการยืมค้างอยู่ ' +
            openBorrowCount +
            ' รายการ และถือครองสินทรัพย์อยู่ ' +
            heldAssetCount +
            ' ชิ้น กรุณาปิดรายการยืม-คืนให้เรียบร้อยก่อน',
        },
        { status: 400 },
      );
    }

    const borrowCount = await prisma.borrowRequest.count({ where: { borrowerId: id } });

    const deactivated = await prisma.employee.update({
      where: { id },
      data: { isActive: false },
    });

    await createAuditLog(user.sub, 'DEACTIVATE_EMPLOYEE', 'Employee', id, employee, deactivated);

    return NextResponse.json({
      success: true,
      softDeleted: true,
      employee: deactivated,
      message:
        borrowCount > 0
          ? 'ปิดการใช้งานพนักงานแทนการลบ เนื่องจากมีประวัติการยืม ' +
            borrowCount +
            ' รายการ ที่ต้องเก็บไว้เพื่อการตรวจสอบย้อนหลัง'
          : 'ปิดการใช้งานพนักงานแทนการลบ เพื่อรักษาความต่อเนื่องของทะเบียนพนักงานและ Audit Log',
    });
  } catch (error: any) {
    console.error('Deactivate employee error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
