<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Product;
use App\Models\Role;
use App\Models\Kshetra;
use App\Models\Prant;
use App\Models\Vibhag;
use App\Models\Jila;
use App\Models\Nagar;
use App\Models\UserProfile;
use App\Services\ShakhaProductService;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminUserManagementTest extends TestCase
{
    use RefreshDatabase;

    private function createHierarchy(): array
    {
        $kshetra = Kshetra::create(['kshetra_name' => 'Madhya Kshetra ' . uniqid()]);
        $prant = Prant::create(['kshetra_id' => $kshetra->id, 'prant_name' => 'Malwa Prant ' . uniqid()]);
        $vibhag = Vibhag::create(['prant_id' => $prant->id, 'vibhag_name' => 'Indore Vibhag ' . uniqid()]);
        $jila = Jila::create(['vibhag_id' => $vibhag->id, 'jila_name' => 'Badrinath Jila ' . uniqid()]);
        $nagar = Nagar::create(['jila_id' => $jila->id, 'nagar_name' => 'Madhav Nagar ' . uniqid()]);

        return compact('kshetra', 'prant', 'vibhag', 'jila', 'nagar');
    }

    public function test_admin_can_access_user_management_index(): void
    {
        $admin = User::factory()->create(['role' => 'superadmin']);

        $response = $this->actingAs($admin)->get(route('admin.users.index'));
        $response->assertStatus(200);
    }

    public function test_admin_can_onboard_new_dealer(): void
    {
        $admin = User::factory()->create(['role' => 'superadmin']);

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
        $admin = User::factory()->create(['role' => 'superadmin']);

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
        $admin = User::factory()->create(['role' => 'superadmin']);

        $response = $this->actingAs($admin)->get(route('admin.users.import_template'));

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('Is Shakha Toli Member', $response->streamedContent());
    }

    public function test_admin_can_import_users_via_csv_with_toli_flags_and_phone_password(): void
    {
        $admin = User::factory()->create(['role' => 'superadmin']);

        $csvData = "name,mobile,Is Shakha Toli Member,Is Nagar Toli Member,Is Jila Toli Member\n" .
                   "Ramesh Kumar,9876543210,Yes,No,No\n" .
                   "Suresh Singh,9123456780,No,Yes,No\n" .
                   "Amit Sharma,9988776655,No,No,Yes\n";

        $tempPath = tempnam(sys_get_temp_dir(), 'csv_');
        file_put_contents($tempPath, $csvData);
        $file = new UploadedFile($tempPath, 'users.csv', 'text/csv', null, true);

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

    public function test_admin_can_edit_customer_and_assign_dealer_role(): void
    {
        $admin = User::factory()->create(['role' => 'superadmin']);

        // Create customer (with mobile only, email null)
        $customer = User::create([
            'name' => 'Phone Customer',
            'phone' => '9876543210',
            'email' => null,
            'password' => Hash::make('password123'),
            'role' => 'customer',
            'status' => 'active',
        ]);
        $customer->profile()->create([]);

        // Admin opens edit screen
        $response = $this->actingAs($admin)->get(route('admin.users.edit', $customer->id));
        $response->assertStatus(200);

        // Ensure dealer role exists
        $dealerRole = Role::where('name', 'dealer')->first();
        $this->assertNotNull($dealerRole);

        // Admin assigns dealer role and adds store details
        $updateResponse = $this->actingAs($admin)->put(route('admin.users.update', $customer->id), [
            'name' => 'Phone Customer',
            'phone' => '9876543210',
            'email' => null,
            'role' => 'dealer',
            'role_ids' => [$dealerRole->id],
            'status' => 'active',
            'business_name' => 'Keshav Bhandar Store',
            'business_address' => '12 Main Bazaar',
        ]);

        $updateResponse->assertRedirect(route('admin.users.index'));

        $customer->refresh();
        $this->assertEquals('dealer', $customer->role);
        $this->assertTrue($customer->isDealer());
        $this->assertEquals('Keshav Bhandar Store', $customer->profile->business_name);
        $this->assertEquals('12 Main Bazaar', $customer->profile->business_address);
    }

    public function test_superadmin_has_global_access_to_all_users_across_all_jurisdictions(): void
    {
        $superadmin = User::factory()->create(['role' => 'superadmin']);

        $hierarchy = $this->createHierarchy();
        $jila = $hierarchy['jila'];
        $nagar = $hierarchy['nagar'];

        $user1 = User::factory()->create(['role' => 'customer', 'name' => 'Jurisdiction User 1']);
        $user1->profile()->create(['jila_id' => $jila->id]);

        $user2 = User::factory()->create(['role' => 'karyakarta', 'name' => 'Jurisdiction User 2']);
        $user2->profile()->create(['nagar_id' => $nagar->id]);

        $this->assertTrue($superadmin->isSuperAdmin());
        $this->assertTrue($superadmin->canManageUser($user1));
        $this->assertTrue($superadmin->canManageUser($user2));

        $res1 = $this->actingAs($superadmin)->get(route('admin.users.edit', $user1->id));
        $res1->assertStatus(200);

        $res2 = $this->actingAs($superadmin)->get(route('admin.users.edit', $user2->id));
        $res2->assertStatus(200);
    }

    public function test_toli_admin_can_only_view_and_manage_users_within_their_assigned_toli(): void
    {
        $this->seed(RoleAndPermissionSeeder::class);

        $h1 = $this->createHierarchy();
        $jila1 = $h1['jila'];

        $h2 = $this->createHierarchy();
        $jila2 = $h2['jila'];

        $adminRole = Role::where('name', 'admin')->first();

        // Toli Admin assigned to Jila 1
        $toliAdmin = User::factory()->create(['role' => 'admin', 'name' => 'Jila 1 Admin']);
        $toliAdmin->roles()->sync([$adminRole->id]);
        UserProfile::create([
            'user_id' => $toliAdmin->id,
            'jila_id' => $jila1->id,
            'is_jila_toli_member' => true,
        ]);

        $this->assertTrue($toliAdmin->isToliAdmin());
        $this->assertEquals(['level' => 'jila', 'id' => $jila1->id], $toliAdmin->getToliJurisdiction());

        // User in Jila 1
        $userInJila1 = User::factory()->create(['role' => 'karyakarta', 'name' => 'In Scope Karyakarta']);
        UserProfile::create(['user_id' => $userInJila1->id, 'jila_id' => $jila1->id]);

        // User in Jila 2
        $userInJila2 = User::factory()->create(['role' => 'karyakarta', 'name' => 'Out Scope Karyakarta']);
        UserProfile::create(['user_id' => $userInJila2->id, 'jila_id' => $jila2->id]);

        $this->assertTrue($toliAdmin->canManageUser($userInJila1));
        $this->assertFalse($toliAdmin->canManageUser($userInJila2));

        // Index page should show user 1 but NOT user 2
        $indexResponse = $this->actingAs($toliAdmin)->get(route('admin.users.index'));
        $indexResponse->assertStatus(200);
        $indexResponse->assertSee('In Scope Karyakarta');
        $indexResponse->assertDontSee('Out Scope Karyakarta');

        // Edit user in scope -> 200
        $editInScope = $this->actingAs($toliAdmin)->get(route('admin.users.edit', $userInJila1->id));
        $editInScope->assertStatus(200);

        // Edit user out of scope -> 403
        $editOutOfScope = $this->actingAs($toliAdmin)->get(route('admin.users.edit', $userInJila2->id));
        $editOutOfScope->assertStatus(403);

        // Update user out of scope -> 403
        $updateOutOfScope = $this->actingAs($toliAdmin)->put(route('admin.users.update', $userInJila2->id), [
            'name' => 'Hacked Name',
            'email' => $userInJila2->email,
            'role' => 'karyakarta',
            'status' => 'active',
        ]);
        $updateOutOfScope->assertStatus(403);
    }

    public function test_toli_admin_cannot_view_or_manage_superadmin(): void
    {
        $this->seed(RoleAndPermissionSeeder::class);

        $h = $this->createHierarchy();
        $jila = $h['jila'];

        $superadmin = User::factory()->create(['role' => 'superadmin', 'name' => 'Global Chief Admin']);
        UserProfile::create(['user_id' => $superadmin->id, 'jila_id' => $jila->id]);

        $adminRole = Role::where('name', 'admin')->first();
        $toliAdmin = User::factory()->create(['role' => 'admin', 'name' => 'Local Admin']);
        $toliAdmin->roles()->sync([$adminRole->id]);
        UserProfile::create(['user_id' => $toliAdmin->id, 'jila_id' => $jila->id, 'is_jila_toli_member' => true]);

        $this->assertFalse($toliAdmin->canManageUser($superadmin));

        // Index page excludes superadmins from toli admin view
        $indexResponse = $this->actingAs($toliAdmin)->get(route('admin.users.index'));
        $indexResponse->assertStatus(200);
        $indexResponse->assertDontSee('Global Chief Admin');

        // Edit superadmin -> 403
        $editResponse = $this->actingAs($toliAdmin)->get(route('admin.users.edit', $superadmin->id));
        $editResponse->assertStatus(403);

        // Destroy superadmin -> 403
        $deleteResponse = $this->actingAs($toliAdmin)->delete(route('admin.users.destroy', $superadmin->id));
        $deleteResponse->assertStatus(403);
    }

    public function test_cannot_assign_admin_role_to_customer_without_toli_membership(): void
    {
        $this->seed(RoleAndPermissionSeeder::class);
        $superadmin = User::factory()->create(['role' => 'superadmin']);

        $targetUser = User::factory()->create(['role' => 'customer']);
        UserProfile::create(['user_id' => $targetUser->id]);

        $adminRole = Role::where('name', 'admin')->first();

        // Attempt to assign admin role without any toli jurisdiction or toli membership flag
        $response = $this->actingAs($superadmin)->put(route('admin.users.update', $targetUser->id), [
            'name' => 'Attempt Admin',
            'email' => $targetUser->email,
            'role' => 'admin',
            'role_ids' => [$adminRole->id],
            'status' => 'active',
        ]);

        $response->assertSessionHasErrors(['role']);
    }

    public function test_can_assign_admin_role_to_karyakarta_with_toli_membership_flag(): void
    {
        $this->seed(RoleAndPermissionSeeder::class);
        $superadmin = User::factory()->create(['role' => 'superadmin']);

        $h = $this->createHierarchy();
        $jila = $h['jila'];

        $targetUser = User::factory()->create(['role' => 'customer']);
        UserProfile::create(['user_id' => $targetUser->id]);

        $adminRole = Role::where('name', 'admin')->first();

        // Assign admin role with jila jurisdiction and toli flag
        $response = $this->actingAs($superadmin)->put(route('admin.users.update', $targetUser->id), [
            'name' => 'Authorized Toli Admin',
            'email' => $targetUser->email,
            'role' => 'admin',
            'role_ids' => [$adminRole->id],
            'status' => 'active',
            'jila_id' => $jila->id,
            'is_jila_toli_member' => true,
        ]);

        $response->assertRedirect(route('admin.users.index'));

        $targetUser->refresh();
        $this->assertEquals('admin', $targetUser->role);
        $this->assertTrue($targetUser->isToliAdmin());
        $this->assertTrue($targetUser->profile->is_jila_toli_member);
    }

    public function test_shakha_product_seeder_and_service_initialize_default_stock_as_zero(): void
    {
        $dealer = User::factory()->create(['role' => 'dealer']);
        $dealer->profile()->create([]);

        $count = ShakhaProductService::createForDealer($dealer);
        $this->assertEquals(23, $count);

        $products = Product::where('dealer_id', $dealer->id)->get();
        $this->assertCount(23, $products);

        foreach ($products as $product) {
            $this->assertEquals(0, $product->stock, "Product {$product->name} stock should be 0");
        }
    }
}
