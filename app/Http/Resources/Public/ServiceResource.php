<?php

namespace App\Http\Resources\Public;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Service */
class ServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $t = $this->publicTranslation();

        return [
            'id' => $this->id,
            'locale' => $t?->locale,
            'slug' => $t?->slug,
            'title' => $t?->title,
            'summary' => $t?->summary,
            'body' => $this->when($request->routeIs('*.show'), $t?->body),
            'icon' => $this->icon,
            'is_featured' => $this->is_featured,
            'image' => MediaResource::make($this->whenLoaded('image')),
        ];
    }
}
