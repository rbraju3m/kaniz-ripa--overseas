<?php

namespace App\Http\Requests\Admin;

use App\Support\TranslationRules;

class ServiceRequest extends AdminRequest
{
    protected function richTextFields(): array
    {
        return ['body'];
    }

    public function rules(): array
    {
        return [
            'icon' => ['nullable', 'string', 'max:50', 'regex:/^[a-z0-9-]+$/'],
            'image_media_id' => $this->mediaRule(),
            'status' => $this->statusRule(),
            'is_featured' => ['sometimes', 'boolean'],
            'sort' => ['sometimes', 'integer', 'min:0'],
            ...TranslationRules::make([
                'title' => ['required', 'string', 'max:190'],
                'summary' => ['nullable', 'string', 'max:1000'],
                'body' => ['nullable', 'string', 'max:100000'],
            ], ['table' => 'service_translations', 'foreign_key' => 'service_id', 'parent_id' => $this->routeId()]),
        ];
    }
}
