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
        $response->assertInertia(fn ($page) => $page
            ->component('Auth/Login')
            ->where('showDemoCredentials', true)
        );
    }

    public function test_demo_credentials_are_hidden_in_production(): void
    {
        $this->app['env'] = 'production';
        config(['app.env' => 'production', 'app.show_demo_users' => false]);

        $response = $this->get('/login');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Auth/Login')
            ->where('showDemoCredentials', false)
            ->where('is_production', true)
        );
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

    public function test_user_can_login_using_mobile_number(): void
    {
        $user = User::factory()->create([
            'phone' => '9876543210',
            'email' => 'phoneuser@example.com',
            'password' => bcrypt('secret123'),
        ]);

        $response = $this->post('/login', [
            'email' => '9876543210',
            'password' => 'secret123',
        ]);

        $this->assertAuthenticatedAs($user);
        $response->assertRedirect(route('products.index'));
    }

    public function test_user_can_login_using_mobile_number_with_plus_91_or_formatting(): void
    {
        $user = User::factory()->create([
            'phone' => '9876543210',
            'email' => 'phoneformatted@example.com',
            'password' => bcrypt('secret123'),
        ]);

        $response = $this->post('/login', [
            'email' => '+91 98765-43210',
            'password' => 'secret123',
        ]);

        $this->assertAuthenticatedAs($user);
    }

    public function test_user_can_register_with_phone_number_only_without_email(): void
    {
        $response = $this->post('/register', [
            'name' => 'Phone Only User',
            'phone' => '9988776655',
            'password' => 'secret1234',
            'password_confirmation' => 'secret1234',
        ]);

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'name' => 'Phone Only User',
            'phone' => '9988776655',
            'role' => 'customer',
            'email' => null,
        ]);
    }

    public function test_user_can_register_with_email_only_without_phone(): void
    {
        $response = $this->post('/register', [
            'name' => 'Email Only User',
            'email' => 'emailonly@example.com',
            'password' => 'secret1234',
            'password_confirmation' => 'secret1234',
        ]);

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'name' => 'Email Only User',
            'email' => 'emailonly@example.com',
            'role' => 'customer',
        ]);
    }

    public function test_registration_fails_if_neither_email_nor_phone_provided(): void
    {
        $response = $this->post('/register', [
            'name' => 'No Contact User',
            'password' => 'secret1234',
            'password_confirmation' => 'secret1234',
        ]);

        $response->assertSessionHasErrors(['email', 'phone']);
        $this->assertGuest();
    }
}
