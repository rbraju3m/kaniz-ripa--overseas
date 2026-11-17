import { useEffect, useState } from 'react';
import { Menu, Phone, X } from 'lucide-react';
import { NavLink, useLocation } from 'react-router';
import { useSite } from '@/hooks/queries';
import { useI18n } from '@/lib/i18n';
import type { MenuItem } from '@/lib/types';
import { cn, toE164 } from '@/lib/utils';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Logo } from './Logo';

const FALLBACK: string[] = ['home', 'about', 'services', 'portfolio', 'partners', 'success-stories', 'gallery', 'contact'];

export function useMenuLinks(location: 'header' | 'footer') {
    const { site } = useSite();
    const { t, path } = useI18n();
    const items: MenuItem[] = site?.menus?.[location] ?? FALLBACK.map((r, i) => ({ id: i, label: t.nav[r as keyof typeof t.nav], route: r, url: null, new_tab: false, children: [] }));

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
    const { pathname } = useLocation();
    const links = useMenuLinks('header');
    const [scrolled, setScrolled] = useState(false);
    // The menu stays open only on the page where it was opened, so navigating closes it.
    const [openOn, setOpenOn] = useState<string | null>(null);
    const open = openOn === pathname;
    const phone = site?.settings.contact?.phone;

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    // Over the dark hero/page header the bar is transparent; it turns solid on scroll.
    const solid = scrolled || open;

    return (
        <header className={cn('fixed inset-x-0 top-0 z-50 transition-all duration-300', solid ? 'bg-white/95 shadow-soft backdrop-blur' : 'bg-transparent')}>
            <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-md focus:bg-white focus:px-4 focus:py-2">{t.nav.skip}</a>
            <div className="container-page flex h-18 items-center justify-between gap-4 py-3">
                <Logo dark={!solid} />

                <nav aria-label="Primary" className="hidden items-center gap-1 xl:flex">
                    {links.map((l) => l.external ? (
                        <a key={l.key} href={l.to} target={l.newTab ? '_blank' : undefined} rel="noopener noreferrer" className={cn('rounded-full px-3 py-2 text-sm font-medium', solid ? 'text-navy-800 hover:bg-navy-50' : 'text-white/90 hover:bg-white/10')}>{l.label}</a>
                    ) : (
                        <NavLink key={l.key} to={l.to} end={l.end} className={({ isActive }) => cn(
                            'rounded-full px-3 py-2 text-sm font-medium transition',
                            solid ? (isActive ? 'bg-navy-50 text-navy-900' : 'text-slate-700 hover:bg-navy-50 hover:text-navy-900')
                                : (isActive ? 'bg-white/15 text-white' : 'text-white/85 hover:bg-white/10 hover:text-white'),
                        )}>{l.label}</NavLink>
                    ))}
                </nav>

                <div className="flex items-center gap-2">
                    <LanguageSwitcher dark={!solid} className="hidden sm:inline-flex" />
                    {phone && (
                        <a href={`tel:${toE164(phone)}`} className="hidden h-9 items-center gap-2 rounded-full bg-brand-green-700 px-4 text-sm font-semibold text-white transition hover:bg-brand-green-800 lg:inline-flex">
                            <Phone className="size-4" aria-hidden /> {t.common.callUs}
                        </a>
                    )}
                    <button
                        type="button"
                        onClick={() => setOpenOn(open ? null : pathname)}
                        aria-expanded={open}
                        aria-controls="mobile-nav"
                        aria-label={open ? t.nav.close : t.nav.menu}
                        className={cn('grid size-10 place-items-center rounded-full xl:hidden', solid ? 'text-navy-900 hover:bg-navy-50' : 'text-white hover:bg-white/10')}
                    >
                        {open ? <X className="size-6" /> : <Menu className="size-6" />}
                    </button>
                </div>
            </div>

            {open && (
                <div id="mobile-nav" className="h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-slate-100 bg-white xl:hidden">
                    <nav aria-label="Mobile" className="container-page flex flex-col gap-1 py-6">
                        {links.map((l) => l.external ? (
                            <a key={l.key} href={l.to} target="_blank" rel="noopener noreferrer" className="rounded-xl px-4 py-3 text-lg font-medium text-navy-900 hover:bg-navy-50">{l.label}</a>
                        ) : (
                            <NavLink key={l.key} to={l.to} end={l.end} className={({ isActive }) => cn('rounded-xl px-4 py-3 text-lg font-medium', isActive ? 'bg-brand-green-50 text-brand-green-800' : 'text-navy-900 hover:bg-navy-50')}>{l.label}</NavLink>
                        ))}
                        <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 px-4 pt-6">
                            <LanguageSwitcher />
                            {phone && <a href={`tel:${toE164(phone)}`} className="inline-flex h-9 items-center gap-2 rounded-full bg-brand-green-700 px-4 text-sm font-semibold text-white"><Phone className="size-4" /> {phone}</a>}
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}
