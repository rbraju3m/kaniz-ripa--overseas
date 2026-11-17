import { Clock, Mail, MapPin, Phone, Smartphone } from 'lucide-react';
import type { ReactNode } from 'react';
import { useSite } from '@/hooks/queries';
import { useI18n } from '@/lib/i18n';
import { cn, toE164, whatsappLink } from '@/lib/utils';
import { WhatsappIcon } from '../ui/SocialIcons';

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
    return (
        <li className="flex gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-green-100 text-brand-green-700">{icon}</span>
            <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-600">{label}</p>
                <div className="mt-0.5 font-medium text-navy-900">{children}</div>
            </div>
        </li>
    );
}

/** Contact details come only from verified CMS settings; missing values are simply not shown. */
export function ContactInfo({ className }: { className?: string }) {
    const { t, locale } = useI18n();
    const { site } = useSite();
    const c = site?.settings.contact;
    if (!c) return null;
    const people = c.show_contact_persons ? (c.mobiles ?? []) : [];

    return (
        <ul className={cn('space-y-6', className)}>
            {c.address && <Row icon={<MapPin className="size-5" />} label={t.contact.office}><address className="not-italic">{c.address}</address></Row>}
            {c.phone && <Row icon={<Phone className="size-5" />} label={t.contact.phone}><a href={`tel:${toE164(c.phone)}`} className="hover:text-brand-green-700">{c.phone}</a></Row>}
            {people.length > 0 && (
                <Row icon={<Smartphone className="size-5" />} label={t.contact.mobile}>
                    <ul className="space-y-1.5">
                        {people.map((p) => (
                            <li key={p.number} className="flex flex-wrap items-center gap-x-2">
                                <a href={`tel:${toE164(p.number)}`} className="hover:text-brand-green-700">{p.number}</a>
                                <span className="text-sm font-normal text-slate-500">{p.name[locale]} · {p.role[locale]}</span>
                                {p.whatsapp && <a href={whatsappLink(p.number)} target="_blank" rel="noopener noreferrer" aria-label={`${t.contact.whatsapp} ${p.number}`} className="text-brand-green-600"><WhatsappIcon className="size-4" /></a>}
                            </li>
                        ))}
                    </ul>
                </Row>
            )}
            {c.whatsapp_number && <Row icon={<WhatsappIcon className="size-5" />} label={t.contact.whatsapp}><a href={whatsappLink(c.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="hover:text-brand-green-700">{c.whatsapp_number}</a></Row>}
            {c.email && <Row icon={<Mail className="size-5" />} label={t.contact.email}><a href={`mailto:${c.email}`} className="break-all hover:text-brand-green-700">{c.email}</a></Row>}
            {c.office_hours && <Row icon={<Clock className="size-5" />} label={t.contact.hours}>{c.office_hours}</Row>}
        </ul>
    );
}

export function MapEmbed() {
    const { t } = useI18n();
    const { site } = useSite();
    const url = site?.settings.contact?.map_embed_url;
    if (!url || !url.startsWith('https://www.google.com/maps/embed')) return null;
    return (
        <div className="overflow-hidden rounded-card ring-1 ring-slate-200">
            <iframe src={url} title={t.contact.mapTitle} className="aspect-[4/3] w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
    );
}
