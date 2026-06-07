import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { Role } from '@prisma/client';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    const { id } = await params;
    const borrowRequest = await prisma.borrowRequest.findUnique({
      where: { id },
      include: {
        asset: true,
        borrower: true,
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!borrowRequest) {
      return NextResponse.json({ message: 'ไม่พบคำขอยืมสินทรัพย์' }, { status: 404 });
    }

    // Security check: STAFF can only view their own requests
    if (user.role === Role.STAFF && borrowRequest.borrowerId !== user.employeeId) {
      return NextResponse.json({ message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลคำขอนี้' }, { status: 400 });
    }

    return NextResponse.json(borrowRequest);
  } catch (error: any) {
    console.error('Get borrow request error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
