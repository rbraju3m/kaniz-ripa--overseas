import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { useService } from '@/hooks/queries';
import { usePublishAlternates } from '@/lib/alternates';
import { isNotFound } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useDocumentMeta } from '@/lib/seo';
import { ServiceIcon } from '@/components/cards/ServiceCard';
import { ContactSection } from '@/components/home/Sections';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { PageHeader, Section } from '@/components/ui/Section';
import { ErrorState, FallbackNotice, Skeleton } from '@/components/ui/States';
import NotFoundPage from './NotFoundPage';

export default function ServiceDetailPage() {
    const { slug } = useParams();
    const { t, path } = useI18n();
    const { service, isLoading, error, refetch } = useService(slug);
    usePublishAlternates(service?.slugs);
    useDocumentMeta(service?.title, service?.summary);

    if (isNotFound(error)) return <NotFoundPage />;

    return (
        <>
            <PageHeader title={service?.title ?? (isLoading ? '…' : '')} lead={service?.summary}>
                <Link to={path('services')} className="mb-6 inline-flex items-center gap-2 text-sm text-navy-200 hover:text-white"><ArrowLeft className="size-4" /> {t.pages.servicesTitle}</Link>
            </PageHeader>
            <Section>
                {isLoading && <div className="space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /></div>}
                {error && !isNotFound(error) && <ErrorState onRetry={() => refetch()} />}
                {service && (
                    <div className="grid gap-12 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <FallbackNotice contentLocale={service.locale} />
                            {service.image && <ResponsiveImage media={service.image} eager sizes="(min-width:1024px) 66vw, 100vw" className="mb-8 aspect-[16/9] w-full rounded-3xl" />}
                            <div className="prose-content text-lg" dangerouslySetInnerHTML={{ __html: service.body ?? '' }} />
                        </div>
                        <aside className="h-fit rounded-card bg-navy-900 p-8 text-white">
                            <span className="mb-5 grid size-14 place-items-center rounded-2xl bg-white/10"><ServiceIcon name={service.icon} className="size-7 text-gold-300" /></span>
                            <h2 className="text-xl font-semibold text-white">{t.home.ctaContact}</h2>
                            <p className="mt-2 text-sm text-navy-200">{t.pages.contactLead}</p>
                            <Link to={path('contact')} className="mt-6 inline-flex h-11 items-center rounded-full bg-gold-500 px-5 text-sm font-semibold text-navy-950 hover:bg-gold-300">{t.home.ctaContact}</Link>
                        </aside>
                    </div>
                )}
            </Section>
            <ContactSection />
        </>
    );
}
