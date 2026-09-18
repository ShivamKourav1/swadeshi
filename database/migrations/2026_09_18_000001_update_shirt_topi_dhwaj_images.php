<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Updates white shirt, topi, and dhwaj product images to use the dedicated photo assets.
     */
    public function up(): void
    {
        // 1. White Shirt products -> /images/products/white_shirt.jpg
        DB::table('products')
            ->where('name', 'NOT LIKE', '%Set%')
            ->where(function ($query) {
                $query->where('name', 'LIKE', '%Shirt%')
                    ->orWhere('name', 'LIKE', '%शर्ट%')
                    ->orWhere('sku', 'LIKE', '%SHK-SHT-%');
            })
            ->update(['image_url' => '/images/products/white_shirt.jpg']);

        // 2. Dhwaj / Flag products -> /images/products/dwaj.jpg
        DB::table('products')
            ->where(function ($query) {
                $query->where('name', 'LIKE', '%Flag%')
                    ->orWhere('name', 'LIKE', '%ध्वज%')
                    ->orWhere('sku', 'LIKE', '%SHK-FLG-%');
            })
            ->update(['image_url' => '/images/products/dwaj.jpg']);

        // 3. Topi / Cap products -> /images/products/topi.png
        DB::table('products')
            ->where('name', 'NOT LIKE', '%Set%')
            ->where(function ($query) {
                $query->where('name', 'LIKE', '%Cap (टोपी)%')
                    ->orWhere('name', 'LIKE', '%टोपी%')
                    ->orWhere('sku', 'LIKE', '%SHK-CAP-%');
            })
            ->update(['image_url' => '/images/products/topi.png']);

        // Restore Full Ganvesh Set if it was modified
        DB::table('products')
            ->where('name', 'LIKE', '%Full Ganvesh Set%')
            ->update(['image_url' => '/images/categories/ganvesh.jpg']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('products')
            ->where('name', 'NOT LIKE', '%Set%')
            ->where(function ($query) {
                $query->where('name', 'LIKE', '%Shirt%')
                    ->orWhere('name', 'LIKE', '%शर्ट%')
                    ->orWhere('sku', 'LIKE', '%SHK-SHT-%');
            })
            ->update(['image_url' => '/images/products/white_shirt.svg']);

        DB::table('products')
            ->where(function ($query) {
                $query->where('name', 'LIKE', '%Flag%')
                    ->orWhere('name', 'LIKE', '%ध्वज%')
                    ->orWhere('sku', 'LIKE', '%SHK-FLG-%');
            })
            ->update(['image_url' => '/images/products/shakha_flag.svg']);

        DB::table('products')
            ->where('name', 'NOT LIKE', '%Set%')
            ->where(function ($query) {
                $query->where('name', 'LIKE', '%Cap (टोपी)%')
                    ->orWhere('name', 'LIKE', '%टोपी%')
                    ->orWhere('sku', 'LIKE', '%SHK-CAP-%');
            })
            ->update(['image_url' => '/images/products/black_cap.svg']);
    }
};
