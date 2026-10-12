<?php

namespace Tests\Feature;

use App\Models\Daayitwa;
use App\Models\Jila;
use App\Models\Kshetra;
use App\Models\Nagar;
use App\Models\Prant;
use App\Models\Shakha;
use App\Models\Swayamsevak;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\Vibhag;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ToliDaayitwaAndGanveshTest extends TestCase
{
    use RefreshDatabase;

    private User $karyakarta;
    private User $superadmin;
    private Shakha $shakha;

    protected function setUp(): void
    {
        parent::setUp();

        $this->karyakarta = User::factory()->create(['role' => 'karyakarta']);
        UserProfile::create(['user_id' => $this->karyakarta->id]);

        $this->superadmin = User::factory()->create(['role' => 'superadmin']);
        UserProfile::create(['user_id' => $this->superadmin->id]);

        $kshetra = Kshetra::create(['kshetra_name' => 'Madhya Kshetra']);
        $prant = Prant::create(['kshetra_id' => $kshetra->id, 'prant_name' => 'Malwa Prant']);
        $vibhag = Vibhag::create(['prant_id' => $prant->id, 'vibhag_name' => 'Indore Vibhag']);
        $jila = Jila::create(['vibhag_id' => $vibhag->id, 'jila_name' => 'Indore Jila']);
        $nagar = Nagar::create(['jila_id' => $jila->id, 'nagar_name' => 'Vijay Nagar']);

        $this->shakha = Shakha::create([
            'nagar_id' => $nagar->id,
            'shakha_name' => 'Keshav Shakha',
            'type' => 'dainik',
            'aayu_varg' => 'Vyavsai',
            'status' => 'Active',
            'new_ganvesh' => 10,
        ]);
    }

    public function test_non_superadmin_cannot_access_daayitwa_crud(): void
    {
        $response = $this->actingAs($this->karyakarta)->get('/karyakarta/daayitwa');
        $response->assertStatus(403);

        $createResponse = $this->actingAs($this->karyakarta)->post('/karyakarta/daayitwa', [
            'name' => 'शाखा कार्यवाह',
            'unit_level' => 'shakha',
        ]);
        $createResponse->assertStatus(403);
    }

    public function test_superadmin_can_crud_daayitwa(): void
    {
        // 1. View Index
        $response = $this->actingAs($this->superadmin)->get('/karyakarta/daayitwa');
        $response->assertStatus(200);

        // 2. Store Daayitwa
        $storeResponse = $this->actingAs($this->superadmin)->post('/karyakarta/daayitwa', [
            'name' => 'शाखा कार्यवाह',
            'unit_level' => 'shakha',
        ]);
        $storeResponse->assertRedirect();
        $this->assertDatabaseHas('daayitwa', [
            'name' => 'शाखा कार्यवाह',
            'unit_level' => 'shakha',
        ]);

        $daayitwa = Daayitwa::where('name', 'शाखा कार्यवाह')->firstOrFail();

        // 3. Update Daayitwa
        $updateResponse = $this->actingAs($this->superadmin)->put("/karyakarta/daayitwa/{$daayitwa->id}", [
            'name' => 'मुख्य शिक्षक',
            'unit_level' => 'shakha',
        ]);
        $updateResponse->assertRedirect();
        $this->assertDatabaseHas('daayitwa', [
            'id' => $daayitwa->id,
            'name' => 'मुख्य शिक्षक',
            'unit_level' => 'shakha',
        ]);

        // 4. Delete Daayitwa
        $deleteResponse = $this->actingAs($this->superadmin)->delete("/karyakarta/daayitwa/{$daayitwa->id}");
        $deleteResponse->assertRedirect();
        $this->assertDatabaseMissing('daayitwa', [
            'id' => $daayitwa->id,
        ]);
    }

    public function test_swayamsevak_creation_and_update_with_daayitwa(): void
    {
        $daayitwa = Daayitwa::create([
            'name' => 'शाखा कार्यवाह',
            'unit_level' => 'shakha',
        ]);

        $response = $this->actingAs($this->karyakarta)->post('/toli/members', [
            'shakha_id' => $this->shakha->id,
            'name' => 'Rahul Sharma',
            'mobile' => '9876543210',
            'address' => 'Scheme 54, Indore',
            'age' => 25,
            'daayitwa_id' => $daayitwa->id,
            'ganvesh' => false,
        ]);

        $response->assertRedirect();
        $swayamsevak = Swayamsevak::where('mobile', '9876543210')->firstOrFail();
        $this->assertEquals($daayitwa->id, $swayamsevak->daayitwa_id);
        $this->assertEquals('शाखा कार्यवाह', $swayamsevak->daayitwa->name);

        // Update daayitwa
        $newDaayitwa = Daayitwa::create([
            'name' => 'मुख्य शिक्षक',
            'unit_level' => 'shakha',
        ]);

        $updateResponse = $this->actingAs($this->karyakarta)->put("/toli/members/{$swayamsevak->id}", [
            'name' => 'Rahul Sharma',
            'mobile' => '9876543210',
            'address' => 'Scheme 54, Indore',
            'age' => 25,
            'daayitwa_id' => $newDaayitwa->id,
            'ganvesh' => false,
        ]);

        $updateResponse->assertRedirect();
        $swayamsevak->refresh();
        $this->assertEquals($newDaayitwa->id, $swayamsevak->daayitwa_id);
    }

    public function test_ganvesh_two_way_sync_when_full_ganvesh_is_true(): void
    {
        $response = $this->actingAs($this->karyakarta)->post('/toli/members', [
            'shakha_id' => $this->shakha->id,
            'name' => 'Vikram Singh',
            'mobile' => '9876543211',
            'ganvesh' => true,
            'have_pant' => false, // should be overridden to true because ganvesh is true
        ]);

        $response->assertRedirect();
        $swayamsevak = Swayamsevak::where('mobile', '9876543211')->firstOrFail();

        $this->assertTrue((bool)$swayamsevak->ganvesh);
        $this->assertTrue((bool)$swayamsevak->have_pant);
        $this->assertTrue((bool)$swayamsevak->have_shirt);
        $this->assertTrue((bool)$swayamsevak->have_topi);
        $this->assertTrue((bool)$swayamsevak->have_dand);
        $this->assertTrue((bool)$swayamsevak->have_belt);
        $this->assertTrue((bool)$swayamsevak->have_moje);
        $this->assertTrue((bool)$swayamsevak->have_shoes);
    }

    public function test_ganvesh_two_way_sync_when_all_seven_components_are_true(): void
    {
        $response = $this->actingAs($this->karyakarta)->post('/toli/members', [
            'shakha_id' => $this->shakha->id,
            'name' => 'Ajay Verma',
            'mobile' => '9876543212',
            'ganvesh' => false, // false initially
            'have_pant' => true,
            'have_shirt' => true,
            'have_topi' => true,
            'have_dand' => true,
            'have_belt' => true,
            'have_moje' => true,
            'have_shoes' => true,
        ]);

        $response->assertRedirect();
        $swayamsevak = Swayamsevak::where('mobile', '9876543212')->firstOrFail();

        $this->assertTrue((bool)$swayamsevak->ganvesh);
        $this->assertTrue((bool)$swayamsevak->have_pant);
        $this->assertTrue((bool)$swayamsevak->have_shoes);
    }

    public function test_ganvesh_is_false_if_any_component_is_missing(): void
    {
        $response = $this->actingAs($this->karyakarta)->post('/toli/members', [
            'shakha_id' => $this->shakha->id,
            'name' => 'Rohan Joshi',
            'mobile' => '9876543213',
            'ganvesh' => false,
            'have_pant' => true,
            'have_shirt' => true,
            'have_topi' => true,
            'have_dand' => false, // missing dand
            'have_belt' => true,
            'have_moje' => true,
            'have_shoes' => true,
        ]);

        $response->assertRedirect();
        $swayamsevak = Swayamsevak::where('mobile', '9876543213')->firstOrFail();

        $this->assertFalse((bool)$swayamsevak->ganvesh);
        $this->assertTrue((bool)$swayamsevak->have_pant);
        $this->assertFalse((bool)$swayamsevak->have_dand);
    }

    public function test_organization_unit_saves_toli_with_daayitwa_and_swayamsevak_id(): void
    {
        $daayitwa = Daayitwa::create([
            'name' => 'शाखा कार्यवाह',
            'unit_level' => 'shakha',
        ]);

        $swayamsevak = Swayamsevak::create([
            'shakha_id' => $this->shakha->id,
            'name' => 'Deepak Patel',
            'mobile' => '9876543214',
            'ganvesh' => true,
        ]);

        $response = $this->actingAs($this->karyakarta)->post('/karyakarta/units/shakha', [
            'nagar_id' => $this->shakha->nagar_id,
            'shakha_name' => 'Madhav Shakha',
            'aayu_varg' => 'Vyavsai',
            'type' => 'dainik',
            'status' => 'Active',
            'new_ganvesh' => 5,
            'toli' => [
                [
                    'key' => 'shakha_karyavah',
                    'daayitwa_id' => $daayitwa->id,
                    'swayamsevak_id' => $swayamsevak->id,
                    'responsibility' => $daayitwa->name,
                    'name' => $swayamsevak->name,
                    'contact' => $swayamsevak->mobile,
                ]
            ],
        ]);

        $response->assertRedirect();
        $createdShakha = Shakha::where('shakha_name', 'Madhav Shakha')->firstOrFail();
        $this->assertIsArray($createdShakha->toli);
        $this->assertArrayHasKey('shakha_karyavah', $createdShakha->toli);
        $this->assertEquals($daayitwa->id, $createdShakha->toli['shakha_karyavah']['daayitwa_id']);
        $this->assertEquals($swayamsevak->id, $createdShakha->toli['shakha_karyavah']['swayamsevak_id']);
        $this->assertEquals('Deepak Patel', $createdShakha->toli['shakha_karyavah']['name']);
        $this->assertEquals('9876543214', $createdShakha->toli['shakha_karyavah']['contact']);
    }
}
