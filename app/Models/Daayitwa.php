<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Daayitwa extends Model
{
    use HasFactory;

    protected $table = 'daayitwa';

    protected $fillable = [
        'name',
        'unit_level',
    ];

    public const UNIT_LEVELS = [
        'shakha' => 'शाखा (Shakha)',
        'basti' => 'बस्ती (Basti)',
        'nagar' => 'नगर (Nagar)',
        'jila' => 'जिला (Jila)',
        'vibhag' => 'विभाग (Vibhag)',
        'prant' => 'प्रान्त (Prant)',
        'kshetra' => 'क्षेत्र (Kshetra)',
    ];

    public function swayamsevaks(): HasMany
    {
        return $this->hasMany(Swayamsevak::class, 'daayitwa_id');
    }

    public function getUnitLevelHindiAttribute(): string
    {
        return match ($this->unit_level) {
            'shakha' => 'शाखा',
            'basti' => 'बस्ती',
            'nagar', 'nager' => 'नगर',
            'jila' => 'जिला',
            'vibhag' => 'विभाग',
            'prant' => 'प्रान्त',
            'kshetra' => 'क्षेत्र',
            default => ucfirst((string)$this->unit_level),
        };
    }
}
