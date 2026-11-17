import { useQuery } from '@tanstack/react-query';
import { Controller, useFormContext, type FieldValues } from 'react-hook-form';
import { adminApi } from '../lib/http';
import { slugify } from '../lib/format';
import type { ReferenceData } from '../lib/types';
import type { FieldDef, Option, RefKey } from '../resources/types';
import { GalleryField, MediaField } from './MediaPicker';
import { RichText } from './RichText';
import { SectionsField } from './SectionsField';
import { Field, Input, Select, Switch, Textarea } from './ui';

export function useReference() {
    return useQuery({
        queryKey: ['admin', 'reference'],
        queryFn: () => adminApi.get<{ data: ReferenceData }>('/reference').then((r) => r.data),
        staleTime: 60_000,
    });
}

export function refOptions(ref: ReferenceData | undefined, key: RefKey): Option[] {
    if (!ref) return [];
    if (key === 'companies') return ref.companies.map((c) => ({ value: c.id, label: c.verification_status === 'verified' ? c.name : `${c.name} (unverified)` }));
    return (ref[key] as { id: number; en: string | null; bn: string | null }[]).map((o) => ({ value: o.id, label: o.en ?? o.bn ?? `#${o.id}` }));
}

/** Get a nested error message by dotted path from RHF's error tree. */
function errorAt(errors: FieldValues, path: string): string | undefined {
    const node = path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), errors);
    return (node as { message?: string } | undefined)?.message;
}

export function FieldInput({ def, name, lang, isEditing }: { def: FieldDef; name: string; lang?: string; isEditing: boolean }) {
    const { control, formState: { errors }, getValues, setValue } = useFormContext();
    const { data: ref } = useReference();
    const error = errorAt(errors, name);
    const disabled = def.createOnly && isEditing;

    if (def.type === 'switch') {
        return <Controller control={control} name={name} render={({ field }) => (
            <div><Switch checked={!!field.value} onChange={field.onChange} label={def.label} description={def.description ?? def.help} disabled={disabled} />{error && <p className="mt-1 text-xs text-red-600">{error}</p>}</div>
        )} />;
    }

    if (def.type === 'sections') return <SectionsField name={name} />;

    return (
        <Field label={def.label} error={error} help={def.help} required={def.required}>
            <Controller
                control={control}
                name={name}
                render={({ field }) => {
                    const common = { id: name, 'aria-invalid': !!error, disabled, lang };
                    switch (def.type) {
                        case 'textarea':
                            return <Textarea {...common} value={(field.value as string) ?? ''} onChange={field.onChange} rows={4} />;
                        case 'richtext':
                            return <RichText value={(field.value as string) ?? ''} onChange={field.onChange} lang={lang} invalid={!!error} />;
                        case 'number':
                            return <Input {...common} type="number" min={0} value={(field.value as number | string) ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} />;
                        case 'date':
                            return <Input {...common} type="date" value={((field.value as string) ?? '').slice(0, 10)} onChange={(e) => field.onChange(e.target.value || null)} />;
                        case 'url':
                            return <Input {...common} type="url" placeholder="https://" value={(field.value as string) ?? ''} onChange={field.onChange} />;
                        case 'slug':
                            return (
                                <Input {...common} value={(field.value as string) ?? ''}
                                    onFocus={() => {
                                        if (!field.value) {
                                            const src = getValues(name.replace(/[^.]+$/, def.from)) as string | undefined;
                                            if (src) field.onChange(slugify(src));
                                        }
                                    }}
                                    onChange={field.onChange} />
                            );
                        case 'select': {
                            const options = def.options ?? (def.ref ? refOptions(ref, def.ref) : []);
                            return (
                                <Select {...common} value={(field.value as string | number | null) ?? ''} onChange={(e) => {
                                    const raw = e.target.value;
                                    field.onChange(raw === '' ? null : (options.find((o) => String(o.value) === raw)?.value ?? raw));
                                }}>
                                    {(def.nullable ?? true) && <option value="">—</option>}
                                    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </Select>
                            );
                        }
                        case 'media':
                            return <MediaField value={field.value ?? null} onChange={field.onChange} folder={def.folder} aspect={def.aspect} />;
                        case 'gallery':
                            return <GalleryField value={field.value ?? []} onChange={field.onChange} folder={def.folder} />;
                        case 'localized': {
                            const v = (field.value as Record<string, string> | null) ?? {};
                            const Comp = def.inputType === 'textarea' ? Textarea : Input;
                            return (
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {(['bn', 'en'] as const).map((l) => (
                                        <Comp key={l} lang={l} placeholder={l === 'bn' ? 'বাংলা' : 'English'} value={v[l] ?? ''}
                                            onChange={(e: { target: { value: string } }) => field.onChange({ ...v, [l]: e.target.value })} />
                                    ))}
                                </div>
                            );
                        }
                        default:
                            return (
                                <Input {...common} value={(field.value as string) ?? ''}
                                    onChange={(e) => {
                                        // On new records, keep a sibling slug in sync while it still matches the title.
                                        const slugName = name.replace(/[^.]+$/, 'slug');
                                        if (!isEditing && slugName !== name) {
                                            const slug = getValues(slugName) as string | undefined;
                                            if (slug !== undefined && (!slug || slug === slugify((field.value as string) ?? ''))) {
                                                setValue(slugName, slugify(e.target.value), { shouldDirty: true });
                                            }
                                        }
                                        field.onChange(e.target.value);
                                    }} />
                            );
                    }
                }}
            />
        </Field>
    );
}
