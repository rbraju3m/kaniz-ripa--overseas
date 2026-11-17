import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { slugify } from '../lib/format';
import { MediaField } from './MediaPicker';
import { RichText } from './RichText';
import { Btn, Field, Input, Switch } from './ui';

/** Repeatable page items (values, management cards, "why choose us" points), each bilingual. */
export function SectionsField({ name }: { name: string }) {
    const { control, register, watch } = useFormContext();
    const { fields, append, remove, move } = useFieldArray({ control, name });
    const [tab, setTab] = useState<'bn' | 'en'>('bn');

    return (
        <div>
            <div className="mb-3 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-slate-800">Items</h3>
                    <p className="text-xs text-slate-500">Optional repeatable blocks, e.g. core values, management profiles or reasons to choose you.</p>
                </div>
                <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
                    {(['bn', 'en'] as const).map((l) => <button key={l} type="button" onClick={() => setTab(l)} className={cn('rounded-md px-3 py-1', tab === l ? 'bg-white shadow' : 'text-slate-500')}>{l === 'bn' ? 'বাংলা' : 'English'}</button>)}
                </div>
            </div>
            <ol className="space-y-3">
                {fields.map((f, i) => (
                    <li key={f.id} className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200">
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-500">Item {i + 1}</span>
                            <div className="flex gap-1">
                                <Btn size="sm" variant="ghost" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Move up"><ArrowUp className="size-4" /></Btn>
                                <Btn size="sm" variant="ghost" disabled={i === fields.length - 1} onClick={() => move(i, i + 1)} aria-label="Move down"><ArrowDown className="size-4" /></Btn>
                                <Btn size="sm" variant="ghost" onClick={() => remove(i)} aria-label="Remove item"><Trash2 className="size-4 text-red-600" /></Btn>
                            </div>
                        </div>
                        <div className="grid gap-4 lg:grid-cols-3">
                            <div className="space-y-3 lg:col-span-2">
                                <Field label={`Title (${tab.toUpperCase()})`}><Input lang={tab} {...register(`${name}.${i}.translations.${tab}.title`)} /></Field>
                                <Field label={`Text (${tab.toUpperCase()})`}>
                                    <Controller control={control} name={`${name}.${i}.translations.${tab}.body`} render={({ field }) => <RichText value={field.value ?? ''} onChange={field.onChange} lang={tab} minHeight="min-h-20" />} />
                                </Field>
                                <Controller control={control} name={`${name}.${i}.translations.${tab}.is_reviewed`} render={({ field }) => (
                                    <Switch checked={!!field.value} onChange={field.onChange} label={`${tab.toUpperCase()} reviewed`} description="Only reviewed text is shown on the website." />
                                )} />
                            </div>
                            <div className="space-y-3">
                                <Field label="Key" help="Internal identifier, e.g. integrity"><Input {...register(`${name}.${i}.key`)} /></Field>
                                <Field label="Icon (optional)"><Input placeholder="shield-check" {...register(`${name}.${i}.icon`)} /></Field>
                                <Field label="Image (optional)">
                                    <Controller control={control} name={`${name}.${i}.media`} render={({ field }) => <MediaField value={field.value ?? null} onChange={field.onChange} folder="pages" aspect="aspect-square" />} />
                                </Field>
                                <Controller control={control} name={`${name}.${i}.is_active`} render={({ field }) => <Switch checked={field.value !== false} onChange={field.onChange} label="Visible" />} />
                            </div>
                        </div>
                    </li>
                ))}
            </ol>
            <Btn variant="secondary" className="mt-3" onClick={() => {
                const n = (watch(name) as unknown[] | undefined)?.length ?? 0;
                append({ key: slugify(`item-${n + 1}`), icon: '', media: null, is_active: true, translations: { bn: { title: '', body: '', is_reviewed: false }, en: { title: '', body: '', is_reviewed: false } } });
            }}><Plus className="size-4" /> Add item</Btn>
        </div>
    );
}
