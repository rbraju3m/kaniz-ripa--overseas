<?php

use App\Support\TranslationColumns as T;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('countries', function (Blueprint $table) {
            $table->id();
            $table->char('iso2', 2)->unique();
            $table->boolean('is_served')->default(false)->index();
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();
        });
        Schema::create('country_translations', function (Blueprint $table) {
            T::base($table, 'countries', 'country_id');
            $table->string('name');
            T::review($table);
        });

        Schema::create('industries', function (Blueprint $table) {
            $table->id();
            $table->string('key', 50)->unique();
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();
        });
        Schema::create('industry_translations', function (Blueprint $table) {
            T::base($table, 'industries', 'industry_id');
            $table->string('name');
            T::review($table);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('industry_translations');
        Schema::dropIfExists('industries');
        Schema::dropIfExists('country_translations');
        Schema::dropIfExists('countries');
    }
};
