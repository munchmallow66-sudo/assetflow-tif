import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
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
      <body className="min-h-full antialiased text-slate-900 bg-slate-50 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
        <ThemeProvider>
          <AuthProvider>
            <AppLayout>{children}</AppLayout>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
