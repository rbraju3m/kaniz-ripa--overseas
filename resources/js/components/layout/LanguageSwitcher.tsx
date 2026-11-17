import { Languages } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useAlternateSlugs } from '@/lib/alternates';
import { switchLocalePath, useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({ dark = false, className }: { dark?: boolean; className?: string }) {
    const { locale, t } = useI18n();
    const { pathname, search } = useLocation();
    const slugs = useAlternateSlugs();
    const target = locale === 'bn' ? 'en' : 'bn';
    const to = switchLocalePath(pathname, target, slugs?.[target]) + search;

    return (
        <Link
            to={to}
            hrefLang={target}
            lang={target}
            aria-label={`${t.lang.label}: ${t.lang.switchTo}`}
            className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition',
                dark ? 'text-white ring-1 ring-white/30 hover:bg-white/10' : 'text-navy-800 ring-1 ring-navy-200 hover:bg-navy-50',
                className,
            )}
        >
            <Languages className="size-4" aria-hidden />
            {t.lang.switchTo}
        </Link>
    );
}
