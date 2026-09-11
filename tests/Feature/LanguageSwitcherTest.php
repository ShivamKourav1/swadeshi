<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LanguageSwitcherTest extends TestCase
{
    use RefreshDatabase;

    public function test_default_locale_is_hindi(): void
    {
        $response = $this->get('/');
        $response->assertStatus(200);
        $this->assertEquals('hi', app()->getLocale());
    }

    public function test_user_can_switch_language_to_english(): void
    {
        $response = $this->post(route('language.switch', 'en'));
        $response->assertSessionHas('locale', 'en');

        $this->get('/');
        $this->assertEquals('en', app()->getLocale());
    }

    public function test_user_can_switch_language_back_to_hindi(): void
    {
        $this->post(route('language.switch', 'en'));

        $response = $this->post(route('language.switch', 'hi'));
        $response->assertSessionHas('locale', 'hi');

        $this->get('/');
        $this->assertEquals('hi', app()->getLocale());
    }
}
