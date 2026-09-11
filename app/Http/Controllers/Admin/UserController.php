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

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'phone' => $validated['phone'] ?? null,
            'status' => 'active',
        ]);

        UserProfile::create([
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

        // Sync assigned roles
        if (!empty($validated['role_ids'])) {
            $user->roles()->sync($validated['role_ids']);
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

        $userData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'phone' => $validated['phone'] ?? null,
            'status' => $validated['status'],
        ];

        if (!empty($validated['password'])) {
            $userData['password'] = Hash::make($validated['password']);
        }

        $user->update($userData);

        $profileData = [
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
        ];

        if ($user->profile) {
            $user->profile->update($profileData);
        } else {
            $user->profile()->create($profileData);
        }

        // Sync assigned roles
        if (isset($validated['role_ids'])) {
            $user->roles()->sync($validated['role_ids']);
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
