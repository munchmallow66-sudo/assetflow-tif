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
    const roleError = requireRoles(user, Role.ADMIN, Role.STAFF, Role.APPROVER);
    if (roleError) return roleError;

    const { id } = await params;
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) {
      return NextResponse.json({ message: 'ไม่พบข้อมูลสินทรัพย์ที่ระบุ' }, { status: 404 });
    }

    const borrowRequests = await prisma.borrowRequest.findMany({
      where: { assetId: id },
      include: {
        borrower: true,
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
        assetReturn: {
          include: {
            recordedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(borrowRequests);
  } catch (error: any) {
    console.error('Get asset history error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
