<?php

use App\Support\TranslationColumns as T;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->string('key', 50)->unique();
            $table->foreignId('cover_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->string('status', 20)->default('draft')->index();
            $table->timestamps();
        });
        Schema::create('page_translations', function (Blueprint $table) {
            T::base($table, 'pages', 'page_id');
            $table->string('title');
            $table->string('slug');
            $table->text('summary')->nullable();
            $table->longText('body')->nullable();
            $table->unique(['locale', 'slug']);
            T::review($table);
        });

        Schema::create('page_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('page_id')->constrained()->cascadeOnDelete();
            $table->string('key', 50);
            $table->foreignId('media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->string('icon', 50)->nullable();
            $table->unsignedInteger('sort')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['page_id', 'key']);
        });
        Schema::create('page_section_translations', function (Blueprint $table) {
            T::base($table, 'page_sections', 'page_section_id');
            $table->string('title')->nullable();
            $table->longText('body')->nullable();
            T::review($table);
        });

        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('icon', 50)->nullable();
            $table->foreignId('image_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->string('status', 20)->default('draft');
            $table->boolean('is_featured')->default(false);
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();
            $table->index(['status', 'is_featured', 'sort']);
        });
        Schema::create('service_translations', function (Blueprint $table) {
            T::base($table, 'services', 'service_id');
            $table->string('title');
            $table->string('slug');
            $table->text('summary')->nullable();
            $table->longText('body')->nullable();
            $table->unique(['locale', 'slug']);
            T::review($table);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_translations');
        Schema::dropIfExists('services');
        Schema::dropIfExists('page_section_translations');
        Schema::dropIfExists('page_sections');
        Schema::dropIfExists('page_translations');
        Schema::dropIfExists('pages');
    }
};
