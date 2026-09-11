<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Vibhag extends Model
{
    use HasFactory;

    protected $table = 'vibhags';

    protected $fillable = [
        'prant_id',
        'vibhag_name',
        'toli',
    ];

    protected $casts = [
        'toli' => 'array',
    ];

    public function prant(): BelongsTo
    {
        return $this->belongsTo(Prant::class);
    }

    public function jilas(): HasMany
    {
        return $this->hasMany(Jila::class);
    }

    public function nagars(): HasManyThrough
    {
        return $this->hasManyThrough(Nagar::class, Jila::class);
    }
}
