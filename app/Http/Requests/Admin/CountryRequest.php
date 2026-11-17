<?php

namespace App\Http\Requests\Admin;

use App\Support\TranslationRules;
use Illuminate\Validation\Rule;

class CountryRequest extends AdminRequest
{
    public function rules(): array
    {
        return [
            'iso2' => ['required', 'string', 'size:2', 'alpha', Rule::unique('countries', 'iso2')->ignore($this->routeId())],
            'is_served' => ['sometimes', 'boolean'],
            'sort' => ['sometimes', 'integer', 'min:0'],
            ...TranslationRules::make(['name' => ['required', 'string', 'max:120']]),
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['iso2' => strtoupper((string) $this->input('iso2'))]);
    }
}
