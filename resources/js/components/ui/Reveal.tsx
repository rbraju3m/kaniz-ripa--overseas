import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** True once the element has scrolled into view (stays true). Visible at once without IntersectionObserver. */
export function useInView<T extends Element>(rootMargin = '0px 0px -10% 0px') {
    const ref = useRef<T>(null);
    const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined');
    useEffect(() => {
        const el = ref.current;
        if (!el || seen) return;
        const io = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) { setSeen(true); io.disconnect(); }
        }, { rootMargin });
        io.observe(el);
        return () => io.disconnect();
    }, [rootMargin, seen]);
    return [ref, seen] as const;
}

/**
 * Soft fade-and-rise when the content scrolls into view. `stagger` animates direct
 * children one after another (card grids). Respects prefers-reduced-motion via CSS.
 */
export function Reveal({ as: Tag = 'div', stagger = false, className, children }: { as?: ElementType; stagger?: boolean; className?: string; children: ReactNode }) {
    const [ref, seen] = useInView<HTMLDivElement>();
    return (
        <Tag ref={ref} data-reveal={stagger ? 'stagger' : ''} className={cn(seen && 'is-visible', className)}>
            {children}
        </Tag>
    );
}
