import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'รายการยืม-คืน — ประวัติการทำรายการ',
  description: 'ประวัติการยืม-คืนครุภัณฑ์ อนุมัติ ปฏิเสธ และตรวจสอบสถานะคำขอทั้งหมด',
};

export default function BorrowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
