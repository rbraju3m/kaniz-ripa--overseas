import { Mail, MessageCircle, Phone } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useSite, useTeam } from '@/hooks/queries';
import { useI18n } from '@/lib/i18n';
import { cn, toE164, whatsappLink } from '@/lib/utils';

/**
 * Phones only: Call / WhatsApp / Contact always within thumb reach.
 * Slides away while scrolling down and comes back when scrolling up.
 */
export function MobileActionBar() {
    const { t, path } = useI18n();
    const { site } = useSite();
    const { team } = useTeam();
    const phone = site?.settings.contact?.phone ?? team.find((m) => m.phone)?.phone ?? null;
    const wa = team.find((m) => m.phone && m.whatsapp)?.phone ?? null;
    const [hidden, setHidden] = useState(false);
    const last = useRef(0);

    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY;
            setHidden(y > last.current + 8 && y > 300);
            if (y < last.current - 8 || y <= 300) setHidden(false);
            last.current = y;
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const item = 'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold transition active:scale-95';
    return (
        <nav aria-label={t.contactFab.title}
            className={cn('fixed inset-x-3 bottom-3 z-40 flex overflow-hidden rounded-2xl bg-navy-950/95 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur transition-transform duration-300 sm:hidden', hidden && 'translate-y-[150%]')}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {phone && <a href={`tel:${toE164(phone)}`} className={item}><Phone className="size-5" /> {t.contactFab.call}</a>}
            {wa && <a href={whatsappLink(wa)} target="_blank" rel="noopener noreferrer" className={cn(item, 'bg-brand-green-700')}><MessageCircle className="size-5" /> {t.contactFab.whatsapp}</a>}
            <Link to={path('contact')} className={cn(item, 'text-gold-300')}><Mail className="size-5" /> {t.home.ctaContact}</Link>
        </nav>
    );
}
