'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  CreditCard,
  Globe,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { createClient } from '@/lib/supabase/client';

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: 'Pro' | 'Soon';
  disabled?: boolean;
};

const ITEMS: Item[] = [
  { href: '/dashboard', label: 'Campaigns', icon: LayoutDashboard },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard, badge: 'Soon', disabled: true },
  { href: '/dashboard/settings/domains', label: 'Domains', icon: Globe, badge: 'Pro', disabled: true },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, badge: 'Soon', disabled: true },
];

export default function Sidebar({ userEmail, children }: { userEmail: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('kudoso-sidebar-collapsed') : null;
    if (saved === '1') setCollapsed(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem('kudoso-sidebar-collapsed', next ? '1' : '0');
      } catch {}
      return next;
    });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <aside
        className={clsx(
          'hidden md:flex fixed inset-y-0 left-0 z-30 flex-col bg-white border-r border-zinc-200 transition-[width] duration-200',
          collapsed ? 'md:w-16' : 'md:w-60',
        )}
      >
        <Link href="/dashboard" className="flex items-center gap-2 px-4 h-14 border-b border-zinc-100">
          <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          {!collapsed && <span className="text-sm font-semibold text-zinc-900 tracking-tight">kudoso</span>}
        </Link>

        <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
          {ITEMS.map((item) => (
            <SidebarLink key={item.href} item={item} active={isActive(pathname, item.href)} collapsed={collapsed} />
          ))}
        </nav>

        <div className="px-2 py-3 border-t border-zinc-100 flex flex-col gap-1">
          {!collapsed && <p className="px-2 mb-1 text-[11px] text-zinc-400 truncate">{userEmail}</p>}
          <button
            onClick={handleLogout}
            className={clsx(
              'flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors',
              collapsed && 'justify-center',
            )}
            title={collapsed ? 'Sign out' : undefined}
          >
            <LogOut size={16} />
            {!collapsed && <span>Sign out</span>}
          </button>
          <button
            onClick={toggleCollapsed}
            className={clsx(
              'flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-colors',
              collapsed && 'justify-center',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronsRight size={14} />
            ) : (
              <>
                <ChevronsLeft size={14} />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-white border-b border-zinc-200 px-4 h-12">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <span className="text-sm font-semibold text-zinc-900 tracking-tight">kudoso</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="p-1.5 -mr-1.5 text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 bg-zinc-900/40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.18 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 flex flex-col"
            >
              <div className="flex items-center justify-between px-4 h-12 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-sm font-semibold text-zinc-900 tracking-tight">kudoso</span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="p-1.5 -mr-1.5 text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
                {ITEMS.map((item) => (
                  <SidebarLink key={item.href} item={item} active={isActive(pathname, item.href)} collapsed={false} />
                ))}
              </nav>
              <div className="px-4 py-3 border-t border-zinc-100">
                <p className="text-[11px] text-zinc-400 truncate mb-2">{userEmail}</p>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className={clsx('transition-[padding] duration-200', collapsed ? 'md:pl-16' : 'md:pl-60')}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</div>
      </main>
    </div>
  );
}

function SidebarLink({ item, active, collapsed }: { item: Item; active: boolean; collapsed: boolean }) {
  const Icon = item.icon;
  const cls = clsx(
    'group flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors',
    active && 'bg-zinc-100',
    !active && !item.disabled && 'hover:bg-zinc-50',
    item.disabled && 'opacity-60 cursor-not-allowed',
    collapsed && 'justify-center',
  );

  const inner = (
    <>
      <Icon size={16} className={clsx('shrink-0', active ? 'text-zinc-900' : 'text-zinc-500 group-hover:text-zinc-900')} />
      {!collapsed && (
        <>
          <span className={clsx('flex-1', active ? 'text-zinc-900 font-medium' : 'text-zinc-600 group-hover:text-zinc-900')}>{item.label}</span>
          {item.badge && (
            <span
              className={clsx(
                'text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wide',
                item.badge === 'Pro' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500',
              )}
            >
              {item.badge}
            </span>
          )}
        </>
      )}
    </>
  );

  if (item.disabled) {
    return (
      <div className={cls} aria-disabled title={item.label}>
        {inner}
      </div>
    );
  }
  return (
    <Link href={item.href} className={cls} title={collapsed ? item.label : undefined}>
      {inner}
    </Link>
  );
}

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === '/dashboard') {
    return pathname === '/dashboard' || pathname.startsWith('/dashboard/campaigns');
  }
  return pathname === href || pathname.startsWith(href + '/');
}
