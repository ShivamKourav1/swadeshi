<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'product_id',
        'dealer_id',
        'product_name',
        'unit_price',
        'quantity',
        'subtotal',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'quantity' => 'integer',
    ];

    public function getProductNameAttribute($value): string
    {
        $decoded = (string) $value;
        while (str_contains($decoded, '&') && preg_match('/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/', $decoded)) {
            $prev = $decoded;
            $decoded = html_entity_decode($decoded, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            if ($decoded === $prev) {
                break;
            }
        }
        return $decoded;
    }

    public function setProductNameAttribute($value): void
    {
        $decoded = (string) $value;
        while (str_contains($decoded, '&') && preg_match('/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/', $decoded)) {
            $prev = $decoded;
            $decoded = html_entity_decode($decoded, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            if ($decoded === $prev) {
                break;
            }
        }
        $this->attributes['product_name'] = $decoded;
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function dealer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dealer_id');
    }
}
