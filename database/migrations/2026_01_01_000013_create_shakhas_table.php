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
        Schema::create('shakhas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('nagar_id')->constrained('nagars')->onDelete('cascade');
            $table->string('shakha_name');
            $table->enum('aayu_varg', ['Baal', 'Mahavidhyalay', 'Vyavsai', 'Praurh']);
            $table->enum('type', ['dainik', 'saptahik']);
            $table->json('toli')->nullable();
            $table->enum('status', ['Active', 'Inactive'])->default('Active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shakhas');
    }
};
