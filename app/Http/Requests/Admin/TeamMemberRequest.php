<?php

namespace App\Http\Requests\Admin;

use App\Support\TranslationRules;

class TeamMemberRequest extends AdminRequest
{
    public function rules(): array
    {
        return [
            'photo_media_id' => $this->mediaRule(),
            'phone' => ['nullable', 'string', 'max:30', 'regex:/^\+?[0-9\s\-()]{6,30}$/'],
            'show_phone' => ['sometimes', 'boolean'],
            'whatsapp' => ['sometimes', 'boolean'],
            'email' => ['nullable', 'email', 'max:190'],
            'status' => $this->statusRule(),
            'sort' => ['sometimes', 'integer', 'min:0'],
            ...TranslationRules::make([
                'name' => ['required', 'string', 'max:190'],
                'role' => ['nullable', 'string', 'max:190'],
                'bio' => ['nullable', 'string', 'max:2000'],
            ]),
        ];
    }
}
