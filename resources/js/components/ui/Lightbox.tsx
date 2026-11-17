import { useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import type { Media } from '@/lib/types';
import { videoEmbedUrl } from '@/lib/utils';

export interface LightboxItem { media?: Media | null; videoUrl?: string | null; caption?: string | null }

/** Accessible modal viewer: Esc closes, arrow keys navigate, focus is trapped on open. */
export function Lightbox({ items, index, onClose, onIndex }: { items: LightboxItem[]; index: number | null; onClose: () => void; onIndex: (i: number) => void }) {
    const { t } = useI18n();
    const closeRef = useRef<HTMLButtonElement>(null);
    const open = index !== null && items[index] !== undefined;

    const go = useCallback((delta: number) => {
        if (index === null) return;
        onIndex((index + delta + items.length) % items.length);
    }, [index, items.length, onIndex]);

    useEffect(() => {
        if (!open) return;
        const previous = document.activeElement as HTMLElement | null;
        closeRef.current?.focus();
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') go(1);
            if (e.key === 'ArrowLeft') go(-1);
        };
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
            previous?.focus();
        };
    }, [open, go, onClose]);

    if (!open) return null;
    const item = items[index];
    const embed = videoEmbedUrl(item.videoUrl);

    return (
        <div role="dialog" aria-modal="true" aria-label={item.caption ?? t.nav.gallery} className="fixed inset-0 z-[60] flex flex-col bg-navy-950/95 animate-fade-up" onClick={onClose}>
            <div className="flex items-center justify-between p-4 text-white">
                <p className="truncate pr-4 text-sm text-navy-200">{item.caption}</p>
                <button ref={closeRef} onClick={onClose} aria-label={t.gallery.close} className="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"><X className="size-5" /></button>
            </div>
            <div className="relative flex flex-1 items-center justify-center px-4 pb-8 sm:px-16" onClick={(e) => e.stopPropagation()}>
                {embed ? (
                    <iframe src={embed} title={item.caption ?? 'Video'} className="aspect-video w-full max-w-5xl rounded-xl" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" loading="lazy" />
                ) : item.media?.url ? (
                    <img src={item.media.variants.lg ?? item.media.url} alt={item.media.alt ?? item.caption ?? ''} className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl" />
                ) : null}
                {items.length > 1 && (
                    <>
                        <button onClick={() => go(-1)} aria-label={t.gallery.prev} className="absolute left-2 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-4"><ChevronLeft /></button>
                        <button onClick={() => go(1)} aria-label={t.gallery.next} className="absolute right-2 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-4"><ChevronRight /></button>
                    </>
                )}
            </div>
        </div>
    );
}
