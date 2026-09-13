<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Str;

class ShakhaProductService
{
    /**
     * Standard list of authentic Shakha products with standardized prices and SKUs.
     */
    public static function getProductList(): array
    {
        return [
            [
                'name' => "Shakha Flag (शाखा ध्वज)",
                'sku_code' => 'SHK-FLG-01',
                'price' => 50.00,
                'description' => "Standard saffron triangular Shakha Flag (शाखा ध्वज) crafted from durable outdoor ceremonial fabric.",
                'category_slug' => 'ganvesh',
            ],
            [
                'name' => "Bal Pant Elastic 20'' to 22'' (बाल पैन्ट इलास्टिक 20'' से 22'')",
                'sku_code' => 'SHK-PNT-B20',
                'price' => 200.00,
                'description' => "Comfortable elastic waistband uniform trousers tailored for Bal swayamsevaks (Size 20'' to 22'').",
                'category_slug' => 'ganvesh',
            ],
            [
                'name' => "Bal Pant Elastic 24'' to 26'' (बाल पैन्ट इलास्टिक 24'' से 26'')",
                'sku_code' => 'SHK-PNT-B24',
                'price' => 210.00,
                'description' => "Elastic waist stitched uniform trousers for Bal swayamsevaks (Size 24'' to 26'').",
                'category_slug' => 'ganvesh',
            ],
            [
                'name' => "Tarun Pant Elastic 28'' to 30'' (तरुण पैन्ट इलास्टिक 28'' से 30'')",
                'sku_code' => 'SHK-PNT-T28',
                'price' => 250.00,
                'description' => "Standard flexible fit uniform trousers for Tarun swayamsevaks (Size 28'' to 30'').",
                'category_slug' => 'ganvesh',
            ],
            [
                'name' => "Uniform Pant 28'' to 50'' (पैन्ट गणवेश 28'' से 50'')",
                'sku_code' => 'SHK-PNT-U28',
                'price' => 280.00,
                'description' => "Full length official Ganvesh trousers with belt loops and reinforced pockets (Sizes 28'' to 50'').",
                'category_slug' => 'ganvesh',
            ],
            [
                'name' => "Cotton Socks (सूती मोजे)",
                'sku_code' => 'SHK-SCK-CTN',
                'price' => 30.00,
                'description' => "High absorbency breathable dark cotton uniform socks.",
                'category_slug' => 'ganvesh',
            ],
            [
                'name' => "Bal Socks (बाल मोजे)",
                'sku_code' => 'SHK-SCK-BAL',
                'price' => 20.00,
                'description' => "Soft durable cotton socks sized for junior/bal swayamsevaks.",
                'category_slug' => 'ganvesh',
            ],
            [
                'name' => "Shirt Cotton (शर्ट सूती)",
                'sku_code' => 'SHK-SHT-CTN',
                'price' => 370.00,
                'description' => "100% pure cotton official uniform shirt with epaulettes and front button flap pockets.",
                'category_slug' => 'ganvesh',
            ],
            [
                'name' => "Bal Shirt Terrycot 20'' to 32'' (बाल शर्ट टेरीकोट 20'' से 32'')",
                'sku_code' => 'SHK-SHT-BTC',
                'price' => 220.00,
                'description' => "Easy maintenance wrinkle resistant terrycot fabric uniform shirt for Bal swayamsevaks (Sizes 20'' to 32'').",
                'category_slug' => 'ganvesh',
            ],
            [
                'name' => "Shirt Terrycot 34'' and above (शर्ट टेरीकोट 34'' से)",
                'sku_code' => 'SHK-SHT-TTC',
                'price' => 320.00,
                'description' => "Durable all-weather terrycot uniform shirt for adult and senior swayamsevaks (Sizes 34'' and above).",
                'category_slug' => 'ganvesh',
            ],
            [
                'name' => "Cap (टोपी)",
                'sku_code' => 'SHK-CAP-BLK',
                'price' => 30.00,
                'description' => "Traditional black foldable ceremonial cap (काली टोपी) crafted with cotton cloth.",
                'category_slug' => 'ganvesh',
            ],
            [
                'name' => "Padvesh Rexine Shoes 6-10 (पदवेश रेग्जीन 6-10)",
                'sku_code' => 'SHK-SHU-REX1',
                'price' => 350.00,
                'description' => "Polished black rexine official Padvesh parade shoes (Sizes 6-10) with anti-skid sole.",
                'category_slug' => 'ganvesh',
            ],
            [
                'name' => "Padvesh Rexine Shoes 11-12 (पदवेश रेग्जीन 11-12)",
                'sku_code' => 'SHK-SHU-REX2',
                'price' => 370.00,
                'description' => "Heavy-duty black rexine Padvesh shoes for larger sizes (Sizes 11-12).",
                'category_slug' => 'ganvesh',
            ],
            [
                'name' => "Padvesh Canvas Shoes (पदवेश कैनवास)",
                'sku_code' => 'SHK-SHU-CNV',
                'price' => 220.00,
                'description' => "Lightweight durable black canvas athletic shoes for physical training and daily shakha.",
                'category_slug' => 'ganvesh',
            ],
            [
                'name' => "Langot Lattha (लंगोट लट्ठा)",
                'sku_code' => 'SHK-LNG-LTH',
                'price' => 60.00,
                'description' => "Traditional 100% thick lattha cotton wrestling and physical sports langot.",
                'category_slug' => 'ganvesh',
            ],
            [
                'name' => "Bal Belt 36'' (बाल बेल्ट 36'')",
                'sku_code' => 'SHK-BLT-36',
                'price' => 60.00,
                'description' => "Heavy-duty woven nylon webbing belt with metal buckle, sized 36'' for Bal swayamsevaks.",
                'category_slug' => 'ganvesh',
            ],
            [
                'name' => "Tarun Belt 42'', 46'' (तरुण बेल्ट 42'', 46'')",
                'sku_code' => 'SHK-BLT-42',
                'price' => 65.00,
                'description' => "Regulation Ganvesh woven waist belt with embossed metal clamp (Sizes 42'', 46'').",
                'category_slug' => 'ganvesh',
            ],
            [
                'name' => "Special Belt 52'' (विशेष बेल्ट 52'')",
                'sku_code' => 'SHK-BLT-52',
                'price' => 70.00,
                'description' => "Extended size 52'' heavy woven regulation waist belt with sturdy locking clasp.",
                'category_slug' => 'ganvesh',
            ],
            [
                'name' => "Special Belt 58'' (विशेष बेल्ट 58'')",
                'sku_code' => 'SHK-BLT-58',
                'price' => 75.00,
                'description' => "Extra large 58'' woven waist belt for comfortable custom adjustments.",
                'category_slug' => 'ganvesh',
            ],
            [
                'name' => "Dand / Stick (दण्ड)",
                'sku_code' => 'SHK-DND-STD',
                'price' => 40.00,
                'description' => "Polished lightweight bamboo martial arts exercise staff (दण्ड) with smooth ends.",
                'category_slug' => 'ganvesh',
            ],
            [
                'name' => "Vest / Banian (बनियान)",
                'sku_code' => 'SHK-VST-WHT',
                'price' => 220.00,
                'description' => "100% combed cotton sleeveless white sports vest (बनियान) for workouts.",
                'category_slug' => 'ganvesh',
            ],
            [
                'name' => "Knicker - Khaki/Black/Grey (निकर (खाकी/काली/स्लेटी))",
                'sku_code' => 'SHK-KNC-ALL',
                'price' => 300.00,
                'description' => "Comfortable drill cotton exercise shorts available in standard Khaki, Black, or Grey.",
                'category_slug' => 'ganvesh',
            ],
            [
                'name' => "Whistle (सीटी (विसल))",
                'sku_code' => 'SHK-WHS-MET',
                'price' => 10.00,
                'description' => "High decibel brass nickel-plated whistle with lanyard for shakha command signals.",
                'category_slug' => 'ganvesh',
            ],
        ];
    }

