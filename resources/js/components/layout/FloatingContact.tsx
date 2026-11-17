import { ArrowUp, MessageCircle, Phone, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSite, useTeam } from '@/hooks/queries';
import { useI18n } from '@/lib/i18n';
import { cn, toE164, whatsappLink } from '@/lib/utils';
import { initial } from '../team/TeamCard';

/** Bottom-right quick contact (team numbers) plus a back-to-top button after scrolling. */
export function FloatingContact() {
    const { t } = useI18n();
    const { team } = useTeam();
    const { site } = useSite();
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 600);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    const people = team.filter((m) => m.phone);
    const office = site?.settings.contact?.phone;
    if (!people.length && !office) return null;

    return (
        <div className="fixed bottom-6 right-6 z-40 hidden flex-col items-end gap-3 sm:flex">
            <div
                id="quick-contact"
                role="dialog"
                aria-label={t.contactFab.title}
                className={cn(
                    'w-[min(20rem,calc(100vw-2rem))] origin-bottom-right rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-200 transition duration-300',
                    open ? 'visible scale-100 opacity-100' : 'invisible translate-y-2 scale-95 opacity-0',
                )}
            >
                <p className="mb-3 font-semibold text-navy-900">{t.contactFab.title}</p>
                <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
                    {people.map((m) => (
                        <li key={m.id} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50">
                            {m.photo?.variants.sm
                                ? <img src={m.photo.variants.sm} alt="" className="size-10 rounded-full object-cover" />
                                : <span className="grid size-10 shrink-0 place-items-center rounded-full bg-navy-900 text-sm font-semibold text-white" aria-hidden>{initial(m.name)}</span>}
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold text-navy-900">{m.name}</span>
                                {m.role && <span className="block truncate text-xs text-slate-500">{m.role}</span>}
                            </span>
                            <a href={`tel:${toE164(m.phone!)}`} className="grid size-9 place-items-center rounded-full bg-navy-50 text-navy-800 transition hover:bg-navy-900 hover:text-white" aria-label={`${t.contactFab.call} ${m.name}`}><Phone className="size-4" /></a>
                            {m.whatsapp && <a href={whatsappLink(m.phone!)} target="_blank" rel="noopener noreferrer" className="grid size-9 place-items-center rounded-full bg-brand-green-50 text-brand-green-800 transition hover:bg-brand-green-700 hover:text-white" aria-label={`${t.contactFab.whatsapp} ${m.name}`}><MessageCircle className="size-4" /></a>}
                        </li>
                    ))}
                    {!people.length && office && (
                        <li><a href={`tel:${toE164(office)}`} className="flex items-center gap-3 rounded-xl p-2 font-semibold text-navy-900 hover:bg-slate-50"><Phone className="size-4" /> {office}</a></li>
                    )}
                </ul>
            </div>

            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    aria-label={t.contactFab.backToTop}
                    className={cn('grid size-11 place-items-center rounded-full bg-white text-navy-900 shadow-lg ring-1 ring-slate-200 transition duration-300 hover:-translate-y-0.5', scrolled ? 'opacity-100' : 'pointer-events-none translate-y-2 opacity-0')}
                >
                    <ArrowUp className="size-5" />
                </button>
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    aria-controls="quick-contact"
                    className="relative grid size-14 place-items-center rounded-full bg-brand-green-700 text-white shadow-xl transition duration-300 hover:scale-105 hover:bg-brand-green-800"
                >
                    {!open && <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-brand-green-600 opacity-30 [animation-duration:2.5s]" />}
                    {open ? <X className="size-6" /> : <Phone className="size-6" />}
                    <span className="sr-only">{open ? t.contactFab.close : t.contactFab.open}</span>
                </button>
            </div>
        </div>
    );
}
