<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Requests\Admin\PortfolioRequest;
use App\Models\Portfolio;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class PortfolioController extends CrudController
{
    protected function modelClass(): string
    {
        return Portfolio::class;
    }

    protected function module(): string
    {
        return 'portfolios';
    }

    protected function requestClass(): string
    {
        return PortfolioRequest::class;
    }

    protected function relations(): array
    {
        return ['translations', 'cover', 'company', 'country.translations', 'industry.translations', 'images.media'];
    }

    protected function listRelations(): array
    {
        return ['translations', 'cover', 'company', 'country.translations'];
    }

    protected function searchColumns(): array
    {
        return ['title', 'summary'];
    }

    protected function applyFilters(Builder $query, Request $request): void
    {
        $query->when($request->integer('country_id'), fn ($q, $id) => $q->where('country_id', $id))
            ->when($request->integer('company_id'), fn ($q, $id) => $q->where('company_id', $id))
            ->when($request->has('featured'), fn ($q) => $q->where('is_featured', $request->boolean('featured')));
    }

    protected function afterSave(Model $model, array $validated): void
    {
        if (! array_key_exists('images', $validated)) {
            return;
        }

        $model->images()->delete();
        foreach (array_values($validated['images']) as $i => $image) {
            $model->images()->create([
                'media_id' => $image['media_id'],
                'caption' => $image['caption'] ?? null,
                'sort' => $i,
            ]);
        }
    }
}
