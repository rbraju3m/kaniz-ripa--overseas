import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, Plus } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../components/toast';
import { Badge, Btn, Card, ConfirmDialog, Field, Input, Modal, PageTitle, Spinner } from '../components/ui';
import { useCan } from '../lib/auth';
import { adminApi, errorMessage, fieldErrors } from '../lib/http';

interface Role { id: number; name: string; users_count: number; is_system: boolean; permissions: string[] }
type Draft = { id?: number; name: string; permissions: string[] };

export default function RolesPage() {
    const can = useCan();
    const qc = useQueryClient();
    const toast = useToast();
    const [draft, setDraft] = useState<Draft | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [deleting, setDeleting] = useState<Role | null>(null);
    const { data, isLoading } = useQuery({ queryKey: ['admin', 'roles'], queryFn: () => adminApi.get<{ data: Role[]; modules: Record<string, string[]> }>('/roles') });

    const save = useMutation({
        mutationFn: (d: Draft) => (d.id ? adminApi.put(`/roles/${d.id}`, d) : adminApi.post('/roles', d)),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'roles'] }); setDraft(null); toast('success', 'Role saved.'); },
        onError: (e) => { setErrors(fieldErrors(e)); toast('error', errorMessage(e)); },
    });
    const remove = useMutation({
        mutationFn: (r: Role) => adminApi.delete(`/roles/${r.id}`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'roles'] }); setDeleting(null); toast('success', 'Role deleted.'); },
        onError: (e) => { setDeleting(null); toast('error', errorMessage(e)); },
    });

    if (isLoading || !data) return <Spinner />;
    const modules = data.modules;
    const toggle = (p: string) => draft && setDraft({ ...draft, permissions: draft.permissions.includes(p) ? draft.permissions.filter((x) => x !== p) : [...draft.permissions, p] });
    const toggleModule = (m: string) => {
        if (!draft) return;
        const perms = modules[m].map((a) => `${m}.${a}`);
        const all = perms.every((p) => draft.permissions.includes(p));
        setDraft({ ...draft, permissions: all ? draft.permissions.filter((p) => !perms.includes(p)) : [...new Set([...draft.permissions, ...perms])] });
    };

    return (
        <>
            <PageTitle title="Roles & permissions" description="Super Admin always has every permission and cannot be edited." actions={can('roles.create') && <Btn onClick={() => { setErrors({}); setDraft({ name: '', permissions: [] }); }}><Plus className="size-4" /> New role</Btn>} />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {data.data.map((r) => (
                    <Card key={r.id} title={<span className="flex items-center gap-2">{r.is_system && <Lock className="size-4 text-slate-400" />}{r.name}</span>}
                        actions={!r.is_system && can('roles.update') && <Btn size="sm" variant="secondary" onClick={() => { setErrors({}); setDraft({ id: r.id, name: r.name, permissions: r.permissions }); }}>Edit</Btn>}>
                        <p className="text-sm text-slate-600">{r.users_count} user(s) · {r.is_system ? 'all permissions' : `${r.permissions.length} permissions`}</p>
                        {!r.is_system && can('roles.delete') && r.users_count === 0 && <Btn size="sm" variant="ghost" className="mt-2 text-red-600" onClick={() => setDeleting(r)}>Delete role</Btn>}
                    </Card>
                ))}
            </div>
            <Modal open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? `Edit role: ${draft.name}` : 'New role'} wide footer={<><Btn variant="secondary" onClick={() => setDraft(null)}>Cancel</Btn><Btn onClick={() => draft && save.mutate(draft)} loading={save.isPending}>Save role</Btn></>}>
                {draft && (
                    <div className="space-y-5">
                        <Field label="Role name" error={errors.name} help="Lowercase letters, numbers and hyphens."><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead><tr className="text-left text-xs uppercase text-slate-500"><th className="py-2 pr-4">Module</th>{['view', 'create', 'update', 'delete', 'publish'].map((a) => <th key={a} className="px-2 py-2 text-center">{a}</th>)}</tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    {Object.entries(modules).map(([m, actions]) => (
                                        <tr key={m}>
                                            <td className="py-2 pr-4"><button type="button" className="font-medium text-slate-800 hover:underline" onClick={() => toggleModule(m)}>{m.replace(/_/g, ' ')}</button></td>
                                            {['view', 'create', 'update', 'delete', 'publish'].map((a) => (
                                                <td key={a} className="px-2 py-2 text-center">{actions.includes(a) ? <input type="checkbox" aria-label={`${m}.${a}`} checked={draft.permissions.includes(`${m}.${a}`)} onChange={() => toggle(`${m}.${a}`)} /> : <span className="text-slate-300">—</span>}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-slate-500"><Badge tone="amber">publish</Badge> lets a role make content public, verify partner companies and publish the company profile.</p>
                    </div>
                )}
            </Modal>
            <ConfirmDialog open={!!deleting} title="Delete role?" loading={remove.isPending} onCancel={() => setDeleting(null)} onConfirm={() => deleting && remove.mutate(deleting)} message={<>The role <strong>{deleting?.name}</strong> will be deleted. This cannot be undone.</>} />
        </>
    );
}
