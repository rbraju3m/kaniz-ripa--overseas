import { useSearchParams } from 'react-router';
import { useCountries, usePortfolios } from '@/hooks/queries';
import { useI18n } from '@/lib/i18n';
import { useDocumentMeta } from '@/lib/seo';
import { PortfolioCard } from '@/components/cards/PortfolioCard';
import { FilterPills } from '@/components/ui/Chip';
import { Pagination } from '@/components/ui/Pagination';
import { PageHeader, Section } from '@/components/ui/Section';
import { CardGridSkeleton, EmptyState, ErrorState } from '@/components/ui/States';

export default function PortfolioPage() {
    const { t } = useI18n();
    const [params, setParams] = useSearchParams();
    const country = params.get('country') ?? '';
    const page = Number(params.get('page') ?? 1);
    const { countries } = useCountries();
    const { data, isLoading, isError, refetch } = usePortfolios({ country: country || undefined, page });
    useDocumentMeta(t.pages.portfolioTitle, t.pages.portfolioLead);

    const update = (next: Record<string, string | number | null>) => {
        const p = new URLSearchParams(params);
        Object.entries(next).forEach(([k, v]) => (v ? p.set(k, String(v)) : p.delete(k)));
        setParams(p, { preventScrollReset: false });
    };

    return (
        <>
            <PageHeader title={t.pages.portfolioTitle} lead={t.pages.portfolioLead} />
            <Section>
                {countries.length > 1 && (
                    <FilterPills
                        label={t.portfolio.country}
                        value={country.toUpperCase()}
                        onChange={(v) => update({ country: v || null, page: null })}
                        options={[{ value: '', label: t.common.allCountries }, ...countries.map((c) => ({ value: c.iso2, label: `${c.flag} ${c.name}` }))]}
                    />
                )}
                {isLoading ? <CardGridSkeleton count={6} /> : isError ? <ErrorState onRetry={() => refetch()} /> : !data?.data.length ? <EmptyState /> : (
                    <>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{data.data.map((p) => <PortfolioCard key={p.id} item={p} />)}</div>
                        <Pagination page={data.meta.current_page} lastPage={data.meta.last_page} onChange={(n) => update({ page: n })} />
                    </>
                )}
            </Section>
        </>
    );
}
