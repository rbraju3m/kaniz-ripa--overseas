<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Country;
use App\Models\GalleryCategory;
use App\Models\Industry;
use Illuminate\Http\JsonResponse;

/** Lightweight option lists for admin form dropdowns. */
class ReferenceController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $name = fn ($m, string $field = 'name') => [
            'id' => $m->id,
            'bn' => $m->translation('bn')?->{$field},
            'en' => $m->translation('en')?->{$field},
        ];

        return response()->json(['data' => [
            'countries' => Country::query()->with('translations')->orderBy('sort')->get()->map(fn ($c) => $name($c) + ['iso2' => $c->iso2]),
            'industries' => Industry::query()->with('translations')->orderBy('sort')->get()->map(fn ($i) => $name($i) + ['key' => $i->key]),
            'companies' => Company::query()->orderBy('name')->get(['id', 'name', 'verification_status']),
            'gallery_categories' => GalleryCategory::query()->with('translations')->orderBy('sort')->get()->map(fn ($g) => $name($g) + ['slug' => $g->slug]),
        ]]);
    }
}
