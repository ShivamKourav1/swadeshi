<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Prant extends Model
{
    use HasFactory;

    protected $table = 'prants';

    protected $fillable = [
        'kshetra_id',
        'prant_name',
        'toli',
    ];

    protected $casts = [
        'toli' => 'array',
    ];

    public function kshetra(): BelongsTo
    {
        return $this->belongsTo(Kshetra::class);
    }

    public function vibhags(): HasMany
    {
        return $this->hasMany(Vibhag::class);
    }

    public function jilas(): HasManyThrough
    {
        return $this->hasManyThrough(Jila::class, Vibhag::class);
    }
}
