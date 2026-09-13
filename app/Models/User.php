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

    public function isSuperAdmin(): bool
    {
        return $this->role === 'superadmin' || $this->hasRole('superadmin');
    }

    public function isToliAdmin(): bool
    {
        return ($this->role === 'admin' || $this->hasRole('admin')) && !$this->isSuperAdmin();
    }

    public function isAdmin(): bool
    {
        return $this->isSuperAdmin() || $this->role === 'admin' || $this->hasRole('admin');
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
        if ($this->isSuperAdmin()) {
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
        if ($this->isSuperAdmin()) {
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
        if ($this->isSuperAdmin()) {
            return true;
        }

        $permissionName = "manage_{$unitType}";
        if (!$this->hasPermission($permissionName) && !$this->isToliAdmin()) {
            return false;
        }

        $profile = $this->relationLoaded('profile') ? $this->profile : $this->profile()->first();
        if (!$profile) {
            return false;
        }

        // Toli admin cannot manage unit levels higher than their own toli jurisdiction
        if ($this->isToliAdmin()) {
            $jurisdiction = $this->getToliJurisdiction();
            if (!$jurisdiction) {
                return false;
            }

            $levelHierarchy = ['kshetra' => 6, 'prant' => 5, 'vibhag' => 4, 'jila' => 3, 'nagar' => 2, 'shakha' => 1];
            $adminRank = $levelHierarchy[$jurisdiction['level']] ?? 0;
            $unitRank = $levelHierarchy[$unitType] ?? 0;
            if ($unitRank > $adminRank) {
                return false;
            }
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
     * Check if user belongs to any organizational toli (Shakha, Nagar, Jila, Vibhag, or Kshetra).
     */
    public function belongsToToli(): bool
    {
        return $this->getToliJurisdiction() !== null;
    }

    /**
     * Resolve the user's toli jurisdiction level and ID.
     */
    public function getToliJurisdiction(): ?array
    {
        $profile = $this->relationLoaded('profile') ? $this->profile : $this->profile()->first();
        if (!$profile) {
            return null;
        }

        // 1. Check explicit toli member indicator flags
        if ($profile->is_shakha_toli_member && $profile->shakha_id) {
            return ['level' => 'shakha', 'id' => (int)$profile->shakha_id];
        }
        if ($profile->is_nagar_toli_member && $profile->nagar_id) {
            return ['level' => 'nagar', 'id' => (int)$profile->nagar_id];
        }
        if ($profile->is_jila_toli_member && $profile->jila_id) {
            return ['level' => 'jila', 'id' => (int)$profile->jila_id];
        }
        if ($profile->is_vibhag_toli_member && $profile->vibhag_id) {
            return ['level' => 'vibhag', 'id' => (int)$profile->vibhag_id];
        }
        if ($profile->is_kshetra_toli_member && ($profile->kshetra_id || $profile->prant_id)) {
            return ['level' => 'kshetra', 'id' => (int)($profile->kshetra_id ?? $profile->prant_id)];
        }

        // 2. Check toli roles
        if ($this->hasRole('shakha_karyakarta') && $profile->shakha_id) {
            return ['level' => 'shakha', 'id' => (int)$profile->shakha_id];
        }
        if ($this->hasRole('nagar_karyakarta') && $profile->nagar_id) {
            return ['level' => 'nagar', 'id' => (int)$profile->nagar_id];
        }
        if ($this->hasRole('jila_karyakarta') && $profile->jila_id) {
            return ['level' => 'jila', 'id' => (int)$profile->jila_id];
        }
        if ($this->hasRole('vibhag_karyakarta') && $profile->vibhag_id) {
            return ['level' => 'vibhag', 'id' => (int)$profile->vibhag_id];
        }
        if ($this->hasRole('prant_karyakarta') && $profile->prant_id) {
            return ['level' => 'prant', 'id' => (int)$profile->prant_id];
        }
        if ($this->hasRole('kshetra_karyakarta') && $profile->kshetra_id) {
            return ['level' => 'kshetra', 'id' => (int)$profile->kshetra_id];
        }

        // 3. Fallback: If user is karyakarta or admin and has assigned unit in profile
        if ($this->isKaryakarta() || $this->role === 'admin' || $this->hasRole('admin')) {
            if ($profile->shakha_id) {
                return ['level' => 'shakha', 'id' => (int)$profile->shakha_id];
            }
            if ($profile->nagar_id) {
                return ['level' => 'nagar', 'id' => (int)$profile->nagar_id];
            }
            if ($profile->jila_id) {
                return ['level' => 'jila', 'id' => (int)$profile->jila_id];
            }
            if ($profile->vibhag_id) {
                return ['level' => 'vibhag', 'id' => (int)$profile->vibhag_id];
            }
            if ($profile->prant_id) {
                return ['level' => 'prant', 'id' => (int)$profile->prant_id];
            }
            if ($profile->kshetra_id) {
                return ['level' => 'kshetra', 'id' => (int)$profile->kshetra_id];
            }
        }

        return null;
    }

    /**
     * Determine if this administrator can manage the given target user.
     */
    public function canManageUser(User $targetUser): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        // Toli admin cannot manage superadmin accounts
        if ($targetUser->isSuperAdmin()) {
            return false;
        }

        if ($this->id === $targetUser->id) {
            return true;
        }

        if (!$this->isToliAdmin()) {
            return false;
        }

        $jurisdiction = $this->getToliJurisdiction();
        if (!$jurisdiction) {
            return false;
        }

        $targetProfile = $targetUser->profile()->first();
        if (!$targetProfile) {
            return false;
        }

        return $this->isProfileWithinToliJurisdiction($targetProfile, $jurisdiction);
    }

    /**
     * Check if a given user profile falls within the specified toli jurisdiction.
     */
    public function isProfileWithinToliJurisdiction(UserProfile $targetProfile, array $jurisdiction): bool
    {
        $level = $jurisdiction['level'];
        $id = (int)$jurisdiction['id'];

        if ($level === 'shakha') {
            return (int)$targetProfile->shakha_id === $id;
        }

        if ($level === 'nagar') {
            if ((int)$targetProfile->nagar_id === $id) {
                return true;
            }
            if ($targetProfile->shakha_id) {
                $shakha = $targetProfile->shakha ?: Shakha::find($targetProfile->shakha_id);
                return $shakha && (int)$shakha->nagar_id === $id;
            }
            return false;
        }

        if ($level === 'jila') {
            if ((int)$targetProfile->jila_id === $id) {
                return true;
            }
            if ($targetProfile->nagar_id) {
                $nagar = $targetProfile->nagar ?: Nagar::find($targetProfile->nagar_id);
                return $nagar && (int)$nagar->jila_id === $id;
            }
            if ($targetProfile->shakha_id) {
                $shakha = $targetProfile->shakha ?: Shakha::with('nagar')->find($targetProfile->shakha_id);
                return $shakha && $shakha->nagar && (int)$shakha->nagar->jila_id === $id;
            }
            return false;
        }

        if ($level === 'vibhag') {
            if ((int)$targetProfile->vibhag_id === $id) {
                return true;
            }
            if ($targetProfile->jila_id) {
                $jila = $targetProfile->jila ?: Jila::find($targetProfile->jila_id);
                return $jila && (int)$jila->vibhag_id === $id;
            }
            if ($targetProfile->nagar_id) {
                $nagar = $targetProfile->nagar ?: Nagar::with('jila')->find($targetProfile->nagar_id);
                return $nagar && $nagar->jila && (int)$nagar->jila->vibhag_id === $id;
            }
            return false;
        }

        if ($level === 'prant') {
            if ((int)$targetProfile->prant_id === $id) {
                return true;
            }
            if ($targetProfile->vibhag_id) {
                $vibhag = $targetProfile->vibhag ?: Vibhag::find($targetProfile->vibhag_id);
                return $vibhag && (int)$vibhag->prant_id === $id;
            }
            return false;
        }

        if ($level === 'kshetra') {
            if ((int)$targetProfile->kshetra_id === $id) {
                return true;
            }
            if ($targetProfile->prant_id) {
                $prant = $targetProfile->prant ?: Prant::find($targetProfile->prant_id);
                return $prant && (int)$prant->kshetra_id === $id;
            }
            return false;
        }

        return false;
    }

    /**
     * Fallback default permissions for legacy role strings.
     */
    private function getDefaultRolePermissions(string $role): array
    {
        return match ($role) {
            'superadmin' => Permission::pluck('name')->toArray(),
            'admin' => ['manage_users', 'manage_toli', 'view_unit_directory', 'view_karyakarta_dashboard'],
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
