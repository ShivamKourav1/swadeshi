<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecuritySanitizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_rejects_special_html_symbols(): void
    {
        $response = $this->post('/register', [
            'name' => 'BadUser <script>alert("xss")</script>',
            'email' => 'hacker@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'customer',
        ]);

        $response->assertSessionHasErrors(['name']);
        $this->assertGuest();
    }

    public function test_registration_rejects_malicious_business_name(): void
    {
        $response = $this->post('/register', [
            'name' => 'Valid Dealer',
            'email' => 'dealer@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'dealer',
            'business_name' => 'Store <img src=x onerror=alert(1)>',
        ]);

        $response->assertSessionHasErrors(['business_name']);
        $this->assertGuest();
    }

    public function test_global_sanitize_input_middleware_blocks_html_injection(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post(route('admin.users.store'), [
            'name' => 'Clean Agent <svg onload=alert(1)>',
            'email' => 'clean@example.com',
            'password' => 'password123',
            'role' => 'dealer',
            'business_name' => 'Bad Store Name',
        ]);

        // Input containing < or > gets rejected automatically by SanitizeInput middleware
        $response->assertSessionHasErrors(['name']);
    }
}
