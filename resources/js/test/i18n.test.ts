import { describe, expect, it } from 'vitest';
import bn from '@/locales/bn';
import en from '@/locales/en';

const keys = (o: object, p = ''): string[] =>
    Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`]));

describe('locale dictionaries', () => {
    it('have identical keys and no empty strings', () => {
        expect(keys(bn).sort()).toEqual(keys(en).sort());
        for (const dict of [bn, en]) {
            expect(keys(dict).filter((k) => !k.split('.').reduce<unknown>((o, s) => (o as Record<string, unknown>)[s], dict))).toEqual([]);
        }
    });
});
