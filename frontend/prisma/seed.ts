import { PrismaClient, Role, AssetStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing data (optional, but good for resetting)
  await prisma.auditLog.deleteMany();
  await prisma.assetReturn.deleteMany();
  await prisma.borrowRequest.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.user.deleteMany();
  await prisma.employee.deleteMany();

  // Hash passwords
  const saltRounds = 10;
  const adminPassword = await bcrypt.hash('Admin@TIF2026', saltRounds);
  const approverPassword = await bcrypt.hash('Approver@TIF2026', saltRounds);
  const staffPassword = await bcrypt.hash('Staff@TIF2026', saltRounds);
  const viewerPassword = await bcrypt.hash('Viewer@TIF2026', saltRounds);
  const defaultMemberPassword = await bcrypt.hash('TIF@2026', saltRounds);

  // 2. Create Default System Employees
  console.log('Creating system employees...');
  const employeeAdmin = await prisma.employee.create({
    data: {
      employeeCode: 'EMP-ADMIN',
      firstName: 'Admin',
      lastName: 'TIF',
      department: 'Management',
      email: 'admin@thaiinterflying.com',
      phone: '02-123-4567',
    },
  });

  const employeeApprover = await prisma.employee.create({
    data: {
      employeeCode: 'EMP-APPROVER',
      firstName: 'Somchai',
      lastName: 'Rakbin',
      department: 'Operation',
      email: 'approver@thaiinterflying.com',
      phone: '081-234-5678',
    },
  });

  const employeeStaff = await prisma.employee.create({
    data: {
      employeeCode: 'EMP-STAFF',
      firstName: 'Kitti',
      lastName: 'Somsak',
      department: 'Flight Training',
      email: 'staff@thaiinterflying.com',
      phone: '089-876-5432',
    },
  });

  const employeeViewer = await prisma.employee.create({
    data: {
      employeeCode: 'EMP-VIEWER',
      firstName: 'Somsri',
      lastName: 'Deedi',
      department: 'Finance',
      email: 'viewer@thaiinterflying.com',
      phone: '082-345-6789',
    },
  });

  // 3. Create Default System Users
  console.log('Creating system users...');
  await prisma.user.create({
    data: {
      email: 'admin@thaiinterflying.com',
      password: adminPassword,
      name: 'Admin Thai Inter Flying',
      role: Role.ADMIN,
      employeeId: employeeAdmin.id,
    },
  });

  await prisma.user.create({
    data: {
      email: 'approver@thaiinterflying.com',
      password: approverPassword,
      name: 'Somchai Rakbin (Approver)',
      role: Role.APPROVER,
      employeeId: employeeApprover.id,
    },
  });

  await prisma.user.create({
    data: {
      email: 'staff@thaiinterflying.com',
      password: staffPassword,
      name: 'Kitti Somsak (Staff)',
      role: Role.STAFF,
      employeeId: employeeStaff.id,
    },
  });

  await prisma.user.create({
    data: {
      email: 'viewer@thaiinterflying.com',
      password: viewerPassword,
      name: 'Somsri Deedi (Viewer)',
      role: Role.VIEWER,
      employeeId: employeeViewer.id,
    },
  });

  // 4. Create 41 Employee and User records requested by user
  console.log('Creating TIF company employees and user accounts...');
  const tifEmployeesData = [
    {
      employeeCode: '680000',
      firstName: 'นายพันธ์พิสุทธิ์',
      lastName: 'นุราช (แม็ค)',
      department: 'Owner (BKK)',
      email: 'punpisut_n@hotmail.com',
      phone: '099 101 9999',
      role: Role.ADMIN,
    },
    {
      employeeCode: '600001',
      firstName: 'ร.อ.สุนทร',
      lastName: 'วัชพืช (ครูสุน)',
      department: 'Flight Instructor (PHS 1Y)',
      email: 'tif.soontorn.w@gmail.com',
      phone: '089 245 0900',
      role: Role.STAFF,
    },
    {
      employeeCode: '600002',
      firstName: 'พ.จ.อ.วินัย',
      lastName: 'เกษม (วินัย)',
      department: 'Director of Maintenance (PHS 1Y)',
      email: 'winaikasem05@gmail.com',
      phone: '083 697 4668',
      role: Role.APPROVER,
    },
    {
      employeeCode: '600003',
      firstName: 'นางสาวสังเวียน',
      lastName: 'บุญเสริม (ต้อย)',
      department: 'แม่บ้าน (BKK)',
      email: 'sungwian.b@thaiinterflying.com',
      phone: '084 521 1269',
      role: Role.STAFF,
    },
    {
      employeeCode: '610002',
      firstName: 'นายนิรุทธ์',
      lastName: 'เพ็ชรมั่ง (รุทธ์)',
      department: 'Driver (PHS)',
      email: 'tif.nirut.p@gmail.com',
      phone: '080 986 0294',
      role: Role.STAFF,
    },
    {
      employeeCode: '620001',
      firstName: 'นายเอกวรรธน์',
      lastName: 'ขาวสอาด (โอจีฟ)',
      department: 'Purchasing Manager (Part Time)',
      email: 'ekkawat.kha@gmail.com',
      phone: '090 984 4999',
      role: Role.STAFF,
    },
    {
      employeeCode: '620002',
      firstName: 'นายพัฒน์',
      lastName: 'โพธิ์ปฐมพร (พัฒน์)',
      department: 'Chief flight instructor (PHS 1Y)',
      email: 'phatbp_1960@hotmail.com',
      phone: '081 661 1462',
      role: Role.APPROVER,
    },
    {
      employeeCode: '650002',
      firstName: 'น.ส.สุวรรณ',
      lastName: 'พันธ์มณี (สาว)',
      department: 'แม่บ้าน (PHS)',
      email: 'suwan.p@thaiinterflying.com',
      phone: '083-127-2187',
      role: Role.STAFF,
    },
    {
      employeeCode: '650006',
      firstName: 'นางสาวกชกร',
      lastName: 'มณีนาค (เป้)',
      department: 'Store Keeper and Aircraft Mechanic (PHS)',
      email: 'tif.kodchakorn.p@gmail.com',
      phone: '064 064 0948',
      role: Role.STAFF,
    },
    {
      employeeCode: '660002',
      firstName: 'นายหนึ่งณัฐ',
      lastName: 'ยิ้มศรี (ณัฐ)',
      department: 'Aircraft Mechanic (PHS)',
      email: 'Neungnatyimsri1996@gmail.com',
      phone: '088 906 6592',
      role: Role.STAFF,
    },
    {
      employeeCode: '670001',
      firstName: 'นายชวัลวิทย์',
      lastName: 'วงศ์ชัย (กัปตัน)',
      department: 'เจ้าหน้าที่สนามบินคลอง 11 (PHS)',
      email: 'chawanwit.wongchai@gmail.com',
      phone: '089 133 8561',
      role: Role.STAFF,
    },
    {
      employeeCode: '670002',
      firstName: 'นายชยพล',
      lastName: 'หารบุรุษ (เก่ง)',
      department: 'Aircraft Mechanic (PHS)',
      email: 'hanburuts@gmail.com',
      phone: '095 072 2327',
      role: Role.STAFF,
    },
    {
      employeeCode: '670005',
      firstName: 'นายสิรวิชช์',
      lastName: 'อรชร (ปอ)',
      department: 'Aircraft Mechanic (PHS)',
      email: 'tif.sirawit.a@gmail.com',
      phone: '091 820 9718',
      role: Role.STAFF,
    },
    {
      employeeCode: '670008',
      firstName: 'นายไพศาล',
      lastName: 'อุบลวรรณ์ (อ๊อฟ)',
      department: 'Aircraft Mechanic (PHS)',
      email: 'paisanubonwan@gmail.com',
      phone: '094-830-5758',
      role: Role.STAFF,
    },
    {
      employeeCode: '670010',
      firstName: 'นายจักรี',
      lastName: 'สุบงกฏ (ตุ้ม)',
      department: 'Acting Accountable Executive (BKK)',
      email: 'chakri.sub9977@gmail.com',
      phone: '084 7511 311',
      role: Role.APPROVER,
    },
    {
      employeeCode: '680001',
      firstName: 'น.ส.สิภาพันธุ์',
      lastName: 'พันธุ์เพ็ง (เปียโน)',
      department: 'Training Officer (Part Time)',
      email: 'tif.sipapun.p@gmail.com',
      phone: '080-550-0083',
      role: Role.STAFF,
    },
    {
      employeeCode: '680002',
      firstName: 'นางสาวศุภนุช',
      lastName: 'ปัญโญกิจ (หงษ์)',
      department: 'Aircraft Mechanic (PHS)',
      email: 'tif.supanoot.p@gmail.com',
      phone: '097 295 6738',
      role: Role.STAFF,
    },
    {
      employeeCode: '680007',
      firstName: 'นายภาณุ',
      lastName: 'นิ่มสกุล (หนึ่ง)',
      department: 'Chief Executive Officer: CEO/ประธานเจ้าหน้าที่บริหาร (BKK)',
      email: 'panu@pkdshop.com',
      phone: '084 597 9914',
      role: Role.ADMIN,
    },
    {
      employeeCode: '680008',
      firstName: 'นายจักรินทร์',
      lastName: 'กัญญาลักษณ์ (หน่อย)',
      department: 'Chief Operating Officer: COO/ประธานเจ้าหน้าที่ฝ่ายปฏิบัติการ (BKK)',
      email: 'jarkarin@gmail.com',
      phone: '097 247 4567',
      role: Role.ADMIN,
    },
    {
      employeeCode: '680009',
      firstName: 'นางสาวพรปรียา',
      lastName: 'ป้อมสุเมรุ (แอน)',
      department: 'Chief Financial and Accounting Officer : CQO /ประธานเจ้าหน้าที่ฝ่ายการเงินและบัญชี (BKK)',
      email: 'poctobernine0910@gmail.com',
      phone: '084 144 4740',
      role: Role.APPROVER,
    },
    {
      employeeCode: '680011',
      firstName: 'นายณัฐพล',
      lastName: 'สืบสุข (เต๊าะ)',
      department: 'Director of Operations/ผู้อำนวยการฝ่ายปฏิบัติการ (PHS)',
      email: 'nattatoa@gmail.com',
      phone: '06-2035-4687',
      role: Role.APPROVER,
    },
    {
      employeeCode: '680012',
      firstName: 'นายคีทัน',
      lastName: 'วดิเวลราจัน คาร์ททิคียาน (คีทัน)',
      department: 'Chief Training Officer (PHS)',
      email: 'keerthan.vk@gmail.com',
      phone: '065-582-5250',
      role: Role.APPROVER,
    },
    {
      employeeCode: '680013',
      firstName: 'นายธนวัฒน์',
      lastName: 'รอดสิน (คิว)',
      department: 'Aircraft Mechanic/ช่างซ่อมบำรุงอากาศยาน (PHS)',
      email: 'tif.thanawat.r@gmail.com',
      phone: '096 451 6192',
      role: Role.STAFF,
    },
    {
      employeeCode: '680014',
      firstName: 'นายมะกอยี',
      lastName: 'สะอะ (ยี)',
      department: 'Aircraft Mechanic/ช่างซ่อมบำรุงอากาศยาน (PHS)',
      email: 'tif.magoryee.s@gmail.com',
      phone: '062 249 0348',
      role: Role.STAFF,
    },
    {
      employeeCode: '680015',
      firstName: 'นายณัฐดนัย',
      lastName: 'มังสาทอง (เควิ่น/เกียรติ)',
      department: 'Director of Standards/ผู้อำนวยการฝ่ายมาตรฐาน (BKK)',
      email: 'kiadleroy@gmail.com',
      phone: '084-846-5749',
      role: Role.APPROVER,
    },
    {
      employeeCode: '680017',
      firstName: 'นางสาวภควรรณ',
      lastName: 'ชูรัตน์ (ตูน)',
      department: 'Senior Finance and Accounting Officer/เจ้าหน้าที่การเงินและบัญชีอาวุโส (BKK)',
      email: 'Phakkhawan.toontoon1991@gmail.com',
      phone: '065-742-2624',
      role: Role.STAFF,
    },
    {
      employeeCode: '680019',
      firstName: 'นายรพี',
      lastName: 'อุชชิน (ปุ๋ย)',
      department: 'Compliance Monitoring Manager (AMO) (BKK)',
      email: 'r.ujjin@gmail.com',
      phone: '094-549-1919',
      role: Role.APPROVER,
    },
    {
      employeeCode: '680020',
      firstName: 'นางสาวจิณัฐตา',
      lastName: 'สุทธาชีพ (หงษ์)',
      department: 'Human Resources Manager/ผู้จัดการแผนกทรัพยากรบุคคล (BKK)',
      email: 'sutjinutta@gmail.com',
      phone: '090-978-79999',
      role: Role.APPROVER,
    },
    {
      employeeCode: '680022',
      firstName: 'นางสาวอนาฐิตา',
      lastName: 'เชาวนภรณ์ (นัตตี้)',
      department: 'Training Coordinator (PHS)',
      email: 'Anathita.c@gmail.com',
      phone: '065-005-3989',
      role: Role.STAFF,
    },
    {
      employeeCode: '680023',
      firstName: 'นายพสธร',
      lastName: 'สืบสังข์ (ไฟท์)',
      department: 'Flight Instructor (PHS)',
      email: 'Potsatornseubsang@gmail.com',
      phone: '089-510-5669',
      role: Role.STAFF,
    },
    {
      employeeCode: '680024',
      firstName: 'นางสาวประภัสสร',
      lastName: 'ทรัพย์ศาสตร์ (เบียร์)',
      department: 'Training Planner Manager (BKK)',
      email: 'prapatsorn.tif@gmail.com',
      phone: '087-328-5607',
      role: Role.STAFF,
    },
    {
      employeeCode: '680025',
      firstName: 'นางสาวจริยาภรณ์',
      lastName: 'เจริญพงศ์ (อุ๋น)',
      department: 'TKI (PHS)',
      email: 'Jariyaporncharoenphong@gmail.com',
      phone: '099-1989-149',
      role: Role.STAFF,
    },
    {
      employeeCode: '680026',
      firstName: 'นางสาวสุชีรา',
      lastName: 'ถนอมเมฆ (ฝ้าย)',
      department: 'Operation Officer (PHS)',
      email: 'Sucherathanommake@gmail.com',
      phone: '098-261-7173',
      role: Role.STAFF,
    },
    {
      employeeCode: '690003',
      firstName: 'นางสาวทิพย์สุดา',
      lastName: 'คงสุข (นิ้ง)',
      department: 'Sales Manager/ผู้จัดการฝ่ายขาย (BKK)',
      email: 'kongsukthipsuda@gmail.com',
      phone: '095-250-4695',
      role: Role.STAFF,
    },
    {
      employeeCode: '690004',
      firstName: 'นายสุวิชา',
      lastName: 'บุญเลิศ (แจ็ค)',
      department: 'Compliance Monitoring Manager (FTO) (BKK)',
      email: 'Jackiesuvicha@gmail.com',
      phone: '062-595-9565',
      role: Role.APPROVER,
    },
    {
      employeeCode: '690005',
      firstName: 'นายธัชพงศ์',
      lastName: 'คงวุฒิ (ก๊อง)',
      department: 'เจ้าหน้าที่วางแผนซ่อมบำรุง/Maintenance (PHS)',
      email: 'Khongwut1975@gmail.com',
      phone: '092-552-9196',
      role: Role.STAFF,
    },
    {
      employeeCode: '690006',
      firstName: 'นางสาวกิตติวรรณ',
      lastName: 'เมณฑ์กูล (อ๊ะอาย)',
      department: 'Sales Officer/เจ้าหน้าที่การขาย (BKK)',
      email: 'kittiwanmaenkoon@gmail.com',
      phone: '093-565-7461',
      role: Role.STAFF,
    },
    {
      employeeCode: '690007',
      firstName: 'นางสาวภัททิยา',
      lastName: 'สามนฑา (ดัช)',
      department: 'Safety Management Officer (PHS)',
      email: 'Phattiya_samonta@hotmail.com',
      phone: '092-420-8990',
      role: Role.STAFF,
    },
    {
      employeeCode: '690008',
      firstName: 'นางสาวศุภางค์',
      lastName: 'กำเนิดศิริ (ปลาทู)',
      department: 'Compliance and Monitoring Officer (BKK)',
      email: 'supang.ku@gmail.com',
      phone: '084-332-6668',
      role: Role.STAFF,
    },
    {
      employeeCode: '690009',
      firstName: 'นางสาวนิชานันท์',
      lastName: 'แซ่นึ่ง (ฟิ้นท์)',
      department: 'Registration and Licensing Officer (BKK)',
      email: 'Nsaenung@gmail.com',
      phone: '081-691-3600',
      role: Role.STAFF,
    },
    {
      employeeCode: '690010',
      firstName: 'นางสาวอัญชิษฐา',
      lastName: 'ขุนล่ำ (รุ้ง)',
      department: 'เลขานุการ (Secretary) (BKK)',
      email: 'anchittha.kh@gmail.com',
      phone: '091-034-3976',
      role: Role.ADMIN,
    },
    {
      employeeCode: '690011',
      firstName: 'Mr.Watchara',
      lastName: 'Phonchai (เซฟ)',
      department: 'it support officer (BKK)',
      email: 'watchara47114145@gmail.com',
      phone: '098-042-0324',
      role: Role.ADMIN,
    },
  ];

  for (const empData of tifEmployeesData) {
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

    await prisma.user.create({
      data: {
        email: empData.email,
        password: defaultMemberPassword,
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
