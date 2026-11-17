<?php

namespace App\Http\Requests\Admin;

use App\Enums\PublishStatus;
use App\Support\TranslationRules;
use Illuminate\Validation\Rule;

class SuccessStoryRequest extends AdminRequest
{
    protected function richTextFields(): array
    {
        return ['story'];
    }

    public function rules(): array
    {
        return [
            'photo_media_id' => $this->mediaRule(),
            'country_id' => ['nullable', 'integer', 'exists:countries,id'],
            'company_id' => ['nullable', 'integer', 'exists:companies,id'],
            'industry_id' => ['nullable', 'integer', 'exists:industries,id'],
            'video_url' => ['nullable', 'url:https', 'max:255', 'regex:#^https://(www\.)?(youtube\.com|youtu\.be|facebook\.com|fb\.watch|vimeo\.com)/#i'],
            'is_featured' => ['sometimes', 'boolean'],
            'status' => $this->statusRule(),
            'sort' => ['sometimes', 'integer', 'min:0'],
            // Consent is mandatory before a story may be published.
            // Not "sometimes": the rule must run even when the field is omitted.
            'consent_confirmed' => [
                'nullable', 'boolean',
                Rule::requiredIf(fn () => $this->input('status') === PublishStatus::Published->value),
                Rule::when($this->input('status') === PublishStatus::Published->value, ['accepted']),
            ],
            'consent_note' => ['nullable', 'string', 'max:2000', Rule::requiredIf(fn () => $this->boolean('consent_confirmed'))],
            'images' => ['sometimes', 'array', 'max:40'],
            'images.*.media_id' => ['required', 'integer', 'exists:media,id'],
            'images.*.caption' => ['nullable', 'array'],
            ...TranslationRules::make([
                'title' => ['required', 'string', 'max:190'],
                'display_name' => ['required', 'string', 'max:120'],
                'story' => ['nullable', 'string', 'max:50000'],
                'testimonial' => ['nullable', 'string', 'max:2000'],
            ], ['table' => 'success_story_translations', 'foreign_key' => 'success_story_id', 'parent_id' => $this->routeId()]),
        ];
    }

    public function messages(): array
    {
        return [
            'consent_confirmed.required' => 'Written consent must be confirmed before publishing a success story.',
            'consent_confirmed.accepted' => 'Written consent must be confirmed before publishing a success story.',
        ];
    }
}
