import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Eye, EyeOff, FileUp, Globe, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useToast } from '../components/toast';
import { Badge, Btn, Card, ConfirmDialog, Field, Input, Modal, PageTitle, Select, Spinner, Table, Textarea } from '../components/ui';
import { useCan } from '../lib/auth';
import { bytes, dateTime } from '../lib/format';
import { adminApi, errorMessage, fieldErrors } from '../lib/http';
import type { Locale } from '../lib/types';

interface Version { id: number; source: 'uploaded' | 'generated'; locale: Locale; original_name: string | null; size: number; version_no: number; is_current: boolean; notes: string | null; created_by: string | null; created_at: string }
interface Profile { id: number; active_source: 'uploaded' | 'generated'; status: 'draft' | 'published' | 'archived'; available: Record<Locale, boolean>; auto_regenerate: boolean; title: Partial<Record<Locale, string>> | null; description: Partial<Record<Locale, string>> | null; versions: Version[] }

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
    const startPolling = () => { setGenerating(true); setTimeout(() => setGenerating(false), 60_000); };
    const refresh = (p?: Profile) => (p ? qc.setQueryData(['admin', 'company-profile'], p) : qc.invalidateQueries({ queryKey: ['admin', 'company-profile'] }));

    const update = useMutation({
        mutationFn: (body: Partial<Profile>) => adminApi.put<{ data: Profile }>('/company-profile', body).then((r) => r.data),
        onSuccess: (p, body) => {
            refresh(p);
            // Switching to "generate automatically" queues any missing PDFs: watch for them.
            if (body.active_source === 'generated' && (['bn', 'en'] as const).some((l) => !p.versions.some((v) => v.source === 'generated' && v.locale === l && v.is_current))) {
                startPolling();
                toast('success', 'Generating the BN + EN PDFs now. They appear below in a few seconds.');
            } else {
                toast('success', 'Company profile updated.');
            }
        },
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
            startPolling();
            toast('success', 'Generation started. New versions appear below in a few seconds.');
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
    const shown = profile.status === 'published';
    const downloadable = profile.available.bn || profile.available.en;
    const auto = profile.active_source === 'generated';

    return (
        <>
            <PageTitle title="Company profile PDF" description="Choose where the downloadable PDF comes from. The website shows the download button only when a PDF exists." />

            <div className="grid gap-6 xl:grid-cols-3">
                <Card title="On the website" className="xl:col-span-1">
                    <div className="space-y-4">
                        <div className={`flex items-start gap-3 rounded-lg p-3 text-sm ${downloadable ? 'bg-brand-green-50 text-brand-green-800' : 'bg-amber-50 text-amber-800'}`}>
                            <Globe className="mt-0.5 size-4 shrink-0" />
                            <span>{downloadable
                                ? <>Visitors see a <strong>Download</strong> button.</>
                                : shown ? <>No PDF yet, so the website shows <strong>no</strong> download button.</> : <>Hidden: the website shows <strong>no</strong> download button.</>}</span>
                        </div>
                        <Field label="Profile PDF comes from">
                            <Select value={profile.active_source} disabled={!can('company_profile.update')} onChange={(e) => update.mutate({ active_source: e.target.value as Profile['active_source'] })}>
                                <option value="generated">Generate automatically from website content</option>
                                <option value="uploaded">Upload my own PDF</option>
                            </Select>
                        </Field>
                        <p className="text-xs text-slate-500">{auto
                            ? (profile.auto_regenerate ? 'The PDF is rebuilt automatically about a minute after you change published website content.' : 'Automatic rebuilding is switched off on this server; use "Generate BN + EN PDFs".')
                            : 'Visitors get the current uploaded PDF. Upload a new file to replace it.'}</p>
                        <ul className="space-y-1 text-sm">
                            {(['bn', 'en'] as const).map((l) => {
                                const v = current(profile.active_source, l);
                                return <li key={l} className="flex justify-between"><span>{l === 'bn' ? 'Bangla' : 'English'}</span>{v ? <span className="text-brand-green-700">v{v.version_no} ✓</span> : <span className="text-slate-400">{generating && auto ? 'generating…' : 'none (uses the other language)'}</span>}</li>;
                            })}
                        </ul>
                        {can('company_profile.publish') && (
                            shown
                                ? <Btn variant="secondary" onClick={() => update.mutate({ status: 'draft' })} loading={update.isPending}><EyeOff className="size-4" /> Hide from website</Btn>
                                : <Btn onClick={() => update.mutate({ status: 'published' })} loading={update.isPending}><Eye className="size-4" /> Show on website</Btn>
                        )}
                        {downloadable && <a href="/bn/company-profile" target="_blank" rel="noopener" className="block text-sm text-navy-700 underline">Open public page</a>}
                    </div>
                </Card>

                <Card title="Upload official PDF">
                    {can('company_profile.create') ? (
                        <div className="space-y-4">
                            <Field label="Language of this PDF"><Select value={uploadLocale} onChange={(e) => setUploadLocale(e.target.value as Locale)}><option value="bn">Bangla</option><option value="en">English</option></Select></Field>
                            <Field label="Version notes (optional)"><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. 2026 edition from designer" /></Field>
                            <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) upload.mutate(f); }} />
                            <Btn onClick={() => fileRef.current?.click()} loading={upload.isPending}><FileUp className="size-4" /> Choose PDF (max 20 MB)</Btn>
                            <p className="text-xs text-slate-500">The previous version is kept in history. Files are stored privately; visitors only get the current version, and only while &quot;Upload my own PDF&quot; is selected.</p>
                        </div>
                    ) : <p className="text-sm text-slate-500">You don't have permission to upload.</p>}
                </Card>

                <Card title="Generated PDF">
                    <div className="space-y-4 text-sm">
                        <p className="text-slate-600">Builds an A4 PDF (cover, about, mission &amp; vision, services, countries, partners, portfolio, success stories, credentials, contact) from <strong>published and reviewed</strong> content only. Empty sections are left out.</p>
                        <div className="flex flex-wrap gap-2">
                            <a href="/api/v1/admin/company-profile/preview?locale=bn" target="_blank" rel="noopener" className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm ring-1 ring-slate-300 hover:bg-slate-50"><Eye className="size-4" /> Preview BN</a>
                            <a href="/api/v1/admin/company-profile/preview?locale=en" target="_blank" rel="noopener" className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm ring-1 ring-slate-300 hover:bg-slate-50"><Eye className="size-4" /> Preview EN</a>
                        </div>
                        {can('company_profile.create') && <Btn variant={auto ? 'secondary' : 'primary'} onClick={() => generate.mutate(['bn', 'en'])} loading={generate.isPending}><Sparkles className="size-4" /> {auto ? 'Rebuild now' : 'Generate BN + EN PDFs'}</Btn>}
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
