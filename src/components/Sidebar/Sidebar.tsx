'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import KudosoLogo from '@/components/KudosoLogo';
import {
  LayoutDashboard,
  CreditCard,
  Globe,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  LogOut,
  Users,
  ChevronDown,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { signOut } from 'next-auth/react';
import type { ActiveOrg } from '@/lib/org';
import { setActiveOrg } from '@/app/(dashboard)/dashboard/actions';

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: 'Pro';
};

const ITEMS: Item[] = [
  { href: '/dashboard', label: 'Campaigns', icon: LayoutDashboard },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/team', label: 'Team', icon: Users, badge: 'Pro' },
  { href: '/dashboard/settings/domains', label: 'Domains', icon: Globe, badge: 'Pro' },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({
  userEmail,
  orgs,
  activeOrg,
  children,
}: {
  userEmail: string;
  orgs: ActiveOrg[];
  activeOrg: ActiveOrg | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const plan = activeOrg?.plan ?? 'free';

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('kudoso-sidebar-collapsed') : null;
    if (saved === '1') setCollapsed(true);
    setHydrated(true);
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
    await signOut({ callbackUrl: '/login' });
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <aside
        className={clsx(
          'hidden md:flex fixed inset-y-0 left-0 z-30 flex-col bg-white border-r border-zinc-200 transition-[width] duration-200',
          hydrated && collapsed ? 'md:w-16' : 'md:w-60',
        )}
      >
        <div
          className={clsx(
            'flex items-center h-14 border-b border-zinc-100 px-2',
            collapsed ? 'justify-center' : 'justify-between gap-2',
          )}
        >
          {collapsed ? (
            <Link href="/" className="shrink-0" aria-label="Kudoso home">
              <KudosoLogo size={26} />
            </Link>
          ) : (
            <Link href="/" className="flex items-center gap-2 min-w-0 px-1">
              <KudosoLogo size={26} className="shrink-0" />
              <span className="text-sm font-semibold text-zinc-900 tracking-tight truncate">kudoso</span>
            </Link>
          )}
          <button
            onClick={toggleCollapsed}
            className="p-1.5 rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors shrink-0"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {!collapsed && orgs.length > 0 && (
          <div className="px-2 pt-2">
            <OrgSwitcher orgs={orgs} activeOrg={activeOrg} />
          </div>
        )}

        <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
          {ITEMS.map((item) => (
            <SidebarLink key={item.href} item={item} active={isActive(pathname, item.href)} collapsed={collapsed} userPlan={plan} />
          ))}
        </nav>

        <div className="px-2 py-3 border-t border-zinc-100">
          {!collapsed && (
            <div className="px-2 mb-2">
              <p className="text-[11px] text-zinc-400 truncate">{userEmail}</p>
              <p className={clsx('text-[10px] uppercase tracking-wide font-medium mt-0.5', plan === 'pro' ? 'text-emerald-600' : 'text-zinc-400')}>
                {plan === 'pro' ? 'Pro plan' : 'Free plan'}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={clsx(
              'flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors w-full',
              collapsed && 'justify-center',
            )}
            title={collapsed ? 'Sign out' : undefined}
          >
            <LogOut size={16} />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-white border-b border-zinc-200 px-4 h-12">
        <Link href="/" className="flex items-center gap-2">
          <KudosoLogo size={24} />
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
                  <KudosoLogo size={24} />
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
              {orgs.length > 0 && (
                <div className="px-2 pt-2">
                  <OrgSwitcher orgs={orgs} activeOrg={activeOrg} />
                </div>
              )}
              <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
                {ITEMS.map((item) => (
                  <SidebarLink key={item.href} item={item} active={isActive(pathname, item.href)} collapsed={false} userPlan={plan} />
                ))}
              </nav>
              <div className="px-4 py-3 border-t border-zinc-100">
                <p className="text-[11px] text-zinc-400 truncate">{userEmail}</p>
                <p className={clsx('text-[10px] uppercase tracking-wide font-medium mt-0.5 mb-2', plan === 'pro' ? 'text-emerald-600' : 'text-zinc-400')}>
                  {plan === 'pro' ? 'Pro plan' : 'Free plan'}
                </p>
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

      <main className={clsx('transition-[padding] duration-200', hydrated && collapsed ? 'md:pl-16' : 'md:pl-60')}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</div>
      </main>
    </div>
  );
}

function OrgSwitcher({ orgs, activeOrg }: { orgs: ActiveOrg[]; activeOrg: ActiveOrg | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!activeOrg) return null;

  function handleSwitch(slug: string) {
    setOpen(false);
    startTransition(() => {
      setActiveOrg(slug);
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
      >
        <span className="truncate font-medium text-xs">{activeOrg.name}</span>
        {orgs.length > 1 && <ChevronDown size={13} className={clsx('text-zinc-400 transition-transform shrink-0', open && 'rotate-180')} />}
      </button>
      {open && orgs.length > 1 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg py-1 z-50">
          {orgs.map((org) => (
            <button
              key={org.id}
              onClick={() => handleSwitch(org.slug)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors text-left"
            >
              <div className="w-5 h-5 rounded-md bg-zinc-100 flex items-center justify-center shrink-0">
                <span className="text-[9px] font-bold text-zinc-600">{org.name.slice(0, 1).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-900 truncate">{org.name}</p>
                <p className="text-[10px] text-zinc-400">{org.role}</p>
              </div>
              {org.id === activeOrg.id && <Check size={12} className="text-emerald-600 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarLink({ item, active, collapsed, userPlan }: { item: Item; active: boolean; collapsed: boolean; userPlan: 'free' | 'pro' }) {
  const Icon = item.icon;
  const cls = clsx(
    'group flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors',
    active && 'bg-zinc-100',
    !active && 'hover:bg-zinc-50',
    collapsed && 'justify-center',
  );

  return (
    <Link href={item.href} className={cls} title={collapsed ? item.label : undefined}>
      <Icon size={16} className={clsx('shrink-0', active ? 'text-zinc-900' : 'text-zinc-500 group-hover:text-zinc-900')} />
      {!collapsed && (
        <>
          <span className={clsx('flex-1 truncate', active ? 'text-zinc-900 font-medium' : 'text-zinc-600 group-hover:text-zinc-900')}>{item.label}</span>
          {item.badge === 'Pro' && (
            <span
              className={clsx(
                'text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wide',
                userPlan === 'pro' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500',
              )}
            >
              Pro
            </span>
          )}
        </>
      )}
    </Link>
  );
}

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === '/dashboard') {
    return pathname === '/dashboard' || pathname.startsWith('/dashboard/campaigns');
  }
  if (href === '/dashboard/settings') {
    return pathname === '/dashboard/settings';
  }
  return pathname === href || pathname.startsWith(href + '/');
}
