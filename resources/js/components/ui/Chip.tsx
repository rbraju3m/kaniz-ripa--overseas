import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Chip({ children, tone = 'green', className }: { children: ReactNode; tone?: 'green' | 'navy' | 'gold' | 'white'; className?: string }) {
    const tones = {
        green: 'bg-brand-green-100 text-brand-green-800',
        navy: 'bg-navy-50 text-navy-700',
        gold: 'bg-gold-100 text-gold-700',
        white: 'bg-white/90 text-navy-900 backdrop-blur',
    };
    return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone], className)}>{children}</span>;
}

/** Filter tabs with a highlight that slides to the selected option. */
export function FilterPills<T extends string>({ options, value, onChange, label }: {
    options: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; label: string;
}) {
    const wrap = useRef<HTMLDivElement>(null);
    const [box, setBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

    useLayoutEffect(() => {
        const measure = () => {
            const el = wrap.current?.querySelector<HTMLElement>('[aria-selected="true"]');
            if (el) setBox({ left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight });
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [value, options.length]);

    return (
        <div ref={wrap} role="tablist" aria-label={label} className="relative -mx-4 mb-10 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {box && <span aria-hidden className="absolute rounded-full bg-navy-900 shadow-soft transition-all duration-300 ease-out" style={box} />}
            {options.map((o) => (
                <button
                    key={o.value}
                    role="tab"
                    aria-selected={o.value === value}
                    onClick={() => onChange(o.value)}
                    className={cn(
                        'relative z-10 shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 active:scale-95',
                        o.value === value ? 'text-white' : 'bg-white text-navy-800 ring-1 ring-navy-100 hover:ring-navy-300',
                        o.value === value && !box && 'bg-navy-900',
                    )}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}
