import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import AppLayout from "@/components/layout/AppLayout";

export const metadata: Metadata = {
  title: "ระบบจัดการยืม-คืนสินทรัพย์ | Thai Inter Flying",
  description: "ระบบจัดการการยืมและคืนสินทรัพย์ภายใน บริษัท Thai Inter Flying จำกัด",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full">
      <body className="min-h-full antialiased text-slate-900 bg-slate-50">
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
