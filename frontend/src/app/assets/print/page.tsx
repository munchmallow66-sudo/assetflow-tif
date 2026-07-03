'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import api from '@/lib/api';
import { ArrowLeft, Printer, CheckSquare, Square, QrCode } from 'lucide-react';
import Link from 'next/link';

interface Asset {
  id: string;
  assetCode: string;
  name: string;
  category: string;
  qrCode: string;
  status: 'AVAILABLE' | 'BORROWED' | 'MAINTENANCE' | 'LOST' | 'RETIRED';
  currentHolder?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    department: string;
  } | null;
}

export default function PrintQrPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await api.get('/assets');
        setAssets(res.data);
        // Select all by default
        setSelectedIds(res.data.map((a: any) => a.id));
      } catch (err) {
        console.error('Failed to fetch assets');
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  const toggleSelectAll = () => {
    if (selectedIds.length === assets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(assets.map((a) => a.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const selectedAssets = assets.filter((a) => selectedIds.includes(a.id));

  return (
    <div className="space-y-6">
      {/* Header - Hidden on print */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 print:hidden">
        <div>
          <Link
            href="/assets"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-xs font-semibold mb-2"
          >
            <ArrowLeft size={16} />
            <span>ย้อนกลับไปหน้าสินทรัพย์</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">พิมพ์รหัส QR Code อุปกรณ์</h1>
          <p className="text-slate-500 text-xs mt-1">เลือกรายการสินทรัพย์และอุปกรณ์ที่ต้องการพิมพ์รหัส QR Code เพื่อนำไปติดใช้งานจริง</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={toggleSelectAll}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer"
          >
            {selectedIds.length === assets.length ? <CheckSquare size={16} className="text-sky-500" /> : <Square size={16} />}
            <span>เลือกทั้งหมด ({selectedIds.length}/{assets.length})</span>
          </button>
          <button
            onClick={handlePrint}
            disabled={selectedIds.length === 0}
            className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 shadow-md shadow-sky-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Printer size={16} />
            <span>สั่งพิมพ์ QR Code ({selectedIds.length})</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh] print:hidden">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : assets.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-xl p-12 text-center text-slate-400 print:hidden">
          <QrCode size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm">ไม่มีข้อมูลสินทรัพย์ในระบบ</p>
        </div>
      ) : (
        <>
          {/* Asset checklist selector - Hidden on print */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm print:hidden">
            <h3 className="text-xs font-bold text-slate-700 mb-4">คลิกเพื่อเลือก/ยกเลิกรายการสินทรัพย์ที่จะพิมพ์</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2">
              {assets.map((asset) => {
                const isSelected = selectedIds.includes(asset.id);
                return (
                  <div
                    key={asset.id}
                    onClick={() => toggleSelect(asset.id)}
                    className={`p-3 border rounded-xl flex items-center gap-3 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/20'
                        : 'border-slate-150 hover:border-slate-200'
                    }`}
                  >
                    <div className="shrink-0">
                      {isSelected ? (
                        <div className="w-4 h-4 rounded bg-sky-500 flex items-center justify-center text-white">
                          <CheckSquare size={12} />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded border border-slate-300 bg-white"></div>
                      )}
                    </div>
                    <div className="overflow-hidden w-full">
                      <p className="text-xs font-bold text-slate-800 truncate">{asset.name}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono text-sky-600 font-bold">{asset.assetCode}</span>
                        {asset.status === 'BORROWED' && asset.currentHolder ? (
                          <span className="text-[9px] bg-rose-50 text-rose-600 border border-rose-100 rounded px-1 font-semibold truncate max-w-[120px]" title={`ยืมโดย: ${asset.currentHolder.firstName} ${asset.currentHolder.lastName}`}>
                            ผู้ยืม: {asset.currentHolder.firstName}
                          </span>
                        ) : asset.status === 'AVAILABLE' ? (
                          <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 rounded px-1 font-semibold">
                            พร้อมใช้งาน
                          </span>
                        ) : asset.status === 'MAINTENANCE' ? (
                          <span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-100 rounded px-1 font-semibold">
                            ซ่อมบำรุง
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Printable Layout Sheet */}
          <div className="bg-slate-50 border border-slate-150 p-6 rounded-2xl print:bg-white print:p-0 print:border-none">
            <h3 className="text-xs font-bold text-slate-500 mb-4 print:hidden">ตัวอย่างใบพิมพ์สติกเกอร์ (Preview)</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 print:grid-cols-3 print:gap-6 print:p-0 bg-white p-6 rounded-xl border border-slate-200/60 print:border-none print:shadow-none shadow-inner">
              {selectedAssets.length === 0 ? (
                <div className="col-span-full text-center py-10 text-xs text-slate-400">กรุณาเลือกสินทรัพย์อย่างน้อย 1 รายการเพื่อแสดงตัวอย่างการพิมพ์</div>
              ) : (
                selectedAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="border-2 border-slate-800 p-3 rounded-lg flex flex-col items-center justify-between text-center bg-white w-[135px] h-[195px] mx-auto print:break-inside-avoid print:m-2"
                  >
                    {/* Header Logo Label */}
                    <div className="text-[8px] font-bold text-slate-900 tracking-wider border-b border-slate-200 pb-1.5 w-full truncate">
                      THAI INTER FLYING
                    </div>
                    
                    {/* QR Code image using real generation API */}
                    <div className="w-20 h-20 my-2 bg-white flex items-center justify-center">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(asset.qrCode)}`}
                        alt={`QR-${asset.assetCode}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    
                    {/* Footer Labels */}
                    <div className="w-full space-y-0.5 mt-auto">
                      <p className="text-[9px] font-bold font-mono text-slate-800 bg-slate-100 py-0.5 rounded border border-slate-200 truncate">
                        {asset.assetCode}
                      </p>
                      <p className="text-[8px] text-slate-600 font-bold truncate leading-tight">
                        {asset.name}
                      </p>
                      {asset.status === 'BORROWED' && asset.currentHolder ? (
                        <p className="text-[7.5px] text-rose-600 font-extrabold truncate bg-rose-50 border border-rose-200 rounded py-0.5 mt-0.5 px-0.5 leading-none">
                          ผู้ยืม: {asset.currentHolder.firstName}
                        </p>
                      ) : (
                        <p className="text-[7.5px] text-slate-400 font-semibold truncate border border-slate-100 rounded py-0.5 mt-0.5 px-0.5 leading-none bg-slate-50/50">
                          {asset.status === 'AVAILABLE' ? 'พร้อมใช้งาน' : asset.status === 'MAINTENANCE' ? 'ซ่อมบำรุง' : 'ไม่พร้อมใช้'}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Custom style injection for printing behavior */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              /* Hide app sidebar, layout, and print control header */
              aside, 
              .lg\\:hidden,
              .print\\:hidden {
                display: none !important;
              }
              /* Reset Next.js layout padding */
              .lg\\:pl-64 {
                padding-left: 0 !important;
              }
              main {
                padding: 0 !important;
                margin: 0 !important;
              }
              body {
                background: white !important;
                background-color: white !important;
              }
            }
          `}} />
        </>
      )}
    </div>
  );
}
