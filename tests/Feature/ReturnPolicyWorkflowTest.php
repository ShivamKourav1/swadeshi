<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\DeliveryLocation;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ReturnRequest;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReturnPolicyWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;
    private User $dealer;
    private Product $product;
    private DeliveryLocation $location;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::factory()->create(['role' => 'customer']);
        UserProfile::create(['user_id' => $this->customer->id]);

        $this->dealer = User::factory()->create(['role' => 'dealer']);
        UserProfile::create(['user_id' => $this->dealer->id]);

        $category = Category::create([
            'name' => 'Ghosh Instruments',
            'slug' => 'ghosh-instruments',
            'is_active' => true,
        ]);

        $this->product = Product::create([
            'dealer_id' => $this->dealer->id,
            'category_id' => $category->id,
            'name' => 'Brass Ghosh Vamshi Flute',
            'slug' => 'brass-ghosh-vamshi',
            'sku' => 'GH-VMS-01',
            'price' => 450.00,
            'stock' => 15,
            'status' => 'active',
        ]);

        $this->location = DeliveryLocation::create([
            'user_id' => $this->customer->id,
            'label' => 'Home',
            'recipient_name' => 'Jane Customer',
            'phone' => '+15559876',
            'address_line_1' => '500 Harmony Lane',
            'city' => 'Jaipur',
            'state' => 'RJ',
            'postal_code' => '302001',
            'country' => 'India',
            'latitude' => 26.9124,
            'longitude' => 75.7873,
            'is_default' => true,
        ]);
    }

    public function test_customer_can_raise_return_request_on_completed_order(): void
    {
        $order = Order::create([
            'order_number' => Order::generateOrderNumber(),
            'customer_id' => $this->customer->id,
            'delivery_location_id' => $this->location->id,
            'subtotal' => 900.00,
            'delivery_fee' => 10.00,
            'total_amount' => 910.00,
            'payment_method' => 'cod',
            'payment_status' => 'paid',
            'delivery_status' => 'delivered',
            'order_status' => 'completed',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'dealer_id' => $this->dealer->id,
            'product_name' => $this->product->name,
            'unit_price' => $this->product->price,
            'quantity' => 2,
            'subtotal' => 900.00,
        ]);

        $response = $this->actingAs($this->customer)->post(route('orders.return_request.store', $order->id), [
            'reason' => 'Wrong flute scale delivered',
            'customer_notes' => 'Looking to exchange or return for standard high pitch.',
        ]);

        $response->assertSessionHas('success');

        $this->assertDatabaseHas('return_requests', [
            'order_id' => $order->id,
            'customer_id' => $this->customer->id,
            'dealer_id' => $this->dealer->id,
            'status' => 'return_request_raised',
            'reason' => 'Wrong flute scale delivered',
        ]);

        $this->assertDatabaseHas('delivery_logs', [
            'order_id' => $order->id,
            'status' => 'return_requested',
        ]);
    }

    public function test_customer_cannot_raise_return_request_on_undelivered_order(): void
    {
        $order = Order::create([
            'order_number' => Order::generateOrderNumber(),
            'customer_id' => $this->customer->id,
            'delivery_location_id' => $this->location->id,
            'subtotal' => 450.00,
            'delivery_fee' => 10.00,
            'total_amount' => 460.00,
            'payment_method' => 'cod',
            'payment_status' => 'pending',
            'delivery_status' => 'pending',
            'order_status' => 'placed',
        ]);

        $response = $this->actingAs($this->customer)->post(route('orders.return_request.store', $order->id), [
            'reason' => 'Changed mind',
        ]);

        $response->assertSessionHas('error');
    }

    public function test_dealer_can_accept_and_fulfill_return_request_to_cancel_and_restock(): void
    {
        // Product stock is at 13 (2 items were previously purchased)
        $this->product->update(['stock' => 13]);

        $order = Order::create([
            'order_number' => Order::generateOrderNumber(),
            'customer_id' => $this->customer->id,
            'delivery_location_id' => $this->location->id,
            'subtotal' => 900.00,
            'delivery_fee' => 10.00,
            'total_amount' => 910.00,
            'payment_method' => 'cod',
            'payment_status' => 'paid',
            'delivery_status' => 'delivered',
            'order_status' => 'completed',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'dealer_id' => $this->dealer->id,
            'product_name' => $this->product->name,
            'unit_price' => $this->product->price,
            'quantity' => 2,
            'subtotal' => 900.00,
        ]);

        $returnRequest = ReturnRequest::create([
            'order_id' => $order->id,
            'customer_id' => $this->customer->id,
            'dealer_id' => $this->dealer->id,
            'status' => 'return_request_raised',
            'reason' => 'Defective flute key',
            'customer_notes' => 'Key has loose seal.',
            'raised_at' => now(),
        ]);

        // 1. Dealer accepts return request
        $acceptResponse = $this->actingAs($this->dealer)->post(route('dealer.return_requests.accept', $returnRequest->id), [
            'dealer_notes' => 'Please bring product to counter for exchange.',
        ]);

        $acceptResponse->assertSessionHas('success');
        $returnRequest->refresh();
        $this->assertEquals('return_request_accepted', $returnRequest->status);
        $this->assertNotNull($returnRequest->accepted_at);

        // At this stage, stock should NOT be incremented yet (still waiting for physical arrival)
        $this->product->refresh();
        $this->assertEquals(13, $this->product->stock);

        // 2. Product physically arrives at dealer site; Dealer fulfills return
        $fulfillResponse = $this->actingAs($this->dealer)->post(route('dealer.return_requests.fulfill', $returnRequest->id));

        $fulfillResponse->assertSessionHas('success');

        $returnRequest->refresh();
        $this->assertEquals('return_request_fulfilled', $returnRequest->status);
        $this->assertNotNull($returnRequest->fulfilled_at);

        // Order is automatically cancelled with reason "Return Request"
        $order->refresh();
        $this->assertEquals('cancelled', $order->order_status);
        $this->assertEquals('returned', $order->delivery_status);
        $this->assertStringContainsString('Return Request', $order->cancellation_reason);
        $this->assertTrue($order->restocked);
        $this->assertNotNull($order->restocked_at);
        $this->assertEquals($this->dealer->id, $order->restocked_by);

        // Stock MUST now be incremented: 13 + 2 = 15
        $this->product->refresh();
        $this->assertEquals(15, $this->product->stock);

        // Verify return fulfillment delivery log
        $this->assertDatabaseHas('delivery_logs', [
            'order_id' => $order->id,
            'status' => 'returned',
        ]);
    }

    public function test_dealer_can_reject_return_request(): void
    {
        $order = Order::create([
            'order_number' => Order::generateOrderNumber(),
            'customer_id' => $this->customer->id,
            'delivery_location_id' => $this->location->id,
            'subtotal' => 450.00,
            'delivery_fee' => 10.00,
            'total_amount' => 460.00,
            'payment_method' => 'cod',
            'payment_status' => 'paid',
            'delivery_status' => 'delivered',
            'order_status' => 'completed',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'dealer_id' => $this->dealer->id,
            'product_name' => $this->product->name,
            'unit_price' => $this->product->price,
            'quantity' => 1,
            'subtotal' => 450.00,
        ]);

        $returnRequest = ReturnRequest::create([
            'order_id' => $order->id,
            'customer_id' => $this->customer->id,
            'dealer_id' => $this->dealer->id,
            'status' => 'return_request_raised',
            'reason' => 'Changed mind after 30 days',
            'raised_at' => now(),
        ]);

        $rejectResponse = $this->actingAs($this->dealer)->post(route('dealer.return_requests.reject', $returnRequest->id), [
            'dealer_notes' => 'Return period of 7 days has expired.',
        ]);

        $rejectResponse->assertSessionHas('success');

        $returnRequest->refresh();
        $this->assertEquals('return_request_rejected', $returnRequest->status);
        $this->assertEquals('Return period of 7 days has expired.', $returnRequest->dealer_notes);
        $this->assertNotNull($returnRequest->rejected_at);

        // Order remains completed
        $order->refresh();
        $this->assertEquals('completed', $order->order_status);
    }
}

