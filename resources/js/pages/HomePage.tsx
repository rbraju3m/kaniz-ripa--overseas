import { useHome } from '@/hooks/queries';
import { useDocumentMeta } from '@/lib/seo';
import { ContactSection, CountriesSection, Hero, IntroAndAbout, PartnerMarquee, PartnersSection, PortfolioSection, ProfileDownload, ServicesSection, StatsBand, StoriesSection, TeamSection, WhyChooseUs } from '@/components/home/Sections';
import { ErrorState } from '@/components/ui/States';

export default function HomePage() {
    const { home, isError, refetch } = useHome();
    useDocumentMeta(null, home?.intro?.summary);

    return (
        <>
            <Hero countries={home?.countries ?? []} />
            {isError && <div className="container-page py-16"><ErrorState onRetry={() => refetch()} /></div>}
            {home && (
                <>
                    {home.stats && <StatsBand stats={home.stats} />}
                    <PartnerMarquee partners={home.partners} />
                    <IntroAndAbout home={home} />
                    <ServicesSection home={home} />
                    <CountriesSection countries={home.countries} />
                    <PartnersSection home={home} />
                    <PortfolioSection home={home} />
                    {home.team && <TeamSection home={home} />}
                    <StoriesSection home={home} />
                    <WhyChooseUs page={home.why_choose_us} />
                    <ProfileDownload available={home.company_profile_available} />
                </>
            )}
            <ContactSection />
        </>
    );
}
