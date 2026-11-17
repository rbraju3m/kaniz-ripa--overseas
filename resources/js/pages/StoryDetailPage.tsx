import { ArrowLeft, Quote } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useStory } from '@/hooks/queries';
import { usePublishAlternates } from '@/lib/alternates';
import { isNotFound } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useDocumentMeta } from '@/lib/seo';
import { videoEmbedUrl } from '@/lib/utils';
import { Lightbox } from '@/components/ui/Lightbox';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { PageHeader, Section } from '@/components/ui/Section';
import { ErrorState, FallbackNotice, Skeleton } from '@/components/ui/States';
import NotFoundPage from './NotFoundPage';

export default function StoryDetailPage() {
    const { slug } = useParams();
    const { t, path } = useI18n();
    const { story: s, isLoading, error, refetch } = useStory(slug);
    const [lightbox, setLightbox] = useState<number | null>(null);
    usePublishAlternates(s?.slugs);
    useDocumentMeta(s?.title, s?.testimonial);

    if (isNotFound(error)) return <NotFoundPage />;
    const embed = videoEmbedUrl(s?.video_url);
    const images = s?.images ?? [];

    return (
        <>
            <PageHeader title={s?.title ?? (isLoading ? '…' : '')}>
                <Link to={path('success-stories')} className="mb-6 inline-flex items-center gap-2 text-sm text-navy-200 hover:text-white"><ArrowLeft className="size-4" /> {t.pages.storiesTitle}</Link>
            </PageHeader>
            <Section>
                {isLoading && <Skeleton className="h-40 w-full" />}
                {error && !isNotFound(error) && <ErrorState onRetry={() => refetch()} />}
                {s && (
                    <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-3">
                        <aside className="text-center lg:text-left">
                            <div className="mx-auto size-40 overflow-hidden rounded-full bg-navy-100 ring-4 ring-gold-300 lg:mx-0">
                                {s.photo && <ResponsiveImage media={s.photo} eager sizes="160px" className="size-full" />}
                            </div>
                            <p className="mt-5 text-xl font-semibold text-navy-900">{s.display_name}</p>
                            {s.employer && <p className="text-sm text-slate-600">{t.stories.employer}: {s.employer}</p>}
                            {s.country && <p className="text-sm text-slate-600">{s.country.flag} {s.country.name}</p>}
                        </aside>
                        <div className="lg:col-span-2">
                            <FallbackNotice contentLocale={s.locale} />
                            {s.testimonial && (
                                <blockquote className="relative mb-10 rounded-card bg-brand-green-50 p-8 text-xl leading-relaxed text-navy-900">
                                    <Quote className="absolute -top-4 left-6 size-8 rounded-full bg-gold-500 p-1.5 text-white" aria-hidden />
                                    “{s.testimonial}”
                                </blockquote>
                            )}
                            {embed && <iframe src={embed} title={s.title ?? 'Video'} className="mb-10 aspect-video w-full rounded-2xl" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" />}
                            {s.story && <div className="prose-content text-lg" dangerouslySetInnerHTML={{ __html: s.story }} />}
                            {images.length > 0 && (
                                <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {images.map((img, i) => (
                                        <button key={img.id} onClick={() => setLightbox(i)} className="overflow-hidden rounded-xl" aria-label={img.caption ?? `${i + 1}`}>
                                            <ResponsiveImage media={img.media} sizes="33vw" className="aspect-square w-full transition hover:scale-105" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Section>
            <Lightbox items={images.map((i) => ({ media: i.media, caption: i.caption }))} index={lightbox} onClose={() => setLightbox(null)} onIndex={setLightbox} />
        </>
    );
}
