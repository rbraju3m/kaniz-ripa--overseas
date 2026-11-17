import { useSearchParams } from 'react-router';
import { useCountries, useStories } from '@/hooks/queries';
import { useI18n } from '@/lib/i18n';
import { useDocumentMeta } from '@/lib/seo';
import { StoryCard } from '@/components/cards/StoryCard';
import { FilterPills } from '@/components/ui/Chip';
import { Pagination } from '@/components/ui/Pagination';
import { PageHeader, Section } from '@/components/ui/Section';
import { CardGridSkeleton, EmptyState, ErrorState } from '@/components/ui/States';

export default function StoriesPage() {
    const { t } = useI18n();
    const [params, setParams] = useSearchParams();
    const country = params.get('country') ?? '';
    const page = Number(params.get('page') ?? 1);
    const { countries } = useCountries();
    const { data, isLoading, isError, refetch } = useStories({ country: country || undefined, page });
    useDocumentMeta(t.pages.storiesTitle, t.pages.storiesLead);

    const update = (next: Record<string, string | number | null>) => {
        const p = new URLSearchParams(params);
        Object.entries(next).forEach(([k, v]) => (v ? p.set(k, String(v)) : p.delete(k)));
        setParams(p);
    };

    return (
        <>
            <PageHeader title={t.pages.storiesTitle} lead={t.pages.storiesLead} />
            <Section tone="slate">
                {countries.length > 1 && (data?.data.length || country) ? (
                    <FilterPills label={t.portfolio.country} value={country.toUpperCase()} onChange={(v) => update({ country: v || null, page: null })}
                        options={[{ value: '', label: t.common.allCountries }, ...countries.map((c) => ({ value: c.iso2, label: `${c.flag} ${c.name}` }))]} />
                ) : null}
                {isLoading ? <CardGridSkeleton /> : isError ? <ErrorState onRetry={() => refetch()} /> : !data?.data.length ? <EmptyState /> : (
                    <>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{data.data.map((s) => <StoryCard key={s.id} story={s} />)}</div>
                        <Pagination page={data.meta.current_page} lastPage={data.meta.last_page} onChange={(n) => update({ page: n })} />
                    </>
                )}
            </Section>
        </>
    );
}
