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
        Schema::create('return_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('dealer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('return_request_raised'); // return_request_raised, return_request_accepted, return_request_rejected, return_request_fulfilled
            $table->text('reason');
            $table->text('customer_notes')->nullable();
            $table->text('dealer_notes')->nullable();
            $table->timestamp('raised_at')->useCurrent();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamp('fulfilled_at')->nullable();
            $table->timestamps();

            $table->index('order_id');
            $table->index('customer_id');
            $table->index('dealer_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('return_requests');
    }
};
