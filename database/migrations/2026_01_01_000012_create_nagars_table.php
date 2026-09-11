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
        Schema::create('nagars', function (Blueprint $table) {
            $table->id();
            $table->foreignId('jila_id')->constrained('jilas')->onDelete('cascade');
            $table->string('nagar_name');
            $table->json('toli')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nagars');
    }
};
