'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { ArrowLeft, Box, QrCode, FileText, Upload, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const assetSchema = z.object({
  assetCode: z.string().nonempty('กรุณากรอกรหัสสินทรัพย์'),
  name: z.string().nonempty('กรุณากรอกชื่อสินทรัพย์'),
  category: z.string().nonempty('กรุณากรอกหมวดหมู่'),
  serialNumber: z.string().optional(),
  description: z.string().optional(),
  qrCode: z.string().nonempty('กรุณากรอกข้อมูลสำหรับรหัส QR Code'),
});

type AssetForm = z.infer<typeof assetSchema>;

export default function NewAssetPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AssetForm>({
    resolver: zodResolver(assetSchema),
  });

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
      setErrorMsg(language === 'th' ? 'อัปโหลดรูปภาพล้มเหลว กรุณาลองใหม่อีกครั้ง' : 'Image upload failed. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = async (data: AssetForm) => {
    setLoading(true);
    setErrorMsg(null);

    const payload = {
      ...data,
      imageUrl: imageUrl || undefined,
      cloudinaryPublicId: cloudinaryPublicId || undefined,
    };

    try {
      await api.post('/assets', payload);
      router.push('/assets');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || (language === 'th' ? 'การสร้างสินทรัพย์ล้มเหลว' : 'Failed to create asset'));
      setLoading(false);
    }
  };

  // Pre-generate QR code based on code input
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue('qrCode', val); // Set QR code value equal to assetCode by default
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link
          href="/assets"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-xs font-semibold"
        >
          <ArrowLeft size={16} />
          <span>{language === 'th' ? 'ย้อนกลับไปหน้าสินทรัพย์' : 'Back to Assets'}</span>
        </Link>
      </div>

      <div className="bg-white p-8 border border-slate-100 rounded-2xl shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {language === 'th' ? 'เพิ่มสินทรัพย์ใหม่' : 'Add New Asset'}
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            {language === 'th'
              ? 'กรอกรายละเอียดข้อมูลเพื่อสร้างสินทรัพย์/ครุภัณฑ์ในระบบ'
              : 'Enter details to create an asset/equipment in the system'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-2">
                {language === 'th' ? 'รหัสสินทรัพย์ (Asset Code) *' : 'Asset Code *'}
              </label>
              <input
                type="text"
                {...register('assetCode', { onChange: handleCodeChange })}
                placeholder={language === 'th' ? 'เช่น TIF-AST-0010' : 'e.g. TIF-AST-0010'}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
              {errors.assetCode && (
                <p className="text-red-500 text-[10px] mt-1.5 font-medium">
                  {language === 'th' ? errors.assetCode.message : 'Please enter asset code'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-slate-700 text-xs font-bold mb-2">
                {language === 'th' ? 'หมวดหมู่ (Category) *' : 'Category *'}
              </label>
              <input
                type="text"
                {...register('category')}
                placeholder={language === 'th' ? 'เช่น Electronic, Aviation Gear' : 'e.g. Electronic, Aviation Gear'}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
              {errors.category && (
                <p className="text-red-500 text-[10px] mt-1.5 font-medium">
                  {language === 'th' ? errors.category.message : 'Please enter category'}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 text-xs font-bold mb-2">
              {language === 'th' ? 'ชื่อสินทรัพย์ (Asset Name) *' : 'Asset Name *'}
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder={
                language === 'th'
                  ? 'ชื่อของสินทรัพย์/ครุภัณฑ์ เช่น Pilot Headset Bose A20'
                  : 'Asset name, e.g. Pilot Headset Bose A20'
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-sky-500 focus:bg-white"
            />
            {errors.name && (
              <p className="text-red-500 text-[10px] mt-1.5 font-medium">
                {language === 'th' ? errors.name.message : 'Please enter asset name'}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-2">
                {language === 'th' ? 'หมายเลขซีเรียล (Serial Number)' : 'Serial Number'}
              </label>
              <input
                type="text"
                {...register('serialNumber')}
                placeholder={language === 'th' ? 'ระบุซีเรียลการค้า (ถ้ามี)' : 'Enter commercial serial number (if any)'}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 text-xs font-bold mb-2">
                {language === 'th' ? 'ข้อมูล QR Code *' : 'QR Code Data *'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <QrCode size={16} />
                </div>
                <input
                  type="text"
                  {...register('qrCode')}
                  placeholder={language === 'th' ? 'ค่าสแกน QR Code เพื่อค้นหา' : 'QR code scan value to search'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>
              {errors.qrCode && (
                <p className="text-red-500 text-[10px] mt-1.5 font-medium">
                  {language === 'th' ? errors.qrCode.message : 'Please enter QR code data'}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 text-xs font-bold mb-2">
              {language === 'th' ? 'รูปภาพประกอบสินทรัพย์' : 'Asset Image'}
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 border-dashed rounded-xl relative hover:border-sky-400 transition-colors">
              <div className="space-y-2 text-center">
                {imageUrl ? (
                  <div className="flex flex-col items-center">
                    <img src={imageUrl} alt="Uploaded preview" className="h-32 object-cover rounded-lg border mb-2" />
                    <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle size={12} /> {language === 'th' ? 'อัปโหลดสำเร็จ' : 'Uploaded successfully'}
                    </p>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-10 w-10 text-slate-400" />
                    <div className="flex text-xs text-slate-500">
                      <label className="relative cursor-pointer bg-white rounded-md font-semibold text-sky-500 hover:text-sky-600 focus-within:outline-none">
                        <span>{language === 'th' ? 'อัปโหลดรูปภาพ' : 'Upload image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">{language === 'th' ? 'หรือลากไฟล์มาที่นี่' : 'or drag file here'}</p>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {language === 'th' ? 'PNG, JPG, GIF ขนาดไม่เกิน 5MB' : 'PNG, JPG, GIF up to 5MB'}
                    </p>
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
            <label className="block text-slate-700 text-xs font-bold mb-2">
              {language === 'th' ? 'รายละเอียดเพิ่มเติม' : 'Additional Details'}
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 text-slate-400">
                <FileText size={16} />
              </div>
              <textarea
                {...register('description')}
                rows={3}
                placeholder={
                  language === 'th'
                    ? 'คำอธิบายลักษณะ สภาพ ตำแหน่งที่เก็บสินทรัพย์...'
                    : 'Description of characteristics, condition, storage location...'
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Link
              href="/assets"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              {language === 'th' ? 'ยกเลิก' : 'Cancel'}
            </Link>
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-xs transition-colors shadow-md shadow-sky-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading
                ? language === 'th' ? 'กำลังบันทึก...' : 'Saving...'
                : language === 'th' ? 'บันทึกสินทรัพย์' : 'Save Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
