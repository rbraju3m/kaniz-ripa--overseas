<?php

namespace App\Http\Resources\Admin;

use App\Http\Resources\Public\MediaResource;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Generic admin representation: all attributes, translations keyed by locale,
 * and any loaded media relations rendered with URLs.
 */
class AdminResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var Model $model */
        $model = $this->resource;
        $data = $model->attributesToArray();

        foreach ($model->getRelations() as $name => $related) {
            if ($name === 'translations') {
                $data['translations'] = $related->keyBy('locale')->map(fn ($t) => collect($t->attributesToArray())
                    ->except(['id', $model->getForeignKey(), 'created_at'])->all());

                continue;
            }

            $data[\Illuminate\Support\Str::snake($name)] = match (true) {
                $related instanceof \App\Models\Media => MediaResource::make($related)->resolve(),
                $related instanceof Model => self::make($related)->resolve(),
                $related instanceof \Illuminate\Support\Collection => $related->map(fn ($r) => self::make($r)->resolve())->all(),
                default => $related,
            };
        }

        return $data;
    }
}
