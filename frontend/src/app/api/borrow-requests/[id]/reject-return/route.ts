import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { requireRoles } from '@/lib/roles';
import { BorrowStatus, Role } from '@prisma/client';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.ADMIN);
    if (roleError) return roleError;

    const { id } = await params;
    const borrowRequest = await prisma.borrowRequest.findUnique({
      where: { id },
      include: { asset: true, assetReturn: true },
    });

    if (!borrowRequest) {
      return NextResponse.json({ message: 'ไม่พบคำขอยืมสินทรัพย์' }, { status: 404 });
    }

    if (borrowRequest.status !== BorrowStatus.RETURN_PENDING) {
      return NextResponse.json({
        message: 'คำขอนี้ไม่ได้อยู่ในสถานะรออนุมัติการคืน (สถานะปัจจุบัน: ' + borrowRequest.status + ')',
      }, { status: 400 });
    }

    // Determine the reverted status (either BORROWED or OVERDUE)
    const now = new Date();
    const revertedStatus = now > new Date(borrowRequest.expectedReturnDate)
      ? BorrowStatus.OVERDUE
      : BorrowStatus.BORROWED;

    const result = await prisma.$transaction(async (tx) => {
      // Revert borrow request status
      const updatedRequest = await tx.borrowRequest.update({
        where: { id },
        data: {
          status: revertedStatus,
        },
        include: { asset: true, borrower: true },
      });

      // Delete the associated AssetReturn record so user can resubmit later
      if (borrowRequest.assetReturn) {
        await tx.assetReturn.delete({
          where: { borrowRequestId: id },
        });
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.sub,
          action: 'REJECT_ASSET_RETURN',
          entityType: 'BorrowRequest',
          entityId: id,
          oldData: borrowRequest as any,
          newData: updatedRequest as any,
        },
      });

      return updatedRequest;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Reject asset return error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
