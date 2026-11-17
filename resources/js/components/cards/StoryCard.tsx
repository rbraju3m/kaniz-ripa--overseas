import { PlayCircle, Quote } from 'lucide-react';
import { Link } from 'react-router';
import { useI18n } from '@/lib/i18n';
import type { SuccessStory } from '@/lib/types';
import { ResponsiveImage } from '../ui/ResponsiveImage';

export function StoryCard({ story }: { story: SuccessStory }) {
    const { path, t } = useI18n();
    return (
        <article className="group relative flex h-full flex-col rounded-card bg-white p-6 shadow-soft ring-1 ring-slate-200/70 transition hover:shadow-lift sm:p-8">
            <Quote className="size-8 text-gold-500" aria-hidden />
            {story.testimonial && <blockquote className="mt-4 flex-1 text-lg leading-relaxed text-navy-900">“{story.testimonial}”</blockquote>}
            <div className="mt-6 flex items-center gap-4 border-t border-slate-100 pt-5">
                <div className="size-14 shrink-0 overflow-hidden rounded-full bg-navy-100 ring-2 ring-gold-300">
                    {story.photo && <ResponsiveImage media={story.photo} sizes="56px" className="size-full" />}
                </div>
                <div className="min-w-0">
                    <p className="font-semibold text-navy-900">{story.display_name}</p>
                    <p className="truncate text-sm text-slate-500">{[story.employer, story.country && `${story.country.flag} ${story.country.name}`].filter(Boolean).join(' · ')}</p>
                </div>
            </div>
            <Link to={path(`success-stories/${story.slug}`)} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-green-700 after:absolute after:inset-0">
                {story.video_url && <PlayCircle className="size-4" aria-hidden />}
                {story.video_url ? t.stories.watchVideo : t.stories.readStory}
            </Link>
        </article>
    );
}
