'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/components/providers/LanguageProvider';
import api from '@/lib/api';
import {
  History,
  Image as ImageIcon,
  Search,
  X,
  CheckCircle2,
  AlertTriangle,
  LayoutGrid,
  List,
  User,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import PageTransition from '@/components/common/PageTransition';
import { Skeleton } from '@/components/common/Skeleton';
import { useToast } from '@/components/providers/ToastProvider';

interface AssetReturn {
  id: string;
  returnDate: string;
  condition: 'NORMAL' | 'DAMAGED' | 'LOST' | 'INCOMPLETE';
  conditionNote?: string | null;
  imageUrl?: string | null;
  recordedBy: {
    name: string;
  };
  asset: {
    assetCode: string;
    name: string;
  };
  borrowRequest: {
    requestNo: string;
    borrower: {
      firstName: string;
      lastName: string;
      department: string;
    };
  };
}

export default function ReturnsHistoryPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const toast = useToast();

  const [returns, setReturns] = useState<AssetReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [conditionFilter, setConditionFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchReturns = async () => {
      setLoading(true);
      try {
        const res = await api.get('/returns');
        setReturns(res.data);
      } catch (err) {
        console.error('Failed to fetch returns history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReturns();
  }, []);

  const copyText = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success('Copied!', text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getConditionBadge = (cond: string) => {
    switch (cond) {
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full badge-available">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {language === 'th' ? 'ปกติ (Normal)' : 'Normal'}
          </span>
        );
      case 'INCOMPLETE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full badge-maintenance">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {language === 'th' ? 'อุปกรณ์ไม่ครบ (Incomplete)' : 'Incomplete'}
          </span>
        );
      case 'DAMAGED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full badge-lost">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            {language === 'th' ? 'ชำรุด (Damaged)' : 'Damaged'}
          </span>
        );
      case 'LOST':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-700" />
            {language === 'th' ? 'สูญหาย (Lost)' : 'Lost'}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {cond}
          </span>
        );
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = returns.length;
    const normal = returns.filter((r) => r.condition === 'NORMAL').length;
    const issues = returns.filter((r) => r.condition !== 'NORMAL').length;
    const withImages = returns.filter((r) => Boolean(r.imageUrl)).length;
    return { total, normal, issues, withImages };
  }, [returns]);

  // Filtered Returns
  const filteredReturns = useMemo(() => {
    return returns.filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch =
        item.asset.name.toLowerCase().includes(q) ||
        item.asset.assetCode.toLowerCase().includes(q) ||
        item.borrowRequest.requestNo.toLowerCase().includes(q) ||
        item.borrowRequest.borrower.firstName.toLowerCase().includes(q) ||
        item.borrowRequest.borrower.department.toLowerCase().includes(q);

      const matchesCondition = conditionFilter === 'ALL' || item.condition === conditionFilter;

      return matchesSearch && matchesCondition;
    });
  }, [returns, search, conditionFilter]);

  const hasActiveFilters = search !== '' || conditionFilter !== 'ALL';

  const clearFilters = () => {
    setSearch('');
    setConditionFilter('ALL');
  };

  return (
    <PageTransition className="space-y-6">
      {/* ===== Header Title & Actions ===== */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
              {language === 'th' ? 'ประวัติการคืนสินทรัพย์' : 'Asset Return History'}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              {filteredReturns.length}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            {language === 'th'
              ? 'ประวัติบันทึกการส่งคืนครุภัณฑ์และสภาพอุปกรณ์หลังการใช้งาน'
              : 'Record of asset returns and equipment condition after use.'}
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <Link
            href="/returns/new"
            className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md shadow-sky-500/20 hover:shadow-lg hover:shadow-sky-500/30 transition-all btn-press cursor-pointer shrink-0"
          >
            <History size={16} />
            <span>{language === 'th' ? 'รับคืนสินทรัพย์' : 'Return Assets'}</span>
          </Link>
        )}
      </div>

      {/* ===== Metric Summary Cards ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Returns */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {language === 'th' ? 'รายการคืนทั้งหมด' : 'Total Returns'}
            </p>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">
              {metrics.total}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <History size={20} />
          </div>
        </div>

        {/* Normal Condition */}
        <div
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer hover:border-emerald-200"
          onClick={() => setConditionFilter(conditionFilter === 'NORMAL' ? 'ALL' : 'NORMAL')}
        >
          <div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {language === 'th' ? 'สภาพปกติ' : 'Normal Condition'}
            </p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {metrics.normal}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* Issues / Damaged */}
        <div
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer hover:border-amber-200"
          onClick={() => setConditionFilter(conditionFilter === 'DAMAGED' ? 'ALL' : 'DAMAGED')}
        >
          <div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              {language === 'th' ? 'มีปัญหา/ชำรุด' : 'Issues / Damaged'}
            </p>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {metrics.issues}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
        </div>

        {/* With Image Proof */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
              {language === 'th' ? 'มีรูปแนบหลักฐาน' : 'With Image Proof'}
            </p>
            <p className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 mt-1">
              {metrics.withImages}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <ImageIcon size={20} />
          </div>
        </div>
      </div>

      {/* ===== Toolbar: Search, Condition Filter & View Mode ===== */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute inset-y-0 left-3.5 my-auto text-slate-400" size={18} />
          <input
            type="text"
            placeholder={
              language === 'th'
                ? 'ค้นหาชื่อครุภัณฑ์, รหัสครุภัณฑ์, ผู้คืน หรือ เลขคำขอ...'
                : 'Search asset name, code, borrower, or request no...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-3 my-auto text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters & View Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="ALL">{language === 'th' ? 'สภาพการคืนทั้งหมด' : 'All Conditions'}</option>
            <option value="NORMAL">{language === 'th' ? 'ปกติ (Normal)' : 'Normal'}</option>
            <option value="INCOMPLETE">{language === 'th' ? 'อุปกรณ์ไม่ครบ (Incomplete)' : 'Incomplete'}</option>
            <option value="DAMAGED">{language === 'th' ? 'ชำรุด (Damaged)' : 'Damaged'}</option>
            <option value="LOST">{language === 'th' ? 'สูญหาย (Lost)' : 'Lost'}</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/50 px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <X size={14} />
              <span>Reset</span>
            </button>
          )}

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all text-xs font-medium flex items-center gap-1 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Table View"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all text-xs font-medium flex items-center gap-1 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ===== Content Display ===== */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden p-6 space-y-4 shadow-xs">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredReturns.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-16 text-center shadow-xs max-w-lg mx-auto">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <History size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
            {language === 'th' ? 'ไม่พบประวัติการรับคืน' : 'No Return Records Found'}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
            {hasActiveFilters
              ? 'No matching return logs found for your search query. Try resetting your search parameters.'
              : 'There are no asset return records logged in the system yet.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/20 transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">{language === 'th' ? 'วันที่คืน' : 'Return Date'}</th>
                  <th className="py-3.5 px-5">{language === 'th' ? 'สินทรัพย์ / รหัส' : 'Asset / Code'}</th>
                  <th className="py-3.5 px-5">{language === 'th' ? 'ผู้คืน / ฝ่าย' : 'Borrower / Dept'}</th>
                  <th className="py-3.5 px-5">{language === 'th' ? 'รหัสคำขอ' : 'Request No.'}</th>
                  <th className="py-3.5 px-5">{language === 'th' ? 'สภาพการส่งคืน' : 'Condition'}</th>
                  <th className="py-3.5 px-5">{language === 'th' ? 'หมายเหตุ/รูปถ่าย' : 'Notes & Proof'}</th>
                  <th className="py-3.5 px-5">{language === 'th' ? 'ผู้บันทึก' : 'Recorded By'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredReturns.map((item) => (
                  <tr key={item.id} className="table-row-hover transition-colors">
                    {/* Return Date */}
                    <td className="py-4 px-5 text-slate-600 dark:text-slate-300">
                      <p className="font-semibold">
                        {new Date(item.returnDate).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US')}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {new Date(item.returnDate).toLocaleTimeString(language === 'th' ? 'th-TH' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {language === 'th' ? ' น.' : ''}
                      </p>
                    </td>

                    {/* Asset Name & Code */}
                    <td className="py-4 px-5">
                      <p className="font-bold text-slate-800 dark:text-slate-100">{item.asset.name}</p>
                      <button
                        onClick={(e) => copyText(item.asset.assetCode, e)}
                        className="inline-flex items-center gap-1 text-[10px] font-mono text-sky-600 dark:text-sky-400 hover:underline cursor-pointer mt-0.5"
                        title="Click to copy asset code"
                      >
                        <span>{item.asset.assetCode}</span>
                        {copiedId === item.asset.assetCode ? (
                          <Check size={10} className="text-emerald-500" />
                        ) : (
                          <Copy size={10} className="opacity-50" />
                        )}
                      </button>
                    </td>

                    {/* Borrower Info */}
                    <td className="py-4 px-5">
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {item.borrowRequest.borrower.firstName} {item.borrowRequest.borrower.lastName}
                      </p>
                      <p className="text-[10px] text-slate-400">{item.borrowRequest.borrower.department}</p>
                    </td>

                    {/* Request No */}
                    <td className="py-4 px-5">
                      <button
                        onClick={(e) => copyText(item.borrowRequest.requestNo, e)}
                        className="font-mono font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 px-2 py-1 rounded-md text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>{item.borrowRequest.requestNo}</span>
                        {copiedId === item.borrowRequest.requestNo ? (
                          <Check size={10} className="text-emerald-500" />
                        ) : (
                          <Copy size={10} className="opacity-40" />
                        )}
                      </button>
                    </td>

                    {/* Condition Badge */}
                    <td className="py-4 px-5">{getConditionBadge(item.condition)}</td>

                    {/* Notes & Image Proof */}
                    <td className="py-4 px-5 max-w-[220px]">
                      <div className="space-y-1">
                        {item.conditionNote ? (
                          <p className="text-slate-600 dark:text-slate-300 truncate" title={item.conditionNote}>
                            {item.conditionNote}
                          </p>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-[10px] italic">No note</span>
                        )}

                        {item.imageUrl && (
                          <a
                            href={item.imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-semibold bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded-md border border-sky-100 dark:border-sky-900/50 transition-colors"
                          >
                            <ImageIcon size={12} />
                            <span>{language === 'th' ? 'หลักฐานรูปภาพ' : 'Image Proof'}</span>
                            <ExternalLink size={10} className="opacity-60" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Recorded By */}
                    <td className="py-4 px-5 text-slate-500 dark:text-slate-400 font-medium">
                      {item.recordedBy.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReturns.map((item, idx) => (
            <div
              key={item.id}
              className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover-lift transition-all flex flex-col justify-between space-y-4 animate-fade-in-up stagger-${Math.min(
                idx + 1,
                12
              )}`}
            >
              <div className="space-y-3">
                {/* Header Condition & Date */}
                <div className="flex items-center justify-between">
                  {getConditionBadge(item.condition)}
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(item.returnDate).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US')}
                  </span>
                </div>

                {/* Asset Title & Code */}
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base line-clamp-1">
                    {item.asset.name}
                  </h4>
                  <p className="text-xs font-mono text-sky-600 dark:text-sky-400 font-semibold mt-0.5">
                    {item.asset.assetCode}
                  </p>
                </div>

                {/* Borrower details */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-xs border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      <span>{language === 'th' ? 'ผู้คืน' : 'Borrower'}</span>
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {item.borrowRequest.borrower.firstName} ({item.borrowRequest.borrower.department})
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                    <span>{language === 'th' ? 'เลขคำขอ' : 'Request No'}</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {item.borrowRequest.requestNo}
                    </span>
                  </div>
                </div>

                {/* Condition note */}
                {item.conditionNote && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    "{item.conditionNote}"
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  {language === 'th' ? 'ผู้รับ:' : 'By:'} {item.recordedBy.name}
                </span>
                {item.imageUrl && (
                  <a
                    href={item.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-semibold"
                  >
                    <ImageIcon size={12} />
                    <span>View Image</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageTransition>
  );
}

