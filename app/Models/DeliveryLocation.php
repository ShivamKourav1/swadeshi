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
        'shakha_id',
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
            $shakha = Shakha::find($attributes['shakha_id']);
            if ($shakha && $shakha->basti_id) {
                $attributes['basti_id'] = $shakha->basti_id;
            }
        }
        return parent::fill($attributes);
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
     * Relationship for Shakha.
     */
    public function shakha(): BelongsTo
    {
        return $this->belongsTo(Shakha::class);
    }

    public function getShakhaIdAttribute(): ?int
    {
        return isset($this->attributes['shakha_id']) && $this->attributes['shakha_id'] !== null
            ? (int) $this->attributes['shakha_id']
            : null;
    }

    public function setShakhaIdAttribute(?int $value): void
    {
        $this->attributes['shakha_id'] = $value;
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
