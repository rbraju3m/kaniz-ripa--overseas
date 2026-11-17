<?php

namespace App\Http\Requests\Admin;

use App\Enums\PublishStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Authorization is enforced by route permission middleware. */
abstract class AdminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function routeId(): ?int
    {
        $id = $this->route('id');

        return $id !== null ? (int) $id : null;
    }

    protected function statusRule(): array
    {
        return ['sometimes', Rule::enum(PublishStatus::class)];
    }

    protected function mediaRule(): array
    {
        return ['nullable', 'integer', 'exists:media,id'];
    }

    /** Rich-text fields are sanitised with HTMLPurifier before validation. */
    protected function richTextFields(): array
    {
        return [];
    }

    protected function prepareForValidation(): void
    {
        $sections = $this->input('sections');
        if (is_array($sections)) {
            foreach ($sections as $i => $section) {
                foreach ((array) ($section['translations'] ?? []) as $locale => $fields) {
                    if (is_array($fields) && isset($fields['body']) && is_string($fields['body'])) {
                        $sections[$i]['translations'][$locale]['body'] = clean($fields['body']);
                    }
                }
            }
            $this->merge(['sections' => $sections]);
        }

        $translations = $this->input('translations');
        if (! is_array($translations)) {
            return;
        }

        foreach ($translations as $locale => $fields) {
            foreach ($this->richTextFields() as $field) {
                if (is_array($fields) && isset($fields[$field]) && is_string($fields[$field])) {
                    $translations[$locale][$field] = clean($fields[$field]);
                }
            }
        }

        $this->merge(['translations' => $translations]);
    }
}
