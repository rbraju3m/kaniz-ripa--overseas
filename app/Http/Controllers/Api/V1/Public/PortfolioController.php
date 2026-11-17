<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Resources\Public\PortfolioResource;
use App\Models\Portfolio;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PortfolioController extends PublicController
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $portfolios = Portfolio::query()->published()->hasReviewedTranslation()
            ->with([...self::taxonomy(), 'translations', 'cover', 'company.logo'])
            ->when($request->query('country'), fn ($q, $iso) => $q->whereHas('country', fn ($c) => $c->where('iso2', strtoupper((string) $iso))))
            ->when($request->query('industry'), fn ($q, $key) => $q->whereHas('industry', fn ($i) => $i->where('key', (string) $key)))
            ->when($request->boolean('featured'), fn ($q) => $q->where('is_featured', true))
            ->orderByDesc('is_featured')->orderBy('sort')->orderByDesc('project_date')
            ->paginate($this->perPage());

        return PortfolioResource::collection($portfolios);
    }

    public function show(string $slug): PortfolioResource
    {
        $query = Portfolio::query()->published()
            ->with([...self::taxonomy(), 'translations', 'cover', 'company.logo', 'images.media']);

        return PortfolioResource::make($this->findBySlug($query, $slug));
    }
}
