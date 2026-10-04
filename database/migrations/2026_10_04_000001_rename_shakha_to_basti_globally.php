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
        // 1. Rename table shakhas to bastis
        if (Schema::hasTable('shakhas') && !Schema::hasTable('bastis')) {
            Schema::rename('shakhas', 'bastis');
        }

        // 2. Rename shakha_name to basti_name in bastis table
        if (Schema::hasTable('bastis') && Schema::hasColumn('bastis', 'shakha_name')) {
            Schema::table('bastis', function (Blueprint $table) {
                $table->renameColumn('shakha_name', 'basti_name');
            });
        }

        // 3. Rename shakha_id & is_shakha_toli_member in user_profiles
        if (Schema::hasTable('user_profiles')) {
            Schema::table('user_profiles', function (Blueprint $table) {
                if (Schema::hasColumn('user_profiles', 'shakha_id')) {
                    $table->renameColumn('shakha_id', 'basti_id');
                }
                if (Schema::hasColumn('user_profiles', 'is_shakha_toli_member')) {
                    $table->renameColumn('is_shakha_toli_member', 'is_basti_toli_member');
                }
            });
        }

        // 4. Rename shakha_id in delivery_locations
        if (Schema::hasTable('delivery_locations') && Schema::hasColumn('delivery_locations', 'shakha_id')) {
            Schema::table('delivery_locations', function (Blueprint $table) {
                $table->renameColumn('shakha_id', 'basti_id');
            });
        }

        // 5. Rename shakha_id in orders
        if (Schema::hasTable('orders') && Schema::hasColumn('orders', 'shakha_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->renameColumn('shakha_id', 'basti_id');
            });
        }

        // 6. Rename shakha_id in swayamsevaks
        if (Schema::hasTable('swayamsevaks') && Schema::hasColumn('swayamsevaks', 'shakha_id')) {
            Schema::table('swayamsevaks', function (Blueprint $table) {
                $table->renameColumn('shakha_id', 'basti_id');
            });
        }

        // 7. Update data: toli_inventory_scopes visible_sub_units JSON and unit_type
        if (Schema::hasTable('toli_inventory_scopes')) {
            DB::table('toli_inventory_scopes')->where('unit_type', 'shakha')->update(['unit_type' => 'basti']);

            $scopes = DB::table('toli_inventory_scopes')->get();
            foreach ($scopes as $scope) {
                if (!empty($scope->visible_sub_units)) {
                    $decoded = json_decode($scope->visible_sub_units, true);
                    if (is_array($decoded) && in_array('shakha', $decoded)) {
                        $updated = array_map(fn($item) => $item === 'shakha' ? 'basti' : $item, $decoded);
                        DB::table('toli_inventory_scopes')
                            ->where('id', $scope->id)
                            ->update(['visible_sub_units' => json_encode(array_values(array_unique($updated)))]);
                    }
                }
            }
        }

        // 8. Update Spatie / RBAC Roles & Permissions
        if (Schema::hasTable('roles')) {
            DB::table('roles')->where('name', 'shakha_karyakarta')->update([
                'name' => 'basti_karyakarta',
                'display_name' => 'Basti Karyakarta (बस्ती कार्यकर्ता)',
                'description' => 'Manages Basti toli contacts and monitors local field deliveries.',
            ]);
        }

        if (Schema::hasTable('permissions')) {
            DB::table('permissions')->where('name', 'manage_shakha')->update([
                'name' => 'manage_basti',
                'display_name' => 'Manage Bastis (बस्ती प्रबंधन)',
                'description' => 'Create, edit, and remove Bastis within assigned Nagar jurisdiction.',
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert permissions & roles
        if (Schema::hasTable('permissions')) {
            DB::table('permissions')->where('name', 'manage_basti')->update([
                'name' => 'manage_shakha',
                'display_name' => 'Manage Shakhas (शाखा प्रबंधन)',
                'description' => 'Create, edit, and remove Shakhas within assigned Nagar jurisdiction.',
            ]);
        }

        if (Schema::hasTable('roles')) {
            DB::table('roles')->where('name', 'basti_karyakarta')->update([
                'name' => 'shakha_karyakarta',
                'display_name' => 'Shakha Karyakarta (शाखा कार्यकर्ता)',
                'description' => 'Manages Shakha toli contacts and monitors local field deliveries.',
            ]);
        }

        if (Schema::hasTable('toli_inventory_scopes')) {
            DB::table('toli_inventory_scopes')->where('unit_type', 'basti')->update(['unit_type' => 'shakha']);

            $scopes = DB::table('toli_inventory_scopes')->get();
            foreach ($scopes as $scope) {
                if (!empty($scope->visible_sub_units)) {
                    $decoded = json_decode($scope->visible_sub_units, true);
                    if (is_array($decoded) && in_array('basti', $decoded)) {
                        $updated = array_map(fn($item) => $item === 'basti' ? 'shakha' : $item, $decoded);
                        DB::table('toli_inventory_scopes')
                            ->where('id', $scope->id)
                            ->update(['visible_sub_units' => json_encode(array_values(array_unique($updated)))]);
                    }
                }
            }
        }

        if (Schema::hasTable('swayamsevaks') && Schema::hasColumn('swayamsevaks', 'basti_id')) {
            Schema::table('swayamsevaks', function (Blueprint $table) {
                $table->renameColumn('basti_id', 'shakha_id');
            });
        }

        if (Schema::hasTable('orders') && Schema::hasColumn('orders', 'basti_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->renameColumn('basti_id', 'shakha_id');
            });
        }

        if (Schema::hasTable('delivery_locations') && Schema::hasColumn('delivery_locations', 'basti_id')) {
            Schema::table('delivery_locations', function (Blueprint $table) {
                $table->renameColumn('basti_id', 'shakha_id');
            });
        }

        if (Schema::hasTable('user_profiles')) {
            Schema::table('user_profiles', function (Blueprint $table) {
                if (Schema::hasColumn('user_profiles', 'basti_id')) {
                    $table->renameColumn('basti_id', 'shakha_id');
                }
                if (Schema::hasColumn('user_profiles', 'is_basti_toli_member')) {
                    $table->renameColumn('is_basti_toli_member', 'is_shakha_toli_member');
                }
            });
        }

        if (Schema::hasTable('bastis') && Schema::hasColumn('bastis', 'basti_name')) {
            Schema::table('bastis', function (Blueprint $table) {
                $table->renameColumn('basti_name', 'shakha_name');
            });
        }

        if (Schema::hasTable('bastis') && !Schema::hasTable('shakhas')) {
            Schema::rename('bastis', 'shakhas');
        }
    }
};
