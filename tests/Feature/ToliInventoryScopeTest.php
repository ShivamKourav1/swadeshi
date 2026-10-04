<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Jila;
use App\Models\Kshetra;
use App\Models\Nagar;
use App\Models\Prant;
use App\Models\Product;
use App\Models\Role;
use App\Models\Shakha;
use App\Models\ToliInventoryScope;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\Vibhag;
use App\Services\ToliEncryptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ToliInventoryScopeTest extends TestCase
{
    use RefreshDatabase;

    private Kshetra $kshetra;
    private Prant $prant;
    private Vibhag $vibhag;
    private Jila $jilaBadrinath;
    private Jila $jilaHaridwar;
    private Nagar $nagarMadhav;
    private Shakha $shakhaKeshav;

    private User $karyakartaAdminUser;
    private User $onlyKaryakartaUser;
    private User $onlyAdminUser;

    private User $jilaBadrinathDealer;
    private User $jilaHaridwarDealer;
    private Product $badrinathProduct;
    private Product $haridwarProduct;

    protected function setUp(): void
    {
        parent::setUp();

        // Organizational Hierarchy
        $this->kshetra = Kshetra::create(['kshetra_name' => 'Madhya Kshetra']);
        $this->prant = Prant::create(['kshetra_id' => $this->kshetra->id, 'prant_name' => 'Malwa Prant']);
        $this->vibhag = Vibhag::create(['prant_id' => $this->prant->id, 'vibhag_name' => 'Indore Vibhag']);

        $this->jilaBadrinath = Jila::create(['vibhag_id' => $this->vibhag->id, 'jila_name' => 'Jila Badrinath']);
        $this->jilaHaridwar = Jila::create(['vibhag_id' => $this->vibhag->id, 'jila_name' => 'Jila Haridwar']);

        $this->nagarMadhav = Nagar::create(['jila_id' => $this->jilaBadrinath->id, 'nagar_name' => 'Madhav Nagar']);
        $this->shakhaKeshav = Shakha::create([
            'nagar_id' => $this->nagarMadhav->id,
            'shakha_name' => 'Keshav Shakha',
            'aayu_varg' => 'Vyavsai',
            'type' => 'dainik',
            'status' => 'Active',
        ]);

        // Ensure roles exist
        Role::firstOrCreate(['name' => 'admin'], ['display_name' => 'Admin']);
        Role::firstOrCreate(['name' => 'karyakarta'], ['display_name' => 'Karyakarta']);

        // User U: roles = [karyakarta, admin], Toli = Jila Toli, Jurisdiction Scope = Jila Badrinath
        $this->karyakartaAdminUser = User::factory()->create([
            'role' => 'karyakarta',
            'phone' => '9876543210',
            'status' => 'active',
        ]);
        $this->karyakartaAdminUser->assignRole('admin');
        UserProfile::create([
            'user_id' => $this->karyakartaAdminUser->id,
            'jila_id' => $this->jilaBadrinath->id,
            'is_jila_toli_member' => true,
        ]);

        // User with only karyakarta role
        $this->onlyKaryakartaUser = User::factory()->create([
            'role' => 'karyakarta',
            'phone' => '9876543211',
            'status' => 'active',
        ]);
        UserProfile::create([
            'user_id' => $this->onlyKaryakartaUser->id,
            'jila_id' => $this->jilaBadrinath->id,
            'is_jila_toli_member' => true,
        ]);

        // User with only admin role
        $this->onlyAdminUser = User::factory()->create([
            'role' => 'admin',
            'phone' => '9876543212',
            'status' => 'active',
        ]);

        // Dealers
        $category = Category::create(['name' => 'गणवेश', 'slug' => 'ganvesh']);

        // Dealer for Jila Badrinath
        $this->jilaBadrinathDealer = User::factory()->create([
            'role' => 'dealer',
            'status' => 'active',
        ]);
        UserProfile::create([
            'user_id' => $this->jilaBadrinathDealer->id,
            'jila_id' => $this->jilaBadrinath->id,
            'nagar_id' => null,
            'shakha_id' => null,
        ]);
        $this->badrinathProduct = Product::create([
            'dealer_id' => $this->jilaBadrinathDealer->id,
            'category_id' => $category->id,
            'name' => 'बद्रीनाथ संघ गणवेश (Badrinath Uniform)',
            'slug' => 'badrinath-uniform',
            'sku' => 'BDN-UNI-01',
            'price' => 350.00,
            'stock' => 25,
            'status' => 'active',
        ]);

        // Dealer for Jila Haridwar
        $this->jilaHaridwarDealer = User::factory()->create([
            'role' => 'dealer',
            'status' => 'active',
        ]);
        UserProfile::create([
            'user_id' => $this->jilaHaridwarDealer->id,
            'jila_id' => $this->jilaHaridwar->id,
            'nagar_id' => null,
            'shakha_id' => null,
        ]);
        $this->haridwarProduct = Product::create([
            'dealer_id' => $this->jilaHaridwarDealer->id,
            'category_id' => $category->id,
            'name' => 'हरिद्वार संघ गणवेश (Haridwar Uniform)',
            'slug' => 'haridwar-uniform',
            'sku' => 'HDW-UNI-01',
            'price' => 320.00,
            'stock' => 15,
            'status' => 'active',
        ]);
    }

    public function test_karyakarta_with_admin_role_can_view_inventory_scope_settings(): void
    {
        $response = $this->actingAs($this->karyakartaAdminUser)->get(route('karyakarta.inventory-scope.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Karyakarta/InventoryScope/Index')
                ->where('unit.name', 'Jila Badrinath')
                ->where('unit.level', 'jila')
                ->has('availableSubUnits', 2) // nagar, basti
                ->where('availableSubUnits.0.id', 'nagar')
                ->where('availableSubUnits.1.id', 'basti')
        );
    }

    public function test_user_without_admin_role_cannot_view_inventory_scope_settings(): void
    {
        $response = $this->actingAs($this->onlyKaryakartaUser)->get(route('karyakarta.inventory-scope.index'));
        $response->assertStatus(403);
    }

    public function test_admin_without_karyakarta_role_cannot_view_inventory_scope_settings(): void
    {
        $response = $this->actingAs($this->onlyAdminUser)->get(route('karyakarta.inventory-scope.index'));
        $response->assertStatus(403);
    }

    public function test_karyakarta_admin_can_update_inventory_scope_settings(): void
    {
        $response = $this->actingAs($this->karyakartaAdminUser)->post(route('karyakarta.inventory-scope.update'), [
            'sub_units' => ['nagar'],
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('toli_inventory_scopes', [
            'unit_type' => 'jila',
            'unit_id' => $this->jilaBadrinath->id,
            'visible_sub_units' => json_encode(['nagar']),
            'updated_by' => $this->karyakartaAdminUser->id,
        ]);
    }

    public function test_selecting_nagar_only_makes_products_visible_on_nagar_toli_page_but_not_shakha(): void
    {
        // Set scope for Jila Badrinath: ['nagar'] only
        ToliInventoryScope::create([
            'unit_type' => 'jila',
            'unit_id' => $this->jilaBadrinath->id,
            'visible_sub_units' => ['nagar'],
            'updated_by' => $this->karyakartaAdminUser->id,
        ]);

        // Nagar Madhav Nagar Toli Page URL
        $nagarUrl = ToliEncryptionService::buildToliUrl(
            $this->kshetra->id,
            $this->vibhag->id,
            $this->jilaBadrinath->id,
            $this->nagarMadhav->id
        );

        // Shakha Keshav Shakha Toli Page URL
        $shakhaUrl = ToliEncryptionService::buildToliUrl(
            $this->kshetra->id,
            $this->vibhag->id,
            $this->jilaBadrinath->id,
            $this->nagarMadhav->id,
            $this->shakhaKeshav->id
        );

        // 1. Visit Nagar Toli Page -> Badrinath product MUST BE VISIBLE
        $nagarResponse = $this->actingAs($this->karyakartaAdminUser)->get($nagarUrl);
        $nagarResponse->assertStatus(200);
        $nagarResponse->assertInertia(fn ($page) =>
            $page->component('Toli/Index')
                ->has('products', 1)
                ->where('products.0.id', $this->badrinathProduct->id)
                ->where('products.0.name', 'बद्रीनाथ संघ गणवेश (Badrinath Uniform)')
        );

        // 2. Visit Shakha Toli Page -> Badrinath product MUST NOT BE VISIBLE (sub-unit shakha is not selected)
        $shakhaResponse = $this->actingAs($this->karyakartaAdminUser)->get($shakhaUrl);
        $shakhaResponse->assertStatus(200);
        $shakhaResponse->assertInertia(fn ($page) =>
            $page->component('Toli/Index')
                ->has('products', 0)
        );
    }

    public function test_selecting_shakha_only_makes_products_visible_on_shakha_toli_page_but_not_nagar(): void
    {
        // Set scope for Jila Badrinath: ['shakha'] only
        ToliInventoryScope::create([
            'unit_type' => 'jila',
            'unit_id' => $this->jilaBadrinath->id,
            'visible_sub_units' => ['shakha'],
            'updated_by' => $this->karyakartaAdminUser->id,
        ]);

        $nagarUrl = ToliEncryptionService::buildToliUrl(
            $this->kshetra->id,
            $this->vibhag->id,
            $this->jilaBadrinath->id,
            $this->nagarMadhav->id
        );

        $shakhaUrl = ToliEncryptionService::buildToliUrl(
            $this->kshetra->id,
            $this->vibhag->id,
            $this->jilaBadrinath->id,
            $this->nagarMadhav->id,
            $this->shakhaKeshav->id
        );

        // 1. Visit Nagar Toli Page -> Badrinath product MUST NOT BE VISIBLE
        $nagarResponse = $this->actingAs($this->karyakartaAdminUser)->get($nagarUrl);
        $nagarResponse->assertStatus(200);
        $nagarResponse->assertInertia(fn ($page) =>
            $page->component('Toli/Index')
                ->has('products', 0)
        );

        // 2. Visit Shakha Toli Page -> Badrinath product MUST BE VISIBLE
        $shakhaResponse = $this->actingAs($this->karyakartaAdminUser)->get($shakhaUrl);
        $shakhaResponse->assertStatus(200);
        $shakhaResponse->assertInertia(fn ($page) =>
            $page->component('Toli/Index')
                ->has('products', 1)
                ->where('products.0.id', $this->badrinathProduct->id)
        );
    }

    public function test_selecting_both_nagar_and_shakha_makes_products_visible_on_both_toli_pages(): void
    {
        // Set scope for Jila Badrinath: ['nagar', 'shakha']
        ToliInventoryScope::create([
            'unit_type' => 'jila',
            'unit_id' => $this->jilaBadrinath->id,
            'visible_sub_units' => ['nagar', 'shakha'],
            'updated_by' => $this->karyakartaAdminUser->id,
        ]);

        $nagarUrl = ToliEncryptionService::buildToliUrl(
            $this->kshetra->id,
            $this->vibhag->id,
            $this->jilaBadrinath->id,
            $this->nagarMadhav->id
        );

        $shakhaUrl = ToliEncryptionService::buildToliUrl(
            $this->kshetra->id,
            $this->vibhag->id,
            $this->jilaBadrinath->id,
            $this->nagarMadhav->id,
            $this->shakhaKeshav->id
        );

        // Both pages see the product
        $nagarResponse = $this->actingAs($this->karyakartaAdminUser)->get($nagarUrl);
        $nagarResponse->assertStatus(200);
        $nagarResponse->assertInertia(fn ($page) =>
            $page->component('Toli/Index')->has('products', 1)
        );

        $shakhaResponse = $this->actingAs($this->karyakartaAdminUser)->get($shakhaUrl);
        $shakhaResponse->assertStatus(200);
        $shakhaResponse->assertInertia(fn ($page) =>
            $page->component('Toli/Index')->has('products', 1)
        );
    }

    public function test_products_of_different_jila_are_never_visible_in_subordinates(): void
    {
        // Enable both nagar and shakha on Jila Badrinath
        ToliInventoryScope::create([
            'unit_type' => 'jila',
            'unit_id' => $this->jilaBadrinath->id,
            'visible_sub_units' => ['nagar', 'shakha'],
        ]);

        $shakhaUrl = ToliEncryptionService::buildToliUrl(
            $this->kshetra->id,
            $this->vibhag->id,
            $this->jilaBadrinath->id,
            $this->nagarMadhav->id,
            $this->shakhaKeshav->id
        );

        $response = $this->actingAs($this->karyakartaAdminUser)->get($shakhaUrl);
        $response->assertStatus(200);

        // Haridwar product should not be in Badrinath Shakha
        $response->assertInertia(fn ($page) =>
            $page->component('Toli/Index')
                ->where('products.0.id', $this->badrinathProduct->id)
                ->missing('products.1')
        );
    }

    public function test_jila_toli_page_always_shows_own_dealer_products(): void
    {
        // Jila Badrinath Toli Page
        $jilaUrl = ToliEncryptionService::buildToliUrl(
            $this->kshetra->id,
            $this->vibhag->id,
            $this->jilaBadrinath->id
        );

        $response = $this->actingAs($this->karyakartaAdminUser)->get($jilaUrl);
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Toli/Index')
                ->has('products', 1)
                ->where('products.0.id', $this->badrinathProduct->id)
        );
    }

    public function test_karyakarta_dashboard_displays_inventory_scope_option_for_karyakarta_admin(): void
    {
        $response = $this->actingAs($this->karyakartaAdminUser)->get(route('karyakarta.dashboard'));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Karyakarta/Dashboard')
                ->where('can_manage_inventory_scope', true)
        );

        // User with only karyakarta role must have can_manage_inventory_scope = false
        $responseOnlyKaryakarta = $this->actingAs($this->onlyKaryakartaUser)->get(route('karyakarta.dashboard'));
        $responseOnlyKaryakarta->assertStatus(200);
        $responseOnlyKaryakarta->assertInertia(fn ($page) =>
            $page->component('Karyakarta/Dashboard')
                ->where('can_manage_inventory_scope', false)
        );
    }
}
