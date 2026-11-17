import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GripVertical, ImagePlus, Search, Trash2, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { Media } from '@/lib/types';
import { cn } from '@/lib/utils';
import { adminApi, errorMessage, fieldErrors } from '../lib/http';
import type { MediaItem, Paginated } from '../lib/types';
import { useToast } from './toast';
import { Btn, Input, Modal, Pager, Spinner } from './ui';

export interface PickedMedia { id: number; url: string | null }

export const toPicked = (m: Media | MediaItem | null | undefined): PickedMedia | null => (m ? { id: m.id, url: m.url } : null);

export function useUpload(folder: string) {
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation({
        mutationFn: (file: File) => {
            const form = new FormData();
            form.append('file', file);
            form.append('folder', folder);
            return adminApi.upload<{ data: MediaItem }>('/media', form).then((r) => r.data);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'media'] }),
        onError: (e) => toast('error', fieldErrors(e).file ?? errorMessage(e, 'Upload failed.')),
    });
}

/** Browse the media library or upload; resolves with the chosen items. */
export function MediaLibraryModal({ open, onClose, onSelect, multiple = false, folder = 'general' }: {
    open: boolean; onClose: () => void; onSelect: (items: PickedMedia[]) => void; multiple?: boolean; folder?: string;
}) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<PickedMedia[]>([]);
    const fileRef = useRef<HTMLInputElement>(null);
    const upload = useUpload(folder);
    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'media', { search, page }],
        queryFn: () => adminApi.get<Paginated<MediaItem>>('/media', { search, page, per_page: 24 }),
        enabled: open,
    });

    const toggle = (m: MediaItem) => {
        const item = { id: m.id, url: m.url };
        if (!multiple) return setSelected([item]);
        setSelected((s) => (s.some((x) => x.id === m.id) ? s.filter((x) => x.id !== m.id) : [...s, item]));
    };

    const close = () => { setSelected([]); onClose(); };

    return (
        <Modal open={open} onClose={close} title="Media library" wide footer={
            <>
                <Btn variant="secondary" onClick={close}>Cancel</Btn>
                <Btn disabled={!selected.length} onClick={() => { onSelect(selected); close(); }}>Use {selected.length > 1 ? `${selected.length} images` : 'image'}</Btn>
            </>
        }>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                    <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by file name" className="pl-9" />
                </div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple={multiple} hidden onChange={async (e) => {
                    const files = Array.from(e.target.files ?? []);
                    e.target.value = '';
                    for (const f of files) {
                        const m = await upload.mutateAsync(f).catch(() => null);
                        if (m) setSelected((s) => (multiple ? [...s, { id: m.id, url: m.url }] : [{ id: m.id, url: m.url }]));
                    }
                }} />
                <Btn onClick={() => fileRef.current?.click()} loading={upload.isPending}><Upload className="size-4" /> Upload</Btn>
            </div>
            <p className="mb-3 text-xs text-slate-500">JPG, PNG, WebP or GIF up to 8 MB. Images are converted to WebP and resized automatically. SVG is not accepted.</p>
            {isLoading ? <div className="grid place-items-center py-16"><Spinner /></div> : (
                <>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                        {data?.data.map((m) => {
                            const active = selected.some((s) => s.id === m.id);
                            return (
                                <button key={m.id} type="button" onClick={() => toggle(m)} title={m.original_name}
                                    className={cn('relative aspect-square overflow-hidden rounded-lg ring-2 transition', active ? 'ring-brand-green-600' : 'ring-transparent hover:ring-slate-300')}>
                                    <img src={m.variant_urls?.sm ?? m.url ?? ''} alt={m.alt?.en ?? ''} className="size-full object-cover" loading="lazy" />
                                    {active && <span className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-brand-green-600 text-xs text-white">✓</span>}
                                </button>
                            );
                        })}
                    </div>
                    {data?.data.length === 0 && <p className="py-10 text-center text-sm text-slate-500">No images yet. Upload one to get started.</p>}
                    <Pager meta={data?.meta} onPage={setPage} />
                </>
            )}
        </Modal>
    );
}

export function MediaField({ value, onChange, folder, aspect = 'aspect-video' }: { value: PickedMedia | null; onChange: (m: PickedMedia | null) => void; folder?: string; aspect?: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div>
            {value?.url ? (
                <div className={cn('group relative w-full max-w-sm overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200', aspect)}>
                    <img src={value.url} alt="" className="size-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-900/50 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                        <Btn size="sm" variant="secondary" onClick={() => setOpen(true)}>Change</Btn>
                        <Btn size="sm" variant="danger" onClick={() => onChange(null)}><X className="size-4" /> Remove</Btn>
                    </div>
                </div>
            ) : (
                <button type="button" onClick={() => setOpen(true)} className={cn('flex w-full max-w-sm flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 text-sm text-slate-500 hover:border-navy-400 hover:text-navy-700', aspect)}>
                    <ImagePlus className="size-6" /> Choose image
                </button>
            )}
            <MediaLibraryModal open={open} onClose={() => setOpen(false)} folder={folder} onSelect={(items) => onChange(items[0] ?? null)} />
        </div>
    );
}

export interface GalleryValue { media: PickedMedia; caption: { bn?: string; en?: string } }

export function GalleryField({ value, onChange, folder }: { value: GalleryValue[]; onChange: (v: GalleryValue[]) => void; folder?: string }) {
    const [open, setOpen] = useState(false);
    const [drag, setDrag] = useState<number | null>(null);
    const move = (from: number, to: number) => {
        const next = [...value];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        onChange(next);
    };

    return (
        <div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {value.map((img, i) => (
                    <li key={`${img.media.id}-${i}`} draggable onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag !== null && drag !== i) move(drag, i); setDrag(null); }}
                        className="overflow-hidden rounded-lg bg-white ring-1 ring-slate-200">
                        <div className="relative aspect-video bg-slate-100">
                            {img.media.url && <img src={img.media.url} alt="" className="size-full object-cover" />}
                            <span className="absolute left-1 top-1 cursor-grab rounded bg-white/90 p-1 text-slate-500" title="Drag to reorder"><GripVertical className="size-4" /></span>
                            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove image" className="absolute right-1 top-1 rounded bg-white/90 p-1 text-red-600 hover:bg-white"><Trash2 className="size-4" /></button>
                        </div>
                        <div className="space-y-1.5 p-2">
                            {(['bn', 'en'] as const).map((l) => (
                                <Input key={l} lang={l} placeholder={`Caption (${l.toUpperCase()})`} value={img.caption[l] ?? ''} className="py-1 text-xs"
                                    onChange={(e) => onChange(value.map((v, j) => (j === i ? { ...v, caption: { ...v.caption, [l]: e.target.value } } : v)))} />
                            ))}
                        </div>
                    </li>
                ))}
            </ul>
            <Btn variant="secondary" className="mt-3" onClick={() => setOpen(true)}><ImagePlus className="size-4" /> Add images</Btn>
            <MediaLibraryModal open={open} onClose={() => setOpen(false)} multiple folder={folder} onSelect={(items) => onChange([...value, ...items.map((media) => ({ media, caption: {} }))])} />
        </div>
    );
}
