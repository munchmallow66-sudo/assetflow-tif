'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { ArrowLeft, Box, Calendar, FileText, QrCode } from 'lucide-react';
import Link from 'next/link';
import QRScannerModal from '@/components/common/QRScannerModal';

const borrowSchema = z.object({
  assetId: z.string().nonempty('กรุณาเลือกสินทรัพย์ที่ต้องการยืม'),
  borrowDate: z.string().nonempty('กรุณาระบุวันที่ขอยืม'),
  expectedReturnDate: z.string().nonempty('กรุณาระบุวันที่คาดว่าจะส่งคืน'),
  purpose: z.string().nonempty('กรุณาระบุวัตถุประสงค์ในการยืม'),
}).refine((data) => {
  const start = new Date(data.borrowDate);
  const end = new Date(data.expectedReturnDate);
  return end >= start;
}, {
  message: 'วันที่ส่งคืนคาดการณ์ ต้องอยู่หลังจากวันที่เริ่มต้นยืม',
  path: ['expectedReturnDate'],
});

type BorrowForm = z.infer<typeof borrowSchema>;

interface AvailableAsset {
  id: string;
  assetCode: string;
  name: string;
  category: string;
}

export default function NewBorrowPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<AvailableAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Set default dates
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<BorrowForm>({
    resolver: zodResolver(borrowSchema),
    defaultValues: {
      borrowDate: today,
      expectedReturnDate: tomorrow,
    },
  });

  const handleQRScan = (scannedText: string) => {
    const matched = assets.find((a) => a.assetCode === scannedText);
    if (matched) {
      setValue('assetId', matched.id);
      alert(`ค้นพบและเลือกสินทรัพย์: ${matched.name}`);
    } else {
      alert(`ไม่พบสินทรัพย์ที่มีรหัส QR: "${scannedText}" ในระบบ หรือสินทรัพย์นี้ไม่พร้อมใช้งาน`);
    }
  };

  useEffect(() => {
    const fetchAvailableAssets = async () => {
      try {
        const res = await api.get('/assets');
        // Filter assets that are AVAILABLE
        const available = res.data.filter((a: any) => a.status === 'AVAILABLE');
        setAssets(available);
      } catch (err) {
        setErrorMsg('ไม่สามารถดึงข้อมูลสินทรัพย์ได้');
      } finally {
        setLoading(false);
      }
    };
    fetchAvailableAssets();
  }, []);

  const onSubmit = async (data: BorrowForm) => {
    setSubmitting(true);
    setErrorMsg(null);

    try {
      await api.post('/borrow-requests', data);
      router.push('/borrow');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'การยื่นคำขอยืมล้มเหลว');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Link
          href="/borrow"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-xs font-semibold"
        >
          <ArrowLeft size={16} />
          <span>ย้อนกลับไปหน้ารายการยืม</span>
        </Link>
      </div>

      <div className="bg-white p-8 border border-slate-100 rounded-2xl shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ยื่นคำขอยืมสินทรัพย์</h1>
          <p className="text-slate-500 text-xs mt-1">ส่งคำขอสำหรับการยืมสินทรัพย์และอุปกรณ์ที่พร้อมใช้งาน</p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-slate-700 text-xs font-bold mb-2">เลือกสินทรัพย์ที่ต้องการยืม *</label>
            {loading ? (
              <div className="h-10 w-full bg-slate-50 border rounded-lg animate-pulse flex items-center justify-center text-[10px] text-slate-400">
                กำลังดึงรายการสินทรัพย์ที่ว่าง...
              </div>
            ) : assets.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-medium">
                ขออภัย ขณะนี้ไม่มีสินทรัพย์ว่างสำหรับการยืมในระบบ
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <select
                    {...register('assetId')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-sky-500 focus:bg-white"
                  >
                    <option value="">-- กรุณาเลือกสินทรัพย์ --</option>
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        [{asset.assetCode}] {asset.name} ({asset.category})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-slate-350 text-slate-700 rounded-xl flex items-center gap-1.5 transition-all duration-200 cursor-pointer text-xs font-bold font-sans"
                >
                  <QrCode size={14} className="text-sky-500" />
                  <span>สแกน QR</span>
                </button>
              </div>
            )}
            {errors.assetId && (
              <p className="text-red-500 text-[10px] mt-1.5 font-medium">{errors.assetId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-2">วันที่ต้องการขอยืม *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar size={16} />
                </div>
                <input
                  type="date"
                  min={today}
                  {...register('borrowDate')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>
              {errors.borrowDate && (
                <p className="text-red-500 text-[10px] mt-1.5 font-medium">{errors.borrowDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-slate-700 text-xs font-bold mb-2">วันที่คาดว่าจะส่งคืน *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar size={16} />
                </div>
                <input
                  type="date"
                  min={today}
                  {...register('expectedReturnDate')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>
              {errors.expectedReturnDate && (
                <p className="text-red-500 text-[10px] mt-1.5 font-medium">{errors.expectedReturnDate.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 text-xs font-bold mb-2">วัตถุประสงค์การนำไปใช้งาน *</label>
            <div className="relative">
              <div className="absolute top-3 left-3 text-slate-400">
                <FileText size={16} />
              </div>
              <textarea
                {...register('purpose')}
                rows={4}
                placeholder="อธิบาย เช่น ใช้ฝึกบินหลักสูตร PPL เครื่อง Cessna 172 หรือใช้สำหรับปฏิบัติหน้าที่บินไฟลท์..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>
            {errors.purpose && (
              <p className="text-red-500 text-[10px] mt-1.5 font-medium">{errors.purpose.message}</p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Link
               href="/borrow"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              disabled={submitting || assets.length === 0}
              className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-xs transition-colors shadow-md shadow-sky-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? 'กำลังส่งคำขอ...' : 'ส่งคำขอยืม'}
            </button>
          </div>
        </form>
      </div>

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleQRScan}
      />
    </div>
  );
}
