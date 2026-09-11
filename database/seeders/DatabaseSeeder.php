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
            'role' => 'admin',
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

        // 3. Create Sample Products
        $products = [
            [
                'dealer_id' => $dealer1->id,
                'category_id' => $ganvesh->id,
                'name' => 'Full Ganvesh Set (Shirt, Trouser, Cap & Belt)',
                'slug' => 'full-ganvesh-set',
                'sku' => 'GV-SET-001',
                'description' => 'Standard high quality blended fabric tailored for regular and ceremonial gatherings. Includes full set with stitching.',
                'price' => 850.00,
                'stock' => 45,
                'image_url' => '/images/categories/ganvesh.jpg',
                'status' => 'active',
            ],
            [
                'dealer_id' => $dealer1->id,
                'category_id' => $ganvesh->id,
                'name' => 'Pure Cotton Ganvesh Shirt',
                'slug' => 'pure-cotton-ganvesh-shirt',
                'sku' => 'GV-SHT-002',
                'description' => 'Breathable pure cotton fabric shirt with double reinforced stitching and standardized pocket design.',
                'price' => 350.00,
                'stock' => 60,
                'image_url' => '/images/categories/ganvesh.jpg',
                'status' => 'active',
            ],
            [
                'dealer_id' => $dealer1->id,
                'category_id' => $ganvesh->id,
                'name' => 'Durable Ganvesh Belt with Buckle',
                'slug' => 'durable-ganvesh-belt-buckle',
                'sku' => 'GV-BLT-003',
                'description' => 'Premium heavy-duty woven belt with metal adjustment buckle and secure locking mechanism.',
                'price' => 180.00,
                'stock' => 100,
                'image_url' => '/images/categories/ganvesh.jpg',
                'status' => 'active',
            ],
            [
                'dealer_id' => $dealer2->id,
                'category_id' => $books->id,
                'name' => 'Bodh Katha Sangrah (प्रेरक बोध कथाएं)',
                'slug' => 'bodh-katha-sangrah',
                'sku' => 'BK-BDH-101',
                'description' => 'Comprehensive collection of inspiring stories, moral values, and biographical teachings for all ages.',
                'price' => 150.00,
                'stock' => 50,
                'image_url' => '/images/categories/books.png',
                'status' => 'active',
            ],
            [
                'dealer_id' => $dealer2->id,
                'category_id' => $books->id,
                'name' => 'Rashtriya Charitra Nirmaan (राष्ट्र निर्माण की दिशा)',
                'slug' => 'rashtriya-charitra-nirmaan',
                'sku' => 'BK-RCN-102',
                'description' => 'Guiding philosophies on community building, cultural heritage preservation, and selfless service.',
                'price' => 220.00,
                'stock' => 40,
                'image_url' => '/images/categories/books.png',
                'status' => 'active',
            ],
            [
                'dealer_id' => $dealer2->id,
                'category_id' => $books->id,
                'name' => 'Bharat Ki Gauravshali Parampara (सचित्र इतिहास)',
                'slug' => 'bharat-ki-gauravshali-parampara',
                'sku' => 'BK-BGP-103',
                'description' => 'Illustrated historical chronicle of great Indian sages, freedom fighters, and architectural marvels.',
                'price' => 299.00,
                'stock' => 30,
                'image_url' => '/images/categories/books.png',
                'status' => 'active',
            ],
            [
                'dealer_id' => $dealer2->id,
                'category_id' => $ghosh->id,
                'name' => 'Aanaka Ghosh Snare Drum with Strap & Sticks',
                'slug' => 'aanaka-ghosh-snare-drum',
                'sku' => 'GH-ANK-201',
                'description' => 'Professional march rhythm drum crafted with tuned synthetic skin, ergonomic shoulder harness, and hardwood sticks.',
                'price' => 2400.00,
                'stock' => 15,
                'image_url' => '/images/categories/ghosh.jpg',
                'status' => 'active',
            ],
            [
                'dealer_id' => $dealer1->id,
                'category_id' => $ghosh->id,
                'name' => 'Classical Ghosh Brass Vamshi Flute',
                'slug' => 'classical-ghosh-brass-vamshi',
                'sku' => 'GH-VMS-202',
                'description' => 'Precision tuned brass Ghosh Vamshi flute engineered for crisp acoustic projection in open grounds.',
                'price' => 450.00,
                'stock' => 35,
                'image_url' => '/images/categories/ghosh.jpg',
                'status' => 'active',
            ],
            [
                'dealer_id' => $dealer1->id,
                'category_id' => $ghosh->id,
                'name' => 'Natural Ghosh Shankha with Wooden Base',
                'slug' => 'natural-ghosh-shankha',
                'sku' => 'GH-SHK-203',
                'description' => 'Authentic polished natural Shankha with resonant high decibel resonance, complete with carved stand.',
                'price' => 799.00,
                'stock' => 25,
                'image_url' => '/images/categories/ghosh.jpg',
                'status' => 'active',
            ],
        ];

        foreach ($products as $p) {
            Product::create($p);
        }

        // 4. Seed Organizational Structure Hierarchy
        $this->call(OrganizationSeeder::class);

        // 5. Seed Roles and Permissions and sync to existing users
        $this->call(RoleAndPermissionSeeder::class);
    }
}
