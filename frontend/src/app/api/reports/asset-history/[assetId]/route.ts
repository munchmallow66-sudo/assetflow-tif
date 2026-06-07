import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { requireRoles } from '@/lib/roles';
import { Role } from '@prisma/client';

type Params = { params: Promise<{ assetId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.ADMIN, Role.APPROVER, Role.VIEWER);
    if (roleError) return roleError;

    const { assetId } = await params;
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) {
      return NextResponse.json({ message: 'ไม่พบข้อมูลสินทรัพย์ที่ระบุ' }, { status: 404 });
    }

    const history = await prisma.borrowRequest.findMany({
      where: { assetId },
      include: {
        borrower: true,
        assetReturn: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(history);
  } catch (error: any) {
    console.error('Get asset history error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
