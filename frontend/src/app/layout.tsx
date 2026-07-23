import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import AppLayout from "@/components/layout/AppLayout";

export const metadata: Metadata = {
  metadataBase: new URL("https://assetflow.tif.ac.th"),

  // ===== Core Metadata =====
  title: {
    default: "ระบบจัดการยืม-คืนสินทรัพย์ | Thai Inter Flying",
    template: "%s | TIF AssetFlow",
  },
  description:
    "ระบบบริหารจัดการยืมและคืนครุภัณฑ์ อุปกรณ์ สำหรับบริษัท Thai Inter Flying จำกัด — ยืมคืนง่าย ตรวจสอบสถานะได้ทันที สะดวก รวดเร็ว ปลอดภัย",
  keywords: [
    "ระบบจัดการสินทรัพย์",
    "ยืม-คืนสินทรัพย์",
    "ครุภัณฑ์",
    "Thai Inter Flying",
    "บริษัท",
    "asset management",
    "borrow return system",
    "TIF AssetFlow",
    "equipment management",
    "ระบบยืมของ",
    "ระบบจัดการครุภัณฑ์",
    "อุปกรณ์",
  ],
  authors: [{ name: "Thai Inter Flying Co., Ltd." }],
  creator: "Thai Inter Flying",
  publisher: "Thai Inter Flying Co., Ltd.",
  category: "Business",
  applicationName: "TIF AssetFlow",

  // ===== Canonical & Alternates =====
  alternates: {
    canonical: "/",
  },

  // ===== Format Detection =====
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // ===== Open Graph (Facebook, LinkedIn, etc.) =====
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "https://assetflow.tif.ac.th",
    siteName: "TIF AssetFlow",
    title: "ระบบจัดการยืม-คืนสินทรัพย์ | Thai Inter Flying",
    description:
      "ระบบบริหารจัดการยืมและคืนครุภัณฑ์ อุปกรณ์สำหรับ Thai Inter Flying — ยืมคืนง่าย ตรวจสอบสถานะได้ทันที",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "TIF AssetFlow — ระบบจัดการยืม-คืนสินทรัพย์ Thai Inter Flying",
      },
    ],
  },

  // ===== Twitter Card =====
  twitter: {
    card: "summary_large_image",
    title: "ระบบจัดการยืม-คืนสินทรัพย์ | Thai Inter Flying",
    description:
      "ระบบบริหารจัดการยืมและคืนครุภัณฑ์ อุปกรณ์สำหรับ Thai Inter Flying — ยืมคืนง่าย ตรวจสอบสถานะได้ทันที",
    images: ["/opengraph-image"],
  },

  // ===== Verification (placeholder — fill in real codes after registering) =====
  // verification: {
  //   google: "YOUR_GOOGLE_VERIFICATION_CODE",
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full" suppressHydrationWarning>
      <body className="min-h-full antialiased text-slate-900 bg-slate-50 dark:bg-slate-955 dark:text-slate-100 transition-colors duration-200">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <ToastProvider>
                <AppLayout>{children}</AppLayout>
              </ToastProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
