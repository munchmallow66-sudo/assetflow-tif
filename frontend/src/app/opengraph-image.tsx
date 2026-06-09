import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = 'ระบบจัดการยืม-คืนสินทรัพย์ | Thai Inter Flying';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  // Fetch Kanit font for Thai support
  const fontData = await fetch(
    new URL('https://github.com/google/fonts/raw/main/ofl/kanit/Kanit-SemiBold.ttf')
  ).then((res) => res.arrayBuffer());

  // Load logo using fetch on import.meta.url (supports Edge runtime)
  let logoBase64 = '';
  try {
    const logoBuffer = await fetch(
      new URL('../../public/logo.png', import.meta.url)
    ).then((res) => res.arrayBuffer());
    
    const base64 = btoa(
      new Uint8Array(logoBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );
    logoBase64 = `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error('Failed to load logo', error);
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0b1329 0%, #1e293b 50%, #0369a1 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '80px',
          fontFamily: 'Kanit, sans-serif',
          color: 'white',
          position: 'relative',
        }}
      >
        {/* Background Decorative Gradients */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, rgba(14,165,233,0) 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            left: '-5%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, rgba(99,102,241,0) 70%)',
            display: 'flex',
          }}
        />

        {/* Top Section: Logo and Brand Name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          {logoBase64 ? (
            <img
              src={logoBase64}
              alt="Logo"
              style={{
                width: '75px',
                height: '75px',
                objectFit: 'contain',
              }}
            />
          ) : (
            <div
              style={{
                width: '75px',
                height: '75px',
                borderRadius: '16px',
                background: '#0ea5e9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '32px',
              }}
            >
              TIF
            </div>
          )}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span
              style={{
                fontSize: '28px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                color: '#ffffff',
              }}
            >
              THAI INTER FLYING
            </span>
            <span
              style={{
                fontSize: '16px',
                color: '#38bdf8',
                fontWeight: 600,
                letterSpacing: '0.1em',
              }}
            >
              AVIATION TRAINING ACADEMY
            </span>
          </div>
        </div>

        {/* Middle Section: Main App Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginTop: '40px',
            marginBottom: '40px',
            zIndex: 10,
          }}
        >
          <span
            style={{
              fontSize: '56px',
              fontWeight: 700,
              lineHeight: 1.2,
              background: 'linear-gradient(to right, #ffffff, #e2e8f0)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            ระบบจัดการยืม-คืนสินทรัพย์
          </span>
          <span
            style={{
              fontSize: '24px',
              color: '#94a3b8',
              fontWeight: 500,
            }}
          >
            ระบบบริหารจัดการพัสดุ ครุภัณฑ์ และอุปกรณ์การบินออนไลน์
          </span>
        </div>

        {/* Bottom Section: Footer Metadata */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '30px',
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
              }}
            />
            <span
              style={{
                fontSize: '18px',
                color: '#94a3b8',
                fontWeight: 500,
              }}
            >
              AssetFlow Web Application
            </span>
          </div>
          <span
            style={{
              fontSize: '18px',
              color: '#38bdf8',
              fontWeight: 600,
            }}
          >
            assetflow-tif.vercel.app
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Kanit',
          data: fontData,
          style: 'normal',
          weight: 600,
        },
      ],
    }
  );
}
