<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'display_name',
        'description',
        'is_system',
    ];

    protected $casts = [
        'is_system' => 'boolean',
    ];

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'permission_role');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'role_user');
    }

    public function hasPermission(string $permissionName): bool
    {
        if ($this->relationLoaded('permissions')) {
            return $this->permissions->contains('name', $permissionName);
        }

        return $this->permissions()->where('name', $permissionName)->exists();
    }

    public function givePermissionTo(Permission|string $permission): void
    {
        if (is_string($permission)) {
            $permission = Permission::where('name', $permission)->firstOrFail();
        }

        $this->permissions()->syncWithoutDetaching([$permission->id]);
    }

    public function syncPermissions(array $permissions): void
    {
        $permissionIds = [];
        foreach ($permissions as $perm) {
            if ($perm instanceof Permission) {
                $permissionIds[] = $perm->id;
            } elseif (is_numeric($perm)) {
                $permissionIds[] = (int)$perm;
            } elseif (is_string($perm)) {
                $p = Permission::where('name', $perm)->first();
                if ($p) {
                    $permissionIds[] = $p->id;
                }
            }
        }

        $this->permissions()->sync($permissionIds);
    }
}
