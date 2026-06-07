import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { requireRoles } from '@/lib/roles';
import { Role } from '@prisma/client';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.ADMIN, Role.APPROVER, Role.VIEWER);
    if (roleError) return roleError;

    const { id } = await params;
    const assetReturn = await prisma.assetReturn.findUnique({
      where: { id },
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

    if (!assetReturn) {
      return NextResponse.json({ message: 'ไม่พบข้อมูลบันทึกการส่งคืนที่ระบุ' }, { status: 404 });
    }

    return NextResponse.json(assetReturn);
  } catch (error: any) {
    console.error('Get return error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
