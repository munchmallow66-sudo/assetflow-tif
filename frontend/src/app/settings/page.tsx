'use client';

import { Shield, Building, Database } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">ตั้งค่าระบบ</h1>
        <p className="text-slate-500 text-xs mt-1">การตั้งค่าข้อมูลบริษัท ข้อมูลทางเทคนิค และการทำงานของระบบ</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Company Settings */}
        <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="text-sky-500" size={18} />
            <h2 className="text-sm font-bold text-slate-800">ข้อมูลองค์กร / Company Profile</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-semibold">ชื่อบริษัท (ไทย)</p>
              <p className="text-slate-700 font-bold mt-1">บริษัท ไทย อินเตอร์ ฟลายอิ้ง จำกัด</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold">ชื่อบริษัท (อังกฤษ)</p>
              <p className="text-slate-700 font-bold mt-1">Thai Inter Flying Co., Ltd.</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold">ประเภทธุรกิจ</p>
              <p className="text-slate-700 font-bold mt-1">สถาบันฝึกอบรมการบิน / Aviation Training Academy</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold">ที่อยู่อีเมลติดต่อหลัก</p>
              <p className="text-slate-700 font-bold mt-1">info@thaiinterflying.com</p>
            </div>
          </div>
        </div>

        {/* Database & Technology settings */}
        <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Database className="text-sky-500" size={18} />
            <h2 className="text-sm font-bold text-slate-800">ข้อมูลด้านเทคนิค / Tech Stack Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-semibold">ระบบฐานข้อมูลหลัก</p>
              <p className="text-slate-700 font-bold mt-1">Neon Serverless PostgreSQL (Prisma ORM)</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold">บริการจัดเก็บรูปภาพ</p>
              <p className="text-slate-700 font-bold mt-1">Cloudinary SDK Integration</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold">เซิร์ฟเวอร์ระบบ API Backend</p>
              <p className="text-slate-700 font-bold mt-1">NestJS v11 (TypeScript)</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold">เฟรมเวิร์กส่วนหน้า Frontend</p>
              <p className="text-slate-700 font-bold mt-1">Next.js App Router (Tailwind CSS)</p>
            </div>
          </div>
        </div>

        {/* System Policies */}
        <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Shield className="text-sky-500" size={18} />
            <h2 className="text-sm font-bold text-slate-800">นโยบายและการทำงาน / System Policies</h2>
          </div>

          <ul className="list-disc pl-5 text-xs text-slate-600 space-y-2 leading-relaxed">
            <li>ครุภัณฑ์ชำรุดจากการส่งคืน (สถานะ DAMAGED) จะเปลี่ยนสถานะเป็น <strong className="text-amber-600">MAINTENANCE</strong> (ซ่อมบำรุง) โดยอัตโนมัติ</li>
            <li>ครุภัณฑ์สูญหายจากการส่งคืน (สถานะ LOST) จะเปลี่ยนสถานะเป็น <strong className="text-red-600">LOST</strong> (สูญหาย) และระงับการยืมใช้งาน</li>
            <li>ระบบจะคำนวณสถานะ Overdue (เลยกำหนดส่ง) อัตโนมัติเมื่อกำหนดคืนล่วงเลยปัจจุบันและยังไม่มีการกดรับคืน</li>
            <li>บันทึกกิจกรรมการสร้าง ปรับปรุง ลบ อนุมัติ และลงทะเบียน จะเก็บเข้าตาราง <strong className="text-sky-600">AuditLog</strong> โดยละเอียด</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
