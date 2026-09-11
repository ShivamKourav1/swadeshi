<?php

namespace Tests\Feature;

use App\Models\Jila;
use App\Models\Kshetra;
use App\Models\Nagar;
use App\Models\Permission;
use App\Models\Prant;
use App\Models\Role;
use App\Models\Shakha;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\Vibhag;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleAndPermissionRbacTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Kshetra $kshetra;
    private Prant $prant;
    private Vibhag $vibhag;
    private Jila $jila1;
    private Jila $jila2;
    private Nagar $nagarInJila1;
    private Nagar $nagarInJila2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleAndPermissionSeeder::class);

        $this->admin = User::factory()->create(['role' => 'admin']);
        UserProfile::create(['user_id' => $this->admin->id]);
        $this->admin->assignRole('admin');

        $this->kshetra = Kshetra::create(['kshetra_name' => 'Madhya Kshetra']);
        $this->prant = Prant::create(['kshetra_id' => $this->kshetra->id, 'prant_name' => 'Malwa Prant']);
        $this->vibhag = Vibhag::create(['prant_id' => $this->prant->id, 'vibhag_name' => 'Indore Vibhag']);

        $this->jila1 = Jila::create(['vibhag_id' => $this->vibhag->id, 'jila_name' => 'Badrinath Jila']);
        $this->jila2 = Jila::create(['vibhag_id' => $this->vibhag->id, 'jila_name' => 'Rameshwaram Jila']);

        $this->nagarInJila1 = Nagar::create(['jila_id' => $this->jila1->id, 'nagar_name' => 'Madhav Nagar']);
        $this->nagarInJila2 = Nagar::create(['jila_id' => $this->jila2->id, 'nagar_name' => 'Ram Nagar']);
    }

    public function test_admin_can_view_roles_and_rights_index(): void
    {
        $response = $this->actingAs($this->admin)->get(route('admin.roles.index'));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Roles/Index')
            ->has('roles')
            ->has('allPermissions')
            ->has('permissionsByGroup')
        );
    }

    public function test_admin_can_create_custom_role_with_permissions(): void
    {
        $response = $this->actingAs($this->admin)->post(route('admin.roles.store'), [
            'name' => 'mandal_karyakarta',
            'display_name' => 'Mandal Karyakarta',
            'description' => 'Oversees mandal units.',
            'permissions' => ['manage_nagar', 'manage_shakha', 'view_unit_directory'],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('roles', ['name' => 'mandal_karyakarta', 'is_system' => false]);

        $role = Role::where('name', 'mandal_karyakarta')->first();
        $this->assertTrue($role->hasPermission('manage_nagar'));
        $this->assertTrue($role->hasPermission('manage_shakha'));
        $this->assertFalse($role->hasPermission('manage_kshetra'));
    }

    public function test_admin_can_update_role_permissions(): void
    {
        $role = Role::where('name', 'jila_karyakarta')->first();
        $this->assertNotNull($role);

        $response = $this->actingAs($this->admin)->put(route('admin.roles.update', $role->id), [
            'display_name' => 'Jila Karyakarta (Updated)',
            'description' => 'Updated description',
            'permissions' => ['manage_jila', 'manage_nagar', 'manage_shakha', 'manage_toli', 'view_unit_directory'],
        ]);

        $response->assertRedirect();
        $role->refresh();
        $this->assertTrue($role->hasPermission('manage_jila'));
    }

    public function test_cannot_delete_system_role(): void
    {
        $adminRole = Role::where('name', 'admin')->first();
        $response = $this->actingAs($this->admin)->delete(route('admin.roles.destroy', $adminRole->id));
        $response->assertSessionHas('error');
        $this->assertDatabaseHas('roles', ['name' => 'admin']);
    }

    public function test_admin_can_delete_custom_role(): void
    {
        $customRole = Role::create([
            'name' => 'temporary_officer',
            'display_name' => 'Temporary Officer',
            'is_system' => false,
        ]);

        $response = $this->actingAs($this->admin)->delete(route('admin.roles.destroy', $customRole->id));
        $response->assertRedirect();
        $this->assertDatabaseMissing('roles', ['id' => $customRole->id]);
    }

    public function test_admin_can_edit_user_roles_and_jurisdiction(): void
    {
        $user = User::factory()->create(['role' => 'karyakarta']);
        UserProfile::create(['user_id' => $user->id]);

        $jilaRole = Role::where('name', 'jila_karyakarta')->first();

        $response = $this->actingAs($this->admin)->put(route('admin.users.update', $user->id), [
            'name' => 'Updated Karyakarta',
            'email' => $user->email,
            'role' => 'karyakarta',
            'role_ids' => [$jilaRole->id],
            'status' => 'active',
            'jila_id' => $this->jila1->id,
        ]);

        $response->assertRedirect(route('admin.users.index'));

        $user->refresh();
        $this->assertEquals('Updated Karyakarta', $user->name);
        $this->assertEquals($this->jila1->id, $user->profile->jila_id);
        $this->assertTrue($user->hasRole('jila_karyakarta'));
        $this->assertTrue($user->hasPermission('manage_shakha'));
    }

    public function test_jila_karyakarta_cannot_manage_higher_units_like_kshetra(): void
    {
        $user = User::factory()->create(['role' => 'karyakarta']);
        UserProfile::create(['user_id' => $user->id, 'jila_id' => $this->jila1->id]);
        $user->assignRole('jila_karyakarta');

        // Jila karyakarta attempts to create a Kshetra
        $response = $this->actingAs($user)->post(route('karyakarta.units.store', ['unitType' => 'kshetra']), [
            'kshetra_name' => 'Illegal Kshetra',
        ]);

        $response->assertStatus(403);
    }

    public function test_jila_karyakarta_cannot_create_shakha_in_different_jila_jurisdiction(): void
    {
        $user = User::factory()->create(['role' => 'karyakarta']);
        UserProfile::create(['user_id' => $user->id, 'jila_id' => $this->jila1->id]); // Assigned to Jila 1
        $user->assignRole('jila_karyakarta');

        // Attempt to create Shakha under nagarInJila2 (Jila 2) -> Should be rejected
        $response = $this->actingAs($user)->post(route('karyakarta.units.store', ['unitType' => 'shakha']), [
            'nagar_id' => $this->nagarInJila2->id,
            'shakha_name' => 'Out of Boundary Shakha',
            'aayu_varg' => 'Baal',
            'type' => 'dainik',
            'status' => 'Active',
        ]);

        $response->assertStatus(403);
    }

    public function test_jila_karyakarta_can_create_shakha_within_their_assigned_jila(): void
    {
        $user = User::factory()->create(['role' => 'karyakarta']);
        UserProfile::create(['user_id' => $user->id, 'jila_id' => $this->jila1->id]); // Assigned to Jila 1
        $user->assignRole('jila_karyakarta');

        // Create Shakha under nagarInJila1 (Jila 1) -> Should succeed
        $response = $this->actingAs($user)->post(route('karyakarta.units.store', ['unitType' => 'shakha']), [
            'nagar_id' => $this->nagarInJila1->id,
            'shakha_name' => 'Authorized Badrinath Shakha',
            'aayu_varg' => 'Vyavsai',
            'type' => 'dainik',
            'status' => 'Active',
            'toli' => [
                'mukhya_shikshak' => ['name' => 'Pramod Ji', 'contact' => '+91 9826090001'],
            ],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('shakhas', [
            'shakha_name' => 'Authorized Badrinath Shakha',
            'nagar_id' => $this->nagarInJila1->id,
        ]);
    }

    public function test_jila_karyakarta_cannot_delete_shakha_outside_their_jila(): void
    {
        $user = User::factory()->create(['role' => 'karyakarta']);
        UserProfile::create(['user_id' => $user->id, 'jila_id' => $this->jila1->id]);
        $user->assignRole('jila_karyakarta');

        $foreignShakha = Shakha::create([
            'nagar_id' => $this->nagarInJila2->id, // Belongs to Jila 2
            'shakha_name' => 'Foreign Shakha',
            'aayu_varg' => 'Baal',
            'type' => 'dainik',
            'status' => 'Active',
        ]);

        $response = $this->actingAs($user)->delete(route('karyakarta.units.destroy', [
            'unitType' => 'shakha',
            'id' => $foreignShakha->id,
        ]));

        $response->assertStatus(403);
        $this->assertDatabaseHas('shakhas', ['id' => $foreignShakha->id]);
    }
}
