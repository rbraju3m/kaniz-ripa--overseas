import { usePartners } from '@/hooks/queries';
import { useI18n } from '@/lib/i18n';
import { useDocumentMeta } from '@/lib/seo';
import { PartnerCard } from '@/components/cards/PartnerCard';
import { PageHeader, Section } from '@/components/ui/Section';
import { CardGridSkeleton, EmptyState, ErrorState } from '@/components/ui/States';

export default function PartnersPage() {
    const { t } = useI18n();
    const { partners, isLoading, isError, refetch } = usePartners();
    useDocumentMeta(t.pages.partnersTitle, t.pages.partnersLead);

    return (
        <>
            <PageHeader title={t.pages.partnersTitle} lead={t.pages.partnersLead} />
            <Section>
                {isLoading ? <CardGridSkeleton count={4} /> : isError ? <ErrorState onRetry={() => refetch()} /> : partners.length === 0 ? <EmptyState /> : (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{partners.map((p) => <PartnerCard key={p.id} partner={p} />)}</div>
                )}
            </Section>
        </>
    );
}
