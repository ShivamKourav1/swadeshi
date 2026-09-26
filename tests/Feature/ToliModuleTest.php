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

    public function test_toli_page_renders_with_hierarchy_units(): void
    {
        $url = "/{$this->kshetra->id}/{$this->vibhag->id}/{$this->jila->id}/{$this->nagar->id}/{$this->shakha->id}";

        $response = $this->actingAs($this->toliMember)->get($url);
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Toli/Index')
                ->where('unit.name', 'Keshav Shakha')
                ->where('unit.level', 'shakha')
                ->where('unit.new_ganvesh', 10)
        );
    }

    public function test_toli_login_and_symmetric_encryption_passcode(): void
    {
        $response = $this->postJson('/toli/login', [
            'login' => '9876543210',
            'password' => 'secret123',
        ]);

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
        $passcode = $response->json('passcode');
        $this->assertNotEmpty($passcode);

        // Auto-login using generated token
        $this->post('/logout'); // Log out first
        $this->assertGuest();

        $autoResponse = $this->postJson('/toli/auto-login', ['passcode' => $passcode]);
        $autoResponse->assertStatus(200);
        $autoResponse->assertJson(['success' => true]);
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
            'shakha_id' => $this->shakha->id,
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
        $orderData = [
            'product_id' => $this->product->id,
            'quantity' => 2,
            'payment_status' => 'paid',
            'notes' => 'सुरेश जी के लिए 2 टोपियां',
            'shakha_id' => $this->shakha->id,
            'nagar_id' => $this->nagar->id,
            'jila_id' => $this->jila->id,
            'vibhag_id' => $this->vibhag->id,
        ];

        $response = $this->actingAs($this->toliMember)->postJson('/toli/orders', $orderData);
        $response->assertStatus(200);
        $response->assertJson(['success' => true]);

        $this->assertDatabaseHas('orders', [
            'is_toli_order' => true,
            'customer_id' => $this->toliMember->id,
            'delivery_location_id' => null,
            'shakha_id' => $this->shakha->id,
            'nagar_id' => $this->nagar->id,
            'order_status' => 'paid',
            'total_amount' => 160.00,
        ]);

        // Product stock decremented
        $this->product->refresh();
        $this->assertEquals(48, $this->product->stock);
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
