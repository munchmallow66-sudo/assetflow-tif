import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { message: 'กรุณาระบุรหัสครุภัณฑ์เพื่อทำการตรวจสอบ / Missing asset code' },
        { status: 400 }
      );
    }

    // Extract clean code if a full URL was passed in code parameter
    let cleanCode = code.trim();
    try {
      if (cleanCode.includes('code=')) {
        const urlObj = new URL(cleanCode.startsWith('http') ? cleanCode : `http://dummy.com/${cleanCode}`);
        cleanCode = urlObj.searchParams.get('code') || cleanCode;
      }
    } catch (e) {
      // Keep cleanCode as is
    }

    const asset = await prisma.asset.findFirst({
      where: {
        OR: [
          { assetCode: cleanCode },
          { qrCode: cleanCode }
        ]
      },
      include: {
        currentHolder: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: true,
            email: true,
            phone: true,
          }
        },
        borrowRequests: {
          where: {
            status: { in: ['BORROWED', 'OVERDUE'] }
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            borrower: {
              select: {
                firstName: true,
                lastName: true,
                employeeCode: true,
                department: true,
              }
            }
          }
        }
      }
    });

    if (!asset) {
      return NextResponse.json(
        { message: 'ไม่พบครุภัณฑ์หรือสินทรัพย์นี้ในระบบ / Asset not found' },
        { status: 444 }
      );
    }

    return NextResponse.json(asset);
  } catch (error: any) {
    console.error('Public scan error:', error);
    return NextResponse.json(
      { message: error.message || 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล' },
      { status: 500 }
    );
  }
}
