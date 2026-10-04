<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Jila;
use App\Models\Kshetra;
use App\Models\Nagar;
use App\Models\Order;
use App\Models\Prant;
use App\Models\Product;
use App\Models\Shakha;
use App\Models\Swayamsevak;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\Vibhag;
use App\Services\ToliEncryptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class ToliModuleTest extends TestCase
{
    use RefreshDatabase;

    private User $toliMember;
    private Kshetra $kshetra;
    private Prant $prant;
    private Vibhag $vibhag;
    private Jila $jila;
    private Nagar $nagar;
    private Shakha $shakha;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->toliMember = User::factory()->create([
            'role' => 'karyakarta',
            'phone' => '9876543210',
            'password' => bcrypt('secret123'),
            'status' => 'active',
        ]);

        $this->kshetra = Kshetra::create(['kshetra_name' => 'Madhya Kshetra']);
        $this->prant = Prant::create(['kshetra_id' => $this->kshetra->id, 'prant_name' => 'Malwa Prant']);
        $this->vibhag = Vibhag::create(['prant_id' => $this->prant->id, 'vibhag_name' => 'Indore Vibhag']);
        $this->jila = Jila::create(['vibhag_id' => $this->vibhag->id, 'jila_name' => 'Badrinath Jila']);
        $this->nagar = Nagar::create(['jila_id' => $this->jila->id, 'nagar_name' => 'Madhav Nagar']);
        $this->shakha = Shakha::create([
            'nagar_id' => $this->nagar->id,
            'shakha_name' => 'Keshav Shakha',
            'aayu_varg' => 'Vyavsai',
            'type' => 'dainik',
            'status' => 'Active',
            'new_ganvesh' => 10,
        ]);

        UserProfile::create([
            'user_id' => $this->toliMember->id,
            'shakha_id' => $this->shakha->id,
            'is_shakha_toli_member' => true,
        ]);

        $dealer = User::factory()->create(['role' => 'dealer']);
        $category = Category::create(['name' => 'गणवेश', 'slug' => 'ganvesh']);
        $this->product = Product::create([
            'dealer_id' => $dealer->id,
            'category_id' => $category->id,
            'name' => 'संघ टोपी (Topi)',
            'slug' => 'sangh-topi',
            'sku' => 'SKU-TOPI-01',
            'price' => 80.00,
            'stock' => 50,
            'status' => 'active',
        ]);
    }

    public function test_toli_page_renders_with_hierarchy_units_using_encrypted_url(): void
    {
        $encryptedUrl = ToliEncryptionService::buildToliUrl(
            $this->kshetra->id,
            $this->vibhag->id,
            $this->jila->id,
            $this->nagar->id,
            $this->shakha->id
        );

        $response = $this->actingAs($this->toliMember)->get($encryptedUrl);
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Toli/Index')
                ->where('unit.name', 'Keshav Shakha')
                ->where('unit.level', 'basti')
                ->where('unit.new_ganvesh', 10)
        );
    }

    public function test_toli_page_redirects_unencrypted_numeric_urls_to_encrypted_urls(): void
    {
        $numericUrl = "/{$this->kshetra->id}/{$this->vibhag->id}/{$this->jila->id}/{$this->nagar->id}/{$this->shakha->id}";
        $expectedEncryptedUrl = ToliEncryptionService::buildToliUrl(
            $this->kshetra->id,
            $this->vibhag->id,
            $this->jila->id,
            $this->nagar->id,
            $this->shakha->id
        );

        $response = $this->actingAs($this->toliMember)->get($numericUrl);
        $response->assertRedirect($expectedEncryptedUrl);
    }

    public function test_toli_page_renders_jila_level_with_encrypted_url(): void
    {
        $jilaEncryptedUrl = ToliEncryptionService::buildToliUrl(
            $this->kshetra->id,
            $this->vibhag->id,
            $this->jila->id
        );

        $response = $this->actingAs($this->toliMember)->get($jilaEncryptedUrl);
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Toli/Index')
                ->where('unit.name', 'Badrinath Jila')
                ->where('unit.level', 'jila')
        );
    }

    public function test_toli_page_renders_nagar_level_with_encrypted_url(): void
    {
        $nagarEncryptedUrl = ToliEncryptionService::buildToliUrl(
            $this->kshetra->id,
            $this->vibhag->id,
            $this->jila->id,
            $this->nagar->id
        );

        $response = $this->actingAs($this->toliMember)->get($nagarEncryptedUrl);
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Toli/Index')
                ->where('unit.name', 'Madhav Nagar')
                ->where('unit.level', 'nagar')
        );
    }

    public function test_toli_page_aborts_on_invalid_or_tampered_encrypted_id(): void
    {
        $tamperedUrl = "/invalid-token-12345/{$this->vibhag->id}/{$this->jila->id}";
        $response = $this->actingAs($this->toliMember)->get($tamperedUrl);
        $response->assertStatus(404);
    }

    public function test_karyakarta_dashboard_provides_toli_navigation_option_when_scope_is_assigned(): void
    {
        $karyakartaWithScope = User::factory()->create([
            'role' => 'karyakarta',
            'status' => 'active',
        ]);
        UserProfile::create([
            'user_id' => $karyakartaWithScope->id,
            'shakha_id' => $this->shakha->id,
        ]);

        $this->assertNotNull($karyakartaWithScope->getToliUrl());

        $response = $this->actingAs($karyakartaWithScope)->get(route('karyakarta.dashboard'));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Karyakarta/Dashboard')
                ->where('toli_url', $karyakartaWithScope->getToliUrl())
        );
    }

    public function test_karyakarta_dashboard_hides_toli_navigation_option_when_no_scope_is_assigned(): void
    {
        $karyakartaNoScope = User::factory()->create([
            'role' => 'karyakarta',
            'status' => 'active',
        ]);
        UserProfile::create([
            'user_id' => $karyakartaNoScope->id,
            // No shakha_id, nagar_id, jila_id, vibhag_id, prant_id, kshetra_id
        ]);

        $this->assertNull($karyakartaNoScope->getToliUrl());

        $response = $this->actingAs($karyakartaNoScope)->get(route('karyakarta.dashboard'));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Karyakarta/Dashboard')
                ->where('toli_url', null)
        );
    }

    public function test_toli_credential_login(): void
    {
        $response = $this->postJson('/toli/login', [
            'login' => '9876543210',
            'password' => 'secret123',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'user' => [
                'id' => $this->toliMember->id,
                'phone' => '9876543210',
            ],
        ]);
        $this->assertAuthenticatedAs($this->toliMember);
    }

    public function test_swayamsevak_crud_operations(): void
    {
        // 1. Create Swayamsevak
        $storeResponse = $this->actingAs($this->toliMember)->post('/toli/members', [
            'name' => 'रमेश कुमार',
            'mobile' => '9876500001',
            'address' => 'शिवाजी नगर',
            'shakha_id' => $this->shakha->id,
            'ganvesh' => true,
            'shikshan' => 'प्राथमिक',
        ]);

        $storeResponse->assertRedirect();
        $this->assertDatabaseHas('swayamsevaks', [
            'name' => 'रमेश कुमार',
            'mobile' => '9876500001',
            'basti_id' => $this->shakha->id,
            'ganvesh' => true,
        ]);

        $swayamsevak = Swayamsevak::where('name', 'रमेश कुमार')->first();

        // 2. Update Swayamsevak
        $updateResponse = $this->actingAs($this->toliMember)->put("/toli/members/{$swayamsevak->id}", [
            'name' => 'रमेश कुमार गुप्त',
            'mobile' => '9876500002',
            'address' => 'गांधी चौक',
            'shakha_id' => $this->shakha->id,
            'ganvesh' => false,
            'shikshan' => 'संघ शिक्षा वर्ग',
        ]);

        $updateResponse->assertRedirect();
        $this->assertDatabaseHas('swayamsevaks', [
            'id' => $swayamsevak->id,
            'name' => 'रमेश कुमार गुप्त',
            'ganvesh' => false,
        ]);

        // 3. Delete Swayamsevak
        $deleteResponse = $this->actingAs($this->toliMember)->delete("/toli/members/{$swayamsevak->id}");
        $deleteResponse->assertRedirect();
        $this->assertDatabaseMissing('swayamsevaks', ['id' => $swayamsevak->id]);
    }

    public function test_csv_bulk_import_and_download_template(): void
    {
        // Template download
        $templateResponse = $this->get('/toli/members/template');
        $templateResponse->assertStatus(200);
        $templateResponse->assertHeader('Content-Type', 'text/csv; charset=UTF-8');

        // CSV Import
        $csvContent = "name,mobile,address,ganvesh,shikshan\nसुरेश जी,9111222333,स्टेशन रोड,हाँ,प्राथमिक\nदिनेश जी,9444555666,मंदिर मार्ग,नहीं,प्रारंभिक";
        $file = UploadedFile::fake()->createWithContent('members.csv', $csvContent);

        $importResponse = $this->actingAs($this->toliMember)->post('/toli/members/import', [
            'file' => $file,
            'shakha_id' => $this->shakha->id,
        ]);

        $importResponse->assertRedirect();
        $this->assertDatabaseHas('swayamsevaks', [
            'name' => 'सुरेश जी',
            'mobile' => '9111222333',
            'ganvesh' => true,
        ]);
        $this->assertDatabaseHas('swayamsevaks', [
            'name' => 'दिनेश जी',
            'ganvesh' => false,
        ]);
    }

    public function test_update_new_ganvesh_figure_on_shakha(): void
    {
        $response = $this->actingAs($this->toliMember)->post("/toli/shakhas/{$this->shakha->id}/new-ganvesh", [
            'new_ganvesh' => 25,
        ]);

        $response->assertRedirect();
        $this->shakha->refresh();
        $this->assertEquals(25, $this->shakha->new_ganvesh);
    }

    public function test_place_toli_order_skips_delivery_address_and_auto_tags_unit(): void
    {
        $member = Swayamsevak::create([
            'name' => 'राकेश शर्मा',
            'mobile' => '9876500099',
            'shakha_id' => $this->shakha->id,
            'ganvesh' => false,
        ]);

        $orderData = [
            'product_id' => $this->product->id,
            'quantity' => 2,
            'payment_status' => 'paid',
            'notes' => 'राकेश जी के लिए 2 टोपियां',
            'swayamsevak_id' => $member->id,
            'shakha_id' => $this->shakha->id,
            'nagar_id' => $this->nagar->id,
            'jila_id' => $this->jila->id,
            'vibhag_id' => $this->vibhag->id,
        ];

        $response = $this->actingAs($this->toliMember)->postJson('/toli/orders', $orderData);
        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'order' => [
                'swayamsevak_id' => $member->id,
            ],
        ]);

        $this->assertDatabaseHas('orders', [
            'is_toli_order' => true,
            'customer_id' => $this->toliMember->id,
            'swayamsevak_id' => $member->id,
            'delivery_location_id' => null,
            'basti_id' => $this->shakha->id,
            'nagar_id' => $this->nagar->id,
            'order_status' => 'paid',
            'total_amount' => 160.00,
        ]);

        // Product stock decremented
        $this->product->refresh();
        $this->assertEquals(48, $this->product->stock);
    }

    public function test_intended_swayamsevak_is_displayed_in_order_view_and_toli_page(): void
    {
        $member = Swayamsevak::create([
            'name' => 'गोपाल वर्मा',
            'mobile' => '9988776655',
            'shakha_id' => $this->shakha->id,
            'ganvesh' => false,
        ]);

        $order = Order::create([
            'order_number' => Order::generateOrderNumber(),
            'customer_id' => $this->toliMember->id,
            'swayamsevak_id' => $member->id,
            'delivery_location_id' => null,
            'subtotal' => 80.00,
            'delivery_fee' => 0.00,
            'total_amount' => 80.00,
            'order_status' => 'paid',
            'payment_status' => 'paid',
            'is_toli_order' => true,
            'shakha_id' => $this->shakha->id,
        ]);

        // Main app show route
        $showResponse = $this->actingAs($this->toliMember)->get(route('orders.show', $order->id));
        $showResponse->assertStatus(200);
        $showResponse->assertInertia(fn ($page) =>
            $page->component('Orders/Show')
                ->where('order.swayamsevak.name', 'गोपाल वर्मा')
        );

        // Toli page
        $toliUrl = ToliEncryptionService::buildToliUrl($this->kshetra->id, $this->vibhag->id, $this->jila->id, $this->nagar->id, $this->shakha->id);
        $toliResponse = $this->actingAs($this->toliMember)->get($toliUrl);
        $toliResponse->assertStatus(200);
        $toliResponse->assertInertia(fn ($page) =>
            $page->component('Toli/Index')
                ->where('orders.0.swayamsevak_name', 'गोपाल वर्मा')
        );
    }

    public function test_toli_order_status_update_cancellation_and_return(): void
    {
        // 1. Create order
        $order = Order::create([
            'order_number' => Order::generateOrderNumber(),
            'customer_id' => $this->toliMember->id,
            'delivery_location_id' => null,
            'subtotal' => 80.00,
            'delivery_fee' => 0.00,
            'total_amount' => 80.00,
            'order_status' => 'payment_due',
            'payment_status' => 'pending',
            'is_toli_order' => true,
            'shakha_id' => $this->shakha->id,
        ]);

        // 2. Status update
        $updateResponse = $this->actingAs($this->toliMember)->put("/toli/orders/{$order->id}/status", [
            'status' => 'paid',
        ]);
        $updateResponse->assertRedirect();
        $order->refresh();
        $this->assertEquals('paid', $order->order_status);
        $this->assertEquals('paid', $order->payment_status);

        // 3. Cancellation
        $cancelResponse = $this->actingAs($this->toliMember)->post("/toli/orders/{$order->id}/cancel", [
            'reason' => 'गलत ऑर्डर',
        ]);
        $cancelResponse->assertRedirect();
        $order->refresh();
        $this->assertEquals('cancelled', $order->order_status);
        $this->assertTrue($order->restocked);
    }
}
