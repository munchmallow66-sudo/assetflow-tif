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
import { useLanguage } from '@/components/providers/LanguageProvider';

const returnSchemaStatic = z.object({
  borrowRequestId: z.string(),
  condition: z.string(),
  conditionNote: z.string().optional(),
});

type ReturnForm = z.infer<typeof returnSchemaStatic>;

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
  const { t, language } = useLanguage();
  const [borrowedItems, setBorrowedItems] = useState<BorrowedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const returnSchema = React.useMemo(() => z.object({
    borrowRequestId: z.string().nonempty(language === 'th' ? 'กรุณาเลือกรายการยืมที่ต้องการส่งคืน' : 'Please select a borrow request to return'),
    condition: z.string().nonempty(language === 'th' ? 'กรุณาระบุสภาพสินทรัพย์ตอนส่งคืน' : 'Please specify the asset condition upon return'),
    conditionNote: z.string().optional(),
  }), [language]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ReturnForm>({
    resolver: zodResolver(returnSchema),
  });

  const handleQRScan = (scannedText: string) => {
    const matched = borrowedItems.find((item) => item.asset.assetCode === scannedText);
    if (matched) {
      setValue('borrowRequestId', matched.id);
      alert(
        language === 'th'
          ? `ค้นพบรายการยืม: ${matched.borrower.firstName} - ยืม ${matched.asset.name}`
          : `Borrow request found: ${matched.borrower.firstName} - borrowed ${matched.asset.name}`
      );
    } else {
      alert(
        language === 'th'
          ? `ไม่พบรายการยืมสำหรับสินทรัพย์รหัส QR: "${scannedText}" ที่กำลังค้างยืมในระบบขณะนี้`
          : `No outstanding borrowed asset with QR code: "${scannedText}" found in the system`
      );
    }
  };

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
        setErrorMsg(
          language === 'th'
            ? 'ไม่สามารถดึงข้อมูลรายการยืมสินทรัพย์ได้'
            : 'Unable to retrieve asset borrow records'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchBorrowedItems();
  }, [setValue, language]);

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
      setErrorMsg(
        language === 'th'
          ? 'อัปโหลดรูปภาพล้มเหลว กรุณาลองใหม่อีกครั้ง'
          : 'Image upload failed. Please try again.'
      );
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
      setErrorMsg(
        err.response?.data?.message ||
          (language === 'th' ? 'การบันทึกการส่งคืนล้มเหลว' : 'Failed to record return')
      );
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
          <span>{language === 'th' ? 'ย้อนกลับไปหน้าประวัติการคืน' : 'Back to Return History'}</span>
        </Link>
      </div>

      <div className="bg-white p-8 border border-slate-100 rounded-2xl shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{language === 'th' ? 'บันทึกรับคืนสินทรัพย์' : 'Record Asset Return'}</h1>
          <p className="text-slate-500 text-xs mt-1">{language === 'th' ? 'บันทึกสภาพและหลักฐานการคืนสินค้ากลับสู่ระบบ' : 'Record condition and proof of returning asset to the system'}</p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-slate-700 text-xs font-bold mb-2">{language === 'th' ? 'เลือกรายการยืมเพื่อรับคืน *' : 'Select Borrow Request to Return *'}</label>
            {loading ? (
              <div className="h-10 w-full bg-slate-50 border rounded-lg animate-pulse flex items-center justify-center text-[10px] text-slate-400">
                {language === 'th' ? 'กำลังดึงข้อมูลครุภัณฑ์ที่อยู่ระหว่างการยืม...' : 'Retrieving active borrow records...'}
              </div>
            ) : borrowedItems.length === 0 ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium">
                {language === 'th' ? 'ขณะนี้ไม่มีสินทรัพย์ค้างยืมในระบบ' : 'No outstanding borrowed assets in the system'}
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <select
                    {...register('borrowRequestId')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-sky-500 focus:bg-white"
                  >
                    <option value="">{language === 'th' ? '-- กรุณาเลือกรายการ --' : '-- Please select an item --'}</option>
                    {borrowedItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        [{item.requestNo}] {item.borrower.firstName} - {language === 'th' ? 'ยืม' : 'borrowed'} {item.asset.name} ({item.asset.assetCode})
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
                  <span>{language === 'th' ? 'สแกน QR' : 'Scan QR'}</span>
                </button>
              </div>
            )}
            {errors.borrowRequestId && (
              <p className="text-red-500 text-[10px] mt-1.5 font-medium">{errors.borrowRequestId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-slate-700 text-xs font-bold mb-2">{language === 'th' ? 'สภาพสินทรัพย์ ณ วันส่งคืน *' : 'Asset Condition on Return *'}</label>
            <select
              {...register('condition')}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-sky-500 focus:bg-white"
            >
              <option value="">{language === 'th' ? '-- เลือกสภาพสินทรัพย์ --' : '-- Select Asset Condition --'}</option>
              <option value="NORMAL">{language === 'th' ? 'ปกติ (NORMAL)' : 'Normal (NORMAL)'}</option>
              <option value="INCOMPLETE">{language === 'th' ? 'อุปกรณ์ไม่ครบ (INCOMPLETE)' : 'Incomplete (INCOMPLETE)'}</option>
              <option value="DAMAGED">{language === 'th' ? 'ชำรุดเสียหาย (DAMAGED)' : 'Damaged (DAMAGED)'}</option>
              <option value="LOST">{language === 'th' ? 'สูญหาย (LOST)' : 'Lost (LOST)'}</option>
            </select>
            {errors.condition && (
              <p className="text-red-500 text-[10px] mt-1.5 font-medium">{errors.condition.message}</p>
            )}
          </div>

          <div>
            <label className="block text-slate-700 text-xs font-bold mb-2">{language === 'th' ? 'ภาพถ่ายยืนยันการคืน (เลือกกรอก)' : 'Return Confirmation Photo (Optional)'}</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 border-dashed rounded-xl relative hover:border-sky-400 transition-colors">
              <div className="space-y-2 text-center">
                {imageUrl ? (
                  <div className="flex flex-col items-center">
                    <img src={imageUrl} alt="Uploaded return preview" className="h-32 object-cover rounded-lg border mb-2" />
                    <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle size={12} /> {language === 'th' ? 'อัปโหลดหลักฐานสำเร็จ' : 'Evidence uploaded successfully'}
                    </p>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-10 w-10 text-slate-400" />
                    <div className="flex text-xs text-slate-500">
                      <label className="relative cursor-pointer bg-white rounded-md font-semibold text-sky-500 hover:text-sky-600 focus-within:outline-none">
                        <span>{language === 'th' ? 'อัปโหลดภาพถ่ายหลักฐาน' : 'Upload photo proof'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">{language === 'th' ? 'หรือลากไฟล์มาที่นี่' : 'or drag file here'}</p>
                    </div>
                    <p className="text-[10px] text-slate-400">{language === 'th' ? 'PNG, JPG, GIF ขนาดไม่เกิน 5MB' : 'PNG, JPG, GIF up to 5MB'}</p>
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
            <label className="block text-slate-700 text-xs font-bold mb-2">{language === 'th' ? 'หมายเหตุการคืนสินทรัพย์' : 'Return Asset Notes'}</label>
            <div className="relative">
              <div className="absolute top-3 left-3 text-slate-400">
                <FileText size={16} />
              </div>
              <textarea
                {...register('conditionNote')}
                rows={3}
                placeholder={language === 'th' ? 'ระบุตำหนิเพิ่มเติม อุปกรณ์ส่วนย่อยที่ชำรุดเสียหาย หรือชี้แจงการชำรุด (ถ้ามี)...' : 'Specify additional defects, damaged sub-equipment, or explain damage (if any)...'}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Link
              href="/returns"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              {language === 'th' ? 'ยกเลิก' : 'Cancel'}
            </Link>
            <button
              type="submit"
              disabled={submitting || uploadingImage || borrowedItems.length === 0}
              className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-xs transition-colors shadow-md shadow-sky-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting
                ? (language === 'th' ? 'กำลังบันทึก...' : 'Recording...')
                : (language === 'th' ? 'บันทึกการส่งคืน' : 'Record Return')}
            </button>
          </div>
        </form>
      </div>

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleQRScan}
        title={language === 'th' ? 'สแกน QR Code เพื่อรับคืนสินทรัพย์' : 'Scan QR Code to return asset'}
      />
    </div>
  );
}
