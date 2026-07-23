'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/components/providers/LanguageProvider';
import api from '@/lib/api';

import { 
  ClipboardList, 
  PlusCircle, 
  Check, 
  X, 
  AlertCircle, 
  FileText, 
  Ban, 
  Eye, 
  Undo2, 
  Calendar, 
  Clock, 
  Inbox, 
  Edit3, 
  CalendarRange
} from 'lucide-react';
import Link from 'next/link';
import { TableSkeleton } from '@/components/common/Skeleton';
import PageTransition from '@/components/common/PageTransition';
import AnimatedCounter from '@/components/common/AnimatedCounter';
import { useToast } from '@/components/providers/ToastProvider';

interface BorrowRequest {
  id: string;
  requestNo: string;
  borrowDate: string;
  expectedReturnDate: string;
  purpose: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BORROWED' | 'RETURN_PENDING' | 'RETURNED' | 'OVERDUE' | 'CANCELLED';
  rejectedReason?: string;
  createdAt: string;
  asset: {
    id: string;
    assetCode: string;
    name: string;
  };
  borrower: {
    firstName: string;
    lastName: string;
    department: string;
  };
  assetReturn?: {
    id: string;
    returnDate: string;
    condition: 'NORMAL' | 'DAMAGED' | 'LOST' | 'INCOMPLETE';
    conditionNote?: string | null;
    imageUrl?: string | null;
  } | null;
}

