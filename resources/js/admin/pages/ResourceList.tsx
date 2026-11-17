import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { refOptions, useReference } from '../components/FieldInput';
import { useToast } from '../components/toast';
import { Input, PageTitle, Pager, Select, Spinner, StatusBadge, Table } from '../components/ui';
import { useCan } from '../lib/auth';
import { adminApi, errorMessage } from '../lib/http';
import type { AdminRecord, Paginated } from '../lib/types';
import type { ColumnDef, ResourceConfig } from '../resources/types';

/** Published / Unpublished switch in the list row (needs the publish permission). */
function StatusSwitch({ cfg, record }: { cfg: ResourceConfig; record: AdminRecord }) {
    const can = useCan();
    const qc = useQueryClient();
    const toast = useToast();
    const published = record.status === 'published';
    const toggle = useMutation({
        mutationFn: (status: 'published' | 'draft') => adminApi.patch(`${cfg.endpoint}/${record.id}/status`, { status }),
        onSuccess: (_, status) => {
            qc.invalidateQueries({ queryKey: ['admin', cfg.key] });
            const reviewed = Object.values((record.translations ?? {}) as Record<string, { is_reviewed?: boolean }>).some((t) => t?.is_reviewed);
            if (status === 'published' && cfg.translatable && !reviewed) toast('error', 'Published, but no language is marked reviewed yet, so it is not visible on the website.');
            else toast('success', status === 'published' ? 'Published: now visible on the website.' : 'Unpublished: hidden from the website.');
        },
        onError: (e) => toast('error', errorMessage(e)),
    });

    if (!can(`${cfg.permission}.publish`)) return <StatusBadge status={record.status} />;

    const busy = toggle.isPending;
    return (
        <button
            type="button"
            role="switch"
            aria-checked={published}
            aria-label={published ? 'Published. Click to unpublish' : 'Unpublished. Click to publish'}
            disabled={busy}
            onClick={(e) => { e.stopPropagation(); toggle.mutate(published ? 'draft' : 'published'); }}
            className="group inline-flex items-center gap-2 rounded-full py-1 pr-1 text-xs font-medium disabled:opacity-60"
        >
            <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${published ? 'bg-brand-green-600' : 'bg-slate-300'}`}>
                <span className={`inline-block size-4 rounded-full bg-white shadow transition ${published ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </span>
            <span className={published ? 'text-brand-green-700' : 'text-slate-500'}>{busy ? '…' : published ? 'Published' : 'Unpublished'}</span>
        </button>
    );
}

export default function ResourceList({ cfg }: { cfg: ResourceConfig }) {
    const can = useCan();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const [search, setSearch] = useState(params.get('search') ?? '');
    const { data: ref } = useReference();
    const query = Object.fromEntries(params.entries());

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['admin', cfg.key, 'list', query],
        queryFn: () => adminApi.get<Paginated<AdminRecord>>(cfg.endpoint, { per_page: 20, ...query }),
        placeholderData: keepPreviousData,
    });

    // Publishable lists get an interactive status column instead of the static badge.
    const columns: ColumnDef[] = cfg.publishable
        ? [...cfg.columns.filter((c) => c.label !== 'Status'), { label: 'Status', render: (r) => <StatusSwitch cfg={cfg} record={r} /> }]
        : cfg.columns;

    const set = (k: string, v: string | number | null) => {
        const p = new URLSearchParams(params);
        if (v === null || v === '') p.delete(k); else p.set(k, String(v));
        if (k !== 'page') p.delete('page');
        setParams(p, { replace: true });
    };

    return (
        <>
            <PageTitle title={cfg.plural} description={cfg.description}
                actions={can(`${cfg.permission}.create`) && (
                    <Link to={`/admin/${cfg.key}/new`} className="inline-flex h-9 items-center gap-2 rounded-lg bg-navy-900 px-4 text-sm font-medium text-white hover:bg-navy-800"><Plus className="size-4" /> New {cfg.singular.toLowerCase()}</Link>
                )} />

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                {cfg.searchable !== false && (
                    <form className="relative sm:w-72" onSubmit={(e) => { e.preventDefault(); set('search', search); }}>
                        <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                        <Input value={search} onChange={(e) => setSearch(e.target.value)} onBlur={() => set('search', search)} placeholder="Search…" className="pl-9" aria-label="Search" />
                    </form>
                )}
                {cfg.publishable && (
                    <Select value={params.get('status') ?? ''} onChange={(e) => set('status', e.target.value)} className="sm:w-40" aria-label="Status">
                        <option value="">All statuses</option><option value="published">Published</option><option value="draft">Unpublished</option>
                    </Select>
                )}
                {cfg.filters?.map((f) => (
                    <Select key={f.name} value={params.get(f.name) ?? ''} onChange={(e) => set(f.name, e.target.value)} className="sm:w-48" aria-label={f.label}>
                        <option value="">{f.label}: all</option>
                        {(f.options ?? (f.ref ? refOptions(ref, f.ref) : [])).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                ))}
                {isFetching && !isLoading && <Spinner className="size-4" />}
            </div>

            {isLoading ? <div className="grid place-items-center py-24"><Spinner /></div> : (
                <>
                    <Table head={columns.map((c) => c.label)} empty={!data?.data.length}>
                        {data?.data.map((r) => (
                            <tr key={r.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/admin/${cfg.key}/${r.id}`)}>
                                {columns.map((c, i) => (
                                    <td key={i} className={c.className ?? 'px-4 py-3'}>
                                        {i === 0 ? <Link to={`/admin/${cfg.key}/${r.id}`} className="font-medium text-slate-900 hover:underline" onClick={(e) => e.stopPropagation()}>{c.render(r, { ref })}</Link> : c.render(r, { ref })}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </Table>
                    <Pager meta={data?.meta} onPage={(p) => set('page', p)} />
                </>
            )}
        </>
    );
}
