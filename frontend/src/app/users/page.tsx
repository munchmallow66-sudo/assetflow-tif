'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { Trash2, Shield, User } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  employee?: {
    employeeCode: string;
    department: string;
  } | null;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (id === currentUser?.id) {
      alert('คุณไม่สามารถลบบัญชีผู้ใช้งานของตนเองได้');
      return;
    }
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบบัญชีผู้ใช้งาน: ${name}?`)) return;

    try {
      await api.delete(`/users/${id}`);
      alert('ลบผู้ใช้งานเรียบร้อยแล้ว');
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'การลบล้มเหลว');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">ADMIN</span>;
      case 'APPROVER':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">APPROVER</span>;
      case 'VIEWER':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">VIEWER</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">STAFF</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">จัดการผู้ใช้งานระบบ</h1>
        <p className="text-slate-500 text-xs mt-1">ตั้งค่าสิทธิ์ กำหนดบทบาท และจัดการข้อมูลบัญชีผู้ใช้งานระบบ</p>
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
                  <th className="px-6 py-4">ผู้ใช้งาน</th>
                  <th className="px-6 py-4">อีเมล</th>
                  <th className="px-6 py-4">รหัสพนักงาน</th>
                  <th className="px-6 py-4">แผนก / ฝ่าย</th>
                  <th className="px-6 py-4">บทบาท (Role)</th>
                  <th className="px-6 py-4 text-center">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-semibold flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        {u.role === 'ADMIN' ? <Shield size={14} /> : <User size={14} />}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4 font-mono">{u.employee?.employeeCode || '-'}</td>
                    <td className="px-6 py-4">{u.employee?.department || '-'}</td>
                    <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDelete(u.id, u.name)}
                        disabled={u.id === currentUser?.id}
                        className="p-1.5 border border-slate-200 hover:border-red-500 hover:text-red-600 text-slate-400 disabled:opacity-30 rounded-lg transition-colors cursor-pointer"
                        title="ลบผู้ใช้"
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
