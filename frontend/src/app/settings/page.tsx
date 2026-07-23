'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/components/providers/LanguageProvider';
import api from '@/lib/api';
import { Shield, Building, Database, Save, CheckCircle, AlertCircle } from 'lucide-react';

interface SystemSettings {
  companyNameTh: string;
  companyNameEn: string;
  businessType: string;
  contactEmail: string;
  maxBorrowDays: number;
  autoMaintenanceOnDamaged: boolean;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const isAdmin = user?.role === 'ADMIN';

  const [settings, setSettings] = useState<SystemSettings>({
    companyNameTh: '',
    companyNameEn: '',
    businessType: '',
    contactEmail: '',
    maxBorrowDays: 7,
    autoMaintenanceOnDamaged: true,
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        setSettings(res.data);
      } catch (err: any) {
        console.error('Failed to fetch settings:', err);
        setErrorMsg(language === 'th' ? 'ไม่สามารถดึงข้อมูลการตั้งค่าจากเซิร์ฟเวอร์ได้' : 'Unable to fetch settings from server');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : name === 'maxBorrowDays' 
          ? parseInt(value, 10) || 0
          : value,
    }));
  };

  const handleCheckboxChange = (name: keyof SystemSettings, checked: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await api.patch('/settings', settings);
      setSettings(res.data);
      setSuccessMsg(language === 'th' ? 'บันทึกการตั้งค่าระบบเรียบร้อยแล้ว' : 'System settings saved successfully');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Failed to update settings:', err);
      setErrorMsg(err.response?.data?.message || (language === 'th' ? 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' : 'An error occurred while saving settings'));
    } finally {
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
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{language === 'th' ? 'ตั้งค่าระบบ' : 'System Settings'}</h1>
          <p className="text-slate-500 text-xs mt-1">{language === 'th' ? 'การตั้งค่าข้อมูลองค์กร ข้อมูลทางเทคนิค และนโยบายการยืม-คืนอุปกรณ์' : 'Configure organization details, technical info, and asset borrow policies'}</p>
        </div>
        {!isAdmin && (
          <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-550 text-[10px] font-bold rounded-lg shrink-0 w-fit">
            {language === 'th' ? 'โหมดอ่านอย่างเดียว (Read-only)' : 'Read-only Mode'}
          </span>
        )}
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle size={16} className="text-emerald-500 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
        {/* Company Settings */}
        <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="text-sky-500" size={18} />
            <h2 className="text-sm font-bold text-slate-800">{language === 'th' ? 'ข้อมูลองค์กร / Company Profile' : 'Company Profile'}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="block text-slate-400 font-bold">{language === 'th' ? 'ชื่อบริษัท (ไทย) *' : 'Company Name (Thai) *'}</label>
              <input
                type="text"
                name="companyNameTh"
                value={settings.companyNameTh}
                onChange={handleChange}
                disabled={!isAdmin}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-slate-700 focus:outline-none focus:border-sky-500 focus:bg-white transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-slate-400 font-bold">{language === 'th' ? 'ชื่อบริษัท (อังกฤษ) *' : 'Company Name (English) *'}</label>
              <input
                type="text"
                name="companyNameEn"
                value={settings.companyNameEn}
                onChange={handleChange}
                disabled={!isAdmin}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-slate-700 focus:outline-none focus:border-sky-500 focus:bg-white transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-slate-400 font-bold">{language === 'th' ? 'ประเภทธุรกิจ *' : 'Business Type *'}</label>
              <input
                type="text"
                name="businessType"
                value={settings.businessType}
                onChange={handleChange}
                disabled={!isAdmin}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-slate-700 focus:outline-none focus:border-sky-500 focus:bg-white transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-slate-400 font-bold">{language === 'th' ? 'ที่อยู่อีเมลติดต่อหลัก *' : 'Primary Contact Email *'}</label>
              <input
                type="email"
                name="contactEmail"
                value={settings.contactEmail}
                onChange={handleChange}
                disabled={!isAdmin}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-slate-700 focus:outline-none focus:border-sky-500 focus:bg-white transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* System Policies */}
        <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Shield className="text-sky-500" size={18} />
            <h2 className="text-sm font-bold text-slate-800">{language === 'th' ? 'นโยบายและการทำงาน / System Policies' : 'System Policies'}</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-slate-400 font-bold">{language === 'th' ? 'ระยะเวลาการยืมสูงสุด (วัน) *' : 'Maximum Borrow Duration (Days) *'}</label>
                <input
                  type="number"
                  name="maxBorrowDays"
                  min="1"
                  max="365"
                  value={settings.maxBorrowDays}
                  onChange={handleChange}
                  disabled={!isAdmin}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-slate-700 focus:outline-none focus:border-sky-500 focus:bg-white transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-400">{language === 'th' ? 'ระบบจะช่วยคำนวณวันกำหนดคืนเริ่มต้นให้อัตโนมัติ' : 'The system will automatically calculate the default return date'}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="autoMaintenanceOnDamaged"
                  checked={settings.autoMaintenanceOnDamaged}
                  onChange={(e) => handleCheckboxChange('autoMaintenanceOnDamaged', e.target.checked)}
                  disabled={!isAdmin}
                  className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 disabled:opacity-70 disabled:cursor-not-allowed"
                />
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-700">{language === 'th' ? 'ส่งซ่อมบำรุงอัตโนมัติเมื่ออุปกรณ์ชำรุด' : 'Auto-send to maintenance when equipment is damaged'}</span>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {language === 'th'
                      ? 'เมื่อผู้รับคืน (Admin) บันทึกสภาพอุปกรณ์เป็น ชำรุดเสียหาย (DAMAGED) ในขั้นตอนส่งคืน สินทรัพย์ชิ้นนั้นจะถูกเปลี่ยนสถานะเป็น ซ่อมบำรุง (MAINTENANCE) ในระบบโดยอัตโนมัติทันที'
                      : 'When the receiver (Admin) records the equipment condition as DAMAGED during the return process, the asset will automatically be set to MAINTENANCE status in the system'}
                  </p>
                </div>
              </label>

              <div className="flex items-start gap-3 mt-4">
                <input
                  type="checkbox"
                  checked={true}
                  disabled={true}
                  className="mt-0.5 rounded border-slate-300 text-sky-650 disabled:opacity-70"
                />
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-500">{language === 'th' ? 'ระงับการยืมอุปกรณ์กรณีสูญหาย' : 'Suspend borrowing for lost equipment'}</span>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {language === 'th'
                      ? 'เมื่ออุปกรณ์ถูกรายงานว่า สูญหาย (LOST) จะเปลี่ยนสถานะและระงับการยืมใช้งานทันที (นโยบายคงที่ของระบบเพื่อความปลอดภัยทางทรัพย์สิน)'
                      : 'When equipment is reported as LOST, its status will be changed and borrowing will be suspended immediately (fixed system policy for asset security)'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Database & Technology info (Read-only) */}
        <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Database className="text-sky-500" size={18} />
            <h2 className="text-sm font-bold text-slate-800">{language === 'th' ? 'ข้อมูลด้านเทคนิค / Tech Stack Details' : 'Tech Stack Details'}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-650">
            <div>
              <p className="text-slate-400 font-semibold">{language === 'th' ? 'ระบบฐานข้อมูลหลัก' : 'Primary Database'}</p>
              <p className="text-slate-700 font-bold mt-1">Neon Serverless PostgreSQL (Prisma ORM)</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold">{language === 'th' ? 'บริการจัดเก็บรูปภาพ' : 'Image Storage Service'}</p>
              <p className="text-slate-700 font-bold mt-1">Cloudinary SDK Integration</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold">{language === 'th' ? 'เซิร์ฟเวอร์ระบบ API Backend' : 'API Backend Server'}</p>
              <p className="text-slate-700 font-bold mt-1">Next.js Route Handlers (Edge Ready)</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold">{language === 'th' ? 'เฟรมเวิร์กส่วนหน้า Frontend' : 'Frontend Framework'}</p>
              <p className="text-slate-700 font-bold mt-1">Next.js App Router (Tailwind CSS v4)</p>
            </div>
          </div>
        </div>

        {/* Submit button */}
        {isAdmin && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-400 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-sky-500/10 cursor-pointer transition-all duration-200"
            >
              <Save size={16} />
              <span>{submitting ? (language === 'th' ? 'กำลังบันทึก...' : 'Saving configuration...') : (language === 'th' ? 'บันทึกการตั้งค่าระบบ' : 'Save System Configuration')}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
