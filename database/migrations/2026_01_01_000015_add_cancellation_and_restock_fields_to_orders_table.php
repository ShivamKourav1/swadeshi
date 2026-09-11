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
            $table->text('cancellation_reason')->nullable()->after('notes');
            $table->string('cancellation_stage')->nullable()->after('cancellation_reason'); // 'before_dispatch', 'after_dispatch'
            $table->timestamp('cancelled_at')->nullable()->after('cancellation_stage');
            $table->foreignId('cancelled_by')->nullable()->after('cancelled_at')->constrained('users')->nullOnDelete();
            $table->boolean('restocked')->default(false)->after('cancelled_by');
            $table->timestamp('restocked_at')->nullable()->after('restocked');
            $table->foreignId('restocked_by')->nullable()->after('restocked_at')->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['cancelled_by']);
            $table->dropForeign(['restocked_by']);
            $table->dropColumn([
                'cancellation_reason',
                'cancellation_stage',
                'cancelled_at',
                'cancelled_by',
                'restocked',
                'restocked_at',
                'restocked_by',
            ]);
        });
    }
};
