import { describe, expect, it } from 'vitest';
import { slugify } from '@/admin/lib/format';
import { toPayload, toValues } from '@/admin/lib/formModel';
import { pagesConfig, portfoliosConfig, storiesConfig } from '@/admin/resources/configs';
import type { AdminRecord } from '@/admin/lib/types';

describe('slugify', () => {
    it('keeps Bangla letters and joins words with hyphens', () => {
        expect(slugify('Factory Workers — Malaysia 2026!')).toBe('factory-workers-malaysia-2026');
        expect(slugify('মালয়েশিয়ায় কর্মী নিয়োগ')).toBe('মালয়েশিয়ায়-কর্মী-নিয়োগ');
    });
});

describe('form model', () => {
    const record: AdminRecord = {
        id: 7, status: 'published', company_id: 2, country_id: 3, industry_id: null, project_date: '2026-10-28', is_featured: true, sort: 0,
        cover_media_id: 11, cover: { id: 11, url: '/storage/a.webp', variants: {}, width: 1, height: 1, alt: null },
        images: [{ id: 1, media_id: 12, caption: { en: 'Day 1' }, media: { id: 12, url: '/storage/b.webp' } }],
        translations: {
            en: { locale: 'en', is_reviewed: true, reviewed_at: null, title: 'Title', slug: 'title', summary: 'S', description: '<p>D</p>', activities: 'A' },
        },
    };

    it('maps a record to form values (media, gallery, translations)', () => {
        const v = toValues(portfoliosConfig, record);
        expect(v.cover_media_id).toEqual({ id: 11, url: '/storage/a.webp' });
        expect(v.images).toEqual([{ media: { id: 12, url: '/storage/b.webp' }, caption: { en: 'Day 1' } }]);
        expect(v.translations.en.is_reviewed).toBe(true);
        expect(v.translations.bn).toMatchObject({ title: '', is_reviewed: false });
        expect(v.status).toBe('published');
    });

    it('builds an API payload and omits empty locales', () => {
        const p = toPayload(portfoliosConfig, toValues(portfoliosConfig, record));
        expect(p.cover_media_id).toBe(11);
        expect(p.images).toEqual([{ media_id: 12, caption: { en: 'Day 1' } }]);
        expect(Object.keys(p.translations as object)).toEqual(['en']);
        expect(p).not.toHaveProperty('cover');
    });

    it('treats rich text containing only empty tags as empty', () => {
        const v = toValues(portfoliosConfig);
        v.translations.bn.description = '<p><br></p>';
        expect(toPayload(portfoliosConfig, v).translations).toEqual({});
    });

    it('derives the consent switch from consent_confirmed_at', () => {
        const v = toValues(storiesConfig, { id: 1, consent_confirmed_at: '2026-11-01T00:00:00Z', translations: {} });
        expect(v.consent_confirmed).toBe(true);
    });

    it('serialises page sections with media ids and only filled locales', () => {
        const v = toValues(pagesConfig);
        v.sections = [{ key: 'integrity', icon: '', media: { id: 5, url: null }, is_active: true, translations: { bn: { title: 'সততা', body: '', is_reviewed: true }, en: { title: '', body: '', is_reviewed: false } } }];
        const p = toPayload(pagesConfig, v);
        expect(p.sections).toEqual([{ key: 'integrity', icon: null, media_id: 5, is_active: true, translations: { bn: { title: 'সততা', body: '', is_reviewed: true } } }]);
    });
});
