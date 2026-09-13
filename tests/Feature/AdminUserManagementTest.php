<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Product;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminUserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_access_user_management_index(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->get(route('admin.users.index'));
        $response->assertStatus(200);
    }

    public function test_admin_can_onboard_new_dealer(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post(route('admin.users.store'), [
            'name' => 'Metro Dealer',
            'email' => 'metro@dealer.com',
            'password' => 'password123',
            'role' => 'dealer',
            'business_name' => 'Metro Tech Superstore',
            'phone' => '+15559090',
        ]);

        $response->assertRedirect(route('admin.users.index'));

        $this->assertDatabaseHas('users', [
            'email' => 'metro@dealer.com',
            'role' => 'dealer',
        ]);

        $this->assertDatabaseHas('user_profiles', [
            'business_name' => 'Metro Tech Superstore',
        ]);
    }

    public function test_admin_can_onboard_new_delivery_partner(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post(route('admin.users.store'), [
            'name' => 'Speedy Rider',
            'email' => 'rider@express.com',
            'password' => 'password123',
            'role' => 'delivery_partner',
            'vehicle_type' => 'Electric Scooter',
            'vehicle_number' => 'ESC-101',
        ]);

        $response->assertRedirect(route('admin.users.index'));

        $this->assertDatabaseHas('users', [
            'email' => 'rider@express.com',
            'role' => 'delivery_partner',
        ]);

        $this->assertDatabaseHas('user_profiles', [
            'vehicle_type' => 'Electric Scooter',
        ]);
    }

    public function test_non_admin_cannot_onboard_users(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);

        $response = $this->actingAs($customer)->post(route('admin.users.store'), [
            'name' => 'Fake Dealer',
            'email' => 'fake@dealer.com',
            'password' => 'password123',
            'role' => 'dealer',
            'business_name' => 'Fake Store',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_download_user_import_template(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->get(route('admin.users.import_template'));

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('Is Shakha Toli Member', $response->streamedContent());
    }

    public function test_admin_can_import_users_via_csv_with_toli_flags_and_phone_password(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $csvData = "name,mobile,Is Shakha Toli Member,Is Nagar Toli Member,Is Jila Toli Member\n" .
                   "Ramesh Kumar,9876543210,Yes,No,No\n" .
                   "Suresh Singh,9123456780,No,Yes,No\n" .
                   "Amit Sharma,9988776655,No,No,Yes\n";

        $file = UploadedFile::fake()->createWithContent('users.csv', $csvData);

        $response = $this->actingAs($admin)->post(route('admin.users.import'), [
            'file' => $file,
        ]);

        $response->assertRedirect(route('admin.users.index'));

        // Verify Ramesh Kumar created with Shakha role and password = phone
        $ramesh = User::where('phone', '9876543210')->first();
        $this->assertNotNull($ramesh);
        $this->assertEquals('Ramesh Kumar', $ramesh->name);
        $this->assertTrue(Hash::check('9876543210', $ramesh->password));
        $this->assertTrue($ramesh->hasRole('shakha_karyakarta') || $ramesh->role === 'shakha_karyakarta');

        // Verify Suresh Singh
        $suresh = User::where('phone', '9123456780')->first();
        $this->assertNotNull($suresh);
        $this->assertTrue(Hash::check('9123456780', $suresh->password));
        $this->assertTrue($suresh->hasRole('nagar_karyakarta') || $suresh->role === 'nagar_karyakarta');

        // Verify Amit Sharma
        $amit = User::where('phone', '9988776655')->first();
        $this->assertNotNull($amit);
        $this->assertTrue(Hash::check('9988776655', $amit->password));
        $this->assertTrue($amit->hasRole('jila_karyakarta') || $amit->role === 'jila_karyakarta');
    }

    public function test_dealer_karyakarta_can_batch_create_shakha_products_once(): void
    {
        $user = User::factory()->create([
            'role' => 'dealer',
        ]);
        $user->profile()->create(['has_seeded_shakha_products' => false]);

        // Attach karyakarta role
        $karyakartaRole = Role::firstOrCreate(['name' => 'karyakarta'], [
            'display_name' => 'Karyakarta',
            'description' => 'Regional Karyakarta',
        ]);
        $dealerRole = Role::firstOrCreate(['name' => 'dealer'], [
            'display_name' => 'Dealer',
            'description' => 'Supplier',
        ]);
        $user->roles()->sync([$karyakartaRole->id, $dealerRole->id]);

        $this->assertTrue($user->isDealer());
        $this->assertTrue($user->isKaryakarta());

        // First batch seed call
        $response = $this->actingAs($user)->post(route('dealer.products.seed_shakha'));
        $response->assertRedirect(route('dealer.products.index'));

        // Should have created 23 Shakha products
        $this->assertEquals(23, Product::where('dealer_id', $user->id)->count());
        $this->assertTrue($user->fresh()->profile->has_seeded_shakha_products);

        // Second batch seed call should be rejected (one-time only)
        $secondResponse = $this->actingAs($user)->post(route('dealer.products.seed_shakha'));
        $secondResponse->assertRedirect(route('dealer.products.index'));
        $secondResponse->assertSessionHas('error');

        // Count must remain 23
        $this->assertEquals(23, Product::where('dealer_id', $user->id)->count());
    }
}
