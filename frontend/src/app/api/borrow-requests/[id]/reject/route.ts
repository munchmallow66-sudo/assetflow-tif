import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { requireRoles } from '@/lib/roles';
import { rejectRequestSchema, formatZodError } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit-log';
import { BorrowStatus, Role } from '@prisma/client';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.ADMIN, Role.APPROVER);
    if (roleError) return roleError;

    const { id } = await params;
    const body = await request.json();
    const parsed = rejectRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const dto = parsed.data;

    const borrowRequest = await prisma.borrowRequest.findUnique({ where: { id } });
    if (!borrowRequest) {
      return NextResponse.json({ message: 'ไม่พบคำขอยืมสินทรัพย์' }, { status: 404 });
    }

    if (borrowRequest.status !== BorrowStatus.PENDING) {
      return NextResponse.json({
        message: 'คำขอนี้ได้รับการประมวลผลแล้ว (สถานะปัจจุบัน: ' + borrowRequest.status + ')',
      }, { status: 400 });
    }

    const updatedRequest = await prisma.borrowRequest.update({
      where: { id },
      data: {
        status: BorrowStatus.REJECTED,
        rejectedReason: dto.rejectedReason,
        approvedById: user.sub,
        approvedAt: new Date(),
      },
      include: { asset: true, borrower: true },
    });

    await createAuditLog(user.sub, 'REJECT_BORROW_REQUEST', 'BorrowRequest', id, borrowRequest, updatedRequest);
    return NextResponse.json(updatedRequest);
  } catch (error: any) {
    console.error('Reject borrow request error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
