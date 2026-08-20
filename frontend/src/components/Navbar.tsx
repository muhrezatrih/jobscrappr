'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  LayoutDashboard,
  FileUp,
  UserCheck,
  Briefcase,
  Terminal,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import { api, WorkerStatusResponse } from '@/lib/api';

export function Navbar() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [workerStatus, setWorkerStatus] = useState<WorkerStatusResponse | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const currentTheme = (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    setTheme(currentTheme);
    root.setAttribute('data-theme', currentTheme);

    const checkStatus = async () => {
      try {
        const res = await api.getWorkerStatus();
        setWorkerStatus(res);
      } catch (e) {}
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/upload', label: 'Upload Resume', icon: FileUp },
    { href: '/profile', label: 'Profile & Criteria', icon: UserCheck },
    { href: '/applications', label: 'Applications', icon: Briefcase },
    { href: '/logs', label: 'Live Terminal', icon: Terminal },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const status = workerStatus?.status || 'IDLE';

  return (
    <header style={{
      position: 'sticky',
      top: '1rem',
      zIndex: 50,
      width: '100%',
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '0 1rem',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.65rem 1.25rem',
        background: 'var(--surface-glass)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-full)',
        boxShadow: 'var(--shadow-md)',
      }}>
        {/* Brand Logo */}
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontWeight: 700,
          fontSize: '1.05rem',
          letterSpacing: '-0.03em',
          color: 'var(--text-primary)',
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #0a84ff, #bf5af2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 2px 10px rgba(10, 132, 255, 0.4)',
          }}>
            <Sparkles size={16} />
          </div>
          <span>JobFlow <span style={{ color: 'var(--apple-blue)', fontWeight: 800 }}>AI</span></span>
        </Link>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.825rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--surface-glass-active)' : 'transparent',
                  border: isActive ? '1px solid var(--border-medium)' : '1px solid transparent',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Icon size={15} color={isActive ? 'var(--apple-blue)' : 'currentColor'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Worker Status Badge & Theme Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Worker Status Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--surface-glass-card)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}>
            <span
              className={`pulse-dot ${
                status === 'RUNNING' ? 'running' : status === 'PAUSED' ? 'paused' : 'idle'
              }`}
            />
            <span style={{ color: 'var(--text-secondary)' }}>
              {status === 'RUNNING' ? 'Engine Active' : status === 'PAUSED' ? 'Paused' : 'Standby'}
            </span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--surface-glass-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              transition: 'all var(--transition-fast)',
            }}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>
    </header>
  );
}
