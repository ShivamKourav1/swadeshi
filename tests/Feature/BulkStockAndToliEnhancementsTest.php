<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Jila;
use App\Models\Kshetra;
use App\Models\Nagar;
use App\Models\Prant;
use App\Models\Product;
use App\Models\ProductDemand;
use App\Models\Shakha;
use App\Models\Swayamsevak;
use App\Models\User;
use App\Models\Vibhag;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BulkStockAndToliEnhancementsTest extends TestCase
{
    use RefreshDatabase;

    private function createHierarchy(): Shakha
    {
        $kshetra = Kshetra::create(['kshetra_name' => 'उत्तर क्षेत्र']);
        $prant = Prant::create(['kshetra_id' => $kshetra->id, 'prant_name' => 'दिल्ली प्रांत']);
        $vibhag = Vibhag::create(['prant_id' => $prant->id, 'vibhag_name' => 'मध्य विभाग']);
        $jila = Jila::create(['vibhag_id' => $vibhag->id, 'jila_name' => 'चांदनी चौक']);
        $nagar = Nagar::create(['jila_id' => $jila->id, 'nagar_name' => 'कश्मीरी गेट']);
        return Shakha::create([
            'nagar_id' => $nagar->id,
            'shakha_name' => 'प्रभात शाखा',
            'aayu_varg' => 'Vyavsai',
            'type' => 'dainik',
            'status' => 'Active',
        ]);
    }

    public function test_dealer_can_bulk_update_product_stock()
    {
        $dealer = User::factory()->create(['role' => 'dealer']);
        $category = Category::create(['name' => 'Ganvesh', 'slug' => 'ganvesh', 'is_active' => true]);

        $product1 = Product::create([
            'dealer_id' => $dealer->id,
            'category_id' => $category->id,
            'name' => 'सफेद कमीज ३८',
            'slug' => 'white-shirt-38',
            'sku' => 'SKU-001',
            'price' => 350,
            'stock' => 5,
            'status' => 'active',
        ]);

        $product2 = Product::create([
            'dealer_id' => $dealer->id,
            'category_id' => $category->id,
            'name' => 'सफेद कमीज ४०',
            'slug' => 'white-shirt-40',
            'sku' => 'SKU-002',
            'price' => 370,
            'stock' => 10,
            'status' => 'active',
        ]);

        $response = $this->actingAs($dealer)->post(route('dealer.products.bulk_stock'), [
            'updates' => [
                ['id' => $product1->id, 'stock' => 25],
                ['id' => $product2->id, 'stock' => 40],
            ],
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertEquals(25, $product1->fresh()->stock);
        $this->assertEquals(40, $product2->fresh()->stock);
    }

    public function test_bulk_stock_increase_reduces_pending_demands_fifo()
    {
        $dealer = User::factory()->create(['role' => 'dealer']);
        $customer1 = User::factory()->create(['role' => 'customer']);
        $customer2 = User::factory()->create(['role' => 'customer']);

        $category = Category::create(['name' => 'Ganvesh', 'slug' => 'ganvesh', 'is_active' => true]);

        $product = Product::create([
            'dealer_id' => $dealer->id,
            'category_id' => $category->id,
            'name' => 'गणवेश बेल्ट',
            'slug' => 'ganvesh-belt',
            'sku' => 'SKU-BELT',
            'price' => 120,
            'stock' => 0,
            'status' => 'active',
        ]);

        $demand1 = ProductDemand::create([
            'product_id' => $product->id,
            'customer_id' => $customer1->id,
            'quantity' => 10,
            'status' => 'pending',
            'created_at' => now()->subMinutes(10),
        ]);

        $demand2 = ProductDemand::create([
            'product_id' => $product->id,
            'customer_id' => $customer2->id,
            'quantity' => 15,
            'status' => 'pending',
            'created_at' => now()->subMinutes(5),
        ]);

        // Bulk update stock from 0 to 18
        $this->actingAs($dealer)->post(route('dealer.products.bulk_stock'), [
            'updates' => [
                ['id' => $product->id, 'stock' => 18],
            ],
        ]);

        // Demand1 (10 units) should be fully resolved
        $this->assertEquals(0, $demand1->fresh()->quantity);
        $this->assertEquals('fulfilled', $demand1->fresh()->status);

        // Demand2 (15 units) should be reduced by 8 (7 remaining)
        $this->assertEquals(7, $demand2->fresh()->quantity);
        $this->assertEquals('pending', $demand2->fresh()->status);
    }

    public function test_dealer_cannot_bulk_update_other_dealers_products()
    {
        $dealer1 = User::factory()->create(['role' => 'dealer']);
        $dealer2 = User::factory()->create(['role' => 'dealer']);

        $category = Category::create(['name' => 'Ganvesh', 'slug' => 'ganvesh', 'is_active' => true]);

        $productOther = Product::create([
            'dealer_id' => $dealer2->id,
            'category_id' => $category->id,
            'name' => 'काली टोपी',
            'slug' => 'black-cap',
            'sku' => 'SKU-CAP',
            'price' => 80,
            'stock' => 5,
            'status' => 'active',
        ]);

        $this->actingAs($dealer1)->post(route('dealer.products.bulk_stock'), [
            'updates' => [
                ['id' => $productOther->id, 'stock' => 999],
            ],
        ]);

        // Product of dealer2 should remain unchanged
        $this->assertEquals(5, $productOther->fresh()->stock);
    }

    public function test_toli_member_inline_store_returns_json_response()
    {
        $user = User::factory()->create(['role' => 'karyakarta']);
        $shakha = $this->createHierarchy();

        $response = $this->actingAs($user)->postJson(route('toli.members.store'), [
            'name' => 'आलोक शर्मा',
            'mobile' => '9876543210',
            'shakha_id' => $shakha->id,
            'ganvesh' => false,
            'shikshan' => 'प्राथमिक',
        ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'swayamsevak' => [
                'name' => 'आलोक शर्मा',
                'mobile' => '9876543210',
                'shakha_id' => $shakha->id,
                'ganvesh' => false,
                'shikshan' => 'प्राथमिक',
            ],
        ]);

        $this->assertDatabaseHas('swayamsevaks', [
            'name' => 'आलोक शर्मा',
            'mobile' => '9876543210',
            'basti_id' => $shakha->id,
        ]);
    }

    public function test_dealer_demands_index_provides_shareable_products()
    {
        $dealer = User::factory()->create(['role' => 'dealer']);
        $category = Category::create(['name' => 'Ganvesh', 'slug' => 'ganvesh', 'is_active' => true]);

        $outOfStockProduct = Product::create([
            'dealer_id' => $dealer->id,
            'category_id' => $category->id,
            'name' => 'पूर्ण गणवेश सेट 38',
            'slug' => 'full-ganvesh-set-38',
            'sku' => 'SKU-FULL-38',
            'price' => 850,
            'stock' => 0,
            'status' => 'active',
        ]);

        ProductDemand::create([
            'product_id' => $outOfStockProduct->id,
            'customer_id' => $dealer->id,
            'quantity' => 12,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($dealer)->get(route('dealer.demands.index'));
        $response->assertOk();

        $response->assertInertia(fn ($page) =>
            $page->component('Dealer/Demands')
                ->has('shareable_products')
                ->where('shareable_products.0.name', 'पूर्ण गणवेश सेट 38')
                ->where('shareable_products.0.pending_demand_units', 12)
        );
    }

    public function test_dealer_can_export_demands_csv_one_row_per_product()
    {
        $dealer = User::factory()->create(['role' => 'dealer']);
        $category = Category::create(['name' => 'Ganvesh', 'slug' => 'ganvesh', 'is_active' => true]);

        $product1 = Product::create([
            'dealer_id' => $dealer->id,
            'category_id' => $category->id,
            'name' => 'काली टोपी 07',
            'slug' => 'black-cap-07',
            'sku' => 'SKU-CAP-07',
            'price' => 80.00,
            'stock' => 0,
            'status' => 'active',
        ]);

        $product2 = Product::create([
            'dealer_id' => $dealer->id,
            'category_id' => $category->id,
            'name' => 'सफेद कमीज 38',
            'slug' => 'white-shirt-38',
            'sku' => 'SKU-SHIRT-38',
            'price' => 350.00,
            'stock' => 0,
            'status' => 'active',
        ]);

        ProductDemand::create([
            'product_id' => $product1->id,
            'customer_id' => $dealer->id,
            'quantity' => 15,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($dealer)->get(route('dealer.demands.export'));

        $response->assertOk();
        $this->assertEquals('text/csv; charset=UTF-8', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('attachment; filename="demands_zero_stock_', $response->headers->get('Content-Disposition'));

        $content = $response->streamedContent();

        // Check UTF-8 BOM
        $this->assertStringStartsWith("\xEF\xBB\xBF", $content);

        // Header and product row assertions
        $this->assertStringContainsString('उत्पाद का नाम (Product Name)', $content);
        $this->assertStringContainsString('लंबित मांग संख्या (Pending Demand Units)', $content);
        $this->assertStringContainsString('काली टोपी 07', $content);
        $this->assertStringContainsString('SKU-CAP-07', $content);
        $this->assertStringContainsString('15', $content);
        $this->assertStringContainsString('सफेद कमीज 38', $content);
    }

    public function test_customer_cannot_export_dealer_demands_csv()
    {
        $customer = User::factory()->create(['role' => 'customer']);

        $response = $this->actingAs($customer)->get(route('dealer.demands.export'));
        $response->assertForbidden();
    }
}
