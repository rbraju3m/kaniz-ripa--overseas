import { useQueries } from '@tanstack/react-query';
import { Eye, Gem, Target } from 'lucide-react';
import { getJson } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useDocumentMeta } from '@/lib/seo';
import type { Page } from '@/lib/types';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { PageHeader, Section, SectionHeading } from '@/components/ui/Section';
import { EmptyState, FallbackNotice, Skeleton } from '@/components/ui/States';
import { TeamGrid } from '@/components/team/TeamCard';
import { useTeam } from '@/hooks/queries';

const KEYS = ['about', 'history', 'mission', 'vision', 'values', 'management', 'credentials'] as const;

/** Each About section is its own CMS page; unpublished ones simply don't render. */
export default function AboutPage() {
    const { t, locale } = useI18n();
    const results = useQueries({
        queries: KEYS.map((key) => ({
            queryKey: ['page', key, locale, {}],
            queryFn: () => getJson<{ data: Page }>(`/pages/${key}`, { locale }).then((r) => r.data).catch(() => null),
        })),
    });
    const pages = Object.fromEntries(KEYS.map((k, i) => [k, results[i].data ?? null])) as Record<(typeof KEYS)[number], Page | null>;
    const { team } = useTeam();
    const loading = results.some((r) => r.isLoading);
    const about = pages.about;
    useDocumentMeta(t.pages.aboutTitle, about?.summary);

    const nothing = !loading && KEYS.every((k) => !pages[k]) && !team.length;

    return (
        <>
            <PageHeader title={about?.title ?? t.pages.aboutTitle} lead={about?.summary} />
            {loading && <Section><div className="space-y-4"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></div></Section>}
            {nothing && <Section><EmptyState /></Section>}

            {about && (
                <Section>
                    <FallbackNotice contentLocale={about.locale} />
                    <div className="grid gap-12 lg:grid-cols-2">
                        <div className="prose-content text-lg" dangerouslySetInnerHTML={{ __html: about.body ?? '' }} />
                        {about.cover && <ResponsiveImage media={about.cover} sizes="(min-width:1024px) 50vw, 100vw" className="aspect-[4/3] w-full rounded-3xl shadow-lift" />}
                    </div>
                </Section>
            )}

            {pages.history && (
                <Section tone="slate">
                    <SectionHeading eyebrow={t.pages.aboutTitle} title={pages.history.title ?? ''} lead={pages.history.summary} />
                    <div className="prose-content max-w-3xl" dangerouslySetInnerHTML={{ __html: pages.history.body ?? '' }} />
                </Section>
            )}

            {(pages.mission || pages.vision || pages.values) && (
                <Section>
                    <div className="grid gap-6 lg:grid-cols-3">
                        {[
                            { p: pages.mission, Icon: Target, cls: 'bg-navy-900 text-white [&_h3]:text-white [&_.prose-content]:text-navy-100' },
                            { p: pages.vision, Icon: Eye, cls: 'bg-brand-green-50 ring-1 ring-brand-green-100' },
                            { p: pages.values, Icon: Gem, cls: 'bg-gold-100/60 ring-1 ring-gold-100' },
                        ].filter((x) => x.p).map(({ p, Icon, cls }) => (
                            <article key={p!.key} className={`rounded-card p-8 ${cls}`}>
                                <Icon className="mb-5 size-8 text-gold-500" aria-hidden />
                                <h3 className="text-xl font-semibold">{p!.title}</h3>
                                <div className="prose-content mt-3 text-sm" dangerouslySetInnerHTML={{ __html: p!.body ?? '' }} />
                                {p!.sections && p!.sections.length > 0 && (
                                    <ul className="mt-4 space-y-2 text-sm">{p!.sections.map((s) => <li key={s.key}><strong>{s.title}</strong>{s.body && <span dangerouslySetInnerHTML={{ __html: ` — ${s.body}` }} />}</li>)}</ul>
                                )}
                            </article>
                        ))}
                    </div>
                </Section>
            )}

            {team.length > 0 && (
                <Section tone="slate">
                    <SectionHeading eyebrow={t.pages.aboutTitle} title={pages.management?.title ?? t.home.teamTitle} lead={pages.management?.summary ?? t.home.teamLead} />
                    <TeamGrid team={team} />
                </Section>
            )}

            {pages.credentials && (
                <Section>
                    <SectionHeading eyebrow={t.pages.aboutTitle} title={pages.credentials.title ?? ''} lead={pages.credentials.summary} />
                    <div className="prose-content max-w-3xl" dangerouslySetInnerHTML={{ __html: pages.credentials.body ?? '' }} />
                </Section>
            )}
        </>
    );
}

