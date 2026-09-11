<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReturnRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'customer_id',
        'dealer_id',
        'status',
        'reason',
        'customer_notes',
        'dealer_notes',
        'raised_at',
        'accepted_at',
        'rejected_at',
        'fulfilled_at',
    ];

    protected $casts = [
        'raised_at' => 'datetime',
        'accepted_at' => 'datetime',
        'rejected_at' => 'datetime',
        'fulfilled_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function dealer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dealer_id');
    }

    public function isRaised(): bool
    {
        return $this->status === 'return_request_raised';
    }

    public function isAccepted(): bool
    {
        return $this->status === 'return_request_accepted';
    }

    public function isRejected(): bool
    {
        return $this->status === 'return_request_rejected';
    }

    public function isFulfilled(): bool
    {
        return $this->status === 'return_request_fulfilled';
    }
}
