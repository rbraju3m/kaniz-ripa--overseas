import { ArrowRight, BadgeCheck, CheckCircle2, Download, FileText, Phone } from 'lucide-react';
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useSite } from '@/hooks/queries';
import { useI18n } from '@/lib/i18n';
import type { Country, HomePayload, Page } from '@/lib/types';
import { cn, formatNumber, toE164 } from '@/lib/utils';
import { PartnerCard } from '../cards/PartnerCard';
import { PortfolioCard } from '../cards/PortfolioCard';
import { ServiceCard } from '../cards/ServiceCard';
import { StoryCard } from '../cards/StoryCard';
import { ContactForm } from '../contact/ContactForm';
import { ContactInfo } from '../contact/ContactInfo';
import { ButtonLink } from '../ui/Button';
import { ResponsiveImage } from '../ui/ResponsiveImage';
import { Section, SectionHeading } from '../ui/Section';
import { CountUp } from '../ui/CountUp';
import { Reveal } from '../ui/Reveal';
import { TeamGrid } from '../team/TeamCard';
import { isMappable, RouteMap } from './RouteMap';

/** Cycles through the served countries ("Recruitment activities in: Malaysia"). Static with reduced motion. */
function RotatingCountries({ countries }: { countries: Country[] }) {
    const { t } = useI18n();
    const [i, setI] = useState(0);
    useEffect(() => {
        if (countries.length < 2 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
        const id = window.setInterval(() => setI((n) => (n + 1) % countries.length), 2600);
        return () => window.clearInterval(id);
    }, [countries.length]);
    if (!countries.length) return null;
    const c = countries[i % countries.length];
    return (
        <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-base text-navy-200" aria-live="off">
            <span>{t.home.servedIn}</span>
            <span key={c.iso2} className="inline-flex animate-word-in items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-semibold text-white ring-1 ring-white/15">
                <span aria-hidden>{c.flag}</span>{c.name}
            </span>
        </p>
    );
}

/** Gentle 3D tilt that follows the mouse (desktop only, off with reduced motion). */
function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const move = (e: ReactPointerEvent) => {
        const el = ref.current;
        if (!el || e.pointerType !== 'mouse' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(1000px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg)`;
    };
    const leave = () => { if (ref.current) ref.current.style.transform = ''; };
    return <div ref={ref} onPointerMove={move} onPointerLeave={leave} className={cn('transition-transform duration-300 ease-out will-change-transform', className)}>{children}</div>;
}

export function Hero({ countries }: { countries: Country[] }) {
    const { t, path } = useI18n();
    const { site } = useSite();
    const name = site?.settings.general?.site_name ?? t.meta.siteName;
    const tagline = site?.settings.general?.tagline;
    const phone = site?.settings.contact?.phone;
    const step = (n: number) => ({ animationDelay: `${n * 90}ms` });

    return (
        <section className="relative isolate overflow-hidden bg-navy-900 pb-24 pt-32 text-white sm:pt-40 lg:pb-32">
            {/* Slowly drifting light, plus a faint dot grid. */}
            <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -right-32 -top-40 size-[42rem] animate-float-slow rounded-full bg-royal-600/40 blur-3xl" />
                <div className="absolute -bottom-48 -left-32 size-[34rem] animate-float-slower rounded-full bg-brand-green-700/30 blur-3xl" />
                <div className="absolute left-1/2 top-1/3 size-[22rem] animate-float-slow rounded-full bg-gold-500/10 blur-3xl [animation-delay:-6s]" />
                <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.06)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,#000_40%,transparent_75%)]" />
            </div>
            <div aria-hidden className="absolute -right-40 top-10 -z-10 size-[36rem] rounded-full border-[60px] border-white/[0.04]" />
            <div className="container-page grid items-center gap-12 lg:grid-cols-12">
                <div className="lg:col-span-6">
                    <p style={step(0)} className="tracking-eyebrow mb-5 inline-flex animate-fade-up items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-gold-300 ring-1 ring-white/15">
                        <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-gold-300 opacity-60" /><span className="relative inline-flex size-2 rounded-full bg-gold-300" /></span>
                        {t.home.eyebrow}
                    </p>
                    <h1 style={step(1)} className="animate-fade-up text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">
                        <span className="bg-gradient-to-r from-white via-white to-gold-300 bg-clip-text text-transparent">{name}</span>
                    </h1>
                    {tagline && <p style={step(2)} className="mt-5 animate-fade-up font-display text-xl font-semibold text-gold-300 sm:text-2xl">{tagline}</p>}
                    <p style={step(3)} className="mt-6 max-w-xl animate-fade-up text-lg text-navy-200">{t.home.heroLead}</p>
                    <div style={step(4)} className="animate-fade-up"><RotatingCountries countries={countries} /></div>
                    <div style={step(5)} className="mt-9 flex animate-fade-up flex-wrap gap-3">
                        {site?.company_profile_available && <ButtonLink to={path('company-profile')} size="lg" variant="gold"><FileText className="size-5" /> {t.home.ctaProfile}</ButtonLink>}
                        <ButtonLink to={path('contact')} size="lg" variant="light" className="group">{t.home.ctaContact} <ArrowRight className="size-5 transition group-hover:translate-x-1" /></ButtonLink>
                    </div>
                    {phone && (
                        <a href={`tel:${toE164(phone)}`} style={step(6)} className="group mt-8 inline-flex animate-fade-up items-center gap-3 text-sm text-navy-200 transition hover:text-white">
                            <span className="relative grid size-9 place-items-center rounded-full bg-brand-green-700 transition group-hover:scale-110">
                                <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-brand-green-600 opacity-40 [animation-duration:2.4s]" />
                                <Phone className="relative size-4 text-white" />
                            </span>
                            {phone}
                        </a>
                    )}
                </div>
                <div className="animate-fade-up lg:col-span-6" style={step(3)}>
                    {countries.length > 0 && (
                        <TiltCard>
                            <div className="relative rounded-[2rem] bg-white/[0.05] p-4 shadow-2xl ring-1 ring-white/10 backdrop-blur-sm sm:p-6">
                                <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/10 via-transparent to-transparent" />
                                <p className="tracking-eyebrow mb-2 px-2 text-xs font-semibold text-navy-300">{t.home.servedIn}</p>
                                <RouteMap countries={countries} homeLabel={t.home.dhaka} />
                                {countries.some((c) => !isMappable(c.iso2)) && (
                                    <div className="flex flex-wrap justify-center gap-2 px-2 pb-1">
                                        {countries.filter((c) => !isMappable(c.iso2)).map((c) => <span key={c.iso2} className="rounded-full bg-white/95 px-3 py-1 text-[13px] font-semibold text-navy-900 shadow">{c.flag} {c.name}</span>)}
                                    </div>
                                )}
                            </div>
                        </TiltCard>
                    )}
                </div>
            </div>
        </section>
    );
}

/** Endless strip of partner names (pauses on hover; static list with reduced motion). */
export function PartnerMarquee({ partners }: { partners: HomePayload['partners'] }) {
    const { t, path } = useI18n();
    if (partners.length < 2) return null;
    const row = (hidden: boolean) => (
        <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-4 pr-4">
            {partners.map((p) => (
                <li key={p.id}>
                    <Link to={path(`partners/${p.slug}`)} tabIndex={hidden ? -1 : undefined} className="flex items-center gap-3 whitespace-nowrap rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-navy-900 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:ring-gold-500">
                        {p.country?.flag && <span aria-hidden className="text-lg">{p.country.flag}</span>}
                        {p.name}
                    </Link>
                </li>
            ))}
        </ul>
    );
    return (
        <div className="py-10 sm:py-12">
            <p className="tracking-eyebrow mb-5 text-center text-xs font-semibold text-slate-500">{t.home.partnersTitle}</p>
            <div className="mask-fade-x group flex overflow-hidden">
                <div className="flex animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
                    {row(false)}{row(true)}{row(true)}{row(true)}
                </div>
            </div>
        </div>
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
            <Reveal stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-sm:-mx-4 max-sm:flex max-sm:snap-x max-sm:snap-mandatory max-sm:gap-4 max-sm:overflow-x-auto max-sm:px-4 max-sm:pb-3 max-sm:[scrollbar-width:none] max-sm:[&>*]:w-[82%] max-sm:[&>*]:shrink-0 max-sm:[&>*]:snap-start">
                {home.services.map((s, i) => <ServiceCard key={s.id} service={s} index={i} />)}
            </Reveal>
        </Section>
    );
}

/** Interactive explorer: country cards beside the route map; hovering either highlights the route. */
export function CountriesSection({ countries, projects = {} }: { countries: Country[]; projects?: Record<string, number> }) {
    const { t, path, locale } = useI18n();
    const [active, setActive] = useState<string | null>(null);
    if (!countries.length) return null;
    const count = (iso: string) => projects[iso] ?? 0;
    return (
        <Section>
            <SectionHeading eyebrow={t.portfolio.country} title={t.home.countriesTitle} lead={t.home.countriesLead} />
            <div className="grid items-center gap-8 lg:grid-cols-5">
                <Reveal stagger className="grid gap-3 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-1">
                    {countries.map((c) => {
                        const n = count(c.iso2);
                        const on = active === c.iso2;
                        return (
                            <Link key={c.iso2} to={`${path('portfolio')}?country=${c.iso2}`}
                                onMouseEnter={() => setActive(c.iso2)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(c.iso2)} onBlur={() => setActive(null)}
                                className={cn('spotlight group flex items-center gap-4 rounded-card p-4 ring-1 transition duration-300', on ? 'bg-white shadow-lift ring-gold-300 lg:translate-x-2' : 'bg-brand-green-50 ring-brand-green-100')}>
                                <span className={cn('grid size-12 shrink-0 place-items-center rounded-xl bg-white text-3xl shadow-soft transition duration-300', on && '-rotate-6 scale-110')} aria-hidden>{c.flag}</span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-lg font-semibold text-navy-900">{c.name}</span>
                                    {n > 0 && <span className="block text-sm text-slate-500">{n === 1 ? t.home.projectCount : t.home.projectsCount.replace('{n}', formatNumber(n, locale))}</span>}
                                </span>
                                <ArrowRight className={cn('size-5 transition', on ? 'translate-x-1 text-brand-green-700' : 'text-navy-300')} aria-hidden />
                            </Link>
                        );
                    })}
                </Reveal>
                <div className="lg:col-span-3">
                    <div className="relative overflow-hidden rounded-[2rem] bg-navy-900 p-4 shadow-lift sm:p-6">
                        <div aria-hidden className="absolute -right-20 -top-20 size-72 animate-float-slow rounded-full bg-royal-600/40 blur-3xl" />
                        <div aria-hidden className="absolute -bottom-24 -left-10 size-64 animate-float-slower rounded-full bg-brand-green-700/30 blur-3xl" />
                        <div className="relative">
                            <RouteMap countries={countries} homeLabel={t.home.dhaka} active={active} onHover={setActive} />
                            <p className="px-2 pt-1 text-center text-xs text-navy-300">{t.home.exploreHint}</p>
                        </div>
                    </div>
                </div>
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
            <Reveal stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 max-sm:-mx-4 max-sm:flex max-sm:snap-x max-sm:snap-mandatory max-sm:gap-4 max-sm:overflow-x-auto max-sm:px-4 max-sm:pb-3 max-sm:[scrollbar-width:none] max-sm:[&>*]:w-[82%] max-sm:[&>*]:shrink-0 max-sm:[&>*]:snap-start">
                {home.partners.map((p) => <PartnerCard key={p.id} partner={p} />)}
            </Reveal>
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
            <Reveal stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-sm:-mx-4 max-sm:flex max-sm:snap-x max-sm:snap-mandatory max-sm:gap-4 max-sm:overflow-x-auto max-sm:px-4 max-sm:pb-3 max-sm:[scrollbar-width:none] max-sm:[&>*]:w-[82%] max-sm:[&>*]:shrink-0 max-sm:[&>*]:snap-start">
                {home.portfolios.map((p) => <PortfolioCard key={p.id} item={p} />)}
            </Reveal>
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
                <Reveal stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {page.sections.map((s) => (
                        <div key={s.key} className="rounded-card bg-white/[0.04] p-6 ring-1 ring-white/10">
                            <BadgeCheck className="mb-4 size-7 text-gold-300" aria-hidden />
                            <h3 className="text-lg font-semibold text-white">{s.title}</h3>
                            {s.body && <div className="mt-2 text-sm text-navy-200 [&_p]:m-0" dangerouslySetInnerHTML={{ __html: s.body }} />}
                        </div>
                    ))}
                </Reveal>
            ) : page.body ? (
                <div className="prose-content max-w-3xl text-navy-100 [&_li]:flex [&_li]:gap-2 [&_ul]:list-none [&_ul]:pl-0" dangerouslySetInnerHTML={{ __html: page.body }} />
            ) : null}
        </Section>
    );
}

/** Rendered only when a company profile PDF can actually be downloaded. */
export function ProfileDownload({ available }: { available: boolean }) {
    const { t, path } = useI18n();
    if (!available) return null;
    return (
        <Section>
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-navy-900 via-navy-800 to-royal-700 p-8 text-white sm:p-12 lg:p-16">
                <div aria-hidden className="absolute -right-20 -top-20 size-72 rounded-full border-[36px] border-white/5" />
                <div className="relative grid items-center gap-10 lg:grid-cols-5">
                    <div className="lg:col-span-3">
                        <h2 className="text-3xl font-bold text-white sm:text-4xl">{t.home.profileTitle}</h2>
                        <p className="mt-4 max-w-xl text-lg text-navy-200">{t.home.profileLead}</p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <ButtonLink to={path('company-profile')} variant="gold" size="lg"><Download className="size-5" /> {t.profile.download}</ButtonLink>
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

/** Real totals from published records; hidden when everything is zero. */
export function StatsBand({ stats }: { stats: HomePayload['stats'] }) {
    const { t } = useI18n();
    const items = [
        { value: stats.countries, label: t.home.statCountries },
        { value: stats.partners, label: t.home.statPartners },
        { value: stats.projects, label: t.home.statProjects },
        { value: stats.services, label: t.home.statServices },
    ].filter((i) => i.value > 0);
    if (!items.length) return null;
    return (
        <div className="relative z-10 -mt-12 sm:-mt-14">
            <div className="container-page">
                <Reveal stagger className={`grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-slate-200 shadow-lift ring-1 ring-slate-200 ${items.length === 4 ? 'lg:grid-cols-4' : items.length === 3 ? 'lg:grid-cols-3' : ''}`}>
                    {items.map((i) => (
                        <div key={i.label} className="bg-white px-6 py-6 text-center sm:py-8">
                            <p className="font-display text-3xl font-extrabold text-navy-900 sm:text-4xl"><CountUp value={i.value} /></p>
                            <p className="mt-1 text-sm font-medium text-slate-600">{i.label}</p>
                        </div>
                    ))}
                </Reveal>
            </div>
        </div>
    );
}

export function TeamSection({ home }: { home: HomePayload }) {
    const { t, path } = useI18n();
    if (!home.team.length) return null;
    return (
        <Section tone="slate">
            <SectionHeading eyebrow={t.home.aboutTitle} title={t.home.teamTitle} lead={t.home.teamLead}
                action={<ButtonLink to={path('about')} variant="secondary" size="sm">{t.common.learnMore} <ArrowRight className="size-4" /></ButtonLink>} />
            <TeamGrid team={home.team} />
        </Section>
    );
}
