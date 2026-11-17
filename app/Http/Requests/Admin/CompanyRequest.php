<?php

namespace App\Http\Requests\Admin;

use App\Enums\VerificationStatus;
use App\Models\Company;
use App\Support\TranslationRules;
use Illuminate\Validation\Rule;

class CompanyRequest extends AdminRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:190'],
            'slug' => ['required', 'string', 'max:190', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('companies', 'slug')->ignore($this->routeId())],
            'logo_media_id' => $this->mediaRule(),
            'country_id' => ['nullable', 'integer', 'exists:countries,id'],
            'industry_id' => ['nullable', 'integer', 'exists:industries,id'],
            'website_url' => ['nullable', 'url:https,http', 'max:255'],
            'verification_status' => ['sometimes', Rule::enum(VerificationStatus::class)],
            // A company can only be displayed as a partner once verified.
            'is_partner_displayed' => ['sometimes', 'boolean', Rule::prohibitedIf(fn () => $this->boolean('is_partner_displayed')
                && $this->effectiveVerification() !== VerificationStatus::Verified->value)],
            'is_featured' => ['sometimes', 'boolean'],
            'sort' => ['sometimes', 'integer', 'min:0'],
            'internal_note' => ['nullable', 'string', 'max:2000'],
            ...TranslationRules::make([
                'description' => ['nullable', 'string', 'max:5000'],
            ]),
            'translations' => ['sometimes', 'array'],
        ];
    }

    private function effectiveVerification(): string
    {
        return (string) ($this->input('verification_status')
            ?? Company::query()->whereKey($this->routeId())->first()?->verification_status?->value
            ?? VerificationStatus::Unverified->value);
    }

    public function messages(): array
    {
        return ['is_partner_displayed.prohibited' => 'Only verified companies can be displayed as partners.'];
    }
}
