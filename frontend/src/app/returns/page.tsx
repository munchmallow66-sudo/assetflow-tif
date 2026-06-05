'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import api from '@/lib/api';
import { History, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

interface AssetReturn {
  id: string;
  returnDate: string;
  condition: 'NORMAL' | 'DAMAGED' | 'LOST' | 'INCOMPLETE';
  conditionNote?: string | null;
  imageUrl?: string | null;
  recordedBy: {
    name: string;
  };
  asset: {
    assetCode: string;
    name: string;
  };
  borrowRequest: {
    requestNo: string;
    borrower: {
      firstName: string;
      lastName: string;
      department: string;
    };
  };
}

export default function ReturnsHistoryPage() {
  const { user } = useAuth();
  const [returns, setReturns] = useState<AssetReturn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        const res = await api.get('/returns');
        setReturns(res.data);
      } catch (err) {
        console.error('Failed to fetch returns history');
      } finally {
        setLoading(false);
      }
    };
    fetchReturns();
  }, []);

  const getConditionBadge = (cond: string) => {
    switch (cond) {
      case 'NORMAL':
        return <span className="px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 rounded font-semibold">ปกติ (Normal)</span>;
      case 'INCOMPLETE':
        return <span className="px-2 py-0.5 text-[10px] bg-amber-50 text-amber-600 border border-amber-200 rounded font-semibold">อุปกรณ์ไม่ครบ (Incomplete)</span>;
      case 'DAMAGED':
        return <span className="px-2 py-0.5 text-[10px] bg-red-50 text-red-600 border border-red-200 rounded font-semibold">ชำรุด (Damaged)</span>;
      case 'LOST':
        return <span className="px-2 py-0.5 text-[10px] bg-red-950/20 text-red-400 border border-red-800 rounded font-semibold font-sans">สูญหาย (Lost)</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-600 border border-slate-200 rounded font-semibold">{cond}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ประวัติการคืนสินทรัพย์</h1>
          <p className="text-slate-500 text-xs mt-1">ประวัติบันทึกการส่งคืนครุภัณฑ์และสภาพอุปกรณ์หลังการใช้งาน</p>
        </div>
        {user?.role === 'ADMIN' && (
          <Link
            href="/returns/new"
            className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md shadow-sky-500/10 cursor-pointer"
          >
            <History size={16} />
            <span>รับคืนสินทรัพย์</span>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : returns.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 shadow-sm">
          <History size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm">ไม่มีประวัติการส่งคืนสินทรัพย์ในระบบ</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">วันที่คืน</th>
                  <th className="px-6 py-4">สินทรัพย์ / รหัส</th>
                  <th className="px-6 py-4">ผู้คืน / ฝ่าย</th>
                  <th className="px-6 py-4">รหัสการยืม</th>
                  <th className="px-6 py-4">สภาพการส่งคืน</th>
                  <th className="px-6 py-4">หมายเหตุ/รูปถ่าย</th>
                  <th className="px-6 py-4">ผู้รับคืน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {returns.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(item.returnDate).toLocaleDateString('th-TH')}
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(item.returnDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{item.asset.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{item.asset.assetCode}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{item.borrowRequest.borrower.firstName}</p>
                      <p className="text-[10px] text-slate-400">{item.borrowRequest.borrower.department}</p>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500 font-semibold">{item.borrowRequest.requestNo}</td>
                    <td className="px-6 py-4">{getConditionBadge(item.condition)}</td>
                    <td className="px-6 py-4 text-slate-600 max-w-[200px]">
                      <div className="space-y-1">
                        {item.conditionNote && <p className="truncate" title={item.conditionNote}>{item.conditionNote}</p>}
                        {item.imageUrl && (
                          <a
                            href={item.imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-sky-500 hover:underline font-semibold"
                          >
                            <ImageIcon size={10} />
                            <span>ดูรูปภาพหลักฐาน</span>
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{item.recordedBy.name}</td>
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
