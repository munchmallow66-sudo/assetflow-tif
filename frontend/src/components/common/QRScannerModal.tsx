'use client';

import React, { useEffect, useRef } from 'react';
import { X, Camera, AlertCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
  title?: string;
}

export default function QRScannerModal({
  isOpen,
  onClose,
  onScan,
  title = 'สแกน QR Code สินทรัพย์'
}: QRScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = 'html5qr-code-region';

  useEffect(() => {
    if (!isOpen) return;

    // Small delay to ensure the DOM element is rendered
    const timer = setTimeout(() => {
      const startScanner = async () => {
        try {
          // Initialize scanner
          const scanner = new Html5Qrcode(qrRegionId);
          scannerRef.current = scanner;

          await scanner.start(
            { facingMode: 'environment' }, // Use back camera if available
            {
              fps: 10,
              qrbox: (width, height) => {
                const size = Math.min(width, height) * 0.7;
                return { width: size, height: size };
              },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              // On successful scan
              onScan(decodedText);
              stopScanner();
              onClose();
            },
            () => {
              // Ignore failure logs to avoid spam
            }
          );
        } catch (err) {
          console.error('Failed to start scanner:', err);
        }
      };

      startScanner();
    }, 300);

    const stopScanner = async () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        try {
          await scannerRef.current.stop();
        } catch (err) {
          console.error('Failed to stop scanner:', err);
        }
      }
    };

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen, onClose, onScan]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl overflow-hidden shadow-2xl max-w-sm w-full relative flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sky-400">
            <Camera size={18} />
            <h3 className="text-sm font-bold tracking-wide">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Camera container */}
        <div className="p-6 flex flex-col items-center gap-4">
          <div className="relative w-64 h-64 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
            {/* HTML5 QrCode scanner target div */}
            <div id={qrRegionId} className="w-full h-full object-cover"></div>

            {/* Glowing Corner Borders Mockup Overlay (displays over the camera feed) */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[180px] h-[180px] border border-sky-500/30 rounded-lg relative">
                {/* Pulse Laser Beam Effect */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400 to-transparent animate-bounce"></div>
                {/* Top-Left Corner */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-sky-400 rounded-tl"></div>
                {/* Top-Right Corner */}
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-sky-400 rounded-tr"></div>
                {/* Bottom-Left Corner */}
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-sky-400 rounded-bl"></div>
                {/* Bottom-Right Corner */}
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-sky-400 rounded-br"></div>
              </div>
            </div>
          </div>

          <div className="text-center space-y-1">
            <p className="text-[11px] font-medium text-slate-400">
              กรุณาจัดให้รหัส QR Code อยู่กึ่งกลางของกรอบกล้อง
            </p>
            <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
              <AlertCircle size={12} />
              <span>ต้องการสิทธิ์เข้าใช้งานกล้องถ่ายรูป (Webcam)</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}
