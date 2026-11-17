import { useI18n } from '@/lib/i18n';
import { useDocumentMeta } from '@/lib/seo';
import { ContactForm } from '@/components/contact/ContactForm';
import { ContactInfo, MapEmbed } from '@/components/contact/ContactInfo';
import { SocialLinks } from '@/components/layout/Footer';
import { PageHeader, Section } from '@/components/ui/Section';

export default function ContactPage() {
    const { t } = useI18n();
    useDocumentMeta(t.pages.contactTitle, t.pages.contactLead);

    return (
        <>
            <PageHeader title={t.pages.contactTitle} lead={t.pages.contactLead} />
            <Section>
                <div className="grid gap-12 lg:grid-cols-5">
                    <div className="space-y-8 lg:col-span-2">
                        <ContactInfo />
                        <div className="rounded-card bg-navy-900 p-6"><SocialLinks /></div>
                        <MapEmbed />
                    </div>
                    <div className="rounded-[1.5rem] bg-white p-6 shadow-soft ring-1 ring-slate-200/70 sm:p-10 lg:col-span-3">
                        <h2 className="mb-6 text-2xl font-semibold">{t.contact.formTitle}</h2>
                        <ContactForm />
                    </div>
                </div>
            </Section>
        </>
    );
}
