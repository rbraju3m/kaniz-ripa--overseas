<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanyProfile;
use App\Models\Portfolio;
use App\Models\Service;
use App\Models\SuccessStory;
use App\Services\SeoService;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Spatie\Sitemap\Sitemap;
use Spatie\Sitemap\Tags\Url;

class SitemapController extends Controller
{
    public function sitemap(): Response
    {
        $xml = Cache::remember('sitemap.xml', now()->addHour(), function () {
            $sitemap = Sitemap::create();
            $add = function (string $path, ?\DateTimeInterface $updated = null) use ($sitemap) {
                foreach (['bn', 'en'] as $locale) {
                    $tag = Url::create(url("/{$locale}".($path ? "/{$path}" : '')));
                    foreach (['bn', 'en'] as $alt) {
                        $tag->addAlternate(url("/{$alt}".($path ? "/{$path}" : '')), $alt);
                    }
                    if ($updated) {
                        $tag->setLastModificationDate($updated);
                    }
                    $sitemap->add($tag);
                }
            };

            $profileAvailable = CompanyProfile::availableForVisitors();
            foreach (array_keys(SeoService::SECTIONS) as $section) {
                if ($section === 'company-profile' && ! $profileAvailable) {
                    continue;
                }
                $add($section);
            }

            // Detail pages: one URL per reviewed translation.
            $detail = function ($query, string $section) use ($sitemap) {
                $query->with(['translations' => fn ($q) => $q->where('is_reviewed', true)])->get()
                    ->each(fn ($m) => $m->translations->each(fn ($t) => $sitemap->add(
                        Url::create(url("/{$t->locale}/{$section}/{$t->slug}"))->setLastModificationDate($m->updated_at)
                    )));
            };
            $detail(Portfolio::query()->published(), 'portfolio');
            $detail(Service::query()->published(), 'services');
            $detail(SuccessStory::query()->publicVisible(), 'success-stories');
            Company::query()->partners()->get()->each(fn ($c) => $add("partners/{$c->slug}", $c->updated_at));

            return $sitemap->render();
        });

        return response($xml, 200, ['Content-Type' => 'application/xml']);
    }

    public function robots(): Response
    {
        $lines = app()->isProduction()
            ? ['User-agent: *', 'Disallow: /admin', 'Disallow: /api/', 'Sitemap: '.url('/sitemap.xml')]
            : ['User-agent: *', 'Disallow: /'];

        return response(implode("\n", $lines)."\n", 200, ['Content-Type' => 'text/plain']);
    }
}
