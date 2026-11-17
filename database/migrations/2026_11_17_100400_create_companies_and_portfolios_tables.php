<?php

use App\Support\TranslationColumns as T;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->foreignId('logo_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->foreignId('country_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('industry_id')->nullable()->constrained()->nullOnDelete();
            $table->string('website_url')->nullable();
            $table->string('verification_status', 20)->default('unverified');
            $table->boolean('is_partner_displayed')->default(false);
            $table->boolean('is_featured')->default(false);
            $table->unsignedInteger('sort')->default(0);
            $table->text('internal_note')->nullable();
            $table->timestamps();
            $table->index(['verification_status', 'is_partner_displayed', 'sort']);
        });
        Schema::create('company_translations', function (Blueprint $table) {
            T::base($table, 'companies', 'company_id');
            $table->text('description')->nullable();
            T::review($table);
        });

        Schema::create('portfolios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('country_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('industry_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('cover_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->date('project_date')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->string('status', 20)->default('draft');
            $table->unsignedInteger('sort')->default(0);
            $table->text('internal_note')->nullable();
            $table->timestamps();
            $table->index(['status', 'is_featured', 'sort']);
        });
        Schema::create('portfolio_translations', function (Blueprint $table) {
            T::base($table, 'portfolios', 'portfolio_id');
            $table->string('title');
            $table->string('slug');
            $table->text('summary')->nullable();
            $table->longText('description')->nullable();
            $table->longText('activities')->nullable();
            $table->unique(['locale', 'slug']);
            T::review($table);
        });
        Schema::create('portfolio_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('portfolio_id')->constrained()->cascadeOnDelete();
            $table->foreignId('media_id')->constrained('media')->cascadeOnDelete();
            $table->json('caption')->nullable();
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('portfolio_images');
        Schema::dropIfExists('portfolio_translations');
        Schema::dropIfExists('portfolios');
        Schema::dropIfExists('company_translations');
        Schema::dropIfExists('companies');
    }
};
