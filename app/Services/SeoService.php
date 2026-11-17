<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Media;
use App\Models\Portfolio;
use App\Models\SeoMetadata;
use App\Models\Service;
use App\Models\SuccessStory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * Server-side SEO for the SPA: resolves title/description/OG/canonical/hreflang
 * and JSON-LD for a public URL so crawlers and link previews see real metadata.
 */
class SeoService
{
    /** section => [route_key, bn title, en title] */
    public const SECTIONS = [
        '' => ['home', null, null],
        'about' => ['about', 'আমাদের সম্পর্কে', 'About Us'],
        'services' => ['services', 'সেবাসমূহ', 'Our Services'],
        'portfolio' => ['portfolio', 'পোর্টফোলিও', 'Portfolio'],
        'partners' => ['partners', 'অংশীদার প্রতিষ্ঠান', 'Partner Companies'],
        'success-stories' => ['success-stories', 'সাফল্যের গল্প', 'Success Stories'],
        'gallery' => ['gallery', 'গ্যালারি', 'Gallery'],
        'company-profile' => ['company-profile', 'কোম্পানি প্রোফাইল', 'Company Profile'],
        'contact' => ['contact', 'যোগাযোগ', 'Contact Us'],
    ];

    public function __construct(private readonly SettingsService $settings) {}

    public function forPath(string $locale, string $section, ?string $slug): array
    {
        $siteName = (string) $this->settings->get('site_name', 'Kaniz Ripa Overseas', $locale);
        $tagline = $this->publicSetting('tagline', $locale);
        $path = trim($section.($slug ? '/'.$slug : ''), '/');

        $meta = [
            'locale' => $locale,
            'title' => $tagline ? "{$siteName} — {$tagline}" : $siteName,
            'description' => $tagline ?? $siteName,
            'image' => $this->mediaUrl($this->settings->get('default_og_media_id')),
            'type' => 'website',
            'noindex' => false,
            'status' => 200,
            'canonical' => url("/{$locale}".($path ? "/{$path}" : '')),
            'alternates' => [],
            'jsonLd' => [$this->organization($locale, $siteName)],
        ];

        [$routeKey, $bnTitle, $enTitle] = self::SECTIONS[$section] ?? [null, null, null];
        if ($routeKey === null) {
            return ['status' => 404, 'noindex' => true, 'title' => $siteName] + $meta;
        }

        if ($section !== '') {
            $meta['title'] = ($locale === 'bn' ? $bnTitle : $enTitle)." | {$siteName}";
        }

        $record = $slug ? $this->findRecord($section, $slug) : null;
        if ($slug && ! $record) {
            return ['status' => 404, 'noindex' => true] + $meta;
        }

        $slugs = ['bn' => $slug, 'en' => $slug];
        if ($record) {
            $meta = $this->applyRecord($meta, $record, $locale, $siteName);
            if (method_exists($record, 'publicTranslation')) {
                foreach (['bn', 'en'] as $l) {
                    $t = $record->translations->where('is_reviewed', true)->firstWhere('locale', $l);
                    $slugs[$l] = $t?->slug ?? ($record instanceof Company ? $record->slug : null);
                }
            }
        }

        foreach (['bn', 'en'] as $l) {
            if (! $slug || $slugs[$l]) {
                $meta['alternates'][$l] = url("/{$l}".($section ? "/{$section}" : '').($slug ? '/'.$slugs[$l] : ''));
            }
        }
        $meta['alternates']['x-default'] = $meta['alternates']['bn'] ?? $meta['canonical'];

        // Admin-entered overrides win.
        $override = $record
            ? SeoMetadata::query()->where('seoable_type', $record::class)->where('seoable_id', $record->getKey())->where('locale', $locale)->first()
            : SeoMetadata::query()->where('route_key', $routeKey)->where('locale', $locale)->first();
        if ($override) {
            $meta['title'] = $override->meta_title ?: $meta['title'];
            $meta['description'] = $override->meta_description ?: $meta['description'];
            $meta['image'] = $this->mediaUrl($override->og_image_media_id) ?? $meta['image'];
            $meta['canonical'] = $override->canonical_url ?: $meta['canonical'];
            $meta['noindex'] = $override->noindex;
        }

        if ($section !== '') {
            $meta['jsonLd'][] = $this->breadcrumbs($locale, $siteName, $section, $bnTitle, $enTitle, $record ? $meta['heading'] ?? null : null);
        }

        $meta['description'] = Str::limit(trim(strip_tags((string) $meta['description'])), 300);

        return $meta;
    }

