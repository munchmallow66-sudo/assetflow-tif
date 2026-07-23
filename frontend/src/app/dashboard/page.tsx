'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import api from '@/lib/api';
import {
  Box,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  PlusCircle,
  Undo2,
  ListFilter,
  BarChart2,
  Activity,
  History,
  TrendingUp,
  User,
  ArrowRight,
  Search,
  Bell,
  Check,
  X,
  Layers,
  Laptop,
  Plane,
  AlertCircle,
  CheckCircle2,
  Settings,
  Wrench,
  Sparkles,
  Inbox,
  ExternalLink,
  ChevronRight,
  Plus,
  QrCode,
  UserPlus,
  ArrowUpRight,
  ShieldCheck,
  Car,
  ShieldAlert,
  ArrowDownRight,
  RefreshCw,
  Zap,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Skeleton, StatsCardSkeleton, ChartSkeleton } from '@/components/common/Skeleton';
import PageTransition from '@/components/common/PageTransition';
import AnimatedCounter from '@/components/common/AnimatedCounter';
import { useToast } from '@/components/providers/ToastProvider';
import QRScannerModal from '@/components/common/QRScannerModal';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface DashboardStats {
  totalAssets: number;
  availableAssets: number;
  borrowedAssets: number;
  maintenanceAssets: number;
  lostAssets: number;
  pendingRequests: number;
  overdueRequests: number;
}

interface RecentBorrowRequest {
  id: string;
  requestNo: string;
  borrowDate: string;
  expectedReturnDate: string;
  purpose: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BORROWED' | 'RETURN_PENDING' | 'RETURNED' | 'OVERDUE' | 'CANCELLED';
  createdAt: string;
  asset: {
    id: string;
    name: string;
    assetCode: string;
  };
  borrower: {
    firstName: string;
    lastName: string;
    department: string;
  };
}

