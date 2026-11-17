<?php

namespace App\Http\Controllers\Web;

use App\Enums\Locale;
use App\Http\Controllers\Api\V1\Public\HomeController;
use App\Http\Controllers\Api\V1\Public\SiteController;
use App\Http\Controllers\Controller;
use App\Services\SeoService;
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

    public function public(Request $request, SeoService $seo, string $locale, ?string $section = null, ?string $slug = null): Response
    {
        app()->setLocale($locale);
        $meta = $seo->forPath($locale, $section ?? '', $slug);

        return response()->view('app', [
            'meta' => $meta,
            'pageChunk' => self::pageChunk($section ?? '', $slug),
            'bootstrap' => array_filter([
                'locale' => $locale,
                'site' => SiteController::payload(),
                'home' => ($section ?? '') === '' ? HomeController::payload() : null,
            ]),
        ], $meta['status']);
    }

    /** Lazy route chunk for this URL, preloaded by the shell (mirrors resources/js/app/router.tsx). */
    private static function pageChunk(string $section, ?string $slug): ?string
    {
        $page = match ($section) {
            'about' => 'AboutPage',
            'services' => $slug ? 'ServiceDetailPage' : 'ServicesPage',
            'portfolio' => $slug ? 'PortfolioDetailPage' : 'PortfolioPage',
            'partners' => $slug ? 'PartnerDetailPage' : 'PartnersPage',
            'success-stories' => $slug ? 'StoryDetailPage' : 'StoriesPage',
            'gallery' => 'GalleryPage',
            'company-profile' => 'CompanyProfilePage',
            'contact' => 'ContactPage',
            default => null,
        };

        return $page ? "resources/js/pages/{$page}.tsx" : null;
    }

    public function admin(): Response
    {
        return response()->view('app', [
            'meta' => ['locale' => 'en', 'title' => 'Admin | Kaniz Ripa Overseas', 'noindex' => true, 'status' => 200],
            'bootstrap' => ['locale' => 'en', 'admin' => true],
        ])->header('X-Robots-Tag', 'noindex, nofollow');
    }
}
