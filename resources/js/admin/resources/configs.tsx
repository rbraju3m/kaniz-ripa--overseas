import { Star } from 'lucide-react';
import { Badge, ReviewBadges, StatusBadge } from '../components/ui';
import { date, recordTitle } from '../lib/format';
import type { AdminRecord, ReferenceData } from '../lib/types';
import type { ColumnDef, ResourceConfig } from './types';

const refName = (ref: ReferenceData | undefined, key: 'countries' | 'industries', id: unknown) => {
    const o = ref?.[key].find((x) => x.id === id);
    return o ? (o.en ?? o.bn) : '—';
};

const thumb = (r: AdminRecord, rel: string) => {
    const m = r[rel] as { url?: string; variants?: { sm?: string } } | null | undefined;
    const src = m?.variants?.sm ?? m?.url;
    return src ? <img src={src} alt="" className="size-10 rounded-md object-cover" /> : <span className="block size-10 rounded-md bg-slate-100" />;
};

const titleCol = (field = 'title'): ColumnDef => ({ label: 'Title', render: (r) => recordTitle(r, field) });
const reviewCol: ColumnDef = { label: 'Languages', render: (r) => <ReviewBadges translations={r.translations} /> };
const statusCol: ColumnDef = { label: 'Status', render: (r) => <StatusBadge status={r.status} /> };
const featuredCol: ColumnDef = { label: '', render: (r) => (r.is_featured ? <Star className="size-4 fill-gold-500 text-gold-500" aria-label="Featured" /> : null) };
const updatedCol: ColumnDef = { label: 'Updated', render: (r) => <span className="text-slate-500">{date(r.updated_at)}</span> };

const sortField = { name: 'sort', label: 'Sort order', type: 'number', help: 'Lower numbers appear first.' } as const;
const featuredField = { name: 'is_featured', label: 'Featured', type: 'switch', description: 'Highlight on the homepage.' } as const;

const PAGE_KEYS = ['home_intro', 'about', 'history', 'mission', 'vision', 'values', 'management', 'credentials', 'why_choose_us', 'privacy'];

export const pagesConfig: ResourceConfig = {
    key: 'pages', endpoint: '/pages', permission: 'pages', singular: 'Page', plural: 'Website pages',
    description: 'Company introduction, About, Mission, Vision, Values, History, Management, Credentials and Why choose us.',
    publishable: true, translatable: true,
    fields: [
        { name: 'key', label: 'Page key', type: 'select', options: PAGE_KEYS.map((k) => ({ value: k, label: k })), createOnly: true, required: true, nullable: false, help: 'Where this content appears on the website.' },
        { name: 'cover_media_id', label: 'Cover image', type: 'media', relation: 'cover', folder: 'pages' },
        { name: 'sections', label: 'Items', type: 'sections', placement: 'main' },
    ],
    translationFields: [
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'slug', label: 'Slug', type: 'slug', from: 'title', required: true },
        { name: 'summary', label: 'Summary', type: 'textarea', help: 'Short lead text, also used for search engines.' },
        { name: 'body', label: 'Content', type: 'richtext' },
    ],
    columns: [{ label: 'Key', render: (r) => <span className="font-mono text-xs">{String(r.key)}</span> }, titleCol(), reviewCol, statusCol, updatedCol],
    defaults: { key: 'about' },
};

export const servicesConfig: ResourceConfig = {
    key: 'services', endpoint: '/services', permission: 'services', singular: 'Service', plural: 'Services',
    description: 'Only publish services the company has confirmed.',
    publishable: true, translatable: true,
    fields: [
        { name: 'icon', label: 'Icon', type: 'select', options: ['globe', 'handshake', 'users', 'file-check', 'message-square', 'briefcase'].map((v) => ({ value: v, label: v })) },
        { name: 'image_media_id', label: 'Image', type: 'media', relation: 'image', folder: 'services' },
        featuredField, sortField,
    ],
    translationFields: [
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'slug', label: 'Slug', type: 'slug', from: 'title', required: true },
        { name: 'summary', label: 'Summary', type: 'textarea' },
        { name: 'body', label: 'Description', type: 'richtext' },
    ],
    columns: [titleCol(), reviewCol, statusCol, featuredCol, updatedCol],
    defaults: { sort: 0, icon: 'globe' },
};

