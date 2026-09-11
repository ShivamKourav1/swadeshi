<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Jila extends Model
{
    use HasFactory;

    protected $table = 'jilas';

    protected $fillable = [
        'vibhag_id',
        'jila_name',
        'toli',
    ];

    protected $casts = [
        'toli' => 'array',
    ];

    public function vibhag(): BelongsTo
    {
        return $this->belongsTo(Vibhag::class);
    }

    public function nagars(): HasMany
    {
        return $this->hasMany(Nagar::class);
    }

    public function shakhas(): HasManyThrough
    {
        return $this->hasManyThrough(Shakha::class, Nagar::class);
    }
}
