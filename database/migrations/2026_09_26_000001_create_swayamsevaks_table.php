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
        Schema::create('swayamsevaks', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('mobile')->nullable();
            $table->text('address')->nullable();
            $table->foreignId('shakha_id')->nullable()->constrained('shakhas')->onDelete('cascade');
            $table->boolean('ganvesh')->default(false);
            $table->string('shikshan')->nullable();
            $table->timestamps();

            $table->index('shakha_id');
            $table->index('mobile');
            $table->index('ganvesh');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('swayamsevaks');
    }
};
