import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { requireRoles } from '@/lib/roles';
import { Role } from '@prisma/client';

type Params = { params: Promise<{ employeeId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.ADMIN, Role.APPROVER, Role.VIEWER);
    if (roleError) return roleError;

    const { employeeId } = await params;
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      return NextResponse.json({ message: 'ไม่พบข้อมูลพนักงานที่ระบุ' }, { status: 404 });
    }

    const history = await prisma.borrowRequest.findMany({
      where: { borrowerId: employeeId },
      include: {
        asset: true,
        assetReturn: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(history);
  } catch (error: any) {
    console.error('Get employee history error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
