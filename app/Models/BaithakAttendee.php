<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BaithakAttendee extends Model
{
    use HasFactory;

    protected $table = 'baithak_attendees';

    protected $fillable = [
        'baithak_id',
        'swayamsevak_id',
        'attendee_type',
        'name',
        'mobile',
        'daayitwa_name',
        'unit_name',
        'unit_level',
        'is_expected',
        'is_present',
        'remarks',
    ];

    protected $casts = [
        'is_expected' => 'boolean',
        'is_present' => 'boolean',
    ];

    public function baithak(): BelongsTo
    {
        return $this->belongsTo(Baithak::class);
    }

    public function swayamsevak(): BelongsTo
    {
        return $this->belongsTo(Swayamsevak::class);
    }
}
