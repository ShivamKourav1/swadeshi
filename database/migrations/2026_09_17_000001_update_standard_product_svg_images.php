<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Updates all standard products to use the newly created authentic SVG vector images.
     */
    public function up(): void
    {
        $mappings = [
            // Flag
            'Shakha Flag' => '/images/products/shakha_flag.svg',
            'शाखा ध्वज' => '/images/products/shakha_flag.svg',

            // Pants
            'Bal Pant Elastic' => '/images/products/ganvesh_pant.svg',
            'Tarun Pant Elastic' => '/images/products/ganvesh_pant.svg',
            'Uniform Pant' => '/images/products/ganvesh_pant.svg',
            'पैन्ट गणवेश' => '/images/products/ganvesh_pant.svg',

            // Socks
            'Cotton Socks' => '/images/products/cotton_socks.svg',
            'Bal Socks' => '/images/products/cotton_socks.svg',
            'सूती मोजे' => '/images/products/cotton_socks.svg',
            'बाल मोजे' => '/images/products/cotton_socks.svg',

            // Shirts
            'Shirt Cotton' => '/images/products/white_shirt.svg',
            'Bal Shirt Terrycot' => '/images/products/white_shirt.svg',
            'Shirt Terrycot' => '/images/products/white_shirt.svg',
            'शर्ट सूती' => '/images/products/white_shirt.svg',
            'शर्ट टेरीकोट' => '/images/products/white_shirt.svg',

            // Cap
            'Cap (टोपी)' => '/images/products/black_cap.svg',
            'टोपी' => '/images/products/black_cap.svg',

            // Shoes
            'Padvesh Rexine Shoes' => '/images/products/padvesh_shoes.svg',
            'पदवेश रेग्जीन' => '/images/products/padvesh_shoes.svg',
            'Padvesh Canvas Shoes' => '/images/products/canvas_shoes.svg',
            'पदवेश कैनवास' => '/images/products/canvas_shoes.svg',

            // Langot
            'Langot Lattha' => '/images/products/langot.svg',
            'लंगोट लट्ठा' => '/images/products/langot.svg',

            // Belts
            'Bal Belt' => '/images/products/ganvesh_belt.svg',
            'Tarun Belt' => '/images/products/ganvesh_belt.svg',
            'Special Belt' => '/images/products/ganvesh_belt.svg',
            'बेल्ट' => '/images/products/ganvesh_belt.svg',

            // Dand
            'Dand / Stick' => '/images/products/dand.svg',
            'दण्ड' => '/images/products/dand.svg',

            // Vest
            'Vest / Banian' => '/images/products/vest.svg',
            'बनियान' => '/images/products/vest.svg',

            // Knicker
            'Knicker' => '/images/products/knicker.svg',
            'निकर' => '/images/products/knicker.svg',

            // Whistle
            'Whistle' => '/images/products/whistle.svg',
            'सीटी' => '/images/products/whistle.svg',

            // Books
            'Bodh Katha' => '/images/products/bodh_katha_book.svg',
            'बोध कथाएं' => '/images/products/bodh_katha_book.svg',
            'Rashtriya Charitra' => '/images/products/rashtriya_book.svg',
            'राष्ट्र निर्माण' => '/images/products/rashtriya_book.svg',

            // Ghosh
            'Aanaka Ghosh' => '/images/products/aanaka_drum.svg',
            'आनक' => '/images/products/aanaka_drum.svg',
            'Brass Vamshi' => '/images/products/brass_vamshi.svg',
            'वंशी' => '/images/products/brass_vamshi.svg',
            'Ghosh Shankha' => '/images/products/ghosh_shankha.svg',
            'शंख' => '/images/products/ghosh_shankha.svg',
        ];

        foreach ($mappings as $needle => $svgPath) {
            DB::table('products')
                ->where('name', 'LIKE', '%' . $needle . '%')
                ->update(['image_url' => $svgPath]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Keep SVG images as standard representation
    }
};
