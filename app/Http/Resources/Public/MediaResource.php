<?php

namespace App\Http\Resources\Public;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Media */
class MediaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'url' => $this->url(),
            'variants' => $this->variantUrls(),
            'width' => $this->width,
            'height' => $this->height,
            'alt' => $this->altFor(),
        ];
    }
}
