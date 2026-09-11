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
        Schema::table('user_profiles', function (Blueprint $table) {
            $table->foreignId('kshetra_id')->nullable()->constrained('kshetras')->nullOnDelete();
            $table->foreignId('prant_id')->nullable()->constrained('prants')->nullOnDelete();
            $table->foreignId('vibhag_id')->nullable()->constrained('vibhags')->nullOnDelete();
            $table->foreignId('jila_id')->nullable()->constrained('jilas')->nullOnDelete();
            $table->foreignId('nagar_id')->nullable()->constrained('nagars')->nullOnDelete();
            $table->foreignId('shakha_id')->nullable()->constrained('shakhas')->nullOnDelete();
        });

        Schema::table('delivery_locations', function (Blueprint $table) {
            $table->foreignId('kshetra_id')->nullable()->constrained('kshetras')->nullOnDelete();
            $table->foreignId('prant_id')->nullable()->constrained('prants')->nullOnDelete();
            $table->foreignId('vibhag_id')->nullable()->constrained('vibhags')->nullOnDelete();
            $table->foreignId('jila_id')->nullable()->constrained('jilas')->nullOnDelete();
            $table->foreignId('nagar_id')->nullable()->constrained('nagars')->nullOnDelete();
            $table->foreignId('shakha_id')->nullable()->constrained('shakhas')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_profiles', function (Blueprint $table) {
            $table->dropForeign(['kshetra_id']);
            $table->dropForeign(['prant_id']);
            $table->dropForeign(['vibhag_id']);
            $table->dropForeign(['jila_id']);
            $table->dropForeign(['nagar_id']);
            $table->dropForeign(['shakha_id']);
            $table->dropColumn(['kshetra_id', 'prant_id', 'vibhag_id', 'jila_id', 'nagar_id', 'shakha_id']);
        });

        Schema::table('delivery_locations', function (Blueprint $table) {
            $table->dropForeign(['kshetra_id']);
            $table->dropForeign(['prant_id']);
            $table->dropForeign(['vibhag_id']);
            $table->dropForeign(['jila_id']);
            $table->dropForeign(['nagar_id']);
            $table->dropForeign(['shakha_id']);
            $table->dropColumn(['kshetra_id', 'prant_id', 'vibhag_id', 'jila_id', 'nagar_id', 'shakha_id']);
        });
    }
};
