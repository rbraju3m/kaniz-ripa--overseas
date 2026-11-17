import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Building2, Images, Inbox, Newspaper, Sparkles } from 'lucide-react';
import { Link } from 'react-router';
import { Badge, Card, PageTitle, Spinner } from '../components/ui';
import { useUser } from '../lib/auth';
import { dateTime } from '../lib/format';
import { adminApi } from '../lib/http';

interface Dashboard {
    stats: Record<string, number>;
    missing_information: { key: string; group: string; note: string | null }[];
    recent_messages: { id: number; name: string; subject: string | null; status: string; created_at: string }[];
    recent_activity: { id: number; description: string; event: string | null; subject_type: string | null; subject_id: number | null; causer: string | null; created_at: string }[];
}

export default function DashboardPage() {
    const user = useUser();
    const { data, isLoading } = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: () => adminApi.get<{ data: Dashboard }>('/dashboard').then((r) => r.data) });

    if (isLoading || !data) return <div className="grid place-items-center py-24"><Spinner /></div>;
    const s = data.stats;
    const cards = [
        { label: 'Portfolio projects', value: s.portfolios_total, sub: `${s.portfolios_published} published`, icon: Newspaper, to: '/admin/portfolios' },
        { label: 'Partner companies', value: s.partners_total, sub: `${s.partners_displayed} shown on website`, icon: Building2, to: '/admin/companies' },
        { label: 'Published success stories', value: s.success_stories_published, sub: 'with recorded consent', icon: Sparkles, to: '/admin/success-stories' },
        { label: 'Gallery images', value: s.gallery_images, sub: 'photos in gallery', icon: Images, to: '/admin/gallery-items' },
        { label: 'Contact messages', value: s.contact_messages_total, sub: `${s.contact_messages_new} new`, icon: Inbox, to: '/admin/contact-messages' },
    ];

    return (
        <>
            <PageTitle title={`Welcome, ${user.name.split(' ')[0]}`} description="All figures come directly from the database." />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {cards.map(({ label, value, sub, icon: Icon, to }) => (
                    <Link key={label} to={to} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:ring-navy-300">
                        <Icon className="mb-3 size-5 text-navy-600" />
                        <p className="text-3xl font-bold text-slate-900">{value}</p>
                        <p className="mt-1 text-sm font-medium text-slate-700">{label}</p>
                        <p className="text-xs text-slate-500">{sub}</p>
                    </Link>
                ))}
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-3">
                <Card title={<span className="flex items-center gap-2"><AlertCircle className="size-4 text-amber-600" /> Missing company information</span>} className="xl:col-span-1"
                    actions={<Link to="/admin/settings" className="text-xs font-medium text-navy-700 hover:underline">Open settings</Link>}>
                    {data.missing_information.length === 0 ? <p className="text-sm text-slate-500">All tracked settings have values.</p> : (
                        <ul className="space-y-2 text-sm">
                            {data.missing_information.map((m) => <li key={m.key} className="flex gap-2"><Badge tone="amber">{m.group}</Badge><span className="text-slate-700">{m.note ?? m.key}</span></li>)}
                        </ul>
                    )}
                </Card>
                <Card title="Recent messages" actions={<Link to="/admin/contact-messages" className="text-xs font-medium text-navy-700 hover:underline">All messages</Link>}>
                    {data.recent_messages.length === 0 ? <p className="text-sm text-slate-500">No messages yet.</p> : (
                        <ul className="divide-y divide-slate-100 text-sm">
                            {data.recent_messages.map((m) => (
                                <li key={m.id} className="flex items-center justify-between gap-3 py-2">
                                    <Link to={`/admin/contact-messages?open=${m.id}`} className="min-w-0"><p className="truncate font-medium text-slate-900">{m.name}</p><p className="truncate text-xs text-slate-500">{m.subject ?? '—'}</p></Link>
                                    {m.status === 'new' ? <Badge tone="blue">new</Badge> : <span className="text-xs text-slate-400">{dateTime(m.created_at)}</span>}
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
                <Card title="Recent activity" actions={<Link to="/admin/activity-logs" className="text-xs font-medium text-navy-700 hover:underline">Full log</Link>}>
                    <ul className="space-y-2 text-sm">
                        {data.recent_activity.map((a) => (
                            <li key={a.id} className="flex justify-between gap-3">
                                <span className="text-slate-700"><strong className="font-medium">{a.causer ?? 'System'}</strong> {a.event ?? a.description} {a.subject_type && <span className="text-slate-500">{a.subject_type} #{a.subject_id}</span>}</span>
                                <span className="shrink-0 text-xs text-slate-400">{dateTime(a.created_at)}</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </>
    );
}
