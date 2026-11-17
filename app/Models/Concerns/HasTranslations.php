<?php

namespace App\Models\Concerns;

use App\Enums\Locale;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Auth;

/**
 * Translatable models keep language-neutral data on the base table and
 * per-locale text on a "{Model}Translation" table.
 *
 * Publishing rule: only translations with is_reviewed = true are ever shown publicly.
 */
trait HasTranslations
{
    /** @return class-string<Model> */
    public static function translationModel(): string
    {
        return static::class.'Translation';
    }

    public function translations(): HasMany
    {
        return $this->hasMany(static::translationModel());
    }

    public function reviewedTranslations(): HasMany
    {
        return $this->translations()->where('is_reviewed', true);
    }

    /** Any translation in the given locale (admin use). */
    public function translation(Locale|string|null $locale = null): ?Model
    {
        $locale = $this->localeValue($locale);

        return $this->translations->firstWhere('locale', $locale);
    }

    /**
     * The reviewed translation for the locale, falling back to the reviewed
     * fallback-locale translation. Null when nothing reviewed exists.
     */
    public function publicTranslation(Locale|string|null $locale = null): ?Model
    {
        $locale = $this->localeValue($locale);
        $reviewed = $this->translations->where('is_reviewed', true);

        return $reviewed->firstWhere('locale', $locale)
            ?? $reviewed->firstWhere('locale', Locale::fallback()->value);
    }

    /** Restrict to records having at least one reviewed translation. */
    public function scopeHasReviewedTranslation(Builder $query): Builder
    {
        return $query->whereHas('translations', fn (Builder $q) => $q->where('is_reviewed', true));
    }

    /**
     * Upsert translations from ['bn' => [...fields, 'is_reviewed' => bool], 'en' => [...]].
     *
     * @param  array<string, array<string, mixed>>  $translations
     */
    public function syncTranslations(array $translations): void
    {
        foreach ($translations as $locale => $fields) {
            if (! in_array($locale, Locale::values(), true) || ! is_array($fields)) {
                continue;
            }

            $existing = $this->translations()->firstOrNew(['locale' => $locale]);
            $wasReviewed = (bool) $existing->is_reviewed;
            $isReviewed = (bool) ($fields['is_reviewed'] ?? false);

            $existing->fill(collect($fields)->except(['is_reviewed', 'reviewed_by', 'reviewed_at'])->all());
            $existing->is_reviewed = $isReviewed;

            if ($isReviewed && (! $wasReviewed || $existing->isDirty())) {
                $existing->reviewed_by = Auth::id();
                $existing->reviewed_at = now();
            } elseif (! $isReviewed) {
                $existing->reviewed_by = null;
                $existing->reviewed_at = null;
            }

            $existing->save();
        }

        $this->unsetRelation('translations');
    }

    private function localeValue(Locale|string|null $locale): string
    {
        if ($locale instanceof Locale) {
            return $locale->value;
        }

        return $locale ?? app()->getLocale();
    }
}
