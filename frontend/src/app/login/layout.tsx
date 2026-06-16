import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ — ระบบจัดการยืม-คืนสินทรัพย์',
  description:
    'เข้าสู่ระบบ TIF AssetFlow เพื่อจัดการยืม-คืนครุภัณฑ์ อุปกรณ์การบิน ของสถาบันการบิน Thai Inter Flying — ตรวจสอบสถานะ ยื่นคำขอยืม และบันทึกการคืนได้อย่างสะดวก',
  alternates: {
    canonical: '/login',
  },
  openGraph: {
    title: 'เข้าสู่ระบบ TIF AssetFlow',
    description:
      'ระบบบริหารจัดการยืมและคืนครุภัณฑ์ อุปกรณ์การบิน สำหรับ Thai Inter Flying — เข้าสู่ระบบเพื่อเริ่มต้นใช้งาน',
    url: '/login',
  },
};

// JSON-LD Structured Data for Organization + WebApplication
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://assetflow-tif.vercel.app/#organization',
      name: 'Thai Inter Flying Co., Ltd.',
      alternateName: 'TIF',
      url: 'https://assetflow-tif.vercel.app',
      logo: {
        '@type': 'ImageObject',
        url: 'https://assetflow-tif.vercel.app/logo.png',
        width: 240,
        height: 99,
      },
      description:
        'สถาบันการบิน Thai Inter Flying — บริษัทฝึกอบรมนักบินและบุคลากรการบิน',
    },
    {
      '@type': 'WebApplication',
      '@id': 'https://assetflow-tif.vercel.app/#webapp',
      name: 'TIF AssetFlow',
      url: 'https://assetflow-tif.vercel.app',
      description:
        'ระบบบริหารจัดการยืมและคืนครุภัณฑ์ อุปกรณ์การบิน ภายในสถาบันการบิน Thai Inter Flying จำกัด',
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
        '@id': 'https://assetflow-tif.vercel.app/#organization',
      },
    },
    {
      '@type': 'WebPage',
      '@id': 'https://assetflow-tif.vercel.app/login',
      url: 'https://assetflow-tif.vercel.app/login',
      name: 'เข้าสู่ระบบ TIF AssetFlow — ระบบจัดการยืม-คืนสินทรัพย์',
      description:
        'เข้าสู่ระบบเพื่อจัดการยืม-คืนครุภัณฑ์ อุปกรณ์การบิน ของสถาบันการบิน Thai Inter Flying',
      isPartOf: {
        '@type': 'WebSite',
        '@id': 'https://assetflow-tif.vercel.app/#website',
        name: 'TIF AssetFlow',
        url: 'https://assetflow-tif.vercel.app',
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
