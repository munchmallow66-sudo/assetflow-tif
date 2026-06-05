'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { ArrowLeft, History, FileText, Upload, CheckCircle, QrCode } from 'lucide-react';
import Link from 'next/link';
import QRScannerModal from '@/components/common/QRScannerModal';

const returnSchema = z.object({
  borrowRequestId: z.string().nonempty('กรุณาเลือกรายการยืมที่ต้องการส่งคืน'),
  condition: z.string().nonempty('กรุณาระบุสภาพสินทรัพย์ตอนส่งคืน'),
  conditionNote: z.string().optional(),
});

type ReturnForm = z.infer<typeof returnSchema>;

interface BorrowedItem {
  id: string;
  requestNo: string;
  borrower: {
    firstName: string;
    lastName: string;
  };
  asset: {
    assetCode: string;
    name: string;
  };
}

export default function RecordReturnPage() {
  const router = useRouter();
  const [borrowedItems, setBorrowedItems] = useState<BorrowedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleQRScan = (scannedText: string) => {
    const matched = borrowedItems.find((item) => item.asset.assetCode === scannedText);
    if (matched) {
      setValue('borrowRequestId', matched.id);
      alert(`ค้นพบรายการยืม: ${matched.borrower.firstName} - ยืม ${matched.asset.name}`);
    } else {
      alert(`ไม่พบรายการยืมสำหรับสินทรัพย์รหัส QR: "${scannedText}" ที่กำลังค้างยืมในระบบขณะนี้`);
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ReturnForm>({
    resolver: zodResolver(returnSchema),
  });

  useEffect(() => {
    const fetchBorrowedItems = async () => {
      try {
        const res = await api.get('/borrow-requests');
        // Filter requests that are BORROWED or OVERDUE
        const active = res.data.filter(
          (r: any) => r.status === 'BORROWED' || r.status === 'OVERDUE'
        );
        setBorrowedItems(active);
        
        // Auto-select request if requestId query param is present
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const reqId = params.get('requestId');
          if (reqId) {
            setValue('borrowRequestId', reqId);
          }
        }
      } catch (err) {
        setErrorMsg('ไม่สามารถดึงข้อมูลรายการยืมสินทรัพย์ได้');
      } finally {
        setLoading(false);
      }
    };
    fetchBorrowedItems();
  }, [setValue]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/uploads/cloudinary', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUrl(res.data.url);
      setCloudinaryPublicId(res.data.publicId);
    } catch (err: any) {
      setErrorMsg('อัปโหลดรูปภาพล้มเหลว กรุณาลองใหม่อีกครั้ง');
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = async (data: ReturnForm) => {
    setSubmitting(true);
    setErrorMsg(null);

    const payload = {
      ...data,
      imageUrl: imageUrl || undefined,
      cloudinaryPublicId: cloudinaryPublicId || undefined,
    };

    try {
      await api.post('/returns', payload);
      router.push('/returns');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'การบันทึกการส่งคืนล้มเหลว');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Link
          href="/returns"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-xs font-semibold"
        >
          <ArrowLeft size={16} />
          <span>ย้อนกลับไปหน้าประวัติการคืน</span>
        </Link>
      </div>

      <div className="bg-white p-8 border border-slate-100 rounded-2xl shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">บันทึกรับคืนสินทรัพย์</h1>
          <p className="text-slate-500 text-xs mt-1">บันทึกสภาพและหลักฐานการคืนสินค้ากลับสู่ระบบ</p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-slate-700 text-xs font-bold mb-2">เลือกรายการยืมเพื่อรับคืน *</label>
            {loading ? (
              <div className="h-10 w-full bg-slate-50 border rounded-lg animate-pulse flex items-center justify-center text-[10px] text-slate-400">
                กำลังดึงรายการสินทรัพย์ที่ถูกยืม...
              </div>
            ) : borrowedItems.length === 0 ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium">
                ขณะนี้ไม่มีสินทรัพย์ค้างยืมในระบบ
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <select
                    {...register('borrowRequestId')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-sky-500 focus:bg-white"
                  >
                    <option value="">-- กรุณาเลือกรายการ --</option>
                    {borrowedItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        [{item.requestNo}] {item.borrower.firstName} - ยืม {item.asset.name} ({item.asset.assetCode})
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
            {errors.borrowRequestId && (
              <p className="text-red-500 text-[10px] mt-1.5 font-medium">{errors.borrowRequestId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-slate-700 text-xs font-bold mb-2">สภาพสินทรัพย์ ณ วันส่งคืน *</label>
            <select
              {...register('condition')}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-sky-500 focus:bg-white"
            >
              <option value="">-- เลือกสภาพสินทรัพย์ --</option>
              <option value="NORMAL">ปกติ (NORMAL)</option>
              <option value="INCOMPLETE">อุปกรณ์ไม่ครบ (INCOMPLETE)</option>
              <option value="DAMAGED">ชำรุดเสียหาย (DAMAGED)</option>
              <option value="LOST">สูญหาย (LOST)</option>
            </select>
            {errors.condition && (
              <p className="text-red-500 text-[10px] mt-1.5 font-medium">{errors.condition.message}</p>
            )}
          </div>

          <div>
            <label className="block text-slate-700 text-xs font-bold mb-2">ภาพถ่ายยืนยันการคืน (เลือกกรอก)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 border-dashed rounded-xl relative hover:border-sky-400 transition-colors">
              <div className="space-y-2 text-center">
                {imageUrl ? (
                  <div className="flex flex-col items-center">
                    <img src={imageUrl} alt="Uploaded return preview" className="h-32 object-cover rounded-lg border mb-2" />
                    <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle size={12} /> อัปโหลดหลักฐานสำเร็จ
                    </p>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-10 w-10 text-slate-400" />
                    <div className="flex text-xs text-slate-500">
                      <label className="relative cursor-pointer bg-white rounded-md font-semibold text-sky-500 hover:text-sky-600 focus-within:outline-none">
                        <span>อัปโหลดภาพถ่ายหลักฐาน</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">หรือลากไฟล์มาที่นี่</p>
                    </div>
                    <p className="text-[10px] text-slate-400">PNG, JPG, GIF ขนาดไม่เกิน 5MB</p>
                  </>
                )}
                {uploadingImage && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
                    <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 text-xs font-bold mb-2">หมายเหตุการคืนสินทรัพย์</label>
            <div className="relative">
              <div className="absolute top-3 left-3 text-slate-400">
                <FileText size={16} />
              </div>
              <textarea
                {...register('conditionNote')}
                rows={3}
                placeholder="ระบุตำหนิเพิ่มเติม อุปกรณ์ส่วนย่อยที่ชำรุดเสียหาย หรือชี้แจงการชำรุด (ถ้ามี)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Link
              href="/returns"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              disabled={submitting || uploadingImage || borrowedItems.length === 0}
              className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-xs transition-colors shadow-md shadow-sky-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? 'กำลังบันทึก...' : 'บันทึกการส่งคืน'}
            </button>
          </div>
        </form>
      </div>

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleQRScan}
        title="สแกน QR Code เพื่อรับคืนสินทรัพย์"
      />
    </div>
  );
}
