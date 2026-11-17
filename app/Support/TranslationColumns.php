<?php

namespace App\Support;

use Illuminate\Database\Schema\Blueprint;

/**
 * Shared column set for every *_translations table.
 */
final class TranslationColumns
{
    public static function base(Blueprint $table, string $parentTable, string $foreignKey): void
    {
        $table->id();
        $table->foreignId($foreignKey)->constrained($parentTable)->cascadeOnDelete();
        $table->string('locale', 5);
        $table->unique([$foreignKey, 'locale']);
    }

    public static function review(Blueprint $table): void
    {
        $table->boolean('is_reviewed')->default(false);
        $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
        $table->timestamp('reviewed_at')->nullable();
        $table->timestamps();
    }
}
