<?php

namespace App\Http\Controllers\Web;

use App\Enums\Locale;
use App\Http\Controllers\Controller;
use App\Services\SeoService;
use App\Services\SettingsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/** Serves the React SPA shell with server-rendered SEO metadata. */
class SpaController extends Controller
{
    public function root(Request $request): RedirectResponse
    {
        $preferred = $request->getPreferredLanguage(['bn', 'en']) ?? Locale::Bn->value;

        return redirect("/{$preferred}", 302)->header('Vary', 'Accept-Language');
    }

    public function public(Request $request, SeoService $seo, SettingsService $settings, string $locale, ?string $section = null, ?string $slug = null): Response
    {
        app()->setLocale($locale);
        $meta = $seo->forPath($locale, $section ?? '', $slug);

        return response()->view('app', [
            'meta' => $meta,
            'bootstrap' => ['locale' => $locale, 'settings' => $settings->publicPayload()],
        ], $meta['status']);
    }

    public function admin(): Response
    {
        return response()->view('app', [
            'meta' => ['locale' => 'en', 'title' => 'Admin | Kaniz Ripa Overseas', 'noindex' => true, 'status' => 200],
            'bootstrap' => ['locale' => 'en', 'admin' => true],
        ])->header('X-Robots-Tag', 'noindex, nofollow');
    }
}
