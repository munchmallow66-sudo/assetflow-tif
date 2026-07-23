'use client';

import React, { useEffect, useState, use } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { ArrowLeft, QrCode, FileText, Upload, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const assetSchema = z.object({
  assetCode: z.string().nonempty('กรุณากรอกรหัสสินทรัพย์'),
  name: z.string().nonempty('กรุณากรอกชื่อสินทรัพย์'),
  category: z.string().nonempty('กรุณากรอกหมวดหมู่'),
  serialNumber: z.string().optional(),
  description: z.string().optional(),
  qrCode: z.string().nonempty('กรุณากรอกข้อมูลสำหรับรหัส QR Code'),
  status: z.string().nonempty('กรุณาระบุสถานะสินทรัพย์'),
});

type AssetForm = z.infer<typeof assetSchema>;

export default function EditAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssetForm>({
    resolver: zodResolver(assetSchema),
  });

  useEffect(() => {
    const fetchAssetDetails = async () => {
      try {
        const res = await api.get(`/assets/${id}`);
        const data = res.data;
        
        reset({
          assetCode: data.assetCode,
          name: data.name,
          category: data.category,
          serialNumber: data.serialNumber || '',
          description: data.description || '',
          qrCode: data.qrCode,
          status: data.status,
        });
        
        setImageUrl(data.imageUrl || null);
        setCloudinaryPublicId(data.cloudinaryPublicId || null);
      } catch (err) {
        setErrorMsg(language === 'th' ? 'ไม่สามารถโหลดข้อมูลสินทรัพย์ได้' : 'Failed to load asset details');
      } finally {
        setLoading(false);
      }
    };
    fetchAssetDetails();
  }, [id, reset]);

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
    setSubmitting(true);
    setErrorMsg(null);

    const payload = {
      ...data,
      imageUrl: imageUrl || undefined,
      cloudinaryPublicId: cloudinaryPublicId || undefined,
    };

    try {
      await api.patch(`/assets/${id}`, payload);
      router.push('/assets');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || (language === 'th' ? 'การแก้ไขสินทรัพย์ล้มเหลว' : 'Failed to update asset'));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
            {language === 'th' ? 'แก้ไขข้อมูลสินทรัพย์' : 'Edit Asset Details'}
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            {language === 'th'
              ? `แก้ไขรายละเอียดข้อมูลครุภัณฑ์รหัส: ${id}`
              : `Edit equipment details for code: ${id}`}
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
                {...register('assetCode')}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-700 focus:outline-none"
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
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-700 focus:outline-none"
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
              {language === 'th' ? 'ชื่อสินทรัพย์ *' : 'Asset Name *'}
            </label>
            <input
              type="text"
              {...register('name')}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-700 focus:outline-none"
            />
            {errors.name && (
              <p className="text-red-500 text-[10px] mt-1.5 font-medium">
                {language === 'th' ? errors.name.message : 'Please enter asset name'}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-2">
                {language === 'th' ? 'หมายเลขซีเรียล' : 'Serial Number'}
              </label>
              <input
                type="text"
                {...register('serialNumber')}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 text-xs font-bold mb-2">
                {language === 'th' ? 'สถานะสินทรัพย์ *' : 'Asset Status *'}
              </label>
              <select
                {...register('status')}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-700 focus:outline-none"
              >
                <option value="AVAILABLE">
                  {language === 'th' ? 'พร้อมใช้งาน (AVAILABLE)' : 'Available (AVAILABLE)'}
                </option>
                <option value="BORROWED">
                  {language === 'th' ? 'อยู่ระหว่างการยืม (BORROWED)' : 'Borrowed (BORROWED)'}
                </option>
                <option value="MAINTENANCE">
                  {language === 'th' ? 'ซ่อมบำรุง (MAINTENANCE)' : 'Maintenance (MAINTENANCE)'}
                </option>
                <option value="LOST">
                  {language === 'th' ? 'สูญหาย (LOST)' : 'Lost (LOST)'}
                </option>
                <option value="RETIRED">
                  {language === 'th' ? 'เลิกใช้งาน (RETIRED)' : 'Retired (RETIRED)'}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 text-xs font-bold mb-2">
                {language === 'th' ? 'รหัส QR Code *' : 'QR Code Data *'}
              </label>
              <input
                type="text"
                {...register('qrCode')}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-700 focus:outline-none"
              />
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
                    <label className="relative cursor-pointer bg-white rounded-md font-semibold text-sky-500 hover:text-sky-600 focus-within:outline-none text-[10px]">
                      <span>{language === 'th' ? 'เปลี่ยนรูปภาพ' : 'Change Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="sr-only"
                      />
                    </label>
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
                    </div>
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
            <textarea
              {...register('description')}
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-700 focus:outline-none"
            />
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
              disabled={submitting || uploadingImage}
              className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-xs transition-colors shadow-md shadow-sky-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting
                ? language === 'th' ? 'กำลังบันทึก...' : 'Saving...'
                : language === 'th' ? 'บันทึกการแก้ไข' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
