import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { requireRoles } from '@/lib/roles';
import { createAuditLog } from '@/lib/audit-log';
import { uploadImage } from '@/lib/cloudinary';
import { Role } from '@prisma/client';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.ADMIN);
    if (roleError) return roleError;

    const { id } = await params;
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) {
      return NextResponse.json({ message: 'ไม่พบข้อมูลสินทรัพย์ที่ระบุ' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ message: 'กรุณาเลือกไฟล์รูปภาพ' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const result = await uploadImage(buffer, 'assets');

    const updated = await prisma.asset.update({
      where: { id },
      data: {
        imageUrl: result.secure_url,
        cloudinaryPublicId: result.public_id,
      },
    });

    await createAuditLog(user.sub, 'UPLOAD_ASSET_IMAGE', 'Asset', id, asset, updated);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Upload asset image error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
