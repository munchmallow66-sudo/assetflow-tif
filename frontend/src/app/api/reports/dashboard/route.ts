import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { requireRoles } from '@/lib/roles';
import { AssetStatus, BorrowStatus, Role } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.ADMIN, Role.APPROVER, Role.VIEWER, Role.STAFF);
    if (roleError) return roleError;

    const today = new Date();

    const [
      totalAssets,
      availableAssets,
      borrowedAssets,
      maintenanceAssets,
      lostAssets,
      pendingRequests,
      overdueRequests,
    ] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: AssetStatus.AVAILABLE } }),
      prisma.asset.count({ where: { status: AssetStatus.BORROWED } }),
      prisma.asset.count({ where: { status: AssetStatus.MAINTENANCE } }),
      prisma.asset.count({ where: { status: AssetStatus.LOST } }),
      prisma.borrowRequest.count({ where: { status: BorrowStatus.PENDING } }),
      prisma.borrowRequest.count({
        where: {
          status: BorrowStatus.BORROWED,
          expectedReturnDate: { lt: today },
        },
      }),
    ]);

    return NextResponse.json({
      totalAssets,
      availableAssets,
      borrowedAssets,
      maintenanceAssets,
      lostAssets,
      pendingRequests,
      overdueRequests,
    });
  } catch (error: any) {
    console.error('Get dashboard error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
