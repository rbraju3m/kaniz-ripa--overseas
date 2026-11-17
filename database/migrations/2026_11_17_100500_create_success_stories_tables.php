<?php

use App\Support\TranslationColumns as T;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('success_stories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('photo_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->foreignId('country_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('industry_id')->nullable()->constrained()->nullOnDelete();
            $table->string('video_url')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->string('status', 20)->default('draft');
            $table->timestamp('consent_confirmed_at')->nullable();
            $table->foreignId('consent_confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('consent_note')->nullable();
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();
            $table->index(['status', 'is_featured', 'sort']);
        });
        Schema::create('success_story_translations', function (Blueprint $table) {
            T::base($table, 'success_stories', 'success_story_id');
            $table->string('title');
            $table->string('slug');
            $table->string('display_name');
            $table->longText('story')->nullable();
            $table->text('testimonial')->nullable();
            $table->unique(['locale', 'slug']);
            T::review($table);
        });
        Schema::create('success_story_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('success_story_id')->constrained()->cascadeOnDelete();
            $table->foreignId('media_id')->constrained('media')->cascadeOnDelete();
            $table->json('caption')->nullable();
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('success_story_images');
        Schema::dropIfExists('success_story_translations');
        Schema::dropIfExists('success_stories');
    }
};
