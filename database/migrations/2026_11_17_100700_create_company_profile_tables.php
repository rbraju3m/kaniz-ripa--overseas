<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('active_source', 20)->default('generated');
            $table->string('status', 20)->default('draft');
            $table->json('title')->nullable();
            $table->json('description')->nullable();
            $table->timestamps();
        });
        Schema::create('company_profile_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_profile_id')->constrained()->cascadeOnDelete();
            $table->string('source', 20);
            $table->string('locale', 5);
            $table->string('disk', 20)->default('local');
            $table->string('path');
            $table->string('original_name')->nullable();
            $table->unsignedBigInteger('size')->default(0);
            $table->unsignedInteger('version_no');
            $table->boolean('is_current')->default(false);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['source', 'locale', 'is_current']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_profile_versions');
        Schema::dropIfExists('company_profiles');
    }
};
