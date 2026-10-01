<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class ProductDemand extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'customer_id',
        'swayamsevak_id',
        'quantity',
        'original_quantity',
        'status',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'original_quantity' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function swayamsevak(): BelongsTo
    {
        return $this->belongsTo(Swayamsevak::class, 'swayamsevak_id');
    }

    /**
     * Reduce pending demand numbers when stock increases (e.g. dealer restock, order cancellation).
     * Demand numbers are reduced by the increased stock amount, but never below 0.
     *
     * @param int $productId
     * @param int $addedStock
     * @return int Total demand units reduced
     */
    public static function reduceDemandOnStockIncrease(int $productId, int $addedStock): int
    {
        if ($addedStock <= 0) {
            return 0;
        }

        $remainingStock = $addedStock;
        $totalReduced = 0;

        // Fetch active demands in FIFO order (oldest first)
        $activeDemands = static::where('product_id', $productId)
            ->where('quantity', '>', 0)
            ->orderBy('created_at', 'asc')
            ->orderBy('id', 'asc')
            ->lockForUpdate()
            ->get();

        foreach ($activeDemands as $demand) {
            if ($remainingStock <= 0) {
                break;
            }

            if ($demand->quantity <= $remainingStock) {
                $deduct = $demand->quantity;
                $demand->quantity = 0;
                $demand->status = 'fulfilled';
                $remainingStock -= $deduct;
                $totalReduced += $deduct;
            } else {
                $deduct = $remainingStock;
                $demand->quantity -= $deduct;
                $remainingStock = 0;
                $totalReduced += $deduct;
            }

            $demand->save();
        }

        return $totalReduced;
    }
}
