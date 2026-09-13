<?php

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations to guarantee that standard roles and permissions exist in database.
     */
    public function up(): void
    {
        $permissions = [
            ['name' => 'manage_kshetra', 'display_name' => 'Manage Kshetras (क्षेत्र प्रबंधन)', 'group' => 'Organization Units'],
            ['name' => 'manage_prant', 'display_name' => 'Manage Prants (प्रान्त प्रबंधन)', 'group' => 'Organization Units'],
            ['name' => 'manage_vibhag', 'display_name' => 'Manage Vibhags (विभाग प्रबंधन)', 'group' => 'Organization Units'],
            ['name' => 'manage_jila', 'display_name' => 'Manage Jilas (जिला प्रबंधन)', 'group' => 'Organization Units'],
            ['name' => 'manage_nagar', 'display_name' => 'Manage Nagars (नगर प्रबंधन)', 'group' => 'Organization Units'],
            ['name' => 'manage_shakha', 'display_name' => 'Manage Shakhas (शाखा प्रबंधन)', 'group' => 'Organization Units'],
            ['name' => 'manage_toli', 'display_name' => 'Manage Toli Members & Contacts (टोली संपर्क)', 'group' => 'Organization Units'],
            ['name' => 'view_unit_directory', 'display_name' => 'View Unit Directory (इकाई निर्देशिका देखें)', 'group' => 'Organization Units'],
            ['name' => 'view_karyakarta_dashboard', 'display_name' => 'View Karyakarta Analytics Dashboard', 'group' => 'Karyakarta Intelligence'],
            ['name' => 'manage_users', 'display_name' => 'Manage Users & Accounts', 'group' => 'Administration'],
            ['name' => 'manage_roles', 'display_name' => 'Manage Roles & Rights (भूमिका व अधिकार प्रबंधन)', 'group' => 'Administration'],
            ['name' => 'manage_products', 'display_name' => 'Manage Catalog & Products', 'group' => 'E-Commerce'],
            ['name' => 'manage_categories', 'display_name' => 'Manage Categories', 'group' => 'E-Commerce'],
            ['name' => 'manage_orders', 'display_name' => 'Manage Store Orders & Restocking', 'group' => 'E-Commerce'],
            ['name' => 'manage_returns', 'display_name' => 'Manage Return Requests', 'group' => 'E-Commerce'],
            ['name' => 'deliver_orders', 'display_name' => 'Deliver Orders & Collect Payment', 'group' => 'Delivery Partner'],
        ];

        foreach ($permissions as $p) {
            Permission::updateOrCreate(['name' => $p['name']], $p);
        }

        $roles = [
            [
                'name' => 'dealer',
                'display_name' => 'Dealer (विक्रेता / डीलर)',
                'description' => 'Certified vendor managing products, inventory, orders, restocks, and returns.',
                'is_system' => true,
                'permissions' => ['manage_products', 'manage_categories', 'manage_orders', 'manage_returns'],
            ],
            [
                'name' => 'customer',
                'display_name' => 'Customer (ग्राहक / क्रेता)',
                'description' => 'Retail buyer browsing catalog, placing orders, tracking deliveries, and requesting returns.',
                'is_system' => true,
                'permissions' => [],
            ],
            [
                'name' => 'delivery_partner',
                'display_name' => 'Delivery Partner (वितरण साथी)',
                'description' => 'Field logistics courier claiming parcels, updating live status, and collecting COD payments.',
                'is_system' => true,
                'permissions' => ['deliver_orders'],
            ],
            [
                'name' => 'admin',
                'display_name' => 'Admin (व्यवस्थापक / प्रशासक)',
                'description' => 'Platform administrator managing users, roles, rights, and system settings.',
                'is_system' => true,
                'permissions' => array_column($permissions, 'name'),
            ],
            [
                'name' => 'karyakarta',
                'display_name' => 'Karyakarta (सामान्य कार्यकर्ता)',
                'description' => 'Regional officer coordinating community distribution and managing assigned local units.',
                'is_system' => false,
                'permissions' => ['manage_nagar', 'manage_shakha', 'manage_toli', 'view_unit_directory', 'view_karyakarta_dashboard'],
            ],
            [
                'name' => 'jila_karyakarta',
                'display_name' => 'Jila Karyakarta (जिला कार्यकर्ता)',
                'description' => 'District-level coordinator managing Nagars, Shakhas, and toli members within assigned Jila.',
                'is_system' => false,
                'permissions' => ['manage_nagar', 'manage_shakha', 'manage_toli', 'view_unit_directory', 'view_karyakarta_dashboard'],
            ],
            [
                'name' => 'nagar_karyakarta',
                'display_name' => 'Nagar Karyakarta (नगर कार्यकर्ता)',
                'description' => 'City/town coordinator managing local Shakhas and toli members within assigned Nagar.',
                'is_system' => false,
                'permissions' => ['manage_shakha', 'manage_toli', 'view_unit_directory', 'view_karyakarta_dashboard'],
            ],
            [
                'name' => 'shakha_karyakarta',
                'display_name' => 'Shakha Karyakarta (शाखा कार्यकर्ता)',
                'description' => 'Community unit coordinator managing local Shakha toli contacts.',
                'is_system' => false,
                'permissions' => ['manage_toli', 'view_unit_directory', 'view_karyakarta_dashboard'],
            ],
            [
                'name' => 'vibhag_karyakarta',
                'display_name' => 'Vibhag Karyakarta (विभाग कार्यकर्ता)',
                'description' => 'Division-level coordinator overseeing multiple Jilas.',
                'is_system' => false,
                'permissions' => ['manage_jila', 'manage_nagar', 'manage_shakha', 'manage_toli', 'view_unit_directory', 'view_karyakarta_dashboard'],
            ],
            [
                'name' => 'prant_karyakarta',
                'display_name' => 'Prant Karyakarta (प्रान्त कार्यकर्ता)',
                'description' => 'State-level coordinator overseeing Vibhags and Jilas.',
                'is_system' => false,
                'permissions' => ['manage_vibhag', 'manage_jila', 'manage_nagar', 'manage_shakha', 'manage_toli', 'view_unit_directory', 'view_karyakarta_dashboard'],
            ],
            [
                'name' => 'kshetra_karyakarta',
                'display_name' => 'Kshetra Karyakarta (क्षेत्र कार्यकर्ता)',
                'description' => 'Zonal-level coordinator overseeing Prants.',
                'is_system' => false,
                'permissions' => ['manage_prant', 'manage_vibhag', 'manage_jila', 'manage_nagar', 'manage_shakha', 'manage_toli', 'view_unit_directory', 'view_karyakarta_dashboard'],
            ],
        ];

        foreach ($roles as $roleData) {
            $role = Role::updateOrCreate(
                ['name' => $roleData['name']],
                [
                    'display_name' => $roleData['display_name'],
                    'description' => $roleData['description'],
                    'is_system' => $roleData['is_system'],
                ]
            );

            $role->syncPermissions($roleData['permissions']);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    }
};
