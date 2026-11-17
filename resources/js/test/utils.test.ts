import { describe, expect, it } from 'vitest';
import { switchLocalePath } from '@/lib/i18n';
import { lines, toE164, videoEmbedUrl, whatsappLink } from '@/lib/utils';

describe('switchLocalePath', () => {
    it('swaps the locale segment and keeps the rest', () => {
        expect(switchLocalePath('/bn/portfolio', 'en')).toBe('/en/portfolio');
        expect(switchLocalePath('/en', 'bn')).toBe('/bn');
    });
    it('uses the translated slug on detail pages', () => {
        expect(switchLocalePath('/en/portfolio/factory-workers', 'bn', 'কারখানা-কর্মী')).toBe('/bn/portfolio/কারখানা-কর্মী');
    });
});

describe('phone helpers', () => {
    it('normalises Bangladeshi numbers to E.164', () => {
        expect(toE164('01732803369')).toBe('+8801732803369');
        expect(toE164('+880 2222270423')).toBe('+8802222270423');
        expect(whatsappLink('01611444882')).toBe('https://wa.me/8801611444882');
    });
});

describe('videoEmbedUrl', () => {
    it('supports YouTube and Vimeo, rejects others', () => {
        expect(videoEmbedUrl('https://www.youtube.com/watch?v=abc123')).toBe('https://www.youtube-nocookie.com/embed/abc123');
        expect(videoEmbedUrl('https://youtu.be/xyz')).toBe('https://www.youtube-nocookie.com/embed/xyz');
        expect(videoEmbedUrl('https://vimeo.com/42')).toBe('https://player.vimeo.com/video/42');
        expect(videoEmbedUrl('https://evil.example/v.mp4')).toBeNull();
        expect(videoEmbedUrl('javascript:alert(1)')).toBeNull();
    });
});

describe('lines', () => {
    it('splits poster-style multiline text into items', () => {
        expect(lines('Heavy driver\n- Indoor cleaner\n\n• City cleaner')).toEqual(['Heavy driver', 'Indoor cleaner', 'City cleaner']);
    });
});
