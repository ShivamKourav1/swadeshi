<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class KaryakartaDealerTitleTest extends TestCase
{
    use RefreshDatabase;

    private Role $dealerRole;
    private Role $karyakartaRole;

    protected function setUp(): void
    {
        parent::setUp();

        $this->dealerRole = Role::firstOrCreate(
            ['name' => 'dealer'],
            ['label' => 'Dealer', 'description' => 'Dealer role']
        );

        $this->karyakartaRole = Role::firstOrCreate(
            ['name' => 'karyakarta'],
            ['label' => 'Karyakarta', 'description' => 'Karyakarta role']
        );
    }

    public function test_user_is_karyakarta_dealer_when_having_both_roles(): void
    {
        // Case 1: Primary role karyakarta, assigned dealer role
        $user1 = User::factory()->create(['role' => 'karyakarta']);
        $user1->roles()->attach($this->dealerRole);

        $this->assertTrue($user1->isKaryakarta());
        $this->assertTrue($user1->isDealer());
        $this->assertTrue($user1->isKaryakartaDealer());

        // Case 2: Primary role dealer, assigned karyakarta role
        $user2 = User::factory()->create(['role' => 'dealer']);
        $user2->roles()->attach($this->karyakartaRole);

        $this->assertTrue($user2->isKaryakarta());
        $this->assertTrue($user2->isDealer());
        $this->assertTrue($user2->isKaryakartaDealer());

        // Case 3: Specific organizational karyakarta (e.g. jila_karyakarta) with dealer role
        $jilaRole = Role::firstOrCreate(
            ['name' => 'jila_karyakarta'],
            ['label' => 'Jila Karyakarta', 'description' => 'Jila karyakarta role']
        );
        $user3 = User::factory()->create(['role' => 'jila_karyakarta']);
        $user3->roles()->attach($this->dealerRole);

        $this->assertTrue($user3->isKaryakarta());
        $this->assertTrue($user3->isDealer());
        $this->assertTrue($user3->isKaryakartaDealer());
    }

    public function test_standard_non_karyakarta_dealer_is_not_karyakarta_dealer(): void
    {
        // Standard dealer without karyakarta role
        $dealer = User::factory()->create(['role' => 'dealer']);

        $this->assertFalse($dealer->isKaryakarta());
        $this->assertTrue($dealer->isDealer());
        $this->assertFalse($dealer->isKaryakartaDealer());
    }

    public function test_karyakarta_without_dealer_rights_is_not_karyakarta_dealer(): void
    {
        $karyakarta = User::factory()->create(['role' => 'karyakarta']);

        $this->assertTrue($karyakarta->isKaryakarta());
        $this->assertFalse($karyakarta->isDealer());
        $this->assertFalse($karyakarta->isKaryakartaDealer());
    }

    public function test_inertia_shares_is_karyakarta_dealer_flag_correctly(): void
    {
        // Karyakarta dealer user
        $karyakartaDealer = User::factory()->create(['role' => 'karyakarta']);
        $karyakartaDealer->roles()->attach($this->dealerRole);

        $response = $this->actingAs($karyakartaDealer)->get(route('dealer.products.index'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) =>
            $page->component('Products/Dealer/Index')
                ->where('auth.user.is_karyakarta_dealer', true)
                ->where('auth.user.is_karyakarta', true)
                ->where('auth.user.is_dealer', true)
        );

        // Standard dealer user
        $standardDealer = User::factory()->create(['role' => 'dealer']);

        $responseDealer = $this->actingAs($standardDealer)->get(route('dealer.products.index'));

        $responseDealer->assertOk();
        $responseDealer->assertInertia(fn (Assert $page) =>
            $page->component('Products/Dealer/Index')
                ->where('auth.user.is_karyakarta_dealer', false)
                ->where('auth.user.is_karyakarta', false)
                ->where('auth.user.is_dealer', true)
        );
    }

    public function test_karyakarta_dealer_on_orders_and_demands_pages(): void
    {
        $karyakartaDealer = User::factory()->create(['role' => 'karyakarta']);
        $karyakartaDealer->roles()->attach($this->dealerRole);

        // Orders page
        $responseOrders = $this->actingAs($karyakartaDealer)->get(route('dealer.orders.index'));
        $responseOrders->assertOk();
        $responseOrders->assertInertia(fn (Assert $page) =>
            $page->component('Dealer/Orders')
                ->where('auth.user.is_karyakarta_dealer', true)
        );

        // Demands page
        $responseDemands = $this->actingAs($karyakartaDealer)->get(route('dealer.demands.index'));
        $responseDemands->assertOk();
        $responseDemands->assertInertia(fn (Assert $page) =>
            $page->component('Dealer/Demands')
                ->where('auth.user.is_karyakarta_dealer', true)
        );
    }
}
