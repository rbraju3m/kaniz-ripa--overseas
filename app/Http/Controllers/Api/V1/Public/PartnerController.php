<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Resources\Public\PartnerResource;
use App\Models\Company;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Only VERIFIED companies flagged for display are ever listed as partners. */
class PartnerController extends PublicController
{
    public function index(): AnonymousResourceCollection
    {
        $partners = Company::query()->partners()
            ->with([...self::taxonomy(), 'translations', 'logo'])
            ->orderByDesc('is_featured')->orderBy('sort')->orderBy('name')
            ->get();

        return PartnerResource::collection($partners);
    }

    public function show(string $slug): PartnerResource
    {
        $partner = Company::query()->partners()->where('slug', $slug)
            ->with([
                ...self::taxonomy(), 'translations', 'logo',
                'portfolios' => fn ($q) => $q->published()->hasReviewedTranslation()
                    ->with([...self::taxonomy(), 'translations', 'cover'])->orderBy('sort'),
            ])
            ->firstOrFail();

        return PartnerResource::make($partner);
    }
}
