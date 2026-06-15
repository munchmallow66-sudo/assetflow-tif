'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import api from '@/lib/api';
import {
  Box,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  PlusCircle,
  Undo2,
  ListFilter,
  BarChart2,
  Activity,
  History,
  TrendingUp,
  User,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Skeleton, StatsCardSkeleton, ChartSkeleton } from '@/components/common/Skeleton';

interface DashboardStats {
  totalAssets: number;
  availableAssets: number;
  borrowedAssets: number;
  maintenanceAssets: number;
  lostAssets: number;
  pendingRequests: number;
  overdueRequests: number;
}

interface RecentBorrowRequest {
  id: string;
  requestNo: string;
  borrowDate: string;
  expectedReturnDate: string;
  purpose: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BORROWED' | 'RETURN_PENDING' | 'RETURNED' | 'OVERDUE' | 'CANCELLED';
  createdAt: string;
  asset: {
    name: string;
    assetCode: string;
  };
  borrower: {
    firstName: string;
    lastName: string;
    department: string;
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRequests, setRecentRequests] = useState<RecentBorrowRequest[]>([]);
  const [activeBorrows, setActiveBorrows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, requestsRes, allRequestsRes] = await Promise.all([
          api.get('/reports/dashboard'),
          api.get('/borrow-requests?limit=5'),
          api.get('/borrow-requests')
        ]);
        setStats(statsRes.data);
        setRecentRequests(requestsRes.data);

