<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'business_name',
        'business_address',
        'vehicle_type',
        'vehicle_number',
        'profile_photo_url',
        'bio',
        'kshetra_id',
        'prant_id',
        'vibhag_id',
        'jila_id',
        'nagar_id',
        'shakha_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function kshetra(): BelongsTo
    {
        return $this->belongsTo(Kshetra::class);
    }

    public function prant(): BelongsTo
    {
        return $this->belongsTo(Prant::class);
    }

    public function vibhag(): BelongsTo
    {
        return $this->belongsTo(Vibhag::class);
    }

    public function jila(): BelongsTo
    {
        return $this->belongsTo(Jila::class);
    }

    public function nagar(): BelongsTo
    {
        return $this->belongsTo(Nagar::class);
    }

    public function shakha(): BelongsTo
    {
        return $this->belongsTo(Shakha::class);
    }

    /**
     * Get a human-readable title of the assigned organizational scope.
     */
    public function getScopeDescriptionAttribute(): string
    {
        if ($this->shakha_id && $this->shakha) {
            return "Shakha: {$this->shakha->shakha_name}";
        }
        if ($this->nagar_id && $this->nagar) {
            return "Nagar: {$this->nagar->nagar_name}";
        }
        if ($this->jila_id && $this->jila) {
            return "Jila: {$this->jila->jila_name}";
        }
        if ($this->vibhag_id && $this->vibhag) {
            return "Vibhag: {$this->vibhag->vibhag_name}";
        }
        if ($this->prant_id && $this->prant) {
            return "Prant: {$this->prant->prant_name}";
        }
        if ($this->kshetra_id && $this->kshetra) {
            return "Kshetra: {$this->kshetra->kshetra_name}";
        }

        return "All Units (Global Jurisdiction)";
    }
}
