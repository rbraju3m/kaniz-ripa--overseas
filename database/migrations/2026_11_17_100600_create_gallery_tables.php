<?php

use App\Support\TranslationColumns as T;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gallery_categories', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 80)->unique();
            $table->unsignedInteger('sort')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        Schema::create('gallery_category_translations', function (Blueprint $table) {
            T::base($table, 'gallery_categories', 'gallery_category_id');
            $table->string('name');
            T::review($table);
        });
        Schema::create('gallery_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gallery_category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type', 10)->default('image');
            $table->foreignId('media_id')->nullable()->constrained('media')->cascadeOnDelete();
            $table->string('video_url')->nullable();
            $table->json('title')->nullable();
            $table->string('status', 20)->default('draft');
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();
            $table->index(['status', 'gallery_category_id', 'sort']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gallery_media');
        Schema::dropIfExists('gallery_category_translations');
        Schema::dropIfExists('gallery_categories');
    }
};
