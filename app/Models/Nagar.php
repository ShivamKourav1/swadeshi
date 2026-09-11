<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Nagar extends Model
{
    use HasFactory;

    protected $table = 'nagars';

    protected $fillable = [
        'jila_id',
        'nagar_name',
        'toli',
    ];

    protected $casts = [
        'toli' => 'array',
    ];

    public function jila(): BelongsTo
    {
        return $this->belongsTo(Jila::class);
    }

    public function shakhas(): HasMany
    {
        return $this->hasMany(Shakha::class);
    }
}
