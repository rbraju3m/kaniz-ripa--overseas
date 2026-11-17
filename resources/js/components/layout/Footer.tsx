import { Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router';
import { useSite } from '@/hooks/queries';
import { useI18n } from '@/lib/i18n';
import { formatNumber, toE164 } from '@/lib/utils';
import { FacebookIcon, LinkedinIcon, YoutubeIcon } from '../ui/SocialIcons';
import { useMenuLinks } from './Header';
import { Logo } from './Logo';

export function SocialLinks({ className = '' }: { className?: string }) {
    const { site } = useSite();
    const s = site?.settings.social;
    const links = [
        { href: s?.facebook_url, label: 'Facebook', Icon: FacebookIcon },
        { href: s?.youtube_url, label: 'YouTube', Icon: YoutubeIcon },
        { href: s?.linkedin_url, label: 'LinkedIn', Icon: LinkedinIcon },
    ].filter((l) => !!l.href);
    if (!links.length) return null;
    return (
        <div className={`flex gap-2 ${className}`}>
            {links.map(({ href, label, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-gold-500 hover:text-navy-950">
                    <Icon className="size-5" />
                </a>
            ))}
        </div>
    );
}

export function Footer() {
    const { t, locale } = useI18n();
    const { site } = useSite();
    const links = useMenuLinks('footer');
    const c = site?.settings.contact;
    const year = formatNumber(new Date().getFullYear(), locale).replace(/[,٬]/g, '');

    return (
        <footer className="relative overflow-hidden bg-navy-950 text-navy-200">
            <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-green-700 via-gold-500 to-royal-600" />
            <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12">
                <div className="lg:col-span-5">
                    <Logo dark />
                    <p className="mt-5 max-w-sm text-sm leading-relaxed text-navy-300">{t.footer.tagline}</p>
                    <SocialLinks className="mt-6" />
                </div>
                <div className="lg:col-span-3">
                    <h2 className="tracking-eyebrow mb-4 text-xs font-semibold text-gold-300">{t.footer.quickLinks}</h2>
                    <ul className="space-y-2.5 text-sm">
                        {links.map((l) => (
                            <li key={l.key}>
                                {l.external
                                    ? <a href={l.to} target="_blank" rel="noopener noreferrer" className="hover:text-white">{l.label}</a>
                                    : <Link to={l.to} className="transition hover:text-white">{l.label}</Link>}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="lg:col-span-4">
                    <h2 className="tracking-eyebrow mb-4 text-xs font-semibold text-gold-300">{t.footer.contact}</h2>
                    <ul className="space-y-4 text-sm">
                        {c?.address && <li className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-gold-300" aria-hidden /><span>{c.address}</span></li>}
                        {c?.phone && <li className="flex gap-3"><Phone className="mt-0.5 size-4 shrink-0 text-gold-300" aria-hidden /><a href={`tel:${toE164(c.phone)}`} className="hover:text-white">{c.phone}</a></li>}
                        {c?.email && <li className="flex gap-3"><Mail className="mt-0.5 size-4 shrink-0 text-gold-300" aria-hidden /><a href={`mailto:${c.email}`} className="hover:text-white">{c.email}</a></li>}
                    </ul>
                </div>
            </div>
            <div className="border-t border-white/10">
                <div className="container-page flex flex-col gap-2 py-6 text-xs text-navy-300 sm:flex-row sm:justify-between">
                    <p>© {year} {t.meta.siteName}. {t.footer.rights}</p>
                </div>
            </div>
        </footer>
    );
}
