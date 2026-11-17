import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useUpload } from '../components/MediaPicker';
import { useToast } from '../components/toast';
import { Btn, ConfirmDialog, Field, Input, Modal, PageTitle, Pager, Spinner } from '../components/ui';
import { useCan } from '../lib/auth';
import { bytes, dateTime } from '../lib/format';
import { adminApi, errorMessage } from '../lib/http';
import type { MediaItem, Paginated } from '../lib/types';

export default function MediaLibraryPage() {
    const can = useCan();
    const qc = useQueryClient();
    const toast = useToast();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [active, setActive] = useState<MediaItem | null>(null);
    const [alt, setAlt] = useState<{ bn?: string; en?: string }>({});
    const [confirm, setConfirm] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const upload = useUpload('general');

    const { data, isLoading } = useQuery({ queryKey: ['admin', 'media', { search, page }], queryFn: () => adminApi.get<Paginated<MediaItem>>('/media', { search, page, per_page: 36 }) });

    const saveAlt = useMutation({
        mutationFn: () => adminApi.put(`/media/${active!.id}`, { alt }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'media'] }); toast('success', 'Alt text saved.'); setActive(null); },
        onError: (e) => toast('error', errorMessage(e)),
    });
    const remove = useMutation({
        mutationFn: () => adminApi.delete(`/media/${active!.id}`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'media'] }); toast('success', 'Image deleted.'); setConfirm(false); setActive(null); },
        onError: (e) => { setConfirm(false); toast('error', errorMessage(e)); },
    });

    return (
        <>
            <PageTitle title="Media library" description="Every upload is re-encoded to WebP with responsive sizes. SVG and other formats are rejected for security."
                actions={can('media.create') && (
                    <>
                        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={async (e) => {
                            const files = Array.from(e.target.files ?? []); e.target.value = '';
                            let ok = 0;
                            for (const f of files) if (await upload.mutateAsync(f).catch(() => null)) ok++;
                            if (ok) toast('success', `${ok} image(s) uploaded.`);
                        }} />
                        <Btn onClick={() => fileRef.current?.click()} loading={upload.isPending}><Upload className="size-4" /> Upload images</Btn>
                    </>
                )} />
            <div className="relative mb-4 sm:w-72">
                <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by file name" className="pl-9" aria-label="Search media" />
            </div>
            {isLoading ? <div className="grid place-items-center py-24"><Spinner /></div> : (
                <>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                        {data?.data.map((m) => (
                            <button key={m.id} onClick={() => { setActive(m); setAlt(m.alt ?? {}); }} className="group overflow-hidden rounded-lg bg-white text-left ring-1 ring-slate-200 hover:ring-navy-400">
                                <img src={m.variant_urls?.sm ?? m.url ?? ''} alt={m.alt?.en ?? ''} loading="lazy" className="aspect-square w-full object-cover" />
                                <p className="truncate px-2 py-1.5 text-xs text-slate-600">{m.original_name}</p>
                            </button>
                        ))}
                    </div>
                    {data?.data.length === 0 && <p className="py-16 text-center text-sm text-slate-500">No images uploaded yet.</p>}
                    <Pager meta={data?.meta} onPage={setPage} />
                </>
            )}
            <Modal open={!!active} onClose={() => setActive(null)} title="Image details" wide footer={
                <>
                    {can('media.delete') && <Btn variant="secondary" className="mr-auto" onClick={() => setConfirm(true)}><Trash2 className="size-4 text-red-600" /> Delete</Btn>}
                    <Btn variant="secondary" onClick={() => setActive(null)}>Close</Btn>
                    {can('media.update') && <Btn onClick={() => saveAlt.mutate()} loading={saveAlt.isPending}>Save alt text</Btn>}
                </>
            }>
                {active && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <img src={active.variant_urls?.md ?? active.url ?? ''} alt="" className="w-full rounded-lg bg-slate-100 object-contain" />
                        <div className="space-y-4 text-sm">
                            <dl className="grid grid-cols-3 gap-2 text-slate-600">
                                <dt>File</dt><dd className="col-span-2 break-all text-slate-900">{active.original_name}</dd>
                                <dt>Size</dt><dd className="col-span-2 text-slate-900">{bytes(active.size)} · {active.width}×{active.height}</dd>
                                <dt>Uploaded</dt><dd className="col-span-2 text-slate-900">{dateTime(active.created_at)}</dd>
                                <dt>URL</dt><dd className="col-span-2 break-all"><a href={active.url ?? '#'} target="_blank" rel="noopener" className="text-navy-700 underline">{active.url}</a></dd>
                            </dl>
                            <Field label="Alt text (Bangla)" help="Describes the image for screen readers and search engines."><Input lang="bn" value={alt.bn ?? ''} onChange={(e) => setAlt({ ...alt, bn: e.target.value })} /></Field>
                            <Field label="Alt text (English)"><Input value={alt.en ?? ''} onChange={(e) => setAlt({ ...alt, en: e.target.value })} /></Field>
                        </div>
                    </div>
                )}
            </Modal>
            <ConfirmDialog open={confirm} title="Delete image?" loading={remove.isPending} onCancel={() => setConfirm(false)} onConfirm={() => remove.mutate()}
                message="The file and all its sizes are removed permanently. Content that uses this image will lose it. This cannot be undone." />
        </>
    );
}
