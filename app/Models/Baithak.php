<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Baithak extends Model
{
    use HasFactory;

    protected $table = 'baithaks';

    protected $fillable = [
        'unit_level',
        'unit_id',
        'title',
        'baithak_type',
        'baithak_date',
        'baithak_time',
        'venue',
        'agenda',
        'status',
        'expected_daayitwas',
        'custom_expected',
        'comments_scheduling',
        'minutes',
        'comments_minutes',
        'attended_count',
        'total_expected_count',
        'photos',
        'created_by_user_id',
    ];

    protected $casts = [
        'baithak_date' => 'date:Y-m-d',
        'expected_daayitwas' => 'array',
        'custom_expected' => 'array',
        'photos' => 'array',
        'attended_count' => 'integer',
        'total_expected_count' => 'integer',
    ];

    public function attendees(): HasMany
    {
        return $this->hasMany(BaithakAttendee::class);
    }

    public function swayamsevakAttendees(): HasMany
    {
        return $this->hasMany(BaithakAttendee::class)->where('attendee_type', 'swayamsevak');
    }

    public function guestAttendees(): HasMany
    {
        return $this->hasMany(BaithakAttendee::class)->where('attendee_type', 'guest');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /**
     * Recalculate and update the attended count from attendees relation.
     */
    public function recalculateAttendance(): void
    {
        $this->attended_count = $this->attendees()->where('is_present', true)->count();
        $this->total_expected_count = $this->attendees()->where('is_expected', true)->count();
        $this->save();
    }
}
