import { useServices } from '@/hooks/queries';
import { useI18n } from '@/lib/i18n';
import { useDocumentMeta } from '@/lib/seo';
import { ServiceCard } from '@/components/cards/ServiceCard';
import { PageHeader, Section } from '@/components/ui/Section';
import { CardGridSkeleton, EmptyState, ErrorState } from '@/components/ui/States';

export default function ServicesPage() {
    const { t } = useI18n();
    const { services, isLoading, isError, refetch } = useServices();
    useDocumentMeta(t.pages.servicesTitle);

    return (
        <>
            <PageHeader title={t.pages.servicesTitle} lead={t.home.servicesLead} />
            <Section>
                {isLoading ? <CardGridSkeleton /> : isError ? <ErrorState onRetry={() => refetch()} /> : services.length === 0 ? <EmptyState /> : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{services.map((s, i) => <ServiceCard key={s.id} service={s} index={i} />)}</div>
                )}
            </Section>
        </>
    );
}
