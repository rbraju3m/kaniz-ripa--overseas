<?php

namespace App\Http\Requests\Admin;

use App\Support\TranslationRules;

class PortfolioRequest extends AdminRequest
{
    protected function richTextFields(): array
    {
        return ['description', 'activities'];
    }

    public function rules(): array
    {
        return [
            'company_id' => ['nullable', 'integer', 'exists:companies,id'],
            'country_id' => ['nullable', 'integer', 'exists:countries,id'],
            'industry_id' => ['nullable', 'integer', 'exists:industries,id'],
            'cover_media_id' => $this->mediaRule(),
            'project_date' => ['nullable', 'date'],
            'is_featured' => ['sometimes', 'boolean'],
            'status' => $this->statusRule(),
            'sort' => ['sometimes', 'integer', 'min:0'],
            'internal_note' => ['nullable', 'string', 'max:2000'],
            'images' => ['sometimes', 'array', 'max:60'],
            'images.*.media_id' => ['required', 'integer', 'exists:media,id'],
            'images.*.caption' => ['nullable', 'array'],
            'images.*.caption.bn' => ['nullable', 'string', 'max:255'],
            'images.*.caption.en' => ['nullable', 'string', 'max:255'],
            ...TranslationRules::make([
                'title' => ['required', 'string', 'max:190'],
                'summary' => ['nullable', 'string', 'max:1000'],
                'description' => ['nullable', 'string', 'max:100000'],
                'activities' => ['nullable', 'string', 'max:20000'],
            ], ['table' => 'portfolio_translations', 'foreign_key' => 'portfolio_id', 'parent_id' => $this->routeId()]),
        ];
    }
}
