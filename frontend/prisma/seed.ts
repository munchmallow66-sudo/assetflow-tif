import { PrismaClient, Role, AssetStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { readEmployees, requireEnv } from './csv';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Passwords come from the environment only. There is no default on purpose:
  // a seeded account must never carry a password that is readable in this repo.
  const defaultPassword = requireEnv('SEED_DEFAULT_PASSWORD');
  const adminPassword = requireEnv('SEED_ADMIN_PASSWORD');

  const employees = readEmployees();
  console.log(`Loaded ${employees.length} employee record(s) from employees.csv`);

  // 1. Clean existing data (optional, but good for resetting)
  await prisma.auditLog.deleteMany();
  await prisma.assetReturn.deleteMany();
  await prisma.borrowRequest.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.user.deleteMany();
  await prisma.employee.deleteMany();

  // Hash passwords
  const saltRounds = 10;
  const defaultMemberPassword = await bcrypt.hash(defaultPassword, saltRounds);
  const adminMemberPassword = await bcrypt.hash(adminPassword, saltRounds);

  // 4. Create Employee and User records from the roster
  console.log('Creating TIF company employees and user accounts...');

  for (const empData of employees) {
    const employee = await prisma.employee.create({
      data: {
        employeeCode: empData.employeeCode,
        firstName: empData.firstName,
        lastName: empData.lastName,
        department: empData.department,
        email: empData.email,
        phone: empData.phone,
      },
    });

    const userPassword = empData.role === Role.ADMIN ? adminMemberPassword : defaultMemberPassword;

    await prisma.user.create({
      data: {
        email: empData.email,
        password: userPassword,
        name: `${empData.firstName} ${empData.lastName}`,
        role: empData.role,
        employeeId: employee.id,
      },
    });
  }


  // 5. Create Assets
  console.log('Creating assets...');
  await prisma.asset.createMany({
    data: [
      {
        assetCode: 'TIF-AST-0001',
        name: 'iPad Pro Flight Kit (ชุดนำทางอิเล็กทรอนิกส์)',
        category: 'Electronic',
        serialNumber: 'SN-IPAD-2026A',
        description: 'iPad สำหรับนักบินในการเปิดแผนที่นำทาง Jeppesen และเอกสารประกอบการบิน',
        status: AssetStatus.AVAILABLE,
        qrCode: 'TIF-AST-0001',
      },
      {
        assetCode: 'TIF-AST-0002',
        name: 'Bose A20 Aviation Headset (หูฟังสำหรับนักบิน)',
        category: 'Aviation Gear',
        serialNumber: 'SN-BOSE-A20-9988',
        description: 'หูฟังตัดเสียงรบกวนพิเศษสำหรับใช้ในห้องนักบิน',
        status: AssetStatus.AVAILABLE,
        qrCode: 'TIF-AST-0002',
      },
      {
        assetCode: 'TIF-AST-0003',
        name: 'Aircraft Fuel Dipstick (แท่งวัดระดับน้ำมันเครื่องบิน)',
        category: 'Aviation Tool',
        serialNumber: 'SN-DIP-C172-01',
        description: 'เครื่องมือวัดระดับน้ำมันเชื้อเพลิงสำหรับเครื่องบิน Cessna 172',
        status: AssetStatus.AVAILABLE,
        qrCode: 'TIF-AST-0003',
      },
      {
        assetCode: 'TIF-AST-0004',
        name: 'Garmin Aera 660 GPS (เครื่องนำทางพกพา)',
        category: 'Electronic',
        serialNumber: 'SN-GARMIN-660X',
        description: 'อุปกรณ์นำทางสำรองพกพาความละเอียดสูง',
        status: AssetStatus.AVAILABLE,
        qrCode: 'TIF-AST-0004',
      },
      {
        assetCode: 'TIF-AST-0005',
        name: 'Cessna 172 Engine Cowl Cover (ผ้าคลุมเครื่องบิน)',
        category: 'Maintenance Gear',
        serialNumber: 'SN-COWL-C172',
        description: 'ผ้าใบคลุมส่วนหน้าเครื่องยนต์เครื่องบิน Cessna 172 เพื่อกันแดดและฝุ่น',
        status: AssetStatus.MAINTENANCE,
        qrCode: 'TIF-AST-0005',
      },
    ],
  });

  console.log('Database seeded successfully with TIF company employees!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
