<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminUserCreateRequest;
use App\Http\Requests\AdminUserUpdateRequest;
use App\Models\Jila;
use App\Models\Kshetra;
use App\Models\Nagar;
use App\Models\Prant;
use App\Models\Role;
use App\Models\Shakha;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\Vibhag;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display a listing of all users with search, role filters, and pagination.
     */
    public function index(Request $request): Response
    {
        if (!$request->user()->isAdmin()) {
            abort(403, 'Admin access required.');
        }

        $role = $request->input('role');
        $search = $request->input('search');

        $users = User::with([
            'roles',
            'profile.kshetra',
            'profile.prant',
            'profile.vibhag',
            'profile.jila',
            'profile.nagar',
            'profile.shakha',
        ])
            ->when($role, function ($q) use ($role) {
                return $q->where(function ($sub) use ($role) {
                    $sub->where('role', $role)
                        ->orWhereHas('roles', function ($rq) use ($role) {
                            $rq->where('name', $role);
                        });
                });
            })
            ->when($search, function ($q) use ($search) {
                return $q->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                          ->orWhere('email', 'like', "%{$search}%")
                          ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $allRoles = Role::orderBy('display_name')->get();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'roles' => $allRoles,
            'filters' => [
                'role' => $role ?? '',
                'search' => $search ?? '',
            ],
        ]);
    }

    /**
     * Show the form for creating a new user with role assignment and jurisdiction selection.
     */
    public function create(Request $request): Response
    {
        if (!$request->user()->isAdmin()) {
            abort(403, 'Admin access required.');
        }

        return Inertia::render('Admin/Users/Create', [
            'roles' => Role::with('permissions')->orderBy('display_name')->get(),
            'kshetras' => Kshetra::orderBy('kshetra_name')->get(),
            'prants' => Prant::with('kshetra')->orderBy('prant_name')->get(),
            'vibhags' => Vibhag::with('prant')->orderBy('vibhag_name')->get(),
            'jilas' => Jila::with('vibhag')->orderBy('jila_name')->get(),
            'nagars' => Nagar::with('jila')->orderBy('nagar_name')->get(),
            'shakhas' => Shakha::with('nagar')->orderBy('shakha_name')->get(),
        ]);
    }

    /**
     * Store a newly created user and their profile with assigned roles and jurisdiction.
     */
    public function store(AdminUserCreateRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        [$role, $roleIds] = $this->resolveRoleAndIds($validated['role'] ?? 'karyakarta', $validated['role_ids'] ?? []);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $role,
            'phone' => $validated['phone'] ?? null,
            'status' => 'active',
        ]);

        $profileData = $this->resolveJurisdictionHierarchy([
            'user_id' => $user->id,
            'bio' => $validated['bio'] ?? null,
            'business_name' => $validated['business_name'] ?? null,
            'business_address' => $validated['business_address'] ?? null,
            'vehicle_type' => $validated['vehicle_type'] ?? null,
            'vehicle_number' => $validated['vehicle_number'] ?? null,
            'kshetra_id' => $validated['kshetra_id'] ?? null,
            'prant_id' => $validated['prant_id'] ?? null,
            'vibhag_id' => $validated['vibhag_id'] ?? null,
            'jila_id' => $validated['jila_id'] ?? null,
            'nagar_id' => $validated['nagar_id'] ?? null,
            'shakha_id' => $validated['shakha_id'] ?? null,
        ]);

        UserProfile::create($profileData);

        // Sync assigned roles
        if (!empty($roleIds)) {
            $user->roles()->sync($roleIds);
        } else {
            $matchedRole = Role::where('name', $user->role)->first();
            if ($matchedRole) {
                $user->roles()->sync([$matchedRole->id]);
            }
        }

        $roleLabel = ucfirst(str_replace('_', ' ', $user->role));

        return redirect()->route('admin.users.index')
            ->with('success', "{$roleLabel} '{$user->name}' onboarded successfully!");
    }

    /**
     * Show the form for editing an existing user.
     */
    public function edit(Request $request, User $user): Response
    {
        if (!$request->user()->isAdmin()) {
            abort(403, 'Admin access required.');
        }

        $user->load([
            'roles',
            'profile.kshetra',
            'profile.prant',
            'profile.vibhag',
            'profile.jila',
            'profile.nagar',
            'profile.shakha',
        ]);

        return Inertia::render('Admin/Users/Edit', [
            'user' => $user,
            'roles' => Role::with('permissions')->orderBy('display_name')->get(),
            'kshetras' => Kshetra::orderBy('kshetra_name')->get(),
            'prants' => Prant::with('kshetra')->orderBy('prant_name')->get(),
            'vibhags' => Vibhag::with('prant')->orderBy('vibhag_name')->get(),
            'jilas' => Jila::with('vibhag')->orderBy('jila_name')->get(),
            'nagars' => Nagar::with('jila')->orderBy('nagar_name')->get(),
            'shakhas' => Shakha::with('nagar')->orderBy('shakha_name')->get(),
        ]);
    }

    /**
     * Update an existing user and their profile with roles and jurisdiction.
     */
    public function update(AdminUserUpdateRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();

        [$role, $roleIds] = $this->resolveRoleAndIds($validated['role'] ?? $user->role, $validated['role_ids'] ?? null);

        $userData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $role,
            'phone' => $validated['phone'] ?? null,
            'status' => $validated['status'],
        ];

        if (!empty($validated['password'])) {
            $userData['password'] = Hash::make($validated['password']);
        }

        $user->update($userData);

        $profileData = $this->resolveJurisdictionHierarchy([
            'bio' => $validated['bio'] ?? null,
            'business_name' => $validated['business_name'] ?? null,
            'business_address' => $validated['business_address'] ?? null,
            'vehicle_type' => $validated['vehicle_type'] ?? null,
            'vehicle_number' => $validated['vehicle_number'] ?? null,
            'kshetra_id' => $validated['kshetra_id'] ?? null,
            'prant_id' => $validated['prant_id'] ?? null,
            'vibhag_id' => $validated['vibhag_id'] ?? null,
            'jila_id' => $validated['jila_id'] ?? null,
            'nagar_id' => $validated['nagar_id'] ?? null,
            'shakha_id' => $validated['shakha_id'] ?? null,
        ]);

        if ($user->profile) {
            $user->profile->update($profileData);
        } else {
            $profileData['user_id'] = $user->id;
            $user->profile()->create($profileData);
        }

        // Sync assigned roles
        if (!empty($roleIds)) {
            $user->roles()->sync($roleIds);
        } else {
            $matchedRole = Role::where('name', $user->role)->first();
            if ($matchedRole) {
                $user->roles()->sync([$matchedRole->id]);
            }
        }

        return redirect()->route('admin.users.index')
            ->with('success', "User '{$user->name}' updated successfully!");
    }

    /**
     * Resolve effective primary role and role IDs.
     */
    private function resolveRoleAndIds(string $role, ?array $roleIds): array
    {
        $roleIds = $roleIds ?? [];
        if (!empty($roleIds)) {
            $assignedRoleNames = Role::whereIn('id', $roleIds)->pluck('name')->toArray();
            $hasKaryakartaRole = array_intersect($assignedRoleNames, [
                'karyakarta', 'kshetra_karyakarta', 'prant_karyakarta', 
                'vibhag_karyakarta', 'jila_karyakarta', 'nagar_karyakarta', 'shakha_karyakarta'
            ]);

            if ($role === 'customer' || empty($role)) {
                if (in_array('admin', $assignedRoleNames)) {
                    $role = 'admin';
                } elseif (!empty($hasKaryakartaRole)) {
                    $role = 'karyakarta';
                } elseif (in_array('dealer', $assignedRoleNames)) {
                    $role = 'dealer';
                } elseif (in_array('delivery_partner', $assignedRoleNames)) {
                    $role = 'delivery_partner';
                }
            }
        }

        if (str_contains($role, 'karyakarta')) {
            $role = 'karyakarta';
        }

        return [$role, $roleIds];
    }

    /**
     * Auto-resolve parent jurisdiction hierarchy when sub-units are selected.
     */
    private function resolveJurisdictionHierarchy(array $profileData): array
    {
        if (!empty($profileData['shakha_id'])) {
            $shakha = Shakha::with('nagar.jila.vibhag.prant')->find($profileData['shakha_id']);
            if ($shakha) {
                $profileData['nagar_id'] = $profileData['nagar_id'] ?: $shakha->nagar_id;
                $profileData['jila_id'] = $profileData['jila_id'] ?: $shakha->nagar?->jila_id;
                $profileData['vibhag_id'] = $profileData['vibhag_id'] ?: $shakha->nagar?->jila?->vibhag_id;
                $profileData['prant_id'] = $profileData['prant_id'] ?: $shakha->nagar?->jila?->vibhag?->prant_id;
                $profileData['kshetra_id'] = $profileData['kshetra_id'] ?: $shakha->nagar?->jila?->vibhag?->prant?->kshetra_id;
            }
        } elseif (!empty($profileData['nagar_id'])) {
            $nagar = Nagar::with('jila.vibhag.prant')->find($profileData['nagar_id']);
            if ($nagar) {
                $profileData['jila_id'] = $profileData['jila_id'] ?: $nagar->jila_id;
                $profileData['vibhag_id'] = $profileData['vibhag_id'] ?: $nagar->jila?->vibhag_id;
                $profileData['prant_id'] = $profileData['prant_id'] ?: $nagar->jila?->vibhag?->prant_id;
                $profileData['kshetra_id'] = $profileData['kshetra_id'] ?: $nagar->jila?->vibhag?->prant?->kshetra_id;
            }
        } elseif (!empty($profileData['jila_id'])) {
            $jila = Jila::with('vibhag.prant')->find($profileData['jila_id']);
            if ($jila) {
                $profileData['vibhag_id'] = $profileData['vibhag_id'] ?: $jila->vibhag_id;
                $profileData['prant_id'] = $profileData['prant_id'] ?: $jila->vibhag?->prant_id;
                $profileData['kshetra_id'] = $profileData['kshetra_id'] ?: $jila->vibhag?->prant?->kshetra_id;
            }
        } elseif (!empty($profileData['vibhag_id'])) {
            $vibhag = Vibhag::with('prant')->find($profileData['vibhag_id']);
            if ($vibhag) {
                $profileData['prant_id'] = $profileData['prant_id'] ?: $vibhag->prant_id;
                $profileData['kshetra_id'] = $profileData['kshetra_id'] ?: $vibhag->prant?->kshetra_id;
            }
        } elseif (!empty($profileData['prant_id'])) {
            $prant = Prant::find($profileData['prant_id']);
            if ($prant) {
                $profileData['kshetra_id'] = $profileData['kshetra_id'] ?: $prant->kshetra_id;
            }
        }

        return $profileData;
    }

    /**
     * Remove the specified user from storage with safety checks.
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        if (!$request->user()->isAdmin()) {
            abort(403);
        }

        if ($user->id === $request->user()->id) {
            return back()->with('error', 'You cannot delete your own administrator account.');
        }

        // Check if user has associated orders or products
        if ($user->customerOrders()->count() > 0) {
            return back()->with('error', "Cannot delete user '{$user->name}' because they have active order history.");
        }

        if ($user->products()->count() > 0) {
            return back()->with('error', "Cannot delete dealer '{$user->name}' because they have listed products in catalog.");
        }

        $user->delete();

        return back()->with('success', "User '{$user->name}' deleted successfully.");
    }

    /**
     * Toggle active/inactive status of a user.
     */
    public function toggleStatus(Request $request, User $user): RedirectResponse
    {
        if (!$request->user()->isAdmin()) {
            abort(403);
        }

        if ($user->id === $request->user()->id) {
            return back()->with('error', 'Cannot deactivate your own admin account.');
        }

        $newStatus = $user->status === 'active' ? 'inactive' : 'active';
        $user->update(['status' => $newStatus]);

        return back()->with('success', "User status updated to {$newStatus}.");
    }
}
