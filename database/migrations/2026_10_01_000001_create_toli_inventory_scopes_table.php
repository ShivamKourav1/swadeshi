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
        Schema::create('toli_inventory_scopes', function (Blueprint $table) {
            $table->id();
            $table->string('unit_type'); // 'kshetra', 'prant', 'vibhag', 'jila', 'nagar'
            $table->unsignedBigInteger('unit_id');
            $table->json('visible_sub_units')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['unit_type', 'unit_id'], 'toli_inv_scopes_unit_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('toli_inventory_scopes');
    }
};
