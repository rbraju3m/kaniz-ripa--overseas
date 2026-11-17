import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../components/toast';
import { Badge, Btn, ConfirmDialog, Field, Input, Modal, PageTitle, Spinner, Switch, Table } from '../components/ui';
import { useCan, useUser } from '../lib/auth';
import { dateTime } from '../lib/format';
import { adminApi, errorMessage, fieldErrors } from '../lib/http';
import type { AdminUser, Paginated } from '../lib/types';

type Draft = { id?: number; name: string; email: string; password: string; is_active: boolean; roles: string[] };

export default function UsersPage() {
    const can = useCan();
    const me = useUser();
    const qc = useQueryClient();
    const toast = useToast();
    const [draft, setDraft] = useState<Draft | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [deleting, setDeleting] = useState<AdminUser | null>(null);
    const users = useQuery({ queryKey: ['admin', 'users'], queryFn: () => adminApi.get<Paginated<AdminUser>>('/users') });
    const roles = useQuery({ queryKey: ['admin', 'roles'], queryFn: () => adminApi.get<{ data: { name: string }[] }>('/roles'), enabled: can('roles.view') || can('users.update') });
    const roleNames = roles.data?.data.map((r) => r.name) ?? ['admin', 'editor', 'viewer'];

    const save = useMutation({
        mutationFn: (d: Draft) => {
            const body = { name: d.name, email: d.email, is_active: d.is_active, roles: d.roles, ...(d.password ? { password: d.password } : {}) };
            return d.id ? adminApi.put(`/users/${d.id}`, body) : adminApi.post('/users', body);
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); setDraft(null); toast('success', 'User saved.'); },
        onError: (e) => { setErrors(fieldErrors(e)); toast('error', errorMessage(e)); },
    });
    const remove = useMutation({
        mutationFn: (u: AdminUser) => adminApi.delete(`/users/${u.id}`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); setDeleting(null); toast('success', 'User deleted.'); },
        onError: (e) => { setDeleting(null); toast('error', errorMessage(e)); },
    });

    const open = (u?: AdminUser) => { setErrors({}); setDraft(u ? { id: u.id, name: u.name, email: u.email, password: '', is_active: u.is_active, roles: u.roles } : { name: '', email: '', password: '', is_active: true, roles: ['editor'] }); };

    return (
        <>
            <PageTitle title="Users" description="People who can sign in to the CMS." actions={can('users.create') && <Btn onClick={() => open()}><Plus className="size-4" /> New user</Btn>} />
            {users.isLoading ? <Spinner /> : (
                <Table head={['Name', 'Email', 'Roles', 'Status', 'Last sign-in', '']} empty={!users.data?.data.length}>
                    {users.data?.data.map((u) => (
                        <tr key={u.id}>
                            <td className="px-4 py-3 font-medium">{u.name}{u.id === me.id && <span className="ml-2 text-xs text-slate-400">(you)</span>}</td>
                            <td className="px-4 py-3">{u.email}</td>
                            <td className="px-4 py-3"><span className="flex flex-wrap gap-1">{u.roles.map((r) => <Badge key={r} tone="blue">{r}</Badge>)}</span></td>
                            <td className="px-4 py-3">{u.is_active ? <Badge tone="green">active</Badge> : <Badge tone="red">disabled</Badge>}</td>
                            <td className="px-4 py-3 text-xs text-slate-500">{dateTime(u.last_login_at)}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-right">
                                {can('users.update') && <Btn size="sm" variant="secondary" onClick={() => open(u)}>Edit</Btn>}
                                {can('users.delete') && u.id !== me.id && <Btn size="sm" variant="ghost" className="ml-1 text-red-600" onClick={() => setDeleting(u)}>Delete</Btn>}
                            </td>
                        </tr>
                    ))}
                </Table>
            )}
            <Modal open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Edit user' : 'New user'} footer={<><Btn variant="secondary" onClick={() => setDraft(null)}>Cancel</Btn><Btn onClick={() => draft && save.mutate(draft)} loading={save.isPending}>Save</Btn></>}>
                {draft && (
                    <div className="space-y-4">
                        <Field label="Name" error={errors.name} required><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
                        <Field label="Email" error={errors.email} required><Input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></Field>
                        <Field label={draft.id ? 'New password (leave empty to keep)' : 'Password'} error={errors.password} required={!draft.id} help="At least 10 characters with upper and lower case letters and numbers.">
                            <Input type="password" autoComplete="new-password" value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} />
                        </Field>
                        <Field label="Roles" error={errors.roles ?? errors['roles.0']}>
                            <div className="flex flex-wrap gap-3">
                                {roleNames.filter((r) => r !== 'super-admin' || me.is_super_admin).map((r) => (
                                    <label key={r} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.roles.includes(r)} onChange={(e) => setDraft({ ...draft, roles: e.target.checked ? [...draft.roles, r] : draft.roles.filter((x) => x !== r) })} /> {r}</label>
                                ))}
                            </div>
                        </Field>
                        <Switch checked={draft.is_active} onChange={(is_active) => setDraft({ ...draft, is_active })} label="Account active" description="Disabled users cannot sign in." disabled={draft.id === me.id} />
                    </div>
                )}
            </Modal>
            <ConfirmDialog open={!!deleting} title="Delete user?" loading={remove.isPending} onCancel={() => setDeleting(null)} onConfirm={() => deleting && remove.mutate(deleting)}
                message={<><strong>{deleting?.name}</strong> will lose access permanently. Their past activity stays in the log. This cannot be undone; consider disabling the account instead.</>} />
        </>
    );
}
