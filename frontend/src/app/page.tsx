'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowRight, 
  QrCode, 
  Clock, 
  ShieldCheck, 
  BarChart3, 
  BookOpen, 
  Mail, 
  Phone, 
  MapPin,
  Plane,
  ChevronRight,
  HelpCircle,
  FileText
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden font-sans">
      
      {/* Background Image with Deep Overlay */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <Image
          src="/login-bg.png?v=2"
          alt="Aviation Background"
          fill
          priority
          className="object-cover opacity-20"
          unoptimized
        />
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-950" />
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Header / Navigation */}
      <header className="relative z-20 border-b border-slate-800/40 bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 flex items-center justify-center bg-slate-900 rounded-xl border border-slate-800">
              <Plane className="text-sky-400 rotate-45" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-white tracking-wider font-heading">TIF</span>
                <span className="text-xs bg-sky-500/20 text-sky-400 font-bold px-2 py-0.5 rounded-full">AssetFlow</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">THAI INTER FLYING</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs transition-all-custom shadow-lg shadow-sky-500/20 hover:shadow-sky-500/35 hover:-translate-y-0.5 btn-press cursor-pointer flex items-center gap-2"
            >
              เข้าสู่ระบบ
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 flex-grow flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-850 text-slate-350 text-xs font-semibold">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
              ระบบยืม-คืนครุภัณฑ์การบินภายในองค์กร
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-[1.15] font-heading tracking-wide">
              ควบคุมการยืม-คืน <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
                ครุภัณฑ์การบินอัจฉริยะ
              </span>
            </h1>
            
            <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
              สัมผัสความสะดวก รวดเร็ว และโปร่งใส ในการควบคุม ติดตาม ตรวจสอบสถานะอุปกรณ์การบินของสถาบัน Thai Inter Flying ทุกรายการได้แบบเรียลไทม์
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white font-bold rounded-xl text-sm transition-all-custom shadow-xl shadow-sky-500/15 hover:shadow-sky-500/25 hover:-translate-y-0.5 btn-press cursor-pointer flex items-center justify-center gap-2"
              >
                เริ่มต้นใช้งานระบบ
                <ArrowRight size={16} />
              </Link>
              <a
                href="#manuals"
                className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-850 text-slate-300 font-semibold rounded-xl text-sm border border-slate-800 hover:border-slate-700 transition-all-custom flex items-center justify-center gap-2"
              >
                <BookOpen size={16} className="text-sky-400" />
                คู่มือการใช้งาน
              </a>
            </div>
          </div>

          {/* Right Preview Card */}
          <div className="lg:col-span-5 animate-fade-in-up stagger-1 hidden lg:block">
            <div className="relative p-1 bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 rounded-3xl border border-slate-800/40 backdrop-blur-md">
              <div className="bg-slate-900/90 rounded-2xl p-6 space-y-6">
                
                {/* Simulated Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">TIF-ASSET-SYSTEM v1.0</span>
                </div>

                {/* Simulated QR Action Card */}
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center text-sky-400">
                        <QrCode size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">ระบบสแกน QR Code</h4>
                        <p className="text-[10px] text-slate-500">ยืมคืนได้ใน 5 วินาที</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-md">พร้อมสแกน</span>
                  </div>

                  {/* Simulated Activity Stream */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">ความเคลื่อนไหวล่าสุด</h5>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between p-2.5 bg-slate-950/40 rounded-lg border border-slate-900">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-slate-300 font-medium">ส่งคืน Garmin G5</span>
                        </div>
                        <span className="text-[9px] text-slate-500">2 นาทีที่แล้ว</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-slate-950/40 rounded-lg border border-slate-900">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-slate-300 font-medium">ยืม Flight Headset H10</span>
                        </div>
                        <span className="text-[9px] text-slate-500">1 ชั่วโมงที่แล้ว</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dashboard micro charts simulation */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-900 text-center">
                    <p className="text-[9px] text-slate-500 font-bold uppercase">ครุภัณฑ์พร้อมใช้</p>
                    <p className="text-lg font-bold text-emerald-400 mt-1">94.2%</p>
                  </div>
                  <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-900 text-center">
                    <p className="text-[9px] text-slate-500 font-bold uppercase">กำลังถูกยืม</p>
                    <p className="text-lg font-bold text-sky-400 mt-1">12 รายการ</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* Feature Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold text-sky-400 uppercase tracking-widest font-heading">Features</h2>
          <p className="text-3xl font-bold text-white tracking-wide font-heading">คุณสมบัติหลักของระบบ TIF AssetFlow</p>
          <p className="text-slate-400 text-sm">ออกแบบมาเฉพาะเพื่อยกระดับการจัดการเครื่องมือการเรียนการสอนและเครื่องบินของ Thai Inter Flying</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1 */}
          <div className="bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/60 rounded-2xl p-6 transition-all duration-200 card-hover flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-sky-500/10 rounded-xl border border-sky-500/20 flex items-center justify-center text-sky-400">
                <QrCode size={22} />
              </div>
              <h3 className="text-base font-bold text-white font-heading">ยืม-คืนด่วนด้วย QR Code</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                เพียงสแกนรหัสผ่าน QR Code หรือบาร์โค้ดบนตัวอุปกรณ์การบิน ระบบจะจัดหาข้อมูลครุภัณฑ์และอำนวยความสะดวกในการกดทำรายการยืม-คืนได้ทันที
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/60 rounded-2xl p-6 transition-all duration-200 card-hover flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Clock size={22} />
              </div>
              <h3 className="text-base font-bold text-white font-heading">ติดตามสถานะแบบเรียลไทม์</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                ตรวจสอบสถานะว่าครุภัณฑ์พร้อมใช้งาน ถูกยืม กำลังซ่อมบำรุง หรือชำรุด พร้อมประวัติบันทึกย้อนหลังอย่างละเอียด เพื่อการวิเคราะห์ที่แม่นยำ
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/60 rounded-2xl p-6 transition-all duration-200 card-hover flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck size={22} />
              </div>
              <h3 className="text-base font-bold text-white font-heading">ระบบอนุมัติออนไลน์</h3>
              <p className="text-slate-405 text-xs leading-relaxed font-medium">
                รองรับกระบวนการขออนุมัติยืมครุภัณฑ์จากอาจารย์การบินหรือแอดมินระบบออนไลน์ เพื่อการรับทราบและควบคุมปริมาณเครื่องมือในการบินให้มีประสิทธิภาพ
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/60 rounded-2xl p-6 transition-all duration-200 card-hover flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-rose-500/10 rounded-xl border border-rose-500/20 flex items-center justify-center text-rose-400">
                <BarChart3 size={22} />
              </div>
              <h3 className="text-base font-bold text-white font-heading">รายงานและสถิติเชิงลึก</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                หน้า Dashboard รวบรวมสถิติ ตัวเลขรวมการทำรายการ และแนวโน้มครุภัณฑ์ที่มีการใช้งานสูงสุด เพื่อนำมาปรับปรุงงบประมาณคลังวัสดุอุปกรณ์การบิน
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Manuals & Helpdesk Section */}
      <section id="manuals" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-900">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left: Guides & Manuals */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-sky-400 uppercase tracking-widest font-heading">Documentation</h3>
              <h4 className="text-2xl font-bold text-white font-heading">คู่มือและเอกสารการใช้งานระบบ</h4>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                ศึกษาขั้นตอนการยื่นเรื่องขอเบิก/ยืมครุภัณฑ์ การส่งคืน อัตราเวลาคืนล่วงเกิน และระดับสิทธิ์ต่างๆ ของผู้ใช้งานภายใน Thai Inter Flying
              </p>
            </div>

            <div className="space-y-3">
              <a 
                href="/manuals/user-guide.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded-2xl transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center text-sky-400">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors">คู่มือสำหรับผู้ใช้งานทั่วไป (นักบิน / พนักงาน)</h5>
                    <p className="text-[10px] text-slate-500">PDF Document • ขนาด 4.2 MB</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-500 group-hover:text-sky-400 transition-transform group-hover:translate-x-1" />
              </a>

              <a 
                href="/manuals/admin-guide.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded-2xl transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">คู่มือสำหรับผู้ดูแลระบบและผู้อนุมัติ (IT / Approver)</h5>
                    <p className="text-[10px] text-slate-500">PDF Document • ขนาด 5.8 MB</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          {/* Right: Support Contact */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-sky-400 uppercase tracking-widest font-heading">Support Desk</h3>
              <h4 className="text-2xl font-bold text-white font-heading">ศูนย์ช่วยเหลือและข้อมูลผู้ติดต่อ</h4>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                หากพบปัญหาในการเข้าสู่ระบบ ลืมรหัสผ่าน ไม่เห็นข้อมูลสินทรัพย์เฉพาะกลุ่ม หรือสแกน QR Code ไม่ผ่าน สามารถติดต่อผู้ประสานงานขององค์กรได้ตามข้อมูลด้านล่างนี้
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="p-5 bg-slate-900/35 border border-slate-850 rounded-2xl space-y-3">
                <div className="flex items-center gap-2.5 text-sky-400">
                  <HelpCircle size={18} />
                  <h5 className="text-xs font-bold text-white">ฝ่ายแอดมินและไอที</h5>
                </div>
                <ul className="space-y-2 text-[11px] text-slate-400 font-medium">
                  <li className="flex items-center gap-2">
                    <Mail size={13} className="text-slate-600" />
                    <span>it@thaiinterflying.com</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone size={13} className="text-slate-600" />
                    <span>เบอร์โทรศัพท์: ต่อ 104 (ฝ่าย IT)</span>
                  </li>
                </ul>
              </div>

              <div className="p-5 bg-slate-900/35 border border-slate-850 rounded-2xl space-y-3">
                <div className="flex items-center gap-2.5 text-indigo-400">
                  <MapPin size={18} />
                  <h5 className="text-xs font-bold text-white">คลังพัสดุและอาคารเก็บอุปกรณ์</h5>
                </div>
                <ul className="space-y-2 text-[11px] text-slate-400 font-medium">
                  <li className="flex items-center gap-2">
                    <Mail size={13} className="text-slate-600" />
                    <span>warehouse@thaiinterflying.com</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone size={13} className="text-slate-600" />
                    <span>เบอร์โทรศัพท์: ต่อ 112 (คลังครุภัณฑ์)</span>
                  </li>
                </ul>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-20 border-t border-slate-900/80 bg-slate-950/80 py-8 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Thai Inter Flying Co., Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-slate-350 transition-colors">เข้าสู่ระบบ</Link>
            <span>•</span>
            <a href="https://thaiinterflying.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-350 transition-colors">เว็บไซต์สถาบัน</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
