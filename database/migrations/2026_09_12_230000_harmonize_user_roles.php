<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $karyakartaRoleNames = [
            'karyakarta',
            'kshetra_karyakarta',
            'prant_karyakarta',
            'vibhag_karyakarta',
            'jila_karyakarta',
            'nagar_karyakarta',
            'shakha_karyakarta',
        ];

        $users = User::with('roles')->get();
        foreach ($users as $user) {
            $userRoleNames = $user->roles->pluck('name')->toArray();

            if (in_array('admin', $userRoleNames)) {
                if ($user->role !== 'admin') {
                    $user->update(['role' => 'admin']);
                }
            } elseif (array_intersect($karyakartaRoleNames, $userRoleNames) || str_contains($user->role, 'karyakarta')) {
                if ($user->role !== 'karyakarta') {
                    $user->update(['role' => 'karyakarta']);
                }
            } elseif (in_array('dealer', $userRoleNames)) {
                if ($user->role !== 'dealer') {
                    $user->update(['role' => 'dealer']);
                }
            } elseif (in_array('delivery_partner', $userRoleNames)) {
                if ($user->role !== 'delivery_partner') {
                    $user->update(['role' => 'delivery_partner']);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Data harmonization fix
    }
};
