'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Search,
  Menu,
  X,
  Globe,
  User,
  LayoutDashboard,
  LogOut,
  Command,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  QrCode,
  Box,
  Tag,
  FolderOpen,
  Barcode,
  Fingerprint,
  Loader2
} from 'lucide-react';
import QRScannerModal from '@/components/common/QRScannerModal';
import api from '@/lib/api';

type AssetStatus = 'AVAILABLE' | 'BORROWED' | 'MAINTENANCE' | 'LOST' | 'RETIRED';

interface AssetSearchResult {
  id: string;
  assetCode: string;
  name: string;
  category: string;
  status: AssetStatus;
}

const SEARCH_DEBOUNCE_MS = 300;

export default function Header() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AssetSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [activeSection, setActiveSection] = useState('#');
  const [isMac, setIsMac] = useState(false);

  // Public QR Code Scan states
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [scannedAsset, setScannedAsset] = useState<any>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const searchModalRef = useRef<HTMLDivElement>(null);

  // Detect OS for keyboard shortcuts
  useEffect(() => {
    setIsMac(typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent));
  }, []);

  // Keyboard shortcut for Search (Ctrl + K or Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus search input when modal opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
      setSearchResults([]);
      setSearchFailed(false);
    }
  }, [isSearchOpen]);

  // Debounced registry lookup. The query is filtered server side, so the
  // browser never pulls the whole registry down to search it locally.
  // /api/assets requires a session, so anonymous visitors are asked to sign in
  // instead of firing a request that can only come back 401.
  useEffect(() => {
    const query = searchQuery.trim();

    if (!isSearchOpen || !user || !query) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchFailed(false);
      return;
    }

    setSearchLoading(true);
    setSearchFailed(false);
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/assets', { params: { q: query } });
        if (cancelled) return;
        setSearchResults(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (cancelled) return;
        setSearchResults([]);
        setSearchFailed(true);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    // Cancels the pending timer and makes any in-flight response a no-op, so a
    // slow earlier request cannot overwrite the results of a later keystroke.
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, isSearchOpen, user]);

  // Click outside listener for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Public QR scan handler
  const handlePublicScan = async (decodedText: string) => {
    try {
      const res = await fetch(`/api/assets/scan-public?code=${encodeURIComponent(decodedText)}`);
      if (!res.ok) {
        if (res.status === 404) {
          setScanError(language === 'th' ? 'ไม่พบข้อมูลครุภัณฑ์หรือรหัสที่สแกนในระบบ' : 'No asset matches this scanned code.');
        } else {
          setScanError(language === 'th' ? 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูลครุภัณฑ์' : 'Error checking asset info.');
        }
        setScannedAsset(null);
        setIsResultOpen(true);
        return;
      }
      const data = await res.json();
      setScannedAsset(data);
      setScanError(null);
      setIsResultOpen(true);
    } catch (err) {
      console.error('Scan lookup error:', err);
      setScanError(language === 'th' ? 'การเชื่อมต่อระบบล้มเหลว' : 'System connection failed.');
      setScannedAsset(null);
      setIsResultOpen(true);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).simScan = handlePublicScan;
    }
  }, []);

  // Scrollspy logic to highlight active section in navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // offset for sticky header

      if (window.scrollY < 80) {
        setActiveSection('#');
        return;
      }

      const sections = [
        { id: 'features', href: '#features' },
        { id: 'manuals', href: '#manuals' },
        { id: 'support', href: '#support' }
      ];

      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.href);
            return;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Run initially
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: t('landingHome'), href: '#' },
    { label: t('landingFeatures'), href: '#features' },
    { label: language === 'th' ? 'เอกสารระบบ' : 'Documentation', href: '#manuals' },
    { label: language === 'th' ? 'ติดต่อเรา' : 'Contact', href: '#support' },
  ];

  const getStatusBadge = (status: AssetStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">Available</span>;
      case 'BORROWED':
        return <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">Borrowed</span>;
      case 'MAINTENANCE':
        return <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md">Maintenance</span>;
      case 'LOST':
        return <span className="px-2 py-0.5 text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md">Lost</span>;
      case 'RETIRED':
        return <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20 rounded-md">Retired</span>;
    }
  };

  return (
    <>
      {/* Sticky Glassmorphic Header */}
      <div className="sticky top-0 left-0 right-0 w-full z-40 bg-[#08111F]/75 backdrop-blur-md border-b border-white/8 shadow-md">
        <header className="max-w-[1440px] h-16 mx-auto px-6 lg:px-12 flex items-center justify-between select-none">

          {/* Left Side: Logo and Branding */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <Image
              src="/logo.png?v=3"
              alt="TIF Logo"
              width={90}
              height={37}
              priority
              className="object-contain h-8 w-auto transition-transform duration-200 group-hover:scale-[1.02]"
              unoptimized
            />
            <div className="hidden sm:flex flex-col border-l border-white/10 pl-2.5">
              <span className="text-sm font-semibold tracking-tight text-white font-heading leading-tight">
                AssetFlow
              </span>
              <span className="text-[9px] font-medium text-slate-500 tracking-wider uppercase font-mono leading-none mt-0.5">
                Enterprise
              </span>
            </div>
          </Link>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-350">
            {navItems.map((item) => {
              const isActive = activeSection === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className="relative py-2 px-0.5 hover:text-white transition-colors duration-150 group font-sans animate-all"
                >
                  <span>{item.label}</span>
                  <span
                    className={`absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600 rounded-full transition-transform duration-150 origin-left ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                      }`}
                  />
                </a>
              );
            })}
          </nav>

          {/* Right Side Interactions */}
          <div className="flex items-center gap-4">

            {/* Global Search Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="hidden lg:flex items-center justify-between gap-3 px-3 py-1.5 text-xs text-slate-450 bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 hover:border-white/10 rounded-2xl cursor-pointer w-48 text-left transition-all duration-150 shadow-inner shadow-black/20 hover:text-slate-200"
            >
              <div className="flex items-center gap-2">
                <Search size={13} className="text-slate-500" />
                <span>{language === 'th' ? 'ค้นหาสินทรัพย์...' : 'Search Assets...'}</span>
              </div>
              <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-medium font-mono text-slate-500 bg-slate-950 border border-white/5 rounded-md shadow-sm">
                {isMac ? '⌘K' : 'Ctrl K'}
              </kbd>
            </button>

            {/* Mobile/Tablet Search Icon */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-150 cursor-pointer"
              title="Search Assets"
            >
              <Search size={18} />
            </button>

            {/* Desktop QR Scan Button */}
            <button
              type="button"
              onClick={() => setIsQRScannerOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 hover:border-sky-500/30 rounded-2xl cursor-pointer transition-all duration-150 shadow-inner select-none font-sans font-semibold"
              title={language === 'th' ? 'สแกน QR Code' : 'Scan QR Code'}
            >
              <QrCode size={13} />
              <span>{language === 'th' ? 'สแกน QR' : 'Scan QR'}</span>
            </button>

            {/* Mobile QR Scan Button */}
            <button
              type="button"
              onClick={() => setIsQRScannerOpen(true)}
              className="sm:hidden p-2 text-sky-400 hover:text-sky-300 hover:bg-white/5 rounded-xl transition-all duration-150 cursor-pointer"
              title="Scan QR Code"
            >
              <QrCode size={18} />
            </button>

            {/* Segmented Language Switcher */}
            <div className="relative flex items-center p-0.5 bg-slate-950/80 border border-white/5 rounded-full w-20 h-8 select-none">
              <div
                className={`absolute top-0.5 bottom-0.5 w-[36px] bg-blue-600 rounded-full transition-transform duration-200 ease-out shadow-sm shadow-blue-500/20 ${language === 'th' ? 'translate-x-0.5' : 'translate-x-[39px]'
                  }`}
              />
              <button
                type="button"
                onClick={() => setLanguage('th')}
                className={`relative z-10 w-1/2 text-center text-[10px] font-extrabold transition-colors duration-200 cursor-pointer ${language === 'th' ? 'text-white' : 'text-slate-400 hover:text-slate-205'
                  }`}
              >
                TH
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`relative z-10 w-1/2 text-center text-[10px] font-extrabold transition-colors duration-200 cursor-pointer ${language === 'en' ? 'text-white' : 'text-slate-400 hover:text-slate-205'
                  }`}
              >
                EN
              </button>
            </div>

            {/* Authentication / Login / Avatar */}
            {user ? (
              /* User Profile Dropdown */
              <div className="relative" ref={profileDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold font-heading border border-white/10 hover:border-white/20 hover:scale-[1.02] cursor-pointer shadow-md select-none transition-all"
                  title={user.name}
                >
                  {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2.5 w-64 bg-[#08111F] border border-white/8 rounded-2xl shadow-2xl p-2 z-50 text-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-4 py-3 border-b border-white/5 mb-1.5">
                      <p className="text-xs font-bold text-white truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">{user.email}</p>
                      <span className="inline-block px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-extrabold tracking-wider rounded-md mt-2 uppercase font-mono">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium rounded-xl hover:bg-white/5 hover:text-white transition-all duration-150 cursor-pointer"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <LayoutDashboard size={14} className="text-slate-400" />
                      <span>{language === 'th' ? 'ไปที่แดชบอร์ด' : 'Go to Dashboard'}</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-150 cursor-pointer text-left"
                    >
                      <LogOut size={14} />
                      <span>{language === 'th' ? 'ออกจากระบบ' : 'Logout'}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Premium Login Button */
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-md transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 select-none group"
              >
                <span>{t('landingLogin')}</span>
                <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            )}

            {/* Mobile Hamburger menu */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-150 cursor-pointer"
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

          </div>
        </header>
      </div>

      {/* Slide-out Mobile Navigation Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-72 bg-[#08111F]/95 backdrop-blur-2xl border-l border-white/8 shadow-2xl p-6 pt-24 flex flex-col gap-6 transform transition-transform duration-300 md:hidden ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <button
          onClick={() => setIsMenuOpen(false)}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-white/5 border border-white/5 rounded-xl cursor-pointer"
        >
          <X size={18} />
        </button>

        <nav className="flex flex-col gap-5 text-sm font-semibold text-slate-350">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
              className="hover:text-white py-2 border-b border-white/5 transition-colors cursor-pointer"
            >
              {item.label}
            </a>
          ))}

          {/* Mobile Search Trigger */}
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              setIsSearchOpen(true);
            }}
            className="flex items-center justify-between w-full px-4 py-3 bg-slate-905 border border-white/5 rounded-2xl text-xs text-slate-400 hover:text-slate-205 hover:bg-slate-800 transition-all text-left"
          >
            <div className="flex items-center gap-2.5">
              <Search size={14} className="text-slate-400" />
              <span>{language === 'th' ? 'ค้นหาครุภัณฑ์...' : 'Search Assets...'}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-white/5">
              Search
            </span>
          </button>

          {/* Mobile QR Scan Trigger */}
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              setIsQRScannerOpen(true);
            }}
            className="flex items-center justify-between w-full px-4 py-3 bg-sky-950/20 border border-sky-500/20 rounded-2xl text-xs text-sky-450 hover:text-sky-350 hover:bg-sky-950/30 transition-all text-left"
          >
            <div className="flex items-center gap-2.5">
              <QrCode size={14} className="text-sky-400" />
              <span>{language === 'th' ? 'สแกน QR ตรวจสอบ...' : 'Scan QR Verification...'}</span>
            </div>
            <span className="text-[10px] font-mono text-sky-500 bg-sky-950/50 px-1.5 py-0.5 rounded border border-sky-500/20">
              Scan
            </span>
          </button>

          {/* Mobile Login */}
          {!user ? (
            <Link
              href="/login"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-between w-full mt-4 px-5 py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-md transition-all text-center select-none"
            >
              <span>{t('landingLogin')}</span>
              <ArrowRight size={14} />
            </Link>
          ) : (
            <div className="mt-4 border-t border-white/5 pt-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                  {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-500 truncate font-mono">{user.email}</p>
                </div>
              </div>

              <Link
                href="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2.5 w-full py-2.5 text-xs font-medium text-slate-350 hover:text-white transition-all cursor-pointer"
              >
                <LayoutDashboard size={14} />
                <span>{language === 'th' ? 'ไปที่แดชบอร์ด' : 'Go to Dashboard'}</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  logout();
                }}
                className="flex items-center gap-2.5 w-full py-2.5 text-xs font-medium text-red-400 hover:text-red-350 transition-all cursor-pointer text-left mt-2"
              >
                <LogOut size={14} />
                <span>{language === 'th' ? 'ออกจากระบบ' : 'Logout'}</span>
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Backdrop overlay when mobile menu is open */}
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Command Palette (Search Overlay Modal) */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[#08111F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col scale-100"
            onClick={(e) => e.stopPropagation()}
            ref={searchModalRef}
          >
            {/* Input Header */}
            <div className="relative flex items-center gap-3 px-4 py-3.5 border-b border-white/5 bg-slate-950/40">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'th' ? 'พิมพ์ชื่อ หรือรหัสครุภัณฑ์เพื่อค้นหา...' : 'Search assets by name or code...'}
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 border-none outline-none focus:ring-0"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="text-[10px] select-none items-center gap-0.5 rounded border border-white/10 bg-slate-900 px-1.5 py-0.5 font-mono font-bold text-slate-500 shadow-sm shrink-0 flex hover:text-white transition-colors cursor-pointer"
              >
                ESC
              </button>
            </div>

            {/* Results Panel */}
            <div className="max-h-[350px] overflow-y-auto p-2.5 space-y-1">
              {!user ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-2 px-6 text-center">
                  <ShieldCheck size={20} className="text-slate-500" />
                  <span className="text-xs font-medium leading-relaxed">
                    {language === 'th'
                      ? 'กรุณาเข้าสู่ระบบเพื่อค้นหาครุภัณฑ์ในทะเบียนจริง'
                      : 'Sign in to search the live asset registry.'}
                  </span>
                </div>
              ) : !searchQuery.trim() ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-2 px-6 text-center">
                  <Search size={20} className="text-slate-500" />
                  <span className="text-xs font-medium leading-relaxed">
                    {language === 'th'
                      ? 'พิมพ์รหัสครุภัณฑ์ หรือชื่อครุภัณฑ์เพื่อเริ่มค้นหา'
                      : 'Type an asset code or name to start searching.'}
                  </span>
                </div>
              ) : searchLoading ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-2">
                  <Loader2 size={20} className="animate-spin text-blue-400" />
                  <span className="text-xs font-medium">
                    {language === 'th' ? 'กำลังค้นหาครุภัณฑ์...' : 'Searching assets...'}
                  </span>
                </div>
              ) : searchFailed ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-2 px-6 text-center">
                  <AlertTriangle size={20} className="text-amber-400" />
                  <span className="text-xs font-medium leading-relaxed">
                    {language === 'th'
                      ? 'ไม่สามารถเชื่อมต่อกับระบบทะเบียนครุภัณฑ์ได้ กรุณาลองใหม่อีกครั้ง'
                      : 'Could not reach the asset registry. Please try again.'}
                  </span>
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-3 py-1.5 select-none">
                    {language === 'th'
                      ? `ผลการค้นหา (${searchResults.length})`
                      : `Search Results (${searchResults.length})`}
                  </div>
                  <div className="space-y-1">
                    {searchResults.map((asset) => (
                      <div
                        key={asset.id}
                        className="flex items-center justify-between w-full p-2.5 bg-slate-900/30 border border-white/5 rounded-xl"
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-slate-200 truncate">{asset.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5">{asset.assetCode}</span>
                        </div>
                        {getStatusBadge(asset.status)}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-2">
                  <AlertTriangle size={20} className="text-slate-500" />
                  <span className="text-xs font-medium">
                    {language === 'th' ? 'ไม่พบครุภัณฑ์' : 'No matching assets found'}
                  </span>
                </div>
              )}
            </div>

            {/* Footer Ban / Banner */}
            <div className="px-4 py-3 bg-slate-950 border-t border-white/5 flex flex-col xs:flex-row items-center justify-between gap-2.5">
              <span className="text-[10px] font-medium text-slate-400 text-center xs:text-left leading-relaxed">
                {language === 'th'
                  ? '🔒 เข้าสู่ระบบสมาชิกเพื่อทำการเบิกยืม หรือตรวจสอบข้อมูลแบบเรียลไทม์'
                  : '🔒 Sign in to access the live registry & submit borrow requests.'}
              </span>
              <Link
                href="/login"
                onClick={() => setIsSearchOpen(false)}
                className="px-3 py-1 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-all shrink-0 shadow-md shadow-blue-500/10 cursor-pointer"
              >
                {language === 'th' ? 'เข้าสู่ระบบ' : 'Sign In'}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal for Public Lookup */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScan={handlePublicScan}
        title={language === 'th' ? 'สแกน QR Code ตรวจสอบผู้ยืม' : 'Scan QR Code to Verify Borrower'}
      />

      {/* Scanned Asset Result Modal */}
      {isResultOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsResultOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#0b1528]/95 backdrop-blur-md border border-slate-800 rounded-3xl shadow-[0_0_50px_-12px_rgba(56,189,248,0.15)] overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-white/5 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.1)]">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-wide">{t('scanResultTitle')}</h3>
                  <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest font-mono">Verification System</p>
                </div>
              </div>
              <button
                onClick={() => setIsResultOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer active:scale-95 duration-150"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {scanError ? (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                    <AlertTriangle size={28} className="animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">{t('scanErrorTitle')}</h4>
                    <p className="text-xs text-red-400/80 max-w-[280px] leading-relaxed font-medium">{scanError}</p>
                  </div>
                </div>
              ) : scannedAsset ? (
                <div className="space-y-5">

                  {/* Asset Main Details Card */}
                  <div className="relative group overflow-hidden bg-slate-900 border border-white/5 rounded-2xl p-5 space-y-4 shadow-inner">

                    {/* Asset Name with icon */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                        <Box size={20} className="animate-pulse" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Asset Name</span>
                        <h4 className="text-sm font-bold text-white leading-snug tracking-wide group-hover:text-sky-300 transition-colors">
                          {scannedAsset.name}
                        </h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5">
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Fingerprint size={12} className="text-sky-500" />
                          <span>Code</span>
                        </span>
                        <p className="text-xs font-mono font-semibold text-white bg-slate-950/50 px-2.5 py-1.5 rounded-lg border border-white/5 inline-block select-all">
                          {scannedAsset.assetCode}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Tag size={12} className="text-sky-500" />
                          <span>Category</span>
                        </span>
                        <p className="text-xs font-semibold text-slate-200 bg-slate-950/50 px-2.5 py-1.5 rounded-lg border border-white/5 inline-block">
                          {scannedAsset.category}
                        </p>
                      </div>
                    </div>

                    {scannedAsset.serialNumber && (
                      <div className="space-y-1 pt-3 border-t border-white/5">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Barcode size={12} className="text-sky-500" />
                          <span>Serial Number</span>
                        </span>
                        <p className="text-xs font-mono font-semibold text-slate-200 bg-slate-950/50 px-2.5 py-1.5 rounded-lg border border-white/5 block select-all">
                          {scannedAsset.serialNumber}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Status & Borrower Info */}
                  <div className="space-y-2.5">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block px-1">
                      {t('currentBorrower')}
                    </span>

                    {scannedAsset.status === 'BORROWED' && scannedAsset.currentHolder ? (
                      <div className="relative overflow-hidden bg-slate-900 border border-blue-500/20 rounded-2xl p-5 space-y-4 shadow-[0_4px_20px_-4px_rgba(59,130,246,0.15)]">

                        <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                          <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                            <User size={18} />
                          </div>
                          <div className="space-y-0.5">
                            <h5 className="text-sm font-bold text-white">
                              {scannedAsset.currentHolder.firstName} {scannedAsset.currentHolder.lastName}
                            </h5>
                            <span className="inline-flex items-center px-2.5 py-0.5 mt-1 text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
                              {scannedAsset.currentHolder.department}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 pt-1">
                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Department</span>
                            <span className="text-xs font-bold text-slate-350 block truncate" title={scannedAsset.currentHolder.department}>
                              {scannedAsset.currentHolder.department}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : scannedAsset.status === 'AVAILABLE' ? (
                      <div className="relative overflow-hidden bg-slate-900 border border-emerald-500/20 rounded-2xl p-5 flex gap-4 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.15)]">

                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                          <CheckCircle2 size={20} className="animate-pulse" />
                        </div>
                        <div className="space-y-1 py-0.5">
                          <p className="text-xs font-bold text-emerald-400">{t('noBorrowerText')}</p>
                          <p className="text-[11px] text-slate-400 leading-relaxed font-medium">{t('availableStatusDesc')}</p>
                        </div>
                      </div>
                    ) : scannedAsset.status === 'MAINTENANCE' ? (
                      <div className="relative overflow-hidden bg-slate-900 border border-amber-500/20 rounded-2xl p-5 flex gap-4 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.15)]">

                        <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                          <Clock size={20} className="animate-pulse" />
                        </div>
                        <div className="space-y-1 py-0.5">
                          <p className="text-xs font-bold text-amber-400">{language === 'th' ? 'อยู่ระหว่างซ่อมบำรุง' : 'Under Maintenance'}</p>
                          <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                            {language === 'th'
                              ? 'ครุภัณฑ์ชิ้นนี้ถูกงดให้บริการชั่วคราวเนื่องจากอยู่ระหว่างซ่อมแซมบำรุงรักษา'
                              : 'This asset is temporarily out of service for repairs and routine maintenance.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="relative overflow-hidden bg-slate-900 border border-white/5 rounded-2xl p-4 text-center">
                        <p className="text-xs font-bold text-slate-400">สถานะ: {scannedAsset.status}</p>
                      </div>
                    )}
                  </div>

                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950/60 border-t border-white/5 flex justify-end">
              <button
                onClick={() => setIsResultOpen(false)}
                className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-95 duration-200 cursor-pointer shadow-md shadow-sky-500/10 hover:shadow-sky-500/25 border-none"
              >
                {language === 'th' ? 'ตกลง' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
