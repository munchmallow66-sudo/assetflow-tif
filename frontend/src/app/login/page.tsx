'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Mail, Lock, ShieldAlert, Eye, EyeOff, Plane, Loader2 } from 'lucide-react';
import { LoginLoadingOverlay } from '@/components/login/LoginLoadingOverlay';

// Base schemas for type inference
const loginBaseSchema = z.object({
  email: z.string(),
  password: z.string(),
});

type LoginForm = z.infer<typeof loginBaseSchema>;

export default function LoginPage() {
  const { t, language, toggleLanguage } = useLanguage();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const { login } = useAuth();

  // Dynamic localization error translation
  const translateError = (err: any, fallback: string) => {
    const msg = typeof err === 'string' ? err : (err?.message || fallback);
    
    if (language === 'en') {
      if (msg === 'การเข้าสู่ระบบล้มเหลว' || msg.includes('เข้าสู่ระบบล้มเหลว') || msg.toLowerCase().includes('login failed')) {
        return 'Login failed';
      }
      if (msg === 'การลงทะเบียนล้มเหลว' || msg.includes('ลงทะเบียนล้มเหลว') || msg.toLowerCase().includes('registration failed')) {
        return 'Registration failed';
      }
      if (msg.includes('อีเมลนี้ถูกใช้งานแล้ว') || msg.includes('email already in use')) {
        return 'This email is already in use';
      }
      if (msg.includes('รหัสผ่านไม่ถูกต้อง') || msg.includes('ข้อมูลสำหรับเข้าสู่ระบบไม่ถูกต้อง') || msg.toLowerCase().includes('invalid credentials') || msg.toLowerCase().includes('incorrect password')) {
        return 'Invalid email or password';
      }
      if (msg.includes('ไม่พบผู้ใช้งาน') || msg.toLowerCase().includes('user not found')) {
        return 'User not found';
      }
    } else { // language === 'th'
      if (msg === 'Login failed' || msg.toLowerCase().includes('login failed')) {
        return 'การเข้าสู่ระบบล้มเหลว';
      }
      if (msg === 'Registration failed' || msg.toLowerCase().includes('registration failed')) {
        return 'การลงทะเบียนล้มเหลว';
      }
      if (msg.toLowerCase().includes('email already in use') || msg.includes('already registered')) {
        return 'อีเมลนี้ถูกใช้งานแล้วในระบบ';
      }
      if (msg.toLowerCase().includes('invalid credentials') || msg.toLowerCase().includes('incorrect password')) {
        return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      }
      if (msg.toLowerCase().includes('user not found')) {
        return 'ไม่พบข้อมูลผู้ใช้งานนี้ในระบบ';
      }
    }
    return msg;
  };

  // Localized validation schemas built inside component
  const loginSchema = useMemo(() => z.object({
    email: z.string()
      .email(language === 'th' ? 'รูปแบบอีเมลไม่ถูกต้อง' : 'Invalid email format')
      .nonempty(language === 'th' ? 'กรุณากรอกอีเมล' : 'Please enter your email'),
    password: z.string()
      .min(6, language === 'th' ? 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' : 'Password must be at least 6 characters')
      .nonempty(language === 'th' ? 'กรุณากรอกรหัสผ่าน' : 'Please enter your password'),
  }), [language]);

  // React Hook Forms with dynamic schemas
  const {
    register: registerLoginField,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onLogin = async (data: LoginForm) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await login(data.email, data.password);
    } catch (err: any) {
      setErrorMsg(translateError(err, language === 'th' ? 'การเข้าสู่ระบบล้มเหลว' : 'Login failed'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      {/* Language Toggle Button */}
      <div className="absolute top-6 right-6 z-20">
        <button
          type="button"
          onClick={toggleLanguage}
          className="px-3.5 py-2.5 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/50 rounded-xl sm:rounded-full text-[10px] font-extrabold transition-all duration-200 cursor-pointer text-slate-300 hover:text-white font-mono shadow-md"
          title={language === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
        >
          {language === 'th' ? 'EN' : 'TH'}
        </button>
      </div>

      {/* Background Image with overlay */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <Image
          src="/login-bg.png?v=2"
          alt={language === 'th' ? 'ภาพพื้นหลังการบิน' : 'Aviation Background'}
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
            alt={language === 'th' ? 'โลโก้ Thai Inter Flying' : 'Thai Inter Flying Logo'}
            width={240}
            height={99}
            className="object-contain"
            unoptimized
          />
          <div>
            <h2 className="text-2xl font-bold text-white tracking-wide mt-1">THAI INTER FLYING</h2>
            <p className="text-slate-400 text-sm mt-1 font-medium">
              {language === 'th' ? 'ระบบยืม-คืนสินทรัพย์ภายในองค์กร' : 'Internal Asset Borrow-Return System'}
            </p>
          </div>
        </div>

        <div className="p-8">
          {/* Notifications */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 text-red-300 rounded-lg text-sm flex items-start gap-2">
              <ShieldAlert className="shrink-0 text-red-400" size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-5">
            <div>
              <label className="block text-slate-300 text-xs font-semibold mb-2 uppercase tracking-wider">
                {language === 'th' ? 'อีเมล (Email)' : 'Email'}
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
                {language === 'th' ? 'รหัสผ่าน (Password)' : 'Password'}
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
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl py-3 px-4 shadow-lg shadow-sky-500/20 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-8 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>{language === 'th' ? 'กำลังตรวจสอบข้อมูล...' : 'Authenticating...'}</span>
                </>
              ) : (
                <>
                  <span>{language === 'th' ? 'เข้าสู่ระบบ' : 'Login'}</span>
                  <Plane className="w-4 h-4 text-sky-200 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform duration-300 -rotate-45" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* High-tech Flight Deck Radar Loading Overlay */}
      <LoginLoadingOverlay isVisible={loading} type="login" />
    </div>
  );
}
