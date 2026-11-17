<?php

namespace App\Http\Resources\Public;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Company */
class PartnerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'website_url' => $this->website_url,
            'description' => $this->publicTranslation()?->description,
            'logo' => MediaResource::make($this->whenLoaded('logo')),
            'country' => CountryResource::make($this->whenLoaded('country')),
            'industry' => IndustryResource::make($this->whenLoaded('industry')),
            'portfolios' => PortfolioResource::collection($this->whenLoaded('portfolios')),
        ];
    }
}
