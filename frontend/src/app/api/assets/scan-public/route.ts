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
        const urlObj = new URL(cleanCode.startsWith('http') ? cleanCode : `http://example.invalid/${cleanCode}`);
        cleanCode = urlObj.searchParams.get('code') || cleanCode;
      }
    } catch (e) {
      // Keep cleanCode as is
    }

    const asset = await prisma.asset.findFirst({
      where: {
        OR: [
          { assetCode: cleanCode },
          { qrCode: cleanCode },
          { serialNumber: cleanCode }
        ]
      },
      include: {
        // This endpoint is public: anyone who scans the sticker reaches it
        // without signing in. Expose only who currently holds the asset and
        // where they work, never their contact details or employee code.
        currentHolder: {
          select: {
            firstName: true,
            lastName: true,
            department: true,
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
        { status: 404 }
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
