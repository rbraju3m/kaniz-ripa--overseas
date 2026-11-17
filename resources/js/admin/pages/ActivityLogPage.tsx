import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Badge, Modal, PageTitle, Pager, Select, Spinner, Table } from '../components/ui';
import { dateTime } from '../lib/format';
import { adminApi } from '../lib/http';

interface Log { id: number; log_name: string | null; description: string; event: string | null; subject_type: string | null; subject_id: number | null; causer: { id: number; name: string } | null; changes: unknown; properties: unknown; created_at: string }
type LaravelPage<T> = { data: T[]; current_page: number; last_page: number; total: number };

export default function ActivityLogPage() {
    const [page, setPage] = useState(1);
    const [logName, setLogName] = useState('');
    const [open, setOpen] = useState<Log | null>(null);
    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'activity', page, logName],
        queryFn: () => adminApi.get<LaravelPage<Log>>('/activity-logs', { page, log_name: logName }),
        placeholderData: keepPreviousData,
    });
    const meta = data && { current_page: data.current_page, last_page: data.last_page, total: data.total };

    return (
        <>
            <PageTitle title="Activity log" description="Every change made in the CMS, sign-ins and PDF actions." />
            <Select value={logName} onChange={(e) => { setLogName(e.target.value); setPage(1); }} className="mb-4 sm:w-48" aria-label="Log type">
                <option value="">All activity</option><option value="cms">Content changes</option><option value="auth">Sign-ins</option><option value="company_profile">Company profile</option>
            </Select>
            {isLoading ? <Spinner /> : (
                <>
                    <Table head={['When', 'Who', 'Action', 'Item']} empty={!data?.data.length}>
                        {data?.data.map((l) => (
                            <tr key={l.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setOpen(l)}>
                                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{dateTime(l.created_at)}</td>
                                <td className="px-4 py-3">{l.causer?.name ?? <span className="text-slate-400">System / visitor</span>}</td>
                                <td className="px-4 py-3"><Badge tone={l.event === 'deleted' || l.description === 'login_failed' ? 'red' : l.event === 'created' ? 'green' : 'gray'}>{l.event ?? l.description}</Badge></td>
                                <td className="px-4 py-3 text-slate-600">{l.subject_type ? `${l.subject_type} #${l.subject_id}` : l.log_name}</td>
                            </tr>
                        ))}
                    </Table>
                    <Pager meta={meta} onPage={setPage} />
                </>
            )}
            <Modal open={!!open} onClose={() => setOpen(null)} title="Activity details" wide>
                {open && <pre className="max-h-[60vh] overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">{JSON.stringify({ changes: open.changes, properties: open.properties }, null, 2)}</pre>}
            </Modal>
        </>
    );
}