        // Filter user's active borrows (BORROWED or OVERDUE)
        const myActive = allRequestsRes.data.filter((r: any) => 
          (r.status === 'BORROWED' || r.status === 'OVERDUE') && 
          (user?.employeeId ? r.borrowerId === user.employeeId : false)
        );
        setActiveBorrows(myActive);
      } catch (err: any) {
        setError('ไม่สามารถดึงข้อมูลสถิติแดชบอร์ดได้');
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Welcome Header Skeleton */}
        <div className="h-36 bg-slate-200 dark:bg-slate-800 rounded-3xl w-full animate-pulse"></div>
        
        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>
        
        {/* Grid Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ChartSkeleton />
          </div>
          <div>
            <div className="h-[320px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl flex flex-col gap-4">
              <Skeleton className="h-5 w-40" />
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl">
        {error || 'เกิดข้อผิดพลาดในการโหลดข้อมูล'}
      </div>
    );
  }

  // Chart data formatting
  const donutData = [
    { name: 'พร้อมใช้งาน', value: stats.availableAssets, color: '#10B981' },
    { name: 'ถูกยืมอยู่', value: stats.borrowedAssets, color: '#3B82F6' },
    { name: 'ซ่อมบำรุง', value: stats.maintenanceAssets, color: '#F59E0B' },
    { name: 'สูญหาย', value: stats.lostAssets, color: '#EF4444' },
  ].filter(item => item.value > 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'RETURN_PENDING':
        return <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100"><Clock size={14} /></div>;
      case 'BORROWED':
      case 'APPROVED':
        return <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100"><Box size={14} /></div>;
      case 'RETURNED':
        return <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100"><Undo2 size={14} /></div>;
      case 'REJECTED':
      case 'CANCELLED':
        return <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100"><AlertTriangle size={14} /></div>;
      case 'OVERDUE':
        return <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center border border-red-100 animate-pulse"><AlertTriangle size={14} /></div>;
      default:
        return <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center"><Activity size={14} /></div>;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'รออนุมัติ';
      case 'RETURN_PENDING': return 'รออนุมัติคืน';
      case 'APPROVED': return 'อนุมัติแล้ว';
      case 'BORROWED': return 'กำลังยืม';
      case 'RETURNED': return 'คืนแล้ว';
      case 'REJECTED': return 'ปฏิเสธแล้ว';
      case 'OVERDUE': return 'เลยกำหนดคืน';
      case 'CANCELLED': return 'ยกเลิกแล้ว';
      default: return status;
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-sky-500 to-indigo-600 p-6 md:p-8 rounded-3xl text-white shadow-xl shadow-sky-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-[url('/aviation_pattern.svg')] bg-cover opacity-10 pointer-events-none"></div>
        <div className="space-y-2 z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">ยินดีต้อนรับ, {user?.name}</h1>
          <p className="text-sky-100 text-xs md:text-sm max-w-xl font-medium leading-relaxed">
            ระบบบริหารจัดการยืมและคืนครุภัณฑ์/อุปกรณ์การบิน บริษัท Thai Inter Flying จำกัด ตรวจสอบสถานะสินทรัพย์และทำรายการขอยืมได้สะดวกรวดเร็ว
          </p>
        </div>
        <div className="shrink-0 flex gap-3 z-10">
          {(user?.role === 'STAFF' || user?.role === 'ADMIN' || user?.role === 'APPROVER') && (
            <Link
              href="/borrow/new"
              className="bg-white text-sky-600 hover:bg-sky-50 px-5 py-3 rounded-2xl font-bold text-xs shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <PlusCircle size={16} />
              <span>ยื่นขอยืมของ</span>
            </Link>
          )}
        </div>
      </div>

      {/* Active Borrows Shortcut (Staff/User convenience widget) */}
      {activeBorrows.length > 0 && (
        <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-900/50 p-6 rounded-3xl space-y-4 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Clock className="animate-pulse" size={18} />
            <h3 className="text-xs font-bold uppercase tracking-wider">สินทรัพย์ที่คุณกำลังยืมใช้งานอยู่ ({activeBorrows.length})</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeBorrows.map((item) => {
              const isOverdue = item.status === 'OVERDUE';
              return (
                <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
                  <div className="overflow-hidden">
                    <p className="font-bold text-xs text-slate-800 dark:text-white truncate">{item.asset.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">รหัส: {item.asset.assetCode}</p>
                    <p className="text-[10px] text-slate-455 mt-1 flex items-center gap-1">
                      <span>กำหนดคืน: {new Date(item.expectedReturnDate).toLocaleDateString('th-TH')}</span>
                      {isOverdue && <span className="px-1.5 py-0.2 bg-red-50 text-red-500 rounded border border-red-200 text-[8px] font-bold">เลยกำหนดคืน!</span>}
                    </p>
                  </div>
                  <Link
                    href={`/returns/new?requestId=${item.id}`}
                    className="shrink-0 flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl font-bold text-[10px] shadow-sm shadow-emerald-500/15 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 text-sans"
                  >
                    <Undo2 size={12} />
                    <span>คืนครุภัณฑ์</span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-5 card-hover">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center shrink-0">
              <Box size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">สินทรัพย์ทั้งหมด</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalAssets} ชิ้น</p>
            </div>
          </div>
          <svg className="w-16 h-8 text-sky-500 opacity-60 ml-auto shrink-0" viewBox="0 0 100 30" fill="none">
            <path d="M0,25 Q15,10 30,18 T60,8 T90,20 T100,5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Card 2: Available */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-5 card-hover">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">พร้อมใช้งาน</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.availableAssets} ชิ้น</p>
            </div>
          </div>
          <svg className="w-16 h-8 text-emerald-500 opacity-60 ml-auto shrink-0" viewBox="0 0 100 30" fill="none">
            <path d="M0,20 Q20,25 40,10 T80,15 T100,2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Card 3: Overdue */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-5 card-hover">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-sans">ค้างส่งคืน / Overdue</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{stats.overdueRequests} รายการ</p>
            </div>
          </div>
          <svg className="w-16 h-8 text-amber-500 opacity-60 ml-auto shrink-0" viewBox="0 0 100 30" fill="none">
            <path d="M0,5 Q25,25 50,15 T75,28 T100,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Card 4: Damaged */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-5 card-hover">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ชำรุดเสียหาย</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.maintenanceAssets} ชิ้น</p>
            </div>
          </div>
          <svg className="w-16 h-8 text-red-500 opacity-60 ml-auto shrink-0" viewBox="0 0 100 30" fill="none">
            <path d="M0,28 Q15,15 30,22 T60,5 T90,18 T100,12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Donut Chart Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="text-sky-500" size={20} />
              <h3 className="text-base font-bold text-slate-800">สัดส่วนสถานะสินทรัพย์</h3>
            </div>
            <span className="text-[10px] bg-slate-50 border border-slate-150 px-2 py-1 rounded-lg text-slate-500 font-medium">รวม {stats.totalAssets} ชิ้น</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
            <div className="h-48 w-48 relative shrink-0">
              {donutData.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">ไม่มีข้อมูลแสดงผล</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(15, 23, 42, 0.9)',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#fff',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {/* Text in center of Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-extrabold text-slate-800">{stats.availableAssets}</span>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">พร้อมใช้งาน</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="space-y-3 w-full max-w-[240px]">
              {[
                { name: 'พร้อมใช้งาน', count: stats.availableAssets, color: '#10B981', pct: stats.totalAssets ? Math.round((stats.availableAssets / stats.totalAssets) * 100) : 0 },
                { name: 'ถูกยืมใช้งาน', count: stats.borrowedAssets, color: '#3B82F6', pct: stats.totalAssets ? Math.round((stats.borrowedAssets / stats.totalAssets) * 100) : 0 },
                { name: 'ส่งซ่อม/บำรุง', count: stats.maintenanceAssets, color: '#F59E0B', pct: stats.totalAssets ? Math.round((stats.maintenanceAssets / stats.totalAssets) * 100) : 0 },
                { name: 'สูญหาย', count: stats.lostAssets, color: '#EF4444', pct: stats.totalAssets ? Math.round((stats.lostAssets / stats.totalAssets) * 100) : 0 }
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-500 font-medium">{item.name}</span>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="font-bold text-slate-800">{item.count} ชิ้น</span>
                    <span className="text-[10px] text-slate-400 w-8 font-semibold">{item.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions Component */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-6">
            <Activity className="text-sky-500" size={20} />
            <h3 className="text-base font-bold text-slate-800">ทางลัดและการดำเนินการ</h3>
          </div>

          <div className="flex-1 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              {/* ADMIN actions */}
              {user?.role === 'ADMIN' && (
                <>
                  <Link
                    href="/borrow/new"
                    className="flex items-center justify-center gap-3 px-4 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-xs transition-all duration-200 shadow-md shadow-sky-500/10"
                  >
                    <PlusCircle size={16} />
                    <span>สร้างคำขอยืมสินทรัพย์</span>
                  </Link>
                  <Link
                    href="/returns/new"
                    className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-sky-50 hover:border-sky-200 text-slate-700 hover:text-sky-700 font-medium text-xs transition-all duration-200"
                  >
                    <Undo2 size={16} className="text-sky-500" />
                    <span>บันทึกรับคืนสินทรัพย์</span>
                  </Link>
                  <Link
                    href="/assets/new"
                    className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-sky-50 hover:border-sky-200 text-slate-700 hover:text-sky-700 font-medium text-xs transition-all duration-200"
                  >
                    <PlusCircle size={16} className="text-sky-500" />
                    <span>เพิ่มครุภัณฑ์ใหม่</span>
                  </Link>
                  <Link
                    href="/reports"
                    className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-sky-50 hover:border-sky-200 text-slate-700 hover:text-sky-700 font-medium text-xs transition-all duration-200"
                  >
                    <Clock size={16} className="text-sky-500" />
                    <span>ดูสินทรัพย์ค้างคืน ({stats.overdueRequests})</span>
                  </Link>
                </>
              )}

              {/* STAFF actions */}
              {user?.role === 'STAFF' && (
                <>
                  <Link
                    href="/borrow/new"
                    className="flex items-center justify-center gap-3 px-4 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-xs transition-all duration-200 shadow-md shadow-sky-500/10"
                  >
                    <PlusCircle size={16} />
                    <span>สร้างคำขอยืมสินทรัพย์</span>
                  </Link>
                  <Link
                    href="/assets"
                    className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 text-slate-700 font-medium text-xs transition-all duration-200"
                  >
                    <Box size={16} className="text-sky-500" />
                    <span>ตรวจสอบสินทรัพย์ที่ว่าง</span>
                  </Link>
                </>
              )}

              {/* APPROVER actions */}
              {user?.role === 'APPROVER' && (
                <>
                  <Link
                    href="/borrow/new"
                    className="flex items-center justify-center gap-3 px-4 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-xs transition-all duration-200 shadow-md shadow-sky-500/10"
                  >
                    <PlusCircle size={16} />
                    <span>สร้างคำขอยืมสินทรัพย์</span>
                  </Link>
                  <Link
                    href="/borrow"
                    className="flex items-center gap-3 px-4 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-xs transition-all duration-200 shadow-md shadow-sky-500/10 justify-center"
                  >
                    <ListFilter size={16} />
                    <span>อนุมัติคำขอยืม ({stats.pendingRequests} รายการ)</span>
                  </Link>
                  <Link
                    href="/reports"
                    className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 text-slate-700 font-medium text-xs transition-all duration-200"
                  >
                    <FileText size={16} className="text-sky-500" />
                    <span>เรียกดูรายงานทั้งหมด</span>
                  </Link>
                </>
              )}

              {/* VIEWER actions */}
              {user?.role === 'VIEWER' && (
                <Link
                  href="/reports"
                  className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 text-slate-700 font-medium text-xs transition-all duration-200"
                >
                  <FileText size={16} className="text-sky-500" />
                  <span>เรียกดูรายงานข้อมูลระบบ</span>
                </Link>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mt-auto">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-sky-500" size={16} />
                <span className="text-xs font-semibold text-slate-600">สถานะคำขอยืมค้างอนุมัติ</span>
              </div>
              <p className="text-slate-500 text-[10px] leading-relaxed">
                ขณะนี้มีคำขอยืมครุภัณฑ์ค้างรอดำเนินการอยู่{' '}
                <span className="font-bold text-sky-600 text-xs">{stats.pendingRequests}</span> รายการ
                {user?.role === 'APPROVER' || user?.role === 'ADMIN' ? ' กรุณาตรวจสอบเพื่อความถูกต้องและดำเนินการอนุมัติ' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline Feed */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div className="flex items-center gap-2">
              <History className="text-sky-500" size={20} />
              <h3 className="text-base font-bold text-slate-800">ไทม์ไลน์ประวัติการยืม-คืนล่าสุด</h3>
            </div>
            <Link 
              href="/borrow"
              className="text-xs text-sky-500 hover:text-sky-600 font-bold flex items-center gap-1 hover:underline"
            >
              <span>ดูทั้งหมด</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {recentRequests.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              ยังไม่มีกิจกรรมความเคลื่อนไหวในขณะนี้
            </div>
          ) : (
            <div className="relative border-l border-slate-100 pl-6 ml-3 space-y-6">
              {recentRequests.map((req) => (
                <div key={req.id} className="relative flex items-start justify-between gap-4">
                  {/* Timeline dot */}
                  <div className="absolute -left-[38px] top-0.5 z-10">
                    {getStatusIcon(req.status)}
                  </div>

                  {/* Log description */}
                  <div className="space-y-1">
                    <p className="text-xs text-slate-700">
                      <span className="font-bold text-slate-800">{req.borrower.firstName} {req.borrower.lastName}</span>
                      <span className="text-slate-400 mx-1">({req.borrower.department})</span>
                      ทำการยื่นขอยืม
                      <span className="font-bold text-sky-600 mx-1">[{req.asset.assetCode}] {req.asset.name}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 font-medium">
                      <span>เลขที่คำขอ: {req.requestNo}</span>
                      <span>•</span>
                      <span>กำหนดส่งคืน: {new Date(req.expectedReturnDate).toLocaleDateString('th-TH')}</span>
                      <span>•</span>
                      <span>วัตถุประสงค์: &quot;{req.purpose}&quot;</span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="shrink-0 text-right">
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wider
                      ${req.status === 'PENDING' || req.status === 'RETURN_PENDING' ? 'badge-pending' : ''}
                      ${req.status === 'BORROWED' ? 'badge-borrowed' : ''}
                      ${req.status === 'RETURNED' ? 'badge-returned' : ''}
                      ${req.status === 'REJECTED' ? 'badge-rejected' : ''}
                      ${req.status === 'OVERDUE' ? 'badge-overdue' : ''}
                      ${req.status === 'CANCELLED' ? 'badge-retired' : ''}
                    `}>
                      {getStatusText(req.status)}
                    </span>
                    <p className="text-[9px] text-slate-400 mt-1.5">{new Date(req.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Small Widget: User profile info & system state */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-6">
            <User className="text-sky-500" size={20} />
            <h3 className="text-base font-bold text-slate-800">ข้อมูลบัญชีผู้ใช้ปัจจุบัน</h3>
          </div>

          <div className="space-y-4 flex-grow">
            <div className="flex items-center gap-4 p-3 bg-slate-50/55 border border-slate-100 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 text-white flex items-center justify-center font-extrabold text-lg shadow-md shadow-sky-500/10">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">{user?.name}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 border border-slate-100 rounded-xl space-y-0.5">
                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">สิทธิ์เข้าถึง</span>
                <p className="font-bold text-sky-600">{user?.role}</p>
              </div>
              <div className="p-3 border border-slate-100 rounded-xl space-y-0.5">
                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">แผนก/ฝ่าย</span>
                <p className="font-bold text-slate-700 truncate">{user?.employee?.department || 'สถาบันการบิน'}</p>
              </div>
            </div>

            <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/20">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide mb-1">มาตรฐานการบิน</p>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                การยืมครุภัณฑ์ทุกชิ้นจะต้องผ่านการอนุมัติความเหมาะสม และส่งคืนในสภาพปกติเพื่อไม่ให้กระทบต่อภารกิจฝึกบินและการเรียนการสอนของสถาบันฯ
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-6 text-center">
            <span className="text-[9px] text-slate-300 font-mono">TIF AssetFlow v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
