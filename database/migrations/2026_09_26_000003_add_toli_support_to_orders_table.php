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
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('delivery_location_id')->nullable()->change();

            // Direct organizational unit tagging for toli orders
            $table->boolean('is_toli_order')->default(false)->after('order_status');
            $table->foreignId('shakha_id')->nullable()->after('is_toli_order')->constrained('shakhas')->nullOnDelete();
            $table->foreignId('nagar_id')->nullable()->after('shakha_id')->constrained('nagars')->nullOnDelete();
            $table->foreignId('jila_id')->nullable()->after('nagar_id')->constrained('jilas')->nullOnDelete();
            $table->foreignId('vibhag_id')->nullable()->after('jila_id')->constrained('vibhags')->nullOnDelete();

            $table->index(['is_toli_order', 'order_status']);
            $table->index('shakha_id');
            $table->index('nagar_id');
            $table->index('jila_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['shakha_id']);
            $table->dropForeign(['nagar_id']);
            $table->dropForeign(['jila_id']);
            $table->dropForeign(['vibhag_id']);
            $table->dropColumn(['is_toli_order', 'shakha_id', 'nagar_id', 'jila_id', 'vibhag_id']);
            $table->foreignId('delivery_location_id')->nullable(false)->change();
        });
    }
};
