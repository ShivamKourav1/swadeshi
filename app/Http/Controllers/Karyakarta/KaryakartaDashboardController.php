<?php

namespace App\Http\Controllers\Karyakarta;

use App\Http\Controllers\Controller;
use App\Models\Basti;
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

        $profile = $user->profile()->with(['kshetra', 'prant', 'vibhag', 'jila', 'nagar', 'basti', 'shakha'])->first();

        // Determine user's organizational scope level
        $scopeLevel = 'global';
        $scopeName = 'All Units (Global Jurisdiction / पूर्ण संगठन)';
        $scopeData = null;

        $userBastiId = $profile?->basti_id ?: $profile?->shakha_id;
        $userBasti = $profile?->basti ?: $profile?->shakha;

        if ($userBastiId && $userBasti) {
            $scopeLevel = 'basti';
            $scopeName = "Basti: {$userBasti->basti_name}";
            $scopeData = $userBasti;
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
            'swayamsevak:id,name,mobile',
            'basti:id,basti_name',
            'shakha:id,basti_name',
            'nagar:id,nagar_name',
            'jila:id,jila_name',
            'deliveryLocation.kshetra',
            'deliveryLocation.prant',
            'deliveryLocation.vibhag',
            'deliveryLocation.jila',
            'deliveryLocation.nagar',
            'deliveryLocation.basti',
            'deliveryLocation.shakha',
            'deliveryPartner',
            'items',
        ]);

        // Enforce organizational boundary based on user profile (supporting both regular delivery locations and toli orders)
        $query->where(function ($scopedQ) use ($profile, $scopeLevel, $userBastiId) {
            $scopedQ->whereHas('deliveryLocation', function ($q) use ($profile, $scopeLevel, $userBastiId) {
                if ($scopeLevel === 'basti' || $scopeLevel === 'shakha') {
                    $q->where(function ($bq) use ($userBastiId) {
                        $bq->where('basti_id', $userBastiId)->orWhere('shakha_id', $userBastiId);
                    });
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
            })->orWhere(function ($toliQ) use ($profile, $scopeLevel, $userBastiId) {
                $toliQ->where('is_toli_order', true);
                if ($scopeLevel === 'basti' || $scopeLevel === 'shakha') {
                    $toliQ->where(function ($bq) use ($userBastiId) {
                        $bq->where('basti_id', $userBastiId)->orWhere('shakha_id', $userBastiId);
                    });
                } elseif ($scopeLevel === 'nagar') {
                    $toliQ->where('nagar_id', $profile->nagar_id);
                } elseif ($scopeLevel === 'jila') {
                    $toliQ->where('jila_id', $profile->jila_id);
                } elseif ($scopeLevel === 'vibhag') {
                    $toliQ->where('vibhag_id', $profile->vibhag_id);
                }
            });
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
        $bastiFilter = $request->input('basti_id') ?: $request->input('shakha_id');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    })
                    ->orWhereHas('swayamsevak', function ($sq) use ($search) {
                        $sq->where('name', 'like', "%{$search}%")
                            ->orWhere('mobile', 'like', "%{$search}%");
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
            $query->where(function ($q) use ($jilaFilter) {
                $q->whereHas('deliveryLocation', fn($lq) => $lq->where('jila_id', $jilaFilter))
                    ->orWhere('jila_id', $jilaFilter);
            });
        }

        if ($nagarFilter) {
            $query->where(function ($q) use ($nagarFilter) {
                $q->whereHas('deliveryLocation', fn($lq) => $lq->where('nagar_id', $nagarFilter))
                    ->orWhere('nagar_id', $nagarFilter);
            });
        }

        if ($bastiFilter) {
            $query->where(function ($q) use ($bastiFilter) {
                $q->whereHas('deliveryLocation', fn($lq) => $lq->where('basti_id', $bastiFilter)->orWhere('shakha_id', $bastiFilter))
                    ->orWhere('basti_id', $bastiFilter)
                    ->orWhere('shakha_id', $bastiFilter);
            });
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
            'toli_url' => $user->getToliUrl(),
            'can_manage_inventory_scope' => $user->canManageToliInventoryScope(),
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
                'basti_id' => $bastiFilter ?? '',
                'shakha_id' => $bastiFilter ?? '',
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

        if ($user->isToliAdmin()) {
            $jurisdiction = $user->getToliJurisdiction();
            if ($jurisdiction) {
                $location = $order->deliveryLocation;
                $level = $jurisdiction['level'];
                $id = (int)$jurisdiction['id'];
                $allowed = false;
                if ($location) {
                    if (($level === 'basti' || $level === 'shakha') && ((int)$location->basti_id === $id || (int)$location->shakha_id === $id)) $allowed = true;
                    elseif ($level === 'nagar' && (int)$location->nagar_id === $id) $allowed = true;
                    elseif ($level === 'jila' && (int)$location->jila_id === $id) $allowed = true;
                    elseif ($level === 'vibhag' && (int)$location->vibhag_id === $id) $allowed = true;
                    elseif ($level === 'prant' && (int)$location->prant_id === $id) $allowed = true;
                    elseif ($level === 'kshetra' && (int)$location->kshetra_id === $id) $allowed = true;
                }
                if (!$allowed && $order->is_toli_order) {
                    if (($level === 'basti' || $level === 'shakha') && ((int)$order->basti_id === $id || (int)$order->shakha_id === $id)) $allowed = true;
                    elseif ($level === 'nagar' && (int)$order->nagar_id === $id) $allowed = true;
                    elseif ($level === 'jila' && (int)$order->jila_id === $id) $allowed = true;
                    elseif ($level === 'vibhag' && (int)$order->vibhag_id === $id) $allowed = true;
                }
                if (!$allowed) {
                    abort(403, 'Unauthorized. Order is outside your assigned toli jurisdiction.');
                }
            }
        }

        $order->load([
            'customer',
            'swayamsevak',
            'basti',
            'shakha',
            'nagar',
            'jila',
            'deliveryLocation.kshetra',
            'deliveryLocation.prant',
            'deliveryLocation.vibhag',
            'deliveryLocation.jila',
            'deliveryLocation.nagar',
            'deliveryLocation.basti',
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
        $bastisQuery = Basti::where('status', 'Active');

        if ($scopeLevel === 'vibhag' && $profile?->vibhag_id) {
            $jilasQuery->where('vibhag_id', $profile->vibhag_id);
            $nagarsQuery->whereHas('jila', fn($q) => $q->where('vibhag_id', $profile->vibhag_id));
            $bastisQuery->whereHas('nagar.jila', fn($q) => $q->where('vibhag_id', $profile->vibhag_id));
        } elseif ($scopeLevel === 'jila' && $profile?->jila_id) {
            $jilasQuery->where('id', $profile->jila_id);
            $nagarsQuery->where('jila_id', $profile->jila_id);
            $bastisQuery->whereHas('nagar', fn($q) => $q->where('jila_id', $profile->jila_id));
        } elseif ($scopeLevel === 'nagar' && $profile?->nagar_id) {
            $nagarsQuery->where('id', $profile->nagar_id);
            $bastisQuery->where('nagar_id', $profile->nagar_id);
        }

        $bastis = $bastisQuery->get(['id', 'basti_name', 'nagar_id', 'aayu_varg']);

        return [
            'jilas' => $jilasQuery->get(['id', 'jila_name', 'vibhag_id']),
            'nagars' => $nagarsQuery->get(['id', 'nagar_name', 'jila_id']),
            'bastis' => $bastis,
            'shakhas' => $bastis,
        ];
    }
}
