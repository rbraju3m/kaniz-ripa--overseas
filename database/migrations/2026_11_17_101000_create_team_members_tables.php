<?php

use App\Support\TranslationColumns as T;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('team_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('photo_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->string('phone', 30)->nullable();
            $table->boolean('show_phone')->default(true);
            $table->boolean('whatsapp')->default(false);
            $table->string('email')->nullable();
            $table->string('status', 20)->default('draft');
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();
            $table->index(['status', 'sort']);
        });
        Schema::create('team_member_translations', function (Blueprint $table) {
            T::base($table, 'team_members', 'team_member_id');
            $table->string('name');
            $table->string('role')->nullable();
            $table->text('bio')->nullable();
            T::review($table);
        });

        // New "team.*" permissions for the existing roles.
        if (Schema::hasTable('roles')) {
            (new RolesAndPermissionsSeeder)->run();
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('team_member_translations');
        Schema::dropIfExists('team_members');
    }
};
