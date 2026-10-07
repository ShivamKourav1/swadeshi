<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Basti extends Model
{
    use HasFactory;

    protected $table = 'bastis';

    protected $fillable = [
        'nagar_id',
        'basti_name',
        'toli',
        'status',
    ];

    protected $casts = [
        'toli' => 'array',
    ];

    protected $appends = [
        'shakha_name',
    ];

    public function fill(array $attributes)
    {
        if (isset($attributes['shakha_name']) && !isset($attributes['basti_name'])) {
            $attributes['basti_name'] = $attributes['shakha_name'];
        }
        unset($attributes['shakha_name']);
        return parent::fill($attributes);
    }

    public function newEloquentBuilder($query)
    {
        return new class($query) extends \Illuminate\Database\Eloquent\Builder {
            public function where($column, $operator = null, $value = null, $boolean = 'and')
            {
                if (is_string($column)) {
                    $column = str_replace('shakha_name', 'basti_name', $column);
                }
                return parent::where($column, $operator, $value, $boolean);
            }
        };
    }

    public function setAttribute($key, $value)
    {
        if ($key === 'shakha_name') {
            $this->attributes['basti_name'] = $value;
            return $this;
        }
        return parent::setAttribute($key, $value);
    }

    /**
     * Backward-compatible accessor & mutator for shakha_name.
     */
    public function getShakhaNameAttribute(): ?string
    {
        return $this->attributes['basti_name'] ?? null;
    }

    public function setShakhaNameAttribute(?string $value): void
    {
        $this->attributes['basti_name'] = $value;
    }

    public function nagar(): BelongsTo
    {
        return $this->belongsTo(Nagar::class);
    }

    public function shakhas(): HasMany
    {
        return $this->hasMany(Shakha::class, 'basti_id');
    }

    public function swayamsevaks(): HasMany
    {
        return $this->hasMany(Swayamsevak::class, 'basti_id');
    }
}
