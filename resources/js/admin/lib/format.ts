import type { AdminRecord } from './types';

/** Best human title for a record: EN/BN title or name. */
export function recordTitle(r: AdminRecord, field = 'title'): string {
    const t = r.translations;
    const pick = (l: 'en' | 'bn') => (t?.[l]?.[field] as string | undefined) || undefined;
    return pick('en') ?? pick('bn') ?? (r.name as string | undefined) ?? (r.key as string | undefined) ?? `#${r.id}`;
}

export const dateTime = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
export const date = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { dateStyle: 'medium' }) : '—');

export function bytes(n: number): string {
    if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(n / 1024))} KB`;
}

/** Unicode-friendly slug: keeps Bangla letters and marks, joins words with hyphens. */
export function slugify(text: string): string {
    return text
        .normalize('NFC')
        .toLowerCase()
        .trim()
        .replace(/['’"]/g, '')
        .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 180);
}
