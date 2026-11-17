<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Services\MediaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Resources\Json\JsonResource;

class MediaController extends Controller
{
    public function __construct(private readonly MediaService $media) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $items = Media::query()
            ->where('disk', 'public')
            ->when($request->query('folder'), fn ($q, $f) => $q->where('folder', (string) $f))
            ->when($request->query('search'), fn ($q, $s) => $q->where('original_name', 'like', '%'.str_replace(['%', '_'], ['\%', '\_'], (string) $s).'%'))
            ->latest('id')
            ->paginate(min(max($request->integer('per_page', 30), 1), 100))
            // Same shape as store/update: the library grid needs the image URLs.
            ->through(fn (Media $media) => $this->present($media));

        return JsonResource::collection($items);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            // mimetypes checks the real content type; dimensions guard against decompression bombs.
            'file' => ['required', 'file', 'max:8192', 'mimetypes:'.implode(',', MediaService::IMAGE_MIMES), 'extensions:jpg,jpeg,png,webp,gif', 'dimensions:max_width=8000,max_height=8000'],
            'folder' => ['nullable', 'string', 'max:50', 'regex:/^[a-z0-9-]+$/'],
            'alt' => ['nullable', 'array'],
            'alt.bn' => ['nullable', 'string', 'max:255'],
            'alt.en' => ['nullable', 'string', 'max:255'],
        ]);

        $media = $this->media->storeImage($data['file'], $data['folder'] ?? 'general', $data['alt'] ?? [], $request->user()->id);

        return response()->json(['data' => $this->present($media)], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $media = Media::query()->findOrFail($id);
        $data = $request->validate([
            'alt' => ['required', 'array'],
            'alt.bn' => ['nullable', 'string', 'max:255'],
            'alt.en' => ['nullable', 'string', 'max:255'],
        ]);
        $media->update(['alt' => array_filter($data['alt'])]);

        return response()->json(['data' => $this->present($media)]);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->media->delete(Media::query()->findOrFail($id));

        return response()->json(null, 204);
    }

    private function present(Media $media): array
    {
        return [...$media->toArray(), 'url' => $media->url(), 'variant_urls' => $media->variantUrls()];
    }
}
