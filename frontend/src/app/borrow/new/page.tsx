'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { useLanguage } from '@/components/providers/LanguageProvider';
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
  const { t, language } = useLanguage();
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
        setErrorMsg(language === 'th' ? 'ไม่สามารถดึงข้อมูลสินทรัพย์ได้' : 'Failed to retrieve asset data');
      } finally {
        setLoading(false);
      }
    };
    fetchAvailableAssets();
  }, [setValue, language]);

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
      alert(language === 'th' ? `ค้นพบและเลือกสินทรัพย์: ${matched.name}` : `Asset found and selected: ${matched.name}`);
    } else {
      alert(language === 'th' ? `ไม่พบสินทรัพย์ที่มีรหัส QR: "${scannedText}" ในระบบ หรือสินทรัพย์นี้ไม่พร้อมใช้งาน` : `No available asset with QR code: "${scannedText}" found in the system`);
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
      setErrorMsg(err.response?.data?.message || (language === 'th' ? 'การยื่นคำขอยืมล้มเหลว' : 'Failed to submit borrow request'));
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <Link href="/borrow" className="text-slate-400 hover:text-sky-500 flex items-center gap-1 text-xs mb-4">
          <ArrowLeft size={14} />
          {language === 'th' ? 'กลับสู่รายการขอยืม' : 'Back to Borrow List'}
        </Link>
        <h1 className="text-2xl font-bold text-slate-850 dark:text-white">
          {language === 'th' ? 'ขอยืมครุภัณฑ์ใหม่' : 'New Borrow Request'}
        </h1>
        <p className="text-slate-500 text-xs mt-1">
          {language === 'th' ? 'กรุณาระบุรายละเอียดสินทรัพย์และข้อมูลการใช้งาน' : 'Please specify asset details and usage information'}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-3xl p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* STEP 1: SELECT ASSET */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-850 dark:text-white flex items-center gap-2">
                  <Box className="text-sky-500" size={18} />
                  <span>{language === 'th' ? 'ขั้นตอนที่ 1: เลือกสินทรัพย์' : 'Step 1: Select Asset'}</span>
                </h2>
                <p className="text-slate-400 dark:text-slate-500 text-[11px] leading-relaxed">
                  {language === 'th' ? 'เลือกสินทรัพย์จากรายการที่มี หรือสแกน QR Code ของสินทรัพย์เพื่อทำรายการ' : 'Select an asset from the available list, or scan the asset\'s QR Code to proceed.'}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <select
                    {...register('assetId')}
                    className="flex-1 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-700 dark:text-slate-355 focus:outline-none focus:border-sky-500"
                  >
                    <option value="">{language === 'th' ? '-- เลือกรหัสสินทรัพย์ --' : '-- Select Asset --'}</option>
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        [{asset.assetCode}] {asset.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="px-4 py-3 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 rounded-2xl hover:bg-indigo-100 dark:hover:bg-indigo-950/40 transition-colors"
                  >
                    <QrCode size={18} />
                  </button>
                </div>
                {errors.assetId && (
                  <p className="text-red-500 text-[10px] mt-1.5 font-medium">
                    {language === 'th' ? errors.assetId.message : 'Please select the asset you want to borrow'}
                  </p>
                )}
              </div>

              {selectedAsset && (
                <div className="p-4 bg-sky-50 dark:bg-sky-955/30 rounded-2xl border border-sky-100 dark:border-sky-900/50 flex gap-3">
                  <Info className="text-sky-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <h4 className="text-[11px] font-bold text-sky-800 dark:text-sky-300">{language === 'th' ? 'สินทรัพย์ที่เลือก' : 'Selected Asset'}</h4>
                    <p className="text-[11px] text-sky-700 dark:text-sky-400 mt-1">
                      {selectedAsset.name} <br />
                      {language === 'th' ? 'รหัสครุภัณฑ์:' : 'Asset Code:'} <span className="font-mono">{selectedAsset.assetCode}</span> | {language === 'th' ? 'หมวดหมู่:' : 'Category:'} {selectedAsset.category}
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
                  <span>{language === 'th' ? 'ขั้นตอนถัดไป' : 'Next Step'}</span>
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
                  <span>{language === 'th' ? 'ขั้นตอนที่ 2: ระบุระยะเวลาและวัตถุประสงค์' : 'Step 2: Duration & Purpose'}</span>
                </h2>
                <p className="text-slate-400 dark:text-slate-500 text-[11px] leading-relaxed">
                  {language === 'th' ? 'ระบุวันที่เริ่มต้นขอยืม วันส่งคืนคาดการณ์ และระบุข้อมูลเหตุผลความจำเป็นในการยืมเพื่อส่งให้ผู้อนุมัติพิจารณา' : 'Specify the borrow start date, expected return date, and the purpose of borrowing for approval.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold">{language === 'th' ? 'วันที่เริ่มต้นยืมใช้งาน *' : 'Borrow Start Date *'}</label>
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
                    <p className="text-red-500 text-[10px] mt-1.5 font-medium">
                      {language === 'th' ? errors.borrowDate.message : 'Please select borrow date'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold">{language === 'th' ? 'วันที่คาดว่าจะส่งคืน *' : 'Expected Return Date *'}</label>
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
                    <p className="text-red-500 text-[10px] mt-1.5 font-medium">
                      {language === 'th' 
                        ? errors.expectedReturnDate.message 
                        : errors.expectedReturnDate.message?.includes('หลังจาก') 
                          ? 'Expected return date must be on or after borrow date' 
                          : 'Please select expected return date'}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold">{language === 'th' ? 'วัตถุประสงค์ในการขอยืมใช้งาน *' : 'Borrow Purpose *'}</label>
                <div className="relative">
                  <div className="absolute top-3 left-4 text-slate-400">
                    <FileText size={15} />
                  </div>
                  <textarea
                    {...register('purpose')}
                    rows={4}
                    placeholder={language === 'th' ? 'อธิบายวัตถุประสงค์และแผนการใช้งานอุปกรณ์นี้...' : 'Explain the purpose and plan for using this device...'}
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500 placeholder-slate-400"
                  />
                </div>
                {errors.purpose && (
                  <p className="text-red-500 text-[10px] mt-1.5 font-medium">
                    {language === 'th' ? errors.purpose.message : 'Please specify borrow purpose'}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-5 py-3 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-650 dark:text-slate-300 rounded-2xl font-bold text-xs transition-colors cursor-pointer"
                >
                  {language === 'th' ? 'ย้อนกลับ' : 'Back'}
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-5 py-3 bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 text-white rounded-2xl font-bold text-xs shadow-md shadow-sky-500/10 transition-all cursor-pointer flex items-center gap-1.5 hover:scale-[1.02] active:scale-95 duration-200"
                >
                  <span>{language === 'th' ? 'ขั้นตอนถัดไป' : 'Next Step'}</span>
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
                  <span>{language === 'th' ? 'ขั้นตอนที่ 3: ลงนามดิจิทัลและส่งคำขอ' : 'Step 3: Digital Signature & Submit'}</span>
                </h2>
                <p className="text-slate-400 dark:text-slate-500 text-[11px] leading-relaxed">
                  {language === 'th' ? 'ตรวจสอบรายละเอียดการขอยืมในสรุปรายการ จากนั้นลงชื่อผู้ขอยืมในช่องลงนามเพื่อบันทึกส่งข้อมูลอนุมัติ' : 'Review borrowing details in the summary below, then sign in the signature pad to submit.'}
                </p>
              </div>

              {/* Review summary box */}
              <div className="p-5 border border-slate-150/60 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-955/30 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-350 border-b dark:border-slate-800 pb-2 flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span>{language === 'th' ? 'สรุปรายการคำขอยืมครุภัณฑ์' : 'Borrow Request Summary'}</span>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider text-[9px]">{language === 'th' ? 'อุปกรณ์ที่ยืม:' : 'Equipment to Borrow:'}</span>
                    <span className="font-bold text-slate-850 dark:text-white text-xs mt-1 block">
                      [{selectedAsset?.assetCode}] {selectedAsset?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider text-[9px]">{language === 'th' ? 'หมวดหมู่:' : 'Category:'}</span>
                    <span className="font-bold text-slate-850 dark:text-white text-xs mt-1 block">{selectedAsset?.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider text-[9px]">{language === 'th' ? 'กำหนดการใช้งาน:' : 'Usage Schedule:'}</span>
                    <span className="font-bold text-slate-850 dark:text-white text-xs mt-1 block leading-relaxed">
                      {new Date(borrowDateVal).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US')} - {new Date(expectedReturnDateVal).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider text-[9px]">{language === 'th' ? 'วัตถุประสงค์:' : 'Purpose:'}</span>
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
                  <span>{language === 'th' ? 'วาดลายเซ็นของคุณด้านล่างนี้ *' : 'Draw your signature below *'}</span>
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
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-300 dark:text-slate-750 text-[10px] font-bold">
                      <PenTool size={20} className="mb-1 opacity-40 text-slate-400" />
                      <span>{language === 'th' ? 'วาดลายเซ็นตรงนี้ (เมาส์หรือระบบสัมผัส)' : 'Draw signature here (mouse or touch)'}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="absolute bottom-3 right-3 p-2 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 hover:text-red-500 text-slate-500 dark:text-slate-400 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1 text-[10px] font-bold shadow-sm"
                    title={language === 'th' ? 'ล้างลายเซ็น' : 'Clear Signature'}
                  >
                    <Trash2 size={12} />
                    <span>{language === 'th' ? 'ล้างลายเซ็น' : 'Clear Signature'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-5 py-3 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-650 dark:text-slate-300 rounded-2xl font-bold text-xs transition-colors cursor-pointer"
                >
                  {language === 'th' ? 'ย้อนกลับ' : 'Back'}
                </button>
                <button
                  type="submit"
                  disabled={submitting || !isCanvasSigned}
                  className="px-6 py-3 bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.03] active:scale-95 duration-200"
                >
                  <span>{language === 'th' ? 'ยืนยันและส่งคำขอยืม' : 'Confirm & Submit Borrow'}</span>
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
