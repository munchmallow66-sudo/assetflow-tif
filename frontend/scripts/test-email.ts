import { sendBorrowRequestNotification, sendReturnRequestNotification } from '../src/lib/email';

async function main() {
  console.log('Testing Email Service Notifications...');

  const result1 = await sendBorrowRequestNotification({
    requestNo: 'REQ-20260723-0001',
    borrower: {
      firstName: 'Watchara',
      lastName: 'Phothisarn',
      employeeCode: 'EMP001',
    },
    asset: {
      assetCode: 'AST-IPAD-01',
      name: 'iPad Pro 11-inch (2024)',
    },
    borrowDate: new Date(),
    expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    purpose: 'ทดสอบระบบการส่งอีเมลแจ้งเตือนเมื่อมีการยืม-คืน',
  });

  console.log('Borrow Request Email Result:', result1);

  const result2 = await sendReturnRequestNotification({
    borrowRequest: {
      requestNo: 'REQ-20260723-0001',
      borrower: {
        firstName: 'Watchara',
        lastName: 'Phothisarn',
        employeeCode: 'EMP001',
      },
    },
    asset: {
      assetCode: 'AST-IPAD-01',
      name: 'iPad Pro 11-inch (2024)',
    },
    condition: 'NORMAL',
    conditionNote: 'อุปกรณ์ครบสมบูรณ์ ไม่มีความเสียหาย',
  });

  console.log('Return Request Email Result:', result2);
}

main().catch(console.error);
