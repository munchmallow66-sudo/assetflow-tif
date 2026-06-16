import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'รายงาน — สรุปข้อมูลระบบ',
  description: 'รายงานสรุปข้อมูลสินทรัพย์ สถิติการยืม-คืน และภาพรวมประสิทธิภาพระบบ',
};

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
