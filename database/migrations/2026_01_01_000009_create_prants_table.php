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
        Schema::create('prants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kshetra_id')->constrained('kshetras')->onDelete('cascade');
            $table->string('prant_name');
            $table->json('toli')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('prants');
    }
};
