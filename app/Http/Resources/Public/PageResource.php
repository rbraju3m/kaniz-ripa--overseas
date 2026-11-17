<?php

namespace App\Http\Resources\Public;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Page */
class PageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $t = $this->publicTranslation();

        return [
            'key' => $this->key,
            'locale' => $t?->locale,
            'title' => $t?->title,
            'slug' => $t?->slug,
            'summary' => $t?->summary,
            'body' => $t?->body,
            'cover' => MediaResource::make($this->whenLoaded('cover')),
            'sections' => $this->whenLoaded('sections', fn () => $this->sections
                ->filter(fn ($s) => $s->is_active && $s->publicTranslation())
                ->values()
                ->map(fn ($s) => [
                    'key' => $s->key,
                    'icon' => $s->icon,
                    'title' => $s->publicTranslation()->title,
                    'body' => $s->publicTranslation()->body,
                    'media' => $s->media ? MediaResource::make($s->media) : null,
                ])),
        ];
    }
}
