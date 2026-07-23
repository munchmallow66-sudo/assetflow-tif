/**
 * Helper to get the base URL of the application.
 * Priority:
 * 1. Client-side browser window.location.origin
 * 2. Environment variable NEXT_PUBLIC_APP_URL
 * 3. Default fallback to localhost:3000
 */
export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  return 'https://assetflow.tif.ac.th';
}

/**
 * Returns the full web scan URL to be embedded in a QR code.
 * Scanning this URL will open the public scan page directly in any mobile camera/browser.
 */
export function getAssetScanUrl(code: string): string {
  const baseUrl = getAppBaseUrl();
  return `${baseUrl}/scan?code=${encodeURIComponent(code)}`;
}

/**
 * Returns the QRServer API image URL for rendering a QR code.
 */
export function getQrCodeImageUrl(code: string, size = '180x180'): string {
  const scanUrl = getAssetScanUrl(code);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}&data=${encodeURIComponent(scanUrl)}`;
}
