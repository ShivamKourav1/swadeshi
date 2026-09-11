<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Kshetra extends Model
{
    use HasFactory;

    protected $table = 'kshetras';

    protected $fillable = [
        'kshetra_name',
        'toli',
    ];

    protected $casts = [
        'toli' => 'array',
    ];

    public function prants(): HasMany
    {
        return $this->hasMany(Prant::class);
    }

    public function vibhags(): HasManyThrough
    {
        return $this->hasManyThrough(Vibhag::class, Prant::class);
    }
}
