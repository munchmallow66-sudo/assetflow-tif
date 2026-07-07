import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ข้อมูลสินทรัพย์ — รายการครุภัณฑ์ทั้งหมด',
  description: 'รายการอุปกรณ์ เครื่องมือ และครุภัณฑ์ของ Thai Inter Flying ทั้งหมด',
};

export default function AssetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
