<?php

namespace App\Services\Payments;

use App\Contracts\PaymentGatewayInterface;
use App\Services\Payments\Drivers\CodPaymentDriver;
use App\Services\Payments\Drivers\StripePaymentDriver;
use InvalidArgumentException;

class PaymentService
{
    protected array $drivers = [];

    public function __construct()
    {
        $this->registerDriver(new CodPaymentDriver());
        $this->registerDriver(new StripePaymentDriver());
    }

    public function registerDriver(PaymentGatewayInterface $driver): void
    {
        $this->drivers[$driver->getName()] = $driver;
    }

    public function driver(string $name): PaymentGatewayInterface
    {
        if (!isset($this->drivers[$name])) {
            throw new InvalidArgumentException("Unsupported payment method: {$name}");
        }

        return $this->drivers[$name];
    }
}
