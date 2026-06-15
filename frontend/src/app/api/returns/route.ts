import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { requireRoles } from '@/lib/roles';
import { createReturnSchema, formatZodError } from '@/lib/validations';
import { AssetStatus, BorrowStatus, ConditionStatus, Role } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.ADMIN, Role.APPROVER, Role.VIEWER);
    if (roleError) return roleError;

    const returns = await prisma.assetReturn.findMany({
      where: {
        borrowRequest: {
          status: BorrowStatus.RETURNED,
        },
      },
      include: {
        borrowRequest: {
          include: { borrower: true },
        },
        asset: true,
        recordedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { returnDate: 'desc' },
    });
    return NextResponse.json(returns);
  } catch (error: any) {
    console.error('Get returns error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.ADMIN, Role.STAFF);
    if (roleError) return roleError;

    const body = await request.json();
    const parsed = createReturnSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const dto = parsed.data;

    const borrowRequest = await prisma.borrowRequest.findUnique({
      where: { id: dto.borrowRequestId },
      include: { asset: true },
    });

    if (!borrowRequest) {
      return NextResponse.json({ message: 'ไม่พบข้อมูลการยืมที่ระบุ' }, { status: 404 });
    }

    if (user.role === Role.STAFF && borrowRequest.borrowerId !== user.employeeId) {
      return NextResponse.json({ message: 'คุณไม่มีสิทธิ์คืนสินทรัพย์ของผู้อื่น' }, { status: 403 });
    }

    if (
      borrowRequest.status !== BorrowStatus.BORROWED &&
      borrowRequest.status !== BorrowStatus.OVERDUE
    ) {
      return NextResponse.json({
        message: 'ไม่สามารถคืนสินทรัพย์ได้ เนื่องจากรายการขอยืมไม่อยู่ในสถานะถูกยืมอยู่ (สถานะปัจจุบัน: ' + borrowRequest.status + ')',
      }, { status: 400 });
    }

    // Execute within transaction
    const result = await prisma.$transaction(async (tx) => {
      const isAdmin = user.role === Role.ADMIN;

      if (isAdmin) {
        let nextAssetStatus: AssetStatus = AssetStatus.AVAILABLE;
        if (dto.condition === ConditionStatus.DAMAGED) {
          nextAssetStatus = AssetStatus.MAINTENANCE;
        } else if (dto.condition === ConditionStatus.LOST) {
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
        await tx.borrowRequest.update({
          where: { id: dto.borrowRequestId },
          data: { status: BorrowStatus.RETURNED },
        });

        // Create Asset Return log
        const assetReturn = await tx.assetReturn.create({
          data: {
            borrowRequestId: dto.borrowRequestId,
            assetId: borrowRequest.assetId,
            condition: dto.condition as ConditionStatus,
            conditionNote: dto.conditionNote || null,
            imageUrl: dto.imageUrl || null,
            cloudinaryPublicId: dto.cloudinaryPublicId || null,
            recordedById: user.sub,
          },
          include: {
            borrowRequest: {
              include: { borrower: true },
            },
            asset: true,
            recordedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        });

        // Create Audit Log
        await tx.auditLog.create({
          data: {
            userId: user.sub,
            action: 'RETURN_ASSET',
            entityType: 'AssetReturn',
            entityId: assetReturn.id,
            newData: assetReturn as any,
          },
        });

        return assetReturn;
      } else {
        // STAFF path: request return with admin approval
        // Update Borrow Request status to RETURN_PENDING
        await tx.borrowRequest.update({
          where: { id: dto.borrowRequestId },
          data: { status: BorrowStatus.RETURN_PENDING },
        });

        // Create Asset Return log (pending approval)
        const assetReturn = await tx.assetReturn.create({
          data: {
            borrowRequestId: dto.borrowRequestId,
            assetId: borrowRequest.assetId,
            condition: dto.condition as ConditionStatus,
            conditionNote: dto.conditionNote || null,
            imageUrl: dto.imageUrl || null,
            cloudinaryPublicId: dto.cloudinaryPublicId || null,
            recordedById: user.sub,
          },
          include: {
            borrowRequest: {
              include: { borrower: true },
            },
            asset: true,
            recordedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        });

        // Create Audit Log for request return
        await tx.auditLog.create({
          data: {
            userId: user.sub,
            action: 'REQUEST_ASSET_RETURN',
            entityType: 'AssetReturn',
            entityId: assetReturn.id,
            newData: assetReturn as any,
          },
        });

        return assetReturn;
      }
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Create return error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
