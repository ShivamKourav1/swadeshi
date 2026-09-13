<?php

namespace App\Http\Controllers\Karyakarta;

use App\Http\Controllers\Controller;
use App\Models\Jila;
use App\Models\Kshetra;
use App\Models\Nagar;
use App\Models\Order;
use App\Models\Prant;
use App\Models\Shakha;
use App\Models\Vibhag;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KaryakartaDashboardController extends Controller
{
    /**
     * Display the Karyakarta Organizational Management & Tracking Dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (!$user->isKaryakarta() && !$user->isAdmin()) {
            abort(403, 'Unauthorized access to Karyakarta Dashboard.');
        }

        $profile = $user->profile()->with(['kshetra', 'prant', 'vibhag', 'jila', 'nagar', 'shakha'])->first();

        // Determine user's organizational scope level
        $scopeLevel = 'global';
        $scopeName = 'All Units (Global Jurisdiction / पूर्ण संगठन)';
        $scopeData = null;

        if ($profile?->shakha_id && $profile->shakha) {
            $scopeLevel = 'shakha';
            $scopeName = "Shakha: {$profile->shakha->shakha_name}";
            $scopeData = $profile->shakha;
        } elseif ($profile?->nagar_id && $profile->nagar) {
            $scopeLevel = 'nagar';
            $scopeName = "Nagar: {$profile->nagar->nagar_name}";
            $scopeData = $profile->nagar;
        } elseif ($profile?->jila_id && $profile->jila) {
            $scopeLevel = 'jila';
            $scopeName = "Jila: {$profile->jila->jila_name}";
            $scopeData = $profile->jila;
        } elseif ($profile?->vibhag_id && $profile->vibhag) {
            $scopeLevel = 'vibhag';
            $scopeName = "Vibhag: {$profile->vibhag->vibhag_name}";
            $scopeData = $profile->vibhag;
        } elseif ($profile?->prant_id && $profile->prant) {
            $scopeLevel = 'prant';
            $scopeName = "Prant: {$profile->prant->prant_name}";
            $scopeData = $profile->prant;
        } elseif ($profile?->kshetra_id && $profile->kshetra) {
            $scopeLevel = 'kshetra';
            $scopeName = "Kshetra: {$profile->kshetra->kshetra_name}";
            $scopeData = $profile->kshetra;
        }

        // Base Orders Query constrained by Karyakarta's organizational scope
        $query = Order::query()->with([
            'customer',
            'deliveryLocation.kshetra',
            'deliveryLocation.prant',
            'deliveryLocation.vibhag',
            'deliveryLocation.jila',
            'deliveryLocation.nagar',
            'deliveryLocation.shakha',
            'deliveryPartner',
            'items',
        ]);

        // Enforce organizational boundary based on user profile
        $query->whereHas('deliveryLocation', function ($q) use ($profile, $scopeLevel) {
            if ($scopeLevel === 'shakha') {
                $q->where('shakha_id', $profile->shakha_id);
            } elseif ($scopeLevel === 'nagar') {
                $q->where('nagar_id', $profile->nagar_id);
            } elseif ($scopeLevel === 'jila') {
                $q->where('jila_id', $profile->jila_id);
            } elseif ($scopeLevel === 'vibhag') {
                $q->where('vibhag_id', $profile->vibhag_id);
            } elseif ($scopeLevel === 'prant') {
                $q->where('prant_id', $profile->prant_id);
            } elseif ($scopeLevel === 'kshetra') {
                $q->where('kshetra_id', $profile->kshetra_id);
            }
        });

        // Calculate Overview Statistics within Scope (before specific search filters)
        $scopeTotalOrders = (clone $query)->count();
        $scopeTotalRevenue = (clone $query)->sum('total_amount');
        $scopeDispatched = (clone $query)->where('delivery_status', 'dispatched')->count();
        $scopeInTransit = (clone $query)->where('delivery_status', 'in_transit')->count();
        $scopeDelivered = (clone $query)->where('delivery_status', 'delivered')->count();
        $scopeCompleted = (clone $query)->where('order_status', 'completed')->count();

        // Apply interactive user filters
        $search = $request->input('search');
        $statusFilter = $request->input('delivery_status');
        $jilaFilter = $request->input('jila_id');
        $nagarFilter = $request->input('nagar_id');
        $shakhaFilter = $request->input('shakha_id');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    })
                    ->orWhereHas('deliveryLocation', function ($lq) use ($search) {
                        $lq->where('recipient_name', 'like', "%{$search}%")
                            ->orWhere('city', 'like', "%{$search}%")
                            ->orWhere('address_line_1', 'like', "%{$search}%");
                    });
            });
        }

        if ($statusFilter) {
            $query->where('delivery_status', $statusFilter);
        }

        if ($jilaFilter) {
            $query->whereHas('deliveryLocation', fn($q) => $q->where('jila_id', $jilaFilter));
        }

        if ($nagarFilter) {
            $query->whereHas('deliveryLocation', fn($q) => $q->where('nagar_id', $nagarFilter));
        }

        if ($shakhaFilter) {
            $query->whereHas('deliveryLocation', fn($q) => $q->where('shakha_id', $shakhaFilter));
        }

        $orders = $query->latest()->paginate(15)->withQueryString();

        // Available sub-units for filtering within jurisdiction
        $filterOptions = $this->getFilterableUnits($scopeLevel, $profile);

        return Inertia::render('Karyakarta/Dashboard', [
            'scope' => [
                'level' => $scopeLevel,
                'name' => $scopeName,
                'details' => $scopeData,
            ],
            'metrics' => [
                'total_orders' => $scopeTotalOrders,
                'total_revenue' => round($scopeTotalRevenue, 2),
                'dispatched' => $scopeDispatched,
                'in_transit' => $scopeInTransit,
                'delivered' => $scopeDelivered,
                'completed' => $scopeCompleted,
            ],
            'orders' => $orders,
            'filters' => [
                'search' => $search ?? '',
                'delivery_status' => $statusFilter ?? '',
                'jila_id' => $jilaFilter ?? '',
                'nagar_id' => $nagarFilter ?? '',
                'shakha_id' => $shakhaFilter ?? '',
            ],
            'filterOptions' => $filterOptions,
        ]);
    }

    /**
     * Show single order with detailed organizational hierarchy tracking.
     */
    public function show(Request $request, Order $order): Response
    {
        $user = $request->user();

        if (!$user->isKaryakarta() && !$user->isAdmin()) {
            abort(403);
        }

        $order->load([
            'customer',
            'deliveryLocation.kshetra',
            'deliveryLocation.prant',
            'deliveryLocation.vibhag',
            'deliveryLocation.jila',
            'deliveryLocation.nagar',
            'deliveryLocation.shakha',
            'deliveryPartner',
            'items.product',
            'payment',
            'deliveryLogs.deliveryPartner',
        ]);

        return Inertia::render('Orders/Show', [
            'order' => $order,
        ]);
    }

    /**
     * Load units available for filtering depending on the Karyakarta's scope.
     */
    private function getFilterableUnits(string $scopeLevel, $profile): array
    {
        $jilasQuery = Jila::query();
        $nagarsQuery = Nagar::query();
        $shakhasQuery = Shakha::where('status', 'Active');

        if ($scopeLevel === 'vibhag' && $profile?->vibhag_id) {
            $jilasQuery->where('vibhag_id', $profile->vibhag_id);
            $nagarsQuery->whereHas('jila', fn($q) => $q->where('vibhag_id', $profile->vibhag_id));
            $shakhasQuery->whereHas('nagar.jila', fn($q) => $q->where('vibhag_id', $profile->vibhag_id));
        } elseif ($scopeLevel === 'jila' && $profile?->jila_id) {
            $jilasQuery->where('id', $profile->jila_id);
            $nagarsQuery->where('jila_id', $profile->jila_id);
            $shakhasQuery->whereHas('nagar', fn($q) => $q->where('jila_id', $profile->jila_id));
        } elseif ($scopeLevel === 'nagar' && $profile?->nagar_id) {
            $nagarsQuery->where('id', $profile->nagar_id);
            $shakhasQuery->where('nagar_id', $profile->nagar_id);
        }

        return [
            'jilas' => $jilasQuery->get(['id', 'jila_name', 'vibhag_id']),
            'nagars' => $nagarsQuery->get(['id', 'nagar_name', 'jila_id']),
            'shakhas' => $shakhasQuery->get(['id', 'shakha_name', 'nagar_id', 'aayu_varg']),
        ];
    }
}
