import { createContext, useContext, useMemo, type ReactNode } from 'react';
import bn from '@/locales/bn';
import en, { type Messages } from '@/locales/en';
import type { Locale } from './types';

const dictionaries: Record<Locale, Messages> = { bn, en };

interface I18nValue {
    locale: Locale;
    t: Messages;
    /** Prefix a path with the current locale: path('/portfolio') → '/bn/portfolio'. */
    path: (to?: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export const isLocale = (value: unknown): value is Locale => value === 'bn' || value === 'en';

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
    const value = useMemo<I18nValue>(() => ({
        locale,
        t: dictionaries[locale],
        path: (to = '') => `/${locale}${to && !to.startsWith('/') ? '/' : ''}${to}`.replace(/\/$/, '') || `/${locale}`,
    }), [locale]);

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
    const ctx = useContext(I18nContext);
    if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
    return ctx;
}

/** Swap the locale segment of a pathname, optionally replacing the detail slug. */
export function switchLocalePath(pathname: string, target: Locale, slugForTarget?: string | null): string {
    const parts = pathname.split('/').filter(Boolean);
    if (isLocale(parts[0])) parts[0] = target;
    else parts.unshift(target);
    if (slugForTarget && parts.length >= 3) parts[2] = slugForTarget;
    return `/${parts.join('/')}`;
}
