<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Page;
use App\Models\Portfolio;
use App\Models\SeoMetadata;
use App\Models\Service;
use App\Models\SuccessStory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** SEO metadata per static route (route_key) or per content record (seoable). */
class SeoController extends Controller
{
    private const TYPES = [
        'page' => Page::class,
        'service' => Service::class,
        'portfolio' => Portfolio::class,
        'company' => Company::class,
        'success_story' => SuccessStory::class,
    ];

    public const ROUTE_KEYS = ['home', 'about', 'services', 'portfolio', 'partners', 'success-stories', 'gallery', 'company-profile', 'contact'];

    public function index(Request $request): JsonResponse
    {
        $items = SeoMetadata::query()->with('ogImage')
            ->when($request->query('route_key'), fn ($q, $k) => $q->where('route_key', (string) $k))
            ->when($request->query('seoable_type'), fn ($q, $t) => $q->where('seoable_type', self::TYPES[(string) $t] ?? '-'))
            ->when($request->integer('seoable_id'), fn ($q, $id) => $q->where('seoable_id', $id))
            ->orderBy('route_key')->get();

        return response()->json(['data' => $items, 'route_keys' => self::ROUTE_KEYS, 'types' => array_keys(self::TYPES)]);
    }

    public function upsert(Request $request): JsonResponse
    {
        $data = $request->validate([
            'route_key' => ['nullable', 'required_without:seoable_type', Rule::in(self::ROUTE_KEYS)],
            'seoable_type' => ['nullable', 'required_without:route_key', Rule::in(array_keys(self::TYPES))],
            'seoable_id' => ['nullable', 'required_with:seoable_type', 'integer'],
            'locale' => ['required', Rule::in(['bn', 'en'])],
            'meta_title' => ['nullable', 'string', 'max:70'],
            'meta_description' => ['nullable', 'string', 'max:320'],
            'og_image_media_id' => ['nullable', 'integer', 'exists:media,id'],
            'canonical_url' => ['nullable', 'url:https'],
            'noindex' => ['sometimes', 'boolean'],
        ]);

        $keys = ['locale' => $data['locale']];
        if (! empty($data['seoable_type'])) {
            $class = self::TYPES[$data['seoable_type']];
            abort_unless($class::query()->whereKey($data['seoable_id'])->exists(), 422, 'Unknown record.');
            $keys += ['seoable_type' => $class, 'seoable_id' => $data['seoable_id']];
        } else {
            $keys += ['route_key' => $data['route_key'], 'seoable_type' => null, 'seoable_id' => null];
        }

        $seo = SeoMetadata::query()->updateOrCreate($keys, collect($data)->only([
            'meta_title', 'meta_description', 'og_image_media_id', 'canonical_url', 'noindex',
        ])->all());

        return response()->json(['data' => $seo->load('ogImage')]);
    }
}
