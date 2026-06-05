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
  UserCheck,
  PlusCircle,
  Undo2,
  ListFilter,
  BarChart,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { BarChart as ReChartsBar, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardStats {
  totalAssets: number;
  availableAssets: number;
  borrowedAssets: number;
  maintenanceAssets: number;
  lostAssets: number;
  pendingRequests: number;
  overdueRequests: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/reports/dashboard');
        setStats(res.data);
      } catch (err: any) {
        setError('ไม่สามารถดึงข้อมูลสถิติแดชบอร์ดได้');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
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
  const chartData = [
    { name: 'พร้อมใช้งาน', count: stats.availableAssets, color: '#10B981' },
    { name: 'ถูกยืมอยู่', count: stats.borrowedAssets, color: '#3B82F6' },
    { name: 'ซ่อมบำรุง', count: stats.maintenanceAssets, color: '#F59E0B' },
    { name: 'สูญหาย', count: stats.lostAssets, color: '#EF4444' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">ยินดีต้อนรับ, {user?.name}</h1>
        <p className="text-slate-500 mt-2 text-sm">ระบบบริการยืมและคืนครุภัณฑ์/อุปกรณ์ บริษัท Thai Inter Flying จำกัด</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 card-hover">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center shrink-0">
            <Box size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">สินทรัพย์ทั้งหมด</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalAssets} ชิ้น</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 card-hover">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">พร้อมใช้งาน</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.availableAssets} ชิ้น</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 card-hover">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-sans">ค้างส่งคืน / Overdue</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.overdueRequests} รายการ</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 card-hover">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ชำรุดเสียหาย</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.maintenanceAssets} ชิ้น</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-4">
            <BarChart className="text-sky-500" size={20} />
            <h3 className="text-base font-bold text-slate-800">สัดส่วนสถานะสินทรัพย์</h3>
          </div>
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ReChartsBar data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={50}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </ReChartsBar>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions & Pending list info */}
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
                    href="/returns/new"
                    className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-sky-50 hover:border-sky-200 text-slate-700 hover:text-sky-700 font-medium text-xs transition-all duration-200"
                  >
                    <Undo2 size={16} />
                    <span>บันทึกรับคืนสินทรัพย์</span>
                  </Link>
                  <Link
                    href="/assets/new"
                    className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-sky-50 hover:border-sky-200 text-slate-700 hover:text-sky-700 font-medium text-xs transition-all duration-200"
                  >
                    <PlusCircle size={16} />
                    <span>เพิ่มครุภัณฑ์ใหม่</span>
                  </Link>
                  <Link
                    href="/reports/overdue"
                    className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-sky-50 hover:border-sky-200 text-slate-700 hover:text-sky-700 font-medium text-xs transition-all duration-200"
                  >
                    <Clock size={16} />
                    <span>ดูสินทรัพย์ค้างคืน ({stats.overdueRequests})</span>
                  </Link>
                </>
              )}

              {/* STAFF actions */}
              {user?.role === 'STAFF' && (
                <>
                  <Link
                    href="/borrow/new"
                    className="flex items-center gap-3 px-4 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-medium text-xs transition-all duration-200 shadow-md shadow-sky-500/10"
                  >
                    <PlusCircle size={16} />
                    <span>สร้างคำขอยืมสินทรัพย์</span>
                  </Link>
                  <Link
                    href="/assets"
                    className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 text-slate-700 font-medium text-xs transition-all duration-200"
                  >
                    <Box size={16} />
                    <span>ตรวจสอบสินทรัพย์ที่ว่าง</span>
                  </Link>
                </>
              )}

              {/* APPROVER actions */}
              {user?.role === 'APPROVER' && (
                <>
                  <Link
                    href="/borrow"
                    className="flex items-center gap-3 px-4 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-medium text-xs transition-all duration-200 shadow-md shadow-sky-500/10"
                  >
                    <ListFilter size={16} />
                    <span>อนุมัติคำขอยืม ({stats.pendingRequests} รายการค้าง)</span>
                  </Link>
                  <Link
                    href="/reports"
                    className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 text-slate-700 font-medium text-xs transition-all duration-200"
                  >
                    <FileText size={16} />
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
                  <FileText size={16} />
                  <span>เรียกดูรายงานข้อมูลระบบ</span>
                </Link>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mt-auto">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="text-amber-500" size={16} />
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
    </div>
  );
}
