import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { api, validationErrors } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import type { Messages } from '@/locales/en';
import { cn } from '@/lib/utils';
import { Button } from '../ui/Button';

export const contactSchema = (t: Messages) => z.object({
    name: z.string().trim().min(2, t.contact.required).max(120),
    email: z.union([z.literal(''), z.email(t.contact.invalidEmail).max(190)]),
    phone: z.union([z.literal(''), z.string().trim().regex(/^[0-9+\-\s()]{6,30}$/, t.contact.invalidPhone)]),
    subject: z.string().trim().max(190),
    message: z.string().trim().min(10, t.contact.messageMin).max(5000),
    website: z.string().max(0), // honeypot
}).refine((v) => v.email !== '' || v.phone !== '', { message: t.contact.contactRequired, path: ['email'] });

export type ContactValues = z.infer<ReturnType<typeof contactSchema>>;

function Field({ label, error, children, className }: { label: string; error?: string; children: ReactNode; className?: string }) {
    return (
        <label className={cn('block', className)}>
            <span className="mb-1.5 block text-sm font-medium text-navy-900">{label}</span>
            {children}
            {error && <span role="alert" className="mt-1.5 block text-sm text-red-600">{error}</span>}
        </label>
    );
}

const input = 'block w-full rounded-xl border-0 bg-white px-4 py-3 text-navy-950 shadow-sm ring-1 ring-slate-200 transition placeholder:text-slate-400 focus:ring-2 focus:ring-brand-green-600 aria-[invalid=true]:ring-red-400';

export function ContactForm() {
    const { t, locale } = useI18n();
    const schema = useMemo(() => contactSchema(t), [t]);
    const form = useForm<ContactValues>({
        resolver: zodResolver(schema),
        defaultValues: { name: '', email: '', phone: '', subject: '', message: '', website: '' },
    });
    const { register, handleSubmit, formState: { errors }, setError, reset } = form;

    const mutation = useMutation({
        mutationFn: (values: ContactValues) => api.post('/contact', values, { params: { locale } }),
        onSuccess: () => reset(),
        onError: (error) => {
            const errs = validationErrors(error);
            if (errs) Object.entries(errs).forEach(([k, v]) => setError(k as keyof ContactValues, { message: v[0] }));
        },
    });

    const tooMany = mutation.error instanceof AxiosError && mutation.error.response?.status === 429;

    if (mutation.isSuccess) {
        return (
            <div role="status" className="relative flex animate-fade-up flex-col items-center overflow-hidden rounded-card bg-brand-green-50 px-6 py-12 text-center ring-1 ring-brand-green-200">
                <div aria-hidden className="absolute -top-16 size-56 rounded-full bg-gold-300/25 blur-3xl" />
                <span className="relative mb-5 grid size-16 place-items-center">
                    <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-brand-green-500/30 [animation-iteration-count:2]" />
                    <span className="relative grid size-16 place-items-center rounded-full bg-brand-green-700 text-white shadow-lift animate-[pop_0.5s_cubic-bezier(0.2,0.9,0.3,1.4)_both]">
                        <CheckCircle2 className="size-8" />
                    </span>
                </span>
                <p className="relative max-w-sm text-lg text-navy-900">{t.contact.success}</p>
                <Button variant="secondary" size="sm" className="mt-6" onClick={() => mutation.reset()}>{t.contact.formTitle}</Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="grid gap-5 sm:grid-cols-2">
            <Field label={t.contact.name} error={errors.name?.message} className="sm:col-span-2">
                <input {...register('name')} autoComplete="name" aria-invalid={!!errors.name} className={input} />
            </Field>
            <Field label={t.contact.emailField} error={errors.email?.message}>
                <input {...register('email')} type="email" autoComplete="email" aria-invalid={!!errors.email} className={input} />
            </Field>
            <Field label={t.contact.phoneField} error={errors.phone?.message}>
                <input {...register('phone')} type="tel" autoComplete="tel" inputMode="tel" aria-invalid={!!errors.phone} className={input} />
            </Field>
            <Field label={t.contact.subject} error={errors.subject?.message} className="sm:col-span-2">
                <input {...register('subject')} className={input} />
            </Field>
            <Field label={t.contact.message} error={errors.message?.message} className="sm:col-span-2">
                <textarea {...register('message')} rows={5} aria-invalid={!!errors.message} className={cn(input, 'resize-y')} />
            </Field>
            {/* Honeypot — hidden from people and assistive tech. */}
            <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label>Website<input {...register('website')} tabIndex={-1} autoComplete="off" /></label>
            </div>
            <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">{t.contact.privacy}</p>
                <Button type="submit" size="lg" disabled={mutation.isPending}>
                    {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    {mutation.isPending ? t.contact.sending : t.contact.send}
                </Button>
            </div>
            {(tooMany || (mutation.isError && !validationErrors(mutation.error))) && (
                <p role="alert" className="text-sm text-red-600 sm:col-span-2">{tooMany ? t.contact.tooMany : t.common.error}</p>
            )}
        </form>
    );
}
