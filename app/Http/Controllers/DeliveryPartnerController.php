<?php

namespace App\Http\Controllers;

use App\Http\Requests\DeliveryStatusUpdateRequest;
use App\Models\DeliveryLog;
use App\Models\Order;
use App\Services\Payments\PaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DeliveryPartnerController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (!$user->isDeliveryPartner() && !$user->isAdmin()) {
            abort(403, 'Access restricted to delivery partners.');
        }

        $search = $request->input('search');
        $statusFilter = $request->input('delivery_status');

        $orders = Order::where(function ($q) use ($user) {
            $q->where('delivery_partner_id', $user->id)
              ->orWhereNull('delivery_partner_id');
        })
        ->when($statusFilter, function ($q) use ($statusFilter) {
            return $q->where('delivery_status', $statusFilter);
        })
        ->when($search, function ($q) use ($search) {
            return $q->where(function ($query) use ($search) {
                $query->where('order_number', 'like', "%{$search}%")
                      ->orWhereHas('customer', function ($cq) use ($search) {
                          $cq->where('name', 'like', "%{$search}%")
                             ->orWhere('phone', 'like', "%{$search}%");
                      })
                      ->orWhereHas('deliveryLocation', function ($lq) use ($search) {
                          $lq->where('address_line_1', 'like', "%{$search}%")
                             ->orWhere('city', 'like', "%{$search}%")
                             ->orWhere('recipient_name', 'like', "%{$search}%");
                      });
            });
        })
        ->with(['customer', 'deliveryLocation', 'items', 'payment'])
        ->latest()
        ->paginate(15)
        ->withQueryString();

        return Inertia::render('DeliveryPartner/Index', [
            'orders' => $orders,
            'filters' => [
                'search' => $search ?? '',
                'delivery_status' => $statusFilter ?? '',
            ],
        ]);
    }

    public function claimOrder(Request $request, Order $order): RedirectResponse
    {
        $user = $request->user();

        if ($order->delivery_partner_id && $order->delivery_partner_id !== $user->id) {
            return back()->with('error', 'Order is already assigned to another delivery partner.');
        }

        $newDeliveryStatus = $order->delivery_status === 'pending' ? 'dispatched' : $order->delivery_status;

        $order->update([
            'delivery_partner_id' => $user->id,
            'delivery_status' => $newDeliveryStatus,
            'order_status' => 'processing',
        ]);

        DeliveryLog::create([
            'order_id' => $order->id,
            'delivery_partner_id' => $user->id,
            'status' => $newDeliveryStatus,
            'notes' => "Order claimed and assigned for delivery by partner {$user->name}",
        ]);

        return back()->with('success', 'Order claimed and marked as dispatched!');
    }

    public function updateStatus(
        DeliveryStatusUpdateRequest $request,
        Order $order,
        PaymentService $paymentService
    ): RedirectResponse {
        $user = $request->user();

        if ($order->delivery_partner_id !== $user->id && !$user->isAdmin()) {
            return back()->with('error', 'You are not assigned to this order.');
        }

        $validated = $request->validated();
        $newDeliveryStatus = $validated['delivery_status'];
        $isCompleted = !empty($validated['mark_completed']);
        $paymentCollected = !empty($validated['payment_collected']);
        $amountCollected = (float) ($validated['amount_collected'] ?? $order->total_amount);
        $screenshotUrl = $validated['screenshot_url'] ?? null;
        $notes = $validated['notes'] ?? '';

        DB::beginTransaction();

        try {
            $orderUpdate = [
                'delivery_status' => $newDeliveryStatus,
            ];

            if ($paymentCollected || $isCompleted) {
                $driver = $paymentService->driver($order->payment_method);
                $driver->collectDeliveryPayment(
                    $order,
                    $user,
                    $amountCollected,
                    $screenshotUrl,
                    $notes
                );
            }

            if ($isCompleted || ($newDeliveryStatus === 'delivered' && $order->payment_status === 'paid')) {
                $orderUpdate['order_status'] = 'completed';
                $orderUpdate['delivered_at'] = Carbon::now();
            }

            $order->update($orderUpdate);

            DeliveryLog::create([
                'order_id' => $order->id,
                'delivery_partner_id' => $user->id,
                'status' => $newDeliveryStatus,
                'payment_collected' => $paymentCollected || $order->payment_status === 'paid',
                'amount_collected' => $amountCollected,
                'notes' => $notes ?: "Status updated to {$newDeliveryStatus} by delivery partner.",
            ]);

            DB::commit();

            return back()->with('success', "Order #{$order->order_number} status updated to " . strtoupper($newDeliveryStatus) . "!");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to update delivery status: ' . $e->getMessage());
        }
    }
}
