import { useEffect } from 'react';
import { useI18n } from './i18n';

/**
 * Keeps <title> and <meta name="description"> in sync during client-side
 * navigation. The first page load already has server-rendered metadata.
 */
export function useDocumentMeta(title?: string | null, description?: string | null) {
    const { t } = useI18n();

    useEffect(() => {
        const site = t.meta.siteName;
        document.title = title ? `${title} | ${site}` : `${site} — ${t.meta.agency}`;

        if (description) {
            let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
            if (!tag) {
                tag = document.createElement('meta');
                tag.name = 'description';
                document.head.appendChild(tag);
            }
            tag.content = description.replace(/<[^>]*>/g, '').slice(0, 300);
        }
    }, [title, description, t]);
}
