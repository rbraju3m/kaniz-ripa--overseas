import { ArrowLeft, ArrowRight, Briefcase, Calendar, Factory, Globe2, Mail, MessageCircle, Phone } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { usePortfolio, usePortfolios, useSite, useTeam } from '@/hooks/queries';
import { usePublishAlternates } from '@/lib/alternates';
import { isNotFound } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useDocumentMeta } from '@/lib/seo';
import type { Portfolio } from '@/lib/types';
import { formatDate, lines, toE164, whatsappLink } from '@/lib/utils';
import { Lightbox } from '@/components/ui/Lightbox';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { PortfolioCard } from '@/components/cards/PortfolioCard';
import { Reveal } from '@/components/ui/Reveal';
import { PageHeader, Section, SectionHeading } from '@/components/ui/Section';
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
/** A single paragraph that still holds line breaks is a plain one-per-line list saved through the editor. */
function asPlainLines(value: string): string | null {
    const m = value.trim().match(/^<p>([\s\S]*)<\/p>$/i);
    if (!m || !m[1].includes('\n') || /<[a-z]/i.test(m[1])) return null;
    return new DOMParser().parseFromString(m[1], 'text/html').body.textContent ?? null;
}

function Activities({ value }: { value: string }) {
    const plain = asPlainLines(value);
    if (plain) value = plain;
    else if (/<[a-z][\s\S]*>/i.test(value)) return <div className="prose-content" dangerouslySetInnerHTML={{ __html: value }} />;
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
                    <div className="grid gap-10 lg:grid-cols-3">
                    <div className="lg:col-span-2">
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
                    <ProjectAside project={p} />
                    </div>
                )}
            </Section>
            {p && <RelatedProjects current={p} />}
            <Lightbox items={images.map((i) => ({ media: i.media, caption: i.caption }))} index={lightbox} onClose={() => setLightbox(null)} onIndex={setLightbox} />
        </>
    );
}

/** Other published projects, preferring the same country. */
function RelatedProjects({ current }: { current: Portfolio }) {
    const { t, path } = useI18n();
    const { data: sameCountry } = usePortfolios({ country: current.country?.iso2, per_page: 4 });
    const { data: all } = usePortfolios({ per_page: 6 });
    const pool = [...(sameCountry?.data ?? []), ...(all?.data ?? [])].filter((x, i, arr) => x.id !== current.id && arr.findIndex((y) => y.id === x.id) === i);
    const items = pool.slice(0, 3);
    if (!items.length) return null;
    const sameOnly = items.every((x) => x.country?.iso2 === current.country?.iso2) && current.country;
    return (
        <Section tone="slate">
            <SectionHeading eyebrow={t.nav.portfolio} title={sameOnly ? `${t.portfolio.moreIn} ${current.country!.name}` : t.portfolio.more}
                action={<Link to={path('portfolio')} className="text-sm font-semibold text-navy-800 hover:text-brand-green-700">{t.common.viewAll} →</Link>} />
            <Reveal stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((x) => <PortfolioCard key={x.id} item={x} />)}
            </Reveal>
        </Section>
    );
}

/** Sticky side panel: key facts and quick ways to ask about this project. */
function ProjectAside({ project }: { project: Portfolio }) {
    const { t, path } = useI18n();
    const { site } = useSite();
    const { team } = useTeam();
    const phone = site?.settings.contact?.phone;
    const wa = team.find((m) => m.phone && m.whatsapp)?.phone;
    return (
        <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative overflow-hidden rounded-[1.5rem] bg-navy-900 p-6 text-white shadow-lift">
                <div aria-hidden className="absolute -right-12 -top-12 size-40 animate-float-slow rounded-full bg-gold-500/20 blur-2xl" />
                <p className="relative text-4xl" aria-hidden>{project.country?.flag ?? '🌐'}</p>
                <h2 className="relative mt-3 text-xl font-semibold text-white">{t.portfolio.askTitle}</h2>
                <p className="relative mt-2 text-sm text-navy-200">{t.portfolio.askLead}</p>
                <div className="relative mt-6 grid gap-2">
                    {phone && <a href={`tel:${toE164(phone)}`} className="btn-shine inline-flex items-center justify-center gap-2 rounded-xl bg-gold-500 px-4 py-3 text-sm font-semibold text-navy-950 transition hover:bg-gold-300"><Phone className="size-4" /> {t.common.callUs}</a>}
                    {wa && <a href={whatsappLink(wa)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-green-800"><MessageCircle className="size-4" /> {t.contactFab.whatsapp}</a>}
                    <Link to={path('contact')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/20"><Mail className="size-4" /> {t.home.ctaContact}</Link>
                </div>
            </div>
            {project.company?.slug && (
                <Link to={path(`partners/${project.company.slug}`)} className="spotlight group mt-4 flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lift">
                    <span className="grid size-11 place-items-center rounded-xl bg-navy-50 font-display text-lg font-bold text-navy-800">{project.company.name.charAt(0)}</span>
                    <span className="min-w-0 flex-1"><span className="block text-xs text-slate-500">{t.portfolio.company}</span><span className="block truncate font-semibold text-navy-900">{project.company.name}</span></span>
                    <ArrowRight className="size-4 text-navy-300 transition group-hover:translate-x-1" />
                </Link>
            )}
        </aside>
    );
}
