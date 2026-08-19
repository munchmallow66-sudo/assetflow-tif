import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { requireRoles } from '@/lib/roles';
import { createAssetSchema, formatZodError } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit-log';
import { AssetStatus, Role } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    // ?q= powers the header quick search. It is a narrow lookup, so it caps the
    // result set; without it the endpoint still returns the full registry that
    // the asset, report and borrow screens rely on.
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();

    const assets = await prisma.asset.findMany({
      ...(q
        ? {
            where: {
              OR: [
                { assetCode: { contains: q, mode: 'insensitive' as const } },
                { name: { contains: q, mode: 'insensitive' as const } },
              ],
            },
            take: 10,
          }
        : {}),
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
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(assets);
  } catch (error: any) {
    console.error('Get assets error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.ADMIN);
    if (roleError) return roleError;

    const body = await request.json();
    const parsed = createAssetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const dto = parsed.data;

    const existingCode = await prisma.asset.findUnique({
      where: { assetCode: dto.assetCode },
    });
    if (existingCode) {
      return NextResponse.json({ message: 'รหัสสินทรัพย์นี้ถูกใช้งานแล้วในระบบ' }, { status: 400 });
    }

    const existingQR = await prisma.asset.findUnique({
      where: { qrCode: dto.qrCode },
    });
    if (existingQR) {
      return NextResponse.json({ message: 'รหัส QR Code นี้ถูกใช้งานแล้วในระบบ' }, { status: 400 });
    }

    const asset = await prisma.asset.create({
      data: {
        ...dto,
        status: AssetStatus.AVAILABLE,
      },
    });

    await createAuditLog(user.sub, 'CREATE_ASSET', 'Asset', asset.id, null, asset);
    return NextResponse.json(asset, { status: 201 });
  } catch (error: any) {
    console.error('Create asset error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
