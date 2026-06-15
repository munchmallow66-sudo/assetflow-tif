'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import api from '@/lib/api';
import { ClipboardList, PlusCircle, Check, X, AlertCircle, FileText, Ban, Eye, Undo2 } from 'lucide-react';
import Link from 'next/link';
import { TableSkeleton } from '@/components/common/Skeleton';

interface BorrowRequest {
  id: string;
  requestNo: string;
  borrowDate: string;
  expectedReturnDate: string;
  purpose: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BORROWED' | 'RETURN_PENDING' | 'RETURNED' | 'OVERDUE' | 'CANCELLED';
  rejectedReason?: string;
  createdAt: string;
  asset: {
    id: string;
    assetCode: string;
    name: string;
  };
  borrower: {
    firstName: string;
    lastName: string;
    department: string;
  };
  assetReturn?: {
    id: string;
    returnDate: string;
    condition: 'NORMAL' | 'DAMAGED' | 'LOST' | 'INCOMPLETE';
    conditionNote?: string | null;
    imageUrl?: string | null;
  } | null;
}

export default function BorrowPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [selectedReturn, setSelectedReturn] = useState<BorrowRequest | null>(null);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/borrow-requests');
      setRequests(res.data);
    } catch (err) {
      console.error('Failed to fetch borrow requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: string, requestNo: string) => {
    if (!confirm(`ยืนยันการอนุมัติการยืมรายการรหัส: ${requestNo}?`)) return;
    try {
      await api.patch(`/borrow-requests/${id}/approve`);
      alert('อนุมัติรายการยืมเรียบร้อยแล้ว');
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'การอนุมัติล้มเหลว');
    }
  };

  const handleReject = async (id: string, requestNo: string) => {
    const reason = prompt('กรุณาระบุเหตุผลในการปฏิเสธคำขอนี้:');
    if (reason === null) return;
    if (!reason.trim()) {
      alert('จำเป็นต้องระบุเหตุผลในการปฏิเสธ');
      return;
    }

    try {
      await api.patch(`/borrow-requests/${id}/reject`, { rejectedReason: reason });
      alert('ปฏิเสธรายการยืมเรียบร้อยแล้ว');
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'การดำเนินการล้มเหลว');
    }
  };

  const handleCancel = async (id: string, requestNo: string) => {
    if (!confirm(`คุณต้องการยกเลิกคำขอยืมรายการรหัส: ${requestNo}?`)) return;
    try {
      await api.patch(`/borrow-requests/${id}/cancel`);
      alert('ยกเลิกรายการยืมเรียบร้อยแล้ว');
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'การยกเลิกล้มเหลว');
    }
  };

  const handleApproveReturn = async (id: string, requestNo: string) => {
    if (!confirm(`ยืนยันการอนุมัติการรับคืนรายการรหัส: ${requestNo}?`)) return;
    try {
      await api.patch(`/borrow-requests/${id}/approve-return`);
      alert('อนุมัติการส่งคืนเรียบร้อยแล้ว');
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'การอนุมัติล้มเหลว');
    }
  };

  const handleRejectReturn = async (id: string, requestNo: string) => {
    if (!confirm(`ยืนยันการปฏิเสธการรับคืนรายการรหัส: ${requestNo}?`)) return;
    try {
      await api.patch(`/borrow-requests/${id}/reject-return`);
      alert('ปฏิเสธการส่งคืนเรียบร้อยแล้ว');
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'การดำเนินการล้มเหลว');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md badge-pending">รออนุมัติ</span>;
      case 'RETURN_PENDING':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md badge-pending">รออนุมัติคืน</span>;
      case 'BORROWED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md badge-borrowed">กำลังยืม</span>;
      case 'RETURNED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md badge-returned">คืนแล้ว</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md badge-rejected">ปฏิเสธแล้ว</span>;
      case 'OVERDUE':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md badge-overdue font-sans">ค้างคืน</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md badge-retired">ยกเลิกแล้ว</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md">{status}</span>;
    }
  };

  // Filter lists based on tab selection and roles
  const pendingRequests = requests.filter((r) => r.status === 'PENDING' || r.status === 'RETURN_PENDING');
  const historyRequests = requests.filter((r) => r.status !== 'PENDING' && r.status !== 'RETURN_PENDING');

  const showTabs = user?.role === 'ADMIN' || user?.role === 'APPROVER';
  const displayList = showTabs 
    ? (activeTab === 'pending' ? pendingRequests : historyRequests) 
    : requests;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">รายการยืม-คืนสินทรัพย์</h1>
          <p className="text-slate-500 text-xs mt-1">ประวัติการทำรายการและอนุมัติคำขอยืมครุภัณฑ์</p>
        </div>
        {(user?.role === 'STAFF' || user?.role === 'ADMIN') && (
          <Link
            href="/borrow/new"
            className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md shadow-sky-500/10 cursor-pointer"
          >
            <PlusCircle size={16} />
            <span>ขอยืมสินทรัพย์</span>
          </Link>
        )}
      </div>

      {/* Tabs for Admin/Approver */}
      {showTabs && (
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3.5 text-xs font-semibold border-b-2 transition-all duration-200 ${
              activeTab === 'pending'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            คำขอรอการอนุมัติ ({pendingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3.5 text-xs font-semibold border-b-2 transition-all duration-200 ${
              activeTab === 'history'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            ประวัติการทำรายการ ({historyRequests.length})
          </button>
        </div>
      )}

      {/* Requests Table */}
      {loading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : displayList.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 shadow-sm">
          <ClipboardList size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm">ไม่มีคำรายการการขอยืมในขณะนี้</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">เลขที่คำขอ</th>
                  <th className="px-6 py-4">ผู้ยืม / ฝ่าย</th>
                  <th className="px-6 py-4">สินทรัพย์ / รหัส</th>
                  <th className="px-6 py-4">วันที่ยืม - กำหนดคืน</th>
                  <th className="px-6 py-4">วัตถุประสงค์</th>
                  <th className="px-6 py-4">สถานะ</th>
                  <th className="px-6 py-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {displayList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-600 font-semibold">{item.requestNo}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{item.borrower.firstName}</p>
                      <p className="text-[10px] text-slate-400">{item.borrower.department}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 line-clamp-1">{item.asset.name}</p>
                      <p className="text-[10px] text-slate-400">{item.asset.assetCode}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500 space-y-0.5">
                      <p>ยืม: {new Date(item.borrowDate).toLocaleDateString('th-TH')}</p>
                      <p className="font-medium text-slate-400">คืน: {new Date(item.expectedReturnDate).toLocaleDateString('th-TH')}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate" title={item.purpose}>
                      {item.purpose}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Approver / Admin actions on Pending list */}
                        {item.status === 'PENDING' && (user?.role === 'ADMIN' || user?.role === 'APPROVER') && (
                          <>
                            <button
                              onClick={() => handleApprove(item.id, item.requestNo)}
                              className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
                              title="อนุมัติการยืม"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleReject(item.id, item.requestNo)}
                              className="p-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                              title="ปฏิเสธคำขอ"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}

                        {/* Return approval actions for ADMIN */}
                        {item.status === 'RETURN_PENDING' && user?.role === 'ADMIN' && (
                          <button
                            onClick={() => setSelectedReturn(item)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-600 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors cursor-pointer text-[10px] font-bold"
                            title="ตรวจสอบสภาพส่งคืน"
                          >
                            <Eye size={12} />
                            <span>ตรวจสภาพส่งคืน</span>
                          </button>
                        )}

                        {/* Staff can cancel their own pending request */}
                        {item.status === 'PENDING' && user?.role === 'STAFF' && (
                          <button
                            onClick={() => handleCancel(item.id, item.requestNo)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer text-[10px] font-bold"
                          >
                            <Ban size={12} />
                            <span>ยกเลิกคำขอ</span>
                          </button>
                        )}

                        {item.status !== 'PENDING' && (
                          <div className="flex justify-center items-center gap-1.5">
                            <Link
                              href={`/assets/${item.asset.id}`}
                              className="p-1.5 border border-slate-200 hover:border-sky-500 hover:text-sky-600 text-slate-500 rounded-lg transition-colors cursor-pointer"
                              title="ดูรายละเอียดสินทรัพย์"
                            >
                              <Eye size={14} />
                            </Link>
                            {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (item.status === 'BORROWED' || item.status === 'OVERDUE') && (
                              <Link
                                href={`/returns/new?requestId=${item.id}`}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-250 rounded-lg transition-colors cursor-pointer font-bold text-[10px]"
                                title="คืนสินทรัพย์"
                              >
                                <Undo2 size={12} />
                                <span>คืนของ</span>
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Return Details Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-6 rounded-3xl shadow-xl max-w-md w-full relative flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800">
              <div className="flex items-center gap-2 text-sky-500">
                <FileText size={18} />
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">รายละเอียดการส่งคืนครุภัณฑ์</h3>
              </div>
              <button
                onClick={() => setSelectedReturn(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Asset Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">สินทรัพย์</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{selectedReturn.asset.name}</p>
                  <p className="text-[9px] text-slate-455 font-mono mt-0.5">{selectedReturn.asset.assetCode}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">ผู้ส่งคืน</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">
                    {selectedReturn.borrower.firstName} {selectedReturn.borrower.lastName}
                  </p>
                  <p className="text-[9px] text-slate-455 mt-0.5">ฝ่าย: {selectedReturn.borrower.department}</p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">วันที่ยืม</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                    {new Date(selectedReturn.borrowDate).toLocaleDateString('th-TH')}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">กำหนดส่งคืน</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                    {new Date(selectedReturn.expectedReturnDate).toLocaleDateString('th-TH')}
                  </p>
                </div>
              </div>

              {/* Return Condition reported */}
              <div className="space-y-2 pt-2 border-t dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">สภาพครุภัณฑ์ที่รายงาน:</span>
                  <span className="text-xs">
                    {selectedReturn.assetReturn && getStatusBadge(selectedReturn.assetReturn.condition)}
                  </span>
                </div>
                
                {/* Notes */}
                {selectedReturn.assetReturn?.conditionNote && (
                  <div className="bg-slate-50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    <p className="font-semibold text-slate-450 text-[10px] mb-1">หมายเหตุ/ข้อมูลชำรุด:</p>
                    {selectedReturn.assetReturn.conditionNote}
                  </div>
                )}

                {/* Evidence Image */}
                {selectedReturn.assetReturn?.imageUrl ? (
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">รูปภาพหลักฐานสภาพเครื่อง:</p>
                    <div className="h-44 w-full border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950 flex items-center justify-center relative">
                      <a href={selectedReturn.assetReturn.imageUrl} target="_blank" rel="noreferrer" className="w-full h-full block">
                        <img
                          src={selectedReturn.assetReturn.imageUrl}
                          alt="Evidence Photo"
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                        />
                      </a>
                    </div>
                    <p className="text-[9px] text-slate-400 text-center mt-1">คลิกที่รูปภาพเพื่อดูภาพขนาดเต็ม</p>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-455 italic bg-slate-50/50 dark:bg-slate-950/20 py-2 px-3 rounded-lg border border-dashed dark:border-slate-800 text-center">
                    ไม่มีรูปถ่ายแนบมาด้วย
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setSelectedReturn(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
              <button
                onClick={async () => {
                  const reqNo = selectedReturn.requestNo;
                  setSelectedReturn(null);
                  await handleRejectReturn(selectedReturn.id, reqNo);
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-md shadow-red-500/10 transition-colors cursor-pointer"
              >
                ปฏิเสธการคืน
              </button>
              <button
                onClick={async () => {
                  const reqNo = selectedReturn.requestNo;
                  setSelectedReturn(null);
                  await handleApproveReturn(selectedReturn.id, reqNo);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 transition-colors cursor-pointer"
              >
                อนุมัติรับคืน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


