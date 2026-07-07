import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ประวัติการคืน — รายการส่งคืนครุภัณฑ์',
  description: 'ประวัติการส่งคืนครุภัณฑ์ อุปกรณ์ และตรวจสอบสภาพหลังการคืน',
};

export default function ReturnsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
