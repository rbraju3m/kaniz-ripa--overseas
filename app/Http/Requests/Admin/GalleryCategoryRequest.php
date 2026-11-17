<?php

namespace App\Http\Requests\Admin;

use App\Support\TranslationRules;
use Illuminate\Validation\Rule;

class GalleryCategoryRequest extends AdminRequest
{
    public function rules(): array
    {
        return [
            'slug' => ['required', 'string', 'max:80', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('gallery_categories', 'slug')->ignore($this->routeId())],
            'sort' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            ...TranslationRules::make(['name' => ['required', 'string', 'max:120']]),
        ];
    }
}
