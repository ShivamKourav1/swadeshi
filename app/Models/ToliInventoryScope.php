<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ToliInventoryScope extends Model
{
    use HasFactory;

    protected $fillable = [
        'unit_type',
        'unit_id',
        'visible_sub_units',
        'updated_by',
    ];

    protected $casts = [
        'visible_sub_units' => 'array',
        'unit_id' => 'integer',
    ];

    /**
     * Permitted subordinate unit types for each organizational level.
     */
    public const SUB_UNIT_HIERARCHY = [
        'kshetra' => ['prant', 'vibhag', 'jila', 'nagar', 'shakha'],
        'prant'   => ['vibhag', 'jila', 'nagar', 'shakha'],
        'vibhag'  => ['jila', 'nagar', 'shakha'],
        'jila'    => ['nagar', 'shakha'],
        'nagar'   => ['shakha'],
        'shakha'  => [],
    ];

    /**
     * Bilingual labels for unit types.
     */
    public const UNIT_LABELS = [
        'kshetra' => 'क्षेत्र (Kshetra)',
        'prant'   => 'प्रान्त (Prant)',
        'vibhag'  => 'विभाग (Vibhag)',
        'jila'    => 'ज़िला (Jila)',
        'nagar'   => 'नगर (Nagar)',
        'shakha'  => 'शाखा (Shakha)',
    ];

    /**
     * Pure Hindi labels for unit types.
     */
    public const UNIT_HINDI_LABELS = [
        'kshetra' => 'क्षेत्र',
        'prant'   => 'प्रान्त',
        'vibhag'  => 'विभाग',
        'jila'    => 'ज़िला',
        'nagar'   => 'नगर',
        'shakha'  => 'शाखा',
    ];

    /**
     * User who last updated this scope configuration.
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get available selectable sub-unit options for a given parent unit type.
     */
    public static function getAvailableSubUnits(string $unitType): array
    {
        $allowed = self::SUB_UNIT_HIERARCHY[$unitType] ?? [];
        $options = [];

        foreach ($allowed as $subType) {
            $options[] = [
                'id' => $subType,
                'name' => self::UNIT_LABELS[$subType] ?? ucfirst($subType),
                'hindi_label' => self::UNIT_HINDI_LABELS[$subType] ?? ucfirst($subType),
                'description' => "अधीनस्थ {$subType} टोली पृष्ठों पर उत्पाद दृश्यता की अनुमति दें",
            ];
        }

        return $options;
    }

    /**
     * Check if a specific target sub-unit type is visible under a parent unit.
     */
    public static function isSubUnitVisible(string $parentUnitType, int $parentUnitId, string $targetSubUnitType): bool
    {
        $scope = static::where('unit_type', $parentUnitType)
            ->where('unit_id', $parentUnitId)
            ->first();

        if (!$scope || !is_array($scope->visible_sub_units)) {
            return false;
        }

        return in_array($targetSubUnitType, $scope->visible_sub_units, true);
    }
}
