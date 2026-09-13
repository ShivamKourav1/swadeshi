<?php

namespace App\Http\Controllers\Karyakarta;

use App\Http\Controllers\Controller;
use App\Models\DeliveryLocation;
use App\Models\Jila;
use App\Models\Kshetra;
use App\Models\Nagar;
use App\Models\Prant;
use App\Models\Shakha;
use App\Models\Vibhag;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationUnitController extends Controller
{
    /**
     * Display all organizational units with hierarchical drilldown & toli member management.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (!$user->isAdmin() && !$user->isKaryakarta() && !$user->hasPermission('view_unit_directory')) {
            abort(403, 'Unauthorized access to Organizational Unit Management.');
        }

        $activeTab = $request->input('tab', 'shakhas');

        $kshetras = Kshetra::withCount(['prants'])->get();
        $prants = Prant::with('kshetra')->withCount(['vibhags'])->get();
        $vibhags = Vibhag::with('prant.kshetra')->withCount(['jilas'])->get();
        $jilas = Jila::with('vibhag.prant')->withCount(['nagars'])->get();
        $nagars = Nagar::with('jila.vibhag')->withCount(['shakhas'])->get();
        $shakhas = Shakha::with('nagar.jila')->get();

        $profile = $user->profile()->with(['kshetra', 'prant', 'vibhag', 'jila', 'nagar', 'shakha'])->first();

        // Calculate permissions for the UI
        $permissions = [
            'manage_kshetra' => $user->canManageUnit('kshetra'),
            'manage_prant' => $user->canManageUnit('prant'),
            'manage_vibhag' => $user->canManageUnit('vibhag'),
            'manage_jila' => $user->canManageUnit('jila'),
            'manage_nagar' => $user->canManageUnit('nagar'),
            'manage_shakha' => $user->canManageUnit('shakha'),
            'manage_toli' => $user->isSuperAdmin() || $user->hasPermission('manage_toli') || $user->isToliAdmin(),
        ];

        return Inertia::render('Karyakarta/Units/Index', [
            'activeTab' => $activeTab,
            'kshetras' => $kshetras,
            'prants' => $prants,
            'vibhags' => $vibhags,
            'jilas' => $jilas,
            'nagars' => $nagars,
            'shakhas' => $shakhas,
            'permissions' => $permissions,
            'is_admin' => $user->isSuperAdmin(),
            'scope' => [
                'description' => $profile?->scope_description ?? 'Global Jurisdiction',
                'kshetra_id' => $profile?->kshetra_id,
                'prant_id' => $profile?->prant_id,
                'vibhag_id' => $profile?->vibhag_id,
                'jila_id' => $profile?->jila_id,
                'nagar_id' => $profile?->nagar_id,
                'shakha_id' => $profile?->shakha_id,
            ],
        ]);
    }

    /**
     * Store a newly created organizational unit.
     */
    public function store(Request $request, string $unitType): RedirectResponse
    {
        $user = $request->user();

        // 1. Basic permission check for unit level
        if (!$user->canManageUnit($unitType)) {
            abort(403, "You do not have permission to create " . ucfirst($unitType) . " units.");
        }

        $this->validateUnit($request, $unitType);

        // 2. Parent jurisdiction validation check
        $this->checkParentJurisdiction($user, $unitType, $request);

        $toli = $this->formatToliInput($request->input('toli') ?? $request->input('toli_members'));

        switch ($unitType) {
            case 'kshetra':
                Kshetra::create([
                    'kshetra_name' => $request->input('kshetra_name'),
                    'toli' => $toli,
                ]);
                break;

            case 'prant':
                Prant::create([
                    'kshetra_id' => $request->input('kshetra_id'),
                    'prant_name' => $request->input('prant_name'),
                    'toli' => $toli,
                ]);
                break;

            case 'vibhag':
                Vibhag::create([
                    'prant_id' => $request->input('prant_id'),
                    'vibhag_name' => $request->input('vibhag_name'),
                    'toli' => $toli,
                ]);
                break;

            case 'jila':
                Jila::create([
                    'vibhag_id' => $request->input('vibhag_id'),
                    'jila_name' => $request->input('jila_name'),
                    'toli' => $toli,
                ]);
                break;

            case 'nagar':
                Nagar::create([
                    'jila_id' => $request->input('jila_id'),
                    'nagar_name' => $request->input('nagar_name'),
                    'toli' => $toli,
                ]);
                break;

            case 'shakha':
                Shakha::create([
                    'nagar_id' => $request->input('nagar_id'),
                    'shakha_name' => $request->input('shakha_name'),
                    'aayu_varg' => $request->input('aayu_varg'),
                    'type' => $request->input('type'),
                    'status' => $request->input('status', 'Active'),
                    'toli' => $toli,
                ]);
                break;

            default:
                abort(400, 'Invalid unit type.');
        }

        return back()->with('success', ucfirst($unitType) . ' created successfully!');
    }

    /**
     * Update the specified organizational unit.
     */
    public function update(Request $request, string $unitType, int $id): RedirectResponse
    {
        $user = $request->user();
        $this->validateUnit($request, $unitType);

        $toli = $this->formatToliInput($request->input('toli') ?? $request->input('toli_members'));

        switch ($unitType) {
            case 'kshetra':
                $unit = Kshetra::findOrFail($id);
                if (!$user->canManageUnit('kshetra', $unit)) {
                    abort(403, "You do not have jurisdiction to edit this Kshetra.");
                }
                $unit->update([
                    'kshetra_name' => $request->input('kshetra_name'),
                    'toli' => $toli,
                ]);
                break;

            case 'prant':
                $unit = Prant::findOrFail($id);
                if (!$user->canManageUnit('prant', $unit)) {
                    abort(403, "You do not have jurisdiction to edit this Prant.");
                }
                $unit->update([
                    'kshetra_id' => $request->input('kshetra_id'),
                    'prant_name' => $request->input('prant_name'),
                    'toli' => $toli,
                ]);
                break;

            case 'vibhag':
                $unit = Vibhag::findOrFail($id);
                if (!$user->canManageUnit('vibhag', $unit)) {
                    abort(403, "You do not have jurisdiction to edit this Vibhag.");
                }
                $unit->update([
                    'prant_id' => $request->input('prant_id'),
                    'vibhag_name' => $request->input('vibhag_name'),
                    'toli' => $toli,
                ]);
                break;

            case 'jila':
                $unit = Jila::findOrFail($id);
                if (!$user->canManageUnit('jila', $unit)) {
                    abort(403, "You do not have jurisdiction to edit this Jila.");
                }
                $unit->update([
                    'vibhag_id' => $request->input('vibhag_id'),
                    'jila_name' => $request->input('jila_name'),
                    'toli' => $toli,
                ]);
                break;

            case 'nagar':
                $unit = Nagar::findOrFail($id);
                if (!$user->canManageUnit('nagar', $unit)) {
                    abort(403, "You do not have jurisdiction to edit this Nagar.");
                }
                $unit->update([
                    'jila_id' => $request->input('jila_id'),
                    'nagar_name' => $request->input('nagar_name'),
                    'toli' => $toli,
                ]);
                break;

            case 'shakha':
                $unit = Shakha::findOrFail($id);
                if (!$user->canManageUnit('shakha', $unit)) {
                    abort(403, "You do not have jurisdiction to edit this Shakha.");
                }
                $unit->update([
                    'nagar_id' => $request->input('nagar_id'),
                    'shakha_name' => $request->input('shakha_name'),
                    'aayu_varg' => $request->input('aayu_varg'),
                    'type' => $request->input('type'),
                    'status' => $request->input('status', 'Active'),
                    'toli' => $toli,
                ]);
                break;

            default:
                abort(400, 'Invalid unit type.');
        }

        return back()->with('success', ucfirst($unitType) . ' updated successfully!');
    }

    /**
     * Remove the specified organizational unit with dependency safeguard.
     */
    public function destroy(Request $request, string $unitType, int $id): RedirectResponse
    {
        $user = $request->user();

        switch ($unitType) {
            case 'kshetra':
                $unit = Kshetra::withCount('prants')->findOrFail($id);
                if (!$user->canManageUnit('kshetra', $unit)) {
                    abort(403, "You do not have jurisdiction to delete this Kshetra.");
                }
                if ($unit->prants_count > 0) {
                    return back()->with('error', "Cannot delete Kshetra '{$unit->kshetra_name}' because it contains {$unit->prants_count} Prant(s).");
                }
                $unit->delete();
                break;

            case 'prant':
                $unit = Prant::withCount('vibhags')->findOrFail($id);
                if (!$user->canManageUnit('prant', $unit)) {
                    abort(403, "You do not have jurisdiction to delete this Prant.");
                }
                if ($unit->vibhags_count > 0) {
                    return back()->with('error', "Cannot delete Prant '{$unit->prant_name}' because it contains {$unit->vibhags_count} Vibhag(s).");
                }
                $unit->delete();
                break;

            case 'vibhag':
                $unit = Vibhag::withCount('jilas')->findOrFail($id);
                if (!$user->canManageUnit('vibhag', $unit)) {
                    abort(403, "You do not have jurisdiction to delete this Vibhag.");
                }
                if ($unit->jilas_count > 0) {
                    return back()->with('error', "Cannot delete Vibhag '{$unit->vibhag_name}' because it contains {$unit->jilas_count} Jila(s).");
                }
                $unit->delete();
                break;

            case 'jila':
                $unit = Jila::withCount('nagars')->findOrFail($id);
                if (!$user->canManageUnit('jila', $unit)) {
                    abort(403, "You do not have jurisdiction to delete this Jila.");
                }
                if ($unit->nagars_count > 0) {
                    return back()->with('error', "Cannot delete Jila '{$unit->jila_name}' because it contains {$unit->nagars_count} Nagar(s).");
                }
                $unit->delete();
                break;

            case 'nagar':
                $unit = Nagar::withCount('shakhas')->findOrFail($id);
                if (!$user->canManageUnit('nagar', $unit)) {
                    abort(403, "You do not have jurisdiction to delete this Nagar.");
                }
                if ($unit->shakhas_count > 0) {
                    return back()->with('error', "Cannot delete Nagar '{$unit->nagar_name}' because it contains {$unit->shakhas_count} Shakha(s).");
                }
                $unit->delete();
                break;

            case 'shakha':
                $unit = Shakha::findOrFail($id);
                if (!$user->canManageUnit('shakha', $unit)) {
                    abort(403, "You do not have jurisdiction to delete this Shakha.");
                }
                $linkedLocations = DeliveryLocation::where('shakha_id', $id)->count();
                if ($linkedLocations > 0) {
                    return back()->with('error', "Cannot delete Shakha '{$unit->shakha_name}' because {$linkedLocations} address(es) are linked to it.");
                }
                $unit->delete();
                break;

            default:
                abort(400, 'Invalid unit type.');
        }

        return back()->with('success', ucfirst($unitType) . ' deleted successfully!');
    }

    /**
     * Check if parent unit is within user's jurisdiction when creating a child unit.
     */
    private function checkParentJurisdiction($user, string $unitType, Request $request): void
    {
        if ($user->isSuperAdmin()) {
            return;
        }

        switch ($unitType) {
            case 'prant':
                $parent = Kshetra::findOrFail($request->input('kshetra_id'));
                if (!$user->canManageUnit('kshetra', $parent)) {
                    abort(403, "You do not have jurisdiction under this Kshetra to add Prants.");
                }
                break;
            case 'vibhag':
                $parent = Prant::findOrFail($request->input('prant_id'));
                if (!$user->canManageUnit('prant', $parent)) {
                    abort(403, "You do not have jurisdiction under this Prant to add Vibhags.");
                }
                break;
            case 'jila':
                $parent = Vibhag::findOrFail($request->input('vibhag_id'));
                if (!$user->canManageUnit('vibhag', $parent)) {
                    abort(403, "You do not have jurisdiction under this Vibhag to add Jilas.");
                }
                break;
            case 'nagar':
                $parent = Jila::findOrFail($request->input('jila_id'));
                if (!$user->canManageUnit('jila', $parent)) {
                    abort(403, "You do not have jurisdiction under this Jila to add Nagars.");
                }
                break;
            case 'shakha':
                $parent = Nagar::findOrFail($request->input('nagar_id'));
                if (!$user->canManageUnit('nagar', $parent)) {
                    abort(403, "You do not have jurisdiction under this Nagar to add Shakhas.");
                }
                break;
        }
    }

    /**
     * Validate request payload for unit types.
     */
    private function validateUnit(Request $request, string $unitType): void
    {
        $rules = [];

        switch ($unitType) {
            case 'kshetra':
                $rules = ['kshetra_name' => 'required|string|max:255'];
                break;
            case 'prant':
                $rules = [
                    'kshetra_id' => 'required|exists:kshetras,id',
                    'prant_name' => 'required|string|max:255',
                ];
                break;
            case 'vibhag':
                $rules = [
                    'prant_id' => 'required|exists:prants,id',
                    'vibhag_name' => 'required|string|max:255',
                ];
                break;
            case 'jila':
                $rules = [
                    'vibhag_id' => 'required|exists:vibhags,id',
                    'jila_name' => 'required|string|max:255',
                ];
                break;
            case 'nagar':
                $rules = [
                    'jila_id' => 'required|exists:jilas,id',
                    'nagar_name' => 'required|string|max:255',
                ];
                break;
            case 'shakha':
                $rules = [
                    'nagar_id' => 'required|exists:nagars,id',
                    'shakha_name' => 'required|string|max:255',
                    'aayu_varg' => 'required|in:Baal,Mahavidhyalay,Vyavsai,Praurh',
                    'type' => 'required|in:dainik,saptahik',
                    'status' => 'required|in:Active,Inactive',
                ];
                break;
        }

        $request->validate($rules);
    }

    /**
     * Format toli members with name and contact numbers.
     */
    private function formatToliInput($toliInput): ?array
    {
        if (empty($toliInput)) {
            return null;
        }

        if (is_string($toliInput)) {
            $decoded = json_decode($toliInput, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $toliInput = $decoded;
            }
        }

        if (is_array($toliInput)) {
            $formatted = [];
            foreach ($toliInput as $key => $val) {
                if (is_array($val)) {
                    // Array of member objects: ['role' => '...', 'name' => '...', 'contact' => '...']
                    $rawRole = $val['role_key'] ?? $val['role'] ?? (is_string($key) && !is_numeric($key) ? $key : 'member_' . ((int)$key + 1));
                    $roleKey = strtolower(trim(preg_replace('/[^a-zA-Z0-9_]+/', '_', $rawRole)));
                    if (empty($roleKey)) {
                        $roleKey = 'member_' . (is_numeric($key) ? ((int)$key + 1) : $key);
                    }
                    $name = trim($val['name'] ?? '');
                    $contact = trim($val['contact'] ?? $val['phone'] ?? '');
                    if (!empty($name) || !empty($contact)) {
                        $formatted[$roleKey] = [
                            'name' => $name,
                            'contact' => $contact,
                        ];
                    }
                } elseif (is_string($val)) {
                    $rawRole = is_string($key) && !is_numeric($key) ? $key : 'member_' . ((int)$key + 1);
                    $roleKey = strtolower(trim(preg_replace('/[^a-zA-Z0-9_]+/', '_', $rawRole)));
                    if (!empty(trim($val))) {
                        $formatted[$roleKey] = [
                            'name' => trim($val),
                            'contact' => '',
                        ];
                    }
                }
            }
            return !empty($formatted) ? $formatted : null;
        }

        return null;
    }
}
