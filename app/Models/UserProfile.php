<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'business_name',
        'business_address',
        'vehicle_type',
        'vehicle_number',
        'profile_photo_url',
        'bio',
        'kshetra_id',
        'prant_id',
        'vibhag_id',
        'jila_id',
        'nagar_id',
        'basti_id',
        'is_basti_toli_member',
        'is_nagar_toli_member',
        'is_jila_toli_member',
        'is_vibhag_toli_member',
        'is_kshetra_toli_member',
        'has_seeded_shakha_products',
    ];

    protected $casts = [
        'has_seeded_shakha_products' => 'boolean',
        'is_basti_toli_member' => 'boolean',
        'is_nagar_toli_member' => 'boolean',
        'is_jila_toli_member' => 'boolean',
        'is_vibhag_toli_member' => 'boolean',
        'is_kshetra_toli_member' => 'boolean',
    ];

    protected $appends = [
        'shakha_id',
        'is_shakha_toli_member',
    ];

    public function fill(array $attributes)
    {
        if (isset($attributes['shakha_id']) && !isset($attributes['basti_id'])) {
            $attributes['basti_id'] = $attributes['shakha_id'];
        }
        if (isset($attributes['is_shakha_toli_member']) && !isset($attributes['is_basti_toli_member'])) {
            $attributes['is_basti_toli_member'] = $attributes['is_shakha_toli_member'];
        }
        unset($attributes['shakha_id'], $attributes['is_shakha_toli_member']);
        return parent::fill($attributes);
    }

    public function newEloquentBuilder($query)
    {
        return new class($query) extends \Illuminate\Database\Eloquent\Builder {
            public function where($column, $operator = null, $value = null, $boolean = 'and')
            {
                if (is_string($column)) {
                    $column = str_replace(
                        ['shakha_id', 'is_shakha_toli_member'],
                        ['basti_id', 'is_basti_toli_member'],
                        $column
                    );
                }
                return parent::where($column, $operator, $value, $boolean);
            }
        };
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
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

    public function getIsShakhaToliMemberAttribute(): bool
    {
        return (bool) ($this->attributes['is_basti_toli_member'] ?? false);
    }

    public function setIsShakhaToliMemberAttribute(bool $value): void
    {
        $this->attributes['is_basti_toli_member'] = $value;
    }

    /**
     * Get a human-readable title of the assigned organizational scope.
     */
    public function getScopeDescriptionAttribute(): string
    {
        if ($this->basti_id && $this->basti) {
            return "Basti: {$this->basti->basti_name}";
        }
        if ($this->nagar_id && $this->nagar) {
            return "Nagar: {$this->nagar->nagar_name}";
        }
        if ($this->jila_id && $this->jila) {
            return "Jila: {$this->jila->jila_name}";
        }
        if ($this->vibhag_id && $this->vibhag) {
            return "Vibhag: {$this->vibhag->vibhag_name}";
        }
        if ($this->prant_id && $this->prant) {
            return "Prant: {$this->prant->prant_name}";
        }
        if ($this->kshetra_id && $this->kshetra) {
            return "Kshetra: {$this->kshetra->kshetra_name}";
        }

        return "All Units (Global Jurisdiction)";
    }
}
