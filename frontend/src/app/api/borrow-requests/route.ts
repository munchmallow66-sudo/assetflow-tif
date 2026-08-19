import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { requireRoles } from '@/lib/roles';
import { createBorrowRequestSchema, borrowWindowError, formatZodError } from '@/lib/validations';
import { getSystemSettings } from '@/lib/settings';
import { daysBetween, todayInAppZone } from '@/lib/dates';
import { Prisma } from '@prisma/client';
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
      if (!targetEmp.isActive) {
        return NextResponse.json({
          message: 'ไม่สามารถทำรายการแทนพนักงานท่านนี้ได้ เนื่องจากบัญชีพนักงานถูกปิดการใช้งานแล้ว',
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

    // The borrow window is a policy, so it is read from SystemSetting rather
    // than hardcoded. The schema has already checked the dates are ordered and
    // not backdated; this is the part that needs the database.
    const settings = await getSystemSettings();
    const requestedDays = daysBetween(dto.borrowDate, dto.expectedReturnDate);
    const windowError = borrowWindowError(requestedDays, settings.maxBorrowDays);
    if (windowError) {
      return NextResponse.json({ message: windowError }, { status: 400 });
    }

    const dateStr = todayInAppZone().replace(/-/g, '');

    // REQ-YYYYMMDD-NNNN used to be derived from count() + 1, so two requests
    // submitted in the same moment computed the same number and the second one
    // died on the unique index. Take the highest number actually issued today
    // and retry on P2002, which is the collision this cannot fully prevent.
    const createWithRequestNo = async (): Promise<Awaited<ReturnType<typeof prisma.borrowRequest.create>>> => {
      const latest = await prisma.borrowRequest.findFirst({
        where: { requestNo: { startsWith: `REQ-${dateStr}-` } },
        orderBy: { requestNo: 'desc' },
        select: { requestNo: true },
      });

      const lastSeq = latest ? parseInt(latest.requestNo.slice(-4), 10) : 0;
      const seq = String((Number.isNaN(lastSeq) ? 0 : lastSeq) + 1).padStart(4, '0');

      return prisma.borrowRequest.create({
        data: {
          requestNo: `REQ-${dateStr}-${seq}`,
          borrowerId: finalBorrowerId!,
          assetId: dto.assetId,
          borrowDate: dto.borrowDate,
          expectedReturnDate: dto.expectedReturnDate,
          purpose: dto.purpose,
          status: BorrowStatus.PENDING,
          signature: dto.signature || null,
        },
        include: { asset: true, borrower: true },
      });
    };

    const MAX_ATTEMPTS = 5;
    let borrowRequest;
    for (let attempt = 1; ; attempt++) {
      try {
        borrowRequest = await createWithRequestNo();
        break;
      } catch (error) {
        const isDuplicateRequestNo =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          String(error.meta?.target ?? '').includes('requestNo');

        if (!isDuplicateRequestNo || attempt >= MAX_ATTEMPTS) throw error;
      }
    }

    const auditAction = finalBorrowerId !== user.employeeId ? 'CREATE_BORROW_REQUEST_ON_BEHALF' : 'CREATE_BORROW_REQUEST';
    await createAuditLog(user.sub, auditAction, 'BorrowRequest', borrowRequest.id, null, borrowRequest);
    sendBorrowRequestNotification(borrowRequest).catch((err) => console.error('Send borrow request email error:', err));
    return NextResponse.json(borrowRequest, { status: 201 });

  } catch (error: any) {
    console.error('Create borrow request error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
