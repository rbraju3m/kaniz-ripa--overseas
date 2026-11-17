import { Suspense, useEffect } from 'react';
import { Outlet, ScrollRestoration } from 'react-router';
import { AlternatesProvider } from '@/lib/alternates';
import { I18nProvider } from '@/lib/i18n';
import type { Locale } from '@/lib/types';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

function PageFallback() {
    return <div className="min-h-[100svh] bg-navy-900" aria-busy="true" />;
}

export default function PublicLayout({ locale }: { locale: Locale }) {
    useEffect(() => {
        document.documentElement.lang = locale;
    }, [locale]);

    return (
        <I18nProvider locale={locale}>
            <AlternatesProvider>
                <Header />
                <main id="main" tabIndex={-1} className="outline-none">
                    <Suspense fallback={<PageFallback />}><Outlet /></Suspense>
                </main>
                <Footer />
                <ScrollRestoration />
            </AlternatesProvider>
        </I18nProvider>
    );
}
