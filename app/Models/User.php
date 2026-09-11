<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    public function deliveryLocations(): HasMany
    {
        return $this->hasMany(DeliveryLocation::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'dealer_id');
    }

    public function customerOrders(): HasMany
    {
        return $this->hasMany(Order::class, 'customer_id');
    }

    public function deliveryAssignments(): HasMany
    {
        return $this->hasMany(Order::class, 'delivery_partner_id');
    }

    public function roles(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_user');
    }

    public function isDealer(): bool
    {
        return $this->role === 'dealer' || $this->hasRole('dealer');
    }

    public function isDeliveryPartner(): bool
    {
        return $this->role === 'delivery_partner' || $this->hasRole('delivery_partner');
    }

    public function isCustomer(): bool
    {
        return $this->role === 'customer' || $this->hasRole('customer');
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin' || $this->hasRole('admin');
    }

    public function isKaryakarta(): bool
    {
        return $this->role === 'karyakarta' || $this->hasRole('karyakarta') || str_contains($this->role, 'karyakarta') || $this->hasRole(['kshetra_karyakarta', 'prant_karyakarta', 'vibhag_karyakarta', 'jila_karyakarta', 'nagar_karyakarta', 'shakha_karyakarta']);
    }

    public function hasRole(string|array $roles): bool
    {
        if (is_string($roles)) {
            $roles = [$roles];
        }

        if (in_array($this->role, $roles)) {
            return true;
        }

        return $this->roles->pluck('name')->intersect($roles)->isNotEmpty();
    }

    public function hasPermission(string $permissionName): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        $userRoles = $this->relationLoaded('roles') ? $this->roles : $this->roles()->with('permissions')->get();

        // Check through assigned roles
        foreach ($userRoles as $role) {
            if ($role->hasPermission($permissionName)) {
                return true;
            }
        }

        // Also check default permissions for primary role if not yet in pivot
        $defaultPermissions = $this->getDefaultRolePermissions($this->role);
        return in_array($permissionName, $defaultPermissions);
    }

    public function getAllPermissions(): array
    {
        if ($this->isAdmin()) {
            return Permission::pluck('name')->toArray();
        }

        $permissions = [];
        foreach ($this->roles as $role) {
            $permissions = array_merge($permissions, $role->permissions->pluck('name')->toArray());
        }

        $defaultPermissions = $this->getDefaultRolePermissions($this->role);
        $permissions = array_merge($permissions, $defaultPermissions);

        return array_values(array_unique($permissions));
    }

    public function assignRole(Role|string $role): void
    {
        if (is_string($role)) {
            $roleModel = Role::where('name', $role)->first();
            if ($roleModel) {
                $this->roles()->syncWithoutDetaching([$roleModel->id]);
            }
        } elseif ($role instanceof Role) {
            $this->roles()->syncWithoutDetaching([$role->id]);
        }
    }

    public function syncRoles(array $roles): void
    {
        $roleIds = [];
        foreach ($roles as $r) {
            if ($r instanceof Role) {
                $roleIds[] = $r->id;
            } elseif (is_numeric($r)) {
                $roleIds[] = (int)$r;
            } elseif (is_string($r)) {
                $roleModel = Role::where('name', $r)->first();
                if ($roleModel) {
                    $roleIds[] = $roleModel->id;
                }
            }
        }

        $this->roles()->sync($roleIds);
    }

    /**
     * Determine if the user has rights to manage a specific organizational unit level.
     */
    public function canManageUnit(string $unitType, $targetUnit = null): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        $permissionName = "manage_{$unitType}";
        if (!$this->hasPermission($permissionName)) {
            return false;
        }

        // If user has no specific profile restriction, they have global jurisdiction with their permission
        $profile = $this->profile;
        if (!$profile) {
            return true;
        }

        // If target unit is provided, verify it falls within the user's jurisdiction scope
        if ($targetUnit) {
            return $this->isUnitWithinJurisdiction($unitType, $targetUnit, $profile);
        }

        return true;
    }

    /**
     * Check if a given unit instance falls within the user's assigned scope.
     */
    private function isUnitWithinJurisdiction(string $unitType, $targetUnit, UserProfile $profile): bool
    {
        // 1. Shakha scope
        if ($profile->shakha_id) {
            return $unitType === 'shakha' && (int)$targetUnit->id === (int)$profile->shakha_id;
        }

        // 2. Nagar scope
        if ($profile->nagar_id) {
            if ($unitType === 'shakha') {
                return (int)($targetUnit->nagar_id ?? 0) === (int)$profile->nagar_id;
            }
            if ($unitType === 'nagar') {
                return (int)$targetUnit->id === (int)$profile->nagar_id;
            }
            return false;
        }

        // 3. Jila scope
        if ($profile->jila_id) {
            if ($unitType === 'shakha') {
                $nagar = $targetUnit->nagar ?? Nagar::find($targetUnit->nagar_id);
                return $nagar && (int)$nagar->jila_id === (int)$profile->jila_id;
            }
            if ($unitType === 'nagar') {
                return (int)($targetUnit->jila_id ?? 0) === (int)$profile->jila_id;
            }
            if ($unitType === 'jila') {
                return (int)$targetUnit->id === (int)$profile->jila_id;
            }
            return false;
        }

        // 4. Vibhag scope
        if ($profile->vibhag_id) {
            if ($unitType === 'shakha') {
                $nagar = $targetUnit->nagar ?? Nagar::with('jila')->find($targetUnit->nagar_id);
                return $nagar && $nagar->jila && (int)$nagar->jila->vibhag_id === (int)$profile->vibhag_id;
            }
            if ($unitType === 'nagar') {
                $jila = $targetUnit->jila ?? Jila::find($targetUnit->jila_id);
                return $jila && (int)$jila->vibhag_id === (int)$profile->vibhag_id;
            }
            if ($unitType === 'jila') {
                return (int)($targetUnit->vibhag_id ?? 0) === (int)$profile->vibhag_id;
            }
            if ($unitType === 'vibhag') {
                return (int)$targetUnit->id === (int)$profile->vibhag_id;
            }
            return false;
        }

        // 5. Prant scope
        if ($profile->prant_id) {
            if ($unitType === 'shakha') {
                $nagar = $targetUnit->nagar ?? Nagar::with('jila.vibhag')->find($targetUnit->nagar_id);
                return $nagar && $nagar->jila && $nagar->jila->vibhag && (int)$nagar->jila->vibhag->prant_id === (int)$profile->prant_id;
            }
            if ($unitType === 'nagar') {
                $jila = $targetUnit->jila ?? Jila::with('vibhag')->find($targetUnit->jila_id);
                return $jila && $jila->vibhag && (int)$jila->vibhag->prant_id === (int)$profile->prant_id;
            }
            if ($unitType === 'jila') {
                $vibhag = $targetUnit->vibhag ?? Vibhag::find($targetUnit->vibhag_id);
                return $vibhag && (int)$vibhag->prant_id === (int)$profile->prant_id;
            }
            if ($unitType === 'vibhag') {
                return (int)($targetUnit->prant_id ?? 0) === (int)$profile->prant_id;
            }
            if ($unitType === 'prant') {
                return (int)$targetUnit->id === (int)$profile->prant_id;
            }
            return false;
        }

        // 6. Kshetra scope
        if ($profile->kshetra_id) {
            if ($unitType === 'shakha') {
                $nagar = $targetUnit->nagar ?? Nagar::with('jila.vibhag.prant')->find($targetUnit->nagar_id);
                return $nagar && $nagar->jila && $nagar->jila->vibhag && $nagar->jila->vibhag->prant && (int)$nagar->jila->vibhag->prant->kshetra_id === (int)$profile->kshetra_id;
            }
            if ($unitType === 'nagar') {
                $jila = $targetUnit->jila ?? Jila::with('vibhag.prant')->find($targetUnit->jila_id);
                return $jila && $jila->vibhag && $jila->vibhag->prant && (int)$jila->vibhag->prant->kshetra_id === (int)$profile->kshetra_id;
            }
            if ($unitType === 'jila') {
                $vibhag = $targetUnit->vibhag ?? Vibhag::with('prant')->find($targetUnit->vibhag_id);
                return $vibhag && $vibhag->prant && (int)$vibhag->prant->kshetra_id === (int)$profile->kshetra_id;
            }
            if ($unitType === 'vibhag') {
                $prant = $targetUnit->prant ?? Prant::find($targetUnit->prant_id);
                return $prant && (int)$prant->kshetra_id === (int)$profile->kshetra_id;
            }
            if ($unitType === 'prant') {
                return (int)($targetUnit->kshetra_id ?? 0) === (int)$profile->kshetra_id;
            }
            if ($unitType === 'kshetra') {
                return (int)$targetUnit->id === (int)$profile->kshetra_id;
            }
            return false;
        }

        return true;
    }

    /**
     * Fallback default permissions for legacy role strings.
     */
    private function getDefaultRolePermissions(string $role): array
    {
        return match ($role) {
            'admin' => Permission::pluck('name')->toArray(),
            'kshetra_karyakarta' => ['manage_prant', 'manage_vibhag', 'manage_jila', 'manage_nagar', 'manage_shakha', 'manage_toli', 'view_karyakarta_dashboard', 'view_unit_directory'],
            'prant_karyakarta' => ['manage_vibhag', 'manage_jila', 'manage_nagar', 'manage_shakha', 'manage_toli', 'view_karyakarta_dashboard', 'view_unit_directory'],
            'vibhag_karyakarta' => ['manage_jila', 'manage_nagar', 'manage_shakha', 'manage_toli', 'view_karyakarta_dashboard', 'view_unit_directory'],
            'jila_karyakarta', 'karyakarta' => ['manage_nagar', 'manage_shakha', 'manage_toli', 'view_karyakarta_dashboard', 'view_unit_directory'],
            'nagar_karyakarta' => ['manage_shakha', 'manage_toli', 'view_karyakarta_dashboard', 'view_unit_directory'],
            'shakha_karyakarta' => ['manage_toli', 'view_karyakarta_dashboard', 'view_unit_directory'],
            'dealer' => ['manage_products', 'manage_categories', 'manage_orders', 'manage_returns'],
            'delivery_partner' => ['deliver_orders'],
            default => [],
        };
    }
}
