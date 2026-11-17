<?php

namespace App\Services;

use App\Enums\ProfileSource;
use App\Models\Company;
use App\Models\CompanyProfile;
use App\Models\CompanyProfileVersion;
use App\Models\Country;
use App\Models\Media;
use App\Models\Page;
use App\Models\Portfolio;
use App\Models\Service;
use App\Models\SuccessStory;
use App\Models\TeamMember;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Spatie\LaravelPdf\Facades\Pdf;

/**
 * Company profile documents. All files live on the PRIVATE "local" disk and
 * are only ever streamed through controllers.
 */
class ProfilePdfService
{
    public const DISK = 'local';

    public const DIR = 'company-profiles';

    public function __construct(private readonly SettingsService $settings) {}

    public function upload(UploadedFile $file, string $locale, ?string $notes, ?int $userId): CompanyProfileVersion
    {
        $handle = fopen($file->getRealPath(), 'rb');
        $magic = $handle ? fread($handle, 5) : '';
        if ($handle) {
            fclose($handle);
        }
        if ($magic !== '%PDF-') {
            throw new RuntimeException('The file is not a valid PDF document.');
        }

        $path = self::DIR.'/uploaded/'.Str::uuid().'.pdf';
        Storage::disk(self::DISK)->putFileAs(dirname($path), $file, basename($path));

        return $this->recordVersion(ProfileSource::Uploaded, $locale, $path, Str::limit($file->getClientOriginalName(), 250, ''), $notes, $userId);
    }

    public function generate(string $locale, ?int $userId = null, ?string $notes = null): CompanyProfileVersion
    {
        $path = self::DIR.'/generated/'.Str::uuid().'.pdf';
        $disk = Storage::disk(self::DISK);
        $disk->makeDirectory(dirname($path));

        $data = $this->documentData($locale);

        Pdf::view('pdf.profile', $data)
            ->format('a4')
            ->margins(16, 14, 18, 14, 'mm')
            ->headerView('pdf.partials.header', $data)
            ->footerView('pdf.partials.footer', $data)
            ->meta(
                title: ($data['siteName'] ?? 'Kaniz Ripa Overseas').' — '.($locale === 'bn' ? 'কোম্পানি প্রোফাইল' : 'Company Profile'),
                author: $data['siteName'] ?? 'Kaniz Ripa Overseas',
            )
            ->save($disk->path($path));

        return $this->recordVersion(ProfileSource::Generated, $locale, $path, null, $notes, $userId);
    }

    /** Rendered HTML for in-browser preview of the generated layout. */
    public function previewHtml(string $locale): string
    {
        return view('pdf.profile', $this->documentData($locale) + ['preview' => true])->render();
    }

    public function makeCurrent(CompanyProfileVersion $version): void
    {
        DB::transaction(function () use ($version) {
            CompanyProfileVersion::query()
                ->where('company_profile_id', $version->company_profile_id)
                ->where('source', $version->source->value)
                ->where('locale', $version->locale)
                ->update(['is_current' => false]);
            $version->update(['is_current' => true]);
        });
    }

    public function delete(CompanyProfileVersion $version): void
    {
        Storage::disk($version->disk)->delete($version->path);
        $version->delete();
    }

    private function recordVersion(ProfileSource $source, string $locale, string $path, ?string $originalName, ?string $notes, ?int $userId): CompanyProfileVersion
    {
        $profile = CompanyProfile::current();

        return DB::transaction(function () use ($profile, $source, $locale, $path, $originalName, $notes, $userId) {
            $next = (int) $profile->versions()->getQuery()->where('source', $source->value)->where('locale', $locale)->max('version_no') + 1;

            $version = $profile->versions()->create([
                'source' => $source,
                'locale' => $locale,
                'disk' => self::DISK,
                'path' => $path,
                'original_name' => $originalName,
                'size' => Storage::disk(self::DISK)->exists($path) ? Storage::disk(self::DISK)->size($path) : 0,
                'version_no' => $next,
                'is_current' => false,
                'notes' => $notes,
                'created_by' => $userId,
            ]);
            $this->makeCurrent($version);

            return $version->refresh();
        });
    }

