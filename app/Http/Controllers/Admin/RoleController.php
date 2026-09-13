<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    /**
     * Display a listing of all roles and the permissions matrix.
     */
    public function index(Request $request): Response
    {
        if (!$request->user()->isSuperAdmin() && !$request->user()->hasPermission('manage_roles')) {
            abort(403, 'Unauthorized access to Role Management. Super Administrator rights required.');
        }

        $roles = Role::with(['permissions'])
            ->withCount(['users', 'permissions'])
            ->orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get();

        $allPermissions = Permission::orderBy('group')->orderBy('name')->get();
        $permissionsByGroup = $allPermissions->groupBy('group');

        return Inertia::render('Admin/Roles/Index', [
            'roles' => $roles,
            'allPermissions' => $allPermissions,
            'permissionsByGroup' => $permissionsByGroup,
        ]);
    }

    /**
     * Store a newly created role with assigned permissions.
     */
    public function store(Request $request): RedirectResponse
    {
        if (!$request->user()->isSuperAdmin() && !$request->user()->hasPermission('manage_roles')) {
            abort(403, 'Unauthorized access to Role Management. Super Administrator rights required.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:50', 'unique:roles,name', 'regex:/^[a-z0-9_]+$/'],
            'display_name' => ['required', 'string', 'max:255', 'regex:/^[^<>]*$/'],
            'description' => ['nullable', 'string', 'max:500', 'regex:/^[^<>]*$/'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string'],
        ], [
            'name.regex' => 'The machine name may only contain lowercase letters, numbers, and underscores.',
            'display_name.regex' => 'The display name cannot contain HTML tags.',
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'display_name' => $validated['display_name'],
            'description' => $validated['description'] ?? null,
            'is_system' => false,
        ]);

        if (!empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return back()->with('success', "Role '{$role->display_name}' created successfully!");
    }

    /**
     * Update the specified role and sync permissions.
     */
    public function update(Request $request, Role $role): RedirectResponse
    {
        if (!$request->user()->isSuperAdmin() && !$request->user()->hasPermission('manage_roles')) {
            abort(403, 'Unauthorized access to Role Management. Super Administrator rights required.');
        }

        $rules = [
            'display_name' => ['required', 'string', 'max:255', 'regex:/^[^<>]*$/'],
            'description' => ['nullable', 'string', 'max:500', 'regex:/^[^<>]*$/'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string'],
        ];

        if (!$role->is_system) {
            $rules['name'] = ['sometimes', 'required', 'string', 'max:50', 'unique:roles,name,' . $role->id, 'regex:/^[a-z0-9_]+$/'];
        }

        $validated = $request->validate($rules, [
            'display_name.regex' => 'The display name cannot contain HTML tags.',
        ]);

        $updateData = [
            'display_name' => $validated['display_name'],
            'description' => $validated['description'] ?? null,
        ];

        if (!$role->is_system && isset($validated['name'])) {
            $updateData['name'] = $validated['name'];
        }

        $role->update($updateData);

        // Always sync permissions
        $role->syncPermissions($validated['permissions'] ?? []);

        return back()->with('success', "Role '{$role->display_name}' updated successfully!");
    }

    /**
     * Remove the specified role from storage.
     */
    public function destroy(Request $request, Role $role): RedirectResponse
    {
        if (!$request->user()->isSuperAdmin() && !$request->user()->hasPermission('manage_roles')) {
            abort(403, 'Unauthorized access to Role Management. Super Administrator rights required.');
        }

        if ($role->is_system || $role->name === 'superadmin' || $role->name === 'admin') {
            return back()->with('error', "System role '{$role->display_name}' is locked and cannot be deleted.");
        }

        $userCount = $role->users()->count();
        if ($userCount > 0) {
            return back()->with('error', "Cannot delete role '{$role->display_name}' because {$userCount} user(s) are currently assigned to it. Reassign those users first.");
        }

        $role->delete();

        return back()->with('success', "Role '{$role->display_name}' deleted successfully!");
    }
}
