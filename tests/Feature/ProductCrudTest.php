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

    public function test_product_search_is_case_insensitive(): void
    {
        $dealer = User::factory()->create(['role' => 'dealer']);
        $category = Category::create(['name' => 'Ganvesh', 'slug' => 'ganvesh']);

        Product::create([
            'dealer_id' => $dealer->id,
            'category_id' => $category->id,
            'name' => 'Shakha Dhwaj Flag Large',
            'slug' => 'shakha-dhwaj-flag-large',
            'sku' => 'FLG-LRG-01',
            'price' => 150.00,
            'stock' => 50,
            'status' => 'active',
            'description' => 'Saffron flag for outdoor gatherings',
        ]);

        // Search with lowercase 'dhwaj'
        $responseLower = $this->get('/?search=dhwaj');
        $responseLower->assertStatus(200);
        $responseLower->assertSee('Shakha Dhwaj Flag Large');

        // Search with uppercase 'DHWAJ'
        $responseUpper = $this->get('/?search=DHWAJ');
        $responseUpper->assertStatus(200);
        $responseUpper->assertSee('Shakha Dhwaj Flag Large');

        // Search with mixed case 'sHaKhA'
        $responseMixed = $this->get('/?search=sHaKhA');
        $responseMixed->assertStatus(200);
        $responseMixed->assertSee('Shakha Dhwaj Flag Large');

        // Search SKU with lowercase 'flg-lrg'
        $responseSku = $this->get('/?search=flg-lrg');
        $responseSku->assertStatus(200);
        $responseSku->assertSee('Shakha Dhwaj Flag Large');
    }

    public function test_storefront_can_filter_products_by_organizational_unit_nagar(): void
    {
        $category = Category::create(['name' => 'Uniform', 'slug' => 'uniform']);

        $kshetra = \App\Models\Kshetra::create(['kshetra_name' => 'Madhya Kshetra']);
        $prant = \App\Models\Prant::create(['prant_name' => 'Madhya Bharat', 'kshetra_id' => $kshetra->id]);
        $vibhag = \App\Models\Vibhag::create(['vibhag_name' => 'Bhopal', 'prant_id' => $prant->id]);
        $jila = \App\Models\Jila::create(['jila_name' => 'Badrinath', 'vibhag_id' => $vibhag->id]);
        $nagar1 = \App\Models\Nagar::create(['nagar_name' => 'Madhav', 'jila_id' => $jila->id]);
        $nagar2 = \App\Models\Nagar::create(['nagar_name' => 'Sant Kabir', 'jila_id' => $jila->id]);

        $dealer1 = User::factory()->create(['role' => 'dealer']);
        \App\Models\UserProfile::create([
            'user_id' => $dealer1->id,
            'nagar_id' => $nagar1->id,
            'is_nagar_toli_member' => true,
        ]);

        $dealer2 = User::factory()->create(['role' => 'dealer']);
        \App\Models\UserProfile::create([
            'user_id' => $dealer2->id,
            'nagar_id' => $nagar2->id,
            'is_nagar_toli_member' => true,
        ]);

        $product1 = Product::create([
            'dealer_id' => $dealer1->id,
            'category_id' => $category->id,
            'name' => 'Madhav Special Ganvesh',
            'slug' => 'madhav-special-ganvesh',
            'sku' => 'MDH-001',
            'price' => 100.00,
            'stock' => 10,
            'status' => 'active',
        ]);

        $product2 = Product::create([
            'dealer_id' => $dealer2->id,
            'category_id' => $category->id,
            'name' => 'Kabir Special Ganvesh',
            'slug' => 'kabir-special-ganvesh',
            'sku' => 'KBR-001',
            'price' => 110.00,
            'stock' => 10,
            'status' => 'active',
        ]);

        // 1. Filter by Madhav Nagar ID
        $response = $this->get('/?org_unit_type=nagar&org_unit_id=' . $nagar1->id);
        $response->assertStatus(200);
        $response->assertSee('Madhav Special Ganvesh');
        $response->assertDontSee('Kabir Special Ganvesh');

        // 2. Filter by search term 'Madhav Nagar'
        $searchResponse = $this->get('/?org_unit_search=Madhav+Nagar');
        $searchResponse->assertStatus(200);
        $searchResponse->assertSee('Madhav Special Ganvesh');
        $searchResponse->assertDontSee('Kabir Special Ganvesh');

        // 3. Filter by Jila ID (both belong to Badrinath Jila)
        $jilaResponse = $this->get('/?org_unit_type=jila&org_unit_id=' . $jila->id);
        $jilaResponse->assertStatus(200);
        $jilaResponse->assertSee('Madhav Special Ganvesh');
        $jilaResponse->assertSee('Kabir Special Ganvesh');
    }

    public function test_storefront_can_filter_karyakarta_dealers_only(): void
    {
        $category = Category::create(['name' => 'Books', 'slug' => 'books']);

        $karyakartaRole = \App\Models\Role::firstOrCreate(['name' => 'karyakarta'], ['display_name' => 'Karyakarta']);
        $dealerRole = \App\Models\Role::firstOrCreate(['name' => 'dealer'], ['display_name' => 'Dealer']);

        // Dual role dealer (Dealer + Karyakarta)
        $karyaDealer = User::factory()->create(['role' => 'karyakarta']);
        $karyaDealer->roles()->attach([$dealerRole->id, $karyakartaRole->id]);

        // Regular dealer
        $regularDealer = User::factory()->create(['role' => 'dealer']);
        $regularDealer->roles()->attach([$dealerRole->id]);

        Product::create([
            'dealer_id' => $karyaDealer->id,
            'category_id' => $category->id,
            'name' => 'Karyakarta Bodh Book',
            'slug' => 'karyakarta-bodh-book',
            'sku' => 'BODH-01',
            'price' => 50.00,
            'stock' => 15,
            'status' => 'active',
        ]);

        Product::create([
            'dealer_id' => $regularDealer->id,
            'category_id' => $category->id,
            'name' => 'Commercial Novel',
            'slug' => 'commercial-novel',
            'sku' => 'NOVEL-01',
            'price' => 99.00,
            'stock' => 10,
            'status' => 'active',
        ]);

        // Filter only karyakarta
        $response = $this->get('/?only_karyakarta=1');
        $response->assertStatus(200);
        $response->assertSee('Karyakarta Bodh Book');
        $response->assertDontSee('Commercial Novel');
    }
}
