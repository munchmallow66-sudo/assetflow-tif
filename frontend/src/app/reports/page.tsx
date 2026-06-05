'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  FileText,
  Clock,
  AlertTriangle,
  User,
  Box,
  ChevronRight,
  TrendingDown
} from 'lucide-react';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'borrowed' | 'overdue' | 'damaged' | 'employee' | 'asset'>('borrowed');
  
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
      case 'NORMAL': return 'ปกติ';
      case 'INCOMPLETE': return 'อุปกรณ์ไม่ครบ';
      case 'DAMAGED': return 'ชำรุดเสียหาย';
      case 'LOST': return 'สูญหาย';
      default: return cond;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">รายงานข้อมูลระบบ</h1>
        <p className="text-slate-500 text-xs mt-1">วิเคราะห์และรายงานสรุปข้อมูลครุภัณฑ์ การยืม และการค้างคืน</p>
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
          <span>สินทรัพย์ที่ถูกยืมอยู่ ({borrowedData.length})</span>
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
          <span>รายการค้างส่งคืน ({overdueData.length})</span>
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
          <span>ประวัติชำรุดเสียหาย ({damagedData.length})</span>
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
          <span>ประวัติรายพนักงาน</span>
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
          <span>ประวัติรายสินทรัพย์</span>
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
              <h2 className="text-base font-bold text-slate-800">สินทรัพย์ที่ถูกยืมอยู่ในขณะนี้</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                      <th className="px-4 py-3">รหัสสินทรัพย์</th>
                      <th className="px-4 py-3">ชื่อสินทรัพย์</th>
                      <th className="px-4 py-3">หมวดหมู่</th>
                      <th className="px-4 py-3">ผู้ยืมปัจจุบัน</th>
                      <th className="px-4 py-3">แผนก</th>
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
              <h2 className="text-base font-bold text-slate-800">รายการสินทรัพย์ค้างส่งคืน (เลยกำหนด)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                      <th className="px-4 py-3">เลขที่คำขอ</th>
                      <th className="px-4 py-3">สินทรัพย์</th>
                      <th className="px-4 py-3">ผู้ยืม</th>
                      <th className="px-4 py-3">วันที่ยืม</th>
                      <th className="px-4 py-3">กำหนดส่งคืน</th>
                      <th className="px-4 py-3">จำนวนวันดีเลย์</th>
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
                          <td className="px-4 py-3">{new Date(item.borrowDate).toLocaleDateString('th-TH')}</td>
                          <td className="px-4 py-3 font-semibold text-red-600">{new Date(item.expectedReturnDate).toLocaleDateString('th-TH')}</td>
                          <td className="px-4 py-3 text-red-600 font-bold">{delayDays > 0 ? `${delayDays} วัน` : 'วันนี้'}</td>
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
              <h2 className="text-base font-bold text-slate-800">ประวัติบันทึกสินทรัพย์เสียหายตอนส่งคืน</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                      <th className="px-4 py-3">วันที่ส่งคืน</th>
                      <th className="px-4 py-3">สินทรัพย์</th>
                      <th className="px-4 py-3">ผู้คืน</th>
                      <th className="px-4 py-3">ผู้รับคืน</th>
                      <th className="px-4 py-3">รายละเอียดความเสียหาย</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {damagedData.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">{new Date(item.returnDate).toLocaleDateString('th-TH')}</td>
                        <td className="px-4 py-3 font-bold">{item.asset.name} ({item.asset.assetCode})</td>
                        <td className="px-4 py-3">{item.borrowRequest.borrower.firstName} ({item.borrowRequest.borrower.department})</td>
                        <td className="px-4 py-3">{item.recordedBy.name}</td>
                        <td className="px-4 py-3 text-red-600 font-medium">{item.conditionNote || 'ชำรุดเสียหาย'}</td>
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
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-base font-bold text-slate-800">ประวัติการขอยืมรายพนักงาน</h2>
                <select
                  value={selectedEmployeeId}
                  onChange={handleEmployeeSearch}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-sky-500 max-w-xs"
                >
                  <option value="">-- เลือกพนักงาน --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      [{emp.employeeCode}] {emp.firstName} {emp.lastName} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

              {!selectedEmployeeId ? (
                <div className="text-slate-400 text-center py-10">กรุณาเลือกพนักงานเพื่อเรียกดูข้อมูล</div>
              ) : employeeHistory.length === 0 ? (
                <div className="text-slate-400 text-center py-10">ไม่พบประวัติการทำรายการยืมพนักงานท่านนี้</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                        <th className="px-4 py-3">รหัสคำขอ</th>
                        <th className="px-4 py-3">สินทรัพย์</th>
                        <th className="px-4 py-3">วันที่ยืม</th>
                        <th className="px-4 py-3">กำหนดส่งคืน</th>
                        <th className="px-4 py-3">สถานะคำขอ</th>
                        <th className="px-4 py-3">สภาพขากลับ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {employeeHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-mono font-semibold">{item.requestNo}</td>
                          <td className="px-4 py-3 font-bold">{item.asset.name}</td>
                          <td className="px-4 py-3">{new Date(item.borrowDate).toLocaleDateString('th-TH')}</td>
                          <td className="px-4 py-3">{new Date(item.expectedReturnDate).toLocaleDateString('th-TH')}</td>
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
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-base font-bold text-slate-800">ประวัติการใช้งานและหมุนเวียนสินทรัพย์</h2>
                <select
                  value={selectedAssetId}
                  onChange={handleAssetSearch}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-sky-500 max-w-xs"
                >
                  <option value="">-- เลือกสินทรัพย์ --</option>
                  {assets.map((ast) => (
                    <option key={ast.id} value={ast.id}>
                      [{ast.assetCode}] {ast.name}
                    </option>
                  ))}
                </select>
              </div>

              {!selectedAssetId ? (
                <div className="text-slate-400 text-center py-10">กรุณาเลือกสินทรัพย์เพื่อเรียกดูข้อมูล</div>
              ) : assetHistory.length === 0 ? (
                <div className="text-slate-400 text-center py-10">ยังไม่มีประวัติการใช้งานสินทรัพย์ชิ้นนี้</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                        <th className="px-4 py-3">รหัสคำขอ</th>
                        <th className="px-4 py-3">ผู้ยืมใช้งาน</th>
                        <th className="px-4 py-3">วันที่ยืม</th>
                        <th className="px-4 py-3">กำหนดส่งคืน</th>
                        <th className="px-4 py-3">สถานะรายการ</th>
                        <th className="px-4 py-3">สภาพครุภัณฑ์ขากลับ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {assetHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-mono font-semibold">{item.requestNo}</td>
                          <td className="px-4 py-3 font-bold">{item.borrower.firstName} ({item.borrower.department})</td>
                          <td className="px-4 py-3">{new Date(item.borrowDate).toLocaleDateString('th-TH')}</td>
                          <td className="px-4 py-3">{new Date(item.expectedReturnDate).toLocaleDateString('th-TH')}</td>
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
    </div>
  );
}
