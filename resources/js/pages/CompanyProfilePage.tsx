import { Download, Eye, FileText } from 'lucide-react';
import { useCompanyProfile } from '@/hooks/queries';
import { useI18n } from '@/lib/i18n';
import { useDocumentMeta } from '@/lib/seo';
import { formatBytes, formatDate } from '@/lib/utils';
import { ContactSection } from '@/components/home/Sections';
import { ButtonAnchor } from '@/components/ui/Button';
import { PageHeader, Section } from '@/components/ui/Section';
import { Skeleton } from '@/components/ui/States';

export default function CompanyProfilePage() {
    const { t, locale } = useI18n();
    const { profile, isLoading, isError } = useCompanyProfile();
    useDocumentMeta(t.pages.profileTitle, profile?.description ?? t.home.profileLead);

    return (
        <>
            <PageHeader title={profile?.title ?? t.pages.profileTitle} lead={profile?.description ?? t.home.profileLead} />
            <Section>
                {isLoading && <Skeleton className="h-64 w-full" />}
                {/* 404 = not published yet. */}
                {isError && (
                    <div className="mx-auto max-w-xl rounded-card bg-gold-100/60 p-8 text-center ring-1 ring-gold-100">
                        <FileText className="mx-auto mb-4 size-10 text-gold-600" />
                        <p className="text-navy-900">{t.home.profileUnavailable}</p>
                    </div>
                )}
                {profile && (
                    <div className="grid gap-10 lg:grid-cols-5">
                        <div className="lg:col-span-2">
                            <div className="rounded-card bg-navy-900 p-8 text-white">
                                <FileText className="mb-5 size-10 text-gold-300" />
                                <dl className="space-y-3 text-sm">
                                    <div className="flex justify-between gap-4"><dt className="text-navy-300">{t.profile.language}</dt><dd>{profile.locale === 'bn' ? 'বাংলা' : 'English'}</dd></div>
                                    <div className="flex justify-between gap-4"><dt className="text-navy-300">{t.profile.size}</dt><dd>{formatBytes(profile.size, locale)}</dd></div>
                                    {profile.updated_at && <div className="flex justify-between gap-4"><dt className="text-navy-300">{t.profile.updated}</dt><dd>{formatDate(profile.updated_at, locale, { day: 'numeric', month: 'long', year: 'numeric' })}</dd></div>}
                                </dl>
                                <div className="mt-8 flex flex-wrap gap-3">
                                    <ButtonAnchor href={profile.download_url} variant="gold" size="lg" download><Download className="size-5" /> {t.profile.download}</ButtonAnchor>
                                    <ButtonAnchor href={profile.preview_url} target="_blank" rel="noopener" variant="light"><Eye className="size-4" /> {t.profile.preview}</ButtonAnchor>
                                </div>
                            </div>
                        </div>
                        <div className="hidden overflow-hidden rounded-card ring-1 ring-slate-200 lg:col-span-3 lg:block">
                            <iframe src={`${profile.preview_url}#view=FitH`} title={t.pages.profileTitle} className="h-[75vh] w-full" loading="lazy" />
                        </div>
                    </div>
                )}
            </Section>
            <ContactSection />
        </>
    );
}
