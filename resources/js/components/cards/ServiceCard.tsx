import { ArrowRight, FileCheck, Globe, Handshake, MessageSquare, Users, Briefcase, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { useI18n } from '@/lib/i18n';
import type { Service } from '@/lib/types';

const ICONS: Record<string, LucideIcon> = { globe: Globe, handshake: Handshake, users: Users, 'file-check': FileCheck, 'message-square': MessageSquare };

export function ServiceIcon({ name, className }: { name: string | null; className?: string }) {
    const Icon = (name && ICONS[name]) || Briefcase;
    return <Icon className={className} aria-hidden />;
}

export function ServiceCard({ service, index }: { service: Service; index: number }) {
    const { path, t } = useI18n();
    return (
        <article className="group relative flex h-full flex-col rounded-card bg-white p-7 ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
            <div className="mb-6 flex items-start justify-between">
                <span className="grid size-13 place-items-center rounded-2xl bg-navy-900 text-white transition group-hover:bg-brand-green-700">
                    <ServiceIcon name={service.icon} className="size-6" />
                </span>
                <span className="font-display text-sm font-bold text-gold-500" aria-hidden>{String(index + 1).padStart(2, '0')}</span>
            </div>
            <h3 className="text-lg font-semibold">{service.title}</h3>
            {service.summary && <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{service.summary}</p>}
            <Link to={path(`services/${service.slug}`)} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-800 after:absolute after:inset-0 group-hover:text-brand-green-700">
                {t.common.learnMore} <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
            </Link>
        </article>
    );
}
