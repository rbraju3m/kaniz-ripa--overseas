<?php

namespace App\Http\Requests\Admin;

use App\Support\TranslationRules;

class PageRequest extends AdminRequest
{
    protected function richTextFields(): array
    {
        return ['body'];
    }

    public function rules(): array
    {
        return [
            'key' => ['required', 'string', 'max:50', 'regex:/^[a-z0-9_]+$/', 'unique:pages,key,'.$this->routeId()],
            'cover_media_id' => $this->mediaRule(),
            'status' => $this->statusRule(),
            ...TranslationRules::make([
                'title' => ['required', 'string', 'max:190'],
                'summary' => ['nullable', 'string', 'max:1000'],
                'body' => ['nullable', 'string', 'max:100000'],
            ], ['table' => 'page_translations', 'foreign_key' => 'page_id', 'parent_id' => $this->routeId()]),
        ];
    }
}
