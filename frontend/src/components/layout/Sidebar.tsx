'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import { useLanguage } from '../providers/LanguageProvider';
import api from '@/lib/api';
import {
  LayoutDashboard,
  Box,
  ClipboardList,
  History,
  FileBarChart2,
  Users,
  UserCheck,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Activity
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [storageUtil, setStorageUtil] = useState(76);
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        const statsRes = await api.get('/reports/dashboard');
        if (statsRes.data) {
          if (statsRes.data.totalAssets > 0) {
            const util = Math.round((statsRes.data.borrowedAssets / statsRes.data.totalAssets) * 100);
            setStorageUtil(util);
          }
          if (typeof statsRes.data.pendingRequests === 'number') {
            setPendingCount(statsRes.data.pendingRequests);
          }
        }
      } catch (err) {
        console.error('Failed to load sidebar stats', err);
      }
    };
    if (user) {
      fetchSidebarData();
    }
  }, [user]);

  if (!user) return null;

  const role = user.role;

  // Grouped Navigation Structure for clear UX hierarchy
  const navigationGroups = [
    {
      title: language === 'th' ? 'เมนูหลัก' : 'MAIN MENU',
      links: [
        {
          href: '/dashboard',
          label: t('dashboard'),
          icon: LayoutDashboard,
          roles: ['ADMIN', 'STAFF', 'APPROVER', 'VIEWER'],
        },
        {
          href: '/assets',
          label: t('assets'),
          icon: Box,
          roles: ['ADMIN', 'STAFF', 'APPROVER', 'VIEWER'],
        },
      ],
    },
    {
      title: language === 'th' ? 'การดำเนินงาน' : 'OPERATIONS',
      links: [
        {
          href: '/borrow',
          label: t('transactions'),
          icon: ClipboardList,
          roles: ['ADMIN', 'STAFF', 'APPROVER'],
          badge: pendingCount > 0 ? pendingCount : null,
        },
        {
          href: '/returns',
          label: t('returns'),
          icon: History,
          roles: ['ADMIN', 'APPROVER', 'VIEWER'],
        },
        {
          href: '/reports',
          label: t('reports'),
          icon: FileBarChart2,
          roles: ['ADMIN', 'APPROVER', 'VIEWER'],
        },
      ],
    },
    {
      title: language === 'th' ? 'การจัดการระบบ' : 'ADMINISTRATION',
      links: [
        {
          href: '/users',
          label: t('users'),
          icon: Users,
          roles: ['ADMIN'],
        },
        {
          href: '/employees',
          label: role === 'ADMIN' ? t('employees') : (language === 'th' ? 'รายชื่อพนักงาน' : 'Employees'),
          icon: UserCheck,
          roles: ['ADMIN', 'APPROVER', 'STAFF', 'VIEWER'],
        },
        {
          href: '/settings',
          label: t('settings'),
          icon: Settings,
          roles: ['ADMIN', 'STAFF', 'APPROVER', 'VIEWER'],
        },
      ],
    },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-3 left-4 z-50">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
          className="p-2.5 bg-[#0b0e14]/90 hover:bg-[#121622] text-white rounded-xl border border-slate-800 shadow-xl backdrop-blur-md cursor-pointer transition-all active:scale-95"
        >
          {isOpen ? <X size={20} className="text-sky-400" /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Container - Modern Glassmorphic Dark Aesthetic */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#080a0f] text-slate-300 flex flex-col justify-between border-r border-slate-800/80 shadow-2xl transition-transform duration-300 transform lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Logo Brand Header */}
          <div className="h-20 flex items-center justify-between border-b border-slate-800/60 px-5 shrink-0 bg-gradient-to-b from-[#0c0f17] to-[#080a0f] relative overflow-hidden">
            {/* Background Ambient Glow */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -top-10 right-0 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3 z-10">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-slate-700/60 shadow-inner group">
                <div className="absolute inset-0 bg-sky-500/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Image
                  src="/logo.png?v=3"
                  alt="Thai Inter Flying Logo"
                  width={34}
                  height={14}
                  className="object-contain relative z-10 transition-transform duration-300 group-hover:scale-105"
                  unoptimized
                />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-[13px] tracking-wide text-white font-sans leading-none">
                    THAI INTER FLYING
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-sky-500/15 to-indigo-500/15 border border-sky-500/30 text-[8px] font-bold text-sky-400 tracking-wider uppercase">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    ASSETFLOW PORTAL
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile close icon inside header */}
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Nav Links with Group Headings */}
          <nav className="p-3.5 space-y-5 flex-1">
            {navigationGroups.map((group, groupIdx) => {
              const visibleLinks = group.links.filter((link) => link.roles.includes(role));
              if (visibleLinks.length === 0) return null;

              return (
                <div key={groupIdx} className="space-y-1.5">
                  <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono select-none">
                      {group.title}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {visibleLinks.map((link) => {
                      const Icon = link.icon;
                      const isActive = pathname === link.href || pathname.startsWith(link.href + '/');

                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className={`relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                            isActive
                              ? 'bg-gradient-to-r from-sky-500/15 via-indigo-500/10 to-transparent text-white border border-sky-500/30 shadow-md shadow-sky-500/5 font-bold'
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent group'
                          }`}
                        >
                          {/* Active Indicator bar */}
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-gradient-to-b from-cyan-400 via-sky-500 to-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
                          )}

                          <div className="flex items-center gap-3">
                            <Icon
                              size={16}
                              className={`transition-all duration-200 ${
                                isActive
                                  ? 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]'
                                  : 'text-slate-400 group-hover:text-slate-200 group-hover:scale-110'
                              }`}
                            />
                            <span className="tracking-wide">{link.label}</span>
                          </div>

                          {/* Optional Live Badge Counter */}
                          {link.badge !== undefined && link.badge !== null && link.badge > 0 && (
                            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse shadow-sm shadow-amber-500/20 font-mono">
                              {link.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Capacity / Storage Section */}
        <div className="px-4 py-3.5 border-t border-slate-800/60 shrink-0 bg-[#080a0f]">
          <div className="bg-[#0d1017]/80 border border-slate-800/80 rounded-2xl p-3 shadow-inner hover:border-slate-700/60 transition-colors">
            <div className="flex justify-between items-center text-[10px] font-bold mb-2 uppercase tracking-wider select-none">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Activity size={12} className="text-sky-400" />
                <span>{t('storageCapacity')}</span>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono text-[10px] font-extrabold">
                {storageUtil}%
              </span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800/80">
              <div
                className="h-full bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(99,102,241,0.6)]"
                style={{ width: `${storageUtil}%` }}
              />
            </div>
            <p className="text-[9px] text-slate-500 mt-2 flex items-center justify-between font-mono">
              <span>{language === 'th' ? 'อัตราการหมุนเวียนคลัง' : 'Asset turnover rate'}</span>
              <span className="text-emerald-400 font-semibold">{language === 'th' ? 'สถานะปกติ' : 'Optimal'}</span>
            </p>
          </div>
        </div>

        {/* Profile Card & Footer Actions */}
        <div className="p-3.5 border-t border-slate-800/60 bg-[#07090e] shrink-0 space-y-3">
          {/* User Info Tile */}
          <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-slate-900/90 to-[#0b0e15]/90 rounded-2xl border border-slate-800/80 shadow-md">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 via-indigo-500 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-md border border-white/10 select-none">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="w-2.5 h-2.5 bg-emerald-500 ring-2 ring-[#080a0f] rounded-full absolute bottom-0 right-0 animate-pulse" />
            </div>
            <div className="overflow-hidden flex-1">
              <p className="font-bold text-xs text-white truncate leading-tight">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/25 text-[8px] font-black uppercase tracking-wider">
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          {/* Action Control Buttons */}
          <div className="flex gap-2">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center p-2.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800/80 rounded-xl text-xs font-medium transition-all cursor-pointer border border-slate-800 active:scale-95"
              title={
                theme === 'dark'
                  ? language === 'th'
                    ? 'สลับเป็นโหมดสว่าง'
                    : 'Switch to Light Mode'
                  : language === 'th'
                  ? 'สลับเป็นโหมดมืด'
                  : 'Switch to Dark Mode'
              }
            >
              {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
            </button>

            {/* Language Toggle */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex-1 flex items-center justify-center p-2.5 text-slate-400 hover:text-sky-300 hover:bg-slate-800/80 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer border border-slate-800 font-mono select-none active:scale-95"
              title={language === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
            >
              {language === 'th' ? 'EN' : 'TH'}
            </button>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="flex-[1.5] flex items-center justify-center gap-1.5 p-2.5 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-bold transition-all border border-rose-900/30 cursor-pointer active:scale-95 group"
              title={language === 'th' ? 'ออกจากระบบ' : 'Log Out'}
            >
              <LogOut size={14} className="group-hover:translate-x-0.5 transition-transform" />
              <span>{language === 'th' ? 'ออกจากระบบ' : 'Log Out'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="lg:hidden fixed inset-0 z-30 bg-black/70 backdrop-blur-sm transition-opacity"
        />
      )}
    </>
  );
}

