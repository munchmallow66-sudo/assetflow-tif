'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Plane, ShieldCheck, Cpu, Radio, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface LoginLoadingOverlayProps {
  isVisible: boolean;
  type?: 'login' | 'register';
}

export function LoginLoadingOverlay({ isVisible, type = 'login' }: LoginLoadingOverlayProps) {
  const { language } = useLanguage();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setStep(0);
      return;
    }

    const timer1 = setTimeout(() => setStep(1), 600);
    const timer2 = setTimeout(() => setStep(2), 1400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const isLogin = type === 'login';

  const thSteps = isLogin
    ? [
        { code: '01', title: 'กำลังตรวจสอบข้อมูลผู้ใช้งาน', desc: 'Authenticating credentials' },
        { code: '02', title: 'เชื่อมต่อเครือข่าย TIF AssetFlow', desc: 'Securing encrypted channel' },
        { code: '03', title: 'อนุมัติการเข้าถึงระบบสำเร็จ', desc: 'Initializing Flight Deck' },
      ]
    : [
        { code: '01', title: 'ตรวจสอบข้อมูลพนักงาน', desc: 'Validating employee record' },
        { code: '02', title: 'สร้างบัญชีผู้ใช้งานใหม่', desc: 'Creating security profile' },
        { code: '03', title: 'ลงทะเบียนสำเร็จในระบบ', desc: 'Registration completed' },
      ];

  const enSteps = isLogin
    ? [
        { code: '01', title: 'Verifying User Credentials', desc: 'Checking authorization' },
        { code: '02', title: 'Connecting to TIF Network', desc: 'Securing encrypted channel' },
        { code: '03', title: 'Access Granted Successfully', desc: 'Initializing Flight Deck' },
      ]
    : [
        { code: '01', title: 'Validating Employee Info', desc: 'Checking internal database' },
        { code: '02', title: 'Creating User Account', desc: 'Generating security token' },
        { code: '03', title: 'Registration Successful', desc: 'Account ready for sign-in' },
      ];

  const currentSteps = language === 'th' ? thSteps : enSteps;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xl animate-fade-in p-4 select-none">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main HUD Card */}
      <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-700/60 rounded-3xl p-8 shadow-2xl shadow-sky-950/80 backdrop-blur-2xl overflow-hidden text-center text-white border-t-sky-500/40 animate-scale-in">
        
        {/* HUD Corner Brackets */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-sky-400/70" />
        <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-sky-400/70" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-sky-400/70" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-sky-400/70" />

        {/* Scan line effect overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          <div className="absolute left-0 right-0 h-16 bg-gradient-to-b from-sky-400/10 via-sky-400/5 to-transparent animate-scan-line" />
        </div>

        {/* Central Aviation Radar & Jet Icon */}
        <div className="relative mx-auto w-36 h-36 flex items-center justify-center mb-6">
          {/* Radar Outer Ring with dashed lines */}
          <div className="absolute inset-0 rounded-full border border-sky-500/30 border-dashed animate-radar-spin" />
          
          {/* Radar Inner Ring */}
          <div className="absolute inset-2 rounded-full border border-indigo-400/20 animate-radar-spin-reverse" />
          
          {/* Glowing Aura Ring */}
          <div className="absolute inset-5 rounded-full bg-gradient-to-tr from-sky-500/20 to-cyan-400/10 border border-sky-400/40 animate-glow-pulse" />
          
          {/* Radar Sweep Line */}
          <div className="absolute inset-0 rounded-full animate-radar-spin origin-center pointer-events-none">
            <div className="w-1/2 h-1/2 bg-gradient-to-br from-sky-400/30 to-transparent rounded-tl-full" />
          </div>

          {/* Central Logo & Airplane Icon */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="p-3 bg-slate-900/90 rounded-full border border-sky-400/50 shadow-lg shadow-sky-500/30 animate-plane-takeoff">
              <Plane className="w-9 h-9 text-sky-400 -rotate-45 transform" />
            </div>
          </div>
        </div>

        {/* Brand & Subtitle */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800/80 border border-sky-500/30 rounded-full mb-3 shadow-inner">
            <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-widest text-sky-300 uppercase">
              TIF ASSETFLOW SYS-AUTH
            </span>
          </div>

          <h3 className="text-xl font-bold text-white tracking-wide">
            {language === 'th' ? 'THAI INTER FLYING' : 'THAI INTER FLYING'}
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {isLogin
              ? (language === 'th' ? 'ระบบเตรียมความพร้อมแดชบอร์ดสินทรัพย์' : 'Preparing Aviation Asset Dashboard')
              : (language === 'th' ? 'กำลังลงทะเบียนสมาชิกใหม่' : 'Processing User Registration')}
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full bg-slate-950/80 border border-slate-800 rounded-full p-1 mb-6 shadow-inner">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-indigo-500 transition-all duration-700 ease-out shadow-md shadow-sky-500/50"
            style={{ width: `${((step + 1) / 3) * 100}%` }}
          />
        </div>

        {/* Dynamic Status Steps List */}
        <div className="space-y-2.5 text-left bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 mb-6">
          {currentSteps.map((s, idx) => {
            const isActive = idx === step;
            const isDone = idx < step;
            return (
              <div
                key={s.code}
                className={`flex items-center justify-between p-2 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-sky-500/10 border border-sky-500/40 text-sky-300 shadow-sm'
                    : isDone
                    ? 'bg-slate-900/40 text-emerald-400/90'
                    : 'opacity-40 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="shrink-0 font-mono text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-semibold">
                    {s.code}
                  </div>
                  <div>
                    <div className="text-xs font-semibold tracking-wide">
                      {s.title}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {s.desc}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 pl-2">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-scale-in" />
                  ) : isActive ? (
                    <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-700" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Technical Telemetry Info */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800/80">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-sky-400" />
            <span>ENCRYPTED TLS 1.3</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-indigo-400" />
            <span>FLIGHT-OPS READY</span>
          </span>
        </div>

      </div>
    </div>
  );
}
