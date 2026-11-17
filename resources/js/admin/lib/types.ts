import type { Locale, Media } from '@/lib/types';

export type { Locale, Media };

export interface AdminUser {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    last_login_at: string | null;
    roles: string[];
    is_super_admin: boolean;
    permissions: string[];
    created_at?: string;
}

export type PublishStatus = 'draft' | 'published' | 'archived';

export interface TranslationRow {
    locale: Locale;
    is_reviewed: boolean;
    reviewed_at: string | null;
    [field: string]: unknown;
}

/** Generic admin record (AdminResource): attributes + snake_cased relations. */
export interface AdminRecord {
    id: number;
    status?: PublishStatus;
    translations?: Partial<Record<Locale, TranslationRow>>;
    updated_at?: string;
    [key: string]: unknown;
}

export interface Paginated<T> {
    data: T[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
}

export interface ReferenceData {
    countries: { id: number; bn: string | null; en: string | null; iso2: string }[];
    industries: { id: number; bn: string | null; en: string | null; key: string }[];
    companies: { id: number; name: string; verification_status: string }[];
    gallery_categories: { id: number; bn: string | null; en: string | null; slug: string }[];
}

export interface MediaItem {
    id: number;
    url: string | null;
    variant_urls?: Record<string, string>;
    original_name: string;
    mime: string;
    size: number;
    width: number | null;
    height: number | null;
    alt: Partial<Record<Locale, string>> | null;
    folder: string;
    created_at: string;
}
