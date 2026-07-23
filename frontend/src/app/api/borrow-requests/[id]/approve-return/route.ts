import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { requireRoles } from '@/lib/roles';
import { sendReturnStatusNotification } from '@/lib/email';
import { BorrowStatus, AssetStatus, Role, ConditionStatus } from '@prisma/client';


type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.ADMIN);
    if (roleError) return roleError;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const returnDateVal = body.returnDate;

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

    if (!borrowRequest.assetReturn) {
      return NextResponse.json({ message: 'ไม่พบข้อมูลบันทึกสภาพการส่งคืนสินทรัพย์' }, { status: 400 });
    }

    // Use Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      let nextAssetStatus: AssetStatus = AssetStatus.AVAILABLE;
      if (borrowRequest.assetReturn?.condition === ConditionStatus.DAMAGED) {
        nextAssetStatus = AssetStatus.MAINTENANCE;
      } else if (borrowRequest.assetReturn?.condition === ConditionStatus.LOST) {
        nextAssetStatus = AssetStatus.LOST;
      }

      // Update Asset status and release holder
      await tx.asset.update({
        where: { id: borrowRequest.assetId },
        data: {
          status: nextAssetStatus,
          currentHolderId: null,
        },
      });

      // Update Borrow Request status to RETURNED
      const updatedRequest = await tx.borrowRequest.update({
        where: { id },
        data: {
          status: BorrowStatus.RETURNED,
        },
        include: { asset: true, borrower: true },
      });

      // Set recordedById in AssetReturn to the admin's user ID since they verified it
      await tx.assetReturn.update({
        where: { borrowRequestId: id },
        data: {
          recordedById: user.sub,
          ...(returnDateVal ? { returnDate: new Date(returnDateVal) } : {}),
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.sub,
          action: 'APPROVE_ASSET_RETURN',
          entityType: 'BorrowRequest',
          entityId: id,
          oldData: borrowRequest as any,
          newData: updatedRequest as any,
        },
      });

      return updatedRequest;
    });

    sendReturnStatusNotification(result, 'APPROVED_RETURN').catch((err) => console.error('Send approve return email error:', err));
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Approve asset return error:', error);
    const status = error.message?.includes('ไม่พบ') ? 400 : 500;
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status });
  }
}
