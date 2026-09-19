<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Decodes HTML entities (such as &#039; into ' and &quot; into ") in product names and descriptions.
     */
    public function up(): void
    {
        $decodeRecursive = function (?string $value): ?string {
            if ($value === null) {
                return null;
            }

            $decoded = $value;
            while (str_contains($decoded, '&') && preg_match('/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/', $decoded)) {
                $prev = $decoded;
                $decoded = html_entity_decode($decoded, ENT_QUOTES | ENT_HTML5, 'UTF-8');
                if ($decoded === $prev) {
                    break;
                }
            }

            return $decoded;
        };

        // 1. Clean products table
        $products = DB::table('products')
            ->where(function ($query) {
                $query->where('name', 'LIKE', '%&%')
                    ->orWhere('description', 'LIKE', '%&%');
            })
            ->get();

        foreach ($products as $product) {
            $name = $decodeRecursive($product->name);
            $description = $decodeRecursive($product->description);

            DB::table('products')
                ->where('id', $product->id)
                ->update([
                    'name' => $name,
                    'description' => $description,
                ]);
        }

        // 2. Clean order_items table if any items recorded encoded names
        $orderItems = DB::table('order_items')
            ->where('product_name', 'LIKE', '%&%')
            ->get();

        foreach ($orderItems as $item) {
            DB::table('order_items')
                ->where('id', $item->id)
                ->update([
                    'product_name' => $decodeRecursive($item->product_name),
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to re-corrupt data on rollback
    }
};
