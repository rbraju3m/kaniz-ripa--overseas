import { Suspense, useEffect } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router';
import { AlternatesProvider } from '@/lib/alternates';
import { I18nProvider } from '@/lib/i18n';
import type { Locale } from '@/lib/types';
import { CtaBand } from '@/components/layout/CtaBand';
import { FloatingContact } from '@/components/layout/FloatingContact';
import { Footer } from '@/components/layout/Footer';
import { MobileActionBar } from '@/components/layout/MobileActionBar';
import { ThemeProvider } from '@/lib/theme';
import { Header } from '@/components/layout/Header';

function PageFallback() {
    return <div className="min-h-[100svh] bg-navy-900" aria-busy="true" />;
}

export default function PublicLayout({ locale }: { locale: Locale }) {
    const { pathname } = useLocation();
    // Pages that already end with the full contact section don't need the closing call-to-action.
    const rest = pathname.replace(/^\/(bn|en)\/?/, '');
    const showCta = rest !== '' && !/^(contact|company-profile|services\/[^/]+)\/?$/.test(rest);
    // Cursor position for the .spotlight card glow (one listener for the whole site).
    useEffect(() => {
        const onMove = (e: PointerEvent) => {
            if (e.pointerType !== 'mouse') return;
            const el = (e.target as Element | null)?.closest?.('.spotlight') as HTMLElement | null;
            if (!el) return;
            const r = el.getBoundingClientRect();
            el.style.setProperty('--mx', `${e.clientX - r.left}px`);
            el.style.setProperty('--my', `${e.clientY - r.top}px`);
        };
        document.addEventListener('pointermove', onMove, { passive: true });
        return () => document.removeEventListener('pointermove', onMove);
    }, []);

    useEffect(() => {
        document.documentElement.lang = locale;
    }, [locale]);

    return (
        <I18nProvider locale={locale}>
            <AlternatesProvider>
                <ThemeProvider>
                    {(theme) => (
                        <div className={theme === 'dark' ? 'site-dark min-h-screen' : 'min-h-screen'}>
                            <Header />
                            {/* Bottom padding on phones keeps the footer clear of the quick-action bar. */}
                            <main id="main" tabIndex={-1} className="outline-none">
                                {/* Soft fade between pages. */}
                                <div key={pathname} className="animate-page-in">
                                    <Suspense fallback={<PageFallback />}><Outlet /></Suspense>
                                </div>
                            </main>
                            {showCta && <CtaBand />}
                            <div className="bg-navy-950 pb-16 sm:pb-0"><Footer /></div>
                            <FloatingContact />
                            <MobileActionBar />
                            <ScrollRestoration />
                        </div>
                    )}
                </ThemeProvider>
            </AlternatesProvider>
        </I18nProvider>
    );
}
