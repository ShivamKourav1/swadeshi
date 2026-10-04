<?php

namespace App\Http\Controllers\Karyakarta;

use App\Http\Controllers\Controller;
use App\Models\Jila;
use App\Models\Kshetra;
use App\Models\Nagar;
use App\Models\Prant;
use App\Models\Shakha;
use App\Models\ToliInventoryScope;
use App\Models\Vibhag;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ToliInventoryScopeController extends Controller
{
    /**
     * Display the Toli Level Inventory Scope Management screen.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (!$user || !$user->canManageToliInventoryScope()) {
            abort(403, 'अनधिकृत पहुँच: आपके पास टोली स्तरीय वस्तु भंडार इकाई प्रबंधन का अधिकार नहीं है।');
        }

        $jurisdiction = $user->getToliJurisdiction();
        $level = $jurisdiction['level'];
        $id = (int) $jurisdiction['id'];

        $unitName = match ($level) {
            'kshetra' => Kshetra::find($id)?->kshetra_name,
            'prant'   => Prant::find($id)?->prant_name,
            'vibhag'  => Vibhag::find($id)?->vibhag_name,
            'jila'    => Jila::find($id)?->jila_name,
            'nagar'   => Nagar::find($id)?->nagar_name,
            'basti', 'shakha' => \App\Models\Basti::find($id)?->basti_name,
            default   => 'असाइन इकाई',
        } ?? 'असाइन इकाई';

        $availableSubUnits = ToliInventoryScope::getAvailableSubUnits($level);

        $scope = ToliInventoryScope::where('unit_type', $level)
            ->where('unit_id', $id)
            ->with('updater:id,name')
            ->first();

        return Inertia::render('Karyakarta/InventoryScope/Index', [
            'unit' => [
                'level' => $level,
                'level_hindi' => ToliInventoryScope::UNIT_HINDI_LABELS[$level] ?? ucfirst($level),
                'level_label' => ToliInventoryScope::UNIT_LABELS[$level] ?? ucfirst($level),
                'id' => $id,
                'name' => $unitName,
            ],
            'availableSubUnits' => $availableSubUnits,
            'selectedSubUnits' => $scope?->visible_sub_units ?? [],
            'lastUpdated' => $scope?->updated_at?->format('d/m/Y h:i A'),
            'updatedBy' => $scope?->updater?->name,
        ]);
    }

    /**
     * Update the visible sub-units for this user's jurisdiction scope.
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (!$user || !$user->canManageToliInventoryScope()) {
            abort(403, 'अनधिकृत पहुँच: आपके पास टोली स्तरीय वस्तु भंडार इकाई प्रबंधन का अधिकार नहीं है।');
        }

        $jurisdiction = $user->getToliJurisdiction();
        $level = $jurisdiction['level'];
        $id = (int) $jurisdiction['id'];

        $validated = $request->validate([
            'sub_units' => ['nullable', 'array'],
            'sub_units.*' => ['string'],
        ]);

        $requestedUnits = $validated['sub_units'] ?? [];
        $requestedUnits = array_map(fn($u) => $u === 'shakha' ? 'basti' : $u, $requestedUnits);
        $allowedHierarchy = ToliInventoryScope::SUB_UNIT_HIERARCHY[$level] ?? [];
        $validSubUnits = array_values(array_unique(array_intersect($requestedUnits, $allowedHierarchy)));

        ToliInventoryScope::updateOrCreate(
            [
                'unit_type' => $level,
                'unit_id' => $id,
            ],
            [
                'visible_sub_units' => $validSubUnits,
                'updated_by' => $user->id,
            ]
        );

        return redirect()->back()->with(
            'success',
            'टोली स्तरीय वस्तु भंडार इकाई प्रबंधन सेटिंग्स सफलतापूर्वक सुरक्षित कर दी गईं।'
        );
    }
}
