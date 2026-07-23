'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  QrCode,
  Box,
  User,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  HelpCircle,
  ArrowRight,
  Share2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Plane,
  FileText,
  Mail,
  Phone,
  RefreshCw,
  Search
} from 'lucide-react';
import Header from '@/components/layout/Header';

interface BorrowRequestInfo {
  id: string;
  startDate: string;
  expectedReturnDate: string;
  purpose?: string;
  status: string;
  borrower?: {
    firstName: string;
    lastName: string;
    employeeCode: string;
    department: string;
  };
}

interface AssetScanData {
  id: string;
  assetCode: string;
  qrCode: string;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  location?: string;
  imageUrl?: string;
  status: 'AVAILABLE' | 'BORROWED' | 'MAINTENANCE' | 'LOST' | 'RETIRED';
  notes?: string;
  currentHolder?: {
    id?: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    department: string;
    email?: string;
    phone?: string;
  } | null;
  borrowRequests?: BorrowRequestInfo[];
}

function PublicScanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language } = useLanguage();
  const { user } = useAuth();

  const rawCode = searchParams.get('code') || '';
  const [asset, setAsset] = useState<AssetScanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!rawCode) {
      setLoading(false);
      setError(
        language === 'th'
          ? 'ไม่พบรหัสสินทรัพย์ในการสแกน กรุณาระบุรหัส ?code=...'
          : 'No asset code provided in scan parameters.'
      );
      return;
    }

    const fetchAssetData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/assets/scan-public?code=${encodeURIComponent(rawCode)}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData.message ||
              (language === 'th'
                ? 'ไม่พบข้อมูลครุภัณฑ์หรือรหัสสินทรัพย์ในระบบ'
                : 'Asset not found or invalid QR code.')
          );
        }
        const data: AssetScanData = await res.json();
        setAsset(data);
      } catch (err: any) {
        console.error('Scan page error:', err);
        setError(err.message || (language === 'th' ? 'เกิดข้อผิดพลาดในการดึงข้อมูล' : 'Failed to fetch asset info'));
      } finally {
        setLoading(false);
      }
    };

    fetchAssetData();
  }, [rawCode, language]);

  const copyPageUrl = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const activeBorrow = asset?.borrowRequests?.[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <div className="absolute top-[5%] left-[10%] w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[120px] animate-pulse duration-[6000ms]" />
        <div className="absolute bottom-[10%] right-[10%] w-[450px] h-[450px] bg-indigo-600/10 rounded-full blur-[140px] animate-pulse duration-[8000ms]" />
      </div>

      {/* Header Bar */}
      <Header />

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 w-full pt-28 pb-16 flex-1 flex flex-col justify-center">
        {/* Loading State */}
        {loading && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 text-center backdrop-blur-xl shadow-2xl space-y-4 max-w-md mx-auto w-full">
            <div className="w-14 h-14 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-300">
              {language === 'th' ? 'กำลังตรวจสอบข้อมูล QR Code...' : 'Verifying Asset QR Code...'}
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-slate-900/90 border border-rose-500/30 rounded-3xl p-8 sm:p-10 text-center backdrop-blur-xl shadow-2xl max-w-lg mx-auto w-full space-y-6">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/25 rounded-2xl flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                {language === 'th' ? 'ไม่พบข้อมูลสินทรัพย์' : 'Asset Not Found'}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">{error}</p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
              >
                {language === 'th' ? 'กลับหน้าหลัก' : 'Back to Home'}
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
              >
                {language === 'th' ? 'เข้าสู่ระบบ' : 'Login to System'}
              </Link>
            </div>
          </div>
        )}

        {/* Success Asset Info View */}
        {!loading && asset && (
          <div className="space-y-6">
            {/* Top Bar Badge */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <QrCode size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    {language === 'th' ? 'ผลการสแกนสินทรัพย์' : 'Scanned Asset Verification'}
                  </p>
                  <p className="text-xs font-mono font-bold text-sky-300">{asset.assetCode}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyPageUrl}
                  className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 text-xs rounded-lg transition-all flex items-center gap-1.5"
                >
                  <Copy size={13} />
                  <span>{copied ? (language === 'th' ? 'คัดลอกลิงก์แล้ว' : 'Copied!') : language === 'th' ? 'แชร์/คัดลอกลิงก์' : 'Share'}</span>
                </button>
              </div>
            </div>

            {/* Main Asset Header Card */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-center">
              {/* Asset Image */}
              <div className="md:col-span-1 flex justify-center">
                <div className="w-44 h-44 sm:w-52 sm:h-52 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden relative flex items-center justify-center group shadow-inner">
                  {asset.imageUrl ? (
                    <img
                      src={asset.imageUrl}
                      alt={asset.name}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-600">
                      <Box size={48} />
                      <span className="text-xs font-medium text-slate-500">No Image</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Asset Details */}
              <div className="md:col-span-2 space-y-4 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold rounded-full">
                    {asset.category}
                  </span>

                  {/* Status Badge */}
                  {asset.status === 'BORROWED' && (
                    <span className="px-3 py-1 bg-rose-500/15 border border-rose-500/40 text-rose-400 text-xs font-bold rounded-full flex items-center gap-1.5 animate-pulse">
                      <Clock size={12} />
                      {language === 'th' ? 'กำลังถูกยืมอยู่' : 'Currently Borrowed'}
                    </span>
                  )}
                  {asset.status === 'AVAILABLE' && (
                    <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold rounded-full flex items-center gap-1.5">
                      <CheckCircle2 size={12} />
                      {language === 'th' ? 'พร้อมใช้งาน' : 'Available'}
                    </span>
                  )}
                  {asset.status === 'MAINTENANCE' && (
                    <span className="px-3 py-1 bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-bold rounded-full flex items-center gap-1.5">
                      <Wrench size={12} />
                      {language === 'th' ? 'ส่งซ่อม/บำรุงรักษา' : 'Under Maintenance'}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
                  {asset.name}
                </h1>

                <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-800/80 pt-4 text-slate-300">
                  <div>
                    <p className="text-slate-500 text-[11px] uppercase font-semibold">{language === 'th' ? 'รหัสครุภัณฑ์' : 'Asset Code'}</p>
                    <p className="font-mono font-bold text-sky-400 mt-0.5">{asset.assetCode}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[11px] uppercase font-semibold">{language === 'th' ? 'Serial Number' : 'Serial Number'}</p>
                    <p className="font-mono text-slate-200 mt-0.5">{asset.serialNumber || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[11px] uppercase font-semibold">{language === 'th' ? 'ยี่ห้อ / รุ่น' : 'Brand / Model'}</p>
                    <p className="text-slate-200 mt-0.5">{asset.brand || '-'} {asset.model ? `(${asset.model})` : ''}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[11px] uppercase font-semibold">{language === 'th' ? 'สถานที่จัดเก็บ' : 'Location'}</p>
                    <p className="text-slate-200 mt-0.5">{asset.location || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* BORROWER HIGHLIGHT SECTION (Key Feature Requested by User) */}
            {asset.status === 'BORROWED' && (asset.currentHolder || activeBorrow) ? (
              <div className="bg-gradient-to-br from-rose-950/40 via-slate-900 to-rose-950/20 border-2 border-rose-500/40 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                {/* Accent glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center gap-3 mb-6 border-b border-rose-500/20 pb-4">
                  <div className="w-10 h-10 bg-rose-500/20 border border-rose-500/40 rounded-xl flex items-center justify-center text-rose-400">
                    <User size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white font-heading">
                      {language === 'th' ? 'ข้อมูลผู้ยืมในขณะนี้ (Current Borrower)' : 'Current Borrower Information'}
                    </h2>
                    <p className="text-xs text-rose-300/80">
                      {language === 'th' ? 'รายการครุภัณฑ์ชิ้นนี้ถูกยืมและอยู่ระหว่างการครอบครอง' : 'This asset is currently checked out'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Holder Info */}
                  <div className="bg-slate-950/60 border border-rose-500/20 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold text-lg">
                        {asset.currentHolder?.firstName?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="text-base font-bold text-white">
                          {asset.currentHolder?.firstName} {asset.currentHolder?.lastName}
                        </p>
                        <p className="text-xs text-rose-400 font-medium">
                          {asset.currentHolder?.department}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 space-y-1.5 text-xs text-slate-300 font-mono border-t border-slate-800">
                      <div className="flex justify-between">
                        <span className="text-slate-500">{language === 'th' ? 'รหัสพนักงาน:' : 'Employee Code:'}</span>
                        <span className="font-bold text-slate-200">{asset.currentHolder?.employeeCode || '-'}</span>
                      </div>
                      {asset.currentHolder?.email && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">{language === 'th' ? 'อีเมล:' : 'Email:'}</span>
                          <span className="text-slate-300">{asset.currentHolder.email}</span>
                        </div>
                      )}
                      {asset.currentHolder?.phone && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">{language === 'th' ? 'เบอร์โทรศัพท์:' : 'Phone:'}</span>
                          <span className="text-slate-300">{asset.currentHolder.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Borrow Request Dates & Status */}
                  <div className="bg-slate-950/60 border border-rose-500/20 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">{language === 'th' ? 'วันที่เริ่มยืม' : 'Borrow Date'}</span>
                        <span className="text-xs font-bold font-mono text-slate-200">
                          {formatDate(activeBorrow?.startDate)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">{language === 'th' ? 'กำหนดส่งคืน' : 'Expected Return'}</span>
                        <span className="text-xs font-bold font-mono text-rose-300">
                          {formatDate(activeBorrow?.expectedReturnDate)}
                        </span>
                      </div>
                      {activeBorrow?.purpose && (
                        <div className="pt-2 border-t border-slate-800">
                          <p className="text-[11px] text-slate-500 font-semibold">{language === 'th' ? 'วัตถุประสงค์การยืม:' : 'Purpose:'}</p>
                          <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{activeBorrow.purpose}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs text-slate-400">{language === 'th' ? 'สถานะการยืม:' : 'Borrow Status:'}</span>
                      <span className="px-2.5 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-[11px] rounded-lg">
                        {activeBorrow?.status === 'OVERDUE'
                          ? (language === 'th' ? 'เกินกำหนดส่งคืน' : 'OVERDUE')
                          : (language === 'th' ? 'อยู่ระหว่างการยืม' : 'BORROWED')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : asset.status === 'AVAILABLE' ? (
              <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-emerald-950/20 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 size={32} />
                  </div>
                  <div className="text-left space-y-1">
                    <h3 className="text-lg font-bold text-white">
                      {language === 'th' ? 'สินทรัพย์นี้ว่าง พร้อมให้ยืม' : 'Asset is Available for Borrow'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {language === 'th' ? 'ยังไม่มีผู้ยืมในขณะนี้ สามารถเข้าสู่ระบบเพื่อยืมชิ้นนี้ได้' : 'Currently not borrowed by anyone. You can borrow this item.'}
                    </p>
                  </div>
                </div>
                <Link
                  href={user ? `/borrow/new?assetId=${asset.id}` : `/login?redirect=/borrow/new?assetId=${asset.id}`}
                  className="w-full sm:w-auto px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 shrink-0"
                >
                  {language === 'th' ? 'ยืมสินทรัพย์นี้' : 'Request to Borrow'}
                  <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-center text-slate-400 text-xs">
                {language === 'th' ? 'ไม่มีข้อมูลผู้ยืมในขณะนี้ เนื่องจากสถานะสินทรัพย์ไม่ใช่ "กำลังถูกยืม"' : 'No borrower information for this asset.'}
              </div>
            )}

            {/* Quick Action Footer Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <Link
                href="/"
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
              >
                {language === 'th' ? 'กลับหน้าหลัก' : 'Back to Home'}
              </Link>

              {user ? (
                <Link
                  href={`/assets/${asset.id}`}
                  className="w-full sm:w-auto px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-sky-500/10 flex items-center justify-center gap-2"
                >
                  {language === 'th' ? 'จัดการสินทรัพย์ในระบบ' : 'View Full Asset Details'}
                  <ExternalLink size={14} />
                </Link>
              ) : (
                <Link
                  href={`/login?redirect=/assets/${asset.id}`}
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  {language === 'th' ? 'เข้าสู่ระบบเพื่อทำรายการ' : 'Login to Manage'}
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function PublicScanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PublicScanContent />
    </Suspense>
  );
}
