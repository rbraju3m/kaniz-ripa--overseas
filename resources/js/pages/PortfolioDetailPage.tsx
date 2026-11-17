import { ArrowLeft, Briefcase, Calendar, Factory, Globe2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { usePortfolio } from '@/hooks/queries';
import { usePublishAlternates } from '@/lib/alternates';
import { isNotFound } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useDocumentMeta } from '@/lib/seo';
import { formatDate, lines } from '@/lib/utils';
import { Lightbox } from '@/components/ui/Lightbox';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { PageHeader, Section } from '@/components/ui/Section';
import { ErrorState, FallbackNotice, Skeleton } from '@/components/ui/States';
import NotFoundPage from './NotFoundPage';

function Fact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
    return (
        <div className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-gold-300">{icon}</span>
            <div><dt className="text-xs text-navy-300">{label}</dt><dd className="font-medium text-white">{children}</dd></div>
        </div>
    );
}

/** Rich text (HTML from CMS) or plain multiline text from poster drafts. */
function Activities({ value }: { value: string }) {
    if (/<[a-z][\s\S]*>/i.test(value)) return <div className="prose-content" dangerouslySetInnerHTML={{ __html: value }} />;
    return (
        <ul className="grid gap-3 sm:grid-cols-2">
            {lines(value).map((l) => <li key={l} className="flex gap-3 rounded-xl bg-brand-green-50 p-4 text-navy-900"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-green-600" />{l}</li>)}
        </ul>
    );
}

export default function PortfolioDetailPage() {
    const { slug } = useParams();
    const { t, path, locale } = useI18n();
    const { portfolio: p, isLoading, error, refetch } = usePortfolio(slug);
    const [lightbox, setLightbox] = useState<number | null>(null);
    usePublishAlternates(p?.slugs);
    useDocumentMeta(p?.title, p?.summary);

    if (isNotFound(error)) return <NotFoundPage />;
    const images = p?.images ?? [];

    return (
        <>
            <PageHeader title={p?.title ?? (isLoading ? '…' : '')} lead={p?.summary}>
                <Link to={path('portfolio')} className="mb-6 inline-flex items-center gap-2 text-sm text-navy-200 hover:text-white"><ArrowLeft className="size-4" /> {t.pages.portfolioTitle}</Link>
                {p && (
                    <dl className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {p.company && <Fact icon={<Briefcase className="size-5" />} label={t.portfolio.company}>{p.company.slug ? <Link to={path(`partners/${p.company.slug}`)} className="underline-offset-2 hover:underline">{p.company.name}</Link> : p.company.name}</Fact>}
                        {p.country && <Fact icon={<Globe2 className="size-5" />} label={t.portfolio.country}>{p.country.flag} {p.country.name}</Fact>}
                        {p.industry?.name && <Fact icon={<Factory className="size-5" />} label={t.portfolio.industry}>{p.industry.name}</Fact>}
                        {p.project_date && <Fact icon={<Calendar className="size-5" />} label={t.portfolio.date}>{formatDate(p.project_date, locale, { day: 'numeric', month: 'long', year: 'numeric' })}</Fact>}
                    </dl>
                )}
            </PageHeader>

            <Section>
                {isLoading && <div className="space-y-3"><Skeleton className="aspect-[16/7] w-full" /><Skeleton className="h-4 w-4/5" /></div>}
                {error && !isNotFound(error) && <ErrorState onRetry={() => refetch()} />}
                {p && (
                    <div className="mx-auto max-w-4xl">
                        <FallbackNotice contentLocale={p.locale} />
                        {p.cover && <ResponsiveImage media={p.cover} eager sizes="(min-width:1024px) 896px, 100vw" className="mb-10 aspect-[16/8] w-full rounded-3xl shadow-lift" />}
                        {p.description && <div className="prose-content text-lg" dangerouslySetInnerHTML={{ __html: p.description }} />}
                        {p.activities && (
                            <div className="mt-12">
                                <h2 className="mb-5 text-2xl font-semibold">{t.portfolio.activities}</h2>
                                <Activities value={p.activities} />
                            </div>
                        )}
                        {images.length > 0 && (
                            <div className="mt-14">
                                <h2 className="mb-5 text-2xl font-semibold">{t.portfolio.gallery}</h2>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {images.map((img, i) => (
                                        <button key={img.id} onClick={() => setLightbox(i)} className="group overflow-hidden rounded-xl focus-visible:outline-2" aria-label={img.caption ?? `${t.portfolio.gallery} ${i + 1}`}>
                                            <ResponsiveImage media={img.media} sizes="(min-width:640px) 33vw, 50vw" className="aspect-square w-full transition duration-500 group-hover:scale-105" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Section>
            <Lightbox items={images.map((i) => ({ media: i.media, caption: i.caption }))} index={lightbox} onClose={() => setLightbox(null)} onIndex={setLightbox} />
        </>
    );
}
