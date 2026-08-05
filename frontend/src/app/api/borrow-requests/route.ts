import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { requireRoles } from '@/lib/roles';
import { createBorrowRequestSchema, formatZodError } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit-log';
import { sendBorrowRequestNotification } from '@/lib/email';
import { BorrowStatus, AssetStatus, Role } from '@prisma/client';


export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const take = limitParam ? parseInt(limitParam, 10) : undefined;

    // Staff can only view their own requests
    const where: any = {};
    if (user.role === Role.STAFF && user.employeeId) {
      where.borrowerId = user.employeeId;
    }

    const requests = await prisma.borrowRequest.findMany({
      where,
      include: {
        asset: true,
        borrower: true,
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
        assetReturn: true,
      },
      orderBy: { createdAt: 'desc' },
      ...(take && !isNaN(take) ? { take } : {}),
    });
    return NextResponse.json(requests);
  } catch (error: any) {
    console.error('Get borrow requests error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.STAFF, Role.ADMIN, Role.APPROVER);
    if (roleError) return roleError;

    const body = await request.json();
    const parsed = createBorrowRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const dto = parsed.data;

    let finalBorrowerId = user.employeeId;

    // Only Admin can specify targetBorrowerId to borrow on behalf of another employee
    if (user.role === Role.ADMIN && dto.targetBorrowerId) {
      const targetEmp = await prisma.employee.findUnique({ where: { id: dto.targetBorrowerId } });
      if (!targetEmp) {
        return NextResponse.json({
          message: 'ไม่พบข้อมูลพนักงานที่ระบุสำหรับยืมแทน',
        }, { status: 400 });
      }
      finalBorrowerId = dto.targetBorrowerId;
    } else {
      if (!user.employeeId) {
        return NextResponse.json({
          message: 'ไม่สามารถทำรายการได้ เนื่องจากบัญชีผู้ใช้ของคุณไม่ได้เชื่อมโยงกับพนักงาน',
        }, { status: 400 });
      }
    }

    const asset = await prisma.asset.findUnique({ where: { id: dto.assetId } });
    if (!asset) {
      return NextResponse.json({ message: 'ไม่พบข้อมูลสินทรัพย์ที่ระบุ' }, { status: 404 });
    }

    if (asset.status !== AssetStatus.AVAILABLE) {
      return NextResponse.json({
        message: 'สินทรัพย์นี้ไม่พร้อมใช้งานสำหรับการยืม (สถานะปัจจุบัน: ' + asset.status + ')',
      }, { status: 400 });
    }

    // Generate Request Number (REQ-YYYYMMDD-XXXX)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;

    const count = await prisma.borrowRequest.count({
      where: { requestNo: { startsWith: `REQ-${dateStr}-` } },
    });

    const seq = String(count + 1).padStart(4, '0');
    const requestNo = `REQ-${dateStr}-${seq}`;

    const borrowRequest = await prisma.borrowRequest.create({
      data: {
        requestNo,
        borrowerId: finalBorrowerId!,
        assetId: dto.assetId,
        borrowDate: new Date(dto.borrowDate),
        expectedReturnDate: new Date(dto.expectedReturnDate),
        purpose: dto.purpose,
        status: BorrowStatus.PENDING,
        signature: dto.signature || null,
      },
      include: { asset: true, borrower: true },
    });

    const auditAction = finalBorrowerId !== user.employeeId ? 'CREATE_BORROW_REQUEST_ON_BEHALF' : 'CREATE_BORROW_REQUEST';
    await createAuditLog(user.sub, auditAction, 'BorrowRequest', borrowRequest.id, null, borrowRequest);
    sendBorrowRequestNotification(borrowRequest).catch((err) => console.error('Send borrow request email error:', err));
    return NextResponse.json(borrowRequest, { status: 201 });

  } catch (error: any) {
    console.error('Create borrow request error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
