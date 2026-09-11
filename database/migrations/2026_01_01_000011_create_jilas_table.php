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
        Schema::create('jilas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vibhag_id')->constrained('vibhags')->onDelete('cascade');
            $table->string('jila_name');
            $table->json('toli')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jilas');
    }
};
