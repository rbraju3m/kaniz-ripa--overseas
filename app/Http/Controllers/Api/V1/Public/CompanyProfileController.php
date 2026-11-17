<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Models\CompanyProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * The published profile is streamed through this controller; files live on the
 * private disk and are never linked directly.
 */
class CompanyProfileController extends PublicController
{
    public function show(): JsonResponse
    {
        $profile = CompanyProfile::query()->published()->firstOrFail();
        $locale = app()->getLocale();
        $version = $profile->activeVersion($locale);
        abort_unless($version, 404);

        return response()->json(['data' => [
            'title' => $profile->title[$locale] ?? $profile->title['en'] ?? null,
            'description' => $profile->description[$locale] ?? $profile->description['en'] ?? null,
            'locale' => $version->locale,
            'size' => $version->size,
            'updated_at' => $version->created_at?->toIso8601String(),
            // The version id makes the URL change whenever another PDF becomes current,
            // so browsers and proxies never serve an outdated cached copy.
            'download_url' => url("/api/v1/company-profile/download?locale={$locale}&v={$version->id}"),
            'preview_url' => url("/api/v1/company-profile/download?locale={$locale}&v={$version->id}&inline=1"),
        ]]);
    }

    public function download(): StreamedResponse
    {
        $profile = CompanyProfile::query()->published()->firstOrFail();
        $version = $profile->activeVersion(app()->getLocale());
        abort_unless($version && Storage::disk($version->disk)->exists($version->path), 404);

        $filename = 'Kaniz-Ripa-Overseas-Company-Profile-'.strtoupper($version->locale).'.pdf';
        $disposition = request()->boolean('inline') ? 'inline' : 'attachment';

        return Storage::disk($version->disk)->response($version->path, $filename, [
            'Content-Type' => 'application/pdf',
            // Versioned URLs (?v=) may be cached; the bare URL must always reflect the current PDF.
            'Cache-Control' => request()->query('v') == $version->id ? 'public, max-age=86400' : 'no-cache',
            'X-Content-Type-Options' => 'nosniff',
        ], $disposition);
    }
}
