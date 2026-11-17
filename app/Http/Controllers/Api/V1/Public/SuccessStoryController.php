<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Resources\Public\SuccessStoryResource;
use App\Models\SuccessStory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Stories are public only when published, consented and reviewed. */
class SuccessStoryController extends PublicController
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $stories = SuccessStory::query()->publicVisible()->hasReviewedTranslation()
            ->with([...self::taxonomy(), 'translations', 'photo', 'company'])
            ->when($request->query('country'), fn ($q, $iso) => $q->whereHas('country', fn ($c) => $c->where('iso2', strtoupper((string) $iso))))
            ->when($request->boolean('featured'), fn ($q) => $q->where('is_featured', true))
            ->orderByDesc('is_featured')->orderBy('sort')->latest('id')
            ->paginate($this->perPage());

        return SuccessStoryResource::collection($stories);
    }

    public function show(string $slug): SuccessStoryResource
    {
        $query = SuccessStory::query()->publicVisible()
            ->with([...self::taxonomy(), 'translations', 'photo', 'company', 'images.media']);

        return SuccessStoryResource::make($this->findBySlug($query, $slug));
    }
}
