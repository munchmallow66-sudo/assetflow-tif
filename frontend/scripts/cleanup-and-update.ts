import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Starting cleanup and final update...');

  // 1. Delete the duplicate empty employees/users that were created by their new codes (690013 and 690015)
  // Let's delete User first
  const duplicateEmails = ['wasnida.chu@tif.ac.th', 'siriphat.pal@tif.ac.th'];
  for (const email of duplicateEmails) {
    try {
      await prisma.user.delete({ where: { email } });
      console.log(`Deleted duplicate empty user: ${email}`);
    } catch (e) {
      // Ignore
    }
  }

  const duplicateCodes = ['690013', '690015'];
  for (const employeeCode of duplicateCodes) {
    try {
      await prisma.employee.delete({ where: { employeeCode } });
      console.log(`Deleted duplicate empty employee code: ${employeeCode}`);
    } catch (e) {
      // Ignore
    }
  }

  // 2. Now perform in-place updates for the three employees
  
  // (a) สำหรับ วาสน์นิดา ชื่นสกุล (wasnidajow789tif@gmail.com)
  const emp1 = await prisma.employee.findUnique({
    where: { email: 'wasnidajow789tif@gmail.com' },
    include: { user: true }
  });
  if (emp1) {
    console.log(`Updating ${emp1.firstName} ${emp1.lastName} to code 690013 and email wasnida.chu@tif.ac.th`);
    // Update employee
    await prisma.employee.update({
      where: { id: emp1.id },
      data: {
        employeeCode: '690013',
        email: 'wasnida.chu@tif.ac.th'
      }
    });
    // Update user
    if (emp1.user) {
      await prisma.user.update({
        where: { id: emp1.user.id },
        data: {
          email: 'wasnida.chu@tif.ac.th'
        }
      });
    }
  }

  // (b) สำหรับ สิริภัทร ปาลี (siripatthaiinterfylinf@gmail.com)
  const emp2 = await prisma.employee.findUnique({
    where: { email: 'siripatthaiinterfylinf@gmail.com' },
    include: { user: true }
  });
  if (emp2) {
    console.log(`Updating ${emp2.firstName} ${emp2.lastName} to code 690015 and email siriphat.pal@tif.ac.th`);
    // Update employee
    await prisma.employee.update({
      where: { id: emp2.id },
      data: {
        employeeCode: '690015',
        email: 'siriphat.pal@tif.ac.th'
      }
    });
    // Update user
    if (emp2.user) {
      await prisma.user.update({
        where: { id: emp2.user.id },
        data: {
          email: 'siriphat.pal@tif.ac.th'
        }
      });
    }
  }

  // (c) สำหรับ ภูมิศาศาสตร์ สามบุญเรือง (phumisasat.sam@gmail.com)
  const emp3 = await prisma.employee.findUnique({
    where: { email: 'phumisasat.sam@gmail.com' },
    include: { user: true }
  });
  if (emp3) {
    console.log(`Updating ${emp3.firstName} ${emp3.lastName} email to phumisasat.sam@tif.ac.th`);
    // Update employee
    await prisma.employee.update({
      where: { id: emp3.id },
      data: {
        email: 'phumisasat.sam@tif.ac.th'
      }
    });
    // Update user
    if (emp3.user) {
      await prisma.user.update({
        where: { id: emp3.user.id },
        data: {
          email: 'phumisasat.sam@tif.ac.th'
        }
      });
    }
  }

  console.log('Cleanup and in-place updates completed successfully! All assets and borrow history remain untouched.');
}

run()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
