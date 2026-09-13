<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add Toli member boolean indicators to user_profiles table if they do not exist
        Schema::table('user_profiles', function (Blueprint $table) {
            if (!Schema::hasColumn('user_profiles', 'is_shakha_toli_member')) {
                $table->boolean('is_shakha_toli_member')->default(false)->after('shakha_id');
            }
            if (!Schema::hasColumn('user_profiles', 'is_nagar_toli_member')) {
                $table->boolean('is_nagar_toli_member')->default(false)->after('is_shakha_toli_member');
            }
            if (!Schema::hasColumn('user_profiles', 'is_jila_toli_member')) {
                $table->boolean('is_jila_toli_member')->default(false)->after('is_nagar_toli_member');
            }
            if (!Schema::hasColumn('user_profiles', 'is_vibhag_toli_member')) {
                $table->boolean('is_vibhag_toli_member')->default(false)->after('is_jila_toli_member');
            }
            if (!Schema::hasColumn('user_profiles', 'is_kshetra_toli_member')) {
                $table->boolean('is_kshetra_toli_member')->default(false)->after('is_vibhag_toli_member');
            }
        });

        // 2. Ensure superadmin role exists (rename previous 'admin' or use existing 'superadmin')
        $existingSuperadmin = DB::table('roles')->where('name', 'superadmin')->first();
        if ($existingSuperadmin) {
            $superadminId = $existingSuperadmin->id;
            DB::table('roles')->where('id', $superadminId)->update([
                'display_name' => 'Superadmin (मुख्य व्यवस्थापक / सुपर एडमिन)',
                'description' => 'Unrestricted global administrator with authority over all modules, users, roles, system settings, and all jurisdictions.',
                'is_system' => true,
                'updated_at' => now(),
            ]);
        } else {
            $existingAdminRole = DB::table('roles')->where('name', 'admin')->first();
            if ($existingAdminRole) {
                DB::table('roles')->where('id', $existingAdminRole->id)->update([
                    'name' => 'superadmin',
                    'display_name' => 'Superadmin (मुख्य व्यवस्थापक / सुपर एडमिन)',
                    'description' => 'Unrestricted global administrator with authority over all modules, users, roles, system settings, and all jurisdictions.',
                    'is_system' => true,
                    'updated_at' => now(),
                ]);
                $superadminId = $existingAdminRole->id;
            } else {
                $superadminId = DB::table('roles')->insertGetId([
                    'name' => 'superadmin',
                    'display_name' => 'Superadmin (मुख्य व्यवस्थापक / सुपर एडमिन)',
                    'description' => 'Unrestricted global administrator with authority over all modules, users, roles, system settings, and all jurisdictions.',
                    'is_system' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // Attach all permissions to superadmin
        $allPermissionIds = DB::table('permissions')->pluck('id');
        foreach ($allPermissionIds as $permId) {
            $exists = DB::table('permission_role')
                ->where('role_id', $superadminId)
                ->where('permission_id', $permId)
                ->exists();
            if (!$exists) {
                DB::table('permission_role')->insert([
                    'role_id' => $superadminId,
                    'permission_id' => $permId,
                ]);
            }
        }

        // 3. Update existing users with primary role 'admin' to 'superadmin'
        DB::table('users')->where('role', 'admin')->update(['role' => 'superadmin']);

        // 4. Create the new scoped 'admin' role (Toli Administrator) if not exists
        $existingScopedAdmin = DB::table('roles')->where('name', 'admin')->first();
        if ($existingScopedAdmin) {
            $newAdminId = $existingScopedAdmin->id;
            DB::table('roles')->where('id', $newAdminId)->update([
                'display_name' => 'Toli Administrator (टोली व्यवस्थापक / प्रशासक)',
                'description' => 'Scoped administrative access for karyakartas belonging to an organizational toli (Shakha, Nagar, Jila, Vibhag, or Kshetra).',
                'is_system' => true,
                'updated_at' => now(),
            ]);
        } else {
            $newAdminId = DB::table('roles')->insertGetId([
                'name' => 'admin',
                'display_name' => 'Toli Administrator (टोली व्यवस्थापक / प्रशासक)',
                'description' => 'Scoped administrative access for karyakartas belonging to an organizational toli (Shakha, Nagar, Jila, Vibhag, or Kshetra).',
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Attach scoped admin permissions to the new toli admin role
        $scopedPermissionNames = [
            'manage_users',
            'manage_toli',
            'view_unit_directory',
            'view_karyakarta_dashboard',
        ];
        $scopedPermissionIds = DB::table('permissions')->whereIn('name', $scopedPermissionNames)->pluck('id');
        foreach ($scopedPermissionIds as $permId) {
            $exists = DB::table('permission_role')
                ->where('role_id', $newAdminId)
                ->where('permission_id', $permId)
                ->exists();
            if (!$exists) {
                DB::table('permission_role')->insert([
                    'role_id' => $newAdminId,
                    'permission_id' => $permId,
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert users with 'superadmin' role back to 'admin'
        DB::table('users')->where('role', 'superadmin')->update(['role' => 'admin']);

        // Remove new admin role
        DB::table('roles')->where('name', 'admin')->delete();

        // Rename superadmin back to admin
        DB::table('roles')->where('name', 'superadmin')->update([
            'name' => 'admin',
            'display_name' => 'Admin (व्यवस्थापक / प्रशासक)',
        ]);

        Schema::table('user_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'is_shakha_toli_member',
                'is_nagar_toli_member',
                'is_jila_toli_member',
                'is_vibhag_toli_member',
                'is_kshetra_toli_member',
            ]);
        });
    }
};
