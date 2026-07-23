'use client';

import React, { useEffect, useState, Suspense, useMemo } from 'react';

import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/components/providers/LanguageProvider';

import api from '@/lib/api';
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Box,
  QrCode,
  LayoutGrid,
  List,
  X,
  Check,
  CheckCircle2,
  Clock,
  Wrench,
  Copy,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';
import PageTransition from '@/components/common/PageTransition';
import { useToast } from '@/components/providers/ToastProvider';
import { Skeleton } from '@/components/common/Skeleton';

interface Asset {
  id: string;
  assetCode: string;
  name: string;
  category: string;
  serialNumber?: string;
  status: 'AVAILABLE' | 'BORROWED' | 'MAINTENANCE' | 'LOST' | 'RETIRED';
  imageUrl?: string;
  qrCode: string;
  currentHolder?: {
    id: string;
    firstName: string;
    lastName: string;
    department: string;
  } | null;
}

export default function AssetsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse p-4">
          <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-14 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          </div>
        </div>
      }
    >
      <AssetsContent />
    </Suspense>
  );
}

function AssetsContent() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/assets');
      setAssets(res.data);
    } catch (err) {
      console.error('Failed to fetch assets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const deleteAsset = async (id: string, name: string) => {
    if (!confirm(t('confirmDeleteAsset', { name }) || `Are you sure you want to delete ${name}?`)) return;
    try {
      await api.delete(`/assets/${id}`);
      toast.success(t('actionCompleted') || 'Success', t('assetDeleted', { name }) || `Asset ${name} deleted`);
      fetchAssets();
    } catch (err: any) {
      toast.error(t('assetDeleteFailed') || 'Error', err.response?.data?.message || t('cannotDeleteAsset') || 'Could not delete asset');
    }
  };

  const copyAssetCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    toast.success('Copied!', code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full badge-available">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t('statusAvail') || 'Available'}
          </span>
        );
      case 'BORROWED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full badge-borrowed">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            {t('statusBorrowed') || 'Borrowed'}
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full badge-maintenance">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {t('statusMaint') || 'Maintenance'}
          </span>
        );
      case 'LOST':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full badge-lost">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            {t('statusLost') || 'Lost'}
          </span>
        );
      case 'RETIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full badge-retired">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {t('statusRetired') || 'Retired'}
          </span>
        );
      default:
        return <span className="px-2 py-1 text-xs font-bold rounded-md">{status}</span>;
    }
  };

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = assets.length;
    const available = assets.filter((a) => a.status === 'AVAILABLE').length;
    const borrowed = assets.filter((a) => a.status === 'BORROWED').length;
    const maintenance = assets.filter((a) => a.status === 'MAINTENANCE').length;
    return { total, available, borrowed, maintenance };
  }, [assets]);

  const categories = useMemo(() => {
    return ['ALL', ...Array.from(new Set(assets.map((a) => a.category)))];
  }, [assets]);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesSearch =
        asset.name.toLowerCase().includes(search.toLowerCase()) ||
        asset.assetCode.toLowerCase().includes(search.toLowerCase()) ||
        (asset.serialNumber && asset.serialNumber.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory = categoryFilter === 'ALL' || asset.category === categoryFilter;
      const matchesStatus = statusFilter === 'ALL' || asset.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [assets, search, categoryFilter, statusFilter]);

  const hasActiveFilters = search !== '' || categoryFilter !== 'ALL' || statusFilter !== 'ALL';

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
  };

  return (
    <PageTransition className="space-y-6">
      {/* ===== Header Title & Actions ===== */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
              {t('assetsTitle') || 'Asset Directory'}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              {filteredAssets.length}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            {t('assetsDesc') || 'Manage equipment inventory, active assignments, and lifecycle records.'}
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/assets/print"
              className="flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-xs hover:shadow-md btn-press cursor-pointer"
            >
              <QrCode size={16} className="text-sky-500" />
              <span>{t('printQR') || 'Print QR Codes'}</span>
            </Link>
            <Link
              href="/assets/new"
              className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md shadow-sky-500/20 hover:shadow-lg hover:shadow-sky-500/30 transition-all btn-press cursor-pointer"
            >
              <Plus size={16} />
              <span>{t('addNewAsset') || 'Add New Asset'}</span>
            </Link>
          </div>
        )}
      </div>

      {/* ===== Summary Metrics Cards ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Assets */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {t('kpiTotal') || 'Total Assets'}
            </p>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">
              {metrics.total}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <Box size={20} />
          </div>
        </div>

        {/* Available */}
        <div
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer hover:border-emerald-200"
          onClick={() => setStatusFilter(statusFilter === 'AVAILABLE' ? 'ALL' : 'AVAILABLE')}
        >
          <div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {t('kpiAvailable') || 'Available'}
            </p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {metrics.available}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* Borrowed */}
        <div
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer hover:border-blue-200"
          onClick={() => setStatusFilter(statusFilter === 'BORROWED' ? 'ALL' : 'BORROWED')}
        >
          <div>
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              {t('kpiBorrowed') || 'Borrowed'}
            </p>
            <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
              {metrics.borrowed}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        {/* Maintenance */}
        <div
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer hover:border-amber-200"
          onClick={() => setStatusFilter(statusFilter === 'MAINTENANCE' ? 'ALL' : 'MAINTENANCE')}
        >
          <div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              {t('kpiMaintenance') || 'Maintenance'}
            </p>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {metrics.maintenance}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Wrench size={20} />
          </div>
        </div>
      </div>

      {/* ===== Controls Toolbar: Search, Filters & View Switcher ===== */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute inset-y-0 left-3.5 my-auto text-slate-400" size={18} />
          <input
            type="text"
            placeholder={t('assetsSearchPlaceholder') || 'Search name, code, or serial number...'}
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

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="ALL">{t('allCategories') || 'All Categories'}</option>
            {categories
              .filter((c) => c !== 'ALL')
              .map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="ALL">{t('allStatuses') || 'All Statuses'}</option>
            <option value="AVAILABLE">{t('statusAvail') || 'Available'}</option>
            <option value="BORROWED">{t('statusBorrowed') || 'Borrowed'}</option>
            <option value="MAINTENANCE">{t('statusMaint') || 'Maintenance'}</option>
            <option value="LOST">{t('statusLost') || 'Lost'}</option>
            <option value="RETIRED">{t('statusRetired') || 'Retired'}</option>
          </select>

          {/* Clear Filters Button */}
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

          {/* View Switcher: Grid vs Table */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all text-xs font-medium flex items-center gap-1 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
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
          </div>
        </div>
      </div>

      {/* ===== Assets Content Display ===== */}
      {loading ? (
        /* Loading Skeletons */
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
                <Skeleton className="h-44 w-full rounded-xl" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden p-6 space-y-4 shadow-xs">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Skeleton key={idx} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        )
      ) : filteredAssets.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-16 text-center shadow-xs max-w-lg mx-auto">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Box size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
            {t('noAssetsFound') || 'No Assets Found'}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
            {hasActiveFilters
              ? 'No matching assets found for your search parameters. Try resetting your filters.'
              : 'There are no assets registered in the system yet.'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/20 transition-all cursor-pointer"
            >
              Reset All Filters
            </button>
          ) : user?.role === 'ADMIN' ? (
            <Link
              href="/assets/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/20 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>{t('addNewAsset') || 'Add Asset'}</span>
            </Link>
          ) : null}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAssets.map((asset, index) => (
            <div
              key={asset.id}
              className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col justify-between overflow-hidden hover-lift transition-all animate-fade-in-up stagger-${Math.min(index + 1, 12)} group`}
            >
              {/* Image Banner Container */}
              <div className="h-48 bg-slate-100 dark:bg-slate-800 relative overflow-hidden flex items-center justify-center border-b border-slate-100 dark:border-slate-800">
                {asset.imageUrl ? (
                  <img
                    src={asset.imageUrl}
                    alt={asset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-300 dark:text-slate-600">
                    <Box size={48} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">No Image</span>
                  </div>
                )}

                {/* Status Badge Float */}
                <div className="absolute top-3 right-3 z-10">
                  {getStatusBadge(asset.status)}
                </div>

                {/* Category Floating Tag */}
                <div className="absolute bottom-3 left-3 z-10 bg-slate-900/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider border border-white/10">
                  {asset.category}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  {/* Asset Code & Copy */}
                  <div className="flex items-center justify-between text-xs">
                    <button
                      onClick={(e) => copyAssetCode(asset.assetCode, e)}
                      className="inline-flex items-center gap-1 text-[11px] font-extrabold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 px-2 py-0.5 rounded-md border border-sky-100 dark:border-sky-900/50 transition-colors cursor-pointer"
                      title="Click to copy code"
                    >
                      <span>{asset.assetCode}</span>
                      {copiedId === asset.assetCode ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="opacity-60" />}
                    </button>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      S/N: {asset.serialNumber || '-'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-snug line-clamp-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {asset.name}
                  </h3>

                  {/* Current Holder info */}
                  {asset.currentHolder && (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <UserCheck size={14} className="text-blue-500" />
                        <span className="font-medium">{t('currentHolder') || 'Holder'}</span>
                      </div>
                      <span className="text-slate-800 dark:text-slate-200 font-bold bg-white dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-600 shadow-2xs">
                        {asset.currentHolder.firstName} ({asset.currentHolder.department})
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Link
                    href={`/assets/${asset.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 text-slate-600 dark:text-slate-300 text-xs font-semibold py-2 rounded-xl transition-all cursor-pointer"
                  >
                    <Eye size={14} />
                    <span>{t('viewDetails') || 'Details'}</span>
                  </Link>

                  {asset.status === 'AVAILABLE' &&
                    (user?.role === 'STAFF' || user?.role === 'ADMIN' || user?.role === 'APPROVER') && (
                      <Link
                        href={`/borrow/new?assetId=${asset.id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold py-2 rounded-xl transition-all shadow-xs shadow-sky-500/10 cursor-pointer btn-press"
                      >
                        <Plus size={14} />
                        <span>{t('actBorrow') || 'Borrow'}</span>
                      </Link>
                    )}

                  {user?.role === 'ADMIN' && (
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/assets/${asset.id}/edit`}
                        className="p-2 border border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:text-amber-600 text-slate-500 dark:text-slate-400 rounded-xl transition-colors cursor-pointer"
                        title="Edit Asset"
                      >
                        <Edit2 size={14} />
                      </Link>
                      <button
                        onClick={() => deleteAsset(asset.id, asset.name)}
                        className="p-2 border border-slate-200 dark:border-slate-700 hover:border-rose-500 hover:text-rose-600 text-slate-500 dark:text-slate-400 rounded-xl transition-colors cursor-pointer"
                        title="Delete Asset"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE / LIST VIEW */
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Asset Code</th>
                  <th className="py-3.5 px-4">Asset Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Current Holder</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="table-row-hover transition-colors">
                    {/* Code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">
                      {asset.assetCode}
                    </td>

                    {/* Name & Serial */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                          {asset.imageUrl ? (
                            <img src={asset.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Box size={16} className="text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100">{asset.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            SN: {asset.serialNumber || '-'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {asset.category}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">{getStatusBadge(asset.status)}</td>

                    {/* Holder */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                      {asset.currentHolder ? (
                        <span>
                          {asset.currentHolder.firstName} ({asset.currentHolder.department})
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/assets/${asset.id}`}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </Link>
                        {asset.status === 'AVAILABLE' &&
                          (user?.role === 'STAFF' || user?.role === 'ADMIN' || user?.role === 'APPROVER') && (
                            <Link
                              href={`/borrow/new?assetId=${asset.id}`}
                              className="px-2.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-[11px] font-semibold transition-colors shadow-xs"
                            >
                              Borrow
                            </Link>
                          )}
                        {user?.role === 'ADMIN' && (
                          <>
                            <Link
                              href={`/assets/${asset.id}/edit`}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:text-amber-600 text-slate-500 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </Link>
                            <button
                              onClick={() => deleteAsset(asset.id, asset.name)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-rose-500 hover:text-rose-600 text-slate-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageTransition>
  );
}

