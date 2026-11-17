<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

abstract class PublicController extends Controller
{
    /** Find a record by the slug of one of its REVIEWED translations, or 404. */
    protected function findBySlug(Builder $query, string $slug): Model
    {
        return $query
            ->whereHas('translations', fn (Builder $q) => $q->where('slug', $slug)->where('is_reviewed', true))
            ->firstOrFail();
    }

    protected function perPage(int $default = 12): int
    {
        return min(max((int) request()->integer('per_page', $default), 1), 48);
    }

    /** Standard eager loads for translated relations. */
    protected static function taxonomy(): array
    {
        return ['country.translations', 'industry.translations'];
    }
}
