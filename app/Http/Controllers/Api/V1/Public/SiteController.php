<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Resources\Public\CountryResource;
use App\Http\Resources\Public\IndustryResource;
use App\Models\Country;
use App\Models\Industry;
use App\Models\Media;
use App\Models\Menu;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;

class SiteController extends PublicController
{
    /** Global site payload: settings + menus + logo. */
    public function show(): JsonResponse
    {
        return response()->json(['data' => self::payload()]);
    }

    public static function payload(): array
    {
        $settings = app(SettingsService::class);
        $menus = Menu::query()->with(['items' => fn ($q) => $q->where('is_active', true)])->get()
            ->mapWithKeys(fn (Menu $menu) => [$menu->location => self::tree($menu->items)]);

        return [
            'locale' => app()->getLocale(),
            'logo_url' => ($id = $settings->get('logo_media_id')) ? Media::query()->find($id)?->url('sm') : null,
            'settings' => $settings->publicPayload(),
            'menus' => $menus,
        ];
    }

    public function countries(): JsonResponse
    {
        $countries = Country::query()->served()->hasReviewedTranslation()->with('translations')->orderBy('sort')->get();

        return response()->json(['data' => CountryResource::collection($countries)]);
    }

    public function industries(): JsonResponse
    {
        $industries = Industry::query()->hasReviewedTranslation()->with('translations')->orderBy('sort')->get();

        return response()->json(['data' => IndustryResource::collection($industries)]);
    }

    private static function tree($items, ?int $parentId = null): array
    {
        $locale = app()->getLocale();

        return $items->where('parent_id', $parentId)->values()->map(fn ($item) => [
            'id' => $item->id,
            'label' => $item->label[$locale] ?? $item->label['en'] ?? '',
            'route' => $item->route_name,
            'url' => $item->url,
            'new_tab' => $item->open_in_new_tab,
            'children' => self::tree($items, $item->id),
        ])->all();
    }
}
