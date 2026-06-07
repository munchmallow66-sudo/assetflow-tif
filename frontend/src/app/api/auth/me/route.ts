import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const user = await prisma.user.findUnique({
      where: { id: authUser.sub },
      include: { employee: true },
    });

    if (!user) {
      return unauthorized('ไม่พบข้อมูลผู้ใช้งาน');
    }

    const { password, ...result } = user;
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Get me error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
