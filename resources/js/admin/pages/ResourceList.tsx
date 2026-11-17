import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { refOptions, useReference } from '../components/FieldInput';
import { Input, PageTitle, Pager, Select, Spinner, Table } from '../components/ui';
import { useCan } from '../lib/auth';
import { adminApi } from '../lib/http';
import type { AdminRecord, Paginated } from '../lib/types';
import type { ResourceConfig } from '../resources/types';

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
                        <option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
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
                    <Table head={cfg.columns.map((c) => c.label)} empty={!data?.data.length}>
                        {data?.data.map((r) => (
                            <tr key={r.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/admin/${cfg.key}/${r.id}`)}>
                                {cfg.columns.map((c, i) => (
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
