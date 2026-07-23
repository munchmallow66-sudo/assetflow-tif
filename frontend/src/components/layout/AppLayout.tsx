'use client';

import React, { useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import Sidebar from './Sidebar';
import { usePathname, useRouter } from 'next/navigation';
import QRScannerModal from '@/components/common/QRScannerModal';
import api from '@/lib/api';
import { useLanguage } from '../providers/LanguageProvider';
import { QrCode, X, Box, CheckCircle2, AlertTriangle, ArrowRight, BookOpen, Clock } from 'lucide-react';

interface ScannedAsset {
  id: string;
  assetCode: string;
  name: string;
  category: string;
  status: 'AVAILABLE' | 'BORROWED' | 'MAINTENANCE' | 'LOST' | 'RETIRED';
  currentHolderId?: string | null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { t, language } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedAsset, setScannedAsset] = useState<ScannedAsset | null>(null);
  const [activeBorrowRequestId, setActiveBorrowRequestId] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const isLoginPage = pathname === '/login';

  const handleGlobalScan = async (scannedText: string) => {
    setLookupLoading(true);
    setLookupError(null);
    setScannedAsset(null);
    setActiveBorrowRequestId(null);

    let cleanCode = scannedText.trim();
    try {
      if (cleanCode.includes('code=')) {
        const urlObj = new URL(cleanCode.startsWith('http') ? cleanCode : `http://dummy.com/${cleanCode}`);
        cleanCode = urlObj.searchParams.get('code') || cleanCode;
      }
    } catch (e) {
      // Keep cleanCode as is
    }

    try {
      // Fetch all assets to lookup the code
      const assetsRes = await api.get('/assets');
      const matchedAsset = assetsRes.data.find(
        (a: any) => a.assetCode === cleanCode || a.qrCode === cleanCode
      );

      if (matchedAsset) {
        setScannedAsset(matchedAsset);
        
        // If borrowed/overdue, try to fetch the active borrow request to help with returns
        if (matchedAsset.status === 'BORROWED') {
          try {
            const borrowRequestsRes = await api.get('/borrow-requests');
            const activeRequest = borrowRequestsRes.data.find(
              (r: any) => r.assetId === matchedAsset.id && (r.status === 'BORROWED' || r.status === 'OVERDUE')
            );
            if (activeRequest) {
              setActiveBorrowRequestId(activeRequest.id);
            }
          } catch (err) {
            console.error('Failed to lookup active borrow request', err);
          }
        }
      } else {
        setLookupError(language === 'th' ? `ไม่พบสินทรัพย์หรือครุภัณฑ์รหัส "${scannedText}" ในระบบ` : `Asset with code "${scannedText}" was not found in the system`);
      }
    } catch (err) {
      setLookupError(language === 'th' ? 'เกิดข้อผิดพลาดในการตรวจสอบรหัสสินทรัพย์' : 'An error occurred while looking up the asset code');
    } finally {
      setLookupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {language === 'th' ? 'กำลังโหลดข้อมูลระบบ...' : 'Loading system data...'}
          </p>
        </div>
      </div>
    );
  }

  if (isLoginPage || !user) {
    return <div className="min-h-screen w-full bg-slate-50">{children}</div>;
  }

  return (
    <div className="min-h-screen flex w-full bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
        <main className="flex-grow p-4 md:p-8 pt-20 lg:pt-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>
      
      {/* Mobile QR Scanner FAB (Floating Action Button) */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsScannerOpen(true)}
          className="w-14 h-14 bg-sky-500 hover:bg-sky-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
          title={language === 'th' ? 'สแกน QR Code ด่วน' : 'Quick QR Scan'}
        >
          <QrCode size={26} />
        </button>
      </div>

      {/* Global QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleGlobalScan}
        title={language === 'th' ? 'สแกน QR Code ครุภัณฑ์หลักของระบบ' : 'Scan Primary Asset QR Code'}
      />

      {/* Lookup Loading Modal */}
      {lookupLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-2xl flex flex-col items-center gap-3 shadow-xl max-w-xs w-full">
            <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {language === 'th' ? 'กำลังตรวจสอบข้อมูลครุภัณฑ์...' : 'Verifying asset details...'}
            </p>
          </div>
        </div>
      )}

      {/* Lookup Error Modal */}
      {lookupError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-xl max-w-sm w-full relative">
            <button
              onClick={() => setLookupError(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-650 transition-colors"
            >
              <X size={16} />
            </button>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center border border-red-100">
                <AlertTriangle size={24} />
              </div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                {language === 'th' ? 'ไม่พบคลังข้อมูลครุภัณฑ์' : 'Asset Not Found'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">{lookupError}</p>
              <button
                onClick={() => setLookupError(null)}
                className="mt-2 w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {language === 'th' ? 'ตกลง' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scanned Asset Options Modal (Interactive Decision Pop-up) */}
      {scannedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-xl max-w-sm w-full relative flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800">
              <div className="flex items-center gap-2 text-sky-500">
                <QrCode size={18} />
                <h3 className="text-xs font-extrabold tracking-wide uppercase">
                  {language === 'th' ? 'ตรวจพบครุภัณฑ์ใหม่' : 'Asset Scanned'}
                </h3>
              </div>
              <button
                onClick={() => setScannedAsset(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Asset summary details */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-900">
                  <Box size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-snug">{scannedAsset.name}</h4>
                  <p className="text-[10px] text-slate-450 font-mono mt-0.5">
                    {language === 'th' ? 'รหัสสินค้า:' : 'Asset Code:'} {scannedAsset.assetCode}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {language === 'th' ? 'หมวดหมู่:' : 'Category:'} {scannedAsset.category}
                  </p>
                </div>
              </div>

              {/* Status information */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-xl">
                <span className="text-[10px] font-semibold text-slate-500">
                  {language === 'th' ? 'สถานะปัจจุบัน:' : 'Current Status:'}
                </span>
                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider
                  ${scannedAsset.status === 'AVAILABLE' ? 'badge-available' : ''}
                  ${scannedAsset.status === 'BORROWED' ? 'badge-borrowed' : ''}
                  ${scannedAsset.status === 'MAINTENANCE' ? 'badge-maintenance' : ''}
                  ${scannedAsset.status === 'LOST' ? 'badge-lost' : ''}
                  ${scannedAsset.status === 'RETIRED' ? 'badge-retired' : ''}
                `}>
                  {scannedAsset.status === 'AVAILABLE' && (language === 'th' ? 'พร้อมใช้งาน' : 'Available')}
                  {scannedAsset.status === 'BORROWED' && (language === 'th' ? 'อยู่ระหว่างการยืม' : 'Borrowed')}
                  {scannedAsset.status === 'MAINTENANCE' && (language === 'th' ? 'ซ่อมบำรุง' : 'Maintenance')}
                  {scannedAsset.status === 'LOST' && (language === 'th' ? 'สูญหาย' : 'Lost')}
                  {scannedAsset.status === 'RETIRED' && (language === 'th' ? 'จำหน่าย' : 'Retired')}
                </span>
              </div>
            </div>

            {/* User action options */}
            <div className="space-y-2 pt-2 border-t dark:border-slate-800">
              {/* Option 1: Borrow (If available and user is STAFF/ADMIN/APPROVER) */}
              {scannedAsset.status === 'AVAILABLE' && (user.role === 'STAFF' || user.role === 'ADMIN' || user.role === 'APPROVER') && (
                <button
                  onClick={() => {
                    setScannedAsset(null);
                    router.push(`/borrow/new?assetId=${scannedAsset.id}`);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/10 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>{language === 'th' ? 'ต้องการยื่นคำขอยืมสินทรัพย์นี้' : 'Request to Borrow Asset'}</span>
                  </span>
                  <ArrowRight size={14} />
                </button>
              )}

              {/* Option 2: Return (If borrowed/overdue and user is ADMIN, or user holds the asset) */}
              {scannedAsset.status === 'BORROWED' && (user.role === 'ADMIN' || (scannedAsset.currentHolderId && scannedAsset.currentHolderId === user.employeeId)) && (
                <button
                  onClick={() => {
                    setScannedAsset(null);
                    if (activeBorrowRequestId) {
                      router.push(`/returns/new?requestId=${activeBorrowRequestId}`);
                    } else {
                      router.push('/returns/new');
                    }
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>{language === 'th' ? 'บันทึกส่งคืนสินทรัพย์นี้' : 'Record Return of Asset'}</span>
                  </span>
                  <ArrowRight size={14} />
                </button>
              )}

              {/* Option 3: View Details (Always available) */}
              <button
                onClick={() => {
                  setScannedAsset(null);
                  router.push(`/assets/${scannedAsset.id}`);
                }}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-355 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <BookOpen size={16} />
                  <span>{language === 'th' ? 'ดูรายละเอียดและประวัติเครื่อง' : 'View Details & History'}</span>
                </span>
                <ArrowRight size={14} />
              </button>

              <button
                onClick={() => setScannedAsset(null)}
                className="w-full py-2 bg-transparent text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer"
              >
                {language === 'th' ? 'ปิดหน้าต่างนี้' : 'Close window'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
