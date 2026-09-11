<?php

namespace Tests\Feature;

use App\Models\Jila;
use App\Models\Kshetra;
use App\Models\Nagar;
use App\Models\Prant;
use App\Models\Shakha;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\Vibhag;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KaryakartaOrganizationUnitsTest extends TestCase
{
    use RefreshDatabase;

    private User $karyakarta;
    private Kshetra $kshetra;
    private Prant $prant;
    private Vibhag $vibhag;
    private Jila $jila;
    private Nagar $nagar;

    protected function setUp(): void
    {
        parent::setUp();

        $this->karyakarta = User::factory()->create(['role' => 'karyakarta']);
        UserProfile::create(['user_id' => $this->karyakarta->id]);

        $this->kshetra = Kshetra::create([
            'kshetra_name' => 'Madhya Kshetra',
            'toli' => [
                'kshetra_sanghchalak' => ['name' => 'Dr. Sharma', 'contact' => '+91 9826010001'],
            ],
        ]);

        $this->prant = Prant::create([
            'kshetra_id' => $this->kshetra->id,
            'prant_name' => 'Malwa Prant',
            'toli' => [
                'prant_karyavah' => ['name' => 'Shri Balram', 'contact' => '+91 9826020001'],
            ],
        ]);

        $this->vibhag = Vibhag::create([
            'prant_id' => $this->prant->id,
            'vibhag_name' => 'Indore Vibhag',
        ]);

        $this->jila = Jila::create([
            'vibhag_id' => $this->vibhag->id,
            'jila_name' => 'Badrinath Jila',
        ]);

        $this->nagar = Nagar::create([
            'jila_id' => $this->jila->id,
            'nagar_name' => 'Madhav Nagar',
        ]);
    }

    public function test_karyakarta_can_create_shakha_with_toli_members(): void
    {
        $response = $this->actingAs($this->karyakarta)
            ->post(route('karyakarta.units.store', ['unitType' => 'shakha']), [
                'nagar_id' => $this->nagar->id,
                'shakha_name' => 'Keshav Prabhat Shakha',
                'aayu_varg' => 'Vyavsai',
                'type' => 'dainik',
                'status' => 'Active',
                'toli' => [
                    'mukhya_shikshak' => ['name' => 'Ramesh Verma', 'contact' => '+91 9826060001'],
                    'karyavah' => ['name' => 'Suresh Joshi', 'contact' => '+91 9826060002'],
                ],
            ]);

        $response->assertRedirect();
        
        $shakha = Shakha::where('shakha_name', 'Keshav Prabhat Shakha')->first();
        $this->assertNotNull($shakha);
        $this->assertEquals('Keshav Prabhat Shakha', $shakha->shakha_name);
        $this->assertIsArray($shakha->toli);
        $this->assertEquals('Ramesh Verma', $shakha->toli['mukhya_shikshak']['name']);
        $this->assertEquals('+91 9826060001', $shakha->toli['mukhya_shikshak']['contact']);
        $this->assertEquals('Suresh Joshi', $shakha->toli['karyavah']['name']);
    }

    public function test_karyakarta_can_update_shakha_with_toli_members(): void
    {
        $shakha = Shakha::create([
            'nagar_id' => $this->nagar->id,
            'shakha_name' => 'Old Shakha Name',
            'aayu_varg' => 'Baal',
            'type' => 'dainik',
            'status' => 'Active',
            'toli' => [
                'mukhya_shikshak' => ['name' => 'Original Leader', 'contact' => '+91 1111111111'],
            ],
        ]);

        $response = $this->actingAs($this->karyakarta)
            ->put(route('karyakarta.units.update', ['unitType' => 'shakha', 'id' => $shakha->id]), [
                'nagar_id' => $this->nagar->id,
                'shakha_name' => 'Updated Shakha Name',
                'aayu_varg' => 'Mahavidhyalay',
                'type' => 'saptahik',
                'status' => 'Active',
                'toli' => [
                    'mukhya_shikshak' => ['name' => 'Updated Leader', 'contact' => '+91 9999999999'],
                    'karyavah' => ['name' => 'New Karyavah', 'contact' => '+91 8888888888'],
                ],
            ]);

        $response->assertRedirect();

        $shakha->refresh();
        $this->assertEquals('Updated Shakha Name', $shakha->shakha_name);
        $this->assertEquals('Mahavidhyalay', $shakha->aayu_varg);
        $this->assertEquals('saptahik', $shakha->type);
        $this->assertIsArray($shakha->toli);
        $this->assertEquals('Updated Leader', $shakha->toli['mukhya_shikshak']['name']);
        $this->assertEquals('+91 9999999999', $shakha->toli['mukhya_shikshak']['contact']);
        $this->assertEquals('New Karyavah', $shakha->toli['karyavah']['name']);
        $this->assertEquals('+91 8888888888', $shakha->toli['karyavah']['contact']);
    }

    public function test_units_index_screen_returns_all_unit_hierarchies_and_toli(): void
    {
        $shakha = Shakha::create([
            'nagar_id' => $this->nagar->id,
            'shakha_name' => 'Vivekanand Tarun Shakha',
            'aayu_varg' => 'Mahavidhyalay',
            'type' => 'dainik',
            'status' => 'Active',
            'toli' => [
                'mukhya_shikshak' => ['name' => 'Amit Sharma', 'contact' => '+91 9826060003'],
            ],
        ]);

        $response = $this->actingAs($this->karyakarta)
            ->get(route('karyakarta.units.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Karyakarta/Units/Index')
            ->has('shakhas')
            ->has('nagars')
            ->has('jilas')
            ->has('vibhags')
            ->has('prants')
            ->has('kshetras')
        );
    }
}
