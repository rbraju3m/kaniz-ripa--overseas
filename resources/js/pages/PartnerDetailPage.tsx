import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { usePartner } from '@/hooks/queries';
import { isNotFound } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useDocumentMeta } from '@/lib/seo';
import { PortfolioCard } from '@/components/cards/PortfolioCard';
import { ButtonAnchor } from '@/components/ui/Button';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { PageHeader, Section, SectionHeading } from '@/components/ui/Section';
import { ErrorState, Skeleton } from '@/components/ui/States';
import NotFoundPage from './NotFoundPage';

export default function PartnerDetailPage() {
    const { slug } = useParams();
    const { t, path } = useI18n();
    const { partner, isLoading, error, refetch } = usePartner(slug);
    useDocumentMeta(partner?.name, partner?.description);

    if (isNotFound(error)) return <NotFoundPage />;

    return (
        <>
            <PageHeader title={partner?.name ?? (isLoading ? '…' : '')} lead={[partner?.industry?.name, partner?.country && `${partner.country.flag} ${partner.country.name}`].filter(Boolean).join(' · ')}>
                <Link to={path('partners')} className="mb-6 inline-flex items-center gap-2 text-sm text-navy-200 hover:text-white"><ArrowLeft className="size-4" /> {t.pages.partnersTitle}</Link>
            </PageHeader>
            <Section>
                {isLoading && <Skeleton className="h-32 w-full" />}
                {error && !isNotFound(error) && <ErrorState onRetry={() => refetch()} />}
                {partner && (
                    <div className="grid gap-10 lg:grid-cols-3">
                        <aside className="h-fit rounded-card bg-white p-8 shadow-soft ring-1 ring-slate-200">
                            {partner.logo
                                ? <ResponsiveImage media={partner.logo} sizes="240px" className="mb-6 h-20 w-auto object-contain" alt={partner.name} />
                                : <span aria-hidden className="mb-6 grid size-20 place-items-center rounded-2xl bg-gradient-to-br from-navy-800 to-royal-700 font-display text-3xl font-bold text-white shadow-soft">{partner.name.charAt(0)}</span>}
                            <p className="font-semibold text-navy-900">{partner.name}</p>
                            {(partner.industry?.name || partner.country) && (
                                <p className="mt-1 text-sm text-slate-500">{[partner.industry?.name, partner.country && `${partner.country.flag} ${partner.country.name}`].filter(Boolean).join(' · ')}</p>
                            )}
                            {partner.website_url && <div className="mt-6" />}
                            {partner.website_url && (
                                <ButtonAnchor href={partner.website_url} target="_blank" rel="noopener noreferrer" variant="secondary" size="sm">{t.common.visitWebsite} <ExternalLink className="size-4" /></ButtonAnchor>
                            )}
                        </aside>
                        <div className="lg:col-span-2">
                            {partner.description && <p className="whitespace-pre-line text-lg leading-relaxed">{partner.description}</p>}
                        </div>
                    </div>
                )}
            </Section>
            {partner?.portfolios && partner.portfolios.length > 0 && (
                <Section tone="slate">
                    <SectionHeading title={t.portfolio.related} />
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{partner.portfolios.map((p) => <PortfolioCard key={p.id} item={p} />)}</div>
                </Section>
            )}
        </>
    );
}
