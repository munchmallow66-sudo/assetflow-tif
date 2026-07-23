'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
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
  const { user, loading } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-400">
            {t('loadingAuth')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden font-sans">

      {/* Background Hangar & Aircraft Overlay */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <Image
          src="/landing-bg.png"
          alt="Aviation Hangar Background"
          fill
          priority
          className="object-cover opacity-85 scale-105"
          unoptimized
        />
        {/* Deep aviation gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/65 to-slate-950" />
        {/* Glows simulating runway landing lights */}
        <div className="absolute top-[10%] left-[20%] w-[350px] h-[350px] bg-sky-500/10 rounded-full blur-[100px] animate-pulse duration-[6000ms]" />
        <div className="absolute top-[40%] right-[10%] w-[450px] h-[450px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse duration-[8000ms]" />
      </div>

      {/* Redesigned Premium Sticky Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 sm:pt-40 text-center flex flex-col items-center">

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white leading-tight tracking-tight max-w-4xl font-heading mb-6">
          {t('landingManageTools')} <br />
          <span className="bg-gradient-to-r from-sky-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
            {t('landingEasyPreciseSecure')}
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="text-slate-450 text-sm sm:text-base max-w-2xl font-medium leading-relaxed mb-8">
          {t('landingDesc')}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white font-bold rounded-full text-sm transition-all shadow-xl shadow-sky-500/10 hover:shadow-sky-500/20 hover:-translate-y-0.5 btn-press cursor-pointer flex items-center justify-center gap-2"
          >
            {t('landingLoginStart')}
            <ArrowRight size={16} />
          </Link>
          <a
            href="#manuals"
            className="w-full sm:w-auto px-8 py-4 bg-slate-900/80 hover:bg-slate-850 text-slate-300 font-semibold rounded-full text-sm border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <BookOpen size={16} className="text-sky-400" />
            {t('landingSystemGuide')}
          </a>
        </div>


      </section>

      {/* Bento Grid Features Section */}
      <section id="features" className="scroll-mt-28 relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-slate-900/85">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold text-sky-400 uppercase tracking-widest font-heading">System Capability</h2>
          <p className="text-3xl font-bold text-white tracking-wide font-heading">
            {t('landingPerformance')}
          </p>
          <p className="text-slate-400 text-sm">
            {t('landingPerformanceDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Card 1: QR Code Scan (Large - 2 cols) */}
          <div className="md:col-span-2 bg-gradient-to-br from-slate-900/70 to-slate-950/70 border border-slate-800/60 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 hover:border-slate-700/80 transition-all duration-300 shadow-xl relative overflow-hidden group">
            <div className="space-y-4 max-w-md z-10">
              <div className="w-12 h-12 bg-sky-500/10 rounded-xl border border-sky-500/25 flex items-center justify-center text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
                <QrCode size={22} />
              </div>
              <h3 className="text-lg font-bold text-white font-heading">
                {t('landingScanBorrowReturn')}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                {t('landingScanDesc')}
              </p>
            </div>
            {/* Visual Design for Card 1 */}
            <div className="relative w-full sm:w-48 h-36 bg-slate-950/60 rounded-2xl border border-slate-850 flex items-center justify-center shrink-0">
              <div className="w-24 h-24 border-2 border-dashed border-sky-500/40 rounded-xl flex items-center justify-center">
                <QrCode size={48} className="text-sky-500/60" />
              </div>
              <div className="absolute inset-x-4 h-0.5 bg-sky-400/80 blur-[1px] animate-pulse" style={{ top: '50%' }} />
            </div>
          </div>

          {/* Card 2: Real-time Status (Medium - 1 col) */}
          <div className="bg-slate-900/50 border border-slate-800/60 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-slate-700/80 transition-all duration-300 shadow-xl group">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl border border-amber-500/25 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                <Compass size={22} />
              </div>
              <h3 className="text-lg font-bold text-white font-heading">
                {t('landingTrackStatus')}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                {t('landingTrackDesc')}
              </p>
            </div>
          </div>

          {/* Card 3: Automated Approval Flow (Medium - 1 col) */}
          <div className="bg-slate-900/50 border border-slate-800/60 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-slate-700/80 transition-all duration-300 shadow-xl group">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                <ShieldCheck size={22} />
              </div>
              <h3 className="text-lg font-bold text-white font-heading">
                {t('landingApprovalSystem')}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                {t('landingApprovalDesc')}
              </p>
            </div>
          </div>

          {/* Card 4: Maintenance (Large - 2 cols) */}
          <div className="md:col-span-2 bg-gradient-to-br from-slate-900/70 to-slate-950/70 border border-slate-800/60 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 hover:border-slate-700/80 transition-all duration-300 shadow-xl relative overflow-hidden group">
            <div className="space-y-4 max-w-md z-10">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl border border-indigo-500/25 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                <BarChart3 size={22} />
              </div>
              <h3 className="text-lg font-bold text-white font-heading">
                {t('landingMaintenanceLog')}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                {t('landingMaintenanceDesc')}
              </p>
            </div>
            {/* Visual Design for Card 4 */}
            <div className="w-full sm:w-48 bg-slate-950/60 rounded-2xl border border-slate-850 p-4 space-y-2 shrink-0">
              <div className="flex items-center justify-between text-[9px] text-slate-500">
                <span>CHECKLIST</span>
                <span className="text-indigo-400 font-bold">DAILY</span>
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{t('landingCheckBattery')}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{t('landingCheckReadiness')}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{t('landingTestSystem')}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Manuals & Support Section */}
      <section id="manuals" className="scroll-mt-28 relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-slate-900/85">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

          {/* Guides column */}
          <div className="lg:col-span-6 space-y-8">
            <div>
              <h2 className="text-xs font-bold text-sky-400 uppercase tracking-widest font-heading mb-2">Guides & Manuals</h2>
              <h3 className="text-3xl font-bold text-white font-heading">
                {t('landingOperationsManual')}
              </h3>
              <p className="text-slate-450 text-sm mt-3 leading-relaxed">
                {t('landingManualDesc')}
              </p>
            </div>

            <div className="space-y-4">
              <a
                href="/manuals/user-guide.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-850 hover:border-slate-800 rounded-2xl transition-all duration-300 group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors duration-200">
                      {t('landingBorrowerGuide')}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">PDF Document • 4.2 MB</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-500 group-hover:text-sky-400 transition-transform group-hover:translate-x-1" />
              </a>

              <a
                href="/manuals/admin-guide.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-850 hover:border-slate-800 rounded-2xl transition-all duration-300 group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors duration-200">
                      {t('landingAdminGuide')}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">PDF Document • 5.8 MB</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          {/* Support Channels Column */}
          <div id="support" className="scroll-mt-28 lg:col-span-6 space-y-8">
            <div>
              <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-heading mb-2">Helpdesk Channels</h2>
              <h3 className="text-3xl font-bold text-white font-heading">
                {t('landingHelpdesk')}
              </h3>
              <p className="text-slate-450 text-sm mt-3 leading-relaxed">
                {t('landingSupportDesc')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-900/30 border border-slate-850 rounded-2xl space-y-4">
                <div className="flex items-center gap-2.5 text-sky-400">
                  <Sliders size={18} />
                  <h4 className="text-sm font-bold text-white">
                    {t('landingITAdmin')}
                  </h4>
                </div>
                <ul className="space-y-3 text-[11px] text-slate-450 font-medium">
                  <li className="flex items-center gap-2.5">
                    <Mail size={14} className="text-slate-600" />
                    <span>watchara.pho@tif.ac.th</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Phone size={14} className="text-slate-600" />
                    <span>{t('landingInternalExt')}</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 bg-slate-900/30 border border-slate-850 rounded-2xl space-y-4">
                <div className="flex items-center gap-2.5 text-indigo-400">
                  <Activity size={18} />
                  <h4 className="text-sm font-bold text-white">
                    {t('landingWarehouse')}
                  </h4>
                </div>
                <ul className="space-y-3 text-[11px] text-slate-450 font-medium">
                  <li className="flex items-center gap-2.5">
                    <Mail size={14} className="text-slate-600" />
                    <span>warehouse@tif.ac.th</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Phone size={14} className="text-slate-600" />
                    <span>{t('landingWarehouseExt')}</span>
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
            <Link href="/login" className="hover:text-slate-350 transition-colors">
              {t('landingFooter')}
            </Link>
            <span>•</span>
            <a href="https://thaiinterflying.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-350 transition-colors">
              {t('landingCompanyWebsite')}
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
