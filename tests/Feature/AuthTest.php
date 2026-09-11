<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');
        $response->assertStatus(200);
    }

    public function test_user_can_authenticate_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'dealer@example.com',
            'role' => 'dealer',
        ]);

        $response = $this->post('/login', [
            'email' => 'dealer@example.com',
            'password' => 'password',
        ]);

        $this->assertAuthenticatedAs($user);
        $response->assertRedirect(route('products.index'));
    }

    public function test_user_can_register_as_dealer(): void
    {
        $response = $this->post('/register', [
            'name' => 'New Dealer Store',
            'email' => 'newdealer@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'dealer',
            'business_name' => 'New Dealer Retail',
            'phone' => '+15550000',
        ]);

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'newdealer@example.com',
            'role' => 'dealer',
        ]);
        $this->assertDatabaseHas('user_profiles', [
            'business_name' => 'New Dealer Retail',
        ]);
    }

    public function test_user_can_register_as_delivery_partner(): void
    {
        $response = $this->post('/register', [
            'name' => 'Express Driver',
            'email' => 'driver@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'delivery_partner',
            'vehicle_type' => 'Motorbike',
        ]);

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'driver@example.com',
            'role' => 'delivery_partner',
        ]);
        $this->assertDatabaseHas('user_profiles', [
            'vehicle_type' => 'Motorbike',
        ]);
    }
}
