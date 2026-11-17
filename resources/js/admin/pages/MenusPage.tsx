import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../components/toast';
import { Btn, Card, Input, PageTitle, Select, Spinner } from '../components/ui';
import { useCan } from '../lib/auth';
import { adminApi, errorMessage } from '../lib/http';

interface Item { id?: number; parent_id?: number | null; label: { bn: string; en: string }; route_name: string | null; url: string | null; open_in_new_tab: boolean; is_active: boolean; children?: Item[] }
interface Menu { id: number; location: string; name: string; items: Item[] }
const ROUTES = ['home', 'about', 'services', 'portfolio', 'partners', 'success-stories', 'gallery', 'company-profile', 'contact'];

function toTree(items: Item[]): Item[] {
    return items.filter((i) => !i.parent_id).map((p) => ({ ...p, children: items.filter((c) => c.parent_id === p.id) }));
}

function MenuEditor({ menu }: { menu: Menu }) {
    const can = useCan();
    const qc = useQueryClient();
    const toast = useToast();
    const [items, setItems] = useState<Item[]>(() => toTree(menu.items));
    const update = (i: number, patch: Partial<Item>) => setItems(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
    const move = (i: number, d: number) => { const n = [...items]; [n[i], n[i + d]] = [n[i + d], n[i]]; setItems(n); };

    const save = useMutation({
        mutationFn: () => adminApi.put(`/menus/${menu.id}`, { items: items.map(({ label, route_name, url, open_in_new_tab, is_active, children }) => ({ label, route_name: route_name || null, url: url || null, open_in_new_tab, is_active, children: (children ?? []).map(({ label, route_name, url }) => ({ label, route_name: route_name || null, url: url || null })) })) }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'menus'] }); qc.invalidateQueries({ queryKey: ['site'] }); toast('success', `${menu.name} menu saved.`); },
        onError: (e) => toast('error', errorMessage(e, 'Check that every item has BN and EN labels and a page or URL.')),
    });

    return (
        <Card title={`${menu.name} menu`} actions={can('menus.update') && <Btn size="sm" onClick={() => save.mutate()} loading={save.isPending}><Save className="size-4" /> Save</Btn>}>
            <ol className="space-y-2">
                {items.map((it, i) => (
                    <li key={i} className="grid items-center gap-2 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200 md:grid-cols-[1fr_1fr_1fr_auto]">
                        <Input lang="bn" aria-label="Label (Bangla)" placeholder="বাংলা লেবেল" value={it.label.bn} onChange={(e) => update(i, { label: { ...it.label, bn: e.target.value } })} />
                        <Input aria-label="Label (English)" placeholder="English label" value={it.label.en} onChange={(e) => update(i, { label: { ...it.label, en: e.target.value } })} />
                        <Select aria-label="Link target" value={it.route_name ?? (it.url ? '__url' : '')} onChange={(e) => update(i, e.target.value === '__url' ? { route_name: null, url: it.url ?? 'https://' } : { route_name: e.target.value || null, url: null })}>
                            <option value="">— choose page —</option>
                            {ROUTES.map((r) => <option key={r} value={r}>Page: {r}</option>)}
                            <option value="__url">Custom URL…</option>
                        </Select>
                        <div className="flex gap-1">
                            <Btn size="sm" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="size-4" /></Btn>
                            <Btn size="sm" variant="ghost" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="size-4" /></Btn>
                            <Btn size="sm" variant="ghost" onClick={() => setItems(items.filter((_, j) => j !== i))} aria-label="Remove"><Trash2 className="size-4 text-red-600" /></Btn>
                        </div>
                        {!it.route_name && it.url !== null && (
                            <Input className="md:col-span-3" aria-label="URL" placeholder="https://… or /path" value={it.url ?? ''} onChange={(e) => update(i, { url: e.target.value })} />
                        )}
                        <label className="flex items-center gap-2 text-xs text-slate-600 md:col-span-4">
                            <input type="checkbox" checked={it.is_active} onChange={(e) => update(i, { is_active: e.target.checked })} /> Visible
                            <input type="checkbox" className="ml-4" checked={it.open_in_new_tab} onChange={(e) => update(i, { open_in_new_tab: e.target.checked })} /> Open in new tab
                        </label>
                    </li>
                ))}
            </ol>
            <Btn variant="secondary" className="mt-3" onClick={() => setItems([...items, { label: { bn: '', en: '' }, route_name: null, url: null, open_in_new_tab: false, is_active: true, children: [] }])}><Plus className="size-4" /> Add item</Btn>
        </Card>
    );
}

export default function MenusPage() {
    const { data, isLoading } = useQuery({ queryKey: ['admin', 'menus'], queryFn: () => adminApi.get<{ data: Menu[] }>('/menus').then((r) => r.data) });
    return (
        <>
            <PageTitle title="Navigation" description="Header and footer links in both languages." />
            {isLoading ? <Spinner /> : <div className="space-y-6">{data?.map((m) => <MenuEditor key={`${m.id}-${m.items.length}`} menu={m} />)}</div>}
        </>
    );
}
