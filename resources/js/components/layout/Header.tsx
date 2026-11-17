import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Menu, Moon, Phone, Search, Sun, X } from 'lucide-react';
import { NavLink, useLocation } from 'react-router';
import { useSite } from '@/hooks/queries';
import { useI18n } from '@/lib/i18n';
import type { MenuItem } from '@/lib/types';
import { useTheme } from '@/lib/theme';
import { cn, toE164 } from '@/lib/utils';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Logo } from './Logo';
import { SearchDialog } from './SearchDialog';

const FALLBACK: string[] = ['home', 'about', 'services', 'portfolio', 'partners', 'success-stories', 'gallery', 'contact'];

export function useMenuLinks(location: 'header' | 'footer') {
    const { site } = useSite();
    const { t, path } = useI18n();
    const all: MenuItem[] = site?.menus?.[location] ?? FALLBACK.map((r, i) => ({ id: i, label: t.nav[r as keyof typeof t.nav], route: r, url: null, new_tab: false, children: [] }));
    // No downloadable profile PDF: hide the Company Profile link instead of leading to an empty page.
    const items = site?.company_profile_available ? all : all.filter((item) => item.route !== 'company-profile');

    return items.map((item) => ({
        key: item.id,
        label: item.label,
        external: !item.route && !!item.url && /^https?:/.test(item.url),
        newTab: item.new_tab,
        to: item.route ? path(item.route === 'home' ? '' : item.route) : (item.url ?? '#'),
        end: item.route === 'home',
    }));
}

