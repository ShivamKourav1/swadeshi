<?php

namespace App\Services\Payments\Drivers;

use App\Contracts\PaymentGatewayInterface;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Carbon;

class StripePaymentDriver implements PaymentGatewayInterface
{
    public function getName(): string
    {
        return 'stripe';
    }

    public function processPayment(Order $order, array $data = []): Payment
    {
        $transactionId = $data['transaction_id'] ?? 'ch_mock_' . uniqid();

        $payment = Payment::updateOrCreate(
            ['order_id' => $order->id],
            [
                'payment_method' => 'stripe',
                'transaction_id' => $transactionId,
                'amount' => $order->total_amount,
                'status' => 'completed',
                'paid_at' => Carbon::now(),
                'notes' => 'Online payment processed via Stripe Gateway.',
            ]
        );

        $order->update([
            'payment_status' => 'paid',
        ]);

        return $payment;
    }

    public function collectDeliveryPayment(
        Order $order,
        User $deliveryPartner,
        float $amount,
        ?string $screenshotUrl = null,
        ?string $notes = null
    ): Payment {
        // Stripe payments are pre-paid, but method signature conforms to interface
        return Payment::where('order_id', $order->id)->firstOrFail();
    }
}
