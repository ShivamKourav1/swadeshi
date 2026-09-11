<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'customer_id',
        'delivery_location_id',
        'delivery_partner_id',
        'subtotal',
        'delivery_fee',
        'total_amount',
        'payment_method',
        'payment_status',
        'delivery_status',
        'order_status',
        'notes',
        'cancellation_reason',
        'cancellation_stage',
        'cancelled_at',
        'cancelled_by',
        'restocked',
        'restocked_at',
        'restocked_by',
        'placed_at',
        'delivered_at',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'delivery_fee' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'restocked' => 'boolean',
        'cancelled_at' => 'datetime',
        'restocked_at' => 'datetime',
        'placed_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function deliveryLocation(): BelongsTo
    {
        return $this->belongsTo(DeliveryLocation::class);
    }

    public function deliveryPartner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'delivery_partner_id');
    }

    public function cancelledByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function restockedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'restocked_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function deliveryLogs(): HasMany
    {
        return $this->hasMany(DeliveryLog::class);
    }

    public function returnRequests(): HasMany
    {
        return $this->hasMany(ReturnRequest::class);
    }

    public function returnRequest(): HasOne
    {
        return $this->hasOne(ReturnRequest::class)->latestOfMany();
    }

    public function canBeCancelled(): bool
    {
        return $this->order_status !== 'cancelled' 
            && $this->order_status !== 'completed' 
            && $this->delivery_status !== 'delivered';
    }

    public function canRaiseReturnRequest(): bool
    {
        if ($this->order_status === 'cancelled') {
            return false;
        }

        $isDeliveredOrCompleted = $this->order_status === 'completed' || $this->delivery_status === 'delivered';
        if (!$isDeliveredOrCompleted) {
            return false;
        }

        $latestReturn = $this->returnRequest;
        if ($latestReturn && in_array($latestReturn->status, ['return_request_raised', 'return_request_accepted', 'return_request_fulfilled'])) {
            return false;
        }

        return true;
    }

    public function hasActiveReturnRequest(): bool
    {
        $latestReturn = $this->returnRequest;
        return $latestReturn && in_array($latestReturn->status, ['return_request_raised', 'return_request_accepted']);
    }

    public function isCancelled(): bool
    {
        return $this->order_status === 'cancelled';
    }

    public function isPendingRestock(): bool
    {
        return $this->isCancelled() && !$this->restocked;
    }

    public static function generateOrderNumber(): string
    {
        return 'ORD-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
    }
}
