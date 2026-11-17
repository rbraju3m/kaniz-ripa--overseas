<?php

namespace App\Http\Resources\Public;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Portfolio */
class PortfolioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $t = $this->publicTranslation();
        $company = $this->relationLoaded('company') ? $this->company : null;
        $detail = $request->routeIs('*.show');

        return [
            'id' => $this->id,
            'locale' => $t?->locale,
            'slug' => $t?->slug,
            'slugs' => $this->when($request->routeIs('*.show'), fn () => $this->slugs()),
            'title' => $t?->title,
            'summary' => $t?->summary,
            'description' => $this->when($detail, $t?->description),
            'activities' => $this->when($detail, $t?->activities),
            'project_date' => $this->project_date?->toDateString(),
            'is_featured' => $this->is_featured,
            // Company name is part of the published project; logo/link only for verified, displayed partners.
            'company' => $company ? [
                'name' => $company->name,
                'slug' => $company->isPublicPartner() ? $company->slug : null,
                'logo' => $company->isPublicPartner() && $company->relationLoaded('logo') && $company->logo
                    ? MediaResource::make($company->logo) : null,
            ] : null,
            'country' => CountryResource::make($this->whenLoaded('country')),
            'industry' => IndustryResource::make($this->whenLoaded('industry')),
            'cover' => MediaResource::make($this->whenLoaded('cover')),
            'images' => $this->whenLoaded('images', fn () => $this->images->map(fn ($img) => [
                'id' => $img->id,
                'caption' => $img->caption[app()->getLocale()] ?? $img->caption['en'] ?? null,
                'media' => MediaResource::make($img->media),
            ])),
        ];
    }

    /** Reviewed slug per locale (detail views only) so the UI can switch language. */
    private function slugs(): array
    {
        return $this->translations->where('is_reviewed', true)->pluck('slug', 'locale')->all();
    }
}