    /**
     * Content for the generated PDF: only PUBLISHED records with REVIEWED
     * translations. Empty sections are omitted, never filled with invented text.
     */
    public function documentData(string $locale): array
    {
        $previous = app()->getLocale();
        app()->setLocale($locale);

        try {
            $pages = Page::query()->published()->hasReviewedTranslation()
                ->whereIn('key', ['home_intro', 'about', 'history', 'mission', 'vision', 'values', 'management', 'credentials'])
                ->with(['translations', 'sections.translations'])
                ->get()->keyBy('key')
                ->map(fn (Page $p) => [
                    'title' => $p->publicTranslation()?->title,
                    'body' => $p->publicTranslation()?->body,
                    'summary' => $p->publicTranslation()?->summary,
                    'sections' => $p->sections->filter(fn ($s) => $s->is_active && $s->publicTranslation())
                        ->map(fn ($s) => ['title' => $s->publicTranslation()->title, 'body' => $s->publicTranslation()->body])->values()->all(),
                ]);

            $tax = ['country.translations', 'industry.translations'];

            $team = TeamMember::query()->published()->hasReviewedTranslation()->with('translations')->orderBy('sort')->orderBy('id')->get()
                ->map(fn ($m) => ['name' => $m->publicTranslation()->name, 'role' => $m->publicTranslation()->role, 'phone' => $m->show_phone ? $m->phone : null]);

            $services = Service::query()->published()->hasReviewedTranslation()->with('translations')->orderBy('sort')->get()
                ->map(fn ($s) => ['title' => $s->publicTranslation()->title, 'summary' => $s->publicTranslation()->summary, 'icon' => $s->icon]);

            $countries = Country::query()->served()->hasReviewedTranslation()->with('translations')->orderBy('sort')->get()
                ->map(fn ($c) => ['name' => $c->publicTranslation()->name, 'flag' => $c->flagEmoji(), 'iso2' => $c->iso2]);

            $partners = Company::query()->partners()->with([...$tax, 'translations', 'logo'])->orderBy('sort')->get()
                ->map(fn ($c) => [
                    'name' => $c->name,
                    'country' => $c->country?->publicTranslation()?->name,
                    'industry' => $c->industry?->publicTranslation()?->name,
                    'description' => $c->publicTranslation()?->description,
                    'logo' => $this->dataUri($c->logo, 'sm'),
                ]);

            $portfolios = Portfolio::query()->published()->hasReviewedTranslation()
                ->with([...$tax, 'translations', 'company', 'cover'])
                ->orderByDesc('is_featured')->orderBy('sort')->limit(12)->get()
                ->map(fn ($p) => [
                    'title' => $p->publicTranslation()->title,
                    'summary' => $p->publicTranslation()->summary,
                    'company' => $p->company?->name,
                    'country' => $p->country?->publicTranslation()?->name,
                    'industry' => $p->industry?->publicTranslation()?->name,
                    'date' => $p->project_date?->format('M Y'),
                    'cover' => $this->dataUri($p->cover, 'md'),
                ]);

            $stories = SuccessStory::query()->publicVisible()->hasReviewedTranslation()
                ->with([...$tax, 'translations', 'company', 'photo'])
                ->orderByDesc('is_featured')->orderBy('sort')->limit(6)->get()
                ->map(fn ($s) => [
                    'title' => $s->publicTranslation()->title,
                    'name' => $s->publicTranslation()->display_name,
                    'testimonial' => $s->publicTranslation()->testimonial,
                    'country' => $s->country?->publicTranslation()?->name,
                    'employer' => $s->company?->name,
                    'photo' => $this->dataUri($s->photo, 'sm'),
                ]);

            $logoId = $this->settings->get('logo_media_id');

            return [
                'locale' => $locale,
                'siteName' => $this->settings->get('site_name', 'Kaniz Ripa Overseas', $locale),
                'tagline' => $this->publicSetting('tagline', $locale),
                'licenseNumber' => $this->publicSetting('license_number', $locale),
                'phone' => $this->settings->get('phone'),
                'mobiles' => $this->settings->get('show_contact_persons') ? (array) $this->settings->get('mobiles', []) : [],
                'address' => $this->settings->get('address', null, $locale),
                'email' => $this->publicSetting('email', $locale),
                'website' => config('app.url'),
                'logo' => $logoId ? $this->dataUri(Media::query()->find($logoId), 'sm') : null,
                'fonts' => $this->fontFaces(),
                'pages' => $pages,
                'team' => $team,
                'services' => $services,
                'countries' => $countries,
                'partners' => $partners,
                'portfolios' => $portfolios,
                'stories' => $stories,
                'generatedAt' => now(),
            ];
        } finally {
            app()->setLocale($previous);
        }
    }

    /** Placeholder settings are never printed. */
    private function publicSetting(string $key, string $locale): mixed
    {
        $setting = $this->settings->all()->get($key);

        return $setting && ! $setting->is_placeholder ? $setting->valueFor($locale) : null;
    }

    /** Images are embedded so the headless browser never needs network access. */
    private function dataUri(?Media $media, string $variant = 'md'): ?string
    {
        if (! $media) {
            return null;
        }
        $path = $media->variants[$variant] ?? $media->path;
        $disk = Storage::disk($media->disk);
        if (! $disk->exists($path)) {
            return null;
        }

        return 'data:'.$media->mime.';base64,'.base64_encode($disk->get($path));
    }

    /** @font-face rules with the self-hosted brand fonts embedded. */
    private function fontFaces(): string
    {
        $dir = resource_path('fonts');
        $faces = [
            ['Hind Siliguri', 'HindSiliguri-Regular.ttf', '400'],
            ['Hind Siliguri', 'HindSiliguri-Medium.ttf', '500'],
            ['Hind Siliguri', 'HindSiliguri-SemiBold.ttf', '600'],
            ['Hind Siliguri', 'HindSiliguri-Bold.ttf', '700'],
            ['Plus Jakarta Sans', 'PlusJakartaSans-Variable.ttf', '200 800'],
            ['Inter', 'Inter-Variable.ttf', '100 900'],
        ];

        return collect($faces)
            ->filter(fn ($f) => is_file("{$dir}/{$f[1]}"))
            ->map(fn ($f) => sprintf(
                "@font-face{font-family:'%s';src:url(data:font/ttf;base64,%s) format('truetype');font-weight:%s;font-style:normal;font-display:block;}",
                $f[0], base64_encode(file_get_contents("{$dir}/{$f[1]}")), $f[2]
            ))
            ->implode("\n");
    }
}
