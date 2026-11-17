import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Save } from 'lucide-react';
import { useState } from 'react';
import { MediaField, type PickedMedia } from '../components/MediaPicker';
import { useToast } from '../components/toast';
import { Badge, Btn, Card, Field, Input, PageTitle, Spinner, Switch, Textarea } from '../components/ui';
import { useCan } from '../lib/auth';
import { adminApi, errorMessage, fieldErrors } from '../lib/http';

interface Setting { id: number; group: string; key: string; value: unknown; is_translatable: boolean; is_placeholder: boolean; note: string | null; preview_url: string | null }
interface Mobile { number: string; name: { bn: string; en: string }; role: { bn: string; en: string }; whatsapp: boolean }

const LABELS: Record<string, string> = {
    site_name: 'Company name', tagline: 'Tagline', license_number: 'Recruiting licence (RL) number', founded_year: 'Founded year',
    phone: 'Office telephone', mobiles: 'Contact persons', show_contact_persons: 'Show contact persons publicly', address: 'Office address',
    email: 'Email', whatsapp_number: 'WhatsApp number', map_embed_url: 'Google Maps embed URL', office_hours: 'Office hours',
    facebook_url: 'Facebook page', youtube_url: 'YouTube channel', linkedin_url: 'LinkedIn page',
    logo_media_id: 'Logo', show_bismillah: 'Show Bismillah calligraphy', default_og_media_id: 'Default social share image',
};
const GROUPS: Record<string, string> = { general: 'General', contact: 'Contact', social: 'Social media', branding: 'Branding', seo: 'SEO' };
const BOOLEAN = ['show_contact_persons', 'show_bismillah'];
const MEDIA = ['logo_media_id', 'default_og_media_id'];

export default function SettingsPage() {
    const can = useCan();
    const qc = useQueryClient();
    const toast = useToast();
    const [changes, setChanges] = useState<Record<string, unknown>>({});
    const [previews, setPreviews] = useState<Record<string, PickedMedia | null>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { data, isLoading } = useQuery({ queryKey: ['admin', 'settings'], queryFn: () => adminApi.get<{ data: Record<string, Setting[]> }>('/settings').then((r) => r.data) });

    const save = useMutation({
        mutationFn: () => adminApi.put('/settings', { settings: changes }),
        onSuccess: () => { setChanges({}); setErrors({}); qc.invalidateQueries({ queryKey: ['admin', 'settings'] }); qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] }); qc.invalidateQueries({ queryKey: ['site'] }); toast('success', 'Settings saved.'); },
        onError: (e) => { setErrors(Object.fromEntries(Object.entries(fieldErrors(e)).map(([k, v]) => [k.replace('settings.', ''), v]))); toast('error', errorMessage(e)); },
    });

    if (isLoading || !data) return <div className="grid place-items-center py-24"><Spinner /></div>;
    const val = (s: Setting) => (s.key in changes ? changes[s.key] : s.value);
    const set = (key: string, v: unknown) => setChanges((c) => ({ ...c, [key]: v }));
    const editable = can('settings.update');

    const render = (s: Setting) => {
        const v = val(s);
        const label = LABELS[s.key] ?? s.key;
        const err = errors[s.key];
        const help = <>{s.note}{s.is_placeholder && <Badge tone="amber">missing</Badge>}</>;
        if (BOOLEAN.includes(s.key)) return <Switch key={s.key} checked={!!v} onChange={(x) => set(s.key, x)} label={label} description={s.note} disabled={!editable} />;
        if (MEDIA.includes(s.key)) return (
            <Field key={s.key} label={label} help={help}>
                <MediaField value={s.key in previews ? previews[s.key] : (v ? { id: v as number, url: s.preview_url } : null)} onChange={(m) => { setPreviews({ ...previews, [s.key]: m }); set(s.key, m?.id ?? null); }} folder="branding" aspect="aspect-square" />
            </Field>
        );
        if (s.key === 'mobiles') {
            const rows = (v as Mobile[] | null) ?? [];
            const upd = (i: number, patch: Partial<Mobile>) => set(s.key, rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
            return (
                <Field key={s.key} label={label} help={s.note}>
                    <div className="space-y-2">
                        {rows.map((r, i) => (
                            <div key={i} className="grid gap-2 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200 sm:grid-cols-3">
                                <Input aria-label="Number" value={r.number} onChange={(e) => upd(i, { number: e.target.value })} />
                                <Input aria-label="Name (BN)" lang="bn" value={r.name.bn} onChange={(e) => upd(i, { name: { ...r.name, bn: e.target.value } })} />
                                <Input aria-label="Name (EN)" value={r.name.en} onChange={(e) => upd(i, { name: { ...r.name, en: e.target.value } })} />
                                <Input aria-label="Role (BN)" lang="bn" value={r.role.bn} onChange={(e) => upd(i, { role: { ...r.role, bn: e.target.value } })} />
                                <Input aria-label="Role (EN)" value={r.role.en} onChange={(e) => upd(i, { role: { ...r.role, en: e.target.value } })} />
                                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={r.whatsapp} onChange={(e) => upd(i, { whatsapp: e.target.checked })} /> On WhatsApp</label>
                            </div>
                        ))}
                    </div>
                </Field>
            );
        }
        if (s.is_translatable) {
            const obj = (v as Record<string, string> | null) ?? {};
            const Comp = s.key === 'address' ? Textarea : Input;
            return (
                <Field key={s.key} label={label} help={help} error={err}>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {(['bn', 'en'] as const).map((l) => <Comp key={l} lang={l} disabled={!editable} placeholder={l === 'bn' ? 'বাংলা' : 'English'} value={obj[l] ?? ''} onChange={(e: { target: { value: string } }) => set(s.key, { ...obj, [l]: e.target.value })} />)}
                    </div>
                </Field>
            );
        }
        return <Field key={s.key} label={label} help={help} error={err}><Input disabled={!editable} value={(v as string | null) ?? ''} onChange={(e) => set(s.key, e.target.value)} /></Field>;
    };

    const pending = Object.keys(changes).length;
    return (
        <>
            <PageTitle title="Website settings" description="Company details shown across the website and in the generated PDF. Empty values are hidden on the website."
                actions={editable && <Btn onClick={() => save.mutate()} loading={save.isPending} disabled={!pending}><Save className="size-4" /> Save{pending ? ` (${pending})` : ''}</Btn>} />
            <p className="mb-6 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200"><AlertCircle className="mt-0.5 size-4 shrink-0" /> Enter only verified company information. Items marked “missing” are tracked on the dashboard.</p>
            <div className="grid gap-6 xl:grid-cols-2">
                {Object.entries(data).map(([group, items]) => (
                    <Card key={group} title={GROUPS[group] ?? group}><div className="space-y-5">{items.map(render)}</div></Card>
                ))}
            </div>
        </>
    );
}
