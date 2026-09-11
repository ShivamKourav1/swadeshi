<?php

namespace App\Http\Controllers;

use App\Models\DeliveryLog;
use App\Models\Order;
use App\Models\ReturnRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReturnRequestController extends Controller
{
    public function store(Request $request, Order $order): RedirectResponse
    {
        $user = $request->user();

        if ($order->customer_id !== $user->id) {
            abort(403, 'Unauthorized to raise return request for this order.');
        }

        if (!$order->canRaiseReturnRequest()) {
            return back()->with('error', 'Return request cannot be raised for this order.');
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
            'customer_notes' => 'nullable|string|max:1000',
        ]);

        $dealerId = $order->items()->first()?->dealer_id;

        DB::beginTransaction();

        try {
            $returnRequest = ReturnRequest::create([
                'order_id' => $order->id,
                'customer_id' => $user->id,
                'dealer_id' => $dealerId,
                'status' => 'return_request_raised',
                'reason' => $validated['reason'],
                'customer_notes' => $validated['customer_notes'] ?? null,
                'raised_at' => now(),
            ]);

            DeliveryLog::create([
                'order_id' => $order->id,
                'delivery_partner_id' => null,
                'status' => 'return_requested',
                'payment_collected' => false,
                'notes' => "Customer {$user->name} raised a return request. Reason: {$validated['reason']}",
            ]);

            DB::commit();

            return back()->with('success', 'Return request raised successfully! Awaiting dealer review.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to raise return request: ' . $e->getMessage());
        }
    }

    public function accept(Request $request, ReturnRequest $returnRequest): RedirectResponse
    {
        $user = $request->user();
        $order = $returnRequest->order;

        $isDealer = $user->isDealer() && $order->items()->where('dealer_id', $user->id)->exists();
        $isAdmin = $user->isAdmin();

        if (!$isDealer && !$isAdmin) {
            abort(403, 'Unauthorized to accept return request for this order.');
        }

        if ($returnRequest->status !== 'return_request_raised') {
            return back()->with('error', 'Return request cannot be accepted in its current state.');
        }

        $validated = $request->validate([
            'dealer_notes' => 'nullable|string|max:1000',
        ]);

        DB::beginTransaction();

        try {
            $returnRequest->update([
                'status' => 'return_request_accepted',
                'dealer_notes' => $validated['dealer_notes'] ?? 'Return request accepted by dealer. Awaiting physical product return.',
                'accepted_at' => now(),
            ]);

            DeliveryLog::create([
                'order_id' => $order->id,
                'delivery_partner_id' => null,
                'status' => 'return_accepted',
                'payment_collected' => false,
                'notes' => "Return request accepted by Dealer ({$user->name}). Waiting for customer to bring/send physical product to dealer store.",
            ]);

            DB::commit();

            return back()->with('success', 'Return request accepted. Awaiting physical product arrival at your store.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to accept return request: ' . $e->getMessage());
        }
    }

    public function reject(Request $request, ReturnRequest $returnRequest): RedirectResponse
    {
        $user = $request->user();
        $order = $returnRequest->order;

        $isDealer = $user->isDealer() && $order->items()->where('dealer_id', $user->id)->exists();
        $isAdmin = $user->isAdmin();

        if (!$isDealer && !$isAdmin) {
            abort(403, 'Unauthorized to reject return request for this order.');
        }

        if ($returnRequest->status !== 'return_request_raised') {
            return back()->with('error', 'Return request cannot be rejected in its current state.');
        }

        $validated = $request->validate([
            'dealer_notes' => 'required|string|max:1000',
        ], [
            'dealer_notes.required' => 'Please provide a reason for rejecting the return request.',
        ]);

        DB::beginTransaction();

        try {
            $returnRequest->update([
                'status' => 'return_request_rejected',
                'dealer_notes' => $validated['dealer_notes'],
                'rejected_at' => now(),
            ]);

            DeliveryLog::create([
                'order_id' => $order->id,
                'delivery_partner_id' => null,
                'status' => 'return_rejected',
                'payment_collected' => false,
                'notes' => "Return request rejected by Dealer ({$user->name}). Reason: {$validated['dealer_notes']}",
            ]);

            DB::commit();

            return back()->with('success', 'Return request rejected.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to reject return request: ' . $e->getMessage());
        }
    }

    public function fulfill(Request $request, ReturnRequest $returnRequest): RedirectResponse
    {
        $user = $request->user();
        $order = $returnRequest->order;

        $isDealer = $user->isDealer() && $order->items()->where('dealer_id', $user->id)->exists();
        $isAdmin = $user->isAdmin();

        if (!$isDealer && !$isAdmin) {
            abort(403, 'Unauthorized to fulfill return request for this order.');
        }

        if ($returnRequest->status !== 'return_request_accepted') {
            return back()->with('error', 'Return request must be accepted before it can be marked as fulfilled.');
        }

        DB::beginTransaction();

        try {
            // 1. Mark return request fulfilled
            $returnRequest->update([
                'status' => 'return_request_fulfilled',
                'fulfilled_at' => now(),
            ]);

            // 2. Increment stock for dealer products
            $order->load('items.product');
            foreach ($order->items as $item) {
                if ($isAdmin || $item->dealer_id === $user->id) {
                    if ($item->product) {
                        $item->product->increment('stock', $item->quantity);
                    }
                }
            }

            // 3. Automatically cancel the Order with remark "Return Request"
            $order->update([
                'order_status' => 'cancelled',
                'delivery_status' => 'returned',
                'cancellation_stage' => 'after_dispatch',
                'cancellation_reason' => 'Return Request: ' . $returnRequest->reason,
                'cancelled_at' => now(),
                'cancelled_by' => $user->id,
                'restocked' => true,
                'restocked_at' => now(),
                'restocked_by' => $user->id,
            ]);

            // 4. Record audit log
            DeliveryLog::create([
                'order_id' => $order->id,
                'delivery_partner_id' => null,
                'status' => 'returned',
                'payment_collected' => false,
                'notes' => "Product physically received at dealer store by {$user->name}. Return fulfilled, order cancelled (Return Request), and stock restored.",
            ]);

            DB::commit();

            return back()->with('success', 'Physical product verified and received! Order marked as cancelled (Return Request) and inventory stock restored.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to fulfill return request: ' . $e->getMessage());
        }
    }
}

