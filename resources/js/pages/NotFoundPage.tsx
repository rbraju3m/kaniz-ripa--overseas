import { Compass } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useDocumentMeta } from '@/lib/seo';
import { ButtonLink } from '@/components/ui/Button';

export default function NotFoundPage() {
    const { t, path } = useI18n();
    useDocumentMeta(t.pages.notFoundTitle);
    return (
        <section className="flex min-h-[80vh] items-center bg-gradient-to-b from-navy-900 to-navy-950 pt-24 text-white">
            <div className="container-page text-center">
                <Compass className="mx-auto mb-6 size-14 text-gold-300" aria-hidden />
                <p className="font-display text-7xl font-extrabold text-white/20">404</p>
                <h1 className="mt-2 text-3xl font-bold text-white">{t.pages.notFoundTitle}</h1>
                <p className="mx-auto mt-4 max-w-md text-navy-200">{t.pages.notFoundText}</p>
                <ButtonLink to={path()} variant="gold" className="mt-8">{t.pages.goHome}</ButtonLink>
            </div>
        </section>
    );
}
