<?php

namespace App\Contracts;

use App\Models\Order;
use App\Models\Payment;
use App\Models\User;

interface PaymentGatewayInterface
{
    /**
     * Process initial payment setup or order placement payment record.
     */
    public function processPayment(Order $order, array $data = []): Payment;

    /**
     * Collect payment upon delivery (e.g. by Delivery Partner for COD).
     */
    public function collectDeliveryPayment(
        Order $order,
        User $deliveryPartner,
        float $amount,
        ?string $screenshotUrl = null,
        ?string $notes = null
    ): Payment;

    /**
     * Get the identifier name of the driver (e.g., 'cod', 'stripe').
     */
    public function getName(): string;
}
