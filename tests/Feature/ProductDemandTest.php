<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\DeliveryLocation;
use App\Models\Jila;
use App\Models\Kshetra;
use App\Models\Nagar;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Prant;
use App\Models\Product;
use App\Models\ProductDemand;
use App\Models\ReturnRequest;
use App\Models\Shakha;
use App\Models\Swayamsevak;
use App\Models\User;
use App\Models\Vibhag;
use App\Services\ToliEncryptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductDemandTest extends TestCase
{
    use RefreshDatabase;

    private User $dealer;
    private User $customer;
    private Category $category;
    private Product $outOfStockProduct;
    private Product $inStockProduct;
    private Shakha $shakha;
    private Swayamsevak $swayamsevak;

    protected function setUp(): void
    {
        parent::setUp();

        $this->dealer = User::factory()->create(['role' => 'dealer']);
        $this->customer = User::factory()->create(['role' => 'customer']);
        $this->category = Category::create(['name' => 'Ganvesh', 'slug' => 'ganvesh', 'is_active' => true]);

        $kshetra = Kshetra::create(['kshetra_name' => 'उत्तर क्षेत्र']);
        $prant = Prant::create(['kshetra_id' => $kshetra->id, 'prant_name' => 'दिल्ली प्रांत']);
        $vibhag = Vibhag::create(['prant_id' => $prant->id, 'vibhag_name' => 'मध्य विभाग']);
        $jila = Jila::create(['vibhag_id' => $vibhag->id, 'jila_name' => 'चांदनी चौक']);
        $nagar = Nagar::create(['jila_id' => $jila->id, 'nagar_name' => 'कश्मीरी गेट']);
        $this->shakha = Shakha::create([
            'nagar_id' => $nagar->id,
            'shakha_name' => 'प्रभात शाखा',
            'aayu_varg' => 'Vyavsai',
            'type' => 'dainik',
            'status' => 'Active',
        ]);

        $this->swayamsevak = Swayamsevak::create([
            'name' => 'रमेश शर्मा',
            'mobile' => '9876543210',
            'shakha_id' => $this->shakha->id,
            'ganvesh' => false,
        ]);

        $this->outOfStockProduct = Product::create([
            'dealer_id' => $this->dealer->id,
            'category_id' => $this->category->id,
            'name' => 'सफेद कमीज ३८ (White Shirt 38)',
            'slug' => 'white-shirt-38',
            'sku' => 'SHK-SHIRT-38',
            'price' => 350.00,
            'stock' => 0,
            'status' => 'active',
        ]);

        $this->inStockProduct = Product::create([
            'dealer_id' => $this->dealer->id,
            'category_id' => $this->category->id,
            'name' => 'काली टोपी (Black Cap)',
            'slug' => 'black-cap',
            'sku' => 'SHK-CAP-01',
            'price' => 80.00,
            'stock' => 15,
            'status' => 'active',
        ]);
    }

    public function test_customer_can_create_demand_for_out_of_stock_product(): void
    {
        $response = $this->actingAs($this->customer)->post(route('demands.store'), [
            'product_id' => $this->outOfStockProduct->id,
            'quantity' => 3,
            'swayamsevak_id' => $this->swayamsevak->id,
            'notes' => 'तत्काल आवश्यकता है',
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('product_demands', [
            'product_id' => $this->outOfStockProduct->id,
            'customer_id' => $this->customer->id,
            'swayamsevak_id' => $this->swayamsevak->id,
            'quantity' => 3,
            'original_quantity' => 3,
            'status' => 'pending',
            'notes' => 'तत्काल आवश्यकता है',
        ]);
    }

    public function test_demand_cannot_be_created_for_in_stock_product(): void
    {
        // When stock is > 0, demand form must not allow creating demand
        $response = $this->actingAs($this->customer)->post(route('demands.store'), [
            'product_id' => $this->inStockProduct->id,
            'quantity' => 2,
        ]);

        $response->assertSessionHas('error');
        $this->assertDatabaseMissing('product_demands', [
            'product_id' => $this->inStockProduct->id,
            'customer_id' => $this->customer->id,
        ]);
    }

    public function test_toli_demand_creation_records_demand_for_zero_stock_product(): void
    {
        $response = $this->actingAs($this->customer)->postJson(route('toli.demands.store'), [
            'product_id' => $this->outOfStockProduct->id,
            'quantity' => 5,
            'swayamsevak_id' => $this->swayamsevak->id,
            'notes' => 'शाखा विस्तार हेतु',
        ]);

        $response->assertOk();
        $response->assertJson(['success' => true]);

        $this->assertDatabaseHas('product_demands', [
            'product_id' => $this->outOfStockProduct->id,
            'customer_id' => $this->customer->id,
            'quantity' => 5,
            'original_quantity' => 5,
            'swayamsevak_id' => $this->swayamsevak->id,
        ]);
    }

    public function test_toli_demand_rejected_if_product_in_stock(): void
    {
        $response = $this->actingAs($this->customer)->postJson(route('toli.demands.store'), [
            'product_id' => $this->inStockProduct->id,
            'quantity' => 2,
        ]);

        $response->assertStatus(422);
        $response->assertJson(['success' => false]);
    }

    public function test_dealer_can_view_demands_for_zero_stock_products(): void
    {
        ProductDemand::create([
            'product_id' => $this->outOfStockProduct->id,
            'customer_id' => $this->customer->id,
            'swayamsevak_id' => $this->swayamsevak->id,
            'quantity' => 4,
            'original_quantity' => 4,
            'status' => 'pending',
            'notes' => 'आगामी उत्सव हेतु',
        ]);

        $response = $this->actingAs($this->dealer)->get(route('dealer.demands.index'));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Dealer/Demands')
            ->has('products.data', 1)
            ->where('summary.zero_stock_products_count', 1)
            ->where('summary.total_pending_demand_units', 4)
        );
    }

    public function test_customer_cannot_view_dealer_demands_page(): void
    {
        $response = $this->actingAs($this->customer)->get(route('dealer.demands.index'));
        $response->assertStatus(403);
    }

    public function test_stock_increase_reduces_demand_numbers_fifo_not_below_zero(): void
    {
        $cust2 = User::factory()->create(['role' => 'customer']);

        // Customer 1 requests 4
        $demand1 = ProductDemand::create([
            'product_id' => $this->outOfStockProduct->id,
            'customer_id' => $this->customer->id,
            'quantity' => 4,
            'original_quantity' => 4,
            'status' => 'pending',
        ]);

        // Customer 2 requests 3
        $demand2 = ProductDemand::create([
            'product_id' => $this->outOfStockProduct->id,
            'customer_id' => $cust2->id,
            'quantity' => 3,
            'original_quantity' => 3,
            'status' => 'pending',
        ]);

        // Dealer restocks 5 units
        $this->outOfStockProduct->restock(5);

        // Demand 1 (was 4) should be fully satisfied (quantity = 0, fulfilled)
        // Demand 2 (was 3) should be reduced by 1 (quantity = 2)
        $this->assertEquals(0, $demand1->fresh()->quantity);
        $this->assertEquals('fulfilled', $demand1->fresh()->status);
        $this->assertEquals(2, $demand2->fresh()->quantity);

        // Restock another 5 units (exceeding remaining demand of 2)
        $this->outOfStockProduct->restock(5);

        // Demand 2 should now be 0, not below 0
        $this->assertEquals(0, $demand2->fresh()->quantity);
        $this->assertEquals('fulfilled', $demand2->fresh()->status);
    }

    public function test_dealer_quick_restock_endpoint_increments_stock_and_reduces_demand(): void
    {
        $demand = ProductDemand::create([
            'product_id' => $this->outOfStockProduct->id,
            'customer_id' => $this->customer->id,
            'quantity' => 6,
            'original_quantity' => 6,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->dealer)->post(
            route('dealer.demands.quick_restock', $this->outOfStockProduct->id),
            ['added_stock' => 4]
        );

        $response->assertSessionHas('success');
        $this->assertEquals(4, $this->outOfStockProduct->fresh()->stock);
        $this->assertEquals(2, $demand->fresh()->quantity);
    }

    public function test_dealer_updating_product_stock_reduces_demand_via_saved_hook(): void
    {
        $demand = ProductDemand::create([
            'product_id' => $this->outOfStockProduct->id,
            'customer_id' => $this->customer->id,
            'quantity' => 5,
            'original_quantity' => 5,
            'status' => 'pending',
        ]);

        // Dealer edits product stock from 0 to 3
        $response = $this->actingAs($this->dealer)->put(
            route('dealer.products.update', $this->outOfStockProduct->id),
            [
                'name' => $this->outOfStockProduct->name,
                'category_id' => $this->category->id,
                'price' => $this->outOfStockProduct->price,
                'stock' => 3,
                'sku' => $this->outOfStockProduct->sku,
                'status' => 'active',
            ]
        );

        $response->assertRedirect(route('dealer.products.index'));
        $this->assertEquals(3, $this->outOfStockProduct->fresh()->stock);
        $this->assertEquals(2, $demand->fresh()->quantity);
    }

    public function test_order_cancellation_before_dispatch_reduces_demand_on_restock(): void
    {
        $demand = ProductDemand::create([
            'product_id' => $this->outOfStockProduct->id,
            'customer_id' => $this->customer->id,
            'quantity' => 5,
            'original_quantity' => 5,
            'status' => 'pending',
        ]);

        $loc = DeliveryLocation::create([
            'user_id' => $this->customer->id,
            'recipient_name' => 'रमेश ग्राहक',
            'phone' => '9876543210',
            'address_line_1' => 'Main Road',
            'city' => 'Delhi',
            'state' => 'Delhi',
            'postal_code' => '110001',
            'shakha_id' => $this->shakha->id,
        ]);

        $order = Order::create([
            'order_number' => 'ORD-TEST-001',
            'customer_id' => $this->customer->id,
            'delivery_location_id' => $loc->id,
            'subtotal' => 350.00,
            'delivery_fee' => 10.00,
            'total_amount' => 360.00,
            'payment_method' => 'cod',
            'payment_status' => 'pending',
            'delivery_status' => 'placed',
            'order_status' => 'placed',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->outOfStockProduct->id,
            'dealer_id' => $this->dealer->id,
            'product_name' => $this->outOfStockProduct->name,
            'unit_price' => 350.00,
            'quantity' => 3,
            'subtotal' => 1050.00,
        ]);

        // Cancel order before dispatch (items still at dealer)
        $response = $this->actingAs($this->customer)->post(route('orders.cancel', $order->id), [
            'reason' => 'Changed my mind',
        ]);

        $response->assertSessionHas('success');
        $this->assertEquals(3, $this->outOfStockProduct->fresh()->stock);
        // Demand reduced by 3 (from 5 to 2)
        $this->assertEquals(2, $demand->fresh()->quantity);
    }

    public function test_dealer_confirm_restock_reduces_demand_on_restock(): void
    {
        $demand = ProductDemand::create([
            'product_id' => $this->outOfStockProduct->id,
            'customer_id' => $this->customer->id,
            'quantity' => 4,
            'original_quantity' => 4,
            'status' => 'pending',
        ]);

        $loc = DeliveryLocation::create([
            'user_id' => $this->customer->id,
            'recipient_name' => 'रमेश ग्राहक',
            'phone' => '9876543210',
            'address_line_1' => 'Main Road',
            'city' => 'Delhi',
            'state' => 'Delhi',
            'postal_code' => '110001',
            'shakha_id' => $this->shakha->id,
        ]);

        $order = Order::create([
            'order_number' => 'ORD-TEST-002',
            'customer_id' => $this->customer->id,
            'delivery_location_id' => $loc->id,
            'subtotal' => 350.00,
            'delivery_fee' => 10.00,
            'total_amount' => 360.00,
            'payment_method' => 'cod',
            'payment_status' => 'pending',
            'delivery_status' => 'cancelled',
            'order_status' => 'cancelled',
            'cancellation_stage' => 'after_dispatch',
            'restocked' => false,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->outOfStockProduct->id,
            'dealer_id' => $this->dealer->id,
            'product_name' => $this->outOfStockProduct->name,
            'unit_price' => 350.00,
            'quantity' => 2,
            'subtotal' => 700.00,
        ]);

        $response = $this->actingAs($this->dealer)->post(route('dealer.orders.confirm_restock', $order->id));
        $response->assertSessionHas('success');

        $this->assertEquals(2, $this->outOfStockProduct->fresh()->stock);
        // Demand reduced by 2 (from 4 to 2)
        $this->assertEquals(2, $demand->fresh()->quantity);
    }

    public function test_return_request_fulfillment_reduces_demand_on_restock(): void
    {
        $demand = ProductDemand::create([
            'product_id' => $this->outOfStockProduct->id,
            'customer_id' => $this->customer->id,
            'quantity' => 3,
            'original_quantity' => 3,
            'status' => 'pending',
        ]);

        $loc = DeliveryLocation::create([
            'user_id' => $this->customer->id,
            'recipient_name' => 'रमेश ग्राहक',
            'phone' => '9876543210',
            'address_line_1' => 'Main Road',
            'city' => 'Delhi',
            'state' => 'Delhi',
            'postal_code' => '110001',
            'shakha_id' => $this->shakha->id,
        ]);

        $order = Order::create([
            'order_number' => 'ORD-TEST-003',
            'customer_id' => $this->customer->id,
            'delivery_location_id' => $loc->id,
            'subtotal' => 350.00,
            'delivery_fee' => 10.00,
            'total_amount' => 360.00,
            'payment_method' => 'cod',
            'payment_status' => 'paid',
            'delivery_status' => 'delivered',
            'order_status' => 'completed',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->outOfStockProduct->id,
            'dealer_id' => $this->dealer->id,
            'product_name' => $this->outOfStockProduct->name,
            'unit_price' => 350.00,
            'quantity' => 1,
            'subtotal' => 350.00,
        ]);

        $returnRequest = ReturnRequest::create([
            'order_id' => $order->id,
            'customer_id' => $this->customer->id,
            'dealer_id' => $this->dealer->id,
            'status' => 'return_request_accepted',
            'reason' => 'Wrong size',
            'raised_at' => now(),
            'accepted_at' => now(),
        ]);

        $response = $this->actingAs($this->dealer)->post(route('dealer.return_requests.fulfill', $returnRequest->id));
        $response->assertSessionHas('success');

        $this->assertEquals(1, $this->outOfStockProduct->fresh()->stock);
        // Demand reduced by 1 (from 3 to 2)
        $this->assertEquals(2, $demand->fresh()->quantity);
    }

    public function test_toli_order_cancellation_reduces_demand_on_restock(): void
    {
        $demand = ProductDemand::create([
            'product_id' => $this->outOfStockProduct->id,
            'customer_id' => $this->customer->id,
            'quantity' => 4,
            'original_quantity' => 4,
            'status' => 'pending',
        ]);

        $order = Order::create([
            'order_number' => 'ORD-TOLI-001',
            'customer_id' => $this->customer->id,
            'delivery_location_id' => null,
            'subtotal' => 700.00,
            'delivery_fee' => 0.00,
            'total_amount' => 700.00,
            'payment_method' => 'cod',
            'payment_status' => 'placed',
            'delivery_status' => 'placed',
            'order_status' => 'placed',
            'is_toli_order' => true,
            'toli_shakha_id' => $this->shakha->id,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->outOfStockProduct->id,
            'dealer_id' => $this->dealer->id,
            'product_name' => $this->outOfStockProduct->name,
            'unit_price' => 350.00,
            'quantity' => 2,
            'subtotal' => 700.00,
        ]);

        $response = $this->actingAs($this->customer)->post(route('toli.orders.cancel', $order->id), [
            'reason' => 'टोली द्वारा रद्द',
        ]);

        $response->assertSessionHas('success');
        $this->assertEquals(2, $this->outOfStockProduct->fresh()->stock);
        // Demand reduced by 2 (from 4 to 2)
        $this->assertEquals(2, $demand->fresh()->quantity);
    }

    public function test_api_swayamsevaks_returns_shakha_members(): void
    {
        $response = $this->actingAs($this->customer)->getJson(route('api.swayamsevaks', [
            'shakha_id' => $this->shakha->id,
        ]));

        $response->assertOk();
        $response->assertJsonFragment(['name' => 'रमेश शर्मा']);
    }
}
