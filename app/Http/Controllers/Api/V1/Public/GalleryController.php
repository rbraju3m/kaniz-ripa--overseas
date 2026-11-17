<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Resources\Public\GalleryItemResource;
use App\Models\GalleryCategory;
use App\Models\GalleryMedia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class GalleryController extends PublicController
{
    public function categories(): JsonResponse
    {
        $categories = GalleryCategory::query()
            ->where('is_active', true)
            ->hasReviewedTranslation()
            ->whereHas('items', fn ($q) => $q->published())
            ->with('translations')->orderBy('sort')->get()
            ->map(fn ($c) => ['slug' => $c->slug, 'name' => $c->publicTranslation()?->name]);

        return response()->json(['data' => $categories]);
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $items = GalleryMedia::query()->published()
            ->with(['media', 'category.translations'])
            ->when($request->query('category'), fn ($q, $slug) => $q->whereHas('category', fn ($c) => $c->where('slug', (string) $slug)))
            ->when($request->query('type'), fn ($q, $type) => $q->where('type', (string) $type))
            ->orderBy('sort')->latest('id')
            ->paginate($this->perPage(24));

        return GalleryItemResource::collection($items);
    }
}
