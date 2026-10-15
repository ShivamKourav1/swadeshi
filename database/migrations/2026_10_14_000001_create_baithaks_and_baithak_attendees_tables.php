<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('baithaks', function (Blueprint $table) {
            $table->id();
            $table->string('unit_level', 50)->index();
            $table->unsignedBigInteger('unit_id')->index();
            $table->string('title', 255);
            $table->string('baithak_type', 100)->nullable();
            $table->date('baithak_date')->index();
            $table->string('baithak_time', 50)->nullable();
            $table->string('venue', 255)->nullable();
            $table->text('agenda')->nullable();
            $table->string('status', 50)->default('scheduled')->index();
            $table->json('expected_daayitwas')->nullable();
            $table->json('custom_expected')->nullable();
            $table->text('comments_scheduling')->nullable();
            $table->text('minutes')->nullable();
            $table->text('comments_minutes')->nullable();
            $table->integer('attended_count')->default(0);
            $table->integer('total_expected_count')->default(0);
            $table->json('photos')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['unit_level', 'unit_id']);
        });

        Schema::create('baithak_attendees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('baithak_id')->constrained('baithaks')->cascadeOnDelete();
            $table->foreignId('swayamsevak_id')->nullable()->constrained('swayamsevaks')->nullOnDelete();
            $table->string('attendee_type', 50)->default('swayamsevak')->index(); // 'swayamsevak', 'guest'
            $table->string('name', 255);
            $table->string('mobile', 50)->nullable();
            $table->string('daayitwa_name', 255)->nullable();
            $table->string('unit_name', 255)->nullable();
            $table->string('unit_level', 50)->nullable();
            $table->boolean('is_expected')->default(false);
            $table->boolean('is_present')->default(false)->index();
            $table->string('remarks', 500)->nullable();
            $table->timestamps();

            $table->index(['baithak_id', 'attendee_type']);
            $table->index(['baithak_id', 'is_present']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('baithak_attendees');
        Schema::dropIfExists('baithaks');
    }
};
