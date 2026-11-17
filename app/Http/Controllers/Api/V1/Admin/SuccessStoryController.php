<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Requests\Admin\SuccessStoryRequest;
use App\Models\SuccessStory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SuccessStoryController extends CrudController
{
    protected function modelClass(): string
    {
        return SuccessStory::class;
    }

    protected function module(): string
    {
        return 'success_stories';
    }

    protected function requestClass(): string
    {
        return SuccessStoryRequest::class;
    }

    protected function relations(): array
    {
        return ['translations', 'photo', 'company', 'country.translations', 'industry.translations', 'images.media'];
    }

    protected function listRelations(): array
    {
        return ['translations', 'photo', 'country.translations'];
    }

    protected function searchColumns(): array
    {
        return ['title', 'display_name'];
    }

    protected function applyFilters(Builder $query, Request $request): void
    {
        $query->when($request->integer('country_id'), fn ($q, $id) => $q->where('country_id', $id));
    }

    protected function persist(Model $model, array $validated): Model
    {
        if (array_key_exists('consent_confirmed', $validated)) {
            if ($validated['consent_confirmed'] && ! $model->consent_confirmed_at) {
                $validated['consent_confirmed_at'] = now();
                $validated['consent_confirmed_by'] = Auth::id();
            } elseif (! $validated['consent_confirmed']) {
                $validated['consent_confirmed_at'] = null;
                $validated['consent_confirmed_by'] = null;
            }
        }

        return parent::persist($model, $validated);
    }

    protected function afterSave(Model $model, array $validated): void
    {
        if (! array_key_exists('images', $validated)) {
            return;
        }

        $model->images()->delete();
        foreach (array_values($validated['images']) as $i => $image) {
            $model->images()->create(['media_id' => $image['media_id'], 'caption' => $image['caption'] ?? null, 'sort' => $i]);
        }
    }
}
