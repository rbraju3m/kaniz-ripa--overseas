import { useQuery } from '@tanstack/react-query';
import {
    AlertCircle, ArrowUpRight, Building2, CheckCircle2, FileText, Flag, Globe, ImagePlus, Images, Inbox, KeyRound, Newspaper, Pencil,
    Plus, Sparkles, Trash2, UserRound, Wrench, XCircle, type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';
import { Badge, Card, Spinner } from '../components/ui';
import { useCan, useUser } from '../lib/auth';
import { dateTime } from '../lib/format';
import { adminApi } from '../lib/http';

interface Dashboard {
    stats: Record<string, number>;
    website: { profile_available: boolean; profile_source: 'uploaded' | 'generated' | null };
    missing_information: { key: string; group: string; note: string | null }[];
    recent_messages: { id: number; name: string; subject: string | null; status: string; created_at: string }[];
    recent_activity: { id: number; description: string; event: string | null; subject_type: string | null; subject_label: string | null; subject_id: number | null; causer: string | null; created_at: string }[];
}

const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

/** "created" → "created a", "login" → "signed in" … */
const ACTION: Record<string, { verb: string; icon: LucideIcon; tone: string }> = {
    created: { verb: 'created', icon: Plus, tone: 'bg-brand-green-100 text-brand-green-700' },
    updated: { verb: 'updated', icon: Pencil, tone: 'bg-navy-100 text-navy-700' },
    deleted: { verb: 'deleted', icon: Trash2, tone: 'bg-red-100 text-red-700' },
    uploaded: { verb: 'uploaded', icon: ImagePlus, tone: 'bg-gold-100 text-gold-700' },
    generated: { verb: 'generated', icon: Sparkles, tone: 'bg-gold-100 text-gold-700' },
    login: { verb: 'signed in', icon: KeyRound, tone: 'bg-slate-100 text-slate-600' },
    login_failed: { verb: 'failed to sign in', icon: XCircle, tone: 'bg-red-100 text-red-700' },
};

export default function DashboardPage() {
    const user = useUser();
    const can = useCan();
    const { data, isLoading } = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: () => adminApi.get<{ data: Dashboard }>('/dashboard').then((r) => r.data) });

    if (isLoading || !data) return <div className="grid place-items-center py-24"><Spinner /></div>;
    const s = data.stats;

    const cards = [
        { label: 'Portfolio projects', value: s.portfolios_total, sub: `${s.portfolios_published} published`, icon: Newspaper, to: '/admin/portfolios', tone: 'from-navy-800 to-navy-950' },
        { label: 'Partner companies', value: s.partners_total, sub: `${s.partners_displayed} shown on website`, icon: Building2, to: '/admin/companies', tone: 'from-royal-600 to-royal-700' },
        { label: 'Team members', value: s.team_published, sub: 'published', icon: UserRound, to: '/admin/team-members', tone: 'from-brand-green-600 to-brand-green-800' },
        { label: 'Success stories', value: s.success_stories_published, sub: 'with recorded consent', icon: Sparkles, to: '/admin/success-stories', tone: 'from-gold-500 to-gold-700' },
        { label: 'Contact messages', value: s.contact_messages_total, sub: `${s.contact_messages_new} new`, icon: Inbox, to: '/admin/contact-messages', tone: 'from-slate-600 to-slate-800', highlight: s.contact_messages_new > 0 },
    ];

    const actions = [
        { label: 'New portfolio item', to: '/admin/portfolios/new', icon: Newspaper, perm: 'portfolios.create' },
        { label: 'Add team member', to: '/admin/team-members/new', icon: UserRound, perm: 'team.create' },
        { label: 'Upload images', to: '/admin/media', icon: ImagePlus, perm: 'media.create' },
        { label: 'Company profile PDF', to: '/admin/company-profile', icon: FileText, perm: 'company_profile.view' },
    ].filter((a) => can(a.perm));

    const status = [
        { label: 'Company profile download', ok: data.website.profile_available, value: data.website.profile_available ? (data.website.profile_source === 'uploaded' ? 'Uploaded PDF' : 'Auto-generated') : 'Not available', to: '/admin/company-profile', icon: FileText },
        { label: 'Countries on website', ok: s.countries_shown > 0, value: String(s.countries_shown), to: '/admin/countries', icon: Flag },
        { label: 'Published services', ok: s.services_published > 0, value: String(s.services_published), to: '/admin/services', icon: Wrench },
        { label: 'Gallery images', ok: s.gallery_images > 0, value: String(s.gallery_images), to: '/admin/gallery-items', icon: Images },
    ];

    return (
        <>
            {/* Welcome banner */}
            <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-navy-800 to-royal-700 p-6 text-white shadow-lg sm:p-8">
                <div aria-hidden className="absolute -right-16 -top-16 size-64 rounded-full border-[32px] border-white/5" />
                <div aria-hidden className="absolute -bottom-24 left-1/3 size-64 rounded-full bg-brand-green-600/20 blur-3xl" />
                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-sm text-navy-200">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">{greeting()}, {user.name}</h1>
                        <p className="mt-1 text-sm text-navy-200">Here is what is live on the website right now. All figures come straight from the database.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {actions.map(({ label, to, icon: Icon }) => (
                            <Link key={to} to={to} className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white ring-1 ring-white/15 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20">
                                <Icon className="size-4" /> {label}
                            </Link>
                        ))}
                        <a href="/" target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-3 py-2 text-sm font-semibold text-navy-950 transition hover:-translate-y-0.5 hover:bg-gold-300">
                            <Globe className="size-4" /> View website
                        </a>
                    </div>
                </div>
            </div>

            {/* Key figures */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {cards.map(({ label, value, sub, icon: Icon, to, tone, highlight }) => (
                    <Link key={label} to={to} className="group relative rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-navy-300">
                        <div className="mb-4 flex items-start justify-between">
                            <span className={cn('grid size-10 place-items-center rounded-lg bg-gradient-to-br text-white shadow-sm', tone)}><Icon className="size-5" /></span>
                            <ArrowUpRight className="size-4 text-slate-300 transition group-hover:text-navy-600" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{value}</p>
                        <p className="mt-1 text-sm font-medium text-slate-700">{label}</p>
                        <p className={cn('text-xs', highlight ? 'font-semibold text-brand-green-700' : 'text-slate-500')}>{sub}</p>
                    </Link>
                ))}
            </div>

            {/* Website status */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {status.map(({ label, ok, value, to, icon: Icon }) => (
                    <Link key={label} to={to} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200 transition hover:ring-navy-300">
                        <Icon className="size-4 shrink-0 text-slate-400" />
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs text-slate-500">{label}</span>
                            <span className="block truncate text-sm font-semibold text-slate-900">{value}</span>
                        </span>
                        {ok ? <CheckCircle2 className="size-5 shrink-0 text-brand-green-600" aria-label="OK" /> : <AlertCircle className="size-5 shrink-0 text-amber-500" aria-label="Needs attention" />}
                    </Link>
                ))}
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-3">
                <Card title={<span className="flex items-center gap-2"><AlertCircle className="size-4 text-amber-600" /> Missing company information</span>}
                    actions={<Link to="/admin/settings" className="text-xs font-medium text-navy-700 hover:underline">Open settings</Link>}>
                    {data.missing_information.length === 0 ? (
                        <p className="flex items-center gap-2 text-sm text-brand-green-700"><CheckCircle2 className="size-4" /> All tracked settings have values.</p>
                    ) : (
                        <ul className="space-y-2.5 text-sm">
                            {data.missing_information.map((m) => (
                                <li key={m.key} className="flex items-start gap-2.5 rounded-lg bg-amber-50/60 px-3 py-2 ring-1 ring-amber-100">
                                    <Badge tone="amber">{m.group}</Badge><span className="text-slate-700">{m.note ?? m.key}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                <Card title="Recent messages" actions={<Link to="/admin/contact-messages" className="text-xs font-medium text-navy-700 hover:underline">All messages</Link>}>
                    {data.recent_messages.length === 0 ? (
                        <div className="flex flex-col items-center py-8 text-center text-sm text-slate-500"><Inbox className="mb-2 size-8 text-slate-300" /> No messages yet. Messages from the contact form appear here.</div>
                    ) : (
                        <ul className="divide-y divide-slate-100 text-sm">
                            {data.recent_messages.map((m) => (
                                <li key={m.id}>
                                    <Link to={`/admin/contact-messages?open=${m.id}`} className="flex items-center gap-3 py-2.5 hover:bg-slate-50">
                                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-navy-100 text-sm font-semibold text-navy-800">{m.name.charAt(0).toUpperCase()}</span>
                                        <span className="min-w-0 flex-1"><span className="block truncate font-medium text-slate-900">{m.name}</span><span className="block truncate text-xs text-slate-500">{m.subject ?? 'No subject'}</span></span>
                                        {m.status === 'new' ? <Badge tone="blue">new</Badge> : <span className="shrink-0 text-xs text-slate-400">{dateTime(m.created_at)}</span>}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                <Card title="Recent activity" actions={<Link to="/admin/activity-logs" className="text-xs font-medium text-navy-700 hover:underline">Full log</Link>}>
                    <ol className="relative space-y-3 text-sm before:absolute before:bottom-2 before:left-[13px] before:top-2 before:w-px before:bg-slate-200">
                        {data.recent_activity.map((a) => {
                            const key = a.event ?? a.description;
                            const action = ACTION[key] ?? { verb: key, icon: Pencil, tone: 'bg-slate-100 text-slate-600' };
                            const subject = key.startsWith('login') ? null : a.subject_label;
                            const Icon = action.icon;
                            return (
                                <li key={a.id} className="relative flex gap-3">
                                    <span className={cn('relative z-10 grid size-7 shrink-0 place-items-center rounded-full ring-4 ring-white', action.tone)}><Icon className="size-3.5" /></span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-slate-700"><strong className="font-medium text-slate-900">{a.causer ?? 'System'}</strong> {action.verb}{subject && <> {['a', 'e', 'i', 'o', 'u'].includes(subject[0]) ? 'an' : 'a'} {subject}</>}</span>
                                        <span className="block text-xs text-slate-400">{dateTime(a.created_at)}</span>
                                    </span>
                                </li>
                            );
                        })}
                    </ol>
                </Card>
            </div>
        </>
    );
}
