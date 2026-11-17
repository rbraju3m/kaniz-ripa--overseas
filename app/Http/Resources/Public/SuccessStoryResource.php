<?php

namespace App\Http\Resources\Public;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\SuccessStory */
class SuccessStoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $t = $this->publicTranslation();
        $detail = $request->routeIs('*.show');
        $company = $this->relationLoaded('company') ? $this->company : null;

        return [
            'id' => $this->id,
            'locale' => $t?->locale,
            'slug' => $t?->slug,
            'title' => $t?->title,
            'display_name' => $t?->display_name,
            'story' => $this->when($detail, $t?->story),
            'testimonial' => $t?->testimonial,
            'video_url' => $this->video_url,
            'is_featured' => $this->is_featured,
            'employer' => $company?->name,
            'photo' => MediaResource::make($this->whenLoaded('photo')),
            'country' => CountryResource::make($this->whenLoaded('country')),
            'industry' => IndustryResource::make($this->whenLoaded('industry')),
            'images' => $this->whenLoaded('images', fn () => $this->images->map(fn ($img) => [
                'id' => $img->id,
                'caption' => $img->caption[app()->getLocale()] ?? $img->caption['en'] ?? null,
                'media' => MediaResource::make($img->media),
            ])),
        ];
    }
}