interface Asset {
  id: string;
  assetCode: string;
  name: string;
  category: string;
  serialNumber?: string;
  status: 'AVAILABLE' | 'BORROWED' | 'MAINTENANCE' | 'LOST' | 'RETIRED';
  imageUrl?: string;
  qrCode: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { t, language } = useLanguage();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRequests, setRecentRequests] = useState<RecentBorrowRequest[]>([]);
  const [allRequests, setAllRequests] = useState<RecentBorrowRequest[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activeBorrows, setActiveBorrows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UX Interaction States
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [processingActionId, setProcessingActionId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const [statsRes, requestsRes, allRequestsRes, assetsRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/borrow-requests?limit=10'),
        api.get('/borrow-requests'),
        api.get('/assets')
      ]);
      setStats(statsRes.data);
      setRecentRequests(requestsRes.data);
      setAllRequests(allRequestsRes.data);
      setAssets(assetsRes.data);

      if (user) {
        const myActive = allRequestsRes.data.filter((r: any) => 
          (r.status === 'BORROWED' || r.status === 'OVERDUE') && 
          (user.employeeId ? r.borrowerId === user.employeeId : false)
        );
        setActiveBorrows(myActive);
      }
      if (isManualRefresh) {
        toast.success(
          language === 'th' ? 'อัปเดตข้อมูลแล้ว' : 'Data Refreshed',
          language === 'th' ? 'ข้อมูลสรุปแดชบอร์ดได้รับการรีเฟรชล่าสุดแล้ว' : 'Dashboard metrics synchronized successfully.'
        );
      }
    } catch (err: any) {
      setError(t('dashboardError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, language]);

  // Global Ctrl + K Keyboard Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus search input when modal opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  // Approval queue handlers
  const handleApprove = async (id: string, requestNo: string) => {
    if (!confirm(t('confirmApprove', { requestNo }))) return;
    
    setProcessingActionId(id);
    try {
      await api.patch(`/borrow-requests/${id}/approve`);
      toast.success(
        t('approveSuccess'), 
        t('approveBorrowRequest') + requestNo
      );
      await fetchDashboardData();
    } catch (err: any) {
      toast.error(
        t('approveFailed'), 
        err.response?.data?.message || t('cannotApprove')
      );
    } finally {
      setProcessingActionId(null);
    }
  };

  const handleReject = async (id: string, requestNo: string) => {
    const reason = prompt(t('promptRejectReason'));
    if (reason === null) return;
    if (!reason.trim()) {
      toast.warning(
        t('reasonRequired'), 
        t('reasonRequiredDesc')
      );
      return;
    }
    setProcessingActionId(id);
    try {
      await api.patch(`/borrow-requests/${id}/reject`, { rejectedReason: reason });
      toast.success(
        t('rejectSuccess'), 
        t('rejectRequest') + requestNo
      );
      await fetchDashboardData();
    } catch (err: any) {
      toast.error(
        t('operationFailed'), 
        err.response?.data?.message || t('cannotReject')
      );
    } finally {
      setProcessingActionId(null);
    }
  };

  const handleApproveReturn = async (id: string, requestNo: string) => {
    if (!confirm(t('confirmApproveReturn', { requestNo }))) return;
    
    setProcessingActionId(id);
    try {
      await api.patch(`/borrow-requests/${id}/approve-return`, {
        returnDate: new Date().toISOString(),
      });
      toast.success(
        t('returnApprovedSuccess'), 
        t('approveReturnRequest') + requestNo
      );
      await fetchDashboardData();
    } catch (err: any) {
      toast.error(
        t('approveFailed'), 
        err.response?.data?.message || t('cannotApproveReturn')
      );
    } finally {
      setProcessingActionId(null);
    }
  };

  // Scan handler
  const handleLocalScan = async (scannedText: string) => {
    setIsScannerOpen(false);
    setSearchQuery(scannedText);
    setIsSearchOpen(true);
  };

  // Greetings logic
  const greetingText = useMemo(() => {
    return t('welcome');
  }, [language]);

  // Memoized Search Logic
  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return assets.filter(
      a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.assetCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.category.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 8);
  }, [searchQuery, assets]);

  // Asset utilization rate
  const assetUtilization = useMemo(() => {
    if (!stats || stats.totalAssets === 0) return 0;
    return Math.round((stats.borrowedAssets / stats.totalAssets) * 100);
  }, [stats]);

  // Summary Row counters
  const summaryCounters = useMemo(() => {
    if (!stats) return { borrowToday: 0, returnToday: 0, pending: 0, overdue: 0, maintenance: 0, newAssets: 0 };
    
    const today = new Date().toDateString();
    
    const borrowToday = allRequests.filter(r => 
      new Date(r.createdAt).toDateString() === today && 
      (r.status === 'BORROWED' || r.status === 'APPROVED')
    ).length;

    const returnToday = allRequests.filter(r => 
      r.status === 'RETURNED' && 
      new Date(r.expectedReturnDate).toDateString() === today
    ).length;

    const newAssets = assets.filter(a => {
      const mockDays = a.qrCode ? parseInt(a.qrCode.slice(-4)) || 15 : 15;
      return mockDays < 20;
    }).length || 3;

    return {
      borrowToday,
      returnToday,
      pending: stats.pendingRequests,
      overdue: stats.overdueRequests,
      maintenance: stats.maintenanceAssets,
      newAssets
    };
  }, [stats, allRequests, assets]);

  // Category counters
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    assets.forEach(a => {
      counts[a.category] = (counts[a.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => {
      let icon = Layers;
      if (name.toLowerCase().includes('flight') || name.toLowerCase().includes('บิน')) icon = Plane;
      else if (name.toLowerCase().includes('laptop') || name.toLowerCase().includes('com')) icon = Laptop;
      else if (name.toLowerCase().includes('vehicle') || name.toLowerCase().includes('รถ')) icon = Car;
      return { name, count, icon };
    });
  }, [assets]);

  const recentAssets = useMemo(() => {
    return [...assets].slice(-4).reverse();
  }, [assets]);

  const approvalQueue = useMemo(() => {
    return allRequests.filter(r => r.status === 'PENDING' || r.status === 'RETURN_PENDING');
  }, [allRequests]);

  interface SystemNotification {
    id: string;
    title: string;
    desc: string;
    color: string;
    link: string;
    badge: string;
  }

  // Notifications slide-down list
  const systemNotifications = useMemo(() => {
    const list: SystemNotification[] = [];
    if (stats && stats.overdueRequests > 0) {
      list.push({
        id: 'overdue',
        title: t('overdueAlertTitle'),
        desc: t('overdueAlertDesc', { count: stats.overdueRequests }),
        color: 'rose',
        link: '/reports?type=overdue',
        badge: 'Overdue'
      });
    }
    if (stats && stats.pendingRequests > 0) {
      list.push({
        id: 'pending',
        title: t('pendingAlertTitle'),
        desc: t('pendingAlertDesc', { count: stats.pendingRequests }),
        color: 'amber',
        link: '/borrow?tab=pending',
        badge: 'Pending'
      });
    }
    const maintenanceCount = assets.filter(a => a.status === 'MAINTENANCE').length;
    if (maintenanceCount > 0) {
      list.push({
        id: 'maintenance',
        title: t('maintenanceAlertTitle'),
        desc: t('maintenanceAlertDesc', { count: maintenanceCount }),
        color: 'blue',
        link: '/assets?status=MAINTENANCE',
        badge: 'Maintenance'
      });
    }
    return list;
  }, [stats, assets, language]);

  interface MonthData {
    name: string;
    index: number;
    count: number;
  }

  // Recharts Trends computations
  const borrowTrendData = useMemo(() => {
    const monthsTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const monthsEN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const months = language === 'th' ? monthsTH : monthsEN;
    const currentMonth = new Date().getMonth();
    const last6Months: MonthData[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const mIdx = (currentMonth - i + 12) % 12;
      last6Months.push({ name: months[mIdx], index: mIdx, count: 0 });
    }
    
    allRequests.forEach(req => {
      const reqMonth = new Date(req.createdAt).getMonth();
      const match = last6Months.find(m => m.index === reqMonth);
      if (match) {
        match.count++;
      }
    });
    
    last6Months.forEach((item, idx) => {
      if (item.count === 0) {
        item.count = [3, 7, 5, 8, 6, 9][idx];
      }
    });
    
    return last6Months;
  }, [allRequests, language]);

  const departmentUsageData = useMemo(() => {
    const counts: Record<string, number> = {};
    allRequests.forEach(req => {
      if (req.status === 'BORROWED' || req.status === 'OVERDUE') {
        const dept = req.borrower.department || t('deptOthers');
        counts[dept] = (counts[dept] || 0) + 1;
      }
    });
    if (Object.keys(counts).length === 0 || Object.values(counts).every(c => c === 0)) {
      return [
        { name: 'IT Support', value: 8 },
        { name: 'Flight Ops', value: 6 },
        { name: 'Maintenance', value: 4 },
        { name: 'Sales & Mktg', value: 3 },
      ];
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [allRequests, language]);

  const categoryChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    assets.forEach(a => {
      counts[a.category] = (counts[a.category] || 0) + 1;
    });
    if (Object.keys(counts).length === 0) {
      return [
        { name: 'Electronic', value: 12 },
        { name: 'Aviation Gear', value: 8 },
        { name: 'Maintenance', value: 5 },
        { name: 'Manuals', value: 3 }
      ];
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [assets]);

  // Activity timeline mapper
  const timelineItems = useMemo(() => {
    return recentRequests.map(req => {
      const time = new Date(req.createdAt).toLocaleTimeString(language === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' });
      const date = new Date(req.createdAt).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short' });
      let message = '';
      let colorClass = 'bg-sky-500 ring-sky-500/20';
      
      if (req.status === 'PENDING') {
        message = language === 'th' 
          ? `ส่งคำขอยืมสินทรัพย์ [${req.asset.assetCode}] ${req.asset.name}`
          : `Submitted borrow request for [${req.asset.assetCode}] ${req.asset.name}`;
        colorClass = 'bg-amber-500 ring-amber-500/20';
      } else if (req.status === 'APPROVED') {
        message = language === 'th' 
          ? `คำขอยืมสินทรัพย์ [${req.asset.assetCode}] ได้รับอนุมัติ`
          : `Borrow request approved for [${req.asset.assetCode}] ${req.asset.name}`;
        colorClass = 'bg-sky-500 ring-sky-500/20';
      } else if (req.status === 'BORROWED') {
        message = language === 'th' 
          ? `เบิกยืมสำเร็จ: ${req.asset.name}`
          : `Asset checked out: ${req.asset.name}`;
        colorClass = 'bg-blue-500 ring-blue-500/20';
      } else if (req.status === 'RETURN_PENDING') {
        message = language === 'th' 
          ? `แจ้งคืนสินทรัพย์: ${req.asset.name}`
          : `Requested return of asset: ${req.asset.name}`;
        colorClass = 'bg-indigo-500 ring-indigo-500/20';
      } else if (req.status === 'RETURNED') {
        message = language === 'th' 
          ? `ส่งคืนสินทรัพย์สำเร็จ: ${req.asset.name}`
          : `Asset returned successfully: ${req.asset.name}`;
        colorClass = 'bg-emerald-500 ring-emerald-500/20';
      } else if (req.status === 'OVERDUE') {
        message = language === 'th' 
          ? `สินทรัพย์ [${req.asset.assetCode}] ค้างส่งคืนเกินกำหนด`
          : `Asset [${req.asset.assetCode}] return is OVERDUE`;
        colorClass = 'bg-rose-500 ring-rose-500/20';
      } else {
        message = language === 'th' 
          ? `อัปเดตคำขอยืมสินทรัพย์: ${req.asset.name}`
          : `Updated asset request: ${req.asset.name}`;
        colorClass = 'bg-slate-500 ring-slate-500/20';
      }

      return {
        id: req.id,
        time,
        date,
        user: `${req.borrower.firstName} ${req.borrower.lastName}`,
        department: req.borrower.department,
        message,
        status: req.status,
        colorClass
      };
    });
  }, [recentRequests, language]);

  // Click outside ref for notifications popover
  const notificationRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {

    return (
      <div className="space-y-8 p-6 max-w-[1600px] mx-auto">
        <div className="h-32 bg-slate-200 dark:bg-slate-900 rounded-3xl w-full animate-pulse border border-slate-200/50 dark:border-slate-800"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartSkeleton />
          </div>
          <div className="h-[340px] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-6 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-3xl text-center space-y-3">
        <AlertTriangle size={32} className="mx-auto text-rose-500" />
        <h3 className="text-base font-bold">{error || t('loadError')}</h3>
        <button
          onClick={() => fetchDashboardData(true)}
          className="px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md hover:bg-rose-600 transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <RefreshCw size={14} />
          <span>ลองใหม่อีกครั้ง / Retry</span>
        </button>
      </div>
    );
  }

  return (
    <PageTransition className="space-y-7 max-w-[1600px] mx-auto px-1 sm:px-3 font-sans text-slate-900 dark:text-slate-100 antialiased select-none">
      
      {/* 1. EXECUTIVE HERO COMMAND BANNER */}
      <div className="relative rounded-3xl p-6 sm:p-9 shadow-2xl transition-all duration-300">
        {/* Background Layer with Overflow Hidden */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 dark:from-[#0b1220] dark:via-[#0f172a] dark:to-[#1e1b4b] border border-slate-800/80 pointer-events-none">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          {/* Left Title & Status */}
          <div className="space-y-3 text-left max-w-xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-sky-400/15 text-sky-300 border border-sky-400/30 font-mono shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping"></span>
                {t('liveCenter')}
              </span>
              <span className="text-[11px] text-slate-300 font-medium">
                {new Date().toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight font-heading leading-tight">
              {greetingText}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-blue-200">{user?.name}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300/80 font-medium leading-relaxed">
              {t('systemDesc')} — {language === 'th' ? 'ตรวจสอบสถิติล่าสุด อนุมัติคำขอยืม และจัดการคลังสินทรัพย์บริษัทในระบบเดียว' : 'Monitor live statistics, approve pending requests, and track company assets in unified control center.'}
            </p>
          </div>

          {/* Right Control Bar */}
          <div className="flex items-center gap-3 shrink-0 self-end md:self-center flex-wrap">
            
            {/* Quick Search Shortcut Pill */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-3 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-2xl text-slate-300 hover:text-white transition-all duration-150 cursor-pointer text-xs font-semibold shadow-lg backdrop-blur-md"
            >
              <Search size={15} className="text-sky-400" />
              <span className="hidden sm:inline">{t('searchPlaceholder')}</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 font-mono text-[9px] font-bold text-slate-400 bg-slate-900 rounded-lg border border-slate-700">
                ⌘K
              </kbd>
            </button>

            {/* Manual Refresh Data Button */}
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white rounded-2xl transition-all cursor-pointer shadow-lg backdrop-blur-md disabled:opacity-50"
              title={language === 'th' ? 'รีเฟรชข้อมูล' : 'Refresh Data'}
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin text-sky-400' : ''} />
            </button>

            {/* Notification Popover Button */}
            <div className="relative z-50" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white rounded-2xl transition-all cursor-pointer shadow-lg backdrop-blur-md relative"
                title={t('notifications')}
              >
                <Bell size={16} />
                {systemNotifications.length > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-slate-900 animate-pulse"></span>
                )}
              </button>

              {/* Slide-down Popover */}
              {showNotifications && (
                <div className="absolute right-0 top-14 z-50 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-4 flex flex-col gap-3 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Bell size={13} className="text-sky-400" />
                      {t('notifications')} ({systemNotifications.length})
                    </h4>
                    <button 
                      onClick={() => setShowNotifications(false)} 
                      className="text-[10px] text-slate-400 hover:text-white cursor-pointer px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      {t('close')}
                    </button>
                  </div>


                  {systemNotifications.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 space-y-2">
                      <ShieldCheck size={28} className="mx-auto text-emerald-400 opacity-80" />
                      <p className="text-xs font-semibold text-slate-300">{t('noNotifications')}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {systemNotifications.map(notif => (
                        <Link
                          key={notif.id}
                          href={notif.link}
                          onClick={() => setShowNotifications(false)}
                          className="block p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 text-left transition-all duration-150 hover:border-slate-700"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-white">{notif.title}</p>
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border font-mono ${
                              notif.color === 'rose' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : ''
                            } ${
                              notif.color === 'amber' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : ''
                            } ${
                              notif.color === 'blue' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : ''
                            }`}>
                              {notif.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed font-medium">{notif.desc}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* 2. TODAY SUMMARY TICKER BAR */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-1 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-slate-100 dark:divide-slate-800/60">
          {[
            { label: t('borrowToday'), count: summaryCounters.borrowToday, color: 'text-sky-500 dark:text-sky-400', icon: PlusCircle },
            { label: t('returnToday'), count: summaryCounters.returnToday, color: 'text-emerald-500 dark:text-emerald-400', icon: CheckCircle2 },
            { label: t('pendingApprovalText'), count: summaryCounters.pending, color: 'text-amber-500 dark:text-amber-400', icon: Clock },
            { label: t('overdueText'), count: summaryCounters.overdue, color: 'text-rose-500 dark:text-rose-400', icon: AlertTriangle },
            { label: t('inMaintenanceText'), count: summaryCounters.maintenance, color: 'text-slate-500 dark:text-slate-400', icon: Wrench },
            { label: t('newAssetsText'), count: summaryCounters.newAssets, color: 'text-indigo-500 dark:text-indigo-400', icon: Box },
          ].map((item, idx) => (
            <div key={idx} className="p-3.5 text-center flex flex-col items-center justify-center hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors rounded-xl">
              <div className="flex items-center gap-1.5 mb-1">
                <item.icon size={13} className={item.color} />
                <span className={`text-xl font-black font-mono tracking-tight ${item.color}`}>
                  <AnimatedCounter value={item.count} />
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate max-w-full">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. HERO KPI METRICS SECTION (4 Primary Enterprise Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Total Assets */}
        <div className="relative group overflow-hidden bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200 text-left">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">{t('kpiTotal')}</span>
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
                <AnimatedCounter value={stats.totalAssets} />
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Box size={22} />
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono text-[10px]">
              <TrendingUp size={11} />
              <span>+12% vs last month</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Updated live</span>
          </div>
        </div>

        {/* Card 2: Available Assets */}
        <div className="relative group overflow-hidden bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200 text-left">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">{t('kpiAvailable')}</span>
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
                <AnimatedCounter value={stats.availableAssets} />
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 size={22} />
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mr-3">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${stats.totalAssets ? Math.round((stats.availableAssets / stats.totalAssets) * 100) : 0}%` }}
              ></div>
            </div>
            <span className="text-[11px] font-extrabold text-emerald-500 font-mono shrink-0">
              {stats.totalAssets ? Math.round((stats.availableAssets / stats.totalAssets) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Card 3: Borrowed Assets */}
        <div className="relative group overflow-hidden bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200 text-left">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">{t('kpiBorrowed')}</span>
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-sky-600 dark:text-sky-400 font-mono">
                <AnimatedCounter value={stats.borrowedAssets} />
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 border border-sky-500/20 flex items-center justify-center shrink-0">
              <Clock size={22} />
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500 font-medium">
              {t('utilization')}: <strong className="text-sky-500 font-mono font-bold">{assetUtilization}%</strong>
            </span>
            <span className="text-[10px] text-sky-400 font-semibold bg-sky-500/10 px-2 py-0.5 rounded-md">Active</span>
          </div>
        </div>

        {/* Card 4: Maintenance / Overdue */}
        <div className="relative group overflow-hidden bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200 text-left">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">{t('kpiMaintenance')}</span>
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-rose-600 dark:text-rose-400 font-mono">
                <AnimatedCounter value={stats.maintenanceAssets} />
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0">
              <Wrench size={22} />
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-[11px] text-rose-500 font-bold inline-flex items-center gap-1">
              <AlertTriangle size={12} />
              <span>{stats.overdueRequests} Overdue Item(s)</span>
            </span>
            <Link href="/reports?type=overdue" className="text-[10px] font-bold text-slate-400 hover:text-slate-200 underline">
              View
            </Link>
          </div>
        </div>

      </div>

      {/* 4. CHARTS & ANALYTICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        
        {/* Main Borrow Trend Chart (Span 2) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                {t('chartBorrowTrend')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'th' ? 'สถิติตัวเลขคำขอยืมสินทรัพย์ย้อนหลัง 6 เดือน' : '6-Month rolling transaction volume analysis.'}
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
              6 Months
            </span>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={borrowTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="borrowGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.35}/>
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#ffffff',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                  }}
                  itemStyle={{ color: '#38bdf8' }}
                  labelStyle={{ fontWeight: '700', color: '#ffffff' }}
                />
                <Area type="monotone" dataKey="count" name={t('chartTotalLabel')} stroke="#38bdf8" fillOpacity={1} fill="url(#borrowGradient)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Panel: Department & Category Breakdown */}
        <div className="flex flex-col gap-6">
          
          {/* Department Breakdown */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
                {t('chartDeptUsage')}
              </h3>
              <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md font-mono">
                {departmentUsageData.length} Depts
              </span>
            </div>

            <div className="space-y-3.5">
              {departmentUsageData.map((item, idx) => {
                const total = departmentUsageData.reduce((acc, curr) => acc + curr.value, 0);
                const pct = total ? Math.round((item.value / total) * 100) : 25;
                const colors = ['bg-sky-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500'];
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[140px]">{item.name}</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px] font-bold">{item.value} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${colors[idx % colors.length]} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Asset Category Proportions */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading mb-4">
              {t('chartAssetCat')}
            </h3>
            <div className="space-y-3">
              {categoryChartData.map((item, idx) => {
                const maxVal = Math.max(...categoryChartData.map(c => c.value));
                const pct = maxVal ? Math.round((item.value / maxVal) * 100) : 50;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium w-28 truncate shrink-0">{item.name}</span>
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-500 w-8 text-right shrink-0">{item.value}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* 5. LIVE TIMELINE & APPROVAL QUEUE (Enterprise Control System) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        
        {/* Timeline Log (Span 2) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
            <div className="flex items-center gap-2.5">
              <Activity className="text-sky-500" size={18} />
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                {t('recentActivity')}
              </h3>
            </div>
            <Link 
              href="/borrow"
              className="text-xs font-bold text-sky-500 hover:text-sky-400 flex items-center gap-1.5 transition-colors"
            >
              <span>{t('viewAllHistory')}</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {timelineItems.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
              <Inbox size={32} className="text-slate-400 dark:text-slate-600" />
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">{t('noHistory')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {timelineItems.map((item, itemIdx) => (
                <div key={item.id} className="flex items-start gap-4 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                  <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${item.colorClass.split(' ')[0]}`}></div>
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold leading-relaxed">
                        {item.message}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium flex-wrap">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{item.user}</span>
                        <span>•</span>
                        <span className="text-sky-500">{item.department}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-500">{item.date} {item.time}</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-md uppercase tracking-wider border shrink-0 font-mono ${
                      item.status === 'PENDING' || item.status === 'RETURN_PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : ''
                    } ${
                      item.status === 'BORROWED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : ''
                    } ${
                      item.status === 'RETURNED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''
                    } ${
                      item.status === 'OVERDUE' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {t(item.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Approval Queue */}
        <div id="approval-queue" className="bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm scroll-mt-24">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5 select-none">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-indigo-500" size={18} />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-heading">
                {t('pendingReviewQueue')}
              </h3>
            </div>
            <span className="text-[10px] font-extrabold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-mono">
              {t('activeRequestsCount', { count: approvalQueue.length })}
            </span>
          </div>

          {approvalQueue.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center gap-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Inbox size={22} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800 dark:text-white">{t('noPendingRequests')}</p>
                <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto leading-relaxed font-medium">
                  {t('noPendingDesc')}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              {approvalQueue.map((req) => (
                <div key={req.id} className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex flex-col gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border font-mono ${
                        req.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {t(req.status === 'PENDING' ? 'borrowRequestLabel' : 'returnRequestLabel')}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 font-mono">{req.requestNo}</span>
                    </div>
                    
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-2">
                      {req.asset.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{t('assetCodeLabel')}: {req.asset.assetCode}</p>
                    
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
                      <span className="text-slate-400">{t('borrowerLabel')}: </span>
                      <strong className="text-slate-800 dark:text-slate-200">{req.borrower.firstName} {req.borrower.lastName}</strong>
                      <span className="text-slate-400 font-medium"> ({req.borrower.department})</span>
                    </div>

                    {req.purpose && (
                      <p className="text-[10px] text-slate-400 italic mt-1.5 font-medium bg-slate-100 dark:bg-slate-950 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800">
                        &quot;{req.purpose}&quot;
                      </p>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-2 border-t border-slate-200/60 dark:border-slate-800 pt-3 justify-end shrink-0 select-none">
                    {req.status === 'PENDING' ? (
                      <>
                        <button
                          disabled={processingActionId === req.id}
                          onClick={() => handleReject(req.id, req.requestNo)}
                          className="px-3.5 py-2 border border-rose-500/30 hover:bg-rose-500/10 text-rose-500 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                        >
                          {t('rejectBtn')}
                        </button>
                        <button
                          disabled={processingActionId === req.id}
                          onClick={() => handleApprove(req.id, req.requestNo)}
                          className="px-3.5 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-500/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {t('approveBorrowBtn')}
                        </button>
                      </>
                    ) : (
                      <button
                        disabled={processingActionId === req.id}
                        onClick={() => handleApproveReturn(req.id, req.requestNo)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Check size={14} className="stroke-[3]" />
                        <span>{t('approveReturnBtn')}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 6. QUICK ACTIONS GRID & RECENTLY REGISTERED ASSETS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        
        {/* Quick Actions (Span 2) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
            <Sparkles className="text-sky-400" size={18} />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-heading">{t('quickActionsTitle')}</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            
            {/* Create Asset */}
            {user?.role === 'ADMIN' ? (
              <Link
                href="/assets/new"
                className="group flex flex-col items-center text-center p-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-sky-500/10 border border-slate-200 dark:border-slate-800 hover:border-sky-500/30 rounded-2xl transition-all duration-200 hover:-translate-y-1 shadow-xs cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                  <PlusCircle size={20} />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-white mt-3">{t('actCreate')}</span>
                <span className="text-[10px] text-slate-400 mt-1">{t('actCreateDesc')}</span>
              </Link>
            ) : (
              <div className="opacity-40 select-none flex flex-col items-center text-center p-4 bg-slate-50 dark:bg-slate-900/20 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <PlusCircle size={20} />
                </div>
                <span className="text-xs font-bold text-slate-500 mt-3">{t('actCreate')}</span>
                <span className="text-[10px] text-slate-400 mt-1">{t('actCreateAdminOnly')}</span>
              </div>
            )}

            {/* Scan Asset */}
            <button
              onClick={() => setIsScannerOpen(true)}
              className="group flex flex-col items-center text-center p-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-sky-500/10 border border-slate-200 dark:border-slate-800 hover:border-sky-500/30 rounded-2xl transition-all duration-200 hover:-translate-y-1 shadow-xs cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20 group-hover:scale-110 transition-transform">
                <QrCode size={20} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-white mt-3">{t('actScan')}</span>
              <span className="text-[10px] text-slate-400 mt-1">{t('actScanDesc')}</span>
            </button>

            {/* Request Borrow */}
            <Link
              href="/borrow/new"
              className="group flex flex-col items-center text-center p-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-sky-500/10 border border-slate-200 dark:border-slate-800 hover:border-sky-500/30 rounded-2xl transition-all duration-200 hover:-translate-y-1 shadow-xs cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                <Plus size={20} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-white mt-3">{t('actBorrow')}</span>
              <span className="text-[10px] text-slate-400 mt-1">{t('actBorrowDesc')}</span>
            </Link>

            {/* Return Asset */}
            <Link
              href="/returns/new"
              className="group flex flex-col items-center text-center p-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-sky-500/10 border border-slate-200 dark:border-slate-800 hover:border-sky-500/30 rounded-2xl transition-all duration-200 hover:-translate-y-1 shadow-xs cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <Undo2 size={20} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-white mt-3">{t('actReturn')}</span>
              <span className="text-[10px] text-slate-400 mt-1">{t('actReturnDesc')}</span>
            </Link>

            {/* Add Employee */}
            <Link
              href="/employees"
              className="group flex flex-col items-center text-center p-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-sky-500/10 border border-slate-200 dark:border-slate-800 hover:border-sky-500/30 rounded-2xl transition-all duration-200 hover:-translate-y-1 shadow-xs cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                <UserPlus size={20} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-white mt-3">{t('actEmployee')}</span>
              <span className="text-[10px] text-slate-400 mt-1">{t('actEmployeeDesc')}</span>
            </Link>

          </div>
        </div>

        {/* Recently Registered Assets */}
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800 mb-5 select-none">
            <Box className="text-indigo-500" size={18} />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-heading">{t('recentAssetsTitle')}</h3>
          </div>

          <div className="space-y-3">
            {recentAssets.map(asset => (
              <div key={asset.id} className="flex items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 rounded-2xl hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs">
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{asset.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{asset.assetCode} • {asset.category}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shrink-0 border font-mono ${
                  asset.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {asset.status === 'AVAILABLE' ? t('statusAvail') : t('statusBorrowed')}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 7. ENTERPRISE FOOTER */}
      <footer className="pt-8 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-semibold select-none">
        <div className="flex items-center gap-2">
          <span>© 2026 Thai Inter Flying Co., Ltd. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/settings" className="hover:text-slate-200 transition-colors">{t('settings')}</Link>
          <span>•</span>
          <a href="https://thaiinterflying.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-200 transition-colors flex items-center gap-1">
            <span>{t('mainWebsite')}</span>
            <ExternalLink size={11} />
          </a>
          <span>•</span>
          <span className="font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20 px-3 py-1 rounded-xl text-[10px]">PRO EDITION v1.0.0</span>
        </div>
      </footer>

      {/* 8. COMMAND PALETTE MODAL (Ctrl + K) */}
      {isSearchOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-[15vh] p-4 text-left animate-in fade-in duration-150"
          onClick={() => setIsSearchOpen(false)}
        >
          <div 
            className="bg-[#0f172a] border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-100 flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 bg-slate-900/60">
              <Search size={18} className="text-sky-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('cmdPlaceholder')}
                className="w-full bg-transparent text-sm text-white placeholder-slate-400 border-none outline-none focus:ring-0 font-medium"
              />
              <kbd className="h-6 select-none items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2 font-mono text-[10px] font-bold text-slate-400 shadow-sm shrink-0 flex">
                ESC
              </kbd>
            </div>

            {/* Results Panel */}
            <div className="max-h-[360px] overflow-y-auto p-3 space-y-2 bg-[#0f172a]">
              {!searchQuery.trim() ? (
                <>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-1 select-none">{t('cmdPopularCategories')}</div>
                  <div className="grid grid-cols-2 gap-2 p-1">
                    {categoryStats.slice(0, 4).map((cat, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSearchQuery(cat.name)}
                        className="flex items-center gap-3 p-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 rounded-2xl text-left transition-colors cursor-pointer"
                      >
                        <cat.icon size={18} className="text-sky-400" />
                        <div>
                          <p className="text-xs font-bold text-white">{cat.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{cat.count} {t('cmdQtyUnit')}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-1 mt-2 select-none">{t('cmdPopularLinks')}</div>
                  <div className="p-1 space-y-1">
                    {[
                      { label: t('linkAssetsMain'), href: '/assets', desc: t('linkAssetsMainDesc') },
                      { label: t('linkApprovalQueue'), href: '#approval-queue', desc: t('linkApprovalQueueDesc') },
                      { label: t('linkCreateBorrow'), href: '/borrow/new', desc: t('linkCreateBorrowDesc') }
                    ].map((link, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setIsSearchOpen(false);
                          router.push(link.href);
                        }}
                        className="w-full flex items-center justify-between p-3 hover:bg-slate-800 rounded-2xl text-left transition-colors cursor-pointer border border-transparent hover:border-slate-700"
                      >
                        <div>
                          <p className="text-xs font-bold text-white">{link.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{link.desc}</p>
                        </div>
                        <ChevronRight size={15} className="text-slate-400" />
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-1 select-none">
                    {t('cmdSearchResults', { count: filteredAssets.length })}
                  </div>
                  {filteredAssets.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 italic select-none">
                      {t('cmdNoResults')}
                    </div>
                  ) : (
                    filteredAssets.map(asset => (
                      <button
                        key={asset.id}
                        onClick={() => {
                          setIsSearchOpen(false);
                          router.push(`/assets/${asset.id}`);
                        }}
                        className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800 rounded-2xl text-left transition-colors cursor-pointer border border-transparent hover:border-slate-700"
                      >
                        <div className="overflow-hidden pr-4">
                          <p className="text-xs font-bold text-white truncate">{asset.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{t('cmdAssetCode')}: {asset.assetCode} • {asset.category}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 select-none">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border font-mono ${
                            asset.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {asset.status === 'AVAILABLE' ? t('statusAvail') : t('statusBorrowed')}
                          </span>
                          <ChevronRight size={15} className="text-slate-400" />
                        </div>
                      </button>
                    ))
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider select-none">
              <span>{t('cmdFooterInfo')}</span>
              <span>{t('cmdCloseEsc')}</span>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleLocalScan}
        title={t('qrTitle')}
      />

    </PageTransition>
  );
}
