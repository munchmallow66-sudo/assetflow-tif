'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import {
  LayoutDashboard,
  Box,
  ClipboardList,
  History,
  FileBarChart2,
  Users,
  UserCheck,
  Settings,
  LogOut,
  FolderSync,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);

  if (!user) return null;

  const role = user.role;

  const allLinks = [
    {
      href: '/dashboard',
      label: 'แดชบอร์ด',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'STAFF', 'APPROVER', 'VIEWER'],
    },
    {
      href: '/assets',
      label: 'ข้อมูลสินทรัพย์',
      icon: Box,
      roles: ['ADMIN', 'STAFF', 'APPROVER', 'VIEWER'],
    },
    {
      href: '/borrow',
      label: 'รายการยืม-คืน',
      icon: ClipboardList,
      roles: ['ADMIN', 'STAFF', 'APPROVER'],
    },
    {
      href: '/returns',
      label: 'ประวัติการคืน',
      icon: History,
      roles: ['ADMIN', 'APPROVER', 'VIEWER'],
    },
    {
      href: '/reports',
      label: 'รายงาน',
      icon: FileBarChart2,
      roles: ['ADMIN', 'APPROVER', 'VIEWER'],
    },
    {
      href: '/users',
      label: 'จัดการผู้ใช้งาน',
      icon: Users,
      roles: ['ADMIN'],
    },
    {
      href: '/employees',
      label: 'จัดการพนักงาน',
      icon: UserCheck,
      roles: ['ADMIN'],
    },
    {
      href: '/settings',
      label: 'ตั้งค่าระบบ',
      icon: Settings,
      roles: ['ADMIN', 'STAFF', 'APPROVER', 'VIEWER'],
    },
  ];

  const filteredLinks = allLinks.filter((link) => link.roles.includes(role));

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleSidebar}
          className="p-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 focus:outline-none shadow-md"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col justify-between border-r border-slate-800 transition-transform duration-300 transform lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo Brand */}
          <div className="h-16 flex items-center justify-center border-b border-slate-800 px-6 gap-3">
            <Image
              src="/logo.png?v=3"
              alt="Thai Inter Flying Logo"
              width={42}
              height={17}
              className="object-contain"
              unoptimized
            />
            <span className="font-semibold text-lg tracking-wider text-white">Thai Inter Flying</span>
          </div>

          {/* User Profile Summary */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="font-medium text-sm text-white truncate">{user.name}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-1">
            {filteredLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20 scale-[1.02]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full animate-scale-in" />
                  )}
                  <Icon size={18} className={isActive ? 'animate-scale-in' : ''} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-4 py-2.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
              <span>{theme === 'dark' ? 'โหมดสว่าง (Light)' : 'โหมดมืด (Dark)'}</span>
            </div>
            <div className={`w-8 h-4 flex items-center rounded-full p-0.5 transition-colors duration-200 ${theme === 'dark' ? 'bg-sky-500' : 'bg-slate-700'}`}>
              <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-200 ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
          </button>
          
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded-lg text-sm font-medium transition-all duration-200"
          >
            <LogOut size={18} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="lg:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
        />
      )}
    </>
  );
}
