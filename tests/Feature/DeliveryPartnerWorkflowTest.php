<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\DeliveryLocation;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeliveryPartnerWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_delivery_partner_can_update_status_collect_cod_and_mark_completed(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $dealer = User::factory()->create(['role' => 'dealer']);
        $deliveryPartner = User::factory()->create(['role' => 'delivery_partner']);
        $category = Category::create(['name' => 'Tech', 'slug' => 'tech']);

        $product = Product::create([
            'dealer_id' => $dealer->id,
            'category_id' => $category->id,
            'name' => 'Tablet Device',
            'slug' => 'tablet-device',
            'sku' => 'TAB-01',
            'price' => 200.00,
            'stock' => 5,
            'status' => 'active',
        ]);

        $location = DeliveryLocation::create([
            'user_id' => $customer->id,
            'label' => 'Office',
            'recipient_name' => 'John Customer',
            'phone' => '+15552222',
            'address_line_1' => '456 Corporate Blvd',
            'city' => 'Gotham',
            'state' => 'NY',
            'postal_code' => '10002',
            'country' => 'USA',
        ]);

        $order = Order::create([
            'order_number' => Order::generateOrderNumber(),
            'customer_id' => $customer->id,
            'delivery_location_id' => $location->id,
            'delivery_partner_id' => $deliveryPartner->id,
            'subtotal' => 200.00,
            'delivery_fee' => 10.00,
            'total_amount' => 210.00,
            'payment_method' => 'cod',
            'payment_status' => 'pending',
            'delivery_status' => 'dispatched',
            'order_status' => 'processing',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'dealer_id' => $dealer->id,
            'product_name' => $product->name,
            'unit_price' => 200.00,
            'quantity' => 1,
            'subtotal' => 200.00,
        ]);

        // Delivery Partner updates status to 'delivered', collects COD cash $210.00, uploads screenshot receipt, and marks completed
        $response = $this->actingAs($deliveryPartner)->put(route('delivery.status.update', $order->id), [
            'delivery_status' => 'delivered',
            'payment_collected' => true,
            'amount_collected' => 210.00,
            'screenshot_url' => 'https://example.com/receipts/proof_123.jpg',
            'mark_completed' => true,
            'notes' => 'COD Cash $210 received, package handed to customer.',
        ]);

        $response->assertSessionHas('success');

        // Verify order status is marked as COMPLETED by delivery partner!
        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'delivery_status' => 'delivered',
            'payment_status' => 'paid',
            'order_status' => 'completed',
        ]);

        // Verify payment record screenshot and collection
        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'payment_method' => 'cod',
            'amount' => 210.00,
            'status' => 'completed',
            'collected_by_id' => $deliveryPartner->id,
            'screenshot_url' => 'https://example.com/receipts/proof_123.jpg',
        ]);

        // Verify delivery audit log entry
        $this->assertDatabaseHas('delivery_logs', [
            'order_id' => $order->id,
            'delivery_partner_id' => $deliveryPartner->id,
            'status' => 'delivered',
            'payment_collected' => true,
        ]);
    }
}
