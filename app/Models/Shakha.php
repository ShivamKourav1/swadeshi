<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Shakha extends Model
{
    use HasFactory;

    protected $table = 'shakhas';

    protected $fillable = [
        'nagar_id',
        'shakha_name',
        'aayu_varg',
        'type',
        'toli',
        'status',
    ];

    protected $casts = [
        'toli' => 'array',
    ];

    public function nagar(): BelongsTo
    {
        return $this->belongsTo(Nagar::class);
    }
}
