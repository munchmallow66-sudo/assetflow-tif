import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ — ระบบจัดการยืม-คืนสินทรัพย์',
  description:
    'เข้าสู่ระบบ TIF AssetFlow เพื่อจัดการยืม-คืนครุภัณฑ์ อุปกรณ์ ของบริษัท Thai Inter Flying — ตรวจสอบสถานะ ยื่นคำขอยืม และบันทึกการคืนได้อย่างสะดวก',
  alternates: {
    canonical: '/login',
  },
  openGraph: {
    title: 'เข้าสู่ระบบ TIF AssetFlow',
    description:
      'ระบบบริหารจัดการยืมและคืนครุภัณฑ์ อุปกรณ์ สำหรับ Thai Inter Flying — เข้าสู่ระบบเพื่อเริ่มต้นใช้งาน',
    url: '/login',
  },
};

// JSON-LD Structured Data for Organization + WebApplication
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://assetflow.tif.ac.th/#organization',
      name: 'Thai Inter Flying Co., Ltd.',
      alternateName: 'TIF',
      url: 'https://assetflow.tif.ac.th',
      logo: {
        '@type': 'ImageObject',
        url: 'https://assetflow.tif.ac.th/logo.png',
        width: 240,
        height: 99,
      },
      description:
        'บริษัท Thai Inter Flying จำกัด',
    },
    {
      '@type': 'WebApplication',
      '@id': 'https://assetflow.tif.ac.th/#webapp',
      name: 'TIF AssetFlow',
      url: 'https://assetflow.tif.ac.th',
      description:
        'ระบบบริหารจัดการยืมและคืนครุภัณฑ์ อุปกรณ์ ภายในบริษัท Thai Inter Flying จำกัด',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      inLanguage: 'th',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'THB',
        description: 'ระบบสำหรับใช้งานภายในองค์กร',
      },
      publisher: {
        '@type': 'Organization',
        '@id': 'https://assetflow.tif.ac.th/#organization',
      },
    },
    {
      '@type': 'WebPage',
      '@id': 'https://assetflow.tif.ac.th/login',
      url: 'https://assetflow.tif.ac.th/login',
      name: 'เข้าสู่ระบบ TIF AssetFlow — ระบบจัดการยืม-คืนสินทรัพย์',
      description:
        'เข้าสู่ระบบเพื่อจัดการยืม-คืนครุภัณฑ์ อุปกรณ์ ของบริษัท Thai Inter Flying',
      isPartOf: {
        '@type': 'WebSite',
        '@id': 'https://assetflow.tif.ac.th/#website',
        name: 'TIF AssetFlow',
        url: 'https://assetflow.tif.ac.th',
      },
    },
  ],
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
