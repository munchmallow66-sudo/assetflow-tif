import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { requireRoles } from '@/lib/roles';
import { ConditionStatus, Role } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.ADMIN, Role.APPROVER, Role.VIEWER);
    if (roleError) return roleError;

    const damagedReturns = await prisma.assetReturn.findMany({
      where: { condition: ConditionStatus.DAMAGED },
      include: {
        asset: true,
        borrowRequest: {
          include: { borrower: true },
        },
        recordedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { returnDate: 'desc' },
    });
    return NextResponse.json(damagedReturns);
  } catch (error: any) {
    console.error('Get damaged assets error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
