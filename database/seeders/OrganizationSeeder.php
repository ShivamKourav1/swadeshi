<?php

namespace Database\Seeders;

use App\Models\DeliveryLocation;
use App\Models\DeliveryLog;
use App\Models\Jila;
use App\Models\Kshetra;
use App\Models\Nagar;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Prant;
use App\Models\Product;
use App\Models\Shakha;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\Vibhag;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class OrganizationSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Kshetra: Madhya
        $madhyaKshetra = Kshetra::create([
            'kshetra_name' => 'Madhya',
            'toli' => [
                'kshetra_sanghchalak' => ['name' => 'Dr. P. K. Sharma', 'contact' => '+91 9826010001'],
                'kshetra_karyavah' => ['name' => 'Shri Ashok Ji', 'contact' => '+91 9826010002'],
                'kshetra_pracharak' => ['name' => 'Shri Deepak Ji', 'contact' => '+91 9826010003'],
            ],
        ]);

        // 2. Prant: Malwa (belongs to Madhya Kshetra)
        $malwaPrant = Prant::create([
            'kshetra_id' => $madhyaKshetra->id,
            'prant_name' => 'Malwa',
            'toli' => [
                'prant_sanghchalak' => ['name' => 'Shri Prakash Ji', 'contact' => '+91 9826020001'],
                'prant_karyavah' => ['name' => 'Shri Balram Ji', 'contact' => '+91 9826020002'],
                'prant_pracharak' => ['name' => 'Shri Rajendra Ji', 'contact' => '+91 9826020003'],
            ],
        ]);

        // 3. Vibhag: Indore (belongs to Malwa Prant)
        $indoreVibhag = Vibhag::create([
            'prant_id' => $malwaPrant->id,
            'vibhag_name' => 'Indore',
            'toli' => [
                'vibhag_sanghchalak' => ['name' => 'Shri Vinod Ji', 'contact' => '+91 9826030001'],
                'vibhag_karyavah' => ['name' => 'Shri Shailendra Ji', 'contact' => '+91 9826030002'],
                'vibhag_pracharak' => ['name' => 'Shri Anand Ji', 'contact' => '+91 9826030003'],
            ],
        ]);

        // 4. Jilas: Badrinath, Jagannath, Rameshwaram, Dwarka, Mahu (all belong to Indore Vibhag)
        $jilaNames = ['Badrinath', 'Jagannath', 'Rameshwaram', 'Dwarka', 'Mahu'];
        $jilas = [];

        foreach ($jilaNames as $idx => $jilaName) {
            $num = $idx + 1;
            $jilas[$jilaName] = Jila::create([
                'vibhag_id' => $indoreVibhag->id,
                'jila_name' => $jilaName,
                'toli' => [
                    'jila_sanghchalak' => ['name' => "Sanghchalak ({$jilaName})", 'contact' => "+91 982604000{$num}"],
                    'jila_karyavah' => ['name' => "Karyavah ({$jilaName})", 'contact' => "+91 982604001{$num}"],
                    'jila_pracharak' => ['name' => "Pracharak ({$jilaName})", 'contact' => "+91 982604002{$num}"],
                ],
            ]);
        }

        // 5. Nagars: Madhav, Sant Kabir, Vishwakarma, Deendayal, Lavkush, Chandragupt, Veer Gogadev (all belong to Badrinath Jila)
        $badrinathJila = $jilas['Badrinath'];
        $nagarNames = [
            'Madhav',
            'Sant Kabir',
            'Vishwakarma',
            'Deendayal',
            'Lavkush',
            'Chandragupt',
            'Veer Gogadev',
        ];

        $nagars = [];
        foreach ($nagarNames as $idx => $nagarName) {
            $num = $idx + 1;
            $nagars[$nagarName] = Nagar::create([
                'jila_id' => $badrinathJila->id,
                'nagar_name' => $nagarName,
                'toli' => [
                    'nagar_sanghchalak' => ['name' => "Sanghchalak ({$nagarName})", 'contact' => "+91 982605000{$num}"],
                    'nagar_karyavah' => ['name' => "Karyavah ({$nagarName})", 'contact' => "+91 982605001{$num}"],
                ],
            ]);
        }

        // 6. Shakhas under Nagars
        $sampleShakhas = [
            'keshav' => Shakha::create([
                'nagar_id' => $nagars['Madhav']->id,
                'shakha_name' => 'Keshav Prabhat Shakha',
                'aayu_varg' => 'Vyavsai',
                'type' => 'dainik',
                'toli' => [
                    'mukhya_shikshak' => ['name' => 'Ramesh Verma', 'contact' => '+91 9826060001'],
                    'karyavah' => ['name' => 'Suresh Joshi', 'contact' => '+91 9826060002'],
                ],
                'status' => 'Active',
            ]),
            'vivekanand' => Shakha::create([
                'nagar_id' => $nagars['Madhav']->id,
                'shakha_name' => 'Vivekanand Tarun Shakha',
                'aayu_varg' => 'Mahavidhyalay',
                'type' => 'dainik',
                'toli' => [
                    'mukhya_shikshak' => ['name' => 'Amit Sharma', 'contact' => '+91 9826060003'],
                    'karyavah' => ['name' => 'Rahul Gupta', 'contact' => '+91 9826060004'],
                ],
                'status' => 'Active',
            ]),
            'kabir' => Shakha::create([
                'nagar_id' => $nagars['Sant Kabir']->id,
                'shakha_name' => 'Kabir Baal Shakha',
                'aayu_varg' => 'Baal',
                'type' => 'dainik',
                'toli' => [
                    'mukhya_shikshak' => ['name' => 'Vikas Yadav', 'contact' => '+91 9826060005'],
                    'karyavah' => ['name' => 'Mohit Patel', 'contact' => '+91 9826060006'],
                ],
                'status' => 'Active',
            ]),
            'shivaji' => Shakha::create([
                'nagar_id' => $nagars['Vishwakarma']->id,
                'shakha_name' => 'Shivaji Saayam Shakha',
                'aayu_varg' => 'Praurh',
                'type' => 'saptahik',
                'toli' => [
                    'mukhya_shikshak' => ['name' => 'Narayan Sen', 'contact' => '+91 9826060007'],
                    'karyavah' => ['name' => 'Dinesh Kushwaha', 'contact' => '+91 9826060008'],
                ],
                'status' => 'Active',
            ]),
            'deendayal' => Shakha::create([
                'nagar_id' => $nagars['Deendayal']->id,
                'shakha_name' => 'Deendayal Saptahik Milan',
                'aayu_varg' => 'Vyavsai',
                'type' => 'saptahik',
                'toli' => [
                    'mukhya_shikshak' => ['name' => 'Gopal Rathore', 'contact' => '+91 9826060009'],
                    'karyavah' => ['name' => 'Manoj Jain', 'contact' => '+91 9826060010'],
                ],
                'status' => 'Active',
            ]),
            'chanakya' => Shakha::create([
                'nagar_id' => $nagars['Chandragupt']->id,
                'shakha_name' => 'Chanakya Tarun Shakha',
                'aayu_varg' => 'Mahavidhyalay',
                'type' => 'dainik',
                'toli' => [
                    'mukhya_shikshak' => ['name' => 'Deepak Tiwari', 'contact' => '+91 9826060011'],
                    'karyavah' => ['name' => 'Pankaj Mishra', 'contact' => '+91 9826060012'],
                ],
                'status' => 'Active',
            ]),
            'maharana' => Shakha::create([
                'nagar_id' => $nagars['Veer Gogadev']->id,
                'shakha_name' => 'Maharana Pratap Shakha',
                'aayu_varg' => 'Praurh',
                'type' => 'dainik',
                'toli' => [
                    'mukhya_shikshak' => ['name' => 'Sunil Solanki', 'contact' => '+91 9826060013'],
                    'karyavah' => ['name' => 'Rajesh Choudhary', 'contact' => '+91 9826060014'],
                ],
                'status' => 'Active',
            ]),
        ];

        // 7. Create Karyakarta Users
        // A. Jila-level Karyakarta (Badrinath Jila)
        $karyakartaJila = User::create([
            'name' => 'Badrinath Jila Karyakarta',
            'email' => 'karyakarta@ecommerce.com',
            'password' => Hash::make('password'),
            'role' => 'karyakarta',
            'phone' => '+91 9826011111',
            'status' => 'active',
        ]);
        UserProfile::create([
            'user_id' => $karyakartaJila->id,
            'kshetra_id' => $madhyaKshetra->id,
            'prant_id' => $malwaPrant->id,
            'vibhag_id' => $indoreVibhag->id,
            'jila_id' => $badrinathJila->id,
            'bio' => 'Authorized Karyakarta overseeing Badrinath Jila organizational distribution & events.',
        ]);

        // B. Vibhag-level Karyakarta (Indore Vibhag)
        $karyakartaVibhag = User::create([
            'name' => 'Indore Vibhag Karyakarta',
            'email' => 'karyakarta_vibhag@ecommerce.com',
            'password' => Hash::make('password'),
            'role' => 'karyakarta',
            'phone' => '+91 9826022222',
            'status' => 'active',
        ]);
        UserProfile::create([
            'user_id' => $karyakartaVibhag->id,
            'kshetra_id' => $madhyaKshetra->id,
            'prant_id' => $malwaPrant->id,
            'vibhag_id' => $indoreVibhag->id,
            'bio' => 'Vibhag-level Karyakarta coordinating across all Jilas of Indore Vibhag.',
        ]);

        // C. Nagar-level Karyakarta (Madhav Nagar)
        $karyakartaNagar = User::create([
            'name' => 'Madhav Nagar Karyakarta',
            'email' => 'karyakarta_nagar@ecommerce.com',
            'password' => Hash::make('password'),
            'role' => 'karyakarta',
            'phone' => '+91 9826033333',
            'status' => 'active',
        ]);
        UserProfile::create([
            'user_id' => $karyakartaNagar->id,
            'kshetra_id' => $madhyaKshetra->id,
            'prant_id' => $malwaPrant->id,
            'vibhag_id' => $indoreVibhag->id,
            'jila_id' => $badrinathJila->id,
            'nagar_id' => $nagars['Madhav']->id,
            'bio' => 'Nagar Karyakarta overseeing Shakhas in Madhav Nagar.',
        ]);

        // 8. Create Delivery Locations tied to Organizational Units
        $customer = User::where('role', 'customer')->first();
        if ($customer) {
            $locMadhav = DeliveryLocation::create([
                'user_id' => $customer->id,
                'label' => 'Madhav Nagar Shakha Kendra',
                'recipient_name' => 'Rahul Sharma (Mukhya Shikshak)',
                'phone' => '+91 9826099901',
                'address_line_1' => 'Plot 42, Keshav Kunj, Madhav Nagar Main Road',
                'address_line_2' => 'Near Saraswati Shishu Mandir',
                'city' => 'Indore',
                'state' => 'Madhya Pradesh',
                'postal_code' => '452001',
                'country' => 'India',
                'latitude' => 22.7196,
                'longitude' => 75.8577,
                'is_default' => false,
                'kshetra_id' => $madhyaKshetra->id,
                'prant_id' => $malwaPrant->id,
                'vibhag_id' => $indoreVibhag->id,
                'jila_id' => $badrinathJila->id,
                'nagar_id' => $nagars['Madhav']->id,
                'shakha_id' => $sampleShakhas['keshav']->id,
            ]);

            $locSantKabir = DeliveryLocation::create([
                'user_id' => $customer->id,
                'label' => 'Kabir Nagar Community Center',
                'recipient_name' => 'Amit Verma',
                'phone' => '+91 9826099902',
                'address_line_1' => '12 Kabir Marg, Sant Kabir Nagar',
                'address_line_2' => 'Opposite Community Hall',
                'city' => 'Indore',
                'state' => 'Madhya Pradesh',
                'postal_code' => '452002',
                'country' => 'India',
                'latitude' => 22.7280,
                'longitude' => 75.8650,
                'is_default' => false,
                'kshetra_id' => $madhyaKshetra->id,
                'prant_id' => $malwaPrant->id,
                'vibhag_id' => $indoreVibhag->id,
                'jila_id' => $badrinathJila->id,
                'nagar_id' => $nagars['Sant Kabir']->id,
                'shakha_id' => $sampleShakhas['kabir']->id,
            ]);

            $locVishwakarma = DeliveryLocation::create([
                'user_id' => $customer->id,
                'label' => 'Vishwakarma Industrial Complex',
                'recipient_name' => 'Narayan Sen',
                'phone' => '+91 9826099903',
                'address_line_1' => '55 Vishwakarma Nagar Sector B',
                'address_line_2' => 'Near Industrial Area Gate 1',
                'city' => 'Indore',
                'state' => 'Madhya Pradesh',
                'postal_code' => '452003',
                'country' => 'India',
                'latitude' => 22.7350,
                'longitude' => 75.8750,
                'is_default' => false,
                'kshetra_id' => $madhyaKshetra->id,
                'prant_id' => $malwaPrant->id,
                'vibhag_id' => $indoreVibhag->id,
                'jila_id' => $badrinathJila->id,
                'nagar_id' => $nagars['Vishwakarma']->id,
                'shakha_id' => $sampleShakhas['shivaji']->id,
            ]);

            // 9. Create Sample Orders for Demonstration in Karyakarta Dashboard
            $deliveryPartner = User::where('role', 'delivery_partner')->first();
            $products = Product::all();

            if ($products->count() >= 2) {
                $p1 = $products[0];
                $p2 = $products[1];

                // Order 1: Dispatched in Madhav Nagar
                $order1 = Order::create([
                    'order_number' => 'ORD-VB-ORG001',
                    'customer_id' => $customer->id,
                    'delivery_location_id' => $locMadhav->id,
                    'delivery_partner_id' => $deliveryPartner?->id,
                    'subtotal' => $p1->price * 2,
                    'delivery_fee' => 10.00,
                    'total_amount' => ($p1->price * 2) + 10.00,
                    'payment_method' => 'cod',
                    'payment_status' => 'pending',
                    'delivery_status' => 'dispatched',
                    'order_status' => 'processing',
                    'notes' => 'Uniforms required for Keshav Prabhat Shakha annual gathering.',
                ]);
                OrderItem::create([
                    'order_id' => $order1->id,
                    'product_id' => $p1->id,
                    'dealer_id' => $p1->dealer_id,
                    'product_name' => $p1->name,
                    'unit_price' => $p1->price,
                    'quantity' => 2,
                    'subtotal' => $p1->price * 2,
                ]);
                Payment::create([
                    'order_id' => $order1->id,
                    'payment_method' => 'cod',
                    'amount' => $order1->total_amount,
                    'status' => 'pending',
                ]);
                DeliveryLog::create([
                    'order_id' => $order1->id,
                    'delivery_partner_id' => $deliveryPartner?->id,
                    'status' => 'dispatched',
                    'payment_collected' => false,
                    'notes' => 'Dispatched to Madhav Nagar Shakha location.',
                ]);

                // Order 2: In Transit in Sant Kabir Nagar
                $order2 = Order::create([
                    'order_number' => 'ORD-VB-ORG002',
                    'customer_id' => $customer->id,
                    'delivery_location_id' => $locSantKabir->id,
                    'delivery_partner_id' => $deliveryPartner?->id,
                    'subtotal' => $p2->price * 3,
                    'delivery_fee' => 10.00,
                    'total_amount' => ($p2->price * 3) + 10.00,
                    'payment_method' => 'cod',
                    'payment_status' => 'pending',
                    'delivery_status' => 'in_transit',
                    'order_status' => 'processing',
                    'notes' => 'Books distribution for Baal Shakha library.',
                ]);
                OrderItem::create([
                    'order_id' => $order2->id,
                    'product_id' => $p2->id,
                    'dealer_id' => $p2->dealer_id,
                    'product_name' => $p2->name,
                    'unit_price' => $p2->price,
                    'quantity' => 3,
                    'subtotal' => $p2->price * 3,
                ]);
                Payment::create([
                    'order_id' => $order2->id,
                    'payment_method' => 'cod',
                    'amount' => $order2->total_amount,
                    'status' => 'pending',
                ]);
                DeliveryLog::create([
                    'order_id' => $order2->id,
                    'delivery_partner_id' => $deliveryPartner?->id,
                    'status' => 'in_transit',
                    'payment_collected' => false,
                    'notes' => 'Courier agent is currently out for delivery in Sant Kabir Nagar.',
                ]);

                // Order 3: Delivered in Vishwakarma Nagar
                $order3 = Order::create([
                    'order_number' => 'ORD-VB-ORG003',
                    'customer_id' => $customer->id,
                    'delivery_location_id' => $locVishwakarma->id,
                    'delivery_partner_id' => $deliveryPartner?->id,
                    'subtotal' => $p1->price + $p2->price,
                    'delivery_fee' => 10.00,
                    'total_amount' => ($p1->price + $p2->price) + 10.00,
                    'payment_method' => 'cod',
                    'payment_status' => 'completed',
                    'delivery_status' => 'delivered',
                    'order_status' => 'completed',
                    'notes' => 'Delivery completed and COD cash collected.',
                ]);
                OrderItem::create([
                    'order_id' => $order3->id,
                    'product_id' => $p1->id,
                    'dealer_id' => $p1->dealer_id,
                    'product_name' => $p1->name,
                    'unit_price' => $p1->price,
                    'quantity' => 1,
                    'subtotal' => $p1->price,
                ]);
                OrderItem::create([
                    'order_id' => $order3->id,
                    'product_id' => $p2->id,
                    'dealer_id' => $p2->dealer_id,
                    'product_name' => $p2->name,
                    'unit_price' => $p2->price,
                    'quantity' => 1,
                    'subtotal' => $p2->price,
                ]);
                Payment::create([
                    'order_id' => $order3->id,
                    'payment_method' => 'cod',
                    'amount' => $order3->total_amount,
                    'status' => 'completed',
                    'transaction_id' => 'TXN-COD-VK9921',
                ]);
                DeliveryLog::create([
                    'order_id' => $order3->id,
                    'delivery_partner_id' => $deliveryPartner?->id,
                    'status' => 'delivered',
                    'payment_collected' => true,
                    'notes' => 'Delivered to Narayan Sen. ₹' . $order3->total_amount . ' collected.',
                ]);
            }
        }
    }
}
