import { Loader2, X } from 'lucide-react';
import { forwardRef, useEffect, useRef, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const inputClass = 'block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-navy-600 disabled:bg-slate-50 disabled:text-slate-500 aria-[invalid=true]:ring-red-400';

export const Input = forwardRef<HTMLInputElement, ComponentProps<'input'>>(({ className, ...p }, ref) => <input ref={ref} className={cn(inputClass, className)} {...p} />);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<'textarea'>>(({ className, ...p }, ref) => <textarea ref={ref} className={cn(inputClass, 'min-h-24 resize-y', className)} {...p} />);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, ComponentProps<'select'>>(({ className, ...p }, ref) => <select ref={ref} className={cn(inputClass, 'pr-8', className)} {...p} />);
Select.displayName = 'Select';

export function Field({ label, error, help, children, className, required }: { label: string; error?: string; help?: ReactNode; children: ReactNode; className?: string; required?: boolean }) {
    return (
        <label className={cn('block', className)}>
            <span className="mb-1 block text-sm font-medium text-slate-800">{label}{required && <span className="text-red-500"> *</span>}</span>
            {children}
            {help && !error && <span className="mt-1 block text-xs text-slate-500">{help}</span>}
            {error && <span role="alert" className="mt-1 block text-xs text-red-600">{error}</span>}
        </label>
    );
}

export function Switch({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: ReactNode; disabled?: boolean }) {
    return (
        <label className={cn('flex items-start gap-3', disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer')}>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onChange(!checked)}
                className={cn('relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-full transition', checked ? 'bg-brand-green-600' : 'bg-slate-300')}
            >
                <span className={cn('absolute top-0.5 size-4 rounded-full bg-white shadow transition', checked ? 'left-[18px]' : 'left-0.5')} />
            </button>
            <span>
                <span className="block text-sm font-medium text-slate-800">{label}</span>
                {description && <span className="block text-xs text-slate-500">{description}</span>}
            </span>
        </label>
    );
}

type BtnVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
const btn: Record<BtnVariant, string> = {
    primary: 'bg-navy-900 text-white hover:bg-navy-800',
    secondary: 'bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-slate-700 hover:bg-slate-100',
};

export function Btn({ variant = 'primary', loading, className, children, size = 'md', ...p }: ComponentProps<'button'> & { variant?: BtnVariant; loading?: boolean; size?: 'sm' | 'md' }) {
    return (
        <button
            type="button"
            className={cn('inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:pointer-events-none disabled:opacity-50', size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-sm', btn[variant], className)}
            disabled={loading || p.disabled}
            {...p}
        >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {children}
        </button>
    );
}

export function Card({ title, actions, children, className }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
    return (
        <section className={cn('rounded-xl bg-white shadow-sm ring-1 ring-slate-200', className)}>
            {(title || actions) && (
                <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
                    <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
                    {actions}
                </header>
            )}
            <div className="p-5">{children}</div>
        </section>
    );
}

export function PageTitle({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
    return (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
    );
}

const badgeTones = {
    green: 'bg-brand-green-100 text-brand-green-800',
    gray: 'bg-slate-100 text-slate-700',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-navy-100 text-navy-800',
};
export function Badge({ tone = 'gray', children }: { tone?: keyof typeof badgeTones; children: ReactNode }) {
    return <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', badgeTones[tone])}>{children}</span>;
}

export function StatusBadge({ status }: { status?: string | null }) {
    const published = status === 'published';
    return <Badge tone={published ? 'green' : 'amber'}>{published ? 'Published' : 'Unpublished'}</Badge>;
}

/** Shows which locales have a reviewed (publicly visible) translation. */
export function ReviewBadges({ translations }: { translations?: Partial<Record<'bn' | 'en', { is_reviewed: boolean }>> }) {
    return (
        <span className="inline-flex gap-1">
            {(['bn', 'en'] as const).map((l) => {
                const t = translations?.[l];
                return <Badge key={l} tone={!t ? 'gray' : t.is_reviewed ? 'green' : 'amber'}>{l.toUpperCase()}{!t ? ' –' : t.is_reviewed ? ' ✓' : ' …'}</Badge>;
            })}
        </span>
    );
}

export function Spinner({ className }: { className?: string }) {
    return <Loader2 className={cn('size-5 animate-spin text-slate-400', className)} aria-label="Loading" />;
}

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) return;
        const prev = document.activeElement as HTMLElement | null;
        ref.current?.focus();
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => { window.removeEventListener('keydown', onKey); prev?.focus(); };
    }, [open, onClose]);
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onMouseDown={onClose}>
            <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}
                className={cn('flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl outline-none sm:rounded-2xl', wide ? 'sm:max-w-5xl' : 'sm:max-w-lg')}>
                <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                    <h2 className="font-semibold text-slate-900">{title}</h2>
                    <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><X className="size-5" /></button>
                </header>
                <div className="overflow-y-auto p-5">{children}</div>
                {footer && <footer className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</footer>}
            </div>
        </div>
    );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel, loading }: {
    open: boolean; title: string; message: ReactNode; confirmLabel?: string; onConfirm: () => void; onCancel: () => void; loading?: boolean;
}) {
    return (
        <Modal open={open} onClose={onCancel} title={title} footer={<><Btn variant="secondary" onClick={onCancel}>Cancel</Btn><Btn variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Btn></>}>
            <div className="text-sm text-slate-700">{message}</div>
        </Modal>
    );
}

export function Table({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: boolean }) {
    return (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>{head.map((h, i) => <th key={i} scope="col" className="whitespace-nowrap px-4 py-3">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {children}
                    {empty && <tr><td colSpan={head.length} className="px-4 py-12 text-center text-slate-500">Nothing here yet.</td></tr>}
                </tbody>
            </table>
        </div>
    );
}

export function Pager({ meta, onPage }: { meta?: { current_page: number; last_page: number; total: number }; onPage: (p: number) => void }) {
    if (!meta || meta.last_page <= 1) return meta ? <p className="mt-3 text-xs text-slate-500">{meta.total} item(s)</p> : null;
    return (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <span>{meta.total} item(s)</span>
            <div className="flex items-center gap-2">
                <Btn size="sm" variant="secondary" disabled={meta.current_page <= 1} onClick={() => onPage(meta.current_page - 1)}>Previous</Btn>
                <span>Page {meta.current_page} / {meta.last_page}</span>
                <Btn size="sm" variant="secondary" disabled={meta.current_page >= meta.last_page} onClick={() => onPage(meta.current_page + 1)}>Next</Btn>
            </div>
        </div>
    );
}
