<?php

namespace App\Http\Resources\Public;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\GalleryMedia */
class GalleryItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'title' => $this->title[app()->getLocale()] ?? $this->title['en'] ?? null,
            'video_url' => $this->video_url,
            'category' => $this->whenLoaded('category', fn () => $this->category ? [
                'slug' => $this->category->slug,
                'name' => $this->category->publicTranslation()?->name,
            ] : null),
            'media' => MediaResource::make($this->whenLoaded('media')),
        ];
    }
}
