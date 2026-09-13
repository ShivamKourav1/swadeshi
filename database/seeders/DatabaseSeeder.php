<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\DeliveryLocation;
use App\Models\Product;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Core Users
        $admin = User::create([
            'name' => 'System Admin',
            'email' => 'admin@ecommerce.com',
            'password' => Hash::make('password'),
            'role' => 'superadmin',
            'phone' => '+15550100',
            'status' => 'active',
        ]);
        UserProfile::create(['user_id' => $admin->id]);

        $dealer1 = User::create([
            'name' => 'TechZone Retailers',
            'email' => 'dealer@ecommerce.com',
            'password' => Hash::make('password'),
            'role' => 'dealer',
            'phone' => '+15550101',
            'status' => 'active',
        ]);
        UserProfile::create([
            'user_id' => $dealer1->id,
            'business_name' => 'TechZone Electronics Ltd',
            'business_address' => '100 Innovation Way, Tech Park, CA',
            'bio' => 'Authorized dealer for high-end electronics and mobile accessories.',
        ]);

        $dealer2 = User::create([
            'name' => 'StyleHub Apparel',
            'email' => 'dealer2@ecommerce.com',
            'password' => Hash::make('password'),
            'role' => 'dealer',
            'phone' => '+15550102',
            'status' => 'active',
        ]);
        UserProfile::create([
            'user_id' => $dealer2->id,
            'business_name' => 'StyleHub Fashion Store',
            'business_address' => '450 Fashion Avenue, NY',
            'bio' => 'Premium apparel, shoes, and lifestyle goods.',
        ]);

        $deliveryPartner = User::create([
            'name' => 'Swift Courier Agent',
            'email' => 'delivery@ecommerce.com',
            'password' => Hash::make('password'),
            'role' => 'delivery_partner',
            'phone' => '+15550103',
            'status' => 'active',
        ]);
        UserProfile::create([
            'user_id' => $deliveryPartner->id,
            'vehicle_type' => 'Van',
            'vehicle_number' => 'SWIFT-9082',
            'bio' => 'Express local delivery partner with 100% COD handling.',
        ]);

        $customer = User::create([
            'name' => 'John Customer',
            'email' => 'customer@ecommerce.com',
            'password' => Hash::make('password'),
            'role' => 'customer',
            'phone' => '+15550104',
            'status' => 'active',
        ]);
        UserProfile::create(['user_id' => $customer->id]);

        // Customer Default Delivery Location
        DeliveryLocation::create([
            'user_id' => $customer->id,
            'label' => 'Home Address',
            'recipient_name' => 'John Customer',
            'phone' => '+15550104',
            'address_line_1' => '742 Evergreen Terrace',
            'address_line_2' => 'Apt 4B',
            'city' => 'Springfield',
            'state' => 'OR',
            'postal_code' => '97477',
            'country' => 'USA',
            'latitude' => 44.0462,
            'longitude' => -123.0220,
            'is_default' => true,
        ]);

        // 2. Create Categories
        $ganvesh = Category::create([
            'name' => 'Ganvesh (गणवेश)',
            'slug' => 'ganvesh',
            'image_url' => '/images/categories/ganvesh.jpg',
            'description' => 'Complete uniform sets, shirts, trousers, belts, socks, and ceremonial dress (गणवेश).',
            'is_active' => true,
        ]);

        $books = Category::create([
            'name' => 'Books (पुस्तकें)',
            'slug' => 'books',
            'image_url' => '/images/categories/books.png',
            'description' => 'Literature, historical books, philosophical texts, and educational publications (पुस्तकें).',
            'is_active' => true,
        ]);

        $ghosh = Category::create([
            'name' => 'Ghosh (घोष)',
            'slug' => 'ghosh',
            'image_url' => '/images/categories/ghosh.jpg',
            'description' => 'Musical instruments, Aanaka (snare drum), Panava (side drum), Shankha, and Vamshi flutes (घोष सामग्री).',
            'is_active' => true,
        ]);

        // 3. Seed Products using ProductSeeder
        $this->call(ProductSeeder::class);

        // 4. Seed Organizational Structure Hierarchy
        $this->call(OrganizationSeeder::class);

        // 5. Seed Roles and Permissions and sync to existing users
        $this->call(RoleAndPermissionSeeder::class);
    }
}
