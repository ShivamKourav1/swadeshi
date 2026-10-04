<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Swayamsevak extends Model
{
    use HasFactory;

    protected $table = 'swayamsevaks';

    protected $fillable = [
        'name',
        'mobile',
        'address',
        'basti_id',
        'ganvesh',
        'shikshan',
    ];

    protected $casts = [
        'ganvesh' => 'boolean',
    ];

    protected $appends = [
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

    public const SHIKSHAN_OPTIONS = [
        'प्रारंभिक',
        'प्राथमिक',
        'संघ शिक्षा वर्ग',
        'कार्यकर्ता विकास वर्ग - १',
        'कार्यकर्ता विकास वर्ग - २',
        'अन्य / कोई नहीं',
    ];

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

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function demands(): HasMany
    {
        return $this->hasMany(ProductDemand::class);
    }

    /**
     * Decode any accidental HTML entities on retrieval.
     */
    public function getNameAttribute($value): string
    {
        return html_entity_decode((string)$value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    public function getAddressAttribute($value): ?string
    {
        return $value !== null ? html_entity_decode((string)$value, ENT_QUOTES | ENT_HTML5, 'UTF-8') : null;
    }
}
