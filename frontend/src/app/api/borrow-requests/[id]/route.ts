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

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    if (user.role !== Role.ADMIN) {
      return NextResponse.json({ message: 'ไม่มีสิทธิ์ดำเนินการ (เฉพาะผู้ดูแลระบบเท่านั้น)' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const returnDateVal = body.returnDate;

    if (!returnDateVal) {
      return NextResponse.json({ message: 'กรุณาระบุวันที่ส่งคืน' }, { status: 400 });
    }

    const borrowRequest = await prisma.borrowRequest.findUnique({
      where: { id },
      include: { assetReturn: true },
    });

    if (!borrowRequest) {
      return NextResponse.json({ message: 'ไม่พบคำขอยืมสินทรัพย์' }, { status: 404 });
    }

    if (!borrowRequest.assetReturn) {
      return NextResponse.json({ message: 'ไม่พบข้อมูลบันทึกสภาพการส่งคืน' }, { status: 400 });
    }

    const updatedReturn = await prisma.assetReturn.update({
      where: { borrowRequestId: id },
      data: {
        returnDate: new Date(returnDateVal),
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.sub,
        action: 'UPDATE_RETURN_DATE',
        entityType: 'AssetReturn',
        entityId: borrowRequest.assetReturn.id,
        oldData: borrowRequest.assetReturn as any,
        newData: updatedReturn as any,
      },
    });

    return NextResponse.json(updatedReturn);
  } catch (error: any) {
    console.error('Update return date error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