    private function findRecord(string $section, string $slug): ?Model
    {
        $bySlug = fn (Builder $q) => $q->whereHas('translations', fn ($t) => $t->where('slug', $slug)->where('is_reviewed', true))->with('translations');

        return match ($section) {
            'portfolio' => $bySlug(Portfolio::query()->published())->with('cover')->first(),
            'services' => $bySlug(Service::query()->published())->with('image')->first(),
            'success-stories' => $bySlug(SuccessStory::query()->publicVisible())->with('photo')->first(),
            'partners' => Company::query()->partners()->where('slug', $slug)->with(['translations', 'logo'])->first(),
            default => null,
        };
    }

    private function applyRecord(array $meta, Model $record, string $locale, string $siteName): array
    {
        $t = $record->publicTranslation($locale);

        [$heading, $description, $image] = match (true) {
            $record instanceof Portfolio => [$t?->title, $t?->summary, $record->cover],
            $record instanceof Service => [$t?->title, $t?->summary, $record->image],
            $record instanceof SuccessStory => [$t?->title, $t?->testimonial ?: $t?->story, $record->photo],
            $record instanceof Company => [$record->name, $t?->description, $record->logo],
            default => [null, null, null],
        };

        $meta['heading'] = $heading;
        $meta['title'] = $heading ? "{$heading} | {$siteName}" : $meta['title'];
        $meta['description'] = $description ?: $meta['description'];
        $meta['image'] = $image?->url('lg') ?? $meta['image'];
        $meta['type'] = 'article';

        return $meta;
    }

    private function organization(string $locale, string $siteName): array
    {
        $address = $this->settings->get('address', null, $locale);
        $sameAs = collect(['facebook_url', 'youtube_url', 'linkedin_url'])
            ->map(fn ($k) => $this->publicSetting($k, $locale))->filter()->values()->all();

        return array_filter([
            '@context' => 'https://schema.org',
            '@type' => 'EmploymentAgency',
            'name' => $siteName,
            'url' => url('/'),
            'logo' => $this->mediaUrl($this->settings->get('logo_media_id')),
            'telephone' => $this->settings->get('phone'),
            'email' => $this->publicSetting('email', $locale),
            'address' => $address ? ['@type' => 'PostalAddress', 'streetAddress' => $address, 'addressLocality' => 'Dhaka', 'postalCode' => '1213', 'addressCountry' => 'BD'] : null,
            'sameAs' => $sameAs ?: null,
        ]);
    }

    private function breadcrumbs(string $locale, string $siteName, string $section, ?string $bn, ?string $en, ?string $heading): array
    {
        $items = [
            ['name' => $siteName, 'item' => url("/{$locale}")],
            ['name' => $locale === 'bn' ? $bn : $en, 'item' => url("/{$locale}/{$section}")],
        ];
        if ($heading) {
            $items[] = ['name' => $heading, 'item' => url()->current()];
        }

        return [
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
            'itemListElement' => collect($items)->values()->map(fn ($i, $n) => ['@type' => 'ListItem', 'position' => $n + 1] + $i)->all(),
        ];
    }

    private function publicSetting(string $key, string $locale): mixed
    {
        $setting = $this->settings->all()->get($key);

        return $setting && ! $setting->is_placeholder ? $setting->valueFor($locale) : null;
    }

    private function mediaUrl(mixed $id): ?string
    {
        if (! $id) {
            return null;
        }

        return Media::query()->find($id)?->url('lg');
    }
}
