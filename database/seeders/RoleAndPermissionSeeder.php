<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Define all Permissions (Rights)
        $permissions = [
            // Organizational Unit Permissions
            [
                'name' => 'manage_kshetra',
                'display_name' => 'Manage Kshetras (क्षेत्र प्रबंधन)',
                'group' => 'Organization Units',
                'description' => 'Create, edit, and remove Kshetras and assigned toli members.',
            ],
            [
                'name' => 'manage_prant',
                'display_name' => 'Manage Prants (प्रान्त प्रबंधन)',
                'group' => 'Organization Units',
                'description' => 'Create, edit, and remove Prants within assigned Kshetra jurisdiction.',
            ],
            [
                'name' => 'manage_vibhag',
                'display_name' => 'Manage Vibhags (विभाग प्रबंधन)',
                'group' => 'Organization Units',
                'description' => 'Create, edit, and remove Vibhags within assigned Prant jurisdiction.',
            ],
            [
                'name' => 'manage_jila',
                'display_name' => 'Manage Jilas (जिला प्रबंधन)',
                'group' => 'Organization Units',
                'description' => 'Create, edit, and remove Jilas within assigned Vibhag jurisdiction.',
            ],
            [
                'name' => 'manage_nagar',
                'display_name' => 'Manage Nagars (नगर प्रबंधन)',
                'group' => 'Organization Units',
                'description' => 'Create, edit, and remove Nagars within assigned Jila jurisdiction.',
            ],
            [
                'name' => 'manage_shakha',
                'display_name' => 'Manage Shakhas (शाखा प्रबंधन)',
                'group' => 'Organization Units',
                'description' => 'Create, edit, and remove Shakhas within assigned Nagar jurisdiction.',
            ],
            [
                'name' => 'manage_toli',
                'display_name' => 'Manage Toli Members & Contacts (टोली संपर्क)',
                'group' => 'Organization Units',
                'description' => 'Add, edit designations, and update contact numbers for unit toli members.',
            ],
            [
                'name' => 'view_unit_directory',
                'display_name' => 'View Unit Directory (इकाई निर्देशिका देखें)',
                'group' => 'Organization Units',
                'description' => 'Access and browse the organizational structure directory and contact book.',
            ],

            // Karyakarta Intelligence & Analytics
            [
                'name' => 'view_karyakarta_dashboard',
                'display_name' => 'View Karyakarta Analytics Dashboard',
                'group' => 'Karyakarta Intelligence',
                'description' => 'Access field order tracking, delivery stats, and organizational reports.',
            ],

            // Administration & User Management
            [
                'name' => 'manage_users',
                'display_name' => 'Manage Users & Accounts',
                'group' => 'Administration',
                'description' => 'Create, onboard, edit users, assign jurisdiction, and toggle statuses.',
            ],
            [
                'name' => 'manage_roles',
                'display_name' => 'Manage Roles & Rights (भूमिका व अधिकार प्रबंधन)',
                'group' => 'Administration',
                'description' => 'Create and customize roles, assign rights, and grant permissions.',
            ],

            // E-Commerce & Dealer Operations
            [
                'name' => 'manage_products',
                'display_name' => 'Manage Catalog & Products',
                'group' => 'E-Commerce',
                'description' => 'Add, edit, and delete products, manage inventory and pricing.',
            ],
            [
                'name' => 'manage_categories',
                'display_name' => 'Manage Categories',
                'group' => 'E-Commerce',
                'description' => 'Create and manage item categories.',
            ],
            [
                'name' => 'manage_orders',
                'display_name' => 'Manage Store Orders & Restocking',
                'group' => 'E-Commerce',
                'description' => 'Process dealer orders and confirm stock arrivals for cancelled items.',
            ],
            [
                'name' => 'manage_returns',
                'display_name' => 'Manage Return Requests',
                'group' => 'E-Commerce',
                'description' => 'Accept, reject, and fulfill customer return requests.',
            ],

            // Delivery Operations
            [
                'name' => 'deliver_orders',
                'display_name' => 'Deliver Orders & Collect Payment',
                'group' => 'Delivery Partner',
                'description' => 'Claim delivery assignments, collect COD cash, and update delivery status.',
            ],
        ];

        $permissionModels = [];
        foreach ($permissions as $p) {
            $permissionModels[$p['name']] = Permission::updateOrCreate(['name' => $p['name']], $p);
        }

        // 2. Define Standard Roles
        $roles = [
            'admin' => [
                'name' => 'admin',
                'display_name' => 'System Administrator (प्रशासक)',
                'description' => 'Full administrative access to manage all modules, users, roles, and units.',
                'is_system' => true,
                'permissions' => array_column($permissions, 'name'),
            ],
            'kshetra_karyakarta' => [
                'name' => 'kshetra_karyakarta',
                'display_name' => 'Kshetra Karyakarta (क्षेत्र कार्यकर्ता)',
                'description' => 'Oversees Kshetra jurisdiction. Manages Prants, Vibhags, Jilas, Nagars, and Shakhas.',
                'is_system' => false,
                'permissions' => [
                    'manage_prant',
                    'manage_vibhag',
                    'manage_jila',
                    'manage_nagar',
                    'manage_shakha',
                    'manage_toli',
                    'view_unit_directory',
                    'view_karyakarta_dashboard',
                ],
            ],
            'prant_karyakarta' => [
                'name' => 'prant_karyakarta',
                'display_name' => 'Prant Karyakarta (प्रान्त कार्यकर्ता)',
                'description' => 'Oversees Prant jurisdiction. Manages Vibhags, Jilas, Nagars, and Shakhas.',
                'is_system' => false,
                'permissions' => [
                    'manage_vibhag',
                    'manage_jila',
                    'manage_nagar',
                    'manage_shakha',
                    'manage_toli',
                    'view_unit_directory',
                    'view_karyakarta_dashboard',
                ],
            ],
            'vibhag_karyakarta' => [
                'name' => 'vibhag_karyakarta',
                'display_name' => 'Vibhag Karyakarta (विभाग कार्यकर्ता)',
                'description' => 'Oversees Vibhag jurisdiction. Manages Jilas, Nagars, and Shakhas.',
                'is_system' => false,
                'permissions' => [
                    'manage_jila',
                    'manage_nagar',
                    'manage_shakha',
                    'manage_toli',
                    'view_unit_directory',
                    'view_karyakarta_dashboard',
                ],
            ],
            'jila_karyakarta' => [
                'name' => 'jila_karyakarta',
                'display_name' => 'Jila Karyakarta (जिला कार्यकर्ता)',
                'description' => 'Oversees Jila jurisdiction. Manages Nagars and Shakhas.',
                'is_system' => false,
                'permissions' => [
                    'manage_nagar',
                    'manage_shakha',
                    'manage_toli',
                    'view_unit_directory',
                    'view_karyakarta_dashboard',
                ],
            ],
            'nagar_karyakarta' => [
                'name' => 'nagar_karyakarta',
                'display_name' => 'Nagar Karyakarta (नगर कार्यकर्ता)',
                'description' => 'Oversees Nagar jurisdiction. Manages local Shakhas and Toli contacts.',
                'is_system' => false,
                'permissions' => [
                    'manage_shakha',
                    'manage_toli',
                    'view_unit_directory',
                    'view_karyakarta_dashboard',
                ],
            ],
            'shakha_karyakarta' => [
                'name' => 'shakha_karyakarta',
                'display_name' => 'Shakha Karyakarta (शाखा कार्यकर्ता)',
                'description' => 'Manages Shakha toli contacts and monitors local field deliveries.',
                'is_system' => false,
                'permissions' => [
                    'manage_toli',
                    'view_unit_directory',
                    'view_karyakarta_dashboard',
                ],
            ],
            'karyakarta' => [
                'name' => 'karyakarta',
                'display_name' => 'General Karyakarta (सामान्य कार्यकर्ता)',
                'description' => 'Standard organizational officer with permissions to manage assigned Nagars and Shakhas.',
                'is_system' => false,
                'permissions' => [
                    'manage_nagar',
                    'manage_shakha',
                    'manage_toli',
                    'view_unit_directory',
                    'view_karyakarta_dashboard',
                ],
            ],
            'dealer' => [
                'name' => 'dealer',
                'display_name' => 'Verified Store Dealer (विक्रेता)',
                'description' => 'Manages products, categories, orders, restocks, and returns.',
                'is_system' => true,
                'permissions' => [
                    'manage_products',
                    'manage_categories',
                    'manage_orders',
                    'manage_returns',
                ],
            ],
            'delivery_partner' => [
                'name' => 'delivery_partner',
                'display_name' => 'Delivery Partner (वितरण सहयोगी)',
                'description' => 'Picks up parcels, updates live tracking, and collects cash on delivery.',
                'is_system' => true,
                'permissions' => [
                    'deliver_orders',
                ],
            ],
            'customer' => [
                'name' => 'customer',
                'display_name' => 'Customer / Member (ग्राहक)',
                'description' => 'Standard customer who browses catalog, places orders, and requests returns.',
                'is_system' => true,
                'permissions' => [],
            ],
        ];

        foreach ($roles as $roleKey => $roleData) {
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

        // 3. Link existing users in database to their primary roles in role_user pivot
        $users = User::all();
        foreach ($users as $user) {
            $matchedRole = Role::where('name', $user->role)->first();
            if ($matchedRole) {
                $user->roles()->syncWithoutDetaching([$matchedRole->id]);
            }
        }

        // Assign hierarchical karyakarta roles to sample karyakartas
        $jilaUser = User::where('email', 'karyakarta@ecommerce.com')->first();
        if ($jilaUser) {
            $jilaUser->assignRole('jila_karyakarta');
        }
        $vibhagUser = User::where('email', 'karyakarta_vibhag@ecommerce.com')->first();
        if ($vibhagUser) {
            $vibhagUser->assignRole('vibhag_karyakarta');
        }
        $nagarUser = User::where('email', 'karyakarta_nagar@ecommerce.com')->first();
        if ($nagarUser) {
            $nagarUser->assignRole('nagar_karyakarta');
        }
    }
}
