'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/components/providers/AuthProvider';
import { Mail, Lock, User, Briefcase, Phone, UserCheck, ShieldAlert, Eye, EyeOff } from 'lucide-react';

// Zod schemas for validation
const loginSchema = z.object({
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').nonempty('กรุณากรอกอีเมล'),
  password: z.string().min(6, 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร').nonempty('กรุณากรอกรหัสผ่าน'),
});

const registerSchema = z.object({
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').nonempty('กรุณากรอกอีเมล'),
  password: z.string().min(6, 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร').nonempty('กรุณากรอกรหัสผ่าน'),
  name: z.string().nonempty('กรุณากรอกชื่อ-นามสกุลสำหรับบัญชีผู้ใช้'),
  employeeCode: z.string().nonempty('กรุณากรอกรหัสพนักงาน'),
  firstName: z.string().nonempty('กรุณากรอกชื่อจริง'),
  lastName: z.string().nonempty('กรุณากรอกนามสกุล'),
  department: z.string().nonempty('กรุณากรอกแผนก'),
  phone: z.string().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  const { login, register } = useAuth();

  // React Hook Forms
  const {
    register: registerLoginField,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerRegField,
    handleSubmit: handleRegSubmit,
    formState: { errors: regErrors },
    reset: resetRegForm,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onLogin = async (data: LoginForm) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await login(data.email, data.password);
    } catch (err: any) {
      setErrorMsg(typeof err === 'string' ? err : (err?.message || 'การเข้าสู่ระบบล้มเหลว'));
      setLoading(false);
    }
  };

  const onRegister = async (data: RegisterForm) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await register(data);
      setSuccessMsg('ลงทะเบียนผู้ใช้งานสำเร็จ! กรุณาลงชื่อเข้าใช้ด้วยบัญชีของคุณ');
      setActiveTab('login');
      resetRegForm();
    } catch (err: any) {
      setErrorMsg(typeof err === 'string' ? err : (err?.message || 'การลงทะเบียนล้มเหลว'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      {/* Background Image with overlay */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <Image
          src="/login-bg.png?v=2"
          alt="Aviation Background"
          fill
          priority
          className="object-cover opacity-30"
          unoptimized
        />
        {/* Dark overlay gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/80 to-slate-950" />
      </div>

      {/* Background decoration elements */}
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="w-full max-w-lg bg-slate-900/85 border border-slate-800/60 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden relative z-10">
        {/* Brand Header */}
        <div className="p-8 text-center border-b border-slate-700/50 bg-slate-850/40 flex flex-col items-center justify-center gap-1.5">
          <Image
            src="/logo.png?v=3"
            alt="Thai Inter Flying Logo"
            width={240}
            height={99}
            className="object-contain"
            unoptimized
          />
          <div>
            <h2 className="text-2xl font-bold text-white tracking-wide mt-1">THAI INTER FLYING</h2>
            <p className="text-slate-400 text-sm mt-1 font-medium">ระบบยืม-คืนสินทรัพย์ภายในองค์กร</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-700/50">
          <button
            onClick={() => {
              setActiveTab('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-4 text-center text-sm font-semibold transition-all duration-200 border-b-2 ${activeTab === 'login'
                ? 'border-sky-500 text-sky-400 bg-slate-800/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            เข้าสู่ระบบ
          </button>
          <button
            onClick={() => {
              setActiveTab('register');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-4 text-center text-sm font-semibold transition-all duration-200 border-b-2 ${activeTab === 'register'
                ? 'border-sky-500 text-sky-400 bg-slate-800/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            ลงทะเบียน
          </button>
        </div>

        <div className="p-8">
          {/* Notifications */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 text-red-300 rounded-lg text-sm flex items-start gap-2">
              <ShieldAlert className="shrink-0 text-red-400" size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-lg text-sm flex items-start gap-2">
              <UserCheck className="shrink-0 text-emerald-400" size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-5">
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-2 uppercase tracking-wider">
                  อีเมล (Email)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    {...registerLoginField('email')}
                    placeholder="name@tif.ac.th"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all duration-250"
                  />
                </div>
                {loginErrors.email && (
                  <p className="text-red-400 text-xs mt-1.5 font-medium">{loginErrors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-2 uppercase tracking-wider">
                  รหัสผ่าน (Password)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    {...registerLoginField('password')}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all duration-250"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {loginErrors.password && (
                  <p className="text-red-400 text-xs mt-1.5 font-medium">{loginErrors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-500 text-white font-semibold rounded-lg py-3 hover:bg-sky-600 transition-all-custom shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-8 cursor-pointer"
              >
                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegSubmit(onRegister)} className="space-y-4">
              <h3 className="text-white text-xs font-bold uppercase tracking-wider border-b border-slate-700/30 pb-2 mb-2 text-slate-400">
                ข้อมูลบัญชีผู้ใช้งาน
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5">ชื่อ-นามสกุลจริง</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User size={16} />
                    </div>
                    <input
                      type="text"
                      {...registerRegField('name')}
                      placeholder="นายรักดี สมใจ"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  {regErrors.name && (
                    <p className="text-red-400 text-[10px] mt-1">{regErrors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5">อีเมลพนักงาน</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      {...registerRegField('email')}
                      placeholder="employee@tif.ac.th"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  {regErrors.email && (
                    <p className="text-red-400 text-[10px] mt-1">{regErrors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1.5">รหัสผ่าน</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showRegPassword ? "text" : "password"}
                    {...registerRegField('password')}
                    placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-10 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {regErrors.password && (
                  <p className="text-red-400 text-[10px] mt-1">{regErrors.password.message}</p>
                )}
              </div>

              <h3 className="text-white text-xs font-bold uppercase tracking-wider border-b border-slate-700/30 pb-2 pt-2 mb-2 text-slate-400">
                ข้อมูลพนักงาน
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5">รหัสพนักงาน</label>
                  <input
                    type="text"
                    {...registerRegField('employeeCode')}
                    placeholder="EMP-XXXX"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                  {regErrors.employeeCode && (
                    <p className="text-red-400 text-[10px] mt-1">{regErrors.employeeCode.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5">แผนก/ฝ่ายงาน</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Briefcase size={16} />
                    </div>
                    <input
                      type="text"
                      {...registerRegField('department')}
                      placeholder="เช่น ฝ่ายการบิน, ช่าง"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  {regErrors.department && (
                    <p className="text-red-400 text-[10px] mt-1">{regErrors.department.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5">ชื่อจริง (ภาษาไทย)</label>
                  <input
                    type="text"
                    {...registerRegField('firstName')}
                    placeholder="สมศักดิ์"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                  {regErrors.firstName && (
                    <p className="text-red-400 text-[10px] mt-1">{regErrors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5">นามสกุล (ภาษาไทย)</label>
                  <input
                    type="text"
                    {...registerRegField('lastName')}
                    placeholder="รักชาติ"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                  {regErrors.lastName && (
                    <p className="text-red-400 text-[10px] mt-1">{regErrors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1.5">เบอร์โทรศัพท์ (เลือกกรอก)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone size={16} />
                  </div>
                  <input
                    type="text"
                    {...registerRegField('phone')}
                    placeholder="0812345678"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-500 text-white font-semibold rounded-lg py-2.5 hover:bg-sky-600 transition-all-custom shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-xs mt-6 cursor-pointer"
              >
                {loading ? 'กำลังลงทะเบียน...' : 'ลงทะเบียนผู้ใช้งาน'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
