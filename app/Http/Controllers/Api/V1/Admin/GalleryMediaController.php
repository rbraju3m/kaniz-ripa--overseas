<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Requests\Admin\GalleryMediaRequest;
use App\Models\GalleryMedia;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class GalleryMediaController extends CrudController
{
    protected function modelClass(): string
    {
        return GalleryMedia::class;
    }

    protected function module(): string
    {
        return 'gallery';
    }

    protected function requestClass(): string
    {
        return GalleryMediaRequest::class;
    }

    protected function relations(): array
    {
        return ['media', 'category.translations'];
    }

    protected function applySearch(Builder $query, string $search): void
    {
        $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $search).'%';
        $query->where(fn ($q) => $q->where('title->bn', 'like', $like)->orWhere('title->en', 'like', $like));
    }

    protected function applyFilters(Builder $query, Request $request): void
    {
        $query->when($request->integer('gallery_category_id'), fn ($q, $id) => $q->where('gallery_category_id', $id))
            ->when($request->query('type'), fn ($q, $t) => $q->where('type', (string) $t));
    }
}