    /**
     * Create or populate the 23 standard Shakha products for a given dealer.
     */
    public static function createForDealer(User $dealer): int
    {
        $ganveshCategory = Category::firstOrCreate(
            ['slug' => 'ganvesh'],
            [
                'name' => 'Ganvesh (गणवेश)',
                'description' => 'Complete uniform sets, shirts, trousers, belts, socks, and ceremonial dress (गणवेश).',
                'image_url' => '/images/categories/ganvesh.jpg',
                'is_active' => true,
            ]
        );

        $items = self::getProductList();
        $createdCount = 0;

        foreach ($items as $item) {
            $sku = $item['sku_code'] . '-' . $dealer->id;
            
            // Avoid duplicates for this dealer
            $existing = Product::where('dealer_id', $dealer->id)
                ->where('name', $item['name'])
                ->first();

            if (!$existing) {
                Product::create([
                    'dealer_id' => $dealer->id,
                    'category_id' => $ganveshCategory->id,
                    'name' => $item['name'],
                    'slug' => Str::slug($item['name']) . '-' . strtolower(Str::random(5)),
                    'sku' => $sku,
                    'description' => $item['description'],
                    'price' => $item['price'],
                    'stock' => 50,
                    'image_url' => '/images/categories/ganvesh.jpg',
                    'status' => 'active',
                ]);
                $createdCount++;
            }
        }

        if ($dealer->profile) {
            $dealer->profile->update(['has_seeded_shakha_products' => true]);
        } else {
            $dealer->profile()->create(['has_seeded_shakha_products' => true]);
        }

        return $createdCount;
    }
}
