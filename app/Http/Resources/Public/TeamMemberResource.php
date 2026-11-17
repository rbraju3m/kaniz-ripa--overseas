<?php

namespace App\Http\Resources\Public;

use App\Models\TeamMember;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin TeamMember */
class TeamMemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $t = $this->publicTranslation();

        return [
            'id' => $this->id,
            'locale' => $t?->locale,
            'name' => $t?->name,
            'role' => $t?->role,
            'bio' => $t?->bio,
            'phone' => $this->show_phone ? $this->phone : null,
            'whatsapp' => $this->show_phone && $this->whatsapp,
            'email' => $this->email,
            'photo' => MediaResource::make($this->whenLoaded('photo')),
        ];
    }
}
