import { Link } from 'react-router';
import { useSite } from '@/hooks/queries';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * Uses the official logo once uploaded in the CMS (Settings → Branding).
 * Until then a neutral globe mark + wordmark is shown — not a redraw of the real logo.
 */
export function Logo({ dark = false, className }: { dark?: boolean; className?: string }) {
    const { path } = useI18n();
    const { site } = useSite();
    const logoUrl = site?.logo_url;

    return (
        <Link to={path()} className={cn('group flex items-center gap-3', className)} aria-label="Kaniz Ripa Overseas — home">
            {logoUrl ? (
                <img src={logoUrl} alt="" className="size-11 rounded-full bg-white object-contain p-0.5" width={44} height={44} />
            ) : (
                <span aria-hidden className={cn('relative grid size-11 place-items-center rounded-full ring-[3px]', dark ? 'ring-white/80' : 'ring-royal-600')}>
                    <svg viewBox="0 0 24 24" className={cn('size-6', dark ? 'text-white' : 'text-navy-800')} fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
                    </svg>
                    <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-plane-500 ring-2 ring-white" />
                </span>
            )}
            <span className="flex flex-col leading-none">
                <span className={cn('font-display text-[15px] font-extrabold tracking-[0.14em]', dark ? 'text-white' : 'text-navy-900')}>KANIZ RIPA</span>
                <span className={cn('mt-1 font-display text-[11px] font-semibold tracking-[0.32em]', dark ? 'text-gold-300' : 'text-gold-600')}>OVERSEAS</span>
            </span>
        </Link>
    );
}
