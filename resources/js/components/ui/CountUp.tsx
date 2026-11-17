import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { formatNumber } from '@/lib/utils';
import { useInView } from './Reveal';

/** Counts up to a real value once visible (instant with reduced motion). */
export function CountUp({ value, duration = 1200 }: { value: number; duration?: number }) {
    const { locale } = useI18n();
    const [ref, seen] = useInView<HTMLSpanElement>();
    const [shown, setShown] = useState(0);

    useEffect(() => {
        if (!seen) return;
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        let frame = 0;
        const start = performance.now();
        const tick = (now: number) => {
            const p = reduce ? 1 : Math.min(1, (now - start) / duration);
            setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
            if (p < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [seen, value, duration]);

    return <span ref={ref} aria-label={formatNumber(value, locale)}><span aria-hidden>{formatNumber(shown, locale)}</span></span>;
}
