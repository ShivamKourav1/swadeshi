<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'delivery_partner_id',
        'status',
        'payment_collected',
        'amount_collected',
        'notes',
    ];

    protected $casts = [
        'payment_collected' => 'boolean',
        'amount_collected' => 'decimal:2',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function deliveryPartner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'delivery_partner_id');
    }
}