export function Header() {
    const { t } = useI18n();
    const { site } = useSite();
    const { theme, toggle } = useTheme();
    const { pathname } = useLocation();
    const links = useMenuLinks('header');
    const [scrolled, setScrolled] = useState(false);
    // The menu stays open only on the page where it was opened, so navigating closes it.
    const [openOn, setOpenOn] = useState<string | null>(null);
    const open = openOn === pathname;
    const [searchOpen, setSearchOpen] = useState(false);
    const phone = site?.settings.contact?.phone;

    const progressRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 24);
            // Reading progress: updated directly on the element, no re-render per scroll event.
            const max = document.documentElement.scrollHeight - window.innerHeight;
            if (progressRef.current) progressRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    // Ctrl/Cmd + K (or "/") opens the site search.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const typing = e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
            if ((e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
                e.preventDefault();
                setSearchOpen(true);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // Over the dark hero/page header the bar is transparent; it turns solid on scroll.
    const solid = scrolled;
    const iconBtn = cn('grid size-10 place-items-center rounded-full transition', solid ? 'text-navy-900 hover:bg-navy-50' : 'text-white hover:bg-white/10');

    return (
        <>
            <header className={cn('fixed inset-x-0 top-0 z-50 transition-all duration-300', solid ? 'bg-white/95 shadow-soft backdrop-blur' : 'bg-transparent')}>
                <div aria-hidden className={cn('absolute inset-x-0 bottom-0 h-0.5 transition-opacity', solid ? 'opacity-100' : 'opacity-0')}>
                    <div ref={progressRef} className="h-full origin-left scale-x-0 bg-gradient-to-r from-brand-green-600 via-gold-500 to-royal-600" />
                </div>
                <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-md focus:bg-white focus:px-4 focus:py-2">{t.nav.skip}</a>
                <div className="container-page flex h-18 items-center justify-between gap-4 py-3">
                    <Logo dark={!solid} className="shrink-0" />

                    <nav aria-label="Primary" className="hidden items-center gap-1 xl:flex">
                        {links.map((l) => {
                            const cls = (active: boolean) => cn(
                                'relative whitespace-nowrap px-2.5 py-2 text-sm font-medium transition-colors after:absolute after:inset-x-2.5 after:bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-gold-500 after:transition-transform after:duration-300',
                                active ? 'after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100',
                                solid ? (active ? 'text-navy-900' : 'text-slate-700 hover:text-navy-900') : (active ? 'text-white' : 'text-white/80 hover:text-white'),
                            );
                            return l.external
                                ? <a key={l.key} href={l.to} target={l.newTab ? '_blank' : undefined} rel="noopener noreferrer" className={cls(false)}>{l.label}</a>
                                : <NavLink key={l.key} to={l.to} end={l.end} className={({ isActive }) => cls(isActive)}>{l.label}</NavLink>;
                        })}
                    </nav>

                    <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                        <button type="button" onClick={() => setSearchOpen(true)} aria-label={t.search.open} className={cn(iconBtn, '2xl:flex 2xl:w-auto 2xl:items-center 2xl:gap-2 2xl:px-3 2xl:ring-1', solid ? '2xl:ring-slate-200' : '2xl:ring-white/25')}>
                            <Search className="size-5" />
                            <kbd className={cn('hidden whitespace-nowrap rounded px-1.5 font-sans text-[11px] 2xl:inline', solid ? 'bg-slate-100 text-slate-500' : 'bg-white/10 text-white/70')}>Ctrl K</kbd>
                        </button>
                        <button type="button" onClick={toggle} aria-label={theme === 'dark' ? t.theme.light : t.theme.dark} title={theme === 'dark' ? t.theme.light : t.theme.dark} className={cn(iconBtn, 'hidden sm:grid')}>
                            <span key={theme} className="animate-[pop_0.4s_ease-out_both]">{theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}</span>
                        </button>
                        <LanguageSwitcher dark={!solid} className="hidden sm:inline-flex" />
                        {phone && (
                            <a href={`tel:${toE164(phone)}`} className="btn-shine hidden h-9 items-center gap-2 whitespace-nowrap rounded-full bg-brand-green-700 px-4 text-sm font-semibold text-white transition hover:bg-brand-green-800 lg:inline-flex">
                                <Phone className="size-4" aria-hidden /> {t.common.callUs}
                            </a>
                        )}
                        <button type="button" onClick={() => setOpenOn(pathname)} aria-expanded={open} aria-controls="mobile-nav" aria-label={t.nav.menu} className={cn(iconBtn, 'xl:hidden')}>
                            <Menu className="size-6" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Slide-in mobile menu */}
            <div className={cn('fixed inset-0 z-[60] xl:hidden', open ? 'visible' : 'invisible')} aria-hidden={!open}>
                <div onClick={() => setOpenOn(null)} className={cn('absolute inset-0 bg-navy-950/60 backdrop-blur-sm transition-opacity duration-300', open ? 'opacity-100' : 'opacity-0')} />
                <div id="mobile-nav" role="dialog" aria-modal="true" aria-label={t.nav.menu} {...(!open && { inert: true })}
                    className={cn('absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-out', open ? 'translate-x-0' : 'translate-x-full')}>
                    <div className="flex h-18 items-center justify-between border-b border-slate-100 px-5">
                        <Logo />
                        <button type="button" onClick={() => setOpenOn(null)} aria-label={t.nav.close} className="grid size-10 place-items-center rounded-full text-navy-900 hover:bg-navy-50"><X className="size-6" /></button>
                    </div>
                    <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-3 py-4">
                        {links.map((l, i) => {
                            const style = { transitionDelay: open ? `${80 + i * 45}ms` : '0ms' };
                            const cls = (active: boolean) => cn('flex items-center justify-between rounded-xl px-4 py-3.5 text-lg font-medium transition duration-300', open ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0', active ? 'bg-brand-green-50 text-brand-green-800' : 'text-navy-900 hover:bg-navy-50');
                            return l.external
                                ? <a key={l.key} href={l.to} target="_blank" rel="noopener noreferrer" style={style} className={cls(false)}>{l.label}</a>
                                : <NavLink key={l.key} to={l.to} end={l.end} style={style} className={({ isActive }) => cls(isActive)}>{l.label}<ChevronRight className="size-5 opacity-40" /></NavLink>;
                        })}
                    </nav>
                    <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 p-5">
                        <LanguageSwitcher />
                        <button type="button" onClick={toggle} className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium text-navy-900 ring-1 ring-slate-200">
                            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />} {theme === 'dark' ? t.theme.light : t.theme.dark}
                        </button>
                        {phone && <a href={`tel:${toE164(phone)}`} className="inline-flex h-9 items-center gap-2 rounded-full bg-brand-green-700 px-4 text-sm font-semibold text-white"><Phone className="size-4" /> {phone}</a>}
                    </div>
                </div>
            </div>

            <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
        </>
    );
}