function BorrowContent() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [selectedReturn, setSelectedReturn] = useState<BorrowRequest | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const filterParam = searchParams.get('filter');
    if (tabParam === 'pending' || tabParam === 'history') {
      setActiveTab(tabParam);
    }
    if (filterParam) {
      setStatusFilter(filterParam);
      if (filterParam === 'OVERDUE' || filterParam === 'RETURNED' || filterParam === 'BORROWED') {
        setActiveTab('history');
      }
    }
  }, [searchParams]);

  // Return date edit states
  const [customReturnDate, setCustomReturnDate] = useState<string>('');
  const [isEditingDate, setIsEditingDate] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/borrow-requests');
      setRequests(res.data);
    } catch (err) {
      console.error('Failed to fetch borrow requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (selectedReturn) {
      const dateVal = selectedReturn.assetReturn?.returnDate 
        ? new Date(selectedReturn.assetReturn.returnDate)
        : new Date();
      // Format to yyyy-MM-ddThh:mm local
      const formatted = new Date(dateVal.getTime() - dateVal.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setCustomReturnDate(formatted);
      setIsEditingDate(false);
    }
  }, [selectedReturn]);

  const handleApprove = async (id: string, requestNo: string) => {
    if (!confirm(t('confirmApproveBorrow', { requestNo }))) return;
    try {
      await api.patch(`/borrow-requests/${id}/approve`);
      toast.success(t('approvedSuccess'), `${t('approvedBorrow')}${requestNo}`);
      fetchRequests();
    } catch (err: any) {
      toast.error(t('approveFailed'), err.response?.data?.message || t('cannotApprove'));
    }
  };

  const handleReject = async (id: string, requestNo: string) => {
    const reason = prompt(t('confirmReject') || t('promptRejectReason'));
    if (reason === null) return;
    if (!reason.trim()) {
      toast.warning(t('reasonRequired'), t('reasonRequiredDesc'));
      return;
    }

    try {
      await api.patch(`/borrow-requests/${id}/reject`, { rejectedReason: reason });
      toast.success(t('rejectedSuccess'), `${t('rejectedRequest')}${requestNo}`);
      fetchRequests();
    } catch (err: any) {
      toast.error(t('operationFailed'), err.response?.data?.message || t('cannotReject'));
    }
  };

  const handleCancel = async (id: string, requestNo: string) => {
    if (!confirm(t('confirmCancel', { requestNo }))) return;
    try {
      await api.patch(`/borrow-requests/${id}/cancel`);
      toast.success(t('cancelledSuccess'), `${t('cancelledRequest')}${requestNo}`);
      fetchRequests();
    } catch (err: any) {
      toast.error(language === 'th' ? 'การยกเลิกล้มเหลว' : 'Cancellation failed', err.response?.data?.message || t('cannotCancel'));
    }
  };

  const handleApproveReturnWithDate = async () => {
    if (!selectedReturn) return;
    const reqNo = selectedReturn.requestNo;
    const id = selectedReturn.id;
    if (!confirm(t('confirmApproveReturn', { requestNo: reqNo }))) return;
    try {
      await api.patch(`/borrow-requests/${id}/approve-return`, {
        returnDate: new Date(customReturnDate).toISOString(),
      });
      toast.success(t('approvedReturn'), `${t('approvedReturnCode')}${reqNo}`);
      setSelectedReturn(null);
      fetchRequests();
    } catch (err: any) {
      toast.error(t('approveFailed'), err.response?.data?.message || t('cannotApproveReturn'));
    }
  };

  const handleSaveReturnDate = async () => {
    if (!selectedReturn) return;
    try {
      const res = await api.patch(`/borrow-requests/${selectedReturn.id}`, {
        returnDate: new Date(customReturnDate).toISOString(),
      });
      toast.success(t('editDateTimeSuccess'), t('editDateTimeDesc'));
      setIsEditingDate(false);
      
      // Update local state to reflect edit inside modal
      setSelectedReturn({
        ...selectedReturn,
        assetReturn: {
          ...selectedReturn.assetReturn!,
          returnDate: res.data.returnDate,
        }
      });
      fetchRequests();
    } catch (err: any) {
      toast.error(t('editFailed'), err.response?.data?.message || t('cannotEditDate'));
    }
  };

  const handleRejectReturn = async (id: string, requestNo: string) => {
    if (!confirm(t('confirmRejectReturn', { requestNo }))) return;
    try {
      await api.patch(`/borrow-requests/${id}/reject-return`);
      toast.success(t('rejectReturnSuccess'), `${t('rejectReturnCode')}${requestNo}`);
      setSelectedReturn(null);
      fetchRequests();
    } catch (err: any) {
      toast.error(t('operationFailed'), err.response?.data?.message || t('cannotRejectReturn'));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-full bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400 border border-amber-250/60 dark:border-amber-900/50">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            {t('PENDING')}
          </span>
        );
      case 'RETURN_PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-full bg-orange-50 dark:bg-orange-955/20 text-orange-600 dark:text-orange-400 border border-orange-250/60 dark:border-orange-900/50">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></span>
            {t('RETURN_PENDING')}
          </span>
        );
      case 'BORROWED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-full bg-blue-50 dark:bg-blue-955/20 text-blue-650 dark:text-blue-450 border border-blue-250/60 dark:border-blue-900/50">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            {t('BORROWED')}
          </span>
        );
      case 'RETURNED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-400 border border-emerald-250/60 dark:border-emerald-900/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {t('RETURNED')}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-full bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 border border-rose-250/60 dark:border-rose-900/50">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            {t('REJECTED')}
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-full bg-red-50 dark:bg-red-955/30 text-red-500 dark:text-red-400 border border-red-250/60 dark:border-red-900/50 animate-pulse font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
            {t('OVERDUE')}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-full bg-slate-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-450"></span>
            {t('CANCELLED')}
          </span>
        );
      default:
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-slate-100 text-slate-650">{status}</span>;
    }
  };

  const getConditionBadge = (cond: string) => {
    switch (cond) {
      case 'NORMAL':
        return <span className="px-2.5 py-1 text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900 rounded-lg font-bold">{t('conditionNormal')}</span>;
      case 'INCOMPLETE':
        return <span className="px-2.5 py-1 text-[10px] bg-amber-50 text-amber-600 border border-amber-250 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900 rounded-lg font-bold">{t('conditionIncomplete')}</span>;
      case 'DAMAGED':
        return <span className="px-2.5 py-1 text-[10px] bg-red-50 text-red-650 border border-red-200 dark:bg-red-955/25 dark:text-red-400 dark:border-red-900 rounded-lg font-bold">{t('conditionDamaged')}</span>;
      case 'LOST':
        return <span className="px-2.5 py-1 text-[10px] bg-red-950/20 text-red-500 border border-red-900 rounded-lg font-bold font-sans">{t('conditionLost')}</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] bg-slate-100 text-slate-600 border border-slate-200 rounded-lg font-bold">{cond}</span>;
    }
  };

  // Stats Card Counts
  const statsCounts = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'PENDING' || r.status === 'RETURN_PENDING').length,
    borrowed: requests.filter((r) => r.status === 'BORROWED').length,
    overdue: requests.filter((r) => r.status === 'OVERDUE').length,
  };

  // Filter requests based on tab, role, search, and status dropdown
  const showTabs = user?.role === 'ADMIN' || user?.role === 'APPROVER';
  
  const filteredList = requests.filter((item) => {
    // 1. Role / Tab filter
    if (showTabs) {
      if (activeTab === 'pending') {
        if (item.status !== 'PENDING' && item.status !== 'RETURN_PENDING') return false;
      } else {
        if (item.status === 'PENDING' || item.status === 'RETURN_PENDING') return false;
      }
    }

    // 2. Filter Pills
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'REJECTED_CANCELLED') {
        if (item.status !== 'REJECTED' && item.status !== 'CANCELLED') return false;
      } else {
        if (item.status !== statusFilter) return false;
      }
    }

    // 3. Search Term filter
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      item.requestNo.toLowerCase().includes(search) ||
      item.asset.name.toLowerCase().includes(search) ||
      item.asset.assetCode.toLowerCase().includes(search) ||
      item.borrower.firstName.toLowerCase().includes(search) ||
      item.borrower.lastName.toLowerCase().includes(search) ||
      item.borrower.department.toLowerCase().includes(search) ||
      item.purpose.toLowerCase().includes(search);

    return matchesSearch;
  });

  const filterOptions = [
    { label: t('filterAll'), value: 'ALL', count: requests.length },
    { label: t('filterPending'), value: 'PENDING', count: requests.filter(r => r.status === 'PENDING').length },
    { label: t('filterReturnPending'), value: 'RETURN_PENDING', count: requests.filter(r => r.status === 'RETURN_PENDING').length },
    { label: t('filterBorrowed'), value: 'BORROWED', count: requests.filter(r => r.status === 'BORROWED').length },
    { label: t('filterReturned'), value: 'RETURNED', count: requests.filter(r => r.status === 'RETURNED').length },
    { label: t('filterOverdue'), value: 'OVERDUE', count: requests.filter(r => r.status === 'OVERDUE').length },
    { label: t('filterRejectedCancelled'), value: 'REJECTED_CANCELLED', count: requests.filter(r => r.status === 'REJECTED' || r.status === 'CANCELLED').length }
  ];

  return (
    <PageTransition className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Premium Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-lg border border-slate-800 shadow-indigo-950/20 animate-fade-in">
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{t('borrowTitle')}</h1>
            <p className="text-slate-400 text-xs md:text-sm max-w-xl font-normal leading-relaxed">
              {t('borrowDesc')}
            </p>
          </div>
          {(user?.role === 'STAFF' || user?.role === 'ADMIN' || user?.role === 'APPROVER') && (
            <Link
              href="/borrow/new"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-sky-400 via-sky-500 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 text-white px-6 py-3.5 rounded-2xl font-bold text-xs shadow-lg shadow-sky-500/20 cursor-pointer transition-all hover:scale-[1.03] active:scale-95 duration-200 hover:shadow-indigo-500/30"
            >
              <PlusCircle size={16} />
              <span>{t('requestBorrow')}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-150/60 dark:border-slate-800 shadow-sm flex items-center justify-between card-hover relative overflow-hidden group animate-fade-in-up stagger-1">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-slate-100/40 dark:bg-slate-800/10 group-hover:scale-125 transition-transform duration-500 blur-xl"></div>
          <div className="relative space-y-1">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('totalRequests')}</p>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">
              <AnimatedCounter value={statsCounts.total} /> <span className="text-xs font-normal text-slate-400">{t('items')}</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-955/50 text-slate-500 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800 relative z-10 shadow-inner">
            <ClipboardList size={22} />
          </div>
        </div>

        {/* Card 2: Pending */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-150/60 dark:border-slate-800 shadow-sm flex items-center justify-between card-hover relative overflow-hidden group animate-fade-in-up stagger-2">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-amber-500/5 group-hover:scale-125 transition-transform duration-500 blur-xl"></div>
          <div className="relative space-y-1">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('pendingReview')}</p>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              <AnimatedCounter value={statsCounts.pending} /> <span className="text-xs font-normal text-slate-400">{t('items')}</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-955/20 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/30 relative z-10 shadow-inner">
            <AlertCircle size={22} className={statsCounts.pending > 0 ? 'animate-pulse' : ''} />
          </div>
        </div>

        {/* Card 3: Borrowed */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-150/60 dark:border-slate-800 shadow-sm flex items-center justify-between card-hover relative overflow-hidden group animate-fade-in-up stagger-3">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-sky-500/5 group-hover:scale-125 transition-transform duration-500 blur-xl"></div>
          <div className="relative space-y-1">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('currentlyBorrowed')}</p>
            <p className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 mt-1">
              <AnimatedCounter value={statsCounts.borrowed} /> <span className="text-xs font-normal text-slate-400">{t('items')}</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-955/20 text-sky-500 flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-900/30 relative z-10 shadow-inner">
            <FileText size={22} />
          </div>
        </div>

        {/* Card 4: Overdue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-150/60 dark:border-slate-800 shadow-sm flex items-center justify-between card-hover relative overflow-hidden group animate-fade-in-up stagger-4">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-red-500/5 group-hover:scale-125 transition-transform duration-500 blur-xl"></div>
          <div className="relative space-y-1">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('overdueReturn')}</p>
            <p className="text-2xl font-extrabold text-red-500 dark:text-red-400 mt-1">
              <AnimatedCounter value={statsCounts.overdue} /> <span className="text-xs font-normal text-slate-400">{t('items')}</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-955/20 text-red-500 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-900/30 relative z-10 shadow-inner">
            <Ban size={22} className={statsCounts.overdue > 0 ? 'animate-bounce' : ''} />
          </div>
        </div>
      </div>

      {/* Tabs and Filters Section */}
      <div className="space-y-5">
        {/* Tabs for Admin/Approver */}
        {showTabs && (
          <div className="flex border-b border-slate-150 dark:border-slate-850 font-heading">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-4 text-xs font-bold border-b-[3px] transition-all duration-200 cursor-pointer ${
                activeTab === 'pending'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-650 dark:hover:text-slate-300'
              }`}
            >
              {t('pendingTab')} ({requests.filter(r => r.status === 'PENDING' || r.status === 'RETURN_PENDING').length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-4 text-xs font-bold border-b-[3px] transition-all duration-200 cursor-pointer ${
                activeTab === 'history'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-650 dark:hover:text-slate-300'
              }`}
            >
              {t('historyTab')} ({requests.filter(r => r.status !== 'PENDING' && r.status !== 'RETURN_PENDING').length})
            </button>
          </div>
        )}

        {/* Search & Filter pills block */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Filter pills */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto overflow-x-auto no-scrollbar py-1">
              {filterOptions.map((opt) => {
                const isActive = statusFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setStatusFilter(opt.value)}
                    className={`px-4 py-2.5 rounded-2xl text-[11px] font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 border whitespace-nowrap
                      ${isActive 
                        ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/10' 
                        : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-850 dark:text-slate-400'
                      }`}
                  >
                    <span>{opt.label}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold
                      ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-500'}`}>
                      {opt.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-80 shrink-0">
              <input
                type="text"
                placeholder={t('searchBorrowPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-4 pr-10 py-3 text-xs text-slate-700 dark:text-slate-350 focus:outline-none focus:border-sky-500 dark:focus:border-sky-500 transition-colors shadow-sm"
              />
              <div className="absolute top-3.5 right-3.5 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Requests List Block */}
      {loading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : filteredList.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800 rounded-3xl p-16 text-center text-slate-400 shadow-sm flex flex-col items-center justify-center animate-fade-in max-w-lg mx-auto mt-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-955/50 border border-slate-100 dark:border-slate-800 text-slate-400 flex items-center justify-center mb-4 shadow-inner">
            <Inbox size={32} className="text-slate-350 dark:text-slate-650" />
          </div>
          <h3 className="text-sm font-bold text-slate-755 dark:text-slate-300">{t('noBorrowFound')}</h3>
          <p className="text-[11px] text-slate-400 mt-1.5 max-w-xs leading-relaxed">
            {t('noBorrowDesc')}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900 border-b border-slate-150 dark:border-slate-850 text-slate-500 dark:text-slate-450 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4.5">{t('requestNo')}</th>
                  <th className="px-6 py-4.5">{t('borrowerDepartment')}</th>
                  <th className="px-6 py-4.5">{t('assetCode')}</th>
                  <th className="px-6 py-4.5">{t('borrowPeriod')}</th>
                  <th className="px-6 py-4.5">{t('purpose')}</th>
                  <th className="px-6 py-4.5">{t('status')}</th>
                  <th className="px-6 py-4.5 text-center">{t('manage')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredList.map((item) => {
                  const initials = item.borrower.firstName.charAt(0).toUpperCase();
                  return (
                    <tr key={item.id} className="table-row-hover transition-all duration-150">
                      {/* Request No */}
                      <td className="px-6 py-4.5">
                        <span className="font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-955/40 border border-sky-100 dark:border-sky-900/50 px-2.5 py-1.5 rounded-xl text-[10px] shadow-sm">
                          {item.requestNo}
                        </span>
                      </td>

                      {/* Borrower user profile */}
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-indigo-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-white leading-tight">
                              {item.borrower.firstName} {item.borrower.lastName}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
                              {item.borrower.department}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Asset Details */}
                      <td className="px-6 py-4.5">
                        <p className="font-bold text-slate-800 dark:text-white leading-tight line-clamp-1" title={item.asset.name}>
                          {item.asset.name}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1 font-medium">
                          {item.asset.assetCode}
                        </p>
                      </td>

                      {/* Dates */}
                      <td className="px-6 py-4.5 text-slate-600 dark:text-slate-400 space-y-1 shrink-0">
                        <div className="flex items-center gap-1.5 text-[10px] font-medium">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{t('borrowDate')} {new Date(item.borrowDate).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US')}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold">
                          <Clock size={13} className="text-slate-400" />
                          <span>{language === 'th' ? 'คืน:' : 'Return:'} {new Date(item.expectedReturnDate).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US')}</span>
                        </div>
                      </td>

                      {/* Purpose */}
                      <td className="px-6 py-4.5 text-slate-500 dark:text-slate-400 max-w-[140px] truncate" title={item.purpose}>
                        {item.purpose}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4.5">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Approver / Admin actions on Pending list */}
                          {item.status === 'PENDING' && (user?.role === 'ADMIN' || user?.role === 'APPROVER') && (
                            <>
                              <button
                                onClick={() => handleApprove(item.id, item.requestNo)}
                                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 rounded-xl transition-all hover:scale-110 active:scale-95 cursor-pointer"
                                title={t('approveBorrowTitle')}
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => handleReject(item.id, item.requestNo)}
                                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-650 dark:bg-rose-955/20 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-xl transition-all hover:scale-110 active:scale-95 cursor-pointer"
                                title={t('rejectRequestTitle')}
                              >
                                <X size={14} />
                              </button>
                            </>
                          )}

                          {/* Return approval actions for ADMIN */}
                          {item.status === 'RETURN_PENDING' && user?.role === 'ADMIN' && (
                            <button
                              onClick={() => setSelectedReturn(item)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-900/50 rounded-xl transition-all hover:scale-[1.02] active:scale-95 cursor-pointer text-[10px] font-bold shadow-sm"
                              title={t('checkReturnTitle')}
                            >
                              <Eye size={12} />
                              <span>{t('checkReturnCondition')}</span>
                            </button>
                          )}

                          {/* Inspect details for completed returns (ADMIN view/edit date) */}
                          {item.status === 'RETURNED' && user?.role === 'ADMIN' && (
                            <button
                              onClick={() => setSelectedReturn(item)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-650 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl transition-all hover:scale-[1.02] active:scale-95 cursor-pointer text-[10px] font-bold"
                              title={t('inspectReturnTitle')}
                            >
                              <Eye size={12} />
                              <span>{language === 'th' ? 'รายละเอียดคืน' : 'Return Details'}</span>
                            </button>
                          )}

                          {/* Staff can cancel their own pending request */}
                          {item.status === 'PENDING' && user?.role === 'STAFF' && (
                            <button
                              onClick={() => handleCancel(item.id, item.requestNo)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800/20 text-slate-500 hover:text-red-500 hover:bg-rose-50 hover:border-red-200 border border-slate-200 dark:border-slate-800 rounded-xl transition-all active:scale-95 cursor-pointer text-[10px] font-bold"
                            >
                              <Ban size={12} />
                              <span>{language === 'th' ? 'ยกเลิกคำขอ' : 'Cancel Request'}</span>
                            </button>
                          )}

                          {item.status !== 'PENDING' && item.status !== 'RETURN_PENDING' && (
                            <div className="flex justify-center items-center gap-1.5">
                              <Link
                                href={`/assets/${item.asset.id}`}
                                className="p-2 border border-slate-200 dark:border-slate-850 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 text-slate-500 rounded-xl transition-colors cursor-pointer"
                                title={language === 'th' ? 'รายละเอียดสินทรัพย์' : 'Asset Details'}
                              >
                                <Eye size={14} />
                              </Link>
                              {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (item.status === 'BORROWED' || item.status === 'OVERDUE') && (
                                <Link
                                  href={`/returns/new?requestId=${item.id}`}
                                  className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-50 dark:bg-emerald-955/20 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-455 border border-emerald-250 dark:border-emerald-900/50 rounded-xl transition-all hover:scale-[1.02] active:scale-95 cursor-pointer font-bold text-[10px]"
                                  title={language === 'th' ? 'คืนของครุภัณฑ์' : 'Return Asset'}
                                >
                                  <Undo2 size={12} />
                                  <span>{language === 'th' ? 'คืนของ' : 'Return'}</span>
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Return Details Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-6 rounded-3xl shadow-xl max-w-md w-full relative flex flex-col gap-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800">
              <div className="flex items-center gap-2 text-sky-500">
                <CalendarRange size={18} />
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">{language === 'th' ? 'รายละเอียดการส่งคืนครุภัณฑ์' : 'Asset Return Details'}</h3>
              </div>
              <button
                onClick={() => setSelectedReturn(null)}
                className="p-1.5 hover:bg-slate-150 dark:hover:bg-slate-850 rounded-xl text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Asset Info Card */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-955 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{language === 'th' ? 'สินทรัพย์' : 'Asset'}</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-white mt-1 leading-snug">{selectedReturn.asset.name}</p>
                  <p className="text-[9px] text-slate-450 font-mono mt-0.5">{selectedReturn.asset.assetCode}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{language === 'th' ? 'ผู้ส่งคืน' : 'Returner'}</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-white mt-1 leading-snug">
                    {selectedReturn.borrower.firstName} {selectedReturn.borrower.lastName}
                  </p>
                  <p className="text-[9px] text-slate-450 mt-0.5">{language === 'th' ? 'แผนก' : 'Dept'}: {selectedReturn.borrower.department}</p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold">{language === 'th' ? 'วันที่ยืมใช้งาน' : 'Borrow Date'}</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mt-1">
                    {new Date(selectedReturn.borrowDate).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US')}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold">{language === 'th' ? 'กำหนดส่งคืนเดิม' : 'Expected Return Date'}</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mt-1">
                    {new Date(selectedReturn.expectedReturnDate).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US')}
                  </p>
                </div>
              </div>

              {/* Return Condition reported */}
              <div className="space-y-3 pt-3 border-t dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-750 dark:text-slate-300">{language === 'th' ? 'สภาพครุภัณฑ์ที่ส่งคืน:' : 'Returned Condition:'}</span>
                  <span className="text-xs">
                    {selectedReturn.assetReturn && getConditionBadge(selectedReturn.assetReturn.condition)}
                  </span>
                </div>

                {/* Edit Return Date (ADMIN feature) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{language === 'th' ? 'วันที่ส่งคืนจริง' : 'Actual Return Date'}</label>
                  
                  {selectedReturn.status === 'RETURN_PENDING' ? (
                    // In pending approval state, show datetime-local directly
                    <input
                      type="datetime-local"
                      value={customReturnDate}
                      onChange={(e) => setCustomReturnDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500"
                    />
                  ) : selectedReturn.status === 'RETURNED' ? (
                    // In already approved state, display as editable fields
                    isEditingDate ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="datetime-local"
                          value={customReturnDate}
                          onChange={(e) => setCustomReturnDate(e.target.value)}
                          className="flex-1 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500"
                        />
                        <button
                          onClick={handleSaveReturnDate}
                          className="p-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 active:scale-95 transition-all cursor-pointer"
                          title={language === 'th' ? 'บันทึกวันที่ใหม่' : 'Save New Date'}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setIsEditingDate(false)}
                          className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-955 px-3.5 py-2 rounded-xl border border-slate-100 dark:border-slate-850">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {new Date(selectedReturn.assetReturn?.returnDate || '').toLocaleString(language === 'th' ? 'th-TH' : 'en-US')}
                        </span>
                        {user?.role === 'ADMIN' && (
                          <button
                            onClick={() => {
                              const dateVal = selectedReturn.assetReturn?.returnDate 
                                ? new Date(selectedReturn.assetReturn.returnDate)
                                : new Date();
                              const formatted = new Date(dateVal.getTime() - dateVal.getTimezoneOffset() * 60000)
                                .toISOString()
                                .slice(0, 16);
                              setCustomReturnDate(formatted);
                              setIsEditingDate(true);
                            }}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-sky-500 transition-colors cursor-pointer"
                            title={language === 'th' ? 'แก้ไขวันที่คืน' : 'Edit Return Date'}
                          >
                            <Edit3 size={12} />
                          </button>
                        )}
                      </div>
                    )
                  ) : (
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {selectedReturn.assetReturn?.returnDate ? new Date(selectedReturn.assetReturn.returnDate).toLocaleString(language === 'th' ? 'th-TH' : 'en-US') : '-'}
                    </p>
                  )}
                </div>
                
                {/* Notes */}
                {selectedReturn.assetReturn?.conditionNote && (
                  <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-2xl border border-slate-100 dark:border-slate-850 text-xs text-slate-650 dark:text-slate-400 leading-relaxed shadow-inner">
                    <p className="font-bold text-slate-450 dark:text-slate-500 text-[10px] mb-1">{language === 'th' ? 'หมายเหตุสภาพที่รายงาน:' : 'Reported Condition Note:'}</p>
                    {selectedReturn.assetReturn.conditionNote}
                  </div>
                )}

                {/* Evidence Image */}
                {selectedReturn.assetReturn?.imageUrl ? (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{language === 'th' ? 'หลักฐานรูปภาพถ่าย:' : 'Evidence Image:'}</p>
                    <div className="h-44 w-full border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 flex items-center justify-center relative shadow-sm">
                      <a href={selectedReturn.assetReturn.imageUrl} target="_blank" rel="noreferrer" className="w-full h-full block group">
                        <img
                          src={selectedReturn.assetReturn.imageUrl}
                          alt="Evidence Photo"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                        />
                      </a>
                    </div>
                    <p className="text-[9px] text-slate-400 text-center mt-1">{language === 'th' ? 'คลิกที่ภาพเพื่อขยายภาพขนาดเต็ม' : 'Click image to view full size'}</p>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic bg-slate-50/50 dark:bg-slate-955/50 py-2 px-3 rounded-xl border border-dashed dark:border-slate-800 text-center font-medium">
                    {language === 'th' ? 'ไม่มีรูปภาพประกอบสภาพส่งคืน' : 'No return condition photos'}
                  </p>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-4 border-t dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setSelectedReturn(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                {language === 'th' ? 'ปิดหน้าต่าง' : 'Close'}
              </button>
              
              {selectedReturn.status === 'RETURN_PENDING' && user?.role === 'ADMIN' && (
                <>
                  <button
                    onClick={async () => {
                      const reqNo = selectedReturn.requestNo;
                      await handleRejectReturn(selectedReturn.id, reqNo);
                    }}
                    className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-650 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    {language === 'th' ? 'ปฏิเสธการคืน' : 'Reject Return'}
                  </button>
                  <button
                    onClick={handleApproveReturnWithDate}
                    className="px-5 py-2.5 bg-gradient-to-r from-sky-400 via-sky-500 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/10 transition-all active:scale-95 cursor-pointer"
                  >
                    {language === 'th' ? 'อนุมัติรับคืน' : 'Approve Return'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}

export default function BorrowPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading transactions...</div>}>
      <BorrowContent />
    </Suspense>
  );
}

