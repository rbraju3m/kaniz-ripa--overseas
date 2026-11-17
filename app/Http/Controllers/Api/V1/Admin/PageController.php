<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Requests\Admin\PageRequest;
use App\Models\Page;
use Illuminate\Database\Eloquent\Model;

class PageController extends CrudController
{
    protected function modelClass(): string
    {
        return Page::class;
    }

    protected function module(): string
    {
        return 'pages';
    }

    protected function requestClass(): string
    {
        return PageRequest::class;
    }

    protected function relations(): array
    {
        return ['translations', 'cover', 'sections.translations', 'sections.media'];
    }

    /** Upsert sections by key; sections missing from the payload are removed. */
    protected function afterSave(Model $model, array $validated): void
    {
        if (! array_key_exists('sections', $validated)) {
            return;
        }

        $keep = [];
        foreach (array_values($validated['sections']) as $i => $data) {
            $section = $model->sections()->updateOrCreate(['key' => $data['key']], [
                'icon' => $data['icon'] ?? null,
                'media_id' => $data['media_id'] ?? null,
                'is_active' => $data['is_active'] ?? true,
                'sort' => $i,
            ]);
            $section->syncTranslations($data['translations']);
            $keep[] = $section->id;
        }
        $model->sections()->whereNotIn('id', $keep)->delete();
    }

    protected function searchColumns(): array
    {
        return ['title', 'body'];
    }
}
