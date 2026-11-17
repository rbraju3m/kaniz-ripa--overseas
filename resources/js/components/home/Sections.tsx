import { ArrowRight, BadgeCheck, CheckCircle2, Download, FileText, Phone } from 'lucide-react';
import { Link } from 'react-router';
import { useSite } from '@/hooks/queries';
import { useI18n } from '@/lib/i18n';
import type { Country, HomePayload, Page } from '@/lib/types';
import { toE164 } from '@/lib/utils';
import { PartnerCard } from '../cards/PartnerCard';
import { PortfolioCard } from '../cards/PortfolioCard';
import { ServiceCard } from '../cards/ServiceCard';
import { StoryCard } from '../cards/StoryCard';
import { ContactForm } from '../contact/ContactForm';
import { ContactInfo } from '../contact/ContactInfo';
import { ButtonLink } from '../ui/Button';
import { ResponsiveImage } from '../ui/ResponsiveImage';
import { Section, SectionHeading } from '../ui/Section';
import { RouteMap } from './RouteMap';

export function Hero({ countries }: { countries: Country[] }) {
    const { t, path } = useI18n();
    const { site } = useSite();
    const name = site?.settings.general?.site_name ?? t.meta.siteName;
    const tagline = site?.settings.general?.tagline;
    const phone = site?.settings.contact?.phone;

    return (
        <section className="relative isolate overflow-hidden bg-navy-900 pb-20 pt-32 text-white sm:pt-40 lg:pb-28">
            <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_85%_-10%,rgba(29,63,168,0.55),transparent),radial-gradient(40rem_30rem_at_0%_110%,rgba(21,128,61,0.35),transparent)]" />
            <div aria-hidden className="absolute -right-40 top-10 -z-10 size-[36rem] rounded-full border-[60px] border-white/[0.04]" />
            <div className="container-page grid items-center gap-12 lg:grid-cols-12">
                <div className="animate-fade-up lg:col-span-6">
                    <p className="tracking-eyebrow mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-gold-300 ring-1 ring-white/15">
                        <span className="size-1.5 rounded-full bg-gold-300" /> {t.home.eyebrow}
                    </p>
                    <h1 className="text-4xl font-extrabold leading-[1.1] text-white sm:text-5xl lg:text-6xl">{name}</h1>
                    {tagline && <p className="mt-5 font-display text-xl font-semibold text-gold-300 sm:text-2xl">{tagline}</p>}
                    <p className="mt-6 max-w-xl text-lg text-navy-200">{t.home.heroLead}</p>
                    <div className="mt-9 flex flex-wrap gap-3">
                        <ButtonLink to={path('company-profile')} size="lg" variant="gold"><FileText className="size-5" /> {t.home.ctaProfile}</ButtonLink>
                        <ButtonLink to={path('contact')} size="lg" variant="light">{t.home.ctaContact} <ArrowRight className="size-5" /></ButtonLink>
                    </div>
                    {phone && (
                        <a href={`tel:${toE164(phone)}`} className="mt-8 inline-flex items-center gap-3 text-sm text-navy-200 hover:text-white">
                            <span className="grid size-9 place-items-center rounded-full bg-brand-green-700"><Phone className="size-4 text-white" /></span>
                            {phone}
                        </a>
                    )}
                </div>
                <div className="lg:col-span-6">
                    {countries.length > 0 && (
                        <div className="relative rounded-[2rem] bg-white/[0.04] p-4 ring-1 ring-white/10 backdrop-blur-sm sm:p-6">
                            <p className="tracking-eyebrow mb-2 px-2 text-xs font-semibold text-navy-300">{t.home.servedIn}</p>
                            <RouteMap countries={countries} homeLabel={t.home.dhaka} />
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

function PageBlock({ page, eyebrow, linkTo }: { page: Page; eyebrow: string; linkTo?: string }) {
    const { t } = useI18n();
    return (
        <div className="grid items-center gap-12 lg:grid-cols-2">
            {page.cover && (
                <div className="relative">
                    <div aria-hidden className="absolute -inset-3 -z-10 rotate-2 rounded-[2rem] bg-brand-green-100" />
                    <ResponsiveImage media={page.cover} sizes="(min-width:1024px) 50vw, 100vw" className="aspect-[4/3] w-full rounded-3xl shadow-lift" />
                </div>
            )}
            <div className={page.cover ? '' : 'lg:col-span-2 lg:max-w-3xl'}>
                <SectionHeading eyebrow={eyebrow} title={page.title ?? ''} lead={page.summary} />
                {page.body && <div className="prose-content -mt-4" dangerouslySetInnerHTML={{ __html: page.body }} />}
                {linkTo && <ButtonLink to={linkTo} variant="secondary" className="mt-8">{t.common.learnMore} <ArrowRight className="size-4" /></ButtonLink>}
            </div>
        </div>
    );
}

export function IntroAndAbout({ home }: { home: HomePayload }) {
    const { t, path } = useI18n();
    if (!home.intro && !home.about) return null;
    return (
        <Section>
            <div className="space-y-20">
                {home.intro && <PageBlock page={home.intro} eyebrow={t.meta.siteName} />}
                {home.about && <PageBlock page={home.about} eyebrow={t.home.aboutTitle} linkTo={path('about')} />}
            </div>
        </Section>
    );
}

export function ServicesSection({ home }: { home: HomePayload }) {
    const { t, path } = useI18n();
    if (!home.services.length) return null;
    return (
        <Section tone="slate">
            <SectionHeading eyebrow={t.nav.services} title={t.home.servicesTitle} lead={t.home.servicesLead}
                action={<ButtonLink to={path('services')} variant="secondary" size="sm">{t.common.viewAll} <ArrowRight className="size-4" /></ButtonLink>} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {home.services.map((s, i) => <ServiceCard key={s.id} service={s} index={i} />)}
            </div>
        </Section>
    );
}

export function CountriesSection({ countries }: { countries: Country[] }) {
    const { t, path } = useI18n();
    if (!countries.length) return null;
    return (
        <Section>
            <SectionHeading eyebrow={t.portfolio.country} title={t.home.countriesTitle} lead={t.home.countriesLead} align="center" />
            <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {countries.map((c) => (
                    <Link key={c.iso2} to={`${path('portfolio')}?country=${c.iso2}`} className="group flex items-center gap-4 rounded-card bg-brand-green-50 p-5 ring-1 ring-brand-green-100 transition hover:bg-white hover:shadow-lift">
                        <span className="text-4xl" aria-hidden>{c.flag}</span>
                        <span className="flex-1 text-lg font-semibold text-navy-900">{c.name}</span>
                        <ArrowRight className="size-5 text-navy-300 transition group-hover:translate-x-1 group-hover:text-brand-green-700" aria-hidden />
                    </Link>
                ))}
            </div>
        </Section>
    );
}

export function PartnersSection({ home }: { home: HomePayload }) {
    const { t, path } = useI18n();
    if (!home.partners.length) return null;
    return (
        <Section tone="mint">
            <SectionHeading eyebrow={t.nav.partners} title={t.home.partnersTitle} lead={t.home.partnersLead}
                action={<ButtonLink to={path('partners')} variant="secondary" size="sm">{t.common.viewAll} <ArrowRight className="size-4" /></ButtonLink>} />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {home.partners.map((p) => <PartnerCard key={p.id} partner={p} />)}
            </div>
        </Section>
    );
}

export function PortfolioSection({ home }: { home: HomePayload }) {
    const { t, path } = useI18n();
    if (!home.portfolios.length) return null;
    return (
        <Section>
            <SectionHeading eyebrow={t.nav.portfolio} title={t.home.portfolioTitle} lead={t.home.portfolioLead}
                action={<ButtonLink to={path('portfolio')} variant="secondary" size="sm">{t.common.viewAll} <ArrowRight className="size-4" /></ButtonLink>} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {home.portfolios.map((p) => <PortfolioCard key={p.id} item={p} />)}
            </div>
        </Section>
    );
}

export function StoriesSection({ home }: { home: HomePayload }) {
    const { t, path } = useI18n();
    if (!home.success_stories.length) return null;
    return (
        <Section tone="slate">
            <SectionHeading eyebrow={t.nav['success-stories']} title={t.home.storiesTitle} lead={t.home.storiesLead}
                action={<ButtonLink to={path('success-stories')} variant="secondary" size="sm">{t.common.viewAll} <ArrowRight className="size-4" /></ButtonLink>} />
            <div className="-mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
                {home.success_stories.map((s) => <div key={s.id} className="w-[85%] shrink-0 snap-start sm:w-auto"><StoryCard story={s} /></div>)}
            </div>
        </Section>
    );
}

export function WhyChooseUs({ page }: { page: Page | null }) {
    const { t } = useI18n();
    if (!page) return null;
    return (
        <Section tone="navy">
            <SectionHeading eyebrow={t.home.whyTitle} title={page.title ?? t.home.whyTitle} lead={page.summary} dark />
            {page.sections && page.sections.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {page.sections.map((s) => (
                        <div key={s.key} className="rounded-card bg-white/[0.04] p-6 ring-1 ring-white/10">
                            <BadgeCheck className="mb-4 size-7 text-gold-300" aria-hidden />
                            <h3 className="text-lg font-semibold text-white">{s.title}</h3>
                            {s.body && <div className="mt-2 text-sm text-navy-200 [&_p]:m-0" dangerouslySetInnerHTML={{ __html: s.body }} />}
                        </div>
                    ))}
                </div>
            ) : page.body ? (
                <div className="prose-content max-w-3xl text-navy-100 [&_li]:flex [&_li]:gap-2 [&_ul]:list-none [&_ul]:pl-0" dangerouslySetInnerHTML={{ __html: page.body }} />
            ) : null}
        </Section>
    );
}

export function ProfileDownload({ available }: { available: boolean }) {
    const { t, path } = useI18n();
    return (
        <Section>
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-navy-900 via-navy-800 to-royal-700 p-8 text-white sm:p-12 lg:p-16">
                <div aria-hidden className="absolute -right-20 -top-20 size-72 rounded-full border-[36px] border-white/5" />
                <div className="relative grid items-center gap-10 lg:grid-cols-5">
                    <div className="lg:col-span-3">
                        <h2 className="text-3xl font-bold text-white sm:text-4xl">{t.home.profileTitle}</h2>
                        <p className="mt-4 max-w-xl text-lg text-navy-200">{available ? t.home.profileLead : t.home.profileUnavailable}</p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            {available
                                ? <ButtonLink to={path('company-profile')} variant="gold" size="lg"><Download className="size-5" /> {t.profile.download}</ButtonLink>
                                : <ButtonLink to={path('contact')} variant="gold" size="lg">{t.home.ctaContact} <ArrowRight className="size-5" /></ButtonLink>}
                        </div>
                    </div>
                    <div className="hidden justify-center lg:col-span-2 lg:flex" aria-hidden>
                        <div className="relative h-64 w-48 rotate-3 rounded-xl bg-white p-5 shadow-2xl">
                            <div className="h-24 rounded-lg bg-navy-900" />
                            <div className="mt-4 h-2 w-3/4 rounded bg-gold-500" />
                            <div className="mt-3 space-y-2">{[90, 70, 80, 60].map((w) => <div key={w} className="h-1.5 rounded bg-slate-200" style={{ width: `${w}%` }} />)}</div>
                            <FileText className="absolute bottom-4 right-4 size-6 text-brand-green-700" />
                        </div>
                    </div>
                </div>
            </div>
        </Section>
    );
}

export function ContactSection() {
    const { t } = useI18n();
    return (
        <Section tone="mint" id="contact">
            <div className="grid gap-12 lg:grid-cols-5">
                <div className="lg:col-span-2">
                    <SectionHeading eyebrow={t.nav.contact} title={t.home.contactTitle} />
                    <ContactInfo />
                </div>
                <div className="rounded-[1.5rem] bg-white p-6 shadow-soft ring-1 ring-slate-200/70 sm:p-10 lg:col-span-3">
                    <h3 className="mb-6 flex items-center gap-2 text-xl font-semibold"><CheckCircle2 className="size-5 text-brand-green-700" /> {t.contact.formTitle}</h3>
                    <ContactForm />
                </div>
            </div>
        </Section>
    );
}
