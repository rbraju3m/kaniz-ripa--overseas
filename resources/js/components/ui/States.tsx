import { AlertTriangle, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { ButtonLink } from './Button';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export function Skeleton({ className }: { className?: string }) {
    return <div aria-hidden className={cn('animate-pulse rounded-xl bg-slate-200/70', className)} />;
}

export function CardGridSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-live="polite">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="overflow-hidden rounded-card ring-1 ring-slate-200">
                    <Skeleton className="aspect-[16/10] rounded-none" />
                    <div className="space-y-3 p-5"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-5 w-4/5" /><Skeleton className="h-4 w-2/3" /></div>
                </div>
            ))}
        </div>
    );
}

export function EmptyState({ title, text }: { title?: string; text?: string }) {
    const { t, path } = useI18n();
    return (
        <div className="relative mx-auto flex max-w-lg flex-col items-center overflow-hidden rounded-[1.5rem] bg-gradient-to-b from-brand-green-50 to-white px-6 py-14 text-center ring-1 ring-brand-green-100">
            <div aria-hidden className="absolute -top-16 size-48 rounded-full bg-gold-300/20 blur-3xl" />
            <span className="relative mb-5 grid size-14 place-items-center rounded-2xl bg-white text-brand-green-700 shadow-soft ring-1 ring-brand-green-100"><Sparkles className="size-6 animate-pulse" /></span>
            <h2 className="relative text-xl font-semibold">{title ?? t.common.comingSoon}</h2>
            <p className="relative mt-2 max-w-sm text-sm text-slate-600">{text ?? t.common.comingSoonText}</p>
            <ButtonLink to={path('contact')} variant="secondary" size="sm" className="relative mt-6">{t.home.ctaContact}</ButtonLink>
        </div>
    );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
    const { t } = useI18n();
    return (
        <div role="alert" className="mx-auto flex max-w-md flex-col items-center rounded-card bg-red-50 px-6 py-10 text-center ring-1 ring-red-100">
            <AlertTriangle className="mb-3 size-6 text-red-600" />
            <p className="text-sm text-red-800">{t.common.error}</p>
            {onRetry && <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>{t.common.retry}</Button>}
        </div>
    );
}

/** Shown when a reviewed translation in the visitor's language is missing. */
export function FallbackNotice({ contentLocale }: { contentLocale?: string | null }) {
    const { locale, t } = useI18n();
    if (!contentLocale || contentLocale === locale) return null;
    return <p className="mb-6 rounded-lg bg-gold-100 px-4 py-3 text-sm text-gold-700">{t.common.notTranslated}</p>;
}
