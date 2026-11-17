import type { FieldValues } from 'react-hook-form';
import { toPicked, type GalleryValue, type PickedMedia } from '../components/MediaPicker';
import type { FieldDef, ResourceConfig } from '../resources/types';
import type { AdminRecord, Locale } from './types';

/** Maps between API records (AdminResource) and form values, and back to API payloads. */
const LOCALES: Locale[] = ['bn', 'en'];
const emptyFor = (f: FieldDef): unknown => (f.type === 'switch' ? false : f.type === 'gallery' || f.type === 'sections' ? [] : f.type === 'media' ? null : f.type === 'localized' ? {} : '');

type SectionValue = { key: string; icon: string; media: PickedMedia | null; is_active: boolean; translations: Record<Locale, { title: string; body: string; is_reviewed: boolean }> };

export function toValues(cfg: ResourceConfig, record?: AdminRecord): FieldValues {
    const v: FieldValues = {};
    for (const f of cfg.fields) {
        if (!record) { v[f.name] = cfg.defaults?.[f.name] ?? emptyFor(f); continue; }
        if (f.type === 'media') v[f.name] = toPicked(record[f.relation] as never);
        else if (f.type === 'gallery') v[f.name] = ((record.images as { media: never; caption: GalleryValue['caption'] | null }[] | undefined) ?? []).map((i) => ({ media: toPicked(i.media)!, caption: i.caption ?? {} }));
        else if (f.type === 'sections') v[f.name] = ((record.sections as AdminRecord[] | undefined) ?? []).map((s) => ({
            key: s.key, icon: s.icon ?? '', media: toPicked(s.media as never), is_active: s.is_active !== false,
            translations: Object.fromEntries(LOCALES.map((l) => [l, { title: s.translations?.[l]?.title ?? '', body: s.translations?.[l]?.body ?? '', is_reviewed: !!s.translations?.[l]?.is_reviewed }])),
        }));
        else v[f.name] = record[f.name] ?? emptyFor(f);
    }
    if (cfg.publishable) v.status = record?.status ?? 'draft';
    if (cfg.translatable) {
        v.translations = Object.fromEntries(LOCALES.map((l) => {
            const row = record?.translations?.[l];
            return [l, { ...Object.fromEntries((cfg.translationFields ?? []).map((f) => [f.name, (row?.[f.name] as string) ?? ''])), is_reviewed: row ? !!row.is_reviewed : !!cfg.reviewedByDefault }];
        }));
    }
    return record && cfg.fromRecord ? cfg.fromRecord(v, record) : v;
}

export function toPayload(cfg: ResourceConfig, values: FieldValues): Record<string, unknown> {
    const p: Record<string, unknown> = {};
    for (const f of cfg.fields) {
        const val = values[f.name];
        if (f.type === 'media') p[f.name] = (val as PickedMedia | null)?.id ?? null;
        else if (f.type === 'gallery') p.images = (val as GalleryValue[]).map((g) => ({ media_id: g.media.id, caption: g.caption }));
        else if (f.type === 'sections') p.sections = (val as SectionValue[]).map((s) => ({
            key: s.key, icon: s.icon || null, media_id: s.media?.id ?? null, is_active: s.is_active,
            translations: Object.fromEntries(LOCALES.filter((l) => s.translations[l]?.title || s.translations[l]?.body).map((l) => [l, s.translations[l]])),
        }));
        else p[f.name] = val === '' ? null : val;
    }
    if (cfg.publishable) p.status = values.status;
    if (cfg.translatable) {
        // Send only locales that have content; the API requires at least one.
        p.translations = Object.fromEntries(LOCALES.flatMap((l) => {
            const row = values.translations?.[l] ?? {};
            const hasContent = (cfg.translationFields ?? []).some((f) => String(row[f.name] ?? '').replace(/<[^>]*>/g, '').trim() !== '');
            return hasContent ? [[l, Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v === '' ? null : v]))]] : [];
        }));
    }
    return cfg.toPayload ? cfg.toPayload(p, values) : p;
}

