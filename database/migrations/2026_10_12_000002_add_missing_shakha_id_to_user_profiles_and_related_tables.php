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
        if (Schema::hasTable('user_profiles') && !Schema::hasColumn('user_profiles', 'shakha_id')) {
            Schema::table('user_profiles', function (Blueprint $table) {
                $table->unsignedBigInteger('shakha_id')->nullable()->after('basti_id');
            });
        }

        if (Schema::hasTable('delivery_locations') && !Schema::hasColumn('delivery_locations', 'shakha_id')) {
            Schema::table('delivery_locations', function (Blueprint $table) {
                $table->unsignedBigInteger('shakha_id')->nullable()->after('basti_id');
            });
        }

        if (Schema::hasTable('orders') && !Schema::hasColumn('orders', 'shakha_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->unsignedBigInteger('shakha_id')->nullable()->after('basti_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('orders') && Schema::hasColumn('orders', 'shakha_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropColumn('shakha_id');
            });
        }

        if (Schema::hasTable('delivery_locations') && Schema::hasColumn('delivery_locations', 'shakha_id')) {
            Schema::table('delivery_locations', function (Blueprint $table) {
                $table->dropColumn('shakha_id');
            });
        }

        if (Schema::hasTable('user_profiles') && Schema::hasColumn('user_profiles', 'shakha_id')) {
            Schema::table('user_profiles', function (Blueprint $table) {
                $table->dropColumn('shakha_id');
            });
        }
    }
};
