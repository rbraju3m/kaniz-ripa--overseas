import { PlayCircle, ZoomIn } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useGallery, useGalleryCategories } from '@/hooks/queries';
import { useI18n } from '@/lib/i18n';
import { useDocumentMeta } from '@/lib/seo';
import { FilterPills } from '@/components/ui/Chip';
import { Lightbox } from '@/components/ui/Lightbox';
import { Pagination } from '@/components/ui/Pagination';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { PageHeader, Section } from '@/components/ui/Section';
import { CardGridSkeleton, EmptyState, ErrorState } from '@/components/ui/States';

export default function GalleryPage() {
    const { t } = useI18n();
    const [params, setParams] = useSearchParams();
    const category = params.get('category') ?? '';
    const page = Number(params.get('page') ?? 1);
    const { categories } = useGalleryCategories();
    const { data, isLoading, isError, refetch } = useGallery({ category: category || undefined, page });
    const [index, setIndex] = useState<number | null>(null);
    useDocumentMeta(t.pages.galleryTitle, t.pages.galleryLead);

    const items = data?.data ?? [];
    const set = (next: Record<string, string | number | null>) => {
        const p = new URLSearchParams(params);
        Object.entries(next).forEach(([k, v]) => (v ? p.set(k, String(v)) : p.delete(k)));
        setParams(p);
    };

    return (
        <>
            <PageHeader title={t.pages.galleryTitle} lead={t.pages.galleryLead} />
            <Section>
                {categories.length > 0 && (
                    <FilterPills label={t.pages.galleryTitle} value={category} onChange={(v) => set({ category: v || null, page: null })}
                        options={[{ value: '', label: t.common.all }, ...categories.map((c) => ({ value: c.slug, label: c.name ?? c.slug }))]} />
                )}
                {isLoading ? <CardGridSkeleton count={6} /> : isError ? <ErrorState onRetry={() => refetch()} /> : items.length === 0 ? <EmptyState /> : (
                    <>
                        <ul className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>li]:mb-3">
                            {items.map((item, i) => (
                                <li key={item.id} className="break-inside-avoid">
                                    <button onClick={() => setIndex(i)} className="spotlight group relative block w-full overflow-hidden rounded-xl bg-navy-900 shadow-soft ring-1 ring-slate-200/60 transition duration-300 hover:-translate-y-1 hover:shadow-lift" aria-label={item.title ?? (item.type === 'video' ? t.gallery.videos : t.gallery.photos)}>
                                        {item.media ? (
                                            <ResponsiveImage media={item.media} sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw" className="w-full transition duration-700 group-hover:scale-110" />
                                        ) : (
                                            <div className="aspect-video w-full bg-gradient-to-br from-navy-800 to-navy-950" />
                                        )}
                                        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-navy-950/10 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                                        {item.type === 'video'
                                            ? <PlayCircle className="absolute inset-0 m-auto size-14 text-white drop-shadow-lg transition duration-300 group-hover:scale-110" aria-hidden />
                                            : <ZoomIn className="absolute inset-0 m-auto size-10 scale-75 rounded-full bg-white/90 p-2 text-navy-900 opacity-0 shadow-lg transition duration-300 group-hover:scale-100 group-hover:opacity-100" aria-hidden />}
                                        {item.title && <span className="absolute inset-x-0 bottom-0 translate-y-2 p-3 text-left text-sm font-medium text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">{item.title}</span>}
                                    </button>
                                </li>
                            ))}
                        </ul>
                        {data && <Pagination page={data.meta.current_page} lastPage={data.meta.last_page} onChange={(n) => set({ page: n })} />}
                    </>
                )}
            </Section>
            <Lightbox items={items.map((i) => ({ media: i.media, videoUrl: i.video_url, caption: i.title }))} index={index} onClose={() => setIndex(null)} onIndex={setIndex} />
        </>
    );
}
