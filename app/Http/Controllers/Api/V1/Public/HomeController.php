<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Resources\Public\CountryResource;
use App\Http\Resources\Public\PageResource;
use App\Http\Resources\Public\PartnerResource;
use App\Http\Resources\Public\PortfolioResource;
use App\Http\Resources\Public\ServiceResource;
use App\Http\Resources\Public\SuccessStoryResource;
use App\Models\Company;
use App\Models\CompanyProfile;
use App\Models\Country;
use App\Models\Page;
use App\Models\Portfolio;
use App\Models\Service;
use App\Models\SuccessStory;
use Illuminate\Http\JsonResponse;

/**
 * One request for every homepage section. Empty sections are returned as
 * null/[] so the client hides them; nothing is ever filled with fake content.
 */
class HomeController extends PublicController
{
    public function __invoke(): JsonResponse
    {
        return response()->json(['data' => self::payload()]);
    }

    /** Also embedded into the homepage HTML by SpaController (no extra request on first load). */
    public static function payload(): array
    {
        $pages = Page::query()->published()->hasReviewedTranslation()
            ->whereIn('key', ['home_intro', 'about', 'why_choose_us'])
            ->with(['translations', 'cover', 'sections.translations', 'sections.media'])
            ->get()->keyBy('key');

        $profile = CompanyProfile::query()->first();

        $data = [
            'intro' => $pages->has('home_intro') ? PageResource::make($pages['home_intro']) : null,
            'about' => $pages->has('about') ? PageResource::make($pages['about']) : null,
            'why_choose_us' => $pages->has('why_choose_us') ? PageResource::make($pages['why_choose_us']) : null,
            'services' => ServiceResource::collection(
                Service::query()->published()->hasReviewedTranslation()->with(['translations', 'image'])
                    ->orderByDesc('is_featured')->orderBy('sort')->limit(6)->get()
            ),
            'countries' => CountryResource::collection(
                Country::query()->served()->hasReviewedTranslation()->with('translations')->orderBy('sort')->get()
            ),
            'partners' => PartnerResource::collection(
                Company::query()->partners()->with([...self::taxonomy(), 'translations', 'logo'])
                    ->orderByDesc('is_featured')->orderBy('sort')->limit(12)->get()
            ),
            'portfolios' => PortfolioResource::collection(
                Portfolio::query()->published()->hasReviewedTranslation()
                    ->with([...self::taxonomy(), 'translations', 'cover', 'company.logo'])
                    ->orderByDesc('is_featured')->orderBy('sort')->limit(3)->get()
            ),
            'success_stories' => SuccessStoryResource::collection(
                SuccessStory::query()->publicVisible()->hasReviewedTranslation()
                    ->with([...self::taxonomy(), 'translations', 'photo', 'company'])
                    ->orderByDesc('is_featured')->orderBy('sort')->limit(6)->get()
            ),
            'company_profile_available' => (bool) $profile?->isPublished()
                && $profile->activeVersion(app()->getLocale()) !== null,
        ];

        // Resolve API resources into plain arrays.
        return json_decode(json_encode($data, JSON_UNESCAPED_UNICODE), true);
    }
}
