import type { Media } from '@/lib/types';
import { cn } from '@/lib/utils';

const WIDTHS = { sm: 480, md: 960, lg: 1600 } as const;

/** WebP with srcset from server variants; lazy by default for good LCP/CLS. */
export function ResponsiveImage({ media, alt, sizes = '100vw', className, eager = false }: {
    media: Media | null | undefined; alt?: string | null; sizes?: string; className?: string; eager?: boolean;
}) {
    if (!media?.url) return null;

    const srcSet = [
        ...(Object.entries(media.variants) as [keyof typeof WIDTHS, string][]).map(([k, url]) => `${url} ${WIDTHS[k]}w`),
        media.width ? `${media.url} ${media.width}w` : null,
    ].filter(Boolean).join(', ');

    return (
        <img
            src={media.variants.md ?? media.url}
            srcSet={srcSet || undefined}
            sizes={srcSet ? sizes : undefined}
            width={media.width ?? undefined}
            height={media.height ?? undefined}
            alt={alt ?? media.alt ?? ''}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={eager ? 'high' : undefined}
            className={cn('object-cover', className)}
        />
    );
}
