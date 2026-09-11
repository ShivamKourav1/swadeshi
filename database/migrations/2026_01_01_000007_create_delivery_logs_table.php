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
        Schema::create('delivery_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('delivery_partner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status'); // placed, dispatched, in_transit, delivered, completed, cancelled, returned
            $table->boolean('payment_collected')->default(false);
            $table->decimal('amount_collected', 10, 2)->default(0.00);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('order_id');
            $table->index('delivery_partner_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('delivery_logs');
    }
};
