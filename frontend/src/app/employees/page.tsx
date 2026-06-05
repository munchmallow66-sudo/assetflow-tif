'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Trash2, Phone, Briefcase, Mail } from 'lucide-react';

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
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบรายชื่อพนักงาน: ${name}?`)) return;

    try {
      await api.delete(`/employees/${id}`);
      alert('ลบรายชื่อพนักงานเรียบร้อยแล้ว');
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.message || 'การลบล้มเหลว');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">จัดการรายชื่อพนักงาน</h1>
        <p className="text-slate-500 text-xs mt-1">บันทึกประวัติ แก้ไขข้อมูลแผนก และรายชื่อพนักงานของ Thai Inter Flying</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                  <th className="px-6 py-4">รหัสพนักงาน</th>
                  <th className="px-6 py-4">ชื่อ - นามสกุล</th>
                  <th className="px-6 py-4">แผนก / ฝ่าย</th>
                  <th className="px-6 py-4">อีเมลติดต่อ</th>
                  <th className="px-6 py-4">เบอร์โทรศัพท์</th>
                  <th className="px-6 py-4 text-center">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-mono font-bold text-slate-600">{emp.employeeCode}</td>
                    <td className="px-6 py-4 font-semibold text-slate-850">
                      {emp.firstName} {emp.lastName}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-600 border border-slate-150 px-2 py-0.5 rounded font-medium">
                        <Briefcase size={12} />
                        <span>{emp.department}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1">
                        <Mail size={12} className="text-slate-400" />
                        <span>{emp.email}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {emp.phone ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone size={12} className="text-slate-400" />
                          <span>{emp.phone}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDelete(emp.id, `${emp.firstName} ${emp.lastName}`)}
                        className="p-1.5 border border-slate-200 hover:border-red-500 hover:text-red-600 text-slate-400 rounded-lg transition-colors cursor-pointer"
                        title="ลบพนักงาน"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
