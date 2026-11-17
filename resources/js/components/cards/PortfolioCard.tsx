import { ArrowUpRight, Briefcase, Calendar } from 'lucide-react';
import { Link } from 'react-router';
import { useI18n } from '@/lib/i18n';
import type { Portfolio } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Chip } from '../ui/Chip';
import { ResponsiveImage } from '../ui/ResponsiveImage';

export function PortfolioCard({ item }: { item: Portfolio }) {
    const { path, locale } = useI18n();
    return (
        <article className="group relative flex flex-col overflow-hidden rounded-card bg-white shadow-soft ring-1 ring-slate-200/70 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
            <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-navy-800 to-navy-950">
                {item.cover ? (
                    <ResponsiveImage media={item.cover} sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="size-full transition duration-500 group-hover:scale-105" />
                ) : (
                    <div className="flex size-full items-center justify-center">
                        <span className="text-6xl" aria-hidden>{item.country?.flag ?? '🌐'}</span>
                    </div>
                )}
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    {item.country && <Chip tone="white">{item.country.flag} {item.country.name}</Chip>}
                </div>
            </div>
            <div className="flex flex-1 flex-col p-6">
                {item.industry?.name && <p className="mb-2 text-xs font-semibold text-brand-green-700">{item.industry.name}</p>}
                <h3 className="text-lg font-semibold leading-snug">
                    <Link to={path(`portfolio/${item.slug}`)} className="after:absolute after:inset-0">{item.title}</Link>
                </h3>
                {item.summary && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.summary}</p>}
                <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs text-slate-500">
                    <span className="flex min-w-0 items-center gap-1.5">
                        {item.company && <><Briefcase className="size-3.5 shrink-0" aria-hidden /><span className="truncate">{item.company.name}</span></>}
                        {!item.company && item.project_date && <><Calendar className="size-3.5" aria-hidden />{formatDate(item.project_date, locale)}</>}
                    </span>
                    <ArrowUpRight className="size-5 shrink-0 text-navy-300 transition group-hover:text-brand-green-700" aria-hidden />
                </div>
            </div>
        </article>
    );
}
