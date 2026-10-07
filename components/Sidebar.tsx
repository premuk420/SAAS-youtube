'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const [videoCount, setVideoCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/videos')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setVideoCount(data.length);
      })
      .catch(() => {});
  }, [pathname]);

  const navItems = [
    {
      name: 'Přehled',
      href: '/',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: 'Hledat témata',
      href: '/topics',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      badge: 'AI',
    },
    {
      name: 'Scénář & Humanizer',
      href: '/script',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      name: 'Správa videí',
      href: '/videos',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      count: videoCount,
    },
    {
      name: 'Nastavení',
      href: '/settings',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 flex flex-col bg-white border-r border-zinc-200">
      {/* Logo */}
      <div className="p-5 pb-4 border-b border-zinc-200">
        <Link href="/" className="no-underline flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-zinc-900 flex items-center justify-center shrink-0">
            <svg width="14" height="14" fill="white" viewBox="0 0 24 24">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-sm text-zinc-900 tracking-tight">AI Studio</div>
            <div className="text-[11px] text-zinc-400">YouTube tvůrce</div>
          </div>
        </Link>
      </div>

      {/* Navigační položky */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-2.5 py-2 rounded-md text-xs transition-colors ${
                isActive
                  ? 'font-semibold text-zinc-900 bg-zinc-100'
                  : 'font-normal text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={isActive ? 'text-zinc-900' : 'text-zinc-400'}>{item.icon}</span>
                {item.name}
              </span>
              <span className="flex items-center gap-1">
                {item.badge && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 border border-zinc-200">
                    {item.badge}
                  </span>
                )}
                {typeof item.count === 'number' && (
                  <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                    {item.count}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Spodní akce */}
      <div className="p-3 border-t border-zinc-200">
        <Link
          href="/videos"
          className="flex items-center justify-center gap-1.5 p-2 rounded-md text-xs font-semibold bg-zinc-900 hover:bg-black text-white transition-opacity"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nové video
        </Link>
        <div className="mt-2 text-[11px] text-zinc-400 text-center font-mono">v1.0</div>
      </div>
    </aside>
  );
}
