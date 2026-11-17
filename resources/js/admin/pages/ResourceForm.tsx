import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, Save, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FormProvider, useForm, useWatch, type FieldValues } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { cn } from '@/lib/utils';
import { FieldInput } from '../components/FieldInput';
import { useToast } from '../components/toast';
import { Btn, Card, ConfirmDialog, Field, Select, Spinner } from '../components/ui';
import { useCan } from '../lib/auth';
import { recordTitle } from '../lib/format';
import { adminApi, errorMessage, fieldErrors } from '../lib/http';
import { toPayload, toValues } from '../lib/formModel';
import type { AdminRecord, Locale } from '../lib/types';
import type { ResourceConfig } from '../resources/types';

const LOCALES: Locale[] = ['bn', 'en'];

export default function ResourceForm({ cfg }: { cfg: ResourceConfig }) {
    const { id } = useParams();
    const isEditing = !!id && id !== 'new';
    const navigate = useNavigate();
    const qc = useQueryClient();
    const toast = useToast();
    const can = useCan();
    const [tab, setTab] = useState<Locale>('bn');
    const [confirmDelete, setConfirmDelete] = useState(false);

    const { data: record, isLoading } = useQuery({
        queryKey: ['admin', cfg.key, id],
        queryFn: () => adminApi.get<{ data: AdminRecord }>(`${cfg.endpoint}/${id}`).then((r) => r.data),
        enabled: isEditing,
    });

    const defaults = useMemo(() => toValues(cfg, record), [cfg, record]);
    const form = useForm({ values: defaults, resetOptions: { keepDirtyValues: false } });
    const { handleSubmit, setError, control, formState: { errors, isDirty } } = form;
    const reviewed = useWatch({ control, name: ['translations.bn.is_reviewed', 'translations.en.is_reviewed'] }) as [boolean?, boolean?];

    const save = useMutation({
        mutationFn: (values: FieldValues) => {
            const payload = toPayload(cfg, values);
            return (isEditing ? adminApi.put<{ data: AdminRecord }>(`${cfg.endpoint}/${id}`, payload) : adminApi.post<{ data: AdminRecord }>(cfg.endpoint, payload)).then((r) => r.data);
        },
        onSuccess: (saved) => {
            qc.invalidateQueries({ queryKey: ['admin', cfg.key] });
            qc.invalidateQueries({ queryKey: ['admin', 'reference'] });
            toast('success', `${cfg.singular} saved.`);
            if (!isEditing) navigate(`/admin/${cfg.key}/${saved.id}`, { replace: true });
            else qc.setQueryData(['admin', cfg.key, id], saved);
        },
        onError: (e) => {
            const errs = fieldErrors(e);
            Object.entries(errs).forEach(([k, msg]) => {
                // API uses `images.*` for the gallery field.
                setError(k.startsWith('images') ? 'images' : k, { message: msg });
                const loc = k.match(/^translations\.(bn|en)\./)?.[1] as Locale | undefined;
                if (loc) setTab(loc);
            });
            toast('error', Object.keys(errs).length ? 'Please fix the highlighted fields.' : errorMessage(e));
        },
    });

    const remove = useMutation({
        mutationFn: () => adminApi.delete(`${cfg.endpoint}/${id}`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', cfg.key] }); toast('success', `${cfg.singular} deleted.`); navigate(`/admin/${cfg.key}`); },
        onError: (e) => { setConfirmDelete(false); toast('error', errorMessage(e)); },
    });

    if (isEditing && isLoading) return <div className="grid place-items-center py-24"><Spinner /></div>;

    const canPublish = can(`${cfg.permission}.publish`);
    const canSave = can(`${cfg.permission}.${isEditing ? 'update' : 'create'}`);
    const currentStatus = record?.status ?? 'draft';
    const mainFields = cfg.fields.filter((f) => (f.placement ?? 'side') === 'main');
    const sideFields = cfg.fields.filter((f) => (f.placement ?? 'side') === 'side');
    const tabHasError = (l: Locale) => !!(errors.translations as Record<string, unknown> | undefined)?.[l];
    const publicSlug = record?.translations?.[tab]?.is_reviewed ? (record.translations[tab]?.slug as string | undefined) : undefined;
    const publicPath = { portfolios: 'portfolio', services: 'services', 'success-stories': 'success-stories' }[cfg.key];

    return (
        <FormProvider {...form}>
            <form onSubmit={handleSubmit((v) => save.mutate(v))} noValidate>
                <div className="sticky top-14 z-20 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                        <Link to={`/admin/${cfg.key}`} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200" aria-label={`Back to ${cfg.plural}`}><ArrowLeft className="size-5" /></Link>
                        <div className="min-w-0">
                            <p className="text-xs text-slate-500">{cfg.plural}</p>
                            <h1 className="truncate text-lg font-bold text-slate-900">{isEditing && record ? (cfg.titleOf ?? recordTitle)(record) : `New ${cfg.singular.toLowerCase()}`}</h1>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {isEditing && publicSlug && publicPath && record?.status === 'published' && (
                            <a href={`/${tab}/${publicPath}/${publicSlug}`} target="_blank" rel="noopener" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-slate-700 hover:bg-slate-200"><ExternalLink className="size-4" /> View</a>
                        )}
                        {isEditing && can(`${cfg.permission}.delete`) && <Btn variant="secondary" onClick={() => setConfirmDelete(true)}><Trash2 className="size-4 text-red-600" /> Delete</Btn>}
                        <Btn type="submit" loading={save.isPending} disabled={!canSave}><Save className="size-4" /> Save{isDirty ? ' changes' : ''}</Btn>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        {cfg.translatable && (
                            <Card>
                                <div role="tablist" aria-label="Language" className="-mx-5 -mt-5 mb-5 flex border-b border-slate-200 px-5">
                                    {LOCALES.map((l) => (
                                        <button key={l} type="button" role="tab" aria-selected={tab === l} onClick={() => setTab(l)}
                                            className={cn('relative -mb-px border-b-2 px-4 py-3 text-sm font-semibold', tab === l ? 'border-navy-900 text-navy-900' : 'border-transparent text-slate-500 hover:text-slate-800')}>
                                            {l === 'bn' ? 'বাংলা (Bangla)' : 'English'}
                                            {reviewed[l === 'bn' ? 0 : 1] && <span className="ml-2 rounded bg-brand-green-100 px-1.5 text-[10px] text-brand-green-800">Reviewed</span>}
                                            {tabHasError(l) && <span className="absolute right-1 top-2 size-2 rounded-full bg-red-500" aria-label="has errors" />}
                                        </button>
                                    ))}
                                </div>
                                {LOCALES.map((l) => (
                                    <div key={l} hidden={tab !== l} className="space-y-5">
                                        {(cfg.translationFields ?? []).map((f) => <FieldInput key={f.name} def={f} name={`translations.${l}.${f.name}`} lang={l} isEditing={isEditing} />)}
                                        <div className="rounded-lg bg-amber-50 p-4 ring-1 ring-amber-200">
                                            <FieldInput isEditing={isEditing} name={`translations.${l}.is_reviewed`}
                                                def={{ name: 'is_reviewed', type: 'switch', label: `${l === 'bn' ? 'Bangla' : 'English'} text reviewed and approved`, description: 'Only reviewed translations are shown on the website. Never approve unchecked machine translations.' }} />
                                        </div>
                                    </div>
                                ))}
                            </Card>
                        )}
                        {mainFields.length > 0 && (
                            <Card>
                                <div className="space-y-5">{mainFields.map((f) => <FieldInput key={f.name} def={f} name={f.name} isEditing={isEditing} />)}</div>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-6">
                        {cfg.publishable && (
                            <Card title="Publishing">
                                <Field label="Status" error={errors.status?.message as string | undefined} help={!canPublish ? 'You can save drafts. Publishing needs the publish permission.' : 'Published items appear on the website once a reviewed translation exists.'}>
                                    <Select {...form.register('status')}>
                                        <option value="draft" disabled={!canPublish && currentStatus === 'published'}>Draft</option>
                                        <option value="published" disabled={!canPublish && currentStatus !== 'published'}>Published</option>
                                        <option value="archived" disabled={!canPublish && currentStatus === 'published'}>Archived</option>
                                    </Select>
                                </Field>
                            </Card>
                        )}
                        {sideFields.length > 0 && (
                            <Card title="Details"><div className="space-y-5">{sideFields.map((f) => <FieldInput key={f.name} def={f} name={f.name} isEditing={isEditing} />)}</div></Card>
                        )}
                        {cfg.sideNote && <div className="rounded-xl bg-navy-50 p-4 text-sm text-navy-800 ring-1 ring-navy-100">{cfg.sideNote}</div>}
                        {record?.updated_at && <p className="text-xs text-slate-500">Last updated {new Date(record.updated_at).toLocaleString('en-GB')}</p>}
                    </div>
                </div>
            </form>
            <ConfirmDialog open={confirmDelete} title={`Delete ${cfg.singular.toLowerCase()}?`} loading={remove.isPending}
                message={<>This permanently deletes <strong>{record ? (cfg.titleOf ?? recordTitle)(record) : ''}</strong> and its translations. This cannot be undone.</>}
                onCancel={() => setConfirmDelete(false)} onConfirm={() => remove.mutate()} />
        </FormProvider>
    );
}
