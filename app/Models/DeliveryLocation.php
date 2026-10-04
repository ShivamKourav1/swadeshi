<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeliveryLocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'label',
        'recipient_name',
        'phone',
        'address_line_1',
        'address_line_2',
        'city',
        'state',
        'postal_code',
        'country',
        'latitude',
        'longitude',
        'is_default',
        'kshetra_id',
        'prant_id',
        'vibhag_id',
        'jila_id',
        'nagar_id',
        'basti_id',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    protected $appends = [
        'organizational_hierarchy',
        'shakha_id',
    ];

    public function fill(array $attributes)
    {
        if (isset($attributes['shakha_id']) && !isset($attributes['basti_id'])) {
            $attributes['basti_id'] = $attributes['shakha_id'];
        }
        unset($attributes['shakha_id']);
        return parent::fill($attributes);
    }

    public function newEloquentBuilder($query)
    {
        return new class($query) extends \Illuminate\Database\Eloquent\Builder {
            public function where($column, $operator = null, $value = null, $boolean = 'and')
            {
                if (is_string($column)) {
                    $column = str_replace('shakha_id', 'basti_id', $column);
                }
                return parent::where($column, $operator, $value, $boolean);
            }
        };
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function kshetra(): BelongsTo
    {
        return $this->belongsTo(Kshetra::class);
    }

    public function prant(): BelongsTo
    {
        return $this->belongsTo(Prant::class);
    }

    public function vibhag(): BelongsTo
    {
        return $this->belongsTo(Vibhag::class);
    }

    public function jila(): BelongsTo
    {
        return $this->belongsTo(Jila::class);
    }

    public function nagar(): BelongsTo
    {
        return $this->belongsTo(Nagar::class);
    }

    public function basti(): BelongsTo
    {
        return $this->belongsTo(Basti::class);
    }

    /**
     * Backward-compatible alias for basti relationship.
     */
    public function shakha(): BelongsTo
    {
        return $this->basti();
    }

    public function getShakhaIdAttribute(): ?int
    {
        return $this->attributes['basti_id'] ?? null;
    }

    public function setShakhaIdAttribute(?int $value): void
    {
        $this->attributes['basti_id'] = $value;
    }

    /**
     * Get a formatted string of the organizational path.
     */
    public function getOrganizationalHierarchyAttribute(): ?string
    {
        $parts = [];
        if ($this->vibhag) {
            $parts[] = $this->vibhag->vibhag_name;
        }
        if ($this->jila) {
            $parts[] = $this->jila->jila_name;
        }
        if ($this->nagar) {
            $parts[] = $this->nagar->nagar_name;
        }
        $targetBasti = $this->basti ?: $this->shakha;
        if ($targetBasti) {
            $parts[] = $targetBasti->basti_name ?? $targetBasti->shakha_name;
        }

        return count($parts) > 0 ? implode(' > ', $parts) : null;
    }
}
