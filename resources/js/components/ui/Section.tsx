import { Fragment, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Reveal } from './Reveal';

export function Section({ id, className, children, tone = 'white', reveal = true }: { id?: string; className?: string; children: ReactNode; tone?: 'white' | 'mint' | 'navy' | 'slate'; reveal?: boolean }) {
    const tones = {
        white: 'bg-white',
        mint: 'bg-brand-green-50',
        slate: 'bg-slate-50',
        navy: 'bg-navy-900 text-navy-100',
    };
    return (
        <section id={id} className={cn('py-16 sm:py-20 lg:py-24', tones[tone], className)}>
            {reveal ? <Reveal className="container-page">{children}</Reveal> : <div className="container-page">{children}</div>}
        </section>
    );
}

export function SectionHeading({ eyebrow, title, lead, align = 'left', action, dark = false }: {
    eyebrow?: string; title: string; lead?: string | null; align?: 'left' | 'center'; action?: ReactNode; dark?: boolean;
}) {
    return (
        <div className={cn('mb-10 flex flex-col gap-4 sm:mb-12', align === 'center' ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between')}>
            <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
                {eyebrow && (
                    <p className={cn('tracking-eyebrow mb-3 flex items-center gap-3 text-xs font-semibold', align === 'center' && 'justify-center', dark ? 'text-gold-300' : 'text-gold-700')}>
                        <span aria-hidden className="h-px w-0 bg-current transition-[width] delay-200 duration-700 in-[.is-visible]:w-8" />
                        {eyebrow}
                    </p>
                )}
                <h2 className={cn('text-3xl font-bold sm:text-4xl', dark && 'text-white')}>
                    {/* Words rise in one after another once the section is revealed. */}
                    {title.split(' ').map((word, i) => (
                        <Fragment key={i}>
                            {i > 0 && ' '}
                            <span className="inline-block translate-y-3 opacity-0 transition duration-700 ease-out in-[.is-visible]:translate-y-0 in-[.is-visible]:opacity-100" style={{ transitionDelay: `${120 + i * 70}ms` }}>{word}</span>
                        </Fragment>
                    ))}
                </h2>
                {lead && <p className={cn('mt-4 text-lg', dark ? 'text-navy-200' : 'text-slate-600')}>{lead}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}

export function PageHeader({ title, lead, children }: { title: string; lead?: string | null; children?: ReactNode }) {
    return (
        <header className="relative overflow-hidden bg-navy-900 pb-14 pt-28 text-white sm:pb-16 sm:pt-36">
            <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full border-[40px] border-white/5" />
            <div aria-hidden className="pointer-events-none absolute -bottom-32 left-1/3 size-80 animate-float-slow rounded-full bg-brand-green-700/25 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -top-40 right-1/4 size-96 animate-float-slower rounded-full bg-royal-600/30 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.05)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,#000,transparent)]" />
            <div className="container-page relative">
                {children}
                <h1 className="max-w-3xl animate-fade-up text-4xl font-bold text-white sm:text-5xl">{title}</h1>
                {lead && <p className="mt-4 max-w-2xl animate-fade-up text-lg text-navy-200 [animation-delay:90ms]">{lead}</p>}
                <div aria-hidden className="mt-8 h-1 w-16 origin-left animate-fade-up rounded-full bg-gradient-to-r from-gold-500 to-gold-300 [animation-delay:180ms]" />
            </div>
        </header>
    );
}
