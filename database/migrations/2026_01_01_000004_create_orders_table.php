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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('customer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('delivery_location_id')->constrained('delivery_locations')->cascadeOnDelete();
            $table->foreignId('delivery_partner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('subtotal', 10, 2);
            $table->decimal('delivery_fee', 10, 2)->default(0.00);
            $table->decimal('total_amount', 10, 2);
            $table->string('payment_method')->default('cod'); // cod, stripe, paypal (extendable)
            $table->string('payment_status')->default('pending'); // pending, paid, failed, refunded
            $table->string('delivery_status')->default('pending'); // pending, dispatched, in_transit, delivered, failed, cancelled
            $table->string('order_status')->default('placed'); // placed, processing, out_for_delivery, completed, cancelled
            $table->text('notes')->nullable();
            $table->timestamp('placed_at')->useCurrent();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();

            $table->index('customer_id');
            $table->index('delivery_partner_id');
            $table->index('delivery_status');
            $table->index('payment_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
