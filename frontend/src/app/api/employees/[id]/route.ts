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
 * Two removal modes.
 *
 * Default is a soft delete: the row stays and only `isActive` flips, because
 * the employee's BorrowRequest rows carry the borrowing history of the
 * organisation and must survive.
 *
 * `?permanent=true` physically removes the row. It is allowed only for an
 * employee who never took part in anything - no borrow request of any status,
 * no asset in hand, no login account attached - which is the record-created-by-
 * mistake case. Anything else has to stay for the audit trail.
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.ADMIN);
    if (roleError) return roleError;

    const { id } = await params;
    const permanent = new URL(request.url).searchParams.get('permanent') === 'true';

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true } } },
    });
    if (!employee) {
      return NextResponse.json({ message: 'ไม่พบข้อมูลพนักงานที่ระบุ' }, { status: 404 });
    }

    // The linked account is checked separately below; it must not leak into the
    // audit log snapshot, which records the employee row alone.
    const { user: linkedUser, ...employeeData } = employee;

    const [openBorrowCount, heldAssetCount, borrowCount] = await Promise.all([
      prisma.borrowRequest.count({
        where: { borrowerId: id, status: { in: OPEN_BORROW_STATUSES } },
      }),
      prisma.asset.count({ where: { currentHolderId: id } }),
      prisma.borrowRequest.count({ where: { borrowerId: id } }),
    ]);

    if (permanent) {
      if (borrowCount > 0) {
        return NextResponse.json(
          {
            message:
              'ไม่สามารถลบถาวรได้ เนื่องจากพนักงานท่านนี้มีประวัติการยืม ' +
              borrowCount +
              ' รายการ ที่ต้องเก็บไว้เพื่อการตรวจสอบย้อนหลัง กรุณาใช้การปิดการใช้งานแทน',
          },
          { status: 400 },
        );
      }

      if (heldAssetCount > 0) {
        return NextResponse.json(
          {
            message:
              'ไม่สามารถลบถาวรได้ เนื่องจากพนักงานท่านนี้ยังถือครองสินทรัพย์อยู่ ' +
              heldAssetCount +
              ' ชิ้น กรุณาคืนสินทรัพย์ให้เรียบร้อยก่อน',
          },
          { status: 400 },
        );
      }

      if (linkedUser) {
        return NextResponse.json(
          {
            message:
              'ไม่สามารถลบถาวรได้ เนื่องจากพนักงานท่านนี้ผูกอยู่กับบัญชีผู้ใช้งาน ' +
              linkedUser.email +
              ' กรุณาลบบัญชีผู้ใช้งานในหน้าจัดการผู้ใช้งานก่อน',
          },
          { status: 400 },
        );
      }

      await prisma.employee.delete({ where: { id } });
      await createAuditLog(user.sub, 'DELETE_EMPLOYEE', 'Employee', id, employeeData, null);

      return NextResponse.json({
        success: true,
        softDeleted: false,
        message: 'ลบข้อมูลพนักงานออกจากระบบถาวรเรียบร้อยแล้ว',
      });
    }

    if (!employee.isActive) {
      return NextResponse.json(
        { message: 'พนักงานท่านนี้ถูกปิดการใช้งานไปแล้ว ไม่จำเป็นต้องดำเนินการซ้ำ' },
        { status: 400 },
      );
    }

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

    const deactivated = await prisma.employee.update({
      where: { id },
      data: { isActive: false },
    });

    await createAuditLog(user.sub, 'DEACTIVATE_EMPLOYEE', 'Employee', id, employeeData, deactivated);

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
    console.error('Delete employee error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
