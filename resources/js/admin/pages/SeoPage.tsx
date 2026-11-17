import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { useState } from 'react';
import { MediaField, toPicked, type PickedMedia } from '../components/MediaPicker';
import { useToast } from '../components/toast';
import { Btn, Card, Field, Input, PageTitle, Select, Spinner, Switch, Textarea } from '../components/ui';
import { useCan } from '../lib/auth';
import { adminApi, errorMessage, fieldErrors } from '../lib/http';
import type { Locale, Media } from '../lib/types';

interface Seo { id: number; route_key: string | null; locale: Locale; meta_title: string | null; meta_description: string | null; og_image_media_id: number | null; og_image: Media | null; canonical_url: string | null; noindex: boolean }

function SeoForm({ routeKey, locale, existing }: { routeKey: string; locale: Locale; existing?: Seo }) {
    const can = useCan();
    const qc = useQueryClient();
    const toast = useToast();
    const [v, setV] = useState({ meta_title: existing?.meta_title ?? '', meta_description: existing?.meta_description ?? '', canonical_url: existing?.canonical_url ?? '', noindex: existing?.noindex ?? false, og: toPicked(existing?.og_image) as PickedMedia | null });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const save = useMutation({
        mutationFn: () => adminApi.put('/seo', { route_key: routeKey, locale, meta_title: v.meta_title || null, meta_description: v.meta_description || null, canonical_url: v.canonical_url || null, noindex: v.noindex, og_image_media_id: v.og?.id ?? null }),
        onSuccess: () => { setErrors({}); qc.invalidateQueries({ queryKey: ['admin', 'seo'] }); toast('success', 'SEO saved.'); },
        onError: (e) => { setErrors(fieldErrors(e)); toast('error', errorMessage(e)); },
    });
    return (
        <Card title={locale === 'bn' ? 'বাংলা (Bangla)' : 'English'} actions={can('seo.update') && <Btn size="sm" onClick={() => save.mutate()} loading={save.isPending}><Save className="size-4" /> Save</Btn>}>
            <div className="space-y-4">
                <Field label="Meta title" error={errors.meta_title} help={`${v.meta_title.length}/70 — leave empty to use the page title.`}><Input lang={locale} maxLength={70} value={v.meta_title} onChange={(e) => setV({ ...v, meta_title: e.target.value })} /></Field>
                <Field label="Meta description" error={errors.meta_description} help={`${v.meta_description.length}/320`}><Textarea lang={locale} maxLength={320} rows={3} value={v.meta_description} onChange={(e) => setV({ ...v, meta_description: e.target.value })} /></Field>
                <Field label="Social share image (Open Graph)"><MediaField value={v.og} onChange={(og) => setV({ ...v, og })} folder="seo" /></Field>
                <Field label="Canonical URL" error={errors.canonical_url} help="Only if this page should point to another URL."><Input type="url" value={v.canonical_url} onChange={(e) => setV({ ...v, canonical_url: e.target.value })} /></Field>
                <Switch checked={v.noindex} onChange={(noindex) => setV({ ...v, noindex })} label="Hide from search engines (noindex)" />
            </div>
        </Card>
    );
}

export default function SeoPage() {
    const [routeKey, setRouteKey] = useState('home');
    const { data, isLoading } = useQuery({ queryKey: ['admin', 'seo'], queryFn: () => adminApi.get<{ data: Seo[]; route_keys: string[] }>('/seo') });
    const find = (l: Locale) => data?.data.find((s) => s.route_key === routeKey && s.locale === l);
    return (
        <>
            <PageTitle title="SEO" description="Search and social metadata per page and language. Detail pages use their own title and summary automatically." />
            <Field label="Page" className="mb-6 max-w-xs">
                <Select value={routeKey} onChange={(e) => setRouteKey(e.target.value)}>{(data?.route_keys ?? ['home']).map((k) => <option key={k} value={k}>{k}</option>)}</Select>
            </Field>
            {isLoading ? <Spinner /> : (
                <div className="grid gap-6 lg:grid-cols-2">
                    {(['bn', 'en'] as const).map((l) => <SeoForm key={`${routeKey}-${l}-${find(l)?.id ?? 0}`} routeKey={routeKey} locale={l} existing={find(l)} />)}
                </div>
            )}
        </>
    );
}
