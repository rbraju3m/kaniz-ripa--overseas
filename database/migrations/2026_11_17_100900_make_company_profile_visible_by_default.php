<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The profile is now visible by default: the website offers the download as soon
 * as a PDF exists for the active source. A draft profile never had a public
 * download, so switching it to published changes nothing until a PDF exists.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('company_profiles')->where('status', 'draft')->update(['status' => 'published', 'updated_at' => now()]);

        Schema::table('company_profiles', fn ($table) => $table->string('status', 20)->default('published')->change());
    }

    public function down(): void
    {
        Schema::table('company_profiles', fn ($table) => $table->string('status', 20)->default('draft')->change());
    }
};
