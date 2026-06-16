import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'แดชบอร์ด — ภาพรวมระบบ',
  description: 'แดชบอร์ดภาพรวมสถานะสินทรัพย์ ครุภัณฑ์ และรายการยืม-คืน Thai Inter Flying',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
