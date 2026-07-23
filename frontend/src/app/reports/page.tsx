'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/components/providers/LanguageProvider';
import api from '@/lib/api';
import {
  FileText,
  Clock,
  AlertTriangle,
  User,
  Box,
  Download,
  Printer
} from 'lucide-react';

function ReportsContent() {
  const { language } = useLanguage();
  const searchParams = useSearchParams();
  const isEN = language === 'en';

  const [reportType, setReportType] = useState<'borrowed' | 'overdue' | 'damaged' | 'employee' | 'asset'>('borrowed');
  
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam && ['borrowed', 'overdue', 'damaged', 'employee', 'asset'].includes(typeParam)) {
      setReportType(typeParam as any);
    }
  }, [searchParams]);

  
  // Data lists
  const [borrowedData, setBorrowedData] = useState<any[]>([]);
  const [overdueData, setOverdueData] = useState<any[]>([]);
  const [damagedData, setDamagedData] = useState<any[]>([]);
  
  // Dropdown lists
  const [employees, setEmployees] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  
  // Selected search IDs
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  
  // Custom query history data
  const [employeeHistory, setEmployeeHistory] = useState<any[]>([]);
  const [assetHistory, setAssetHistory] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [borrowedRes, overdueRes, damagedRes, employeesRes, assetsRes] = await Promise.all([
          api.get('/reports/borrowed-assets'),
          api.get('/reports/overdue-assets'),
          api.get('/reports/damaged-assets'),
          api.get('/employees'),
          api.get('/assets'),
        ]);
        
        setBorrowedData(borrowedRes.data);
        setOverdueData(overdueRes.data);
        setDamagedData(damagedRes.data);
        setEmployees(employeesRes.data);
        setAssets(assetsRes.data);
      } catch (err) {
        console.error('Failed to load reports initial data');
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const handleEmployeeSearch = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const empId = e.target.value;
    setSelectedEmployeeId(empId);
    if (!empId) {
      setEmployeeHistory([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/reports/employee-history/${empId}`);
      setEmployeeHistory(res.data);
    } catch {
      console.error('Failed to fetch employee history');
    } finally {
      setLoading(false);
    }
  };

  const handleAssetSearch = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const astId = e.target.value;
    setSelectedAssetId(astId);
    if (!astId) {
      setAssetHistory([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/reports/asset-history/${astId}`);
      setAssetHistory(res.data);
    } catch {
      console.error('Failed to fetch asset history');
    } finally {
      setLoading(false);
    }
  };

  const getConditionText = (cond: string) => {
    switch (cond) {
      case 'NORMAL': return isEN ? 'Normal' : 'ปกติ';
      case 'INCOMPLETE': return isEN ? 'Incomplete Parts' : 'อุปกรณ์ไม่ครบ';
      case 'DAMAGED': return isEN ? 'Damaged' : 'ชำรุดเสียหาย';
      case 'LOST': return isEN ? 'Lost' : 'สูญหาย';
      default: return cond;
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const exportBorrowedCsv = () => {
    const headers = isEN
      ? ['Asset Code', 'Asset Name', 'Category', 'Current Borrower', 'Department']
      : ['รหัสสินทรัพย์', 'ชื่อสินทรัพย์', 'หมวดหมู่', 'ผู้ยืมปัจจุบัน', 'แผนก'];
    const rowMapper = (item: any) => [
      item.assetCode,
      item.name,
      item.category,
      item.currentHolder ? `${item.currentHolder.firstName} ${item.currentHolder.lastName}` : (isEN ? 'None' : 'ไม่มี'),
      item.currentHolder?.department || ''
    ];
    const fileName = isEN
      ? `Borrowed_Assets_Report_${new Date().toLocaleDateString('en-US')}`
      : `รายงานครุภัณฑ์ที่อยู่ระหว่างการยืมในขณะนี้_${new Date().toLocaleDateString('th-TH')}`;
    exportToCSV(borrowedData, headers, rowMapper, fileName);
  };

  const exportOverdueCsv = () => {
    const headers = isEN
      ? ['Request No.', 'Asset Code', 'Asset Name', 'Borrower', 'Department', 'Borrow Date', 'Due Date', 'Days Overdue']
      : ['เลขที่คำขอ', 'รหัสสินทรัพย์', 'ชื่อสินทรัพย์', 'ผู้ยืม', 'แผนก', 'วันที่ยืม', 'กำหนดส่งคืน', 'จำนวนวันเลยกำหนด'];
    const rowMapper = (item: any) => {
      const delayDays = Math.floor((Date.now() - new Date(item.expectedReturnDate).getTime()) / 86400000);
      return [
        item.requestNo,
        item.asset.assetCode,
        item.asset.name,
        `${item.borrower.firstName} ${item.borrower.lastName}`,
        item.borrower.department,
        new Date(item.borrowDate).toLocaleDateString(isEN ? 'en-US' : 'th-TH'),
        new Date(item.expectedReturnDate).toLocaleDateString(isEN ? 'en-US' : 'th-TH'),
        delayDays > 0 ? (isEN ? `${delayDays} days` : `${delayDays} วัน`) : (isEN ? 'Today' : 'วันนี้')
      ];
    };
    const fileName = isEN
      ? `Overdue_Returns_Report_${new Date().toLocaleDateString('en-US')}`
      : `รายงานรายการค้างส่งคืน_${new Date().toLocaleDateString('th-TH')}`;
    exportToCSV(overdueData, headers, rowMapper, fileName);
  };

  const exportDamagedCsv = () => {
    const headers = isEN
      ? ['Return Date', 'Asset Code', 'Asset Name', 'Returned By', 'Borrower Dept.', 'Recorded By', 'Damage Details']
      : ['วันที่ส่งคืน', 'รหัสสินทรัพย์', 'ชื่อสินทรัพย์', 'ผู้คืน', 'แผนกผู้ยืม', 'ผู้บันทึกการคืน', 'รายละเอียดความเสียหาย'];
    const rowMapper = (item: any) => [
      new Date(item.returnDate).toLocaleDateString(isEN ? 'en-US' : 'th-TH'),
      item.asset.assetCode,
      item.asset.name,
      `${item.borrowRequest.borrower.firstName} ${item.borrowRequest.borrower.lastName}`,
      item.borrowRequest.borrower.department,
      item.recordedBy.name,
      item.conditionNote || (isEN ? 'Damaged' : 'ชำรุดเสียหาย')
    ];
    const fileName = isEN
      ? `Damaged_Assets_Report_${new Date().toLocaleDateString('en-US')}`
      : `รายงานประวัติสินทรัพย์เสียหาย_${new Date().toLocaleDateString('th-TH')}`;
    exportToCSV(damagedData, headers, rowMapper, fileName);
  };

  const exportEmployeeHistoryCsv = () => {
    const activeEmployee = employees.find(e => e.id === selectedEmployeeId);
    const empName = activeEmployee ? `${activeEmployee.firstName}_${activeEmployee.lastName}` : (isEN ? 'Employee' : 'พนักงาน');
    const headers = isEN
      ? ['Request No.', 'Asset Code', 'Asset Name', 'Borrow Date', 'Due Date', 'Request Status', 'Return Condition']
      : ['เลขที่คำขอ', 'รหัสสินทรัพย์', 'ชื่อสินทรัพย์', 'วันที่ยืม', 'กำหนดส่งคืน', 'สถานะคำขอ', 'สภาพขากลับ'];
    const rowMapper = (item: any) => [
      item.requestNo,
      item.asset.assetCode,
      item.asset.name,
      new Date(item.borrowDate).toLocaleDateString(isEN ? 'en-US' : 'th-TH'),
      new Date(item.expectedReturnDate).toLocaleDateString(isEN ? 'en-US' : 'th-TH'),
      item.status,
      item.assetReturn ? getConditionText(item.assetReturn.condition) : '-'
    ];
    const fileName = isEN
      ? `Employee_Borrow_History_${empName}_${new Date().toLocaleDateString('en-US')}`
      : `รายงานประวัติการยืม_${empName}_${new Date().toLocaleDateString('th-TH')}`;
    exportToCSV(employeeHistory, headers, rowMapper, fileName);
  };

  const exportAssetHistoryCsv = () => {
    const activeAsset = assets.find(a => a.id === selectedAssetId);
    const assetCode = activeAsset ? activeAsset.assetCode : (isEN ? 'Asset' : 'อุปกรณ์');
    const headers = isEN
      ? ['Request No.', 'Borrower', 'Borrower Dept.', 'Borrow Date', 'Due Date', 'Status', 'Return Condition']
      : ['เลขที่คำขอ', 'ผู้ยืมใช้งาน', 'แผนกผู้ยืม', 'วันที่ยืม', 'กำหนดส่งคืน', 'สถานะรายการ', 'สภาพครุภัณฑ์ขากลับ'];
    const rowMapper = (item: any) => [
      item.requestNo,
      `${item.borrower.firstName} ${item.borrower.lastName}`,
      item.borrower.department,
      new Date(item.borrowDate).toLocaleDateString(isEN ? 'en-US' : 'th-TH'),
      new Date(item.expectedReturnDate).toLocaleDateString(isEN ? 'en-US' : 'th-TH'),
      item.status,
      item.assetReturn ? getConditionText(item.assetReturn.condition) : '-'
    ];
    const fileName = isEN
      ? `Asset_Usage_History_${assetCode}_${new Date().toLocaleDateString('en-US')}`
      : `รายงานประวัติการใช้งานสินทรัพย์_${assetCode}_${new Date().toLocaleDateString('th-TH')}`;
    exportToCSV(assetHistory, headers, rowMapper, fileName);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{isEN ? 'System Reporting' : 'รายงานข้อมูลระบบ'}</h1>
        <p className="text-slate-500 text-xs mt-1">{isEN ? 'Analyze and report assets data, borrows, and overdue' : 'วิเคราะห์และรายงานสรุปข้อมูลครุภัณฑ์ การยืม และการค้างคืน'}</p>
      </div>

      {/* Report Switcher Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <button
          onClick={() => setReportType('borrowed')}
          className={`flex flex-col items-center justify-center p-4 border rounded-xl gap-2 font-medium text-xs transition-all duration-200 cursor-pointer ${
            reportType === 'borrowed'
              ? 'bg-sky-500 border-sky-500 text-white shadow-md'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Box size={20} />
          <span>{isEN ? `Assets Currently Borrowed (${borrowedData.length})` : `ครุภัณฑ์ที่อยู่ระหว่างการยืม (${borrowedData.length})`}</span>
        </button>

        <button
          onClick={() => setReportType('overdue')}
          className={`flex flex-col items-center justify-center p-4 border rounded-xl gap-2 font-medium text-xs transition-all duration-200 cursor-pointer ${
            reportType === 'overdue'
              ? 'bg-sky-500 border-sky-500 text-white shadow-md'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Clock size={20} />
          <span>{isEN ? `Overdue Returns (${overdueData.length})` : `รายการค้างส่งคืน (${overdueData.length})`}</span>
        </button>

        <button
          onClick={() => setReportType('damaged')}
          className={`flex flex-col items-center justify-center p-4 border rounded-xl gap-2 font-medium text-xs transition-all duration-200 cursor-pointer ${
            reportType === 'damaged'
              ? 'bg-sky-500 border-sky-500 text-white shadow-md'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle size={20} />
          <span>{isEN ? `Damaged Assets History (${damagedData.length})` : `ประวัติชำรุดเสียหาย (${damagedData.length})`}</span>
        </button>

        <button
          onClick={() => setReportType('employee')}
          className={`flex flex-col items-center justify-center p-4 border rounded-xl gap-2 font-medium text-xs transition-all duration-200 cursor-pointer ${
            reportType === 'employee'
              ? 'bg-sky-500 border-sky-500 text-white shadow-md'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <User size={20} />
          <span>{isEN ? 'Employee Borrow History' : 'ประวัติรายพนักงาน'}</span>
        </button>

        <button
          onClick={() => setReportType('asset')}
          className={`flex flex-col items-center justify-center p-4 border rounded-xl gap-2 font-medium text-xs transition-all duration-200 cursor-pointer ${
            reportType === 'asset'
              ? 'bg-sky-500 border-sky-500 text-white shadow-md'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FileText size={20} />
          <span>{isEN ? 'Individual Asset Logs' : 'ประวัติรายสินทรัพย์'}</span>
        </button>
      </div>

      {/* Report Rendering Section */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 overflow-hidden">
          
          {/* 1. Borrowed Assets */}
          {reportType === 'borrowed' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4 print:border-none">
                <h2 className="text-base font-bold text-slate-800">{isEN ? 'Assets Currently Borrowed' : 'ครุภัณฑ์ที่อยู่ระหว่างการยืมในขณะนี้'}</h2>
                <div className="flex gap-2 print:hidden">
                  <button
                    onClick={exportBorrowedCsv}
                    disabled={borrowedData.length === 0}
                    className="px-3 py-1.5 bg-slate-105 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Download size={14} className="text-sky-500" />
                    <span>{isEN ? 'Export CSV' : 'ส่งออก CSV'}</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    disabled={borrowedData.length === 0}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-md shadow-sky-500/10 cursor-pointer disabled:opacity-50"
                  >
                    <Printer size={14} />
                    <span>{isEN ? 'Print Report' : 'พิมพ์รายงาน'}</span>
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                      <th className="px-4 py-3">{isEN ? 'Asset Code' : 'รหัสสินทรัพย์'}</th>
                      <th className="px-4 py-3">{isEN ? 'Asset Name' : 'ชื่อสินทรัพย์'}</th>
                      <th className="px-4 py-3">{isEN ? 'Category' : 'หมวดหมู่'}</th>
                      <th className="px-4 py-3">{isEN ? 'Current Borrower' : 'ผู้ยืมปัจจุบัน'}</th>
                      <th className="px-4 py-3">{isEN ? 'Department' : 'แผนก'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {borrowedData.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono font-semibold">{item.assetCode}</td>
                        <td className="px-4 py-3 font-bold">{item.name}</td>
                        <td className="px-4 py-3">{item.category}</td>
                        <td className="px-4 py-3 text-sky-600 font-semibold">{item.currentHolder?.firstName} {item.currentHolder?.lastName}</td>
                        <td className="px-4 py-3">{item.currentHolder?.department}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. Overdue Assets */}
          {reportType === 'overdue' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4 print:border-none">
                <h2 className="text-base font-bold text-slate-800">{isEN ? 'Overdue Asset Returns' : 'รายการสินทรัพย์ค้างส่งคืน (เลยกำหนด)'}</h2>
                <div className="flex gap-2 print:hidden">
                  <button
                    onClick={exportOverdueCsv}
                    disabled={overdueData.length === 0}
                    className="px-3 py-1.5 bg-slate-105 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Download size={14} className="text-sky-500" />
                    <span>{isEN ? 'Export CSV' : 'ส่งออก CSV'}</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    disabled={overdueData.length === 0}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-md shadow-sky-500/10 cursor-pointer disabled:opacity-50"
                  >
                    <Printer size={14} />
                    <span>{isEN ? 'Print Report' : 'พิมพ์รายงาน'}</span>
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                      <th className="px-4 py-3">{isEN ? 'Request No.' : 'เลขที่คำขอ'}</th>
                      <th className="px-4 py-3">{isEN ? 'Asset' : 'สินทรัพย์'}</th>
                      <th className="px-4 py-3">{isEN ? 'Borrower' : 'ผู้ยืม'}</th>
                      <th className="px-4 py-3">{isEN ? 'Borrow Date' : 'วันที่ยืม'}</th>
                      <th className="px-4 py-3">{isEN ? 'Due Date' : 'กำหนดส่งคืน'}</th>
                      <th className="px-4 py-3">{isEN ? 'Days Overdue' : 'จำนวนวันดีเลย์'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {overdueData.map((item) => {
                      const delayDays = Math.floor((Date.now() - new Date(item.expectedReturnDate).getTime()) / 86400000);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 bg-red-50/20">
                          <td className="px-4 py-3 font-mono font-bold text-red-700">{item.requestNo}</td>
                          <td className="px-4 py-3 font-bold">{item.asset.name} ({item.asset.assetCode})</td>
                          <td className="px-4 py-3">{item.borrower.firstName} ({item.borrower.department})</td>
                          <td className="px-4 py-3">{new Date(item.borrowDate).toLocaleDateString(isEN ? 'en-US' : 'th-TH')}</td>
                          <td className="px-4 py-3 font-semibold text-red-600">{new Date(item.expectedReturnDate).toLocaleDateString(isEN ? 'en-US' : 'th-TH')}</td>
                          <td className="px-4 py-3 text-red-600 font-bold">{delayDays > 0 ? (isEN ? `${delayDays} days` : `${delayDays} วัน`) : (isEN ? 'Today' : 'วันนี้')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. Damaged Assets */}
          {reportType === 'damaged' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4 print:border-none">
                <h2 className="text-base font-bold text-slate-800">{isEN ? 'Damaged Assets Return History' : 'ประวัติบันทึกสินทรัพย์เสียหายตอนส่งคืน'}</h2>
                <div className="flex gap-2 print:hidden">
                  <button
                    onClick={exportDamagedCsv}
                    disabled={damagedData.length === 0}
                    className="px-3 py-1.5 bg-slate-105 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Download size={14} className="text-sky-500" />
                    <span>{isEN ? 'Export CSV' : 'ส่งออก CSV'}</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    disabled={damagedData.length === 0}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-md shadow-sky-500/10 cursor-pointer disabled:opacity-50"
                  >
                    <Printer size={14} />
                    <span>{isEN ? 'Print Report' : 'พิมพ์รายงาน'}</span>
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                      <th className="px-4 py-3">{isEN ? 'Return Date' : 'วันที่ส่งคืน'}</th>
                      <th className="px-4 py-3">{isEN ? 'Asset' : 'สินทรัพย์'}</th>
                      <th className="px-4 py-3">{isEN ? 'Returned By' : 'ผู้คืน'}</th>
                      <th className="px-4 py-3">{isEN ? 'Received By' : 'ผู้รับคืน'}</th>
                      <th className="px-4 py-3">{isEN ? 'Damage Details' : 'รายละเอียดความเสียหาย'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {damagedData.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">{new Date(item.returnDate).toLocaleDateString(isEN ? 'en-US' : 'th-TH')}</td>
                        <td className="px-4 py-3 font-bold">{item.asset.name} ({item.asset.assetCode})</td>
                        <td className="px-4 py-3">{item.borrowRequest.borrower.firstName} ({item.borrowRequest.borrower.department})</td>
                        <td className="px-4 py-3">{item.recordedBy.name}</td>
                        <td className="px-4 py-3 text-red-600 font-medium">{item.conditionNote || (isEN ? 'Damaged' : 'ชำรุดเสียหาย')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. Employee History */}
          {reportType === 'employee' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-3 border-b border-slate-100 mb-4 print:border-none">
                <div className="space-y-0.5">
                  <h2 className="text-base font-bold text-slate-800">{isEN ? 'Employee Borrow History' : 'ประวัติการขอยืมรายพนักงาน'}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2 print:hidden">
                  <select
                    value={selectedEmployeeId}
                    onChange={handleEmployeeSearch}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-sky-500 max-w-xs"
                  >
                    <option value="">{isEN ? '-- Select Employee --' : '-- เลือกพนักงาน --'}</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        [{emp.employeeCode}] {emp.firstName} {emp.lastName} ({emp.department})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={exportEmployeeHistoryCsv}
                    disabled={employeeHistory.length === 0}
                    className="px-3 py-1.5 bg-slate-105 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Download size={14} className="text-sky-500" />
                    <span>{isEN ? 'Export CSV' : 'ส่งออก CSV'}</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    disabled={employeeHistory.length === 0}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-md shadow-sky-500/10 cursor-pointer disabled:opacity-50"
                  >
                    <Printer size={14} />
                    <span>{isEN ? 'Print Report' : 'พิมพ์รายงาน'}</span>
                  </button>
                </div>
              </div>

              {!selectedEmployeeId ? (
                <div className="text-slate-400 text-center py-10">{isEN ? 'Select an employee to view history' : 'กรุณาเลือกพนักงานเพื่อเรียกดูข้อมูล'}</div>
              ) : employeeHistory.length === 0 ? (
                <div className="text-slate-400 text-center py-10">{isEN ? 'No borrow history found for this employee' : 'ไม่พบประวัติการทำรายการยืมพนักงานท่านนี้'}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                        <th className="px-4 py-3">{isEN ? 'Request No.' : 'รหัสคำขอ'}</th>
                        <th className="px-4 py-3">{isEN ? 'Asset' : 'สินทรัพย์'}</th>
                        <th className="px-4 py-3">{isEN ? 'Borrow Date' : 'วันที่ยืม'}</th>
                        <th className="px-4 py-3">{isEN ? 'Due Date' : 'กำหนดส่งคืน'}</th>
                        <th className="px-4 py-3">{isEN ? 'Request Status' : 'สถานะคำขอ'}</th>
                        <th className="px-4 py-3">{isEN ? 'Return Condition' : 'สภาพขากลับ'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {employeeHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-mono font-semibold">{item.requestNo}</td>
                          <td className="px-4 py-3 font-bold">{item.asset.name}</td>
                          <td className="px-4 py-3">{new Date(item.borrowDate).toLocaleDateString(isEN ? 'en-US' : 'th-TH')}</td>
                          <td className="px-4 py-3">{new Date(item.expectedReturnDate).toLocaleDateString(isEN ? 'en-US' : 'th-TH')}</td>
                          <td className="px-4 py-3 font-semibold">{item.status}</td>
                          <td className="px-4 py-3 font-medium">
                            {item.assetReturn ? getConditionText(item.assetReturn.condition) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 5. Asset History */}
          {reportType === 'asset' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-3 border-b border-slate-100 mb-4 print:border-none">
                <div className="space-y-0.5">
                  <h2 className="text-base font-bold text-slate-800">{isEN ? 'Asset Usage & Circulation History' : 'ประวัติการใช้งานและหมุนเวียนสินทรัพย์'}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2 print:hidden">
                  <select
                    value={selectedAssetId}
                    onChange={handleAssetSearch}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-sky-500 max-w-xs"
                  >
                    <option value="">{isEN ? '-- Select Asset --' : '-- เลือกสินทรัพย์ --'}</option>
                    {assets.map((ast) => (
                      <option key={ast.id} value={ast.id}>
                        [{ast.assetCode}] {ast.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={exportAssetHistoryCsv}
                    disabled={assetHistory.length === 0}
                    className="px-3 py-1.5 bg-slate-105 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Download size={14} className="text-sky-500" />
                    <span>{isEN ? 'Export CSV' : 'ส่งออก CSV'}</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    disabled={assetHistory.length === 0}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-md shadow-sky-500/10 cursor-pointer disabled:opacity-50"
                  >
                    <Printer size={14} />
                    <span>{isEN ? 'Print Report' : 'พิมพ์รายงาน'}</span>
                  </button>
                </div>
              </div>

              {!selectedAssetId ? (
                <div className="text-slate-400 text-center py-10">{isEN ? 'Select an asset to view history' : 'กรุณาเลือกสินทรัพย์เพื่อเรียกดูข้อมูล'}</div>
              ) : assetHistory.length === 0 ? (
                <div className="text-slate-400 text-center py-10">{isEN ? 'No usage history found for this asset' : 'ยังไม่มีประวัติการใช้งานสินทรัพย์ชิ้นนี้'}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                        <th className="px-4 py-3">{isEN ? 'Request No.' : 'รหัสคำขอ'}</th>
                        <th className="px-4 py-3">{isEN ? 'Borrower' : 'ผู้ยืมใช้งาน'}</th>
                        <th className="px-4 py-3">{isEN ? 'Borrow Date' : 'วันที่ยืม'}</th>
                        <th className="px-4 py-3">{isEN ? 'Due Date' : 'กำหนดส่งคืน'}</th>
                        <th className="px-4 py-3">{isEN ? 'Status' : 'สถานะรายการ'}</th>
                        <th className="px-4 py-3">{isEN ? 'Return Condition' : 'สภาพครุภัณฑ์ขากลับ'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {assetHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-mono font-semibold">{item.requestNo}</td>
                          <td className="px-4 py-3 font-bold">{item.borrower.firstName} ({item.borrower.department})</td>
                          <td className="px-4 py-3">{new Date(item.borrowDate).toLocaleDateString(isEN ? 'en-US' : 'th-TH')}</td>
                          <td className="px-4 py-3">{new Date(item.expectedReturnDate).toLocaleDateString(isEN ? 'en-US' : 'th-TH')}</td>
                          <td className="px-4 py-3 font-semibold">{item.status}</td>
                          <td className="px-4 py-3 font-medium text-slate-600">
                            {item.assetReturn ? getConditionText(item.assetReturn.condition) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* Custom style injection for printing behavior */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide app sidebar, layout, and print control header */
          aside, 
          .lg\\:hidden,
          .print\\:hidden,
          .grid.grid-cols-2.md\\:grid-cols-5 {
            display: none !important;
          }
          /* Reset Next.js layout padding */
          .lg\\:pl-64 {
            padding-left: 0 !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          body {
            background: white !important;
            background-color: white !important;
          }
          /* Hide title section and keep active table */
          .space-y-6 > div:first-child {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}

const exportToCSV = (data: any[], headers: string[], rowMapper: (item: any) => string[], fileName: string) => {
  const csvContent = [
    headers.join(','),
    ...data.map(item => rowMapper(item).map(val => {
      const stringVal = String(val === null || val === undefined ? '' : val);
      return `"${stringVal.replace(/"/g, '""')}"`;
    }).join(','))
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading reports...</div>}>
      <ReportsContent />
    </Suspense>
  );
}

