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
use App\Services\UserImportService;
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
        $currentUser = $request->user();
        if (!$currentUser->isAdmin()) {
            abort(403, 'Admin access required.');
        }

        $role = $request->input('role');
        $search = $request->input('search');

        $query = User::with([
            'roles',
            'profile.kshetra',
            'profile.prant',
            'profile.vibhag',
            'profile.jila',
            'profile.nagar',
            'profile.shakha',
        ]);

        // If toli admin, scope users strictly to toli jurisdiction and exclude superadmins
        if ($currentUser->isToliAdmin()) {
            $jurisdiction = $currentUser->getToliJurisdiction();
            $query->where(function ($q) use ($jurisdiction, $currentUser) {
                // Admin can always see their own account
                $q->where('users.id', $currentUser->id);

                if ($jurisdiction) {
                    $level = $jurisdiction['level'];
                    $id = (int)$jurisdiction['id'];

                    $q->orWhereHas('profile', function ($pq) use ($level, $id) {
                        if ($level === 'shakha') {
                            $pq->where('shakha_id', $id);
                        } elseif ($level === 'nagar') {
                            $pq->where('nagar_id', $id)
                               ->orWhereHas('shakha', fn($sq) => $sq->where('nagar_id', $id));
                        } elseif ($level === 'jila') {
                            $pq->where('jila_id', $id)
                               ->orWhereHas('nagar', fn($nq) => $nq->where('jila_id', $id))
                               ->orWhereHas('shakha.nagar', fn($snq) => $snq->where('jila_id', $id));
                        } elseif ($level === 'vibhag') {
                            $pq->where('vibhag_id', $id)
                               ->orWhereHas('jila', fn($jq) => $jq->where('vibhag_id', $id))
                               ->orWhereHas('nagar.jila', fn($njq) => $njq->where('vibhag_id', $id))
                               ->orWhereHas('shakha.nagar.jila', fn($snjq) => $snjq->where('vibhag_id', $id));
                        } elseif ($level === 'prant') {
                            $pq->where('prant_id', $id)
                               ->orWhereHas('vibhag', fn($vq) => $vq->where('prant_id', $id));
                        } elseif ($level === 'kshetra') {
                            $pq->where('kshetra_id', $id)
                               ->orWhereHas('prant', fn($prq) => $prq->where('kshetra_id', $id));
                        }
                    });
                }
            });

            // Toli admin cannot view superadmin accounts
            $query->where('role', '!=', 'superadmin')
                  ->whereDoesntHave('roles', fn($rq) => $rq->where('name', 'superadmin'));
        }

        $users = $query
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

        $allRoles = Role::when(!$currentUser->isSuperAdmin(), function ($q) {
            return $q->where('name', '!=', 'superadmin');
        })->orderBy('display_name')->get();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'roles' => $allRoles,
            'filters' => [
                'role' => $role ?? '',
                'search' => $search ?? '',
            ],
            'can_manage_roles' => $currentUser->isSuperAdmin(),
            'is_superadmin' => $currentUser->isSuperAdmin(),
            'is_toli_admin' => $currentUser->isToliAdmin(),
        ]);
    }

    /**
     * Show the form for creating a new user with role assignment and jurisdiction selection.
     */
    public function create(Request $request): Response
    {
        $currentUser = $request->user();
        if (!$currentUser->isAdmin()) {
            abort(403, 'Admin access required.');
        }

        $this->ensureCoreRolesExist();

        // Scope roles dropdown: toli admin cannot assign superadmin
        $rolesQuery = Role::with('permissions');
        if (!$currentUser->isSuperAdmin()) {
            $rolesQuery->where('name', '!=', 'superadmin');
        }

        // Scope organizational unit dropdowns if toli admin
        $kshetras = Kshetra::orderBy('kshetra_name')->get();
        $prants = Prant::with('kshetra')->orderBy('prant_name')->get();
        $vibhags = Vibhag::with('prant')->orderBy('vibhag_name')->get();
        $jilas = Jila::with('vibhag')->orderBy('jila_name')->get();
        $nagars = Nagar::with('jila')->orderBy('nagar_name')->get();
        $shakhas = Shakha::with('nagar')->orderBy('shakha_name')->get();

        if ($currentUser->isToliAdmin()) {
            $jurisdiction = $currentUser->getToliJurisdiction();
            if ($jurisdiction) {
                $level = $jurisdiction['level'];
                $id = (int)$jurisdiction['id'];

                if ($level === 'jila') {
                    $jilas = $jilas->where('id', $id)->values();
                    $nagars = $nagars->where('jila_id', $id)->values();
                    $nagarIds = $nagars->pluck('id')->toArray();
                    $shakhas = $shakhas->whereIn('nagar_id', $nagarIds)->values();
                } elseif ($level === 'nagar') {
                    $nagars = $nagars->where('id', $id)->values();
                    $shakhas = $shakhas->where('nagar_id', $id)->values();
                } elseif ($level === 'shakha') {
                    $shakhas = $shakhas->where('id', $id)->values();
                } elseif ($level === 'vibhag') {
                    $vibhags = $vibhags->where('id', $id)->values();
                    $jilas = $jilas->where('vibhag_id', $id)->values();
                    $jilaIds = $jilas->pluck('id')->toArray();
                    $nagars = $nagars->whereIn('jila_id', $jilaIds)->values();
                    $nagarIds = $nagars->pluck('id')->toArray();
                    $shakhas = $shakhas->whereIn('nagar_id', $nagarIds)->values();
                }
            }
        }

        return Inertia::render('Admin/Users/Create', [
            'roles' => $rolesQuery->orderBy('display_name')->get(),
            'kshetras' => $kshetras,
            'prants' => $prants,
            'vibhags' => $vibhags,
            'jilas' => $jilas,
            'nagars' => $nagars,
            'shakhas' => $shakhas,
            'is_superadmin' => $currentUser->isSuperAdmin(),
            'is_toli_admin' => $currentUser->isToliAdmin(),
        ]);
    }

    /**
     * Store a newly created user and their profile with assigned roles and jurisdiction.
     */
    public function store(AdminUserCreateRequest $request): RedirectResponse
    {
        $currentUser = $request->user();
        if (!$currentUser->isAdmin()) {
            abort(403);
        }

        $validated = $request->validated();

        [$role, $roleIds] = $this->resolveRoleAndIds($validated['role'] ?? 'karyakarta', $validated['role_ids'] ?? []);

        // Superadmin check: only superadmin can assign superadmin
        if (($role === 'superadmin' || in_array(Role::where('name', 'superadmin')->value('id'), $roleIds)) && !$currentUser->isSuperAdmin()) {
            abort(403, 'Unauthorized. Only Super Administrator can create superadmin accounts.');
        }

        // Toli Admin check: Admin role can ONLY be assigned to karyakartas who belong to a toli!
        $isAdminAssigned = ($role === 'admin' || in_array(Role::where('name', 'admin')->value('id'), $roleIds));
        if ($isAdminAssigned) {
            $hasToliJurisdiction = !empty($validated['shakha_id']) || !empty($validated['nagar_id']) || !empty($validated['jila_id']) || !empty($validated['vibhag_id']) || !empty($validated['kshetra_id']) || !empty($validated['prant_id']);
            $hasToliRole = !empty(array_intersect(Role::whereIn('id', $roleIds)->pluck('name')->toArray(), [
                'shakha_karyakarta', 'nagar_karyakarta', 'jila_karyakarta', 'vibhag_karyakarta', 'kshetra_karyakarta', 'prant_karyakarta'
            ]));
            $hasToliFlag = !empty($validated['is_shakha_toli_member']) || !empty($validated['is_nagar_toli_member']) || !empty($validated['is_jila_toli_member']) || !empty($validated['is_vibhag_toli_member']) || !empty($validated['is_kshetra_toli_member']);

            if (!$hasToliJurisdiction && !$hasToliRole && !$hasToliFlag) {
                return back()->withErrors([
                    'role' => 'The Admin role can only be assigned to Karyakartas who belong to an organizational toli (Shakha, Nagar, Jila, Vibhag, or Kshetra). Please select an organizational unit jurisdiction or toli membership.',
                ])->withInput();
            }
        }

        // If toli admin is creating the user, verify the jurisdiction is within their toli!
        if ($currentUser->isToliAdmin()) {
            $jurisdiction = $currentUser->getToliJurisdiction();
            if ($jurisdiction) {
                $level = $jurisdiction['level'];
                $adminUnitId = (int)$jurisdiction['id'];

                if (!empty($validated['jila_id']) && $level === 'jila' && (int)$validated['jila_id'] !== $adminUnitId) {
                    abort(403, 'Cannot create a user outside your assigned Jila jurisdiction.');
                }
                if (!empty($validated['nagar_id']) && $level === 'nagar' && (int)$validated['nagar_id'] !== $adminUnitId) {
                    abort(403, 'Cannot create a user outside your assigned Nagar jurisdiction.');
                }
                if (!empty($validated['shakha_id']) && $level === 'shakha' && (int)$validated['shakha_id'] !== $adminUnitId) {
                    abort(403, 'Cannot create a user outside your assigned Shakha jurisdiction.');
                }

                // If no unit specified, default to toli admin's jurisdiction
                if (empty($validated['shakha_id']) && empty($validated['nagar_id']) && empty($validated['jila_id']) && empty($validated['vibhag_id']) && empty($validated['kshetra_id'])) {
                    $validated[$level . '_id'] = $adminUnitId;
                }
            }
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => !empty($validated['email']) ? $validated['email'] : null,
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
            'is_shakha_toli_member' => !empty($validated['is_shakha_toli_member']) || in_array(Role::where('name', 'shakha_karyakarta')->value('id'), $roleIds),
            'is_nagar_toli_member' => !empty($validated['is_nagar_toli_member']) || in_array(Role::where('name', 'nagar_karyakarta')->value('id'), $roleIds),
            'is_jila_toli_member' => !empty($validated['is_jila_toli_member']) || in_array(Role::where('name', 'jila_karyakarta')->value('id'), $roleIds),
            'is_vibhag_toli_member' => !empty($validated['is_vibhag_toli_member']) || in_array(Role::where('name', 'vibhag_karyakarta')->value('id'), $roleIds),
            'is_kshetra_toli_member' => !empty($validated['is_kshetra_toli_member']) || in_array(Role::where('name', 'kshetra_karyakarta')->value('id'), $roleIds),
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
        $currentUser = $request->user();
        if (!$currentUser->isAdmin()) {
            abort(403, 'Admin access required.');
        }

        if (!$currentUser->canManageUser($user)) {
            abort(403, 'Unauthorized. User is outside of your assigned toli jurisdiction.');
        }

        $this->ensureCoreRolesExist();

        $user->load([
            'roles',
            'profile.kshetra',
            'profile.prant',
            'profile.vibhag',
            'profile.jila',
            'profile.nagar',
            'profile.shakha',
        ]);

        // Scope roles dropdown: toli admin cannot assign superadmin
        $rolesQuery = Role::with('permissions');
        if (!$currentUser->isSuperAdmin()) {
            $rolesQuery->where('name', '!=', 'superadmin');
        }

        // Scope organizational unit dropdowns if toli admin
        $kshetras = Kshetra::orderBy('kshetra_name')->get();
        $prants = Prant::with('kshetra')->orderBy('prant_name')->get();
        $vibhags = Vibhag::with('prant')->orderBy('vibhag_name')->get();
        $jilas = Jila::with('vibhag')->orderBy('jila_name')->get();
        $nagars = Nagar::with('jila')->orderBy('nagar_name')->get();
        $shakhas = Shakha::with('nagar')->orderBy('shakha_name')->get();

        if ($currentUser->isToliAdmin()) {
            $jurisdiction = $currentUser->getToliJurisdiction();
            if ($jurisdiction) {
                $level = $jurisdiction['level'];
                $id = (int)$jurisdiction['id'];

                if ($level === 'jila') {
                    $jilas = $jilas->where('id', $id)->values();
                    $nagars = $nagars->where('jila_id', $id)->values();
                    $nagarIds = $nagars->pluck('id')->toArray();
                    $shakhas = $shakhas->whereIn('nagar_id', $nagarIds)->values();
                } elseif ($level === 'nagar') {
                    $nagars = $nagars->where('id', $id)->values();
                    $shakhas = $shakhas->where('nagar_id', $id)->values();
                } elseif ($level === 'shakha') {
                    $shakhas = $shakhas->where('id', $id)->values();
                } elseif ($level === 'vibhag') {
                    $vibhags = $vibhags->where('id', $id)->values();
                    $jilas = $jilas->where('vibhag_id', $id)->values();
                    $jilaIds = $jilas->pluck('id')->toArray();
                    $nagars = $nagars->whereIn('jila_id', $jilaIds)->values();
                    $nagarIds = $nagars->pluck('id')->toArray();
                    $shakhas = $shakhas->whereIn('nagar_id', $nagarIds)->values();
                }
            }
        }

        return Inertia::render('Admin/Users/Edit', [
            'user' => $user,
            'roles' => $rolesQuery->orderBy('display_name')->get(),
            'kshetras' => $kshetras,
            'prants' => $prants,
            'vibhags' => $vibhags,
            'jilas' => $jilas,
            'nagars' => $nagars,
            'shakhas' => $shakhas,
            'is_superadmin' => $currentUser->isSuperAdmin(),
            'is_toli_admin' => $currentUser->isToliAdmin(),
        ]);
    }

    /**
     * Update an existing user and their profile with roles and jurisdiction.
     */
    public function update(AdminUserUpdateRequest $request, User $user): RedirectResponse
    {
        $currentUser = $request->user();
        if (!$currentUser->isAdmin()) {
            abort(403);
        }

        if (!$currentUser->canManageUser($user)) {
            abort(403, 'Unauthorized. User is outside of your assigned toli jurisdiction.');
        }

        $validated = $request->validated();

        [$role, $roleIds] = $this->resolveRoleAndIds($validated['role'] ?? $user->role, $validated['role_ids'] ?? null);

        // Superadmin check
        if (($role === 'superadmin' || in_array(Role::where('name', 'superadmin')->value('id'), $roleIds)) && !$currentUser->isSuperAdmin()) {
            abort(403, 'Unauthorized. Only Super Administrator can assign superadmin role.');
        }

        // Toli Admin check: Admin role can ONLY be assigned to karyakartas who belong to a toli!
        $isAdminAssigned = ($role === 'admin' || in_array(Role::where('name', 'admin')->value('id'), $roleIds));
        if ($isAdminAssigned) {
            $hasToliJurisdiction = !empty($validated['shakha_id']) || !empty($validated['nagar_id']) || !empty($validated['jila_id']) || !empty($validated['vibhag_id']) || !empty($validated['kshetra_id']) || !empty($validated['prant_id']);
            $hasToliRole = !empty(array_intersect(Role::whereIn('id', $roleIds)->pluck('name')->toArray(), [
                'shakha_karyakarta', 'nagar_karyakarta', 'jila_karyakarta', 'vibhag_karyakarta', 'kshetra_karyakarta', 'prant_karyakarta'
            ]));
            $hasToliFlag = !empty($validated['is_shakha_toli_member']) || !empty($validated['is_nagar_toli_member']) || !empty($validated['is_jila_toli_member']) || !empty($validated['is_vibhag_toli_member']) || !empty($validated['is_kshetra_toli_member']);

            if (!$hasToliJurisdiction && !$hasToliRole && !$hasToliFlag) {
                return back()->withErrors([
                    'role' => 'The Admin role can only be assigned to Karyakartas who belong to an organizational toli (Shakha, Nagar, Jila, Vibhag, or Kshetra). Please select an organizational unit jurisdiction or toli membership.',
                ])->withInput();
            }
        }

        // If toli admin is updating, verify jurisdiction stays inside their toli!
        if ($currentUser->isToliAdmin()) {
            $jurisdiction = $currentUser->getToliJurisdiction();
            if ($jurisdiction) {
                $level = $jurisdiction['level'];
                $adminUnitId = (int)$jurisdiction['id'];

                if (!empty($validated['jila_id']) && $level === 'jila' && (int)$validated['jila_id'] !== $adminUnitId) {
                    abort(403, 'Cannot transfer a user outside your assigned Jila jurisdiction.');
                }
                if (!empty($validated['nagar_id']) && $level === 'nagar' && (int)$validated['nagar_id'] !== $adminUnitId) {
                    abort(403, 'Cannot transfer a user outside your assigned Nagar jurisdiction.');
                }
                if (!empty($validated['shakha_id']) && $level === 'shakha' && (int)$validated['shakha_id'] !== $adminUnitId) {
                    abort(403, 'Cannot transfer a user outside your assigned Shakha jurisdiction.');
                }
            }
        }

        $userData = [
            'name' => $validated['name'],
            'email' => !empty($validated['email']) ? $validated['email'] : null,
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
            'is_shakha_toli_member' => !empty($validated['is_shakha_toli_member']) || in_array(Role::where('name', 'shakha_karyakarta')->value('id'), $roleIds),
            'is_nagar_toli_member' => !empty($validated['is_nagar_toli_member']) || in_array(Role::where('name', 'nagar_karyakarta')->value('id'), $roleIds),
            'is_jila_toli_member' => !empty($validated['is_jila_toli_member']) || in_array(Role::where('name', 'jila_karyakarta')->value('id'), $roleIds),
            'is_vibhag_toli_member' => !empty($validated['is_vibhag_toli_member']) || in_array(Role::where('name', 'vibhag_karyakarta')->value('id'), $roleIds),
            'is_kshetra_toli_member' => !empty($validated['is_kshetra_toli_member']) || in_array(Role::where('name', 'kshetra_karyakarta')->value('id'), $roleIds),
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
                if (in_array('superadmin', $assignedRoleNames)) {
                    $role = 'superadmin';
                } elseif (in_array('admin', $assignedRoleNames)) {
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
        $currentUser = $request->user();
        if (!$currentUser->isAdmin()) {
            abort(403);
        }

        if (!$currentUser->canManageUser($user)) {
            abort(403, 'Unauthorized. User is outside of your assigned toli jurisdiction.');
        }

        if ($user->id === $currentUser->id) {
            return back()->with('error', 'You cannot delete your own administrator account.');
        }

        if ($user->isSuperAdmin()) {
            abort(403, 'Superadmin accounts cannot be deleted.');
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
        $currentUser = $request->user();
        if (!$currentUser->isAdmin()) {
            abort(403);
        }

        if (!$currentUser->canManageUser($user)) {
            abort(403, 'Unauthorized. User is outside of your assigned toli jurisdiction.');
        }

        if ($user->id === $currentUser->id) {
            return back()->with('error', 'Cannot deactivate your own admin account.');
        }

        if ($user->isSuperAdmin() && !$currentUser->isSuperAdmin()) {
            abort(403, 'Cannot modify status of superadmin account.');
        }

        $newStatus = $user->status === 'active' ? 'inactive' : 'active';
        $user->update(['status' => $newStatus]);

        return back()->with('success', "User status updated to {$newStatus}.");
    }

    /**
     * Download Excel/CSV user import template with Toli membership columns.
     */
    public function downloadImportTemplate(): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $csvContent = UserImportService::generateTemplateCsv();

        return response()->streamDownload(function () use ($csvContent) {
            echo $csvContent;
        }, 'users_import_template.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Import users via uploaded Excel or CSV spreadsheet.
     */
    public function importUsers(Request $request, UserImportService $importService): RedirectResponse
    {
        if (!$request->user()->isAdmin()) {
            abort(403, 'Admin access required.');
        }

        $request->validate([
            'file' => ['required', 'file', 'max:5120'], // Max 5MB
        ]);

        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension());
        if (!in_array($ext, ['csv', 'xlsx', 'txt'])) {
            return back()->with('error', 'Invalid file type. Please upload an Excel (.xlsx) or CSV (.csv) file.');
        }

        $result = $importService->import($file, $request->user());

        if (!$result['success']) {
            return back()->with('error', $result['message']);
        }

        $msg = $result['message'];
        if (!empty($result['errors'])) {
            $msg .= ' (Note: ' . implode(' ', array_slice($result['errors'], 0, 3)) . ')';
        }

        return redirect()->route('admin.users.index')->with('success', $msg);
    }

    /**
     * Ensure all core roles exist with intuitive bilingual display names.
     */
    private function ensureCoreRolesExist(): void
    {
        $core = [
            'superadmin' => 'Superadmin (मुख्य व्यवस्थापक / सुपर एडमिन)',
            'admin' => 'Toli Administrator (टोली व्यवस्थापक / प्रशासक)',
            'dealer' => 'Dealer (विक्रेता / डीलर)',
            'customer' => 'Customer (ग्राहक / क्रेता)',
            'delivery_partner' => 'Delivery Partner (वितरण साथी)',
            'karyakarta' => 'Karyakarta (सामान्य कार्यकर्ता)',
            'jila_karyakarta' => 'Jila Karyakarta (जिला कार्यकर्ता)',
            'nagar_karyakarta' => 'Nagar Karyakarta (नगर कार्यकर्ता)',
            'shakha_karyakarta' => 'Shakha Karyakarta (शाखा कार्यकर्ता)',
            'vibhag_karyakarta' => 'Vibhag Karyakarta (विभाग कार्यकर्ता)',
            'prant_karyakarta' => 'Prant Karyakarta (प्रान्त कार्यकर्ता)',
            'kshetra_karyakarta' => 'Kshetra Karyakarta (क्षेत्र कार्यकर्ता)',
        ];

        foreach ($core as $name => $displayName) {
            Role::firstOrCreate(
                ['name' => $name],
                [
                    'display_name' => $displayName,
                    'is_system' => in_array($name, ['superadmin', 'admin', 'dealer', 'customer', 'delivery_partner']),
                ]
            );
        }
    }
}
