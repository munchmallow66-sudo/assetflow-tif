import { PrismaClient } from '@prisma/client';
import { readEmployees, requireEnv } from '../prisma/csv';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function run() {
  console.log('Starting DB migration: updating emails, keeping assets intact...');

  const tifEmployeesData = readEmployees();
  console.log(`Loaded ${tifEmployeesData.length} employee record(s) from employees.csv`);

  const saltRounds = 10;
  const defaultMemberPassword = await bcrypt.hash(requireEnv('SEED_DEFAULT_PASSWORD'), saltRounds);

  // 1. Delete generic system accounts if they exist (both Employee and User)
  const systemEmailsToDelete = [
    'admin@tif.ac.th', 'admin@thaiinterflying.com',
    'approver@tif.ac.th', 'approver@thaiinterflying.com',
    'staff@tif.ac.th', 'staff@thaiinterflying.com',
    'viewer@tif.ac.th', 'viewer@thaiinterflying.com'
  ];

  for (const email of systemEmailsToDelete) {
    // Delete user
    try {
      await prisma.user.delete({ where: { email } });
      console.log(`Deleted default system user: ${email}`);
    } catch (e) {
      // Ignore if not found
    }

    // Delete employee if exists
    try {
      await prisma.employee.delete({ where: { email } });
      console.log(`Deleted default system employee: ${email}`);
    } catch (e) {
      // Ignore if not found
    }
  }

  // 2. Loop through each real employee data and update or insert
  for (const empData of tifEmployeesData) {
    // Find employee by employeeCode (since employeeCode is unique and constant)
    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeCode: empData.employeeCode },
      include: { user: true }
    });

    if (existingEmployee) {
      console.log(`Updating existing employee: ${empData.firstName} ${empData.lastName} (${empData.employeeCode})`);
      
      // Update Employee record
      const updatedEmployee = await prisma.employee.update({
        where: { id: existingEmployee.id },
        data: {
          firstName: empData.firstName,
          lastName: empData.lastName,
          department: empData.department,
          email: empData.email,
          phone: empData.phone,
        }
      });

      // Update or Create User record
      if (existingEmployee.user) {
        await prisma.user.update({
          where: { id: existingEmployee.user.id },
          data: {
            email: empData.email,
            name: `${empData.firstName} ${empData.lastName}`,
            role: empData.role,
            password: defaultMemberPassword,
          }
        });
      } else {
        await prisma.user.create({
          data: {
            email: empData.email,
            password: defaultMemberPassword,
            name: `${empData.firstName} ${empData.lastName}`,
            role: empData.role,
            employeeId: updatedEmployee.id,
          }
        });
      }
    } else {
      console.log(`Creating new employee and user: ${empData.firstName} ${empData.lastName} (${empData.employeeCode})`);
      
      // Create Employee
      const newEmployee = await prisma.employee.create({
        data: {
          employeeCode: empData.employeeCode,
          firstName: empData.firstName,
          lastName: empData.lastName,
          department: empData.department,
          email: empData.email,
          phone: empData.phone,
        }
      });

      // Create User
      await prisma.user.create({
        data: {
          email: empData.email,
          password: defaultMemberPassword,
          name: `${empData.firstName} ${empData.lastName}`,
          role: empData.role,
          employeeId: newEmployee.id,
        }
      });
    }
  }

  console.log('Migration completed successfully! No asset records were deleted.');
}

run()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
