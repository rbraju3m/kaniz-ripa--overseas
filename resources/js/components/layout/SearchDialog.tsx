import { useQuery } from '@tanstack/react-query';
import { Briefcase, Building2, CornerDownLeft, Search, UserRound, Wrench, X, type LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { getJson } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import type { Paginated, Partner, Portfolio, Service, TeamMember } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Result { key: string; group: string; icon: LucideIcon; title: string; sub?: string | null; to: string }

/** Lower-cases and strips accents so "vietnam" matches "Vietnam" and Bangla matches as typed. */
const norm = (s: string) => s.toLocaleLowerCase().normalize('NFKD').replace(/\p{M}+/gu, (m) => (/[ঀ-৿]/.test(m) ? m : ''));

/** Site-wide search (Ctrl/Cmd + K): services, projects, partners and team, filtered in the browser. */
export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { t, locale, path } = useI18n();
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const [q, setQ] = useState('');
    const [active, setActive] = useState(0);

    // Loaded the first time the dialog opens, then cached per language.
    const { data, isLoading } = useQuery({
        queryKey: ['search-index', locale],
        enabled: open,
        staleTime: 5 * 60_000,
        queryFn: async () => {
            const [services, projects, partners, team] = await Promise.all([
                getJson<{ data: Service[] }>('/services', { locale }),
                getJson<Paginated<Portfolio>>('/portfolios', { locale, per_page: 50 }),
                getJson<{ data: Partner[] }>('/partners', { locale }),
                getJson<{ data: TeamMember[] }>('/team', { locale }),
            ]);
            return { services: services.data, projects: projects.data, partners: partners.data, team: team.data };
        },
    });

    const all = useMemo<Result[]>(() => data ? [
        ...data.services.map((s) => ({ key: `s${s.id}`, group: t.search.services, icon: Wrench, title: s.title ?? '', sub: s.summary, to: path(`services/${s.slug}`) })),
        ...data.projects.map((p) => ({ key: `p${p.id}`, group: t.search.projects, icon: Briefcase, title: p.title ?? '', sub: [p.country?.name, p.company?.name].filter(Boolean).join(' · '), to: path(`portfolio/${p.slug}`) })),
        ...data.partners.map((p) => ({ key: `c${p.id}`, group: t.search.partners, icon: Building2, title: p.name, sub: [p.industry?.name, p.country?.name].filter(Boolean).join(' · '), to: path(`partners/${p.slug}`) })),
        ...data.team.map((m) => ({ key: `t${m.id}`, group: t.search.team, icon: UserRound, title: m.name ?? '', sub: m.role, to: path('about') })),
    ] : [], [data, t, path]);

    const results = useMemo(() => {
        const terms = norm(q.trim()).split(/\s+/).filter(Boolean);
        const list = terms.length ? all.filter((r) => { const hay = norm(`${r.title} ${r.sub ?? ''}`); return terms.every((w) => hay.includes(w)); }) : all;
        return list.slice(0, 30);
    }, [all, q]);

    useEffect(() => {
        if (!open) return;
        const id = window.setTimeout(() => inputRef.current?.focus(), 30);
        document.body.style.overflow = 'hidden';
        return () => { window.clearTimeout(id); document.body.style.overflow = ''; };
    }, [open]);

    useEffect(() => {
        listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
    }, [active]);

    const close = () => { setQ(''); setActive(0); onClose(); };
    const go = (r: Result | undefined) => { if (!r) return; close(); navigate(r.to); };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') { e.preventDefault(); close(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
        else if (e.key === 'Enter') { e.preventDefault(); go(results[active]); }
    };

    let lastGroup = '';
    return (
        <div className={cn('fixed inset-0 z-[70]', open ? 'visible' : 'invisible')} aria-hidden={!open}>
            <div onClick={close} className={cn('absolute inset-0 bg-navy-950/60 backdrop-blur-sm transition-opacity duration-200', open ? 'opacity-100' : 'opacity-0')} />
            <div role="dialog" aria-modal="true" aria-label={t.search.open} onKeyDown={onKeyDown} {...(!open && { inert: true })}
                className={cn('relative mx-auto mt-[10vh] w-[min(40rem,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 transition duration-200', open ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-3 scale-95 opacity-0')}>
                <div className="flex items-center gap-3 border-b border-slate-100 px-4">
                    <Search className="size-5 shrink-0 text-slate-400" aria-hidden />
                    <input ref={inputRef} value={q} onChange={(e) => { setQ(e.target.value); setActive(0); }} placeholder={t.search.placeholder}
                        role="combobox" aria-expanded aria-controls="search-results" aria-activedescendant={results[active] ? `sr-${results[active].key}` : undefined}
                        className="h-14 min-w-0 flex-1 border-0 bg-transparent text-base text-navy-900 outline-none placeholder:text-slate-400" />
                    <button type="button" onClick={close} aria-label={t.contactFab.close} className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X className="size-4" /></button>
                </div>
                <ul id="search-results" ref={listRef} role="listbox" className="max-h-[60vh] overflow-y-auto p-2">
                    {isLoading && <li className="px-3 py-8 text-center text-sm text-slate-500">…</li>}
                    {!isLoading && results.length === 0 && <li className="px-3 py-8 text-center text-sm text-slate-500">{q ? <>{t.search.empty} “{q}”</> : t.search.hint}</li>}
                    {results.map((r, i) => {
                        const header = r.group !== lastGroup ? r.group : null;
                        lastGroup = r.group;
                        const Icon = r.icon;
                        return (
                            <li key={r.key} role="presentation">
                                {header && <p className="px-3 pb-1 pt-3 text-xs font-semibold text-slate-400">{header}</p>}
                                <button id={`sr-${r.key}`} role="option" aria-selected={i === active} data-index={i} type="button" onMouseMove={() => setActive(i)} onClick={() => go(r)}
                                    className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition', i === active ? 'bg-navy-50' : '')}>
                                    <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg transition', i === active ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-500')}><Icon className="size-4" /></span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold text-navy-900">{r.title}</span>
                                        {r.sub && <span className="block truncate text-xs text-slate-500">{r.sub}</span>}
                                    </span>
                                    {i === active && <CornerDownLeft className="size-4 shrink-0 text-slate-400" aria-hidden />}
                                </button>
                            </li>
                        );
                    })}
                </ul>
                <div className="hidden items-center gap-4 border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500 sm:flex">
                    <span><kbd className="rounded bg-slate-100 px-1.5">↑</kbd> <kbd className="rounded bg-slate-100 px-1.5">↓</kbd> {t.search.navigate}</span>
                    <span><kbd className="rounded bg-slate-100 px-1.5">Enter</kbd> {t.search.select}</span>
                    <span><kbd className="rounded bg-slate-100 px-1.5">Esc</kbd> {t.search.close}</span>
                </div>
            </div>
        </div>
    );
}
