'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  LayoutDashboard,
  Kanban,
  TrendingUp,
  FileUp,
  UserCheck,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const root = document.documentElement;
    const currentTheme = (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    setTheme(currentTheme);
    root.setAttribute('data-theme', currentTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const navItems = [
    { href: '/', label: 'Discovery', icon: LayoutDashboard },
    { href: '/applications', label: 'Pipeline', icon: Kanban },
    { href: '/analytics', label: 'Sankey Analytics', icon: TrendingUp },
    { href: '/upload', label: 'Upload CV', icon: FileUp },
    { href: '/profile', label: 'Profile', icon: UserCheck },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-3 z-50 w-full max-w-6xl mx-auto px-4">
      <div className="flex items-center justify-between px-5 py-2.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800 rounded-full shadow-lg">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-2.5 font-extrabold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <span>JobFlow Scrappr</span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  active
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Action: Theme Toggle */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
