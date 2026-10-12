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
        'shakha_id',
        'daayitwa_id',
        'ganvesh',
        'have_pant',
        'have_shirt',
        'have_topi',
        'have_dand',
        'have_belt',
        'have_moje',
        'have_shoes',
        'shikshan',
    ];

    protected $casts = [
        'ganvesh' => 'boolean',
        'have_pant' => 'boolean',
        'have_shirt' => 'boolean',
        'have_topi' => 'boolean',
        'have_dand' => 'boolean',
        'have_belt' => 'boolean',
        'have_moje' => 'boolean',
        'have_shoes' => 'boolean',
    ];

    public const SHIKSHAN_OPTIONS = [
        'प्रारंभिक',
        'प्राथमिक',
        'संघ शिक्षा वर्ग',
        'कार्यकर्ता विकास वर्ग - १',
        'कार्यकर्ता विकास वर्ग - २',
        'अन्य / कोई नहीं',
    ];

    public function daayitwa(): BelongsTo
    {
        return $this->belongsTo(Daayitwa::class, 'daayitwa_id');
    }

    public function basti(): BelongsTo
    {
        return $this->belongsTo(Basti::class, 'basti_id');
    }

    public function shakha(): BelongsTo
    {
        return $this->belongsTo(Shakha::class, 'shakha_id');
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
