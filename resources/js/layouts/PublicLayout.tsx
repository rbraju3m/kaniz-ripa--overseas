import { Suspense, useEffect } from 'react';
import { Navigate, Outlet, ScrollRestoration, useParams } from 'react-router';
import { AlternatesProvider } from '@/lib/alternates';
import { I18nProvider, isLocale } from '@/lib/i18n';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

function PageFallback() {
    return <div className="min-h-[70vh] bg-navy-900" aria-busy="true" />;
}

export default function PublicLayout() {
    const { locale } = useParams();

    useEffect(() => {
        if (isLocale(locale)) document.documentElement.lang = locale;
    }, [locale]);

    if (!isLocale(locale)) return <Navigate to="/bn" replace />;

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
