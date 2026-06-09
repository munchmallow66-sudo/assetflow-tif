'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { ArrowLeft, Box, Calendar, FileText, QrCode, ArrowRight, Check, Sparkles, Trash2, PenTool } from 'lucide-react';
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

    ctx.strokeStyle = '#0284c7'; // aviation blue
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    // Generate signature image if canvas is signed
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

      {/* Progress Wizard Bar */}
      <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between max-w-md mx-auto relative px-4">
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[2px] bg-slate-100 z-0">
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
              onClick={() => {
                if (s.num < step) setStep(s.num);
              }}
              className="z-10 flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                ${s.num < step ? 'bg-emerald-500 text-white shadow-md' : ''}
                ${s.num === step ? 'bg-sky-500 text-white ring-4 ring-sky-100 shadow-lg' : ''}
                ${s.num > step ? 'bg-white border-2 border-slate-200 text-slate-400' : ''}
              `}>
                {s.num < step ? <Check size={14} /> : s.num}
              </div>
              <span className={`text-[10px] font-bold ${s.num === step ? 'text-sky-600' : 'text-slate-400'}`}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-8 border border-slate-100 rounded-2xl shadow-sm space-y-6">
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* STEP 1: SELECT ASSET */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Box className="text-sky-500" size={20} />
                  <span>ขั้นตอนที่ 1: เลือกครุภัณฑ์/อุปกรณ์การบิน</span>
                </h2>
                <p className="text-slate-500 text-[10px] mt-0.5">เลือกอุปกรณ์ที่มีสถานะว่างจากคลังของสถาบันฯ</p>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-2">ค้นหาหรือเลือกสินทรัพย์ *</label>
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

              {selectedAsset && (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center shrink-0 border border-sky-100">
                    <Box size={20} />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">พร้อมใช้งาน (Available)</span>
                    <h4 className="text-xs font-bold text-slate-800 mt-1">{selectedAsset.name}</h4>
                    <p className="text-[10px] text-slate-400">รหัสสินทรัพย์: {selectedAsset.assetCode} | หมวดหมู่: {selectedAsset.category}</p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!selectedAssetId}
                  className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
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
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="text-sky-500" size={20} />
                  <span>ขั้นตอนที่ 2: ระบุระยะเวลาและวัตถุประสงค์</span>
                </h2>
                <p className="text-slate-500 text-[10px] mt-0.5">กรอกช่วงเวลาใช้งานที่ต้องการและแจ้งเหตุผลความจำเป็น</p>
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
                    placeholder="อธิบายวัตถุประสงค์ในการยืม เช่น ใช้ฝึกบินในวิชา PPL เที่ยวบินจำลอง หรือประเมินเช็คสิทธิ์การบิน..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>
                {errors.purpose && (
                  <p className="text-red-500 text-[10px] mt-1.5 font-medium">{errors.purpose.message}</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl font-bold text-xs transition-colors"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>ขั้นตอนถัดไป</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CONFIRMATION & DIGITAL SIGNATURE */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="text-sky-500" size={20} />
                  <span>ขั้นตอนที่ 3: ลงนามดิจิทัลและส่งคำขอ</span>
                </h2>
                <p className="text-slate-500 text-[10px] mt-0.5">ตรวจสอบรายละเอียดคำขอและวาดลายเซ็นของคุณเพื่อรับผิดชอบอุปกรณ์</p>
              </div>

              {/* Review summary box */}
              <div className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-slate-700 border-b border-slate-100 pb-2">สรุปรายการคำขอยืม</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block">ครุภัณฑ์ที่ยืม:</span>
                    <span className="font-bold text-slate-800">[{selectedAsset?.assetCode}] {selectedAsset?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">หมวดหมู่:</span>
                    <span className="font-bold text-slate-800">{selectedAsset?.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">ระยะเวลาการยืม:</span>
                    <span className="font-bold text-slate-800">
                      {new Date(borrowDateVal).toLocaleDateString('th-TH')} ถึง {new Date(expectedReturnDateVal).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">วัตถุประสงค์:</span>
                    <span className="font-bold text-slate-800 leading-snug">{purposeVal}</span>
                  </div>
                </div>
              </div>

              {/* Interactive signature pad */}
              <div className="space-y-2">
                <label className="block text-slate-700 text-xs font-bold flex items-center gap-1.5">
                  <PenTool size={14} className="text-sky-500" />
                  <span>เซ็นลายมือชื่อของคุณในช่องด้านล่าง *</span>
                </label>
                
                <div className="border border-slate-200 dark:border-slate-700 bg-white rounded-2xl overflow-hidden shadow-inner relative">
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
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-350 text-[10px] font-semibold">
                      วาดลายเซ็นตรงนี้ (ใช้เมาส์หรือการสัมผัสจอ)
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="absolute bottom-3 right-3 p-2 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                    title="ล้างลายเซ็น"
                  >
                    <Trash2 size={12} />
                    <span>ล้างข้อมูล</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl font-bold text-xs transition-colors"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="submit"
                  disabled={submitting || !isCanvasSigned}
                  className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md shadow-sky-500/10"
                >
                  {submitting ? 'กำลังบันทึกและส่งคำขอ...' : 'ยืนยันและส่งคำขอยืม'}
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
