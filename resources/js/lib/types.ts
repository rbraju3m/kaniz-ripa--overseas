export type Locale = 'bn' | 'en';

export interface Media {
    id: number;
    url: string | null;
    variants: Partial<Record<'sm' | 'md' | 'lg', string>>;
    width: number | null;
    height: number | null;
    alt: string | null;
}

export interface Country {
    id: number;
    iso2: string;
    flag: string;
    name: string | null;
}

export interface Industry {
    id: number;
    key: string;
    name: string | null;
}

export interface PageSection {
    key: string;
    icon: string | null;
    title: string | null;
    body: string | null;
    media: Media | null;
}

export interface Page {
    key: string;
    locale: Locale | null;
    title: string | null;
    slug: string | null;
    summary: string | null;
    body: string | null;
    cover?: Media | null;
    sections?: PageSection[];
}

export interface Service {
    id: number;
    locale: Locale | null;
    slug: string | null;
    slugs?: Partial<Record<Locale, string>>;
    title: string | null;
    summary: string | null;
    body?: string | null;
    icon: string | null;
    is_featured: boolean;
    image?: Media | null;
}

export interface Portfolio {
    id: number;
    locale: Locale | null;
    slug: string | null;
    slugs?: Partial<Record<Locale, string>>;
    title: string | null;
    summary: string | null;
    description?: string | null;
    activities?: string | null;
    project_date: string | null;
    is_featured: boolean;
    company: { name: string; slug: string | null; logo: Media | null } | null;
    country?: Country | null;
    industry?: Industry | null;
    cover?: Media | null;
    images?: { id: number; caption: string | null; media: Media }[];
}

export interface Partner {
    id: number;
    slug: string;
    name: string;
    website_url: string | null;
    description: string | null;
    logo?: Media | null;
    country?: Country | null;
    industry?: Industry | null;
    portfolios?: Portfolio[];
}

export interface SuccessStory {
    id: number;
    locale: Locale | null;
    slug: string | null;
    slugs?: Partial<Record<Locale, string>>;
    title: string | null;
    display_name: string | null;
    story?: string | null;
    testimonial: string | null;
    video_url: string | null;
    is_featured: boolean;
    employer: string | null;
    photo?: Media | null;
    country?: Country | null;
    industry?: Industry | null;
    images?: { id: number; caption: string | null; media: Media }[];
}

export interface GalleryItem {
    id: number;
    type: 'image' | 'video';
    title: string | null;
    video_url: string | null;
    category: { slug: string; name: string | null } | null;
    media?: Media | null;
}

export interface MenuItem {
    id: number;
    label: string;
    route: string | null;
    url: string | null;
    new_tab: boolean;
    children: MenuItem[];
}

export interface ContactPerson {
    number: string;
    name: Record<Locale, string>;
    role: Record<Locale, string>;
    whatsapp: boolean;
}

/** Only non-placeholder, public settings are ever sent by the API. */
export interface SiteSettings {
    general?: { site_name?: string; tagline?: string; license_number?: string; founded_year?: string };
    contact?: {
        phone?: string;
        mobiles?: ContactPerson[];
        show_contact_persons?: boolean;
        address?: string;
        email?: string;
        whatsapp_number?: string;
        map_embed_url?: string;
        office_hours?: string;
    };
    social?: { facebook_url?: string; youtube_url?: string; linkedin_url?: string };
    branding?: { logo_media_id?: number; show_bismillah?: boolean };
}

export interface SitePayload {
    locale: Locale;
    logo_url: string | null;
    settings: SiteSettings;
    menus: Record<string, MenuItem[]>;
    /** False when no company profile PDF can be downloaded: every profile link is hidden. */
    company_profile_available?: boolean;
}

export interface HomePayload {
    intro: Page | null;
    about: Page | null;
    why_choose_us: Page | null;
    services: Service[];
    countries: Country[];
    partners: Partner[];
    portfolios: Portfolio[];
    success_stories: SuccessStory[];
    team: TeamMember[];
    stats: { countries: number; partners: number; projects: number; services: number };
    company_profile_available: boolean;
}

export interface TeamMember {
    id: number;
    locale: Locale;
    name: string | null;
    role: string | null;
    bio: string | null;
    phone: string | null;
    whatsapp: boolean;
    email: string | null;
    photo: Media | null;
}

export interface CompanyProfileInfo {
    title: string | null;
    description: string | null;
    locale: Locale;
    size: number;
    updated_at: string | null;
    download_url: string;
    preview_url: string;
}

export interface Paginated<T> {
    data: T[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
}
