import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getJson } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import type {
    CompanyProfileInfo, Country, GalleryItem, HomePayload, Page, Paginated, Partner, Portfolio, Service, SitePayload, SuccessStory, TeamMember,
} from '@/lib/types';

/** Every public query is keyed and fetched per locale. */
function useLocaleQuery<T>(key: unknown[], url: string, params: Record<string, unknown> = {}, enabled = true) {
    const { locale } = useI18n();
    return useQuery({
        queryKey: [...key, locale, params],
        queryFn: () => getJson<T>(url, { locale, ...params }),
        enabled,
        placeholderData: keepPreviousData,
    });
}

const unwrap = <T,>(q: { data?: { data: T } }) => q.data?.data;

export const useSite = () => {
    const q = useLocaleQuery<{ data: SitePayload }>(['site'], '/site');
    return { ...q, site: unwrap(q) };
};
export const useTeam = () => {
    const q = useLocaleQuery<{ data: TeamMember[] }>(['team'], '/team');
    return { ...q, team: unwrap(q) ?? [] };
};
export const useHome = () => {
    const q = useLocaleQuery<{ data: HomePayload }>(['home'], '/home');
    return { ...q, home: unwrap(q) };
};
export const usePage = (key: string) => {
    const q = useLocaleQuery<{ data: Page }>(['page', key], `/pages/${key}`);
    return { ...q, page: unwrap(q) };
};
export const useCountries = () => {
    const q = useLocaleQuery<{ data: Country[] }>(['countries'], '/countries');
    return { ...q, countries: unwrap(q) ?? [] };
};
export const useServices = () => {
    const q = useLocaleQuery<{ data: Service[] }>(['services'], '/services');
    return { ...q, services: unwrap(q) ?? [] };
};
export const useService = (slug?: string) => {
    const q = useLocaleQuery<{ data: Service }>(['service', slug], `/services/${slug}`, {}, !!slug);
    return { ...q, service: unwrap(q) };
};
export const usePortfolios = (params: { country?: string; page?: number; featured?: boolean; per_page?: number }) =>
    useLocaleQuery<Paginated<Portfolio>>(['portfolios'], '/portfolios', params);
export const usePortfolio = (slug?: string) => {
    const q = useLocaleQuery<{ data: Portfolio }>(['portfolio', slug], `/portfolios/${slug}`, {}, !!slug);
    return { ...q, portfolio: unwrap(q) };
};
export const usePartners = () => {
    const q = useLocaleQuery<{ data: Partner[] }>(['partners'], '/partners');
    return { ...q, partners: unwrap(q) ?? [] };
};
export const usePartner = (slug?: string) => {
    const q = useLocaleQuery<{ data: Partner }>(['partner', slug], `/partners/${slug}`, {}, !!slug);
    return { ...q, partner: unwrap(q) };
};
export const useStories = (params: { country?: string; page?: number }) =>
    useLocaleQuery<Paginated<SuccessStory>>(['stories'], '/success-stories', params);
export const useStory = (slug?: string) => {
    const q = useLocaleQuery<{ data: SuccessStory }>(['story', slug], `/success-stories/${slug}`, {}, !!slug);
    return { ...q, story: unwrap(q) };
};
export const useGalleryCategories = () => {
    const q = useLocaleQuery<{ data: { slug: string; name: string | null }[] }>(['gallery-categories'], '/gallery/categories');
    return { ...q, categories: unwrap(q) ?? [] };
};
export const useGallery = (params: { category?: string; page?: number }) =>
    useLocaleQuery<Paginated<GalleryItem>>(['gallery'], '/gallery', { per_page: 24, ...params });
export const useCompanyProfile = () => {
    const q = useLocaleQuery<{ data: CompanyProfileInfo }>(['company-profile'], '/company-profile');
    return { ...q, profile: unwrap(q) };
};
