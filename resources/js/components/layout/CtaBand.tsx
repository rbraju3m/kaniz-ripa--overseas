import { ArrowRight, MessageCircle, Phone } from 'lucide-react';
import { useSite, useTeam } from '@/hooks/queries';
import { useI18n } from '@/lib/i18n';
import { toE164, whatsappLink } from '@/lib/utils';
import { ButtonAnchor, ButtonLink } from '../ui/Button';
import { Reveal } from '../ui/Reveal';

/** Closing call-to-action on inner pages: contact page, office phone and WhatsApp. */
export function CtaBand() {
    const { t, path } = useI18n();
    const { site } = useSite();
    const { team } = useTeam();
    const phone = site?.settings.contact?.phone;
    const wa = team.find((m) => m.phone && m.whatsapp);

    return (
        <section className="tone-base bg-white py-14 sm:py-20">
            <div className="container-page">
                <Reveal className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-navy-900 via-navy-800 to-royal-700 px-6 py-12 text-white shadow-lift sm:px-12 lg:px-16">
                    <div aria-hidden className="absolute -right-24 -top-24 size-80 animate-float-slow rounded-full bg-gold-500/15 blur-3xl" />
                    <div aria-hidden className="absolute -bottom-28 -left-16 size-72 animate-float-slower rounded-full bg-brand-green-600/25 blur-3xl" />
                    <div aria-hidden className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.06)_1px,transparent_1px)] [background-size:20px_20px] [mask-image:linear-gradient(to_left,#000,transparent_70%)]" />
                    <div className="relative grid items-center gap-8 lg:grid-cols-5">
                        <div className="lg:col-span-3">
                            <h2 className="text-2xl font-bold text-white sm:text-3xl">{t.cta.title}</h2>
                            <p className="mt-3 max-w-xl text-navy-200">{t.cta.lead}</p>
                        </div>
                        <div className="flex flex-wrap gap-3 lg:col-span-2 lg:justify-end">
                            <ButtonLink to={path('contact')} variant="gold" size="lg" className="group">{t.home.ctaContact} <ArrowRight className="size-5 transition group-hover:translate-x-1" /></ButtonLink>
                            {phone && <ButtonAnchor href={`tel:${toE164(phone)}`} variant="light" size="lg"><Phone className="size-5" /> {t.common.callUs}</ButtonAnchor>}
                            {wa?.phone && <ButtonAnchor href={whatsappLink(wa.phone)} target="_blank" rel="noopener noreferrer" variant="light" size="lg"><MessageCircle className="size-5" /> {t.contactFab.whatsapp}</ButtonAnchor>}
                        </div>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
