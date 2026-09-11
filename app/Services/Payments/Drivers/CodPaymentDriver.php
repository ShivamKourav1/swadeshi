<?php

namespace App\Services\Payments\Drivers;

use App\Contracts\PaymentGatewayInterface;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Carbon;

class CodPaymentDriver implements PaymentGatewayInterface
{
    public function getName(): string
    {
        return 'cod';
    }

    public function processPayment(Order $order, array $data = []): Payment
    {
        // For COD, payment record is created in pending status on order placement
        return Payment::updateOrCreate(
            ['order_id' => $order->id],
            [
                'payment_method' => 'cod',
                'amount' => $order->total_amount,
                'status' => 'pending',
                'notes' => 'Cash on delivery payment pending upon fulfillment.',
            ]
        );
    }

    public function collectDeliveryPayment(
        Order $order,
        User $deliveryPartner,
        float $amount,
        ?string $screenshotUrl = null,
        ?string $notes = null
    ): Payment {
        $payment = Payment::updateOrCreate(
            ['order_id' => $order->id],
            [
                'payment_method' => 'cod',
                'amount' => $amount,
                'status' => 'completed',
                'collected_by_id' => $deliveryPartner->id,
                'screenshot_url' => $screenshotUrl,
                'notes' => $notes ?? 'COD Payment collected by delivery partner',
                'paid_at' => Carbon::now(),
            ]
        );

        // Update order payment status
        $order->update([
            'payment_status' => 'paid',
        ]);

        return $payment;
    }
}
