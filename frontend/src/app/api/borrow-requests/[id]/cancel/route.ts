import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { requireRoles } from '@/lib/roles';
import { createAuditLog } from '@/lib/audit-log';
import { BorrowStatus, Role } from '@prisma/client';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.STAFF, Role.ADMIN);
    if (roleError) return roleError;

    const { id } = await params;
    const borrowRequest = await prisma.borrowRequest.findUnique({ where: { id } });
    if (!borrowRequest) {
      return NextResponse.json({ message: 'ไม่พบคำขอยืมสินทรัพย์' }, { status: 404 });
    }

    if (borrowRequest.borrowerId !== user.employeeId) {
      return NextResponse.json({ message: 'คุณไม่มีสิทธิ์ยกเลิกคำขอนี้' }, { status: 400 });
    }

    if (borrowRequest.status !== BorrowStatus.PENDING) {
      return NextResponse.json({
        message: 'สามารถยกเลิกได้เฉพาะคำขอที่อยู่ในสถานะ PENDING เท่านั้น',
      }, { status: 400 });
    }

    const updatedRequest = await prisma.borrowRequest.update({
      where: { id },
      data: { status: BorrowStatus.CANCELLED },
      include: { asset: true, borrower: true },
    });

    await createAuditLog(user.sub, 'CANCEL_BORROW_REQUEST', 'BorrowRequest', id, borrowRequest, updatedRequest);
    return NextResponse.json(updatedRequest);
  } catch (error: any) {
    console.error('Cancel borrow request error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
