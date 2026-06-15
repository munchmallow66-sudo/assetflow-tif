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
}

export default function BorrowPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

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
                          <>
                            <button
                              onClick={() => handleApproveReturn(item.id, item.requestNo)}
                              className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
                              title="อนุมัติการคืนของ"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleRejectReturn(item.id, item.requestNo)}
                              className="p-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                              title="ปฏิเสธการคืนของ"
                            >
                              <X size={14} />
                            </button>
                          </>
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
    </div>
  );
}


