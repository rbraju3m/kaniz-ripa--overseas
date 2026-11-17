<?php

namespace App\Support;

use App\Enums\Locale;
use Illuminate\Validation\Rule;

/**
 * Builds validation rules for the "translations" payload:
 * translations.{bn|en}.{field}. At least one locale is required.
 * A field rule of 'required' applies only when that locale is present.
 */
final class TranslationRules
{
    /**
     * @param  array<string, array<int, mixed>>  $fields  field => rules (applied when the locale is present)
     * @param  array{table: string, foreign_key: string, parent_id: ?int}|null  $slug
     */
    public static function make(array $fields, ?array $slug = null): array
    {
        $rules = ['translations' => ['required', 'array', 'min:1']];

        foreach (Locale::values() as $locale) {
            $prefix = "translations.{$locale}";
            $rules[$prefix] = ['sometimes', 'array'];
            $rules["{$prefix}.is_reviewed"] = ['sometimes', 'boolean'];

            foreach ($fields as $field => $fieldRules) {
                // "required" means: required whenever this locale is submitted.
                $rules["{$prefix}.{$field}"] = array_map(
                    fn ($rule) => $rule === 'required' ? "required_with:{$prefix}" : $rule,
                    $fieldRules,
                );
            }

            if ($slug) {
                $unique = Rule::unique($slug['table'], 'slug')->where('locale', $locale);
                if ($slug['parent_id']) {
                    $unique->ignore($slug['parent_id'], $slug['foreign_key']);
                }
                $rules["{$prefix}.slug"] = ["required_with:{$prefix}", 'string', 'max:190', 'regex:/^[\p{L}\p{M}\p{N}]+(?:-[\p{L}\p{M}\p{N}]+)*$/u', $unique];
            }
        }

        return $rules;
    }
}
