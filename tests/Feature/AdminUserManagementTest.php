<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
