import clsx, { type ClassValue } from 'clsx';
import type { Locale } from './types';

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

const intlLocale = (locale: Locale) => (locale === 'bn' ? 'bn-BD' : 'en-GB');

export function formatDate(value: string | null | undefined, locale: Locale, opts: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' }): string {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(intlLocale(locale), opts).format(date);
}

export function formatNumber(value: number, locale: Locale): string {
    return new Intl.NumberFormat(intlLocale(locale)).format(value);
}

export function formatBytes(bytes: number, locale: Locale): string {
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${formatNumber(Math.round(mb * 10) / 10, locale)} MB` : `${formatNumber(Math.max(1, Math.round(bytes / 1024)), locale)} KB`;
}

/** Bangladeshi local numbers → international format for tel:/WhatsApp links. */
export function toE164(number: string): string {
    const digits = number.replace(/[^\d+]/g, '');
    if (digits.startsWith('+')) return digits;
    if (digits.startsWith('880')) return `+${digits}`;
    if (digits.startsWith('0')) return `+880${digits.slice(1)}`;
    return digits;
}

export function whatsappLink(number: string): string {
    return `https://wa.me/${toE164(number).replace('+', '')}`;
}

/** Embed URL for YouTube/Vimeo links; null for unsupported hosts. */
export function videoEmbedUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    try {
        const u = new URL(url);
        const host = u.hostname.replace(/^www\./, '');
        if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;
        if (host === 'youtube.com') {
            const id = u.searchParams.get('v') ?? u.pathname.split('/').pop();
            return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
        }
        if (host === 'vimeo.com') return `https://player.vimeo.com/video/${u.pathname.split('/').filter(Boolean)[0]}`;
    } catch {
        return null;
    }
    return null;
}

/** Plain-text multiline field → list items. */
export const lines = (text: string | null | undefined): string[] =>
    (text ?? '').split(/\r?\n/).map((l) => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
