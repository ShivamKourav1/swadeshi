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

    public function test_user_can_register_as_customer(): void
    {
        $response = $this->post('/register', [
            'name' => 'John Customer',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '+15550000',
        ]);

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
            'role' => 'customer',
        ]);
        $response->assertRedirect(route('products.index'));
    }

    public function test_public_registration_forces_customer_role_even_if_other_role_submitted(): void
    {
        $response = $this->post('/register', [
            'name' => 'Attempted Dealer',
            'email' => 'attempted_dealer@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'dealer',
        ]);

        $this->assertAuthenticated();
        // Role must always be forced to 'customer'
        $this->assertDatabaseHas('users', [
            'email' => 'attempted_dealer@example.com',
            'role' => 'customer',
        ]);
    }
}
