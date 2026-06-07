import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { requireRoles } from '@/lib/roles';
import { updateAssetSchema, formatZodError } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit-log';
import { AssetStatus, Role } from '@prisma/client';

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

    try {
      await prisma.asset.delete({ where: { id } });
      await createAuditLog(user.sub, 'DELETE_ASSET', 'Asset', id, asset, null);
    } catch {
      const retired = await prisma.asset.update({
        where: { id },
        data: { status: AssetStatus.RETIRED },
      });
      await createAuditLog(user.sub, 'RETIRE_ASSET', 'Asset', id, asset, retired);
      return NextResponse.json({
        success: true,
        message: 'เปลี่ยนสถานะเป็น RETIRED เนื่องจากมีประวัติการทำรายการในระบบ',
      });
    }

    return NextResponse.json({ success: true, message: 'ลบสินทรัพย์เรียบร้อยแล้ว' });
  } catch (error: any) {
    console.error('Delete asset error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
