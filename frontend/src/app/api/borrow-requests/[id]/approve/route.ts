import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { requireRoles } from '@/lib/roles';
import { sendBorrowStatusNotification } from '@/lib/email';
import { BorrowStatus, AssetStatus, Role } from '@prisma/client';


type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.ADMIN, Role.APPROVER);
    if (roleError) return roleError;

    const { id } = await params;
    const borrowRequest = await prisma.borrowRequest.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!borrowRequest) {
      return NextResponse.json({ message: 'ไม่พบคำขอยืมสินทรัพย์' }, { status: 404 });
    }

    if (borrowRequest.status !== BorrowStatus.PENDING) {
      return NextResponse.json({
        message: 'คำขอนี้ได้รับการประมวลผลแล้ว (สถานะปัจจุบัน: ' + borrowRequest.status + ')',
      }, { status: 400 });
    }

    // Use Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.findUnique({
        where: { id: borrowRequest.assetId },
      });

      if (!asset) {
        throw new Error('ไม่พบข้อมูลสินทรัพย์');
      }

      if (asset.status !== AssetStatus.AVAILABLE) {
        throw new Error(
          'ไม่สามารถอนุมัติได้ เนื่องจากสินทรัพย์ไม่อยู่ในสถานะพร้อมใช้งาน (สถานะปัจจุบัน: ' + asset.status + ')',
        );
      }

      // Update Asset status and current holder
      await tx.asset.update({
        where: { id: asset.id },
        data: {
          status: AssetStatus.BORROWED,
          currentHolderId: borrowRequest.borrowerId,
        },
      });

      // Update Borrow Request status
      const updatedRequest = await tx.borrowRequest.update({
        where: { id },
        data: {
          status: BorrowStatus.BORROWED,
          approvedById: user.sub,
          approvedAt: new Date(),
        },
        include: { asset: true, borrower: true },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.sub,
          action: 'APPROVE_BORROW_REQUEST',
          entityType: 'BorrowRequest',
          entityId: id,
          oldData: borrowRequest as any,
          newData: updatedRequest as any,
        },
      });

      return updatedRequest;
    });

    sendBorrowStatusNotification(result, 'APPROVED').catch((err) => console.error('Send approve borrow email error:', err));
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Approve borrow request error:', error);
    const status = error.message?.includes('ไม่สามารถ') || error.message?.includes('ไม่พบ') ? 400 : 500;
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status });
  }
}
