'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import api from '@/lib/api';
import { Search, Plus, Eye, Edit2, Trash2, Box, QrCode } from 'lucide-react';
import Link from 'next/link';
import PageTransition from '@/components/common/PageTransition';
import { useToast } from '@/components/providers/ToastProvider';

interface Asset {
  id: string;
  assetCode: string;
  name: string;
  category: string;
  serialNumber?: string;
  status: 'AVAILABLE' | 'BORROWED' | 'MAINTENANCE' | 'LOST' | 'RETIRED';
  imageUrl?: string;
  qrCode: string;
  currentHolder?: {
    id: string;
    firstName: string;
    lastName: string;
    department: string;
  } | null;
}

export default function AssetsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchAssets = async () => {
    try {
      const res = await api.get('/assets');
      setAssets(res.data);
    } catch (err) {
      console.error('Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const deleteAsset = async (id: string, name: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบ/จำหน่ายสินทรัพย์: ${name}?`)) return;
    try {
      await api.delete(`/assets/${id}`);
      toast.success('ทำรายการเรียบร้อยแล้ว', `ลบสินทรัพย์ ${name} เรียบร้อยแล้ว`);
      fetchAssets();
    } catch (err: any) {
      toast.error('การลบล้มเหลว', err.response?.data?.message || 'ไม่สามารถลบสินทรัพย์นี้ได้');
    }
  };

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

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(search.toLowerCase()) ||
      asset.assetCode.toLowerCase().includes(search.toLowerCase()) ||
      (asset.serialNumber && asset.serialNumber.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || asset.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || asset.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = ['ALL', ...Array.from(new Set(assets.map((a) => a.category)))];

  return (
    <PageTransition className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ข้อมูลและสถานะสินทรัพย์</h1>
          <p className="text-slate-500 text-xs mt-1">รายการอุปกรณ์ เครื่องมือ และครุภัณฑ์ของ Thai Inter Flying ทั้งหมด</p>
        </div>
        {user?.role === 'ADMIN' && (
          <div className="flex gap-2">
            <Link
              href="/assets/print"
              className="flex items-center justify-center gap-2 bg-slate-150 hover:bg-slate-200 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold text-xs shadow-sm cursor-pointer transition-colors"
            >
              <QrCode size={16} className="text-sky-500" />
              <span>พิมพ์ QR Code</span>
            </Link>
            <Link
              href="/assets/new"
              className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md shadow-sky-500/10 cursor-pointer"
            >
              <Plus size={16} />
              <span>เพิ่มสินทรัพย์ใหม่</span>
            </Link>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute inset-y-0 left-3 my-auto text-slate-400" size={18} />
          <input
            type="text"
            placeholder="ค้นหาด้วยชื่อ, รหัสสินทรัพย์, Serial Number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">ทุกหมวดหมู่</option>
            {categories.filter(c => c !== 'ALL').map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">ทุกสถานะ</option>
            <option value="AVAILABLE">พร้อมใช้งาน</option>
            <option value="BORROWED">ถูกยืมอยู่</option>
            <option value="MAINTENANCE">ซ่อมบำรุง</option>
            <option value="LOST">สูญหาย</option>
            <option value="RETIRED">จำหน่าย/เลิกใช้</option>
          </select>
        </div>
      </div>

      {/* Assets Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-xl p-12 text-center text-slate-400">
          <Box size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm">ไม่พบข้อมูลสินทรัพย์ตามที่ระบุ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAssets.map((asset, index) => (
            <div
              key={asset.id}
              className={`bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden card-hover animate-fade-in-up stagger-${Math.min(index + 1, 12)}`}
            >
              {/* Image Banner */}
              <div className="h-44 bg-slate-100 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                {asset.imageUrl ? (
                  <img
                    src={asset.imageUrl}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Box className="text-slate-300" size={48} />
                )}
                <div className="absolute top-3 right-3">{getStatusBadge(asset.status)}</div>
              </div>

              {/* Contents */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>{asset.category}</span>
                    <span>•</span>
                    <span className="text-sky-600">{asset.assetCode}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{asset.name}</h3>
                  <p className="text-slate-400 text-xs font-medium">
                    S/N: {asset.serialNumber || 'ไม่มีหมายเลขซีเรียล'}
                  </p>
                  
                  {asset.currentHolder && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">ผู้ครอบครองปัจจุบัน:</span>
                      <span className="text-slate-700 font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        {asset.currentHolder.firstName} ({asset.currentHolder.department})
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Action buttons */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <Link
                    href={`/assets/${asset.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 hover:border-sky-500 hover:text-sky-600 text-slate-500 text-xs font-semibold py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <Eye size={14} />
                    <span>ดูรายละเอียด</span>
                  </Link>

                  {asset.status === 'AVAILABLE' && (user?.role === 'STAFF' || user?.role === 'ADMIN' || user?.role === 'APPROVER') && (
                    <Link
                      href={`/borrow/new?assetId=${asset.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold py-2 rounded-lg transition-colors cursor-pointer shadow-sm shadow-sky-500/10"
                    >
                      <Plus size={14} />
                      <span>ยื่นขอยืม</span>
                    </Link>
                  )}

                  {user?.role === 'ADMIN' && (
                    <>
                      <Link
                        href={`/assets/${asset.id}/edit`}
                        className="p-2 border border-slate-200 hover:border-amber-500 hover:text-amber-600 text-slate-500 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 size={14} />
                      </Link>
                      <button
                        onClick={() => deleteAsset(asset.id, asset.name)}
                        className="p-2 border border-slate-200 hover:border-red-500 hover:text-red-600 text-slate-500 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
