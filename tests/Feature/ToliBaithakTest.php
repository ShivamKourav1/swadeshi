<?php

namespace Tests\Feature;

use App\Models\Baithak;
use App\Models\BaithakAttendee;
use App\Models\Basti;
use App\Models\Daayitwa;
use App\Models\Jila;
use App\Models\Kshetra;
use App\Models\Nagar;
use App\Models\Prant;
use App\Models\Shakha;
use App\Models\Swayamsevak;
use App\Models\User;
use App\Models\Vibhag;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ToliBaithakTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Kshetra $kshetra;
    private Prant $prant;
    private Vibhag $vibhag;
    private Jila $jila;
    private Nagar $nagar;
    private Basti $basti;
    private Shakha $shakha;
    private Daayitwa $karyavahDaayitwa;
    private Daayitwa $shikshakDaayitwa;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'role' => 'karyakarta',
            'phone' => '9876543210',
            'password' => bcrypt('secret123'),
            'status' => 'active',
        ]);

        $this->kshetra = Kshetra::create(['kshetra_name' => 'Madhya Kshetra']);
        $this->prant = Prant::create(['kshetra_id' => $this->kshetra->id, 'prant_name' => 'Malwa Prant']);
        $this->vibhag = Vibhag::create(['prant_id' => $this->prant->id, 'vibhag_name' => 'Indore Vibhag']);
        $this->jila = Jila::create(['vibhag_id' => $this->vibhag->id, 'jila_name' => 'Indore Nagar Jila']);
        $this->nagar = Nagar::create(['jila_id' => $this->jila->id, 'nagar_name' => 'Madhav Nagar']);
        $this->basti = Basti::create([
            'nagar_id' => $this->nagar->id,
            'basti_name' => 'Keshav Basti',
            'status' => 'Active',
        ]);
        $this->shakha = Shakha::create([
            'nagar_id' => $this->nagar->id,
            'basti_id' => $this->basti->id,
            'shakha_name' => 'Prabhat Shakha',
            'status' => 'Active',
        ]);

        $this->karyavahDaayitwa = Daayitwa::create([
            'name' => 'कार्यवाह',
            'unit_level' => 'shakha',
        ]);
        $this->shikshakDaayitwa = Daayitwa::create([
            'name' => 'मुख्य शिक्षक',
            'unit_level' => 'shakha',
        ]);
    }

    public function test_can_schedule_baithak_and_auto_populates_swayamsevaks_with_expected_daayitwas(): void
    {
        // Create 2 swayamsevaks in this basti
        $s1 = Swayamsevak::create([
            'name' => 'Ramesh Sharma',
            'mobile' => '9893011111',
            'basti_id' => $this->basti->id,
            'shakha_id' => $this->shakha->id,
            'daayitwa_id' => $this->karyavahDaayitwa->id,
            'ganvesh' => true,
        ]);

        $s2 = Swayamsevak::create([
            'name' => 'Suresh Verma',
            'mobile' => '9893022222',
            'basti_id' => $this->basti->id,
            'shakha_id' => $this->shakha->id,
            'daayitwa_id' => $this->shikshakDaayitwa->id,
            'ganvesh' => false,
        ]);

        $response = $this->actingAs($this->user)->postJson('/toli/baithaks', [
            'unit_level' => 'basti',
            'unit_id' => $this->basti->id,
            'title' => 'मासिक शाखा टोली बैठक',
            'baithak_type' => 'शाखा टोली बैठक',
            'baithak_date' => '2026-10-25',
            'baithak_time' => '06:30 PM',
            'venue' => 'शिशु मंदिर परिसर',
            'agenda' => "1. उपस्थिति समीक्षा\n2. गणवेश वितरण योजना",
            'expected_daayitwas' => ['कार्यवाह'],
            'comments_scheduling' => 'सभी कार्यकर्ता समय पर उपस्थित हों',
        ]);

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('baithak.title', 'मासिक शाखा टोली बैठक');

        $baithakId = $response->json('baithak.id');
        $this->assertDatabaseHas('baithaks', [
            'id' => $baithakId,
            'unit_level' => 'basti',
            'unit_id' => $this->basti->id,
            'title' => 'मासिक शाखा टोली बैठक',
            'status' => 'scheduled',
        ]);

        // Verify attendees were created
        $this->assertDatabaseHas('baithak_attendees', [
            'baithak_id' => $baithakId,
            'swayamsevak_id' => $s1->id,
            'is_expected' => true, // matched 'कार्यवाह'
            'is_present' => false,
        ]);

        $this->assertDatabaseHas('baithak_attendees', [
            'baithak_id' => $baithakId,
            'swayamsevak_id' => $s2->id,
            'is_expected' => false, // Daayitwa was not in expected_daayitwas
            'is_present' => false,
        ]);
    }

    public function test_can_update_baithak_details_and_resync_expected_daayitwas(): void
    {
        $s1 = Swayamsevak::create([
            'name' => 'Ramesh Sharma',
            'mobile' => '9893011111',
            'basti_id' => $this->basti->id,
            'daayitwa_id' => $this->karyavahDaayitwa->id,
        ]);

        $baithak = Baithak::create([
            'unit_level' => 'basti',
            'unit_id' => $this->basti->id,
            'title' => 'प्रारंभिक बैठक',
            'baithak_type' => 'शाखा बैठक',
            'baithak_date' => '2026-10-25',
            'status' => 'scheduled',
            'expected_daayitwas' => [],
        ]);

        $att = BaithakAttendee::create([
            'baithak_id' => $baithak->id,
            'swayamsevak_id' => $s1->id,
            'attendee_type' => 'swayamsevak',
            'name' => $s1->name,
            'mobile' => $s1->mobile,
            'daayitwa_name' => 'कार्यवाह',
            'is_expected' => false,
            'is_present' => false,
        ]);

        $response = $this->actingAs($this->user)->putJson("/toli/baithaks/{$baithak->id}", [
            'title' => 'संशोधित शाखा टोली बैठक',
            'baithak_type' => 'विशेष बैठक',
            'baithak_date' => '2026-10-26',
            'expected_daayitwas' => ['कार्यवाह'],
        ]);

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('baithak.title', 'संशोधित शाखा टोली बैठक');

        $this->assertDatabaseHas('baithaks', [
            'id' => $baithak->id,
            'title' => 'संशोधित शाखा टोली बैठक',
            'baithak_type' => 'विशेष बैठक',
        ]);

        // Expectation status should be updated
        $att->refresh();
        $this->assertTrue((bool) $att->is_expected);
    }

    public function test_can_record_attendance_and_save_minutes_of_meeting(): void
    {
        $baithak = Baithak::create([
            'unit_level' => 'basti',
            'unit_id' => $this->basti->id,
            'title' => 'कार्यकारिणी बैठक',
            'baithak_date' => '2026-10-25',
            'status' => 'scheduled',
            'attended_count' => 0,
            'total_expected_count' => 1,
        ]);

        $att = BaithakAttendee::create([
            'baithak_id' => $baithak->id,
            'name' => 'Dinesh Joshi',
            'daayitwa_name' => 'कार्यवाह',
            'is_expected' => true,
            'is_present' => false,
        ]);

        $response = $this->actingAs($this->user)->putJson("/toli/baithaks/{$baithak->id}/attendance", [
            'attendees' => [
                [
                    'id' => $att->id,
                    'is_present' => true,
                    'remarks' => 'समय पर उपस्थित',
                ],
            ],
            'minutes' => "बैठक में 5 नए स्वयंसेवकों को गणवेश देने का निर्णय हुआ।",
            'comments_minutes' => "आगामी रविवार को वितरण सुनिश्चित किया जाएगा।",
            'status' => 'completed',
        ]);

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('baithak.status', 'completed');
        $response->assertJsonPath('baithak.attended_count', 1);

        $att->refresh();
        $this->assertTrue((bool) $att->is_present);
        $this->assertEquals('समय पर उपस्थित', $att->remarks);

        $baithak->refresh();
        $this->assertEquals('completed', $baithak->status);
        $this->assertEquals(1, $baithak->attended_count);
        $this->assertStringContainsString('5 नए स्वयंसेवकों को गणवेश', $baithak->minutes);
    }

    public function test_can_search_guests_across_units(): void
    {
        Swayamsevak::create([
            'name' => 'Devendra Fadnavis',
            'mobile' => '9998887777',
            'basti_id' => $this->basti->id,
        ]);

        $response = $this->actingAs($this->user)->getJson('/toli/baithaks/guests/search?q=Devendra');
        $response->assertOk();
        $response->assertJsonPath('success', true);
        $this->assertCount(1, $response->json('swayamsevaks'));
        $this->assertEquals('Devendra Fadnavis', $response->json('swayamsevaks.0.name'));
    }

    public function test_can_delete_baithak(): void
    {
        $baithak = Baithak::create([
            'unit_level' => 'basti',
            'unit_id' => $this->basti->id,
            'title' => 'अस्थायी बैठक',
            'baithak_date' => '2026-10-25',
            'status' => 'scheduled',
        ]);

        $response = $this->actingAs($this->user)->deleteJson("/toli/baithaks/{$baithak->id}");
        $response->assertOk();
        $response->assertJsonPath('success', true);

        $this->assertDatabaseMissing('baithaks', ['id' => $baithak->id]);
    }

    public function test_can_get_units_by_level(): void
    {
        $response = $this->actingAs($this->user)->getJson('/toli/baithaks/units?level=jila');
        $response->assertOk();
        $response->assertJsonPath('success', true);
        $this->assertNotEmpty($response->json('units'));
        $this->assertEquals('Indore Nagar Jila', $response->json('units.0.name'));

        $kshetraResponse = $this->actingAs($this->user)->getJson('/toli/baithaks/units?level=kshetra');
        $kshetraResponse->assertOk();
        $kshetraResponse->assertJsonPath('success', true);
        $this->assertEquals('Madhya Kshetra', $kshetraResponse->json('units.0.name'));
    }

    public function test_can_schedule_baithak_with_guests_and_pravaas_details(): void
    {
        $response = $this->actingAs($this->user)->postJson('/toli/baithaks', [
            'unit_level' => 'basti',
            'unit_id' => $this->basti->id,
            'title' => 'विशेष अभ्यास बैठक',
            'baithak_date' => '2026-10-28',
            'guests' => [
                [
                    'name' => 'अनिल जी चौधरी',
                    'mobile' => '9876500000',
                    'daayitwa_name' => 'जिला कार्यवाह',
                    'unit_name' => 'जिला बदरीनाथ',
                    'unit_level' => 'jila',
                    'is_expected' => true,
                ],
            ],
        ]);

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $baithakId = $response->json('baithak.id');

        $this->assertDatabaseHas('baithak_attendees', [
            'baithak_id' => $baithakId,
            'attendee_type' => 'guest',
            'name' => 'अनिल जी चौधरी',
            'daayitwa_name' => 'जिला कार्यवाह',
            'unit_name' => 'जिला बदरीनाथ',
            'is_expected' => true,
        ]);
    }
}
