import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { requireRoles } from '@/lib/roles';
import { systemSettingsSchema, formatZodError } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit-log';
import { Role } from '@prisma/client';

const SETTINGS_ID = 'default-settings-id';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    // Find settings or create default if not found
    let settings = await prisma.systemSetting.findUnique({
      where: { id: SETTINGS_ID },
    });

    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: {
          id: SETTINGS_ID,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Get settings error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลตั้งค่า' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    const roleError = requireRoles(user, Role.ADMIN);
    if (roleError) return roleError;

    const body = await request.json();
    const parsed = systemSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const dto = parsed.data;

    // Get current setting for audit log
    const oldSettings = await prisma.systemSetting.findUnique({
      where: { id: SETTINGS_ID },
    });

    const updated = await prisma.systemSetting.upsert({
      where: { id: SETTINGS_ID },
      update: dto,
      create: {
        id: SETTINGS_ID,
        ...dto,
      },
    });

    await createAuditLog(user.sub, 'UPDATE_SETTINGS', 'SystemSetting', SETTINGS_ID, oldSettings, updated);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลตั้งค่า' }, { status: 500 });
  }
}
