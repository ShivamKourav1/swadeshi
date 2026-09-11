<?php

namespace App\Http\Controllers;

use App\Models\DeliveryLog;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DealerOrderController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (!$user->isDealer() && !$user->isAdmin()) {
            abort(403, 'Access denied for non-dealer users.');
        }

        $search = $request->input('search');

        $query = OrderItem::with(['order.customer', 'order.deliveryLocation', 'order.cancelledByUser', 'order.restockedByUser', 'order.returnRequest', 'order.returnRequests', 'product']);

        if (!$user->isAdmin()) {
            $query->where('dealer_id', $user->id);
        }

        $orderItems = $query
            ->when($search, function ($q) use ($search) {
                return $q->where(function ($query) use ($search) {
                    $query->where('product_name', 'like', "%{$search}%")
                          ->orWhereHas('order', function ($oq) use ($search) {
                              $oq->where('order_number', 'like', "%{$search}%")
                                 ->orWhereHas('customer', function ($cq) use ($search) {
                                     $cq->where('name', 'like', "%{$search}%")
                                        ->orWhere('email', 'like', "%{$search}%");
                                 });
                          });
                });
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Dealer/Orders', [
            'orderItems' => $orderItems,
            'filters' => [
                'search' => $search ?? '',
            ],
        ]);
    }

    public function confirmRestock(Request $request, Order $order): RedirectResponse
    {
        $user = $request->user();

        if (!$user->isDealer() && !$user->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        if (!$order->isCancelled()) {
            return back()->with('error', 'This order is not cancelled.');
        }

        if ($order->restocked) {
            return back()->with('info', 'Stock for this order has already been restored.');
        }

        if ($user->isDealer() && !$user->isAdmin()) {
            $hasDealerItems = $order->items()->where('dealer_id', $user->id)->exists();
            if (!$hasDealerItems) {
                abort(403, 'You do not have products in this order.');
            }
        }

        DB::beginTransaction();

        try {
            $order->load('items.product');

            foreach ($order->items as $item) {
                // If dealer, only increment their own products; if admin, all products
                if ($user->isAdmin() || $item->dealer_id === $user->id) {
                    if ($item->product) {
                        $item->product->increment('stock', $item->quantity);
                    }
                }
            }

            $order->update([
                'restocked' => true,
                'restocked_at' => now(),
                'restocked_by' => $user->id,
            ]);

            DeliveryLog::create([
                'order_id' => $order->id,
                'delivery_partner_id' => $order->delivery_partner_id,
                'status' => 'returned',
                'payment_collected' => false,
                'notes' => "Returned shipment physically received at store and verified by {$user->name}. Product stock restored.",
            ]);

            DB::commit();

            return back()->with('success', 'Returned goods physically received and verified! Stock has been restored.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to confirm restock: ' . $e->getMessage());
        }
    }
}
