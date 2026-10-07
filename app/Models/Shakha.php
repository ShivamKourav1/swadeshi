<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shakha extends Model
{
    use HasFactory;

    protected $table = 'shakhas';

    protected $fillable = [
        'shakha_name',
        'aayu_varg',
        'type',
        'new_ganvesh',
        'toli',
        'status',
        'jila_id',
        'nagar_id',
        'basti_id',
    ];

    protected $casts = [
        'toli' => 'array',
        'new_ganvesh' => 'integer',
    ];

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

    public function swayamsevaks(): HasMany
    {
        return $this->hasMany(Swayamsevak::class, 'shakha_id');
    }

    /**
     * Helper to get full hierarchical context display text.
     */
    public function getHierarchyDisplayAttribute(): string
    {
        $parts = [];
        if ($this->basti) {
            $parts[] = "Basti: {$this->basti->basti_name}";
        }
        if ($this->nagar || $this->basti?->nagar) {
            $nagarName = $this->nagar?->nagar_name ?? $this->basti->nagar->nagar_name;
            $parts[] = "Nagar: {$nagarName}";
        }
        if ($this->jila || $this->nagar?->jila || $this->basti?->nagar?->jila) {
            $jilaName = $this->jila?->jila_name ?? ($this->nagar?->jila?->jila_name ?? $this->basti->nagar->jila->jila_name);
            $parts[] = "Jila: {$jilaName}";
        }

        return !empty($parts) ? implode(' > ', $parts) : 'Independent Shakha';
    }
}
