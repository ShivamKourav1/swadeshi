<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_storefront_lists_active_products(): void
    {
        $dealer = User::factory()->create(['role' => 'dealer']);
        $category = Category::create(['name' => 'Electronics', 'slug' => 'electronics']);

        Product::create([
            'dealer_id' => $dealer->id,
            'category_id' => $category->id,
            'name' => 'Smart Smartphone',
            'slug' => 'smart-smartphone',
            'sku' => 'PHONE-1',
            'price' => 299.99,
            'stock' => 10,
            'status' => 'active',
        ]);

        $response = $this->get('/');
        $response->assertStatus(200);
    }

    public function test_dealer_can_create_new_product(): void
    {
        $dealer = User::factory()->create(['role' => 'dealer']);
        $category = Category::create(['name' => 'Apparel', 'slug' => 'apparel']);

        $response = $this->actingAs($dealer)->post(route('dealer.products.store'), [
            'name' => 'Leather Jacket',
            'category_id' => $category->id,
            'price' => 150.00,
            'stock' => 25,
            'description' => 'Premium genuine leather jacket',
            'sku' => 'JKT-001',
            'status' => 'active',
        ]);

        $response->assertRedirect(route('dealer.products.index'));
        $this->assertDatabaseHas('products', [
            'dealer_id' => $dealer->id,
            'sku' => 'JKT-001',
            'price' => 150.00,
        ]);
    }

    public function test_customer_cannot_create_products(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $category = Category::create(['name' => 'Books', 'slug' => 'books']);

        $response = $this->actingAs($customer)->post(route('dealer.products.store'), [
            'name' => 'Unauthorized Book',
            'category_id' => $category->id,
            'price' => 10.00,
            'stock' => 5,
            'sku' => 'BK-99',
            'status' => 'active',
        ]);

        $response->assertStatus(403);
    }
}
