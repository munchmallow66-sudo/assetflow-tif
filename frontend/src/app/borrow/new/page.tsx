'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { 
  ArrowLeft, 
  Box, 
  Calendar, 
  FileText, 
  QrCode, 
  ArrowRight, 
  Check, 
  Sparkles, 
  Trash2, 
  PenTool, 
  CheckCircle, 
  ChevronRight,
  Info
} from 'lucide-react';
import Link from 'next/link';
import QRScannerModal from '@/components/common/QRScannerModal';

const borrowSchema = z.object({
  assetId: z.string().nonempty('กรุณาเลือกสินทรัพย์ที่ต้องการยืม'),
  borrowDate: z.string().nonempty('กรุณาระบุวันที่ขอยืม'),
  expectedReturnDate: z.string().nonempty('กรุณาระบุวันที่คาดว่าจะส่งคืน'),
  purpose: z.string().nonempty('กรุณาระบุวัตถุประสงค์ในการยืม'),
  signature: z.string().optional(),
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
  
  // Step control: 1 (Select Asset), 2 (Dates & Purpose), 3 (Confirmation & Signature)
  const [step, setStep] = useState(1);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Canvas drawing references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isCanvasSigned, setIsCanvasSigned] = useState(false);

  // Set default dates
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    watch,
    formState: { errors },
  } = useForm<BorrowForm>({
    resolver: zodResolver(borrowSchema),
    defaultValues: {
      borrowDate: today,
      expectedReturnDate: tomorrow,
    },
  });

  const selectedAssetId = watch('assetId');
  const selectedAsset = assets.find(a => a.id === selectedAssetId);
  const borrowDateVal = watch('borrowDate');
  const expectedReturnDateVal = watch('expectedReturnDate');
  const purposeVal = watch('purpose');

  useEffect(() => {
    const fetchAvailableAssets = async () => {
      try {
        const res = await api.get('/assets');
        const available = res.data.filter((a: any) => a.status === 'AVAILABLE');
        setAssets(available);
        
        // Auto-select asset if assetId query param is present
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const queryAssetId = params.get('assetId');
          if (queryAssetId) {
            const exists = available.some((a: any) => a.id === queryAssetId);
            if (exists) {
              setValue('assetId', queryAssetId);
            }
          }
        }
      } catch (err) {
        setErrorMsg('ไม่สามารถดึงข้อมูลสินทรัพย์ได้');
      } finally {
        setLoading(false);
      }
    };
    fetchAvailableAssets();
  }, [setValue]);

  // Make sure canvas sizing and scaling matches screen resolution
  useEffect(() => {
    if (step === 3 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Set scale background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [step]);

  const handleQRScan = (scannedText: string) => {
    const matched = assets.find((a) => a.assetCode === scannedText || a.id === scannedText);
    if (matched) {
      setValue('assetId', matched.id);
      alert(`ค้นพบและเลือกสินทรัพย์: ${matched.name}`);
    } else {
      alert(`ไม่พบสินทรัพย์ที่มีรหัส QR: "${scannedText}" ในระบบ หรือสินทรัพย์นี้ไม่พร้อมใช้งาน`);
    }
  };

  const nextStep = async () => {
    if (step === 1) {
      const isValid = await trigger('assetId');
      if (isValid) setStep(2);
    } else if (step === 2) {
      const isValid = await trigger(['borrowDate', 'expectedReturnDate', 'purpose']);
      if (isValid) setStep(3);
    }
  };

  const prevStep = () => {
    setStep((s) => s - 1);
  };

  // Canvas drawing methods
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#0f172a'; // Deep Navy Ink
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const pos = getEventPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getEventPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setIsCanvasSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsCanvasSigned(false);
  };

  const getEventPos = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const onSubmit = async (data: BorrowForm) => {
    let signatureBase64 = '';
    if (canvasRef.current && isCanvasSigned) {
      signatureBase64 = canvasRef.current.toDataURL('image/png');
    }

    setSubmitting(true);
    setErrorMsg(null);

    const payload = {
      ...data,
      signature: signatureBase64 || undefined
    };

    try {
      await api.post('/borrow-requests', payload);
      router.push('/borrow');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'การยื่นคำขอยืมล้มเหลว');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      {/* Back link */}
      <div>
        <Link
          href="/borrow"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-xs font-semibold animate-fade-in"
        >
          <ArrowLeft size={16} />
          <span>ย้อนกลับไปหน้ารายการยืม</span>
        </Link>
      </div>

      {/* Progress Wizard Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 border border-slate-150/60 dark:border-slate-800 rounded-3xl shadow-sm animate-fade-in">
        <div className="flex items-center justify-between max-w-md mx-auto relative px-4">
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[2px] bg-slate-100 dark:bg-slate-800 z-0">
            <div 
              className="h-full bg-sky-500 transition-all duration-300"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            ></div>
          </div>

          {[
            { label: 'เลือกครุภัณฑ์', num: 1 },
            { label: 'ข้อมูลการยืม', num: 2 },
            { label: 'ลงนามและยืนยัน', num: 3 }
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              disabled={s.num > step}
              onClick={() => {
                if (s.num < step) setStep(s.num);
              }}
              className="z-10 flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer disabled:cursor-not-allowed"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                ${s.num < step ? 'bg-emerald-500 text-white shadow-md' : ''}
                ${s.num === step ? 'bg-sky-500 text-white ring-4 ring-sky-100 dark:ring-sky-950/40 shadow-lg' : ''}
                ${s.num > step ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600' : ''}
              `}>
                {s.num < step ? <Check size={14} /> : s.num}
              </div>
              <span className={`text-[10px] font-bold ${s.num === step ? 'text-sky-500' : 'text-slate-400 dark:text-slate-500'}`}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main card panel */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 border border-slate-150/60 dark:border-slate-800 rounded-3xl shadow-sm space-y-6 relative overflow-hidden animate-fade-in">
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-medium flex items-center gap-2">
            <Info size={14} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {submitting && (
          <div className="absolute inset-0 bg-white/85 dark:bg-slate-900/85 z-40 flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200">
            <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-350">กำลังบันทึกและส่งคำขอขอยืมครุภัณฑ์...</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* STEP 1: SELECT ASSET */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-850 dark:text-white flex items-center gap-2">
                  <Box className="text-sky-500" size={18} />
                  <span>ขั้นตอนที่ 1: เลือกครุภัณฑ์/อุปกรณ์</span>
                </h2>
                <p className="text-slate-400 dark:text-slate-500 text-[11px] leading-relaxed">
                  กรุณาเลือกอุปกรณ์หรือครุภัณฑ์ที่ต้องการยื่นขอยืม โดยระบบจะแสดงเฉพาะครุภัณฑ์ที่มีสถานะว่างพร้อมใช้งานในขณะนี้
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold">เลือกครุภัณฑ์ที่ต้องการ *</label>
                {loading ? (
                  <div className="h-12 w-full bg-slate-50 dark:bg-slate-950 border border-slate-150/60 dark:border-slate-850 rounded-2xl animate-pulse flex items-center justify-center text-[10px] text-slate-400">
                    กำลังดึงรายการคลังอุปกรณ์...
                  </div>
                ) : assets.length === 0 ? (
                  <div className="p-5 bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-400 rounded-2xl text-xs font-semibold leading-relaxed">
                    ขออภัย ในระบบไม่มีครุภัณฑ์/อุปกรณ์ว่างสำหรับการยื่นขอยืมในขณะนี้
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <select
                        {...register('assetId')}
                        className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500 dark:focus:border-sky-500 cursor-pointer font-medium"
                      >
                        <option value="">-- ค้นหาและเลือกครุภัณฑ์ --</option>
                        {assets.map((asset) => (
                          <option key={asset.id} value={asset.id}>
                            [{asset.assetCode}] {asset.name} - {asset.category}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="px-5 py-3 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 hover:border-slate-300 rounded-2xl flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer text-xs font-bold font-sans shrink-0 shadow-sm"
                    >
                      <QrCode size={14} className="text-sky-500" />
                      <span>สแกนคิวอาร์</span>
                    </button>
                  </div>
                )}
                {errors.assetId && (
                  <p className="text-red-500 text-[10px] mt-1.5 font-medium">{errors.assetId.message}</p>
                )}
              </div>

              {selectedAsset && (
                <div className="p-5 bg-gradient-to-br from-slate-50 to-indigo-50/15 dark:from-slate-955 dark:to-indigo-950/10 border border-slate-150/60 dark:border-slate-850 rounded-2xl flex items-start gap-4 shadow-inner">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-955 text-sky-500 flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-900/60 shadow-sm">
                    <Box size={22} />
                  </div>
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 rounded-md font-bold uppercase tracking-wider">
                      <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                      พร้อมใช้งาน (Available)
                    </span>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white mt-1.5 leading-snug">{selectedAsset.name}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                      รหัสครุภัณฑ์: <span className="font-mono">{selectedAsset.assetCode}</span> | หมวดหมู่: {selectedAsset.category}
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!selectedAssetId}
                  className="px-5 py-3 bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 text-white rounded-2xl font-bold text-xs shadow-md shadow-sky-500/10 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 duration-200"
                >
                  <span>ขั้นตอนถัดไป</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DATES & PURPOSE */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-850 dark:text-white flex items-center gap-2">
                  <Calendar className="text-sky-500" size={18} />
                  <span>ขั้นตอนที่ 2: ระบุระยะเวลาและวัตถุประสงค์</span>
                </h2>
                <p className="text-slate-400 dark:text-slate-500 text-[11px] leading-relaxed">
                  ระบุวันที่เริ่มต้นขอยืม วันส่งคืนคาดการณ์ และระบุข้อมูลเหตุผลความจำเป็นในการยืมเพื่อส่งให้ผู้อนุมัติพิจารณา
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold">วันที่เริ่มต้นยืมใช้งาน *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Calendar size={15} />
                    </div>
                    <input
                      type="date"
                      min={today}
                      {...register('borrowDate')}
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-700 dark:text-slate-350 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  {errors.borrowDate && (
                    <p className="text-red-500 text-[10px] mt-1.5 font-medium">{errors.borrowDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold">วันที่คาดว่าจะส่งคืน *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Calendar size={15} />
                    </div>
                    <input
                      type="date"
                      min={today}
                      {...register('expectedReturnDate')}
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-700 dark:text-slate-350 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  {errors.expectedReturnDate && (
                    <p className="text-red-500 text-[10px] mt-1.5 font-medium">{errors.expectedReturnDate.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold">วัตถุประสงค์ในการขอยืมใช้งาน *</label>
                <div className="relative">
                  <div className="absolute top-3 left-4 text-slate-400">
                    <FileText size={15} />
                  </div>
                  <textarea
                    {...register('purpose')}
                    rows={4}
                    placeholder="อธิบายวัตถุประสงค์และแผนการใช้งานอุปกรณ์นี้ เช่น นำไปใช้ในวิชาเช็คสิทธิ์เครื่องเคียง เที่ยวบินฝึกอบรมรหัสบิน..."
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500 placeholder-slate-400"
                  />
                </div>
                {errors.purpose && (
                  <p className="text-red-500 text-[10px] mt-1.5 font-medium">{errors.purpose.message}</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-5 py-3 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-650 dark:text-slate-300 rounded-2xl font-bold text-xs transition-colors cursor-pointer"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-5 py-3 bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 text-white rounded-2xl font-bold text-xs shadow-md shadow-sky-500/10 transition-all cursor-pointer flex items-center gap-1.5 hover:scale-[1.02] active:scale-95 duration-200"
                >
                  <span>ขั้นตอนถัดไป</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CONFIRMATION & DIGITAL SIGNATURE */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-850 dark:text-white flex items-center gap-2">
                  <Sparkles className="text-sky-500" size={18} />
                  <span>ขั้นตอนที่ 3: ลงนามดิจิทัลและส่งคำขอ</span>
                </h2>
                <p className="text-slate-400 dark:text-slate-500 text-[11px] leading-relaxed">
                  ตรวจสอบรายละเอียดการขอยืมในสรุปรายการ จากนั้นลงชื่อผู้ขอยืมในช่องลงนามเพื่อบันทึกส่งข้อมูลอนุมัติ
                </p>
              </div>

              {/* Review summary box */}
              <div className="p-5 border border-slate-150/60 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-955/30 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-350 border-b dark:border-slate-800 pb-2 flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span>สรุปรายการคำขอยืมครุภัณฑ์</span>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider text-[9px]">อุปกรณ์ที่ยืม:</span>
                    <span className="font-bold text-slate-850 dark:text-white text-xs mt-1 block">
                      [{selectedAsset?.assetCode}] {selectedAsset?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider text-[9px]">หมวดหมู่:</span>
                    <span className="font-bold text-slate-850 dark:text-white text-xs mt-1 block">{selectedAsset?.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider text-[9px]">กำหนดการใช้งาน:</span>
                    <span className="font-bold text-slate-850 dark:text-white text-xs mt-1 block leading-relaxed">
                      {new Date(borrowDateVal).toLocaleDateString('th-TH')} - {new Date(expectedReturnDateVal).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider text-[9px]">วัตถุประสงค์:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-300 text-xs mt-1 block leading-relaxed whitespace-pre-line">
                      {purposeVal}
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive signature pad */}
              <div className="space-y-2">
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5">
                  <PenTool size={14} className="text-sky-500" />
                  <span>วาดลายเซ็นของคุณด้านล่างนี้ *</span>
                </label>
                
                <div className="border border-slate-200 dark:border-slate-800 bg-white rounded-2xl overflow-hidden shadow-inner relative">
                  <canvas
                    ref={canvasRef}
                    width={560}
                    height={200}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-[200px] touch-none cursor-crosshair"
                  />
                  
                  {/* Overlay text */}
                  {!isCanvasSigned && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-300 dark:text-slate-700 text-[10px] font-bold">
                      <PenTool size={20} className="mb-1 opacity-40 text-slate-400" />
                      <span>วาดลายเซ็นตรงนี้ (เมาส์หรือระบบสัมผัส)</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="absolute bottom-3 right-3 p-2 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 hover:text-red-500 text-slate-500 dark:text-slate-400 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1 text-[10px] font-bold shadow-sm"
                    title="ล้างลายเซ็น"
                  >
                    <Trash2 size={12} />
                    <span>ล้างลายเซ็น</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-5 py-3 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-650 dark:text-slate-300 rounded-2xl font-bold text-xs transition-colors cursor-pointer"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="submit"
                  disabled={submitting || !isCanvasSigned}
                  className="px-6 py-3 bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.03] active:scale-95 duration-200"
                >
                  <span>ยืนยันและส่งคำขอยืม</span>
                </button>
              </div>
            </div>
          )}
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
