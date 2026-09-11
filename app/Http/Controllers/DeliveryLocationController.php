<?php

namespace App\Http\Controllers;

use App\Http\Requests\DeliveryLocationRequest;
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

class DeliveryLocationController extends Controller
{
    public function index(Request $request): Response
    {
        $locations = DeliveryLocation::where('user_id', $request->user()->id)
            ->with(['kshetra', 'prant', 'vibhag', 'jila', 'nagar', 'shakha'])
            ->latest()
            ->get();

        $orgData = $this->getOrganizationTree();

        return Inertia::render('DeliveryLocations/Index', [
            'locations' => $locations,
            'orgData' => $orgData,
        ]);
    }

    public function store(DeliveryLocationRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();
        $validated['user_id'] = $user->id;

        $validated = $this->resolveOrganizationalHierarchy($validated);

        if (!empty($validated['is_default'])) {
            DeliveryLocation::where('user_id', $user->id)->update(['is_default' => false]);
        } else {
            $count = DeliveryLocation::where('user_id', $user->id)->count();
            if ($count === 0) {
                $validated['is_default'] = true;
            }
        }

        DeliveryLocation::create($validated);

        return back()->with('success', 'Delivery location with organizational details saved successfully!');
    }

    public function update(DeliveryLocationRequest $request, DeliveryLocation $deliveryLocation): RedirectResponse
    {
        if ($deliveryLocation->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validated();
        $validated = $this->resolveOrganizationalHierarchy($validated);

        if (!empty($validated['is_default'])) {
            DeliveryLocation::where('user_id', $request->user()->id)
                ->where('id', '!=', $deliveryLocation->id)
                ->update(['is_default' => false]);
        }

        $deliveryLocation->update($validated);

        return back()->with('success', 'Delivery location updated successfully!');
    }

    public function destroy(Request $request, DeliveryLocation $deliveryLocation): RedirectResponse
    {
        if ($deliveryLocation->user_id !== $request->user()->id) {
            abort(403);
        }

        $deliveryLocation->delete();

        return back()->with('success', 'Delivery location deleted!');
    }

    /**
     * Helper to resolve higher hierarchy IDs from a selected unit.
     */
    private function resolveOrganizationalHierarchy(array $data): array
    {
        if (!empty($data['shakha_id'])) {
            $shakha = Shakha::with('nagar.jila.vibhag.prant.kshetra')->find($data['shakha_id']);
            if ($shakha && $shakha->nagar) {
                $data['nagar_id'] = $shakha->nagar->id;
                $data['jila_id'] = $shakha->nagar->jila_id;
                $data['vibhag_id'] = $shakha->nagar->jila?->vibhag_id;
                $data['prant_id'] = $shakha->nagar->jila?->vibhag?->prant_id;
                $data['kshetra_id'] = $shakha->nagar->jila?->vibhag?->prant?->kshetra_id;
            }
        } elseif (!empty($data['nagar_id'])) {
            $nagar = Nagar::with('jila.vibhag.prant.kshetra')->find($data['nagar_id']);
            if ($nagar) {
                $data['jila_id'] = $nagar->jila_id;
                $data['vibhag_id'] = $nagar->jila?->vibhag_id;
                $data['prant_id'] = $nagar->jila?->vibhag?->prant_id;
                $data['kshetra_id'] = $nagar->jila?->vibhag?->prant?->kshetra_id;
            }
        } elseif (!empty($data['jila_id'])) {
            $jila = Jila::with('vibhag.prant.kshetra')->find($data['jila_id']);
            if ($jila) {
                $data['vibhag_id'] = $jila->vibhag_id;
                $data['prant_id'] = $jila->vibhag?->prant_id;
                $data['kshetra_id'] = $jila->vibhag?->prant?->kshetra_id;
            }
        } elseif (!empty($data['vibhag_id'])) {
            $vibhag = Vibhag::with('prant.kshetra')->find($data['vibhag_id']);
            if ($vibhag) {
                $data['prant_id'] = $vibhag->prant_id;
                $data['kshetra_id'] = $vibhag->prant?->kshetra_id;
            }
        } elseif (!empty($data['prant_id'])) {
            $prant = Prant::find($data['prant_id']);
            if ($prant) {
                $data['kshetra_id'] = $prant->kshetra_id;
            }
        }

        return $data;
    }

    /**
     * Retrieve all organizational units for dropdown selection.
     */
    private function getOrganizationTree(): array
    {
        return [
            'kshetras' => Kshetra::all(['id', 'kshetra_name']),
            'prants' => Prant::all(['id', 'kshetra_id', 'prant_name']),
            'vibhags' => Vibhag::all(['id', 'prant_id', 'vibhag_name']),
            'jilas' => Jila::all(['id', 'vibhag_id', 'jila_name']),
            'nagars' => Nagar::all(['id', 'jila_id', 'nagar_name']),
            'shakhas' => Shakha::where('status', 'Active')->get(['id', 'nagar_id', 'shakha_name', 'aayu_varg', 'type']),
        ];
    }
}
