import { Building2 } from 'lucide-react';
import { Link } from 'react-router';
import { useI18n } from '@/lib/i18n';
import type { Partner } from '@/lib/types';
import { ResponsiveImage } from '../ui/ResponsiveImage';

export function PartnerCard({ partner }: { partner: Partner }) {
    const { path } = useI18n();
    return (
        <article className="group relative flex h-full flex-col rounded-card bg-white p-6 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lift">
            <div className="mb-5 flex h-16 items-center">
                {partner.logo
                    ? <ResponsiveImage media={partner.logo} sizes="160px" className="h-full w-auto max-w-[160px] object-contain" alt={partner.name} />
                    : <span className="grid size-14 place-items-center rounded-xl bg-navy-50 text-navy-700"><Building2 className="size-6" aria-hidden /></span>}
            </div>
            <h3 className="text-base font-semibold"><Link to={path(`partners/${partner.slug}`)} className="after:absolute after:inset-0">{partner.name}</Link></h3>
            <p className="mt-1 text-sm text-slate-500">{[partner.industry?.name, partner.country && `${partner.country.flag} ${partner.country.name}`].filter(Boolean).join(' · ')}</p>
        </article>
    );
}