export const portfoliosConfig: ResourceConfig = {
    key: 'portfolios', endpoint: '/portfolios', permission: 'portfolios', singular: 'Portfolio project', plural: 'Portfolio',
    description: 'Recruitment projects. Drafts seeded from the posters need review before publishing.',
    publishable: true, translatable: true,
    fields: [
        { name: 'images', label: 'Gallery', type: 'gallery', placement: 'main', folder: 'portfolio' },
        { name: 'cover_media_id', label: 'Cover image', type: 'media', relation: 'cover', folder: 'portfolio' },
        { name: 'company_id', label: 'Company', type: 'select', ref: 'companies', help: 'Logo and link appear only for verified partners.' },
        { name: 'country_id', label: 'Country', type: 'select', ref: 'countries' },
        { name: 'industry_id', label: 'Industry', type: 'select', ref: 'industries' },
        { name: 'project_date', label: 'Project date', type: 'date' },
        featuredField, sortField,
        { name: 'internal_note', label: 'Internal note', type: 'textarea', help: 'Never shown on the website.' },
    ],
    translationFields: [
        { name: 'title', label: 'Project title', type: 'text', required: true },
        { name: 'slug', label: 'Slug', type: 'slug', from: 'title', required: true },
        { name: 'summary', label: 'Summary', type: 'textarea' },
        { name: 'description', label: 'Description', type: 'richtext' },
        { name: 'activities', label: 'Recruitment activities', type: 'textarea', help: 'One activity per line, or formatted text.' },
    ],
    columns: [
        titleCol(),
        { label: 'Cover', render: (r) => thumb(r, 'cover'), className: 'w-14 px-4 py-2' },
        { label: 'Company', render: (r) => (r.company as { name?: string } | null)?.name ?? '—' },
        { label: 'Country', render: (r, { ref }) => refName(ref, 'countries', r.country_id) },
        reviewCol, statusCol, featuredCol,
    ],
    filters: [{ name: 'country_id', label: 'Country', ref: 'countries' }, { name: 'company_id', label: 'Company', ref: 'companies' }],
    defaults: { sort: 0, images: [] },
};

export const companiesConfig: ResourceConfig = {
    key: 'companies', endpoint: '/companies', permission: 'companies', singular: 'Company', plural: 'Partner companies',
    description: 'A company appears on the website as a partner only after it is verified and set to display.',
    translatable: true,
    fields: [
        { name: 'name', label: 'Company name', type: 'text', required: true, placement: 'main' },
        { name: 'slug', label: 'Slug', type: 'slug', from: 'name', required: true, placement: 'main' },
        { name: 'website_url', label: 'Website', type: 'url', placement: 'main' },
        { name: 'logo_media_id', label: 'Logo', type: 'media', relation: 'logo', folder: 'logos', aspect: 'aspect-[3/2]' },
        { name: 'verification_status', label: 'Verification', type: 'select', nullable: false, options: [{ value: 'unverified', label: 'Unverified' }, { value: 'verified', label: 'Verified partnership' }], help: 'Verify only with written confirmation from the company.' },
        { name: 'is_partner_displayed', label: 'Show as partner on website', type: 'switch', description: 'Requires verified status.' },
        { name: 'country_id', label: 'Country', type: 'select', ref: 'countries' },
        { name: 'industry_id', label: 'Industry', type: 'select', ref: 'industries' },
        featuredField, sortField,
        { name: 'internal_note', label: 'Internal note', type: 'textarea' },
    ],
    translationFields: [{ name: 'description', label: 'Description', type: 'textarea' }],
    columns: [
        { label: 'Company', render: (r) => String(r.name) },
        { label: 'Country', render: (r, { ref }) => refName(ref, 'countries', r.country_id) },
        { label: 'Verification', render: (r) => <Badge tone={r.verification_status === 'verified' ? 'green' : 'amber'}>{String(r.verification_status)}</Badge> },
        { label: 'On website', render: (r) => (r.is_partner_displayed ? <Badge tone="green">Shown</Badge> : <Badge>Hidden</Badge>) },
    ],
    filters: [{ name: 'verification_status', label: 'Verification', options: [{ value: 'verified', label: 'Verified' }, { value: 'unverified', label: 'Unverified' }] }],
    defaults: { verification_status: 'unverified', sort: 0 },
    titleOf: (r) => String(r.name),
    // Company description is optional, so an empty translations object is allowed.
    toPayload: (p) => p,
};

export const storiesConfig: ResourceConfig = {
    key: 'success-stories', endpoint: '/success-stories', permission: 'success_stories', singular: 'Success story', plural: 'Success stories',
    description: 'Publish only authentic stories with written consent from the person featured.',
    publishable: true, translatable: true,
    fields: [
        { name: 'images', label: 'Photo gallery', type: 'gallery', placement: 'main', folder: 'stories' },
        { name: 'consent_confirmed', label: 'Written consent obtained', type: 'switch', description: 'Required before publishing.' },
        { name: 'consent_note', label: 'Consent record', type: 'textarea', help: 'Where the signed consent is kept, date, scope (photo, name, video).' },
        { name: 'photo_media_id', label: 'Portrait photo', type: 'media', relation: 'photo', folder: 'stories', aspect: 'aspect-square' },
        { name: 'video_url', label: 'Video URL', type: 'url', help: 'YouTube, Vimeo or Facebook link.' },
        { name: 'company_id', label: 'Employer', type: 'select', ref: 'companies' },
        { name: 'country_id', label: 'Country', type: 'select', ref: 'countries' },
        { name: 'industry_id', label: 'Industry', type: 'select', ref: 'industries' },
        featuredField, sortField,
    ],
    translationFields: [
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'slug', label: 'Slug', type: 'slug', from: 'title', required: true },
        { name: 'display_name', label: 'Approved display name', type: 'text', required: true, help: 'Exactly as the person agreed to be named.' },
        { name: 'testimonial', label: 'Testimonial (their own words)', type: 'textarea' },
        { name: 'story', label: 'Story', type: 'richtext' },
    ],
    columns: [
        titleCol(),
        { label: 'Name', render: (r) => recordTitle(r, 'display_name') },
        { label: 'Consent', render: (r) => (r.consent_confirmed_at ? <Badge tone="green">Recorded</Badge> : <Badge tone="red">Missing</Badge>) },
        reviewCol, statusCol, featuredCol,
    ],
    filters: [{ name: 'country_id', label: 'Country', ref: 'countries' }],
    defaults: { sort: 0, images: [], consent_confirmed: false },
    fromRecord: (v, r) => ({ ...v, consent_confirmed: !!r.consent_confirmed_at }),
};

