import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Download, Eye, FileUp, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useToast } from '../components/toast';
import { Badge, Btn, Card, ConfirmDialog, Field, Input, Modal, PageTitle, Select, Spinner, Table, Textarea } from '../components/ui';
import { useCan } from '../lib/auth';
import { bytes, dateTime } from '../lib/format';
import { adminApi, errorMessage, fieldErrors } from '../lib/http';
import type { Locale } from '../lib/types';

interface Version { id: number; source: 'uploaded' | 'generated'; locale: Locale; original_name: string | null; size: number; version_no: number; is_current: boolean; notes: string | null; created_by: string | null; created_at: string }
interface Profile { id: number; active_source: 'uploaded' | 'generated'; status: 'draft' | 'published' | 'archived'; title: Partial<Record<Locale, string>> | null; description: Partial<Record<Locale, string>> | null; versions: Version[] }

export default function CompanyProfilePage() {
    const can = useCan();
    const qc = useQueryClient();
    const toast = useToast();
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploadLocale, setUploadLocale] = useState<Locale>('bn');
    const [notes, setNotes] = useState('');
    const [preview, setPreview] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<Version | null>(null);
    const [meta, setMeta] = useState<Pick<Profile, 'title' | 'description'> | null>(null);
    const [generating, setGenerating] = useState(false);

    const { data: profile, isLoading } = useQuery({
        queryKey: ['admin', 'company-profile'],
        queryFn: () => adminApi.get<{ data: Profile }>('/company-profile').then((r) => r.data),
        // Poll while a queued generation is running.
        refetchInterval: generating ? 3000 : false,
    });
    const refresh = (p?: Profile) => (p ? qc.setQueryData(['admin', 'company-profile'], p) : qc.invalidateQueries({ queryKey: ['admin', 'company-profile'] }));

    const update = useMutation({
        mutationFn: (body: Partial<Profile>) => adminApi.put<{ data: Profile }>('/company-profile', body).then((r) => r.data),
        onSuccess: (p) => { refresh(p); toast('success', 'Company profile updated.'); },
        onError: (e) => toast('error', errorMessage(e)),
    });
    const upload = useMutation({
        mutationFn: (file: File) => {
            const f = new FormData(); f.append('file', file); f.append('locale', uploadLocale); if (notes) f.append('notes', notes);
            return adminApi.upload('/company-profile/upload', f);
        },
        onSuccess: () => { refresh(); setNotes(''); toast('success', 'PDF uploaded and set as current version.'); },
        onError: (e) => toast('error', fieldErrors(e).file ?? errorMessage(e, 'Upload failed.')),
    });
    const generate = useMutation({
        mutationFn: (locales: Locale[]) => adminApi.post('/company-profile/generate', { locales }),
        onSuccess: () => {
            setGenerating(true);
            toast('success', 'Generation started. New versions appear below in a few seconds.');
            setTimeout(() => setGenerating(false), 60_000);
        },
        onError: (e) => toast('error', errorMessage(e)),
    });
    const makeCurrent = useMutation({
        mutationFn: (id: number) => adminApi.post<{ data: Profile }>(`/company-profile/versions/${id}/current`).then((r) => r.data),
        onSuccess: (p) => { refresh(p); toast('success', 'Current version changed.'); },
        onError: (e) => toast('error', errorMessage(e)),
    });
    const remove = useMutation({
        mutationFn: (id: number) => adminApi.delete(`/company-profile/versions/${id}`),
        onSuccess: () => { refresh(); setDeleting(null); toast('success', 'Version deleted.'); },
        onError: (e) => { setDeleting(null); toast('error', errorMessage(e)); },
    });

    if (isLoading || !profile) return <div className="grid place-items-center py-24"><Spinner /></div>;
    const current = (source: Version['source'], l: Locale) => profile.versions.find((v) => v.source === source && v.locale === l && v.is_current);
    const live = profile.status === 'published';
    const hasActive = !!(current(profile.active_source, 'bn') || current(profile.active_source, 'en'));

    return (
        <>
            <PageTitle title="Company profile PDF" description="Publish either an uploaded official PDF or one generated from published website content." />

            <div className="grid gap-6 xl:grid-cols-3">
                <Card title="Publishing" className="xl:col-span-1">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm">Status: <Badge tone={live ? 'green' : 'amber'}>{profile.status}</Badge></div>
                        <Field label="Source shown to visitors">
                            <Select value={profile.active_source} disabled={!can('company_profile.update')} onChange={(e) => update.mutate({ active_source: e.target.value as Profile['active_source'] })}>
                                <option value="uploaded">Uploaded official PDF</option>
                                <option value="generated">Generated from website content</option>
                            </Select>
                        </Field>
                        <ul className="space-y-1 text-sm">
                            {(['bn', 'en'] as const).map((l) => {
                                const v = current(profile.active_source, l);
                                return <li key={l} className="flex justify-between"><span>{l === 'bn' ? 'Bangla' : 'English'}</span>{v ? <span className="text-brand-green-700">v{v.version_no} ✓</span> : <span className="text-slate-400">none (falls back to the other language)</span>}</li>;
                            })}
                        </ul>
                        {can('company_profile.publish') && (
                            live
                                ? <Btn variant="secondary" onClick={() => update.mutate({ status: 'draft' })} loading={update.isPending}>Unpublish</Btn>
                                : <>
                                    <Btn onClick={() => update.mutate({ status: 'published' })} loading={update.isPending} disabled={!hasActive}><CheckCircle2 className="size-4" /> Publish profile</Btn>
                                    {!hasActive && <p className="text-xs text-slate-500">Upload or generate a PDF for the selected source first.</p>}
                                  </>
                        )}
                        {live && <a href="/bn/company-profile" target="_blank" rel="noopener" className="block text-sm text-navy-700 underline">Open public page</a>}
                    </div>
                </Card>

                <Card title="Upload official PDF">
                    {can('company_profile.create') ? (
                        <div className="space-y-4">
                            <Field label="Language of this PDF"><Select value={uploadLocale} onChange={(e) => setUploadLocale(e.target.value as Locale)}><option value="bn">Bangla</option><option value="en">English</option></Select></Field>
                            <Field label="Version notes (optional)"><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. 2026 edition from designer" /></Field>
                            <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) upload.mutate(f); }} />
                            <Btn onClick={() => fileRef.current?.click()} loading={upload.isPending}><FileUp className="size-4" /> Choose PDF (max 20 MB)</Btn>
                            <p className="text-xs text-slate-500">The previous version is kept in history. Files are stored privately and only the published version is downloadable.</p>
                        </div>
                    ) : <p className="text-sm text-slate-500">You don't have permission to upload.</p>}
                </Card>

                <Card title="Generate from website content">
                    <div className="space-y-4 text-sm">
                        <p className="text-slate-600">Builds an A4 PDF (cover, about, mission &amp; vision, services, countries, partners, portfolio, success stories, credentials, contact) from <strong>published and reviewed</strong> content only. Empty sections are left out.</p>
                        <div className="flex flex-wrap gap-2">
                            <a href="/api/v1/admin/company-profile/preview?locale=bn" target="_blank" rel="noopener" className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm ring-1 ring-slate-300 hover:bg-slate-50"><Eye className="size-4" /> Preview BN</a>
                            <a href="/api/v1/admin/company-profile/preview?locale=en" target="_blank" rel="noopener" className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm ring-1 ring-slate-300 hover:bg-slate-50"><Eye className="size-4" /> Preview EN</a>
                        </div>
                        {can('company_profile.create') && <Btn onClick={() => generate.mutate(['bn', 'en'])} loading={generate.isPending}><Sparkles className="size-4" /> Generate BN + EN PDFs</Btn>}
                        {generating && <p className="flex items-center gap-2 text-xs text-slate-500"><RefreshCw className="size-3 animate-spin" /> Waiting for the queue worker…</p>}
                    </div>
                </Card>
            </div>

            <Card title="Title & description" className="mt-6" actions={can('company_profile.update') && <Btn size="sm" onClick={() => meta && update.mutate(meta)} disabled={!meta} loading={update.isPending}>Save</Btn>}>
                <div className="grid gap-4 md:grid-cols-2">
                    {(['bn', 'en'] as const).map((l) => (
                        <div key={l} className="space-y-3">
                            <Field label={`Title (${l.toUpperCase()})`}><Input lang={l} value={(meta ?? profile).title?.[l] ?? ''} onChange={(e) => setMeta({ title: { ...(meta ?? profile).title, [l]: e.target.value }, description: (meta ?? profile).description })} /></Field>
                            <Field label={`Description (${l.toUpperCase()})`}><Textarea lang={l} rows={3} value={(meta ?? profile).description?.[l] ?? ''} onChange={(e) => setMeta({ title: (meta ?? profile).title, description: { ...(meta ?? profile).description, [l]: e.target.value } })} /></Field>
                        </div>
                    ))}
                </div>
            </Card>

            <h2 className="mb-3 mt-8 text-lg font-semibold">Version history</h2>
            <Table head={['Version', 'Source', 'Language', 'File', 'Size', 'Created', 'Status', '']} empty={!profile.versions.length}>
                {profile.versions.map((v) => (
                    <tr key={v.id}>
                        <td className="px-4 py-3 font-medium">v{v.version_no}</td>
                        <td className="px-4 py-3"><Badge tone={v.source === 'uploaded' ? 'blue' : 'gray'}>{v.source}</Badge></td>
                        <td className="px-4 py-3">{v.locale.toUpperCase()}</td>
                        <td className="max-w-48 truncate px-4 py-3 text-slate-600" title={v.notes ?? ''}>{v.original_name ?? 'Generated'}{v.notes && <span className="block truncate text-xs text-slate-400">{v.notes}</span>}</td>
                        <td className="px-4 py-3">{bytes(v.size)}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{dateTime(v.created_at)}<br />{v.created_by}</td>
                        <td className="px-4 py-3">{v.is_current ? <Badge tone="green">current</Badge> : can('company_profile.update') && <Btn size="sm" variant="secondary" onClick={() => makeCurrent.mutate(v.id)}>Make current</Btn>}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                            <Btn size="sm" variant="ghost" onClick={() => setPreview(`/api/v1/admin/company-profile/versions/${v.id}/file?inline=1`)} aria-label="Preview"><Eye className="size-4" /></Btn>
                            <a href={`/api/v1/admin/company-profile/versions/${v.id}/file`} className="inline-flex h-8 items-center rounded-lg px-2 text-slate-700 hover:bg-slate-100" aria-label="Download"><Download className="size-4" /></a>
                            {can('company_profile.delete') && <Btn size="sm" variant="ghost" onClick={() => setDeleting(v)} aria-label="Delete"><Trash2 className="size-4 text-red-600" /></Btn>}
                        </td>
                    </tr>
                ))}
            </Table>

            <Modal open={!!preview} onClose={() => setPreview(null)} title="PDF preview" wide>
                {preview && <iframe src={preview} title="PDF preview" className="h-[75vh] w-full rounded-lg" />}
            </Modal>
            <ConfirmDialog open={!!deleting} title="Delete this version?" loading={remove.isPending} onCancel={() => setDeleting(null)} onConfirm={() => deleting && remove.mutate(deleting.id)}
                message={<>Version v{deleting?.version_no} ({deleting?.source}, {deleting?.locale.toUpperCase()}) and its file will be deleted permanently. This cannot be undone.</>} />
        </>
    );
}
