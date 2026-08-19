import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { requireRoles } from '@/lib/roles';
import { updateAssetSchema, formatZodError } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit-log';
import { AssetStatus, BorrowStatus, Role } from '@prisma/client';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    const { id } = await params;
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        currentHolder: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: true,
          },
        },
      },
    });
    if (!asset) {
      return NextResponse.json({ message: 'ไม่พบข้อมูลสินทรัพย์ที่ระบุ' }, { status: 404 });
    }
    return NextResponse.json(asset);
  } catch (error: any) {
    console.error('Get asset error:', error);
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
    const parsed = updateAssetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const dto = parsed.data;

    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) {
      return NextResponse.json({ message: 'ไม่พบข้อมูลสินทรัพย์ที่ระบุ' }, { status: 404 });
    }

    if (dto.assetCode && dto.assetCode !== asset.assetCode) {
      const existingCode = await prisma.asset.findUnique({
        where: { assetCode: dto.assetCode },
      });
      if (existingCode) {
        return NextResponse.json({ message: 'รหัสสินทรัพย์นี้ถูกใช้งานแล้วในระบบ' }, { status: 400 });
      }
    }

    if (dto.qrCode && dto.qrCode !== asset.qrCode) {
      const existingQR = await prisma.asset.findUnique({
        where: { qrCode: dto.qrCode },
      });
      if (existingQR) {
        return NextResponse.json({ message: 'รหัส QR Code นี้ถูกใช้งานแล้วในระบบ' }, { status: 400 });
      }
    }

    const updated = await prisma.asset.update({
      where: { id },
      data: dto as any,
    });

    await createAuditLog(user.sub, 'UPDATE_ASSET', 'Asset', id, asset, updated);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update asset error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

/**
 * Statuses that mean the asset is still committed to an open borrow flow.
 * An asset in any of these states must not be retired until the flow is closed.
 */
const OPEN_BORROW_STATUSES = [
  BorrowStatus.PENDING,
  BorrowStatus.APPROVED,
  BorrowStatus.BORROWED,
  BorrowStatus.OVERDUE,
  BorrowStatus.RETURN_PENDING,
];

/**
 * Soft-delete only. Assets are never physically removed, because BorrowRequest
 * and AssetReturn rows reference them and carry the audit trail of the asset.
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.ADMIN);
    if (roleError) return roleError;

    const { id } = await params;
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) {
      return NextResponse.json({ message: 'ไม่พบข้อมูลสินทรัพย์ที่ระบุ' }, { status: 404 });
    }

    if (asset.status === AssetStatus.RETIRED) {
      return NextResponse.json(
        { message: 'สินทรัพย์นี้ถูกจำหน่ายออกจากระบบไปแล้ว ไม่จำเป็นต้องดำเนินการซ้ำ' },
        { status: 400 },
      );
    }

    const openBorrowCount = await prisma.borrowRequest.count({
      where: { assetId: id, status: { in: OPEN_BORROW_STATUSES } },
    });
    if (openBorrowCount > 0) {
      return NextResponse.json(
        {
          message:
            'ไม่สามารถจำหน่ายสินทรัพย์นี้ได้ เนื่องจากยังมีรายการยืมที่ค้างอยู่ในระบบ จำนวน ' +
            openBorrowCount +
            ' รายการ กรุณาปิดรายการยืม-คืนให้เรียบร้อยก่อน',
        },
        { status: 400 },
      );
    }

    const [borrowCount, returnCount] = await Promise.all([
      prisma.borrowRequest.count({ where: { assetId: id } }),
      prisma.assetReturn.count({ where: { assetId: id } }),
    ]);

    const retired = await prisma.asset.update({
      where: { id },
      data: { status: AssetStatus.RETIRED, currentHolderId: null },
    });

    await createAuditLog(user.sub, 'RETIRE_ASSET', 'Asset', id, asset, retired);

    const hasHistory = borrowCount > 0 || returnCount > 0;
    return NextResponse.json({
      success: true,
      softDeleted: true,
      asset: retired,
      message: hasHistory
        ? 'เปลี่ยนสถานะเป็น RETIRED (จำหน่ายแล้ว) แทนการลบ เนื่องจากสินทรัพย์นี้มีประวัติการยืม ' +
          borrowCount +
          ' รายการ และประวัติการคืน ' +
          returnCount +
          ' รายการ ซึ่งต้องเก็บไว้เพื่อการตรวจสอบย้อนหลัง'
        : 'เปลี่ยนสถานะเป็น RETIRED (จำหน่ายแล้ว) แทนการลบ เพื่อรักษาความต่อเนื่องของทะเบียนทรัพย์สินและ Audit Log',
    });
  } catch (error: any) {
    console.error('Retire asset error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