export const galleryCategoriesConfig: ResourceConfig = {
    key: 'gallery-categories', endpoint: '/gallery-categories', permission: 'gallery', singular: 'Gallery category', plural: 'Gallery categories',
    translatable: true, searchable: true,
    fields: [
        { name: 'slug', label: 'Slug', type: 'text', required: true, help: 'Lowercase latin letters and hyphens, used in the filter URL.' },
        { name: 'is_active', label: 'Active', type: 'switch' },
        sortField,
    ],
    translationFields: [{ name: 'name', label: 'Name', type: 'text', required: true }],
    columns: [{ label: 'Name', render: (r) => recordTitle(r, 'name') }, { label: 'Slug', render: (r) => <span className="font-mono text-xs">{String(r.slug)}</span> }, reviewCol, { label: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') }],
    defaults: { is_active: true, sort: 0 },
    titleOf: (r) => recordTitle(r, 'name'),
};

export const galleryItemsConfig: ResourceConfig = {
    key: 'gallery-items', endpoint: '/gallery-items', permission: 'gallery', singular: 'Gallery item', plural: 'Gallery',
    description: 'Photos and videos of office, recruitment activities and events.',
    publishable: true,
    fields: [
        { name: 'type', label: 'Type', type: 'select', nullable: false, options: [{ value: 'image', label: 'Photo' }, { value: 'video', label: 'Video' }], placement: 'main' },
        { name: 'media_id', label: 'Photo / video thumbnail', type: 'media', relation: 'media', folder: 'gallery', placement: 'main' },
        { name: 'video_url', label: 'Video URL', type: 'url', help: 'For videos: YouTube, Vimeo or Facebook.', placement: 'main' },
        { name: 'title', label: 'Caption', type: 'localized', placement: 'main' },
        { name: 'gallery_category_id', label: 'Category', type: 'select', ref: 'gallery_categories' },
        sortField,
    ],
    columns: [
        { label: 'Caption', render: (r) => (r.title as { en?: string; bn?: string } | null)?.en || (r.title as { bn?: string } | null)?.bn || `#${r.id}` },
        { label: 'Preview', render: (r) => thumb(r, 'media'), className: 'w-14 px-4 py-2' },
        { label: 'Type', render: (r) => <Badge tone="blue">{String(r.type)}</Badge> },
        { label: 'Category', render: (r) => recordTitle((r.category as AdminRecord) ?? { id: 0 }, 'name') },
        statusCol,
    ],
    filters: [{ name: 'gallery_category_id', label: 'Category', ref: 'gallery_categories' }, { name: 'type', label: 'Type', options: [{ value: 'image', label: 'Photos' }, { value: 'video', label: 'Videos' }] }],
    defaults: { type: 'image', sort: 0, title: {} },
    titleOf: (r) => (r.title as { en?: string } | null)?.en || `Gallery item #${r.id}`,
};

export const countriesConfig: ResourceConfig = {
    key: 'countries', endpoint: '/countries', permission: 'countries', singular: 'Country', plural: 'Countries',
    description: 'Countries marked as served appear on the website.',
    translatable: true,
    fields: [
        { name: 'iso2', label: 'ISO code', type: 'text', required: true, help: 'Two letters, e.g. SA, MY, VN.' },
        { name: 'is_served', label: 'We serve this country', type: 'switch', description: 'Shown in "Countries we serve".' },
        sortField,
    ],
    translationFields: [{ name: 'name', label: 'Name', type: 'text', required: true }],
    columns: [{ label: 'Country', render: (r) => recordTitle(r, 'name') }, { label: 'Code', render: (r) => String(r.iso2) }, reviewCol, { label: 'Served', render: (r) => (r.is_served ? <Badge tone="green">Served</Badge> : <Badge>—</Badge>) }],
    defaults: { is_served: false, sort: 0 },
    titleOf: (r) => recordTitle(r, 'name'),
};

export const RESOURCES = [pagesConfig, servicesConfig, portfoliosConfig, companiesConfig, storiesConfig, galleryItemsConfig, galleryCategoriesConfig, countriesConfig];
