'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowRight, 
  QrCode, 
  ShieldCheck, 
  BarChart3, 
  BookOpen, 
  Mail, 
  Phone, 
  Plane,
  ChevronRight,
  FileText,
  Compass,
  Radio,
  Sliders,
  Activity
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden font-sans">
      
      {/* Background Jet & Cloud Overlay */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <Image
          src="/login-bg.png?v=2"
          alt="Aviation Cockpit Background"
          fill
          priority
          className="object-cover opacity-25 scale-105 filter saturate-50 blur-[2px]"
          unoptimized
        />
        {/* Deep aviation gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/95 to-slate-950" />
        {/* Glows simulating runway landing lights */}
        <div className="absolute top-[10%] left-[20%] w-[350px] h-[350px] bg-sky-500/10 rounded-full blur-[100px] animate-pulse duration-[6000ms]" />
        <div className="absolute top-[40%] right-[10%] w-[450px] h-[450px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse duration-[8000ms]" />
      </div>

      {/* Header / Navigation */}
      <header className="relative z-20 border-b border-slate-800/40 bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 flex items-center justify-center bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl border border-sky-400/20 shadow-lg shadow-sky-500/10">
              <Plane className="text-white rotate-45" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-white tracking-wider font-heading">TIF</span>
                <span className="text-xs bg-sky-500/20 border border-sky-500/30 text-sky-400 font-bold px-2.5 py-0.5 rounded-full">AssetFlow</span>
              </div>
              <p className="text-[9px] text-slate-400 tracking-widest font-semibold uppercase">Thai Inter Flying</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-bold rounded-xl text-xs transition-all-custom shadow-lg shadow-sky-500/20 hover:shadow-sky-500/35 hover:-translate-y-0.5 btn-press cursor-pointer flex items-center gap-2"
            >
              เข้าสู่ระบบสมาชิก
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 flex-grow flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Content Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-slate-300 text-xs font-semibold">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
              ระบบบริหารจัดการยืม-คืนอุปกรณ์การบินและครุภัณฑ์
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-[1.12] font-heading tracking-wide">
              ควบคุม คลังอุปกรณ์ <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-sky-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                ความปลอดภัยทุกเที่ยวบิน
              </span>
            </h1>
            
            <p className="text-slate-450 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
              สแกน ยืม-คืน และควบคุมสถานะเครื่องวัดพิกัด หูฟังตัดเสียง และอุปกรณ์ฝึกบินของสถาบัน **Thai Inter Flying** อย่างมีระบบ ตรวจสอบง่าย ป้องกันความสูญหายได้ในทันที
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white font-bold rounded-xl text-sm transition-all-custom shadow-xl shadow-sky-500/15 hover:shadow-sky-500/25 hover:-translate-y-0.5 btn-press cursor-pointer flex items-center justify-center gap-2"
              >
                เริ่มทำการยืม-คืนอุปกรณ์
                <ArrowRight size={16} />
              </Link>
              <a
                href="#manuals"
                className="w-full sm:w-auto px-8 py-4 bg-slate-900/80 hover:bg-slate-850 text-slate-350 font-semibold rounded-xl text-sm border border-slate-800 hover:border-slate-700 transition-all-custom flex items-center justify-center gap-2"
              >
                <BookOpen size={16} className="text-sky-450" />
                คู่มือการใช้งานระบบ
              </a>
            </div>
          </div>

          {/* Right Column: Aviation Cockpit Dashboard Mockup */}
          <div className="lg:col-span-5 animate-fade-in-up stagger-1 hidden lg:block">
            <div className="relative p-1.5 bg-gradient-to-tr from-sky-500/20 via-slate-800/60 to-indigo-500/20 rounded-[2rem] border border-slate-800/70 backdrop-blur-2xl shadow-3xl">
              <div className="bg-slate-950/95 rounded-[1.8rem] p-6 space-y-6">
                
                {/* Dashboard Cockpit Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">LIVE FLEET STATUS</span>
                  </div>
                  <span className="text-[9px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-sky-400 font-mono font-bold">HS-TIF FLIGHT DECK</span>
                </div>

                {/* Counter Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-850 text-center">
                    <span className="text-[9px] text-slate-500 font-bold block">ครุภัณฑ์การบิน</span>
                    <span className="text-base font-extrabold text-white">142</span>
                  </div>
                  <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-850 text-center">
                    <span className="text-[9px] text-slate-500 font-bold block">พร้อมใช้งาน</span>
                    <span className="text-base font-extrabold text-emerald-400">128</span>
                  </div>
                  <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-850 text-center">
                    <span className="text-[9px] text-slate-500 font-bold block">กำลังถูกยืม</span>
                    <span className="text-base font-extrabold text-sky-400">14</span>
                  </div>
                </div>

                {/* Specific Aviation Assets Lists */}
                <div className="space-y-3">
                  <h4 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">สถานะอุปกรณ์หลัก</h4>
                  
                  <div className="space-y-2">
                    {/* Aircraft HS-TIF */}
                    <div className="p-3 bg-slate-900/30 hover:bg-slate-900/50 rounded-xl border border-slate-900 flex items-center justify-between transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/25">
                          <Plane size={16} className="rotate-45" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-200">Cessna 172 Skyhawk (HS-TIF)</h5>
                          <p className="text-[9px] text-slate-500 font-mono">CODE: C172-01</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">พร้อมบิน</span>
                    </div>

                    {/* Garmin G1000 */}
                    <div className="p-3 bg-slate-900/30 hover:bg-slate-900/50 rounded-xl border border-slate-900 flex items-center justify-between transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/25">
                          <Compass size={16} />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-200">Garmin G1000 Navigation</h5>
                          <p className="text-[9px] text-slate-500 font-mono">CODE: GMN-G1K-08</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">พร้อมใช้งาน</span>
                    </div>

                    {/* Bose A20 Headset */}
                    <div className="p-3 bg-slate-900/30 hover:bg-slate-900/50 rounded-xl border border-slate-900 flex items-center justify-between transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/25">
                          <Radio size={16} />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-200">Bose A20 Flight Headset</h5>
                          <p className="text-[9px] text-slate-500 font-mono">CODE: HDS-B20-14</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">ถูกยืมใช้งาน</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Live Scan Scanner Trigger UI */}
                <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <QrCode size={16} className="text-sky-400 animate-pulse" />
                    <span className="text-[10px] text-slate-400 font-medium">แสกนบาร์โค้ดยืนยันตัวตน</span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase">STANDBY FOR SCAN</span>
                </div>

              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* Features Showcase Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold text-sky-400 uppercase tracking-widest font-heading">System Capability</h2>
          <p className="text-3xl font-bold text-white tracking-wide font-heading">ฟังก์ชันอำนวยความสะดวกการบิน</p>
          <p className="text-slate-400 text-sm">ครบทุกความต้องการในการตรวจสอบ เบิกพัสดุ และจัดเก็บเครื่องมืออย่างมีมาตรฐานความปลอดภัยสูง</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Feature Card 1 */}
          <div className="bg-slate-900/20 hover:bg-slate-900/60 border border-slate-900 hover:border-slate-800 rounded-2xl p-6 transition-all duration-350 card-hover flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-sky-500/10 rounded-xl border border-sky-500/25 flex items-center justify-center text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
                <QrCode size={22} />
              </div>
              <h3 className="text-base font-bold text-white font-heading">สแกนรวดเร็วผ่าน QR Code</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                รองรับการสแกนผ่านกล้องสมาร์ทโฟนหรือแท็บเล็ตประจำตัว เพื่อทำรายการยืม-คืนเครื่องบินและชุดอุปกรณ์นำทางได้แบบทันที ไม่ต้องกรอกรหัสด้วยมือ
              </p>
            </div>
          </div>

          {/* Feature Card 2 */}
          <div className="bg-slate-900/20 hover:bg-slate-900/60 border border-slate-900 hover:border-slate-800 rounded-2xl p-6 transition-all duration-350 card-hover flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl border border-indigo-500/25 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                <Compass size={22} />
              </div>
              <h3 className="text-base font-bold text-white font-heading">เช็คประวัติและพิกัดคลัง</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                ระบุพิกัดจัดเก็บ ตู้ ล็อกเกอร์ หรือคลังพัสดุการบิน และรายงานผลสถานะการซ่อมบำรุงของอุปกรณ์พ่วงต่ออิเล็กทรอนิกส์การบินทุกชิ้น
              </p>
            </div>
          </div>

          {/* Feature Card 3 */}
          <div className="bg-slate-900/20 hover:bg-slate-900/60 border border-slate-900 hover:border-slate-800 rounded-2xl p-6 transition-all duration-350 card-hover flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                <ShieldCheck size={22} />
              </div>
              <h3 className="text-base font-bold text-white font-heading">ระบบอนุมัติการบิน</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                เชื่อมต่อระบบขออนุมัติใช้งานครุภัณฑ์สำคัญจากอาจารย์การบินหรือแอดมิน เพื่อความรัดกุมและความปลอดภัยในการนำอุปกรณ์ขึ้นบินจริง
              </p>
            </div>
          </div>

          {/* Feature Card 4 */}
          <div className="bg-slate-900/20 hover:bg-slate-900/60 border border-slate-900 hover:border-slate-800 rounded-2xl p-6 transition-all duration-350 card-hover flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-rose-500/10 rounded-xl border border-rose-500/25 flex items-center justify-center text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300">
                <BarChart3 size={22} />
              </div>
              <h3 className="text-base font-bold text-white font-heading">Dashboard สรุปงบและสถิติ</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                แสดงผลชาร์ตความเคลื่อนไหว สถิติยอดการยืม อัตราอุปกรณ์การบินค้างส่งคืน เพื่อช่วยวางแผนการจัดซื้อและการซ่อมบำรุงเครื่องบิน
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Manuals & Helpdesk Grid */}
      <section id="manuals" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-900">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Guides Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-sky-400 uppercase tracking-widest font-heading">Support Documentation</h3>
              <h4 className="text-2xl font-bold text-white font-heading">คู่มือดาวน์โหลดความปลอดภัย</h4>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                โปรดเลือกดาวน์โหลดคู่มือการใช้งานระบบให้เหมาะสมกับหน้าที่ความรับผิดชอบของคุณ เพื่อการปฏิบัติงานในโรงเก็บเครื่องบินเป็นไปอย่างมีประสิทธิภาพ
              </p>
            </div>

            <div className="space-y-3">
              <a 
                href="/manuals/user-guide.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-slate-900/20 hover:bg-slate-900/60 border border-slate-850 hover:border-slate-800 rounded-2xl transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors duration-200">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white group-hover:text-sky-450 transition-colors">คู่มือสำหรับผู้ยืม (ศิษย์การบิน / พนักงานทั่วไป)</h5>
                    <p className="text-[10px] text-slate-500">PDF Document • ขนาด 4.2 MB</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-500 group-hover:text-sky-400 transition-transform group-hover:translate-x-1" />
              </a>

              <a 
                href="/manuals/admin-guide.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-slate-900/20 hover:bg-slate-900/60 border border-slate-850 hover:border-slate-800 rounded-2xl transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-200">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">คู่มือสำหรับผู้จัดการคลังพัสดุและผู้อนุมัติ (IT / Dispatch / Admin)</h5>
                    <p className="text-[10px] text-slate-500">PDF Document • ขนาด 5.8 MB</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          {/* Helpdesk Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-sky-400 uppercase tracking-widest font-heading">Support channels</h3>
              <h4 className="text-2xl font-bold text-white font-heading">ฝ่ายซัพพอร์ตการปฏิบัติการบิน</h4>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                หากบัญชีผู้ใช้ของคุณยังไม่ได้รับอนุมัติสิทธิ์การยืมเครื่องบิน หรือติดขัดในการอัปเดตข้อมูลเครื่องมือ สามารถติดต่อเจ้าหน้าที่รับเรื่องได้ตามหน่วยงานด้านล่างนี้
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* IT Admin Box */}
              <div className="p-5 bg-slate-900/35 border border-slate-900 hover:border-slate-800 rounded-2xl space-y-3 transition-colors duration-300">
                <div className="flex items-center gap-2.5 text-sky-400">
                  <Sliders size={18} />
                  <h5 className="text-xs font-bold text-white">ผู้ดูแลระบบ (IT Admin)</h5>
                </div>
                <ul className="space-y-2 text-[11px] text-slate-450 font-medium">
                  <li className="flex items-center gap-2">
                    <Mail size={13} className="text-slate-600" />
                    <span>it@thaiinterflying.com</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone size={13} className="text-slate-600" />
                    <span>สายตรง: เบอร์ต่อ 104 (ฝ่าย IT)</span>
                  </li>
                </ul>
              </div>

              {/* Warehouse Dispatch Box */}
              <div className="p-5 bg-slate-900/35 border border-slate-900 hover:border-slate-800 rounded-2xl space-y-3 transition-colors duration-300">
                <div className="flex items-center gap-2.5 text-indigo-400">
                  <Activity size={18} />
                  <h5 className="text-xs font-bold text-white">ฝ่ายคลังครุภัณฑ์พัสดุบิน</h5>
                </div>
                <ul className="space-y-2 text-[11px] text-slate-450 font-medium">
                  <li className="flex items-center gap-2">
                    <Mail size={13} className="text-slate-600" />
                    <span>warehouse@thaiinterflying.com</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone size={13} className="text-slate-600" />
                    <span>สายตรง: เบอร์ต่อ 112 (อาคารคลังเก็บเครื่อง)</span>
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
            <Link href="/login" className="hover:text-slate-350 transition-colors">เข้าสู่ระบบระบบ</Link>
            <span>•</span>
            <a href="https://thaiinterflying.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-350 transition-colors">เว็บไซต์สถาบันการบิน</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
