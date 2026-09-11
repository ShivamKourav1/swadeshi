<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\DeliveryLocation;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartAndCheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_add_product_to_cart_and_place_order(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $dealer = User::factory()->create(['role' => 'dealer']);
        $category = Category::create(['name' => 'Home', 'slug' => 'home']);

        $product = Product::create([
            'dealer_id' => $dealer->id,
            'category_id' => $category->id,
            'name' => 'Coffee Grinder',
            'slug' => 'coffee-grinder',
            'sku' => 'CG-10',
            'price' => 50.00,
            'stock' => 10,
            'status' => 'active',
        ]);

        $location = DeliveryLocation::create([
            'user_id' => $customer->id,
            'label' => 'Home',
            'recipient_name' => 'Jane Customer',
            'phone' => '+15551111',
            'address_line_1' => '123 Main St',
            'city' => 'Metropolis',
            'state' => 'NY',
            'postal_code' => '10001',
            'country' => 'USA',
            'latitude' => 40.7128,
            'longitude' => -74.0060,
            'is_default' => true,
        ]);

        // Add to cart
        $this->actingAs($customer)->post(route('cart.add', $product->id), ['quantity' => 2]);
        $this->assertEquals(2, session('cart')[$product->id]['quantity']);

        // Place COD order
        $response = $this->actingAs($customer)->post(route('orders.store'), [
            'delivery_location_id' => $location->id,
            'payment_method' => 'cod',
            'notes' => 'Please call on arrival.',
        ]);

        $this->assertDatabaseHas('orders', [
            'customer_id' => $customer->id,
            'delivery_location_id' => $location->id,
            'payment_method' => 'cod',
            'delivery_status' => 'pending',
            'order_status' => 'placed',
        ]);

        // Stock should be decremented from 10 to 8
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock' => 8,
        ]);
    }
}
