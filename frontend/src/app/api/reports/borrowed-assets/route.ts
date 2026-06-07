import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { requireRoles } from '@/lib/roles';
import { AssetStatus, BorrowStatus, Role } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.ADMIN, Role.APPROVER, Role.VIEWER);
    if (roleError) return roleError;

    const assets = await prisma.asset.findMany({
      where: { status: AssetStatus.BORROWED },
      include: {
        currentHolder: true,
        borrowRequests: {
          where: { status: BorrowStatus.BORROWED },
          include: { borrower: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    return NextResponse.json(assets);
  } catch (error: any) {
    console.error('Get borrowed assets error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
