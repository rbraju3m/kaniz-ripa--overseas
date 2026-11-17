import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, Mail, Phone, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { toE164 } from '@/lib/utils';
import { useToast } from '../components/toast';
import { Badge, Btn, ConfirmDialog, Input, Modal, PageTitle, Pager, Select, Spinner, Table } from '../components/ui';
import { useCan } from '../lib/auth';
import { dateTime } from '../lib/format';
import { adminApi, errorMessage } from '../lib/http';
import type { Paginated } from '../lib/types';

interface Message { id: number; name: string; email: string | null; phone: string | null; subject: string | null; message: string; locale: string; ip: string | null; status: 'new' | 'read' | 'archived'; read_at: string | null; created_at: string }
const tone = { new: 'blue', read: 'gray', archived: 'gray' } as const;

export default function ContactMessagesPage() {
    const can = useCan();
    const qc = useQueryClient();
    const toast = useToast();
    const [params, setParams] = useSearchParams();
    const [search, setSearch] = useState('');
    const [deleting, setDeleting] = useState<Message | null>(null);
    const status = params.get('status') ?? '';
    const page = Number(params.get('page') ?? 1);
    const openId = params.get('open');

    const list = useQuery({
        queryKey: ['admin', 'messages', { status, page, search }],
        queryFn: () => adminApi.get<Paginated<Message>>('/contact-messages', { status, page, search }),
        placeholderData: keepPreviousData,
    });
    const detail = useQuery({
        queryKey: ['admin', 'messages', 'one', openId],
        queryFn: () => adminApi.get<{ data: Message }>(`/contact-messages/${openId}`).then((r) => r.data),
        enabled: !!openId,
    });
    const set = (k: string, v: string | null) => { const p = new URLSearchParams(params); if (v) p.set(k, v); else p.delete(k); setParams(p, { replace: true }); };
    const close = () => { set('open', null); qc.invalidateQueries({ queryKey: ['admin', 'messages'] }); qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] }); };

    const archive = useMutation({
        mutationFn: (m: Message) => adminApi.put(`/contact-messages/${m.id}`, { status: m.status === 'archived' ? 'read' : 'archived' }),
        onSuccess: () => { toast('success', 'Message updated.'); close(); },
        onError: (e) => toast('error', errorMessage(e)),
    });
    const remove = useMutation({
        mutationFn: (m: Message) => adminApi.delete(`/contact-messages/${m.id}`),
        onSuccess: () => { toast('success', 'Message deleted.'); setDeleting(null); close(); },
        onError: (e) => { setDeleting(null); toast('error', errorMessage(e)); },
    });

    const m = detail.data;
    return (
        <>
            <PageTitle title="Contact messages" description="Enquiries sent through the website contact form." />
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <form className="relative sm:w-72" onSubmit={(e) => e.preventDefault()}>
                    <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email, phone, subject" className="pl-9" aria-label="Search messages" />
                </form>
                <Select value={status} onChange={(e) => set('status', e.target.value)} className="sm:w-40" aria-label="Status">
                    <option value="">All</option><option value="new">New</option><option value="read">Read</option><option value="archived">Archived</option>
                </Select>
            </div>
            {list.isLoading ? <div className="grid place-items-center py-24"><Spinner /></div> : (
                <>
                    <Table head={['From', 'Subject', 'Language', 'Received', 'Status']} empty={!list.data?.data.length}>
                        {list.data?.data.map((x) => (
                            <tr key={x.id} className={`cursor-pointer hover:bg-slate-50 ${x.status === 'new' ? 'font-semibold' : ''}`} onClick={() => set('open', String(x.id))}>
                                <td className="px-4 py-3"><p className="text-slate-900">{x.name}</p><p className="text-xs font-normal text-slate-500">{x.email ?? x.phone}</p></td>
                                <td className="max-w-xs truncate px-4 py-3">{x.subject ?? x.message.slice(0, 60)}</td>
                                <td className="px-4 py-3">{x.locale.toUpperCase()}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-xs font-normal text-slate-500">{dateTime(x.created_at)}</td>
                                <td className="px-4 py-3"><Badge tone={tone[x.status]}>{x.status}</Badge></td>
                            </tr>
                        ))}
                    </Table>
                    <Pager meta={list.data?.meta} onPage={(p) => set('page', String(p))} />
                </>
            )}
            <Modal open={!!openId} onClose={close} title={m?.subject ?? 'Message'} wide footer={m && (
                <>
                    {can('contact_messages.delete') && <Btn variant="secondary" className="mr-auto" onClick={() => setDeleting(m)}><Trash2 className="size-4 text-red-600" /> Delete</Btn>}
                    {can('contact_messages.update') && <Btn variant="secondary" onClick={() => archive.mutate(m)} loading={archive.isPending}><Archive className="size-4" /> {m.status === 'archived' ? 'Unarchive' : 'Archive'}</Btn>}
                    {m.email && <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + (m.subject ?? 'Your enquiry'))}`} className="inline-flex h-9 items-center gap-2 rounded-lg bg-navy-900 px-4 text-sm font-medium text-white"><Mail className="size-4" /> Reply by email</a>}
                </>
            )}>
                {!m ? <Spinner /> : (
                    <div className="space-y-4 text-sm">
                        <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[8rem_1fr]">
                            <dt className="text-slate-500">From</dt><dd className="font-medium">{m.name}</dd>
                            {m.email && <><dt className="text-slate-500">Email</dt><dd><a className="text-navy-700 underline" href={`mailto:${m.email}`}>{m.email}</a></dd></>}
                            {m.phone && <><dt className="text-slate-500">Phone</dt><dd><a className="inline-flex items-center gap-1 text-navy-700 underline" href={`tel:${toE164(m.phone)}`}><Phone className="size-3" />{m.phone}</a></dd></>}
                            <dt className="text-slate-500">Received</dt><dd>{dateTime(m.created_at)} · {m.locale.toUpperCase()} site</dd>
                        </dl>
                        <p className="whitespace-pre-line rounded-lg bg-slate-50 p-4 leading-relaxed text-slate-800" lang={m.locale}>{m.message}</p>
                    </div>
                )}
            </Modal>
            <ConfirmDialog open={!!deleting} title="Delete message?" loading={remove.isPending} onCancel={() => setDeleting(null)} onConfirm={() => deleting && remove.mutate(deleting)}
                message="This message will be deleted permanently. This cannot be undone. Consider archiving instead." />
        </>
    );
}
