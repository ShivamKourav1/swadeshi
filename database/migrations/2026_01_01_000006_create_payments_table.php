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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->string('payment_method')->default('cod'); // cod, stripe, paypal, etc.
            $table->string('transaction_id')->nullable();
            $table->decimal('amount', 10, 2);
            $table->string('status')->default('pending'); // pending, completed, failed, refunded
            $table->foreignId('collected_by_id')->nullable()->constrained('users')->nullOnDelete(); // delivery partner user id for COD
            $table->string('screenshot_url')->nullable(); // Payment receipt / proof screenshot
            $table->text('notes')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index('order_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
