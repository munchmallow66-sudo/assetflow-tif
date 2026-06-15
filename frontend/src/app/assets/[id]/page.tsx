'use client';

import React, { useEffect, useState, use } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import api from '@/lib/api';
import {
  ArrowLeft,
  Calendar,
  User,
  History,
  Box,
  QrCode,
  FileText,
  AlertCircle,
  Clock,
  ClipboardCheck,
  Edit2,
  PlusCircle
} from 'lucide-react';
import Link from 'next/link';

interface AssetDetail {
  id: string;
  assetCode: string;
  name: string;
  category: string;
  serialNumber?: string;
  description?: string;
  status: 'AVAILABLE' | 'BORROWED' | 'MAINTENANCE' | 'LOST' | 'RETIRED';
  imageUrl?: string;
  qrCode: string;
}

interface BorrowHistory {
  id: string;
  requestNo: string;
  borrowDate: string;
  expectedReturnDate: string;
  purpose: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BORROWED' | 'RETURNED' | 'OVERDUE' | 'CANCELLED';
  approvedAt?: string;
  rejectedReason?: string;
  borrower: {
    employeeCode: string;
    firstName: string;
    lastName: string;
    department: string;
  };
  approvedBy?: {
    name: string;
  } | null;
  assetReturn?: {
    returnDate: string;
    condition: 'NORMAL' | 'DAMAGED' | 'LOST' | 'INCOMPLETE';
    conditionNote?: string;
    imageUrl?: string;
  } | null;
}

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [history, setHistory] = useState<BorrowHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [assetRes, historyRes] = await Promise.all([
          api.get(`/assets/${id}`),
          api.get(`/assets/${id}/history`),
        ]);
        setAsset(assetRes.data);
        setHistory(historyRes.data);
      } catch (err) {
        setError('ไม่พบข้อมูลสินทรัพย์หรือประวัติที่ระบุ');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2 py-1 text-xs font-bold rounded-md badge-available">พร้อมใช้งาน</span>;
      case 'BORROWED':
        return <span className="px-2 py-1 text-xs font-bold rounded-md badge-borrowed">ถูกยืมอยู่</span>;
      case 'MAINTENANCE':
        return <span className="px-2 py-1 text-xs font-bold rounded-md badge-maintenance">ซ่อมบำรุง</span>;
      case 'LOST':
        return <span className="px-2 py-1 text-xs font-bold rounded-md badge-lost">สูญหาย</span>;
      case 'RETIRED':
        return <span className="px-2 py-1 text-xs font-bold rounded-md badge-retired">จำหน่าย/เลิกใช้</span>;
      default:
        return <span className="px-2 py-1 text-xs font-bold rounded-md">{status}</span>;
    }
  };

  const getConditionBadge = (cond: string) => {
    switch (cond) {
      case 'NORMAL':
        return <span className="px-1.5 py-0.5 text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 rounded font-semibold">ปกติ (Normal)</span>;
      case 'INCOMPLETE':
        return <span className="px-1.5 py-0.5 text-[10px] bg-amber-50 text-amber-600 border border-amber-200 rounded font-semibold">อุปกรณ์ไม่ครบ (Incomplete)</span>;
      case 'DAMAGED':
        return <span className="px-1.5 py-0.5 text-[10px] bg-red-50 text-red-600 border border-red-200 rounded font-semibold">ชำรุด (Damaged)</span>;
      case 'LOST':
        return <span className="px-1.5 py-0.5 text-[10px] bg-red-950/20 text-red-400 border border-red-800 rounded font-semibold font-sans">สูญหาย (Lost)</span>;
      default:
        return <span className="px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-600 border border-slate-200 rounded font-semibold">{cond}</span>;
    }
  };

  const getBorrowStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold badge-pending">รออนุมัติ</span>;
      case 'RETURN_PENDING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold badge-pending">รออนุมัติการคืน</span>;
      case 'BORROWED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold badge-borrowed">กำลังยืม</span>;
      case 'RETURNED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold badge-returned">คืนแล้ว</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold badge-rejected">ปฏิเสธแล้ว</span>;
      case 'OVERDUE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold badge-overdue">ค้างคืน</span>;
      case 'CANCELLED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold badge-retired">ยกเลิกแล้ว</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl">
        {error || 'เกิดข้อผิดพลาดในการโหลดข้อมูล'}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Navigation and Back link */}
      <div className="flex justify-between items-center gap-4">
        <Link
          href="/assets"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-xs font-semibold"
        >
          <ArrowLeft size={16} />
          <span>ย้อนกลับไปหน้าสินทรัพย์</span>
        </Link>
        <div className="flex gap-2">
          {asset.status === 'AVAILABLE' && (user?.role === 'STAFF' || user?.role === 'ADMIN' || user?.role === 'APPROVER') && (
            <Link
              href={`/borrow/new?assetId=${asset.id}`}
              className="flex items-center gap-2 bg-gradient-to-r from-sky-400 via-sky-500 to-indigo-500 hover:from-sky-500 hover:to-indigo-650 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-sky-500/10 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 duration-200"
            >
              <PlusCircle size={14} />
              <span>ยื่นขอยืมสินทรัพย์นี้</span>
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link
              href={`/assets/${asset.id}/edit`}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-amber-500/10 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 duration-200"
            >
              <Edit2 size={14} />
              <span>แก้ไขข้อมูลสินทรัพย์</span>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Image & QR Code */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="h-56 bg-slate-50 border border-slate-100 rounded-xl relative overflow-hidden flex items-center justify-center">
              {asset.imageUrl ? (
                <img
                  src={asset.imageUrl}
                  alt={asset.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Box className="text-slate-300" size={64} />
              )}
            </div>
          </div>

          {/* QR Code Container */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <QrCode className="text-sky-500" size={18} />
              <h3 className="text-xs font-bold text-slate-700 uppercase">QR Code ประจำสินทรัพย์</h3>
            </div>
            
            {/* Real Generated QR Code */}
            <div className="mx-auto w-36 h-36 bg-white border-2 border-slate-100 rounded-xl flex items-center justify-center p-2.5 relative">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(asset.qrCode)}`}
                alt="Asset QR Code"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-[11px] font-mono text-slate-500 mt-3 bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-100 inline-block">
              {asset.qrCode}
            </p>
          </div>
        </div>

        {/* Right column: Detailed specifications and history */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detailed Info Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 uppercase tracking-wider">
                  {asset.category}
                </span>
                <h2 className="text-xl font-bold text-slate-800 mt-2">{asset.name}</h2>
              </div>
              <div className="shrink-0">{getStatusBadge(asset.status)}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-400 font-semibold">รหัสสินค้า / Asset Code</p>
                <p className="text-sm font-semibold text-slate-700 mt-1">{asset.assetCode}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold">หมายเลขซีเรียล / Serial Number</p>
                <p className="text-sm font-semibold text-slate-700 mt-1">{asset.serialNumber || 'ไม่มีหมายเลขซีเรียล'}</p>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs text-slate-400 font-semibold">รายละเอียดคุณสมบัติ</p>
              <p className="text-xs text-slate-600 leading-relaxed mt-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                {asset.description || 'ไม่มีคำอธิบายเพิ่มเติมสำหรับสินทรัพย์นี้'}
              </p>
            </div>
          </div>

          {/* History Timeline */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-6">
              <History className="text-sky-500" size={20} />
              <h3 className="text-base font-bold text-slate-800">ประวัติการทำรายการยืม-คืน</h3>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                <FileText size={32} className="mx-auto text-slate-200 mb-2" />
                <p>ไม่มีประวัติการยืมในระบบ</p>
              </div>
            ) : (
              <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-8">
                {history.map((item) => (
                  <div key={item.id} className="relative">
                    {/* Icon marker */}
                    <div className="absolute -left-10 top-0.5 bg-slate-100 border-2 border-slate-200 rounded-full p-1 w-8 h-8 flex items-center justify-center text-slate-500">
                      <User size={14} />
                    </div>

                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
                      {/* Header row */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs">
                          <span className="font-bold text-slate-700">{item.borrower.firstName}</span>
                          <span className="text-slate-400 font-medium"> ({item.borrower.department})</span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded">
                            {item.requestNo}
                          </span>
                          {getBorrowStatusText(item.status)}
                        </div>
                      </div>

                      {/* Info lines */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-slate-400" />
                          <span>ยืม: {new Date(item.borrowDate).toLocaleDateString('th-TH')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-slate-400" />
                          <span>กำหนดส่งคืน: {new Date(item.expectedReturnDate).toLocaleDateString('th-TH')}</span>
                        </div>
                      </div>

                      {/* Purpose */}
                      <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100">
                        <span className="font-bold text-slate-400">วัตถุประสงค์: </span>
                        {item.purpose}
                      </div>

                      {/* Rejection comments */}
                      {item.status === 'REJECTED' && item.rejectedReason && (
                        <div className="p-2.5 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs">
                          <span className="font-bold">เหตุผลที่ปฏิเสธ: </span>
                          {item.rejectedReason}
                        </div>
                      )}

                      {/* Approver detail */}
                      {item.approvedBy && (
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <ClipboardCheck size={12} />
                          <span>ดำเนินการอนุมัติโดย: {item.approvedBy.name}</span>
                        </div>
                      )}

                      {/* Return records */}
                      {item.assetReturn && (
                        <div className="mt-3 pt-3 border-t border-slate-200/50 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700">ส่งคืนเรียบร้อย</span>
                            {getConditionBadge(item.assetReturn.condition)}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar size={12} />
                            <span>วันที่คืนจริง: {new Date(item.assetReturn.returnDate).toLocaleDateString('th-TH')}</span>
                          </div>
                          {item.assetReturn.conditionNote && (
                            <p className="text-xs text-slate-500 leading-relaxed bg-white p-2 rounded border border-slate-100">
                              <span className="font-bold text-slate-400">หมายเหตุการคืน: </span>
                              {item.assetReturn.conditionNote}
                            </p>
                          )}
                          {item.assetReturn.imageUrl && (
                            <div className="mt-2 h-20 w-32 border border-slate-100 rounded-md overflow-hidden bg-slate-100 relative">
                              <img
                                src={item.assetReturn.imageUrl}
                                alt="Return Condition"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
