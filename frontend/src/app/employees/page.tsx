'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import api from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useToast } from '@/components/providers/ToastProvider';
import PageTransition from '@/components/common/PageTransition';
import { Skeleton } from '@/components/common/Skeleton';
import {
  Trash2,
  Edit2,
  Phone,
  Briefcase,
  Mail,
  Search,
  UserPlus,
  X,
  Users,
  Building2,
  ShieldCheck,
  Fingerprint,
  Lock,
  LayoutGrid,
  List,
  RefreshCw,
  Copy,
  Check,
  Save,
  PhoneCall,
} from 'lucide-react';

interface EmployeeData {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  department: string;
  email: string;
  phone?: string | null;
}

export default function EmployeesPage() {
  const { user: currentUser } = useAuth();
  const { language } = useLanguage();
  const toast = useToast();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [mounted, setMounted] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal Dialog State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    employeeCode: '',
    firstName: '',
    lastName: '',
    department: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    setMounted(true);
    fetchEmployees();
  }, []);

  const fetchEmployees = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const res = await api.get('/employees');
      setEmployees(res.data);
      if (isManualRefresh) {
        toast.success(
          language === 'th' ? 'รีเฟรชข้อมูลเรียบร้อย' : 'Data Refreshed',
          language === 'th' ? 'ซิงค์ข้อมูลรายชื่อพนักงานล่าสุดแล้ว' : 'Synchronized latest employee directory.'
        );
      }
    } catch (err) {
      console.error('Failed to fetch employees', err);
      toast.error(
        language === 'th' ? 'เกิดข้อผิดพลาดในการโหลดข้อมูล' : 'Error loading data',
        language === 'th' ? 'ไม่สามารถดึงข้อมูลพนักงานจากเซิร์ฟเวอร์ได้' : 'Failed to retrieve employees data.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Keyboard escape handler for closing modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const copyText = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    toast.success('Copied!', text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Compute Department List for Quick Filter Chips
  const departmentList = useMemo(() => {
    const counts: Record<string, number> = {};
    employees.forEach((e) => {
      if (e.department) {
        counts[e.department] = (counts[e.department] || 0) + 1;
      }
    });
    return [
      { name: 'ALL', count: employees.length },
      ...Object.entries(counts).map(([name, count]) => ({ name, count })),
    ];
  }, [employees]);

  // Compute KPI Stats
  const stats = useMemo(() => {
    const total = employees.length;
    const depts = new Set(employees.map((e) => e.department)).size;
    const withPhone = employees.filter((e) => Boolean(e.phone)).length;
    const withTifEmail = employees.filter((e) => e.email && e.email.includes('@tif.ac.th')).length;
    return { total, depts, withPhone, withTifEmail };
  }, [employees]);

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (selectedDeptFilter !== 'ALL' && emp.department !== selectedDeptFilter) {
        return false;
      }
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        emp.employeeCode.toLowerCase().includes(q) ||
        emp.firstName.toLowerCase().includes(q) ||
        emp.lastName.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        (emp.phone && emp.phone.includes(q))
      );
    });
  }, [employees, searchQuery, selectedDeptFilter]);

  const hasActiveFilters = searchQuery !== '' || selectedDeptFilter !== 'ALL';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDeptFilter('ALL');
  };

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingEmployee(null);
    setFormData({
      employeeCode: '',
      firstName: '',
      lastName: '',
      department: '',
      email: '',
      phone: '',
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (emp: EmployeeData) => {
    setEditingEmployee(emp);
    setFormData({
      employeeCode: emp.employeeCode,
      firstName: emp.firstName,
      lastName: emp.lastName,
      department: emp.department,
      email: emp.email,
      phone: emp.phone || '',
    });
    setIsModalOpen(true);
  };

  // Save (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingEmployee) {
        const res = await api.patch(`/employees/${editingEmployee.id}`, formData);
        toast.success(
          language === 'th' ? 'อัปเดตข้อมูลพนักงานเรียบร้อย' : 'Employee Details Updated',
          language === 'th'
            ? `แก้ไขข้อมูลคุณ ${res.data.firstName} ${res.data.lastName} เรียบร้อยแล้ว`
            : `Updated details for ${res.data.firstName} ${res.data.lastName}`
        );
      } else {
        const res = await api.post('/employees', formData);
        toast.success(
          language === 'th' ? 'ลงทะเบียนพนักงานใหม่เรียบร้อย' : 'New Employee Registered',
          language === 'th'
            ? `ลงทะเบียน ${res.data.firstName} ${res.data.lastName} เข้าสู่ระบบแล้ว`
            : `Registered ${res.data.firstName} ${res.data.lastName} into system`
        );
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        (language === 'th' ? 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' : 'Error saving employee data');
      toast.error(
        language === 'th' ? 'ดำเนินการไม่สำเร็จ' : 'Operation Failed',
        Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        language === 'th'
          ? `คุณแน่ใจหรือไม่ที่จะลบรายชื่อพนักงาน: ${name}?`
          : `Are you sure you want to delete employee: ${name}?`
      )
    )
      return;

    try {
      await api.delete(`/employees/${id}`);
      toast.success(
        language === 'th' ? 'ลบรายชื่อพนักงานเรียบร้อยแล้ว' : 'Employee Deleted',
        language === 'th' ? `ลบพนักงาน ${name} ออกจากระบบแล้ว` : `Deleted ${name} from system`
      );
      fetchEmployees();
    } catch (err: any) {
      toast.error(
        language === 'th' ? 'การลบล้มเหลว' : 'Delete Failed',
        err.response?.data?.message ||
          (language === 'th' ? 'ไม่สามารถลบข้อมูลพนักงานได้' : 'Cannot delete employee')
      );
    }
  };

  return (
    <PageTransition className="space-y-6">
      {/* ===== HEADER TITLE & ACTIONS ===== */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 font-heading">
              {language === 'th' ? 'บริหารจัดการรายชื่อและบุคลากร' : 'Employee Directory'}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              {filteredEmployees.length}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Thai Inter Flying Co., Ltd. • {stats.depts}{' '}
            {language === 'th' ? 'แผนกงานในระบบ' : 'Departments Active'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => fetchEmployees(true)}
            disabled={refreshing}
            className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all shadow-xs btn-press cursor-pointer disabled:opacity-50"
            title={language === 'th' ? 'รีเฟรชข้อมูล' : 'Refresh Data'}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin text-sky-500' : ''} />
          </button>

          {isAdmin && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md shadow-sky-500/20 hover:shadow-lg hover:shadow-sky-500/30 transition-all btn-press cursor-pointer font-heading"
            >
              <UserPlus size={16} />
              <span>{language === 'th' ? 'เพิ่มพนักงาน' : 'Add Staff'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ===== SUMMARY METRIC CARDS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Staff */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {language === 'th' ? 'พนักงานทั้งหมด' : 'Total Staff'}
            </p>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">
              {stats.total}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <Users size={20} />
          </div>
        </div>

        {/* Departments */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
              {language === 'th' ? 'แผนกงาน' : 'Departments'}
            </p>
            <p className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 mt-1">
              {stats.depts}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Building2 size={20} />
          </div>
        </div>

        {/* Corporate Email Users */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {language === 'th' ? 'อีเมลองค์กร TIF' : 'Corporate Email'}
            </p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.withTifEmail}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
        </div>

        {/* Direct Phone */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              {language === 'th' ? 'มีเบอร์โทรติดต่อ' : 'Direct Contacts'}
            </p>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {stats.withPhone}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <PhoneCall size={20} />
          </div>
        </div>
      </div>

      {/* ===== CONTROLS TOOLBAR ===== */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        {/* Search Box */}
        <div className="flex-1 relative">
          <Search className="absolute inset-y-0 left-3.5 my-auto text-slate-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'th'
                ? 'ค้นหาด้วยรหัสพนักงาน, ชื่อ-นามสกุล, แผนก หรืออีเมล...'
                : 'Search by code, name, department, email...'
            }
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-3 my-auto text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Department Chips Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {departmentList.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] max-w-full">
              {departmentList.map((dept) => (
                <button
                  key={dept.name}
                  onClick={() => setSelectedDeptFilter(dept.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    selectedDeptFilter === dept.name
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>{dept.name === 'ALL' ? (language === 'th' ? 'ทั้งหมด' : 'All') : dept.name}</span>
                  <span
                    className={`px-1.5 py-0.2 text-[9px] font-mono rounded-md ${
                      selectedDeptFilter === dept.name
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    }`}
                  >
                    {dept.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/50 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              <X size={14} />
              <span>Reset</span>
            </button>
          )}

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          {/* View Mode Switcher */}
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

      {/* ===== CONTENT DISPLAY ===== */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden p-6 space-y-4 shadow-xs">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-16 text-center shadow-xs max-w-lg mx-auto">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
            {language === 'th' ? 'ไม่พบข้อมูลพนักงาน' : 'No Employees Found'}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
            {hasActiveFilters
              ? 'No staff members match your search keywords or department filter. Try resetting your query.'
              : 'There are no employees registered in the system.'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/20 transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          ) : isAdmin ? (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/20 transition-all cursor-pointer"
            >
              <UserPlus size={16} />
              <span>{language === 'th' ? 'เพิ่มพนักงาน' : 'Add Employee'}</span>
            </button>
          ) : null}
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">{language === 'th' ? 'รหัสพนักงาน' : 'Code'}</th>
                  <th className="py-3.5 px-5">{language === 'th' ? 'ชื่อ - นามสกุล' : 'Full Name'}</th>
                  <th className="py-3.5 px-5">{language === 'th' ? 'แผนก / ฝ่าย' : 'Department'}</th>
                  <th className="py-3.5 px-5">{language === 'th' ? 'อีเมลองค์กร' : 'Corporate Email'}</th>
                  <th className="py-3.5 px-5">{language === 'th' ? 'เบอร์โทรศัพท์' : 'Direct Phone'}</th>
                  {isAdmin && <th className="py-3.5 px-5 text-right">{language === 'th' ? 'จัดการ' : 'Actions'}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredEmployees.map((emp) => {
                  const initials = `${emp.firstName.charAt(0)}${emp.lastName.charAt(0)}`.toUpperCase();
                  return (
                    <tr key={emp.id} className="table-row-hover transition-colors">
                      {/* Code */}
                      <td className="py-4 px-5">
                        <button
                          onClick={(e) => copyText(emp.employeeCode, e)}
                          className="font-mono font-bold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                          title="Click to copy code"
                        >
                          <span>{emp.employeeCode}</span>
                          {copiedCode === emp.employeeCode ? (
                            <Check size={10} className="text-emerald-500" />
                          ) : (
                            <Copy size={10} className="opacity-40" />
                          )}
                        </button>
                      </td>

                      {/* Full Name */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs font-mono shrink-0 shadow-xs">
                            {initials}
                          </div>
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {emp.firstName} {emp.lastName}
                          </span>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg font-semibold text-[11px]">
                          <Briefcase size={12} className="text-sky-500" />
                          <span>{emp.department}</span>
                        </span>
                      </td>

                      {/* Corporate Email */}
                      <td className="py-4 px-5 font-medium">
                        <a
                          href={`mailto:${emp.email}`}
                          className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                        >
                          <Mail size={13} className="text-slate-400" />
                          <span>{emp.email}</span>
                        </a>
                      </td>

                      {/* Direct Phone */}
                      <td className="py-4 px-5 font-mono">
                        {emp.phone ? (
                          <a
                            href={`tel:${emp.phone}`}
                            className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-amber-500 transition-colors"
                          >
                            <Phone size={13} className="text-amber-500" />
                            <span>{emp.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-xs">-</span>
                        )}
                      </td>

                      {/* Admin Actions */}
                      {isAdmin && (
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(emp)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-sky-500 hover:text-sky-600 text-slate-500 transition-colors cursor-pointer"
                              title="Edit Employee"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(emp.id, `${emp.firstName} ${emp.lastName}`)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-rose-500 hover:text-rose-600 text-slate-500 transition-colors cursor-pointer"
                              title="Delete Employee"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEmployees.map((emp, idx) => {
            const initials = `${emp.firstName.charAt(0)}${emp.lastName.charAt(0)}`.toUpperCase();
            return (
              <div
                key={emp.id}
                className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover-lift transition-all flex flex-col justify-between space-y-4 animate-fade-in-up stagger-${Math.min(
                  idx + 1,
                  12
                )}`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-0.5 rounded-md border border-sky-100 dark:border-sky-900/50">
                      {emp.employeeCode}
                    </span>
                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(emp)}
                          className="p-1 border border-slate-200 dark:border-slate-700 hover:border-sky-500 hover:text-sky-600 text-slate-400 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id, `${emp.firstName} ${emp.lastName}`)}
                          className="p-1 border border-slate-200 dark:border-slate-700 hover:border-rose-500 hover:text-rose-600 text-slate-400 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Profile Info */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs font-mono shrink-0 shadow-xs">
                      {initials}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug truncate">
                        {emp.firstName} {emp.lastName}
                      </h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 flex items-center gap-1 truncate">
                        <Briefcase size={11} className="text-sky-500 shrink-0" />
                        <span className="truncate">{emp.department}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Contact Links */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <a
                    href={`mailto:${emp.email}`}
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-slate-600 dark:text-slate-300 hover:text-sky-600 transition-colors font-medium text-[11px] truncate"
                  >
                    <Mail size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </a>

                  {emp.phone && (
                    <a
                      href={`tel:${emp.phone}`}
                      className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-600 dark:text-slate-300 hover:text-amber-500 transition-colors font-mono text-[11px]"
                    >
                      <Phone size={13} className="text-amber-500 shrink-0" />
                      <span>{emp.phone}</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REACT PORTAL MODAL DIALOG */}
      {isModalOpen &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 text-left animate-fade-in"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-slate-800 dark:text-slate-100 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 shrink-0 font-bold">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-heading">
                      {editingEmployee
                        ? language === 'th'
                          ? 'แก้ไขข้อมูลพนักงาน'
                          : 'Edit Employee Records'
                        : language === 'th'
                        ? 'ลงทะเบียนเพิ่มพนักงานใหม่'
                        : 'Add New Employee'}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {editingEmployee
                        ? `${editingEmployee.employeeCode} • ${editingEmployee.firstName} ${editingEmployee.lastName}`
                        : language === 'th'
                        ? 'กรอกข้อมูลพนักงานเพื่อบันทึกเข้าสู่ระบบ'
                        : 'Fill in details to register employee'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <X size={17} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Employee Code */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    {language === 'th' ? 'รหัสพนักงาน *' : 'Employee Code *'}
                  </label>
                  <div className="relative">
                    <Fingerprint
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      required
                      value={formData.employeeCode}
                      onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                      placeholder="690011"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-sky-600 dark:text-sky-400 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* First Name & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      {language === 'th' ? 'ชื่อจริง *' : 'First Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="นายวัชระ"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      {language === 'th' ? 'นามสกุล (ชื่อเล่น) *' : 'Last Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="ผลชัย (เซฟ)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    {language === 'th' ? 'แผนก / ฝ่ายงาน *' : 'Department *'}
                  </label>
                  <div className="relative">
                    <Briefcase
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      required
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="เช่น IT Support Officer (BKK)"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      {language === 'th' ? 'อีเมลติดต่อ *' : 'Corporate Email *'}
                    </label>
                    <div className="relative">
                      <Mail
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="watchara.pho@tif.ac.th"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      {language === 'th' ? 'เบอร์โทรศัพท์' : 'Direct Phone'}
                    </label>
                    <div className="relative">
                      <Phone
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="098-042-0324"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                    <Lock size={12} className="text-sky-500 shrink-0" />
                    <span>Audit Logs</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                    >
                      {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-500/20 transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 font-heading"
                    >
                      {submitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save size={15} />
                      )}
                      <span>
                        {submitting
                          ? language === 'th'
                            ? 'กำลังบันทึก...'
                            : 'Saving...'
                          : language === 'th'
                          ? 'บันทึกข้อมูล'
                          : 'Save Employee'}
                      </span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </PageTransition>
  );
}
