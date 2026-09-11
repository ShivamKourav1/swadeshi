<?php

namespace App\Http\Controllers;

use App\Http\Requests\CheckoutRequest;
use App\Models\DeliveryLocation;
use App\Models\DeliveryLog;
use App\Models\Jila;
use App\Models\Kshetra;
use App\Models\Nagar;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Prant;
use App\Models\Product;
use App\Models\Shakha;
use App\Models\User;
use App\Models\Vibhag;
use App\Services\Payments\PaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function checkout(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        $cart = $request->session()->get('cart', []);

        if (empty($cart)) {
            return redirect()->route('cart.index')->with('error', 'Your cart is empty.');
        }

        $locations = DeliveryLocation::where('user_id', $user->id)
            ->with(['kshetra', 'prant', 'vibhag', 'jila', 'nagar', 'shakha'])
            ->get();
            
        $subtotal = 0;

        foreach ($cart as $item) {
            $subtotal += $item['price'] * $item['quantity'];
        }

        $orgData = [
            'kshetras' => Kshetra::all(['id', 'kshetra_name']),
            'prants' => Prant::all(['id', 'kshetra_id', 'prant_name']),
            'vibhags' => Vibhag::all(['id', 'prant_id', 'vibhag_name']),
            'jilas' => Jila::all(['id', 'vibhag_id', 'jila_name']),
            'nagars' => Nagar::all(['id', 'jila_id', 'nagar_name']),
            'shakhas' => Shakha::where('status', 'Active')->get(['id', 'nagar_id', 'shakha_name', 'aayu_varg', 'type']),
        ];

        return Inertia::render('Checkout/Index', [
            'cart' => array_values($cart),
            'locations' => $locations,
            'orgData' => $orgData,
            'subtotal' => round($subtotal, 2),
            'deliveryFee' => 10.00,
            'total' => round($subtotal + 10.00, 2),
        ]);
    }

    public function store(CheckoutRequest $request, PaymentService $paymentService): RedirectResponse
    {
        $user = $request->user();
        $cart = $request->session()->get('cart', []);

        if (empty($cart)) {
            return redirect()->route('cart.index')->with('error', 'Your cart is empty.');
        }

        $location = DeliveryLocation::where('user_id', $user->id)
            ->where('id', $request->input('delivery_location_id'))
            ->firstOrFail();

        // Assign an active delivery partner automatically if available
        $deliveryPartner = User::where('role', 'delivery_partner')->where('status', 'active')->first();

        DB::beginTransaction();

        try {
            $subtotal = 0;
            $orderItemsData = [];

            foreach ($cart as $item) {
                $product = Product::lockForUpdate()->find($item['id']);

                if (!$product || $product->stock < $item['quantity']) {
                    DB::rollBack();
                    return back()->with('error', "Insufficient stock for product: {$item['name']}");
                }

                // Decrement stock
                $product->decrement('stock', $item['quantity']);

                $itemSubtotal = $product->price * $item['quantity'];
                $subtotal += $itemSubtotal;

                $orderItemsData[] = [
                    'product_id' => $product->id,
                    'dealer_id' => $product->dealer_id,
                    'product_name' => $product->name,
                    'unit_price' => $product->price,
                    'quantity' => $item['quantity'],
                    'subtotal' => $itemSubtotal,
                ];
            }

            $deliveryFee = 10.00;
            $totalAmount = $subtotal + $deliveryFee;

            // Initial state upon order placement: order_status is 'placed', delivery_status is 'pending'
            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'customer_id' => $user->id,
                'delivery_location_id' => $location->id,
                'delivery_partner_id' => $deliveryPartner ? $deliveryPartner->id : null,
                'subtotal' => $subtotal,
                'delivery_fee' => $deliveryFee,
                'total_amount' => $totalAmount,
                'payment_method' => $request->input('payment_method'),
                'payment_status' => 'pending',
                'delivery_status' => 'pending',
                'order_status' => 'placed',
                'notes' => $request->input('notes'),
            ]);

            foreach ($orderItemsData as $itemData) {
                $itemData['order_id'] = $order->id;
                OrderItem::create($itemData);
            }

            // Execute Payment Driver setup (COD creates pending payment, extensible for Stripe/PayPal)
            $driver = $paymentService->driver($request->input('payment_method'));
            $driver->processPayment($order);

            // Log initial order placement status
            DeliveryLog::create([
                'order_id' => $order->id,
                'delivery_partner_id' => $deliveryPartner ? $deliveryPartner->id : null,
                'status' => 'placed',
                'payment_collected' => false,
                'notes' => 'Order placed by customer.',
            ]);

            DB::commit();

            // Clear session cart
            $request->session()->forget('cart');

            return redirect()->route('orders.show', $order->id)
                ->with('success', "Order #{$order->order_number} placed successfully!");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to place order: ' . $e->getMessage());
        }
    }

    public function index(Request $request): Response
    {
        $user = $request->user();

        $orders = Order::where('customer_id', $user->id)
            ->with(['deliveryLocation.kshetra', 'deliveryLocation.prant', 'deliveryLocation.vibhag', 'deliveryLocation.jila', 'deliveryLocation.nagar', 'deliveryLocation.shakha', 'items', 'returnRequest'])
            ->latest()
            ->paginate(10);

        return Inertia::render('Orders/Index', [
            'orders' => $orders,
        ]);
    }

    public function show(Request $request, Order $order): Response
    {
        $user = $request->user();

        if ($user->role === 'customer' && $order->customer_id !== $user->id) {
            abort(403);
        }

        $order->load([
            'customer',
            'deliveryLocation.kshetra',
            'deliveryLocation.prant',
            'deliveryLocation.vibhag',
            'deliveryLocation.jila',
            'deliveryLocation.nagar',
            'deliveryLocation.shakha',
            'deliveryPartner',
            'cancelledByUser',
            'restockedByUser',
            'returnRequest.dealer',
            'returnRequests.dealer',
            'items.product',
            'payment',
            'deliveryLogs.deliveryPartner',
        ]);

        return Inertia::render('Orders/Show', [
            'order' => $order,
        ]);
    }

    public function cancel(Request $request, Order $order): RedirectResponse
    {
        $user = $request->user();

        $isCustomer = $user->id === $order->customer_id;
        $isDealerOfOrder = $user->isDealer() && $order->items()->where('dealer_id', $user->id)->exists();
        $isAdmin = $user->isAdmin();

        if (!$isCustomer && !$isDealerOfOrder && !$isAdmin) {
            abort(403, 'Unauthorized to cancel this order.');
        }

        if (!$order->canBeCancelled()) {
            return back()->with('error', 'This order cannot be cancelled in its current status.');
        }

        $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $reason = $request->input('reason') ?: ('Cancelled by ' . ucfirst($user->role));

        DB::beginTransaction();

        try {
            $previousDeliveryStatus = $order->delivery_status;
            $stage = ($previousDeliveryStatus === 'pending' || $previousDeliveryStatus === 'placed') 
                ? 'before_dispatch' 
                : 'after_dispatch';

            $order->load('items.product');

            if ($stage === 'before_dispatch') {
                // Stock is restored immediately because items are still at the dealer / not dispatched
                foreach ($order->items as $item) {
                    if ($item->product) {
                        $item->product->increment('stock', $item->quantity);
                    }
                }

                $order->update([
                    'order_status' => 'cancelled',
                    'delivery_status' => 'cancelled',
                    'cancellation_stage' => 'before_dispatch',
                    'cancellation_reason' => $reason,
                    'cancelled_at' => now(),
                    'cancelled_by' => $user->id,
                    'restocked' => true,
                    'restocked_at' => now(),
                    'restocked_by' => $user->id,
                ]);

                DeliveryLog::create([
                    'order_id' => $order->id,
                    'delivery_partner_id' => $order->delivery_partner_id,
                    'status' => 'cancelled',
                    'payment_collected' => false,
                    'notes' => "Order cancelled before dispatch by {$user->name}. Product stock immediately restored.",
                ]);
            } else {
                // Dispatched / In Transit: Stock will ONLY be restored when dealer confirms physical receipt
                $order->update([
                    'order_status' => 'cancelled',
                    'delivery_status' => 'cancelled',
                    'cancellation_stage' => 'after_dispatch',
                    'cancellation_reason' => $reason,
                    'cancelled_at' => now(),
                    'cancelled_by' => $user->id,
                    'restocked' => false,
                    'restocked_at' => null,
                    'restocked_by' => null,
                ]);

                DeliveryLog::create([
                    'order_id' => $order->id,
                    'delivery_partner_id' => $order->delivery_partner_id,
                    'status' => 'cancelled',
                    'payment_collected' => false,
                    'notes' => "Order cancelled after dispatch by {$user->name}. Return shipment in transit to dealer store.",
                ]);
            }

            DB::commit();

            $msg = $stage === 'before_dispatch' 
                ? 'Order cancelled successfully and stock has been restored.' 
                : 'Order cancelled. Return initiated — stock will be restored once returned goods are physically received and verified by the dealer.';

            return back()->with('success', $msg);
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to cancel order: ' . $e->getMessage());
        }
    }
}
