import {
    Activity, Building2, FileText, Flag, Folder, Globe, Images, Inbox, LayoutDashboard, LogOut, Menu as MenuIcon, Navigation,
    Newspaper, Search, Settings, Shield, Sparkles, Users, Wrench, X, type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { cn } from '@/lib/utils';
import { useCan, useLogout, useUser } from '../lib/auth';

interface NavItem { to: string; label: string; icon: LucideIcon; perm: string }
const NAV: { group: string; items: NavItem[] }[] = [
    { group: '', items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, perm: 'dashboard.view' }] },
    { group: 'Content', items: [
        { to: '/admin/pages', label: 'Website pages', icon: FileText, perm: 'pages.view' },
        { to: '/admin/services', label: 'Services', icon: Wrench, perm: 'services.view' },
        { to: '/admin/portfolios', label: 'Portfolio', icon: Newspaper, perm: 'portfolios.view' },
        { to: '/admin/companies', label: 'Partner companies', icon: Building2, perm: 'companies.view' },
        { to: '/admin/success-stories', label: 'Success stories', icon: Sparkles, perm: 'success_stories.view' },
        { to: '/admin/countries', label: 'Countries', icon: Flag, perm: 'countries.view' },
    ] },
    { group: 'Media', items: [
        { to: '/admin/gallery-items', label: 'Gallery', icon: Images, perm: 'gallery.view' },
        { to: '/admin/gallery-categories', label: 'Gallery categories', icon: Folder, perm: 'gallery.view' },
        { to: '/admin/media', label: 'Media library', icon: Images, perm: 'media.view' },
        { to: '/admin/company-profile', label: 'Company profile PDF', icon: FileText, perm: 'company_profile.view' },
    ] },
    { group: 'Website', items: [
        { to: '/admin/contact-messages', label: 'Contact messages', icon: Inbox, perm: 'contact_messages.view' },
        { to: '/admin/menus', label: 'Navigation', icon: Navigation, perm: 'menus.view' },
        { to: '/admin/seo', label: 'SEO', icon: Search, perm: 'seo.view' },
        { to: '/admin/settings', label: 'Settings', icon: Settings, perm: 'settings.view' },
    ] },
    { group: 'System', items: [
        { to: '/admin/users', label: 'Users', icon: Users, perm: 'users.view' },
        { to: '/admin/roles', label: 'Roles & permissions', icon: Shield, perm: 'roles.view' },
        { to: '/admin/activity-logs', label: 'Activity log', icon: Activity, perm: 'activity_logs.view' },
    ] },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
    const can = useCan();
    return (
        <nav aria-label="Admin" className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-5">
            <div className="px-3 text-white">
                <p className="font-display text-sm font-extrabold tracking-[0.14em]">KANIZ RIPA</p>
                <p className="font-display text-[10px] font-semibold tracking-[0.32em] text-gold-300">OVERSEAS · CMS</p>
            </div>
            {NAV.map(({ group, items }) => {
                const visible = items.filter((i) => can(i.perm));
                if (!visible.length) return null;
                return (
                    <div key={group || 'main'}>
                        {group && <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-navy-400">{group}</p>}
                        <ul className="space-y-0.5">
                            {visible.map(({ to, label, icon: Icon }) => (
                                <li key={to}>
                                    <NavLink to={to} end={to === '/admin'} onClick={onNavigate} className={({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition', isActive ? 'bg-white/10 font-medium text-white' : 'text-navy-200 hover:bg-white/5 hover:text-white')}>
                                        <Icon className="size-4 shrink-0" aria-hidden /> {label}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })}
            <a href="/" target="_blank" rel="noopener" className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-navy-200 hover:bg-white/5 hover:text-white"><Globe className="size-4" /> View website</a>
        </nav>
    );
}

export default function AdminLayout() {
    const user = useUser();
    const logout = useLogout();
    const { pathname } = useLocation();
    const [openOn, setOpenOn] = useState<string | null>(null);
    const open = openOn === pathname;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 [&_h1]:font-sans [&_h2]:font-sans">
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-navy-950 lg:block"><Sidebar /></aside>
            {open && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpenOn(null)} />
                    <aside className="absolute inset-y-0 left-0 w-72 bg-navy-950"><Sidebar onNavigate={() => setOpenOn(null)} /></aside>
                </div>
            )}
            <div className="lg:pl-64">
                <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
                    <button className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpenOn(open ? null : pathname)} aria-label="Toggle navigation">
                        {open ? <X className="size-5" /> : <MenuIcon className="size-5" />}
                    </button>
                    <div className="ml-auto flex items-center gap-3">
                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-medium text-slate-900">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.roles.join(', ')}</p>
                        </div>
                        <button onClick={() => logout.mutate()} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"><LogOut className="size-4" /> Sign out</button>
                    </div>
                </header>
                <main className="px-4 pb-16 pt-6 sm:px-6 lg:px-8"><Outlet /></main>
            </div>
        </div>
    );
}
