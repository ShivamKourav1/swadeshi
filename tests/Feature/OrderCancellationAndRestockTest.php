<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\DeliveryLocation;
use App\Models\DeliveryLog;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderCancellationAndRestockTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;
    private User $dealer;
    private User $deliveryPartner;
    private Product $product;
    private DeliveryLocation $location;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::factory()->create(['role' => 'customer']);
        UserProfile::create(['user_id' => $this->customer->id]);

        $this->dealer = User::factory()->create(['role' => 'dealer']);
        UserProfile::create(['user_id' => $this->dealer->id]);

        $this->deliveryPartner = User::factory()->create(['role' => 'delivery_partner']);
        UserProfile::create(['user_id' => $this->deliveryPartner->id]);

        $category = Category::create([
            'name' => 'Uniforms',
            'slug' => 'uniforms',
            'is_active' => true,
        ]);

        $this->product = Product::create([
            'dealer_id' => $this->dealer->id,
            'category_id' => $category->id,
            'name' => 'Ganvesh Belt',
            'slug' => 'ganvesh-belt',
            'sku' => 'GV-BLT-01',
            'price' => 150.00,
            'stock' => 10,
            'status' => 'active',
        ]);

        $this->location = DeliveryLocation::create([
            'user_id' => $this->customer->id,
            'label' => 'Home',
            'recipient_name' => 'Test Customer',
            'phone' => '+15551234',
            'address_line_1' => '100 Main St',
            'city' => 'Springfield',
            'state' => 'OR',
            'postal_code' => '97477',
            'country' => 'India',
            'latitude' => 20.0,
            'longitude' => 78.0,
            'is_default' => true,
        ]);
    }

    public function test_cancellation_before_dispatch_immediately_restores_stock(): void
    {
        // Initial stock is 10. Simulate an order where 3 items were deducted.
        $this->product->update(['stock' => 7]);

        $order = Order::create([
            'order_number' => Order::generateOrderNumber(),
            'customer_id' => $this->customer->id,
            'delivery_location_id' => $this->location->id,
            'delivery_partner_id' => $this->deliveryPartner->id,
            'subtotal' => 450.00,
            'delivery_fee' => 10.00,
            'total_amount' => 460.00,
            'payment_method' => 'cod',
            'payment_status' => 'pending',
            'delivery_status' => 'pending', // Before dispatch
            'order_status' => 'processing',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'dealer_id' => $this->dealer->id,
            'product_name' => $this->product->name,
            'unit_price' => $this->product->price,
            'quantity' => 3,
            'subtotal' => 450.00,
        ]);

        $response = $this->actingAs($this->customer)->post(route('orders.cancel', $order->id), [
            'reason' => 'Changed my mind before dispatch.',
        ]);

        $response->assertSessionHas('success');

        $order->refresh();
        $this->assertEquals('cancelled', $order->order_status);
        $this->assertEquals('cancelled', $order->delivery_status);
        $this->assertEquals('before_dispatch', $order->cancellation_stage);
        $this->assertTrue($order->restocked);
        $this->assertNotNull($order->restocked_at);
        $this->assertEquals($this->customer->id, $order->cancelled_by);

        // Product stock must immediately be restored: 7 + 3 = 10
        $this->product->refresh();
        $this->assertEquals(10, $this->product->stock);

        // Verify DeliveryLog
        $this->assertDatabaseHas('delivery_logs', [
            'order_id' => $order->id,
            'status' => 'cancelled',
        ]);
    }

    public function test_cancellation_after_dispatch_does_not_immediately_restore_stock(): void
    {
        // Initial stock is 10. Simulate 2 items ordered and dispatched.
        $this->product->update(['stock' => 8]);

        $order = Order::create([
            'order_number' => Order::generateOrderNumber(),
            'customer_id' => $this->customer->id,
            'delivery_location_id' => $this->location->id,
            'delivery_partner_id' => $this->deliveryPartner->id,
            'subtotal' => 300.00,
            'delivery_fee' => 10.00,
            'total_amount' => 310.00,
            'payment_method' => 'cod',
            'payment_status' => 'pending',
            'delivery_status' => 'dispatched', // In transit / dispatched
            'order_status' => 'processing',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'dealer_id' => $this->dealer->id,
            'product_name' => $this->product->name,
            'unit_price' => $this->product->price,
            'quantity' => 2,
            'subtotal' => 300.00,
        ]);

        $response = $this->actingAs($this->customer)->post(route('orders.cancel', $order->id), [
            'reason' => 'Unable to receive package.',
        ]);

        $response->assertSessionHas('success');

        $order->refresh();
        $this->assertEquals('cancelled', $order->order_status);
        $this->assertEquals('cancelled', $order->delivery_status);
        $this->assertEquals('after_dispatch', $order->cancellation_stage);
        $this->assertFalse($order->restocked);
        $this->assertNull($order->restocked_at);

        // Stock MUST remain at 8 because goods are still in transit and not physically received by dealer
        $this->product->refresh();
        $this->assertEquals(8, $this->product->stock);
    }

    public function test_dealer_can_confirm_physical_stock_receipt_to_increment_stock(): void
    {
        // Cancelled after dispatch order
        $this->product->update(['stock' => 8]);

        $order = Order::create([
            'order_number' => Order::generateOrderNumber(),
            'customer_id' => $this->customer->id,
            'delivery_location_id' => $this->location->id,
            'delivery_partner_id' => $this->deliveryPartner->id,
            'subtotal' => 300.00,
            'delivery_fee' => 10.00,
            'total_amount' => 310.00,
            'payment_method' => 'cod',
            'payment_status' => 'pending',
            'delivery_status' => 'cancelled',
            'order_status' => 'cancelled',
            'cancellation_stage' => 'after_dispatch',
            'cancellation_reason' => 'Customer refused package at doorstep',
            'cancelled_at' => now(),
            'cancelled_by' => $this->customer->id,
            'restocked' => false,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'dealer_id' => $this->dealer->id,
            'product_name' => $this->product->name,
            'unit_price' => $this->product->price,
            'quantity' => 2,
            'subtotal' => 300.00,
        ]);

        // Dealer confirms physical receipt at dealer sight
        $response = $this->actingAs($this->dealer)->post(route('dealer.orders.confirm_restock', $order->id));

        $response->assertSessionHas('success');

        $order->refresh();
        $this->assertTrue($order->restocked);
        $this->assertNotNull($order->restocked_at);
        $this->assertEquals($this->dealer->id, $order->restocked_by);

        // Stock must now be incremented: 8 + 2 = 10
        $this->product->refresh();
        $this->assertEquals(10, $this->product->stock);

        // Verify returned delivery log
        $this->assertDatabaseHas('delivery_logs', [
            'order_id' => $order->id,
            'status' => 'returned',
        ]);
    }

    public function test_cannot_cancel_already_delivered_or_completed_order(): void
    {
        $order = Order::create([
            'order_number' => Order::generateOrderNumber(),
            'customer_id' => $this->customer->id,
            'delivery_location_id' => $this->location->id,
            'delivery_partner_id' => $this->deliveryPartner->id,
            'subtotal' => 150.00,
            'delivery_fee' => 10.00,
            'total_amount' => 160.00,
            'payment_method' => 'cod',
            'payment_status' => 'paid',
            'delivery_status' => 'delivered',
            'order_status' => 'completed',
        ]);

        $response = $this->actingAs($this->customer)->post(route('orders.cancel', $order->id));
        $response->assertSessionHas('error');
    }
}
