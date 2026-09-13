<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Services\ShakhaProductService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds for all official Shakha products and standard catalog.
     */
    public function run(): void
    {
        // 1. Ensure primary dealer exists
        $dealer = User::where('role', 'dealer')->first();
        if (!$dealer) {
            $dealer = User::create([
                'name' => 'Swadeshi Bhandar Vendor',
                'email' => 'dealer@ecommerce.com',
                'password' => Hash::make('password'),
                'role' => 'dealer',
                'phone' => '+91 9826012345',
                'status' => 'active',
            ]);
            $dealer->profile()->create([
                'business_name' => 'Swadeshi Sangathan Store',
                'business_address' => 'Station Road, Bhopal, MP',
                'bio' => 'Authorized supplier for all certified Shakha & Ganvesh requirements.',
            ]);
        }

        // 2. Ensure categories exist
        $ganvesh = Category::firstOrCreate(
            ['slug' => 'ganvesh'],
            [
                'name' => 'Ganvesh (गणवेश)',
                'slug' => 'ganvesh',
                'image_url' => '/images/categories/ganvesh.jpg',
                'description' => 'Complete uniform sets, shirts, trousers, belts, socks, and ceremonial dress (गणवेश).',
                'is_active' => true,
            ]
        );

        $books = Category::firstOrCreate(
            ['slug' => 'books'],
            [
                'name' => 'Books (पुस्तकें)',
                'slug' => 'books',
                'image_url' => '/images/categories/books.png',
                'description' => 'Literature, historical books, philosophical texts, and educational publications (पुस्तकें).',
                'is_active' => true,
            ]
        );

        $ghosh = Category::firstOrCreate(
            ['slug' => 'ghosh'],
            [
                'name' => 'Ghosh (घोष)',
                'slug' => 'ghosh',
                'image_url' => '/images/categories/ghosh.jpg',
                'description' => 'Musical instruments, Aanaka (snare drum), Panava (side drum), Shankha, and Vamshi flutes (घोष सामग्री).',
                'is_active' => true,
            ]
        );

        // 3. Seed the 23 Authentic Shakha Products for this Dealer
        ShakhaProductService::createForDealer($dealer);

        // 4. Also seed standard Ghosh & Books items if not already present
        $additionalItems = [
            [
                'dealer_id' => $dealer->id,
                'category_id' => $books->id,
                'name' => 'Bodh Katha Sangrah (प्रेरक बोध कथाएं)',
                'slug' => 'bodh-katha-sangrah',
                'sku' => 'BK-BDH-101',
                'description' => 'Comprehensive collection of inspiring stories, moral values, and biographical teachings for all ages.',
                'price' => 150.00,
                'stock' => 0,
                'image_url' => '/images/categories/books.png',
                'status' => 'active',
            ],
            [
                'dealer_id' => $dealer->id,
                'category_id' => $books->id,
                'name' => 'Rashtriya Charitra Nirmaan (राष्ट्र निर्माण की दिशा)',
                'slug' => 'rashtriya-charitra-nirmaan',
                'sku' => 'BK-RCN-102',
                'description' => 'Guiding philosophies on community building, cultural heritage preservation, and selfless service.',
                'price' => 220.00,
                'stock' => 0,
                'image_url' => '/images/categories/books.png',
                'status' => 'active',
            ],
            [
                'dealer_id' => $dealer->id,
                'category_id' => $ghosh->id,
                'name' => 'Aanaka Ghosh Snare Drum with Strap & Sticks',
                'slug' => 'aanaka-ghosh-snare-drum',
                'sku' => 'GH-ANK-201',
                'description' => 'Professional march rhythm drum crafted with tuned synthetic skin, ergonomic shoulder harness, and hardwood sticks.',
                'price' => 2400.00,
                'stock' => 0,
                'image_url' => '/images/categories/ghosh.jpg',
                'status' => 'active',
            ],
            [
                'dealer_id' => $dealer->id,
                'category_id' => $ghosh->id,
                'name' => 'Classical Ghosh Brass Vamshi Flute',
                'slug' => 'classical-ghosh-brass-vamshi',
                'sku' => 'GH-VMS-202',
                'description' => 'Precision tuned brass Ghosh Vamshi flute engineered for crisp acoustic projection in open grounds.',
                'price' => 450.00,
                'stock' => 0,
                'image_url' => '/images/categories/ghosh.jpg',
                'status' => 'active',
            ],
            [
                'dealer_id' => $dealer->id,
                'category_id' => $ghosh->id,
                'name' => 'Natural Ghosh Shankha with Wooden Base',
                'slug' => 'natural-ghosh-shankha',
                'sku' => 'GH-SHK-203',
                'description' => 'Authentic polished natural Shankha with resonant high decibel resonance, complete with carved stand.',
                'price' => 799.00,
                'stock' => 0,
                'image_url' => '/images/categories/ghosh.jpg',
                'status' => 'active',
            ],
        ];

        foreach ($additionalItems as $item) {
            $existing = Product::where('sku', $item['sku'])->first();
            if (!$existing) {
                Product::create($item);
            }
        }
    }
}
