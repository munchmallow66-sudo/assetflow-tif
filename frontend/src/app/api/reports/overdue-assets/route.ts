import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { requireRoles } from '@/lib/roles';
import { BorrowStatus, Role } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.ADMIN, Role.APPROVER, Role.VIEWER);
    if (roleError) return roleError;

    const today = new Date();
    const overdueRequests = await prisma.borrowRequest.findMany({
      where: {
        status: BorrowStatus.BORROWED,
        expectedReturnDate: { lt: today },
      },
      include: {
        asset: true,
        borrower: true,
      },
      orderBy: { expectedReturnDate: 'asc' },
    });
    return NextResponse.json(overdueRequests);
  } catch (error: any) {
    console.error('Get overdue assets error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
