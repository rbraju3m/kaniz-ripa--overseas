import { MessageCircle, Phone } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import type { TeamMember } from '@/lib/types';
import { toE164, whatsappLink } from '@/lib/utils';
import { ResponsiveImage } from '../ui/ResponsiveImage';
import { Reveal } from '../ui/Reveal';

/** First letter (Bangla grapheme cluster aware), used when no photo is uploaded. */
export function initial(name?: string | null): string {
    const text = (name ?? '').trim();
    if (!text) return '';
    const first = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)[Symbol.iterator]().next().value;
    return (first?.segment ?? text[0]).toUpperCase();
}

export function TeamCard({ member }: { member: TeamMember }) {
    const { t } = useI18n();
    return (
        <article className="spotlight group flex h-full flex-col overflow-hidden rounded-card bg-white ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
            <div className="relative aspect-square overflow-hidden">
                {member.photo
                    ? <ResponsiveImage media={member.photo} sizes="(min-width:1024px) 25vw, 50vw" className="size-full object-cover transition duration-700 group-hover:scale-105" alt={member.name ?? ''} />
                    : (
                        <div className="grid size-full place-items-center bg-gradient-to-br from-navy-900 via-navy-800 to-royal-700" aria-hidden>
                            <span className="grid size-24 place-items-center rounded-full bg-white/10 text-4xl font-semibold text-white ring-4 ring-white/20 transition duration-500 group-hover:scale-110">{initial(member.name)}</span>
                        </div>
                    )}
            </div>
            <div className="flex flex-1 flex-col p-5">
                <h3 className="text-base font-semibold text-navy-900">{member.name}</h3>
                {member.role && <p className="mt-0.5 text-sm font-medium text-gold-700">{member.role}</p>}
                {member.bio && <p className="mt-3 text-sm text-slate-600">{member.bio}</p>}
                {member.phone && (
                    <div className="mt-auto flex gap-2 pt-4">
                        <a href={`tel:${toE164(member.phone)}`} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-navy-50 px-3 py-2 text-sm font-medium text-navy-800 transition hover:bg-navy-900 hover:text-white" aria-label={`${t.contactFab.call} ${member.name}`}>
                            <Phone className="size-4" aria-hidden /> {t.contactFab.call}
                        </a>
                        {member.whatsapp && (
                            <a href={whatsappLink(member.phone)} target="_blank" rel="noopener noreferrer" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-green-50 px-3 py-2 text-sm font-medium text-brand-green-800 transition hover:bg-brand-green-700 hover:text-white" aria-label={`${t.contactFab.whatsapp} ${member.name}`}>
                                <MessageCircle className="size-4" aria-hidden /> {t.contactFab.whatsapp}
                            </a>
                        )}
                    </div>
                )}
            </div>
        </article>
    );
}

export function TeamGrid({ team }: { team: TeamMember[] }) {
    return (
        <Reveal stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-sm:-mx-4 max-sm:flex max-sm:snap-x max-sm:snap-mandatory max-sm:gap-4 max-sm:overflow-x-auto max-sm:px-4 max-sm:pb-3 max-sm:[scrollbar-width:none] max-sm:[&>*]:w-[82%] max-sm:[&>*]:shrink-0 max-sm:[&>*]:snap-start">
            {team.map((m) => <TeamCard key={m.id} member={m} />)}
        </Reveal>
    );
}
