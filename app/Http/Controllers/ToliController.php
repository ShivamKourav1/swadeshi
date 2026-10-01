<?php

namespace App\Http\Controllers;

use App\Models\Jila;
use App\Models\Kshetra;
use App\Models\Nagar;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\DeliveryLog;
use App\Models\Prant;
use App\Models\Product;
use App\Models\ProductDemand;
use App\Models\ReturnRequest;
use App\Models\Shakha;
use App\Models\Swayamsevak;
use App\Models\ToliInventoryScope;
use App\Models\User;
use App\Services\ToliEncryptionService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ToliController extends Controller
{
    /**
     * Display the Toli Specific Single Page Application.
     */
    public function show(Request $request, $kshetra, $vibhag = null, $jila = null, $nagar = null, $shakha = null)
    {
        $hasNumeric = is_numeric($kshetra);
        $kshetraId = ToliEncryptionService::decryptId($kshetra) ?? (is_numeric($kshetra) ? (int) $kshetra : null);
        $vibhagId = $vibhag !== null ? (ToliEncryptionService::decryptId($vibhag) ?? (is_numeric($vibhag) ? (int) $vibhag : null)) : null;
        $jilaId = $jila !== null ? (ToliEncryptionService::decryptId($jila) ?? (is_numeric($jila) ? (int) $jila : null)) : null;
        $nagarId = $nagar !== null ? (ToliEncryptionService::decryptId($nagar) ?? (is_numeric($nagar) ? (int) $nagar : null)) : null;
        $shakhaId = $shakha !== null ? (ToliEncryptionService::decryptId($shakha) ?? (is_numeric($shakha) ? (int) $shakha : null)) : null;

        // If any provided segment failed to decrypt or is not a valid integer ID
        if (!$kshetraId || ($vibhag !== null && !$vibhagId) || ($jila !== null && !$jilaId) || ($nagar !== null && !$nagarId) || ($shakha !== null && !$shakhaId)) {
            abort(404, 'संगठन इकाई नहीं मिली (Organizational unit not found).');
        }

        // If accessed with unencrypted numeric IDs, redirect to canonical encrypted URL
        if ($hasNumeric) {
            return redirect()->to(ToliEncryptionService::buildToliUrl($kshetraId, $vibhagId, $jilaId, $nagarId, $shakhaId));
        }

        // Resolve unit level and hierarchy
        $hierarchy = $this->resolveHierarchy($kshetraId, $vibhagId, $jilaId, $nagarId, $shakhaId);
        if (!$hierarchy) {
            abort(404, 'संगठन इकाई नहीं मिली (Organizational unit not found).');
        }

        $user = Auth::user();
        $isAuth = Auth::check();
        $hasAccess = false;

        if ($isAuth && $user) {
            $hasAccess = $this->checkToliAccess($user, $hierarchy);
        }

        // Available subordinate shakha IDs for queries
        $shakhaIds = $hierarchy['shakha_ids'];

        // Swayamsevaks query
        $swayamsevaks = [];
        $totalSwayamsevaks = 0;
        $ganveshCount = 0;
        $nonGanveshCount = 0;
        $newGanveshSum = 0;

        if (!empty($shakhaIds)) {
            $swayamsevaks = Swayamsevak::whereIn('shakha_id', $shakhaIds)
                ->with('shakha:id,shakha_name')
                ->latest()
                ->get()
                ->map(function ($s) {
                    return [
                        'id' => $s->id,
                        'name' => $s->name,
                        'mobile' => $s->mobile,
                        'address' => $s->address,
                        'shakha_id' => $s->shakha_id,
                        'shakha_name' => $s->shakha?->shakha_name ?? '',
                        'ganvesh' => (bool) $s->ganvesh,
                        'shikshan' => $s->shikshan,
                        'created_at' => $s->created_at?->format('d/m/Y'),
                    ];
                });

            $totalSwayamsevaks = $swayamsevaks->count();
            $ganveshCount = $swayamsevaks->where('ganvesh', true)->count();
            $nonGanveshCount = $totalSwayamsevaks - $ganveshCount;

            $newGanveshSum = (int) Shakha::whereIn('id', $shakhaIds)->sum('new_ganvesh');
        }

        // Subordinate Shakhas available for selection / updating
        $availableShakhas = Shakha::whereIn('id', $shakhaIds)
            ->select('id', 'shakha_name', 'nagar_id', 'new_ganvesh')
            ->get();

        // Products for Ganvesh Distribution (filtered based on Toli Inventory Scope rules)
        $products = $this->getVisibleProducts($hierarchy);

        // Orders placed under this unit scope
        $ordersQuery = Order::query();
        if ($hierarchy['level'] === 'shakha') {
            $ordersQuery->where('shakha_id', $hierarchy['target']->id);
        } elseif ($hierarchy['level'] === 'nagar') {
            $ordersQuery->where('nagar_id', $hierarchy['target']->id);
        } elseif ($hierarchy['level'] === 'jila') {
            $ordersQuery->where('jila_id', $hierarchy['target']->id);
        } elseif ($hierarchy['level'] === 'vibhag') {
            $ordersQuery->where('vibhag_id', $hierarchy['target']->id);
        }

        $orders = $ordersQuery->with([
            'customer:id,name,phone',
            'swayamsevak:id,name,mobile',
            'shakha:id,shakha_name',
            'nagar:id,nagar_name',
            'items.product:id,name,image_url',
            'returnRequest',
        ])
        ->latest()
        ->take(100)
        ->get()
        ->map(function ($order) use ($user) {
            return [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'customer_name' => $order->customer?->name ?? 'अज्ञात',
                'customer_phone' => $order->customer?->phone ?? '',
                'swayamsevak_id' => $order->swayamsevak_id,
                'swayamsevak_name' => $order->swayamsevak?->name,
                'swayamsevak_mobile' => $order->swayamsevak?->mobile,
                'total_amount' => (float) $order->total_amount,
                'order_status' => $order->order_status,
                'payment_status' => $order->payment_status,
                'delivery_status' => $order->delivery_status,
                'is_toli_order' => (bool) $order->is_toli_order,
                'shakha_name' => $order->shakha?->shakha_name ?? '',
                'nagar_name' => $order->nagar?->nagar_name ?? '',
                'shakha_id' => $order->shakha_id,
                'notes' => $order->notes,
                'placed_at' => $order->placed_at ? $order->placed_at->format('d/m/Y h:i A') : $order->created_at->format('d/m/Y h:i A'),
                'is_own_order' => $user ? ($order->customer_id === $user->id) : false,
                'can_cancel' => $order->order_status !== 'cancelled' && $order->order_status !== 'completed' && $order->delivery_status !== 'delivered',
                'can_return' => in_array($order->order_status, ['completed', 'delivered']) && !$order->hasActiveReturnRequest(),
                'return_request_status' => $order->returnRequest?->status,
                'items' => $order->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'product_name' => $item->product_name,
                        'quantity' => $item->quantity,
                        'unit_price' => (float) $item->unit_price,
                        'subtotal' => (float) $item->subtotal,
                        'image_url' => $item->product?->image_url ?: '/images/products/shirt.svg',
                    ];
                }),
            ];
        });

        // Orders aggregated status metrics
        $orderStats = [
            'total' => $orders->count(),
            'paid' => $orders->filter(fn($o) => in_array($o['order_status'], ['paid', 'completed']) || $o['payment_status'] === 'paid')->count(),
            'payment_due' => $orders->filter(fn($o) => $o['order_status'] === 'payment_due' || $o['payment_status'] === 'pending')->count(),
            'delivered' => $orders->filter(fn($o) => $o['delivery_status'] === 'delivered')->count(),
            'completed' => $orders->filter(fn($o) => $o['order_status'] === 'completed')->count(),
            'cancelled' => $orders->filter(fn($o) => $o['order_status'] === 'cancelled')->count(),
        ];

        // Format predefined RSS report template (वृत्त)
        $nowIst = Carbon::now('Asia/Kolkata');
        $parentNames = collect($hierarchy['parents'])->pluck('name')->implode(', ');
        $targetNewGanvesh = $hierarchy['level'] === 'shakha' ? (int) $hierarchy['target']->new_ganvesh : $newGanveshSum;

        $reportText = "🚩 *राष्ट्रीय स्वयंसेवक संघ - वृत्त* 🚩\n"
            . "━━━━━━━━━━━━━━━━━━━━\n"
            . "📌 *इकाई:* {$hierarchy['target_name']} (" . $this->getLevelHindi($hierarchy['level']) . ")\n"
            . ($parentNames ? "📍 *पालक इकाई:* {$parentNames}\n" : "")
            . "📅 *दिनांक:* " . $nowIst->format('d/m/Y') . " | समय: " . $nowIst->format('h:i A') . "\n"
            . "━━━━━━━━━━━━━━━━━━━━\n"
            . "👥 *कुल स्वयंसेवक सूची:* {$totalSwayamsevaks}\n"
            . "👕 *गणवेश युक्त सूची:* {$ganveshCount}\n"
            . "✨ *नया गणवेश:* {$targetNewGanvesh}\n"
            . "⚠️ *गणवेश अपेक्षित (रहित):* {$nonGanveshCount}\n"
            . "📦 *वितरित गणवेश ऑर्डर्स:* {$orderStats['total']} (पूर्ण: {$orderStats['completed']}, बाकी भुगतान: {$orderStats['payment_due']})\n"
            . "━━━━━━━━━━━━━━━━━━━━\n"
            . "जय श्री राम | भारत माता की जय 🚩";

        return Inertia::render('Toli/Index', [
            'isAuthenticated' => $isAuth,
            'authUser' => $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'email' => $user->email,
                'role' => $user->role,
                'is_admin' => $user->isAdmin(),
            ] : null,
            'hasAccess' => $hasAccess,
            'unit' => [
                'level' => $hierarchy['level'],
                'level_hindi' => $this->getLevelHindi($hierarchy['level']),
                'id' => $hierarchy['target']->id,
                'name' => $hierarchy['target_name'],
                'parents' => $hierarchy['parents'],
                'kshetra_id' => $kshetraId,
                'vibhag_id' => $vibhagId,
                'jila_id' => $jilaId,
                'nagar_id' => $nagarId,
                'shakha_id' => $shakhaId,
                'new_ganvesh' => $targetNewGanvesh,
                'url' => ToliEncryptionService::buildToliUrl($kshetraId, $vibhagId, $jilaId, $nagarId, $shakhaId),
                'full_url' => url(ToliEncryptionService::buildToliUrl($kshetraId, $vibhagId, $jilaId, $nagarId, $shakhaId)),
            ],
            'subUnits' => $hierarchy['sub_units'],
            'swayamsevaks' => $swayamsevaks,
            'swayamsevakStats' => [
                'total' => $totalSwayamsevaks,
                'ganvesh' => $ganveshCount,
                'non_ganvesh' => $nonGanveshCount,
                'new_ganvesh' => $targetNewGanvesh,
            ],
            'availableShakhas' => $availableShakhas,
            'products' => $products,
            'orders' => $orders,
            'orderStats' => $orderStats,
            'reportText' => $reportText,
            'shikshanOptions' => Swayamsevak::SHIKSHAN_OPTIONS,
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    /**
     * Resolve hierarchy units, names, parents, and sub-units.
     */
    protected function resolveHierarchy(int $kshetraId, ?int $vibhagId, ?int $jilaId, ?int $nagarId, ?int $shakhaId): ?array
    {
        $kshetra = Kshetra::find($kshetraId);
        if (!$kshetra) {
            return null;
        }

        // Shakha Level
        if ($shakhaId !== null) {
            $shakha = Shakha::with('nagar.jila.vibhag.prant.kshetra')->find($shakhaId);
            if (!$shakha) {
                return null;
            }
            $nagar = $shakha->nagar;
            $jila = $nagar?->jila;
            $vibhag = $jila?->vibhag;
            $prant = $vibhag?->prant;
            $kshetra = $prant?->kshetra;

            // Validate that the unit belongs to the specified parent hierarchy
            if ($nagarId !== null && (int) $shakha->nagar_id !== (int) $nagarId) {
                return null;
            }
            if ($jilaId !== null && (int) ($nagar?->jila_id) !== (int) $jilaId) {
                return null;
            }
            if ($vibhagId !== null && (int) ($jila?->vibhag_id) !== (int) $vibhagId) {
                return null;
            }
            if ($kshetraId !== null && (int) ($prant?->kshetra_id) !== (int) $kshetraId) {
                return null;
            }

            $parents = [];
            $ancestors = [];
            if ($nagar) {
                $ancestors[] = ['level' => 'nagar', 'id' => $nagar->id];
                $parents[] = [
                    'level' => 'nagar',
                    'name' => $nagar->nagar_name,
                    'id' => $nagar->id,
                    'url' => ToliEncryptionService::buildToliUrl($kshetraId, $vibhagId, $jilaId, $nagar->id),
                ];
            }
            if ($jila) {
                $ancestors[] = ['level' => 'jila', 'id' => $jila->id];
                $parents[] = [
                    'level' => 'jila',
                    'name' => $jila->jila_name,
                    'id' => $jila->id,
                    'url' => ToliEncryptionService::buildToliUrl($kshetraId, $vibhagId, $jila->id),
                ];
            }
            if ($vibhag) {
                $ancestors[] = ['level' => 'vibhag', 'id' => $vibhag->id];
            }
            if ($prant) {
                $ancestors[] = ['level' => 'prant', 'id' => $prant->id];
            }
            if ($kshetra) {
                $ancestors[] = ['level' => 'kshetra', 'id' => $kshetra->id];
            }

            // Sub-units: sibling shakhas in the same nagar
            $subUnits = [];
            if ($nagar) {
                $siblings = Shakha::where('nagar_id', $nagar->id)->get();
                foreach ($siblings as $sibling) {
                    $url = ToliEncryptionService::buildToliUrl($kshetraId, $vibhagId, $jilaId, $nagarId, $sibling->id);
                    $subUnits[] = [
                        'id' => $sibling->id,
                        'name' => $sibling->shakha_name,
                        'type' => 'shakha',
                        'type_hindi' => 'शाखा',
                        'url' => $url,
                        'full_url' => url($url),
                        'is_current' => (int) $sibling->id === (int) $shakhaId,
                        'members_count' => Swayamsevak::where('shakha_id', $sibling->id)->count(),
                        'ganvesh_count' => Swayamsevak::where('shakha_id', $sibling->id)->where('ganvesh', true)->count(),
                        'new_ganvesh' => (int) $sibling->new_ganvesh,
                    ];
                }
            }

            return [
                'level' => 'shakha',
                'target' => $shakha,
                'target_name' => $shakha->shakha_name,
                'parents' => $parents,
                'ancestors' => $ancestors,
                'sub_units' => $subUnits,
                'shakha_ids' => [$shakha->id],
            ];
        }

        // Nagar Level
        if ($nagarId !== null) {
            $nagar = Nagar::with(['jila.vibhag.prant.kshetra', 'shakhas'])->find($nagarId);
            if (!$nagar) {
                return null;
            }
            $jila = $nagar->jila;
            $vibhag = $jila?->vibhag;
            $prant = $vibhag?->prant;
            $kshetra = $prant?->kshetra;

            if ($jilaId !== null && (int) $nagar->jila_id !== (int) $jilaId) {
                return null;
            }
            if ($vibhagId !== null && (int) ($jila?->vibhag_id) !== (int) $vibhagId) {
                return null;
            }
            if ($kshetraId !== null && (int) ($prant?->kshetra_id) !== (int) $kshetraId) {
                return null;
            }

            $parents = [];
            $ancestors = [];
            if ($jila) {
                $ancestors[] = ['level' => 'jila', 'id' => $jila->id];
                $parents[] = [
                    'level' => 'jila',
                    'name' => $jila->jila_name,
                    'id' => $jila->id,
                    'url' => ToliEncryptionService::buildToliUrl($kshetraId, $vibhagId, $jila->id),
                ];
            }
            if ($vibhag) {
                $ancestors[] = ['level' => 'vibhag', 'id' => $vibhag->id];
                $parents[] = [
                    'level' => 'vibhag',
                    'name' => $vibhag->vibhag_name,
                    'id' => $vibhag->id,
                    'url' => ToliEncryptionService::buildToliUrl($kshetraId, $vibhag->id),
                ];
            }
            if ($prant) {
                $ancestors[] = ['level' => 'prant', 'id' => $prant->id];
            }
            if ($kshetra) {
                $ancestors[] = ['level' => 'kshetra', 'id' => $kshetra->id];
            }

            // Sub-units: shakhas under this nagar
            $subUnits = [];
            foreach ($nagar->shakhas as $s) {
                $url = ToliEncryptionService::buildToliUrl($kshetraId, $vibhagId, $jilaId, $nagarId, $s->id);
                $subUnits[] = [
                    'id' => $s->id,
                    'name' => $s->shakha_name,
                    'type' => 'shakha',
                    'type_hindi' => 'शाखा',
                    'url' => $url,
                    'full_url' => url($url),
                    'is_current' => false,
                    'members_count' => Swayamsevak::where('shakha_id', $s->id)->count(),
                    'ganvesh_count' => Swayamsevak::where('shakha_id', $s->id)->where('ganvesh', true)->count(),
                    'new_ganvesh' => (int) $s->new_ganvesh,
                ];
            }

            return [
                'level' => 'nagar',
                'target' => $nagar,
                'target_name' => $nagar->nagar_name,
                'parents' => $parents,
                'ancestors' => $ancestors,
                'sub_units' => $subUnits,
                'shakha_ids' => $nagar->shakhas->pluck('id')->toArray(),
            ];
        }

        // Jila Level
        if ($jilaId !== null) {
            $jila = Jila::with(['vibhag.prant.kshetra', 'nagars.shakhas'])->find($jilaId);
            if (!$jila) {
                return null;
            }
            $vibhag = $jila->vibhag;
            $prant = $vibhag?->prant;
            $kshetra = $prant?->kshetra;

            if ($vibhagId !== null && (int) $jila->vibhag_id !== (int) $vibhagId) {
                return null;
            }
            if ($kshetraId !== null && (int) ($prant?->kshetra_id) !== (int) $kshetraId) {
                return null;
            }

            $parents = [];
            $ancestors = [];
            if ($vibhag) {
                $ancestors[] = ['level' => 'vibhag', 'id' => $vibhag->id];
                $parents[] = [
                    'level' => 'vibhag',
                    'name' => $vibhag->vibhag_name,
                    'id' => $vibhag->id,
                    'url' => ToliEncryptionService::buildToliUrl($kshetraId, $vibhag->id),
                ];
            }
            if ($prant) {
                $ancestors[] = ['level' => 'prant', 'id' => $prant->id];
                $parents[] = [
                    'level' => 'prant',
                    'name' => $prant->prant_name,
                    'id' => $prant->id,
                    'url' => ToliEncryptionService::buildToliUrl($kshetraId),
                ];
            }
            if ($kshetra) {
                $ancestors[] = ['level' => 'kshetra', 'id' => $kshetra->id];
            }

            $shakhaIds = [];
            $subUnits = [];
            foreach ($jila->nagars as $n) {
                $shakhaIds = array_merge($shakhaIds, $n->shakhas->pluck('id')->toArray());
                $url = ToliEncryptionService::buildToliUrl($kshetraId, $vibhagId, $jilaId, $n->id);
                $subUnits[] = [
                    'id' => $n->id,
                    'name' => $n->nagar_name,
                    'type' => 'nagar',
                    'type_hindi' => 'नगर',
                    'url' => $url,
                    'full_url' => url($url),
                    'is_current' => false,
                    'shakhas_count' => $n->shakhas->count(),
                    'members_count' => Swayamsevak::whereIn('shakha_id', $n->shakhas->pluck('id'))->count(),
                    'ganvesh_count' => Swayamsevak::whereIn('shakha_id', $n->shakhas->pluck('id'))->where('ganvesh', true)->count(),
                    'new_ganvesh' => (int) $n->shakhas->sum('new_ganvesh'),
                ];
            }

            return [
                'level' => 'jila',
                'target' => $jila,
                'target_name' => $jila->jila_name,
                'parents' => $parents,
                'ancestors' => $ancestors,
                'sub_units' => $subUnits,
                'shakha_ids' => $shakhaIds,
            ];
        }

        // Vibhag Level
        if ($vibhagId !== null) {
            $vibhag = Vibhag::with(['prant.kshetra', 'jilas.nagars.shakhas'])->find($vibhagId);
            if (!$vibhag) {
                return null;
            }
            $prant = $vibhag->prant;

            if ($kshetraId !== null && (int) ($prant?->kshetra_id) !== (int) $kshetraId) {
                return null;
            }

            $parents = [];
            $ancestors = [];
            if ($prant) {
                $ancestors[] = ['level' => 'prant', 'id' => $prant->id];
                $parents[] = [
                    'level' => 'prant',
                    'name' => $prant->prant_name,
                    'id' => $prant->id,
                    'url' => ToliEncryptionService::buildToliUrl($kshetraId),
                ];
            }
            if ($prant?->kshetra) {
                $ancestors[] = ['level' => 'kshetra', 'id' => $prant->kshetra->id];
                $parents[] = [
                    'level' => 'kshetra',
                    'name' => $prant->kshetra->kshetra_name,
                    'id' => $prant->kshetra->id,
                    'url' => ToliEncryptionService::buildToliUrl($kshetraId),
                ];
            }

            $shakhaIds = [];
            $subUnits = [];
            foreach ($vibhag->jilas as $j) {
                $jilaShakhas = $j->nagars->flatMap(fn($n) => $n->shakhas)->pluck('id')->toArray();
                $shakhaIds = array_merge($shakhaIds, $jilaShakhas);
                $url = ToliEncryptionService::buildToliUrl($kshetraId, $vibhagId, $j->id);
                $subUnits[] = [
                    'id' => $j->id,
                    'name' => $j->jila_name,
                    'type' => 'jila',
                    'type_hindi' => 'ज़िला',
                    'url' => $url,
                    'full_url' => url($url),
                    'is_current' => false,
                    'nagars_count' => $j->nagars->count(),
                    'members_count' => Swayamsevak::whereIn('shakha_id', $jilaShakhas)->count(),
                    'ganvesh_count' => Swayamsevak::whereIn('shakha_id', $jilaShakhas)->where('ganvesh', true)->count(),
                    'new_ganvesh' => (int) Shakha::whereIn('id', $jilaShakhas)->sum('new_ganvesh'),
                ];
            }

            return [
                'level' => 'vibhag',
                'target' => $vibhag,
                'target_name' => $vibhag->vibhag_name,
                'parents' => $parents,
                'ancestors' => $ancestors,
                'sub_units' => $subUnits,
                'shakha_ids' => $shakhaIds,
            ];
        }

        // Kshetra Level
        $prants = Prant::where('kshetra_id', $kshetraId)->with('vibhags.jilas.nagars.shakhas')->get();
        $shakhaIds = [];
        $subUnits = [];
        foreach ($prants as $prant) {
            foreach ($prant->vibhags as $v) {
                $vibhagShakhas = $v->jilas->flatMap(fn($j) => $j->nagars)->flatMap(fn($n) => $n->shakhas)->pluck('id')->toArray();
                $shakhaIds = array_merge($shakhaIds, $vibhagShakhas);
                $url = ToliEncryptionService::buildToliUrl($kshetraId, $v->id);
                $subUnits[] = [
                    'id' => $v->id,
                    'name' => $v->vibhag_name,
                    'type' => 'vibhag',
                    'type_hindi' => 'विभाग',
                    'url' => $url,
                    'full_url' => url($url),
                    'is_current' => false,
                    'members_count' => Swayamsevak::whereIn('shakha_id', $vibhagShakhas)->count(),
                    'ganvesh_count' => Swayamsevak::whereIn('shakha_id', $vibhagShakhas)->where('ganvesh', true)->count(),
                    'new_ganvesh' => (int) Shakha::whereIn('id', $vibhagShakhas)->sum('new_ganvesh'),
                ];
            }
        }

        return [
            'level' => 'kshetra',
            'target' => $kshetra,
            'target_name' => $kshetra->kshetra_name,
            'parents' => [],
            'ancestors' => [],
            'sub_units' => $subUnits,
            'shakha_ids' => $shakhaIds,
        ];
    }

    /**
     * Resolve active products visible on this toli page based on Toli Inventory Scope rules.
     */
    protected function getVisibleProducts(array $hierarchy)
    {
        $currentLevel = $hierarchy['level'];
        $currentId = (int) $hierarchy['target']->id;

        // Current unit itself is always authorized for its own toli page
        $authorizedUnits = [
            [
                'level' => $currentLevel,
                'id' => $currentId,
            ],
        ];

        // Check ancestors: if an ancestor configured ToliInventoryScope and includes currentLevel in visible_sub_units
        $ancestors = $hierarchy['ancestors'] ?? [];
        foreach ($ancestors as $ancestor) {
            $scope = ToliInventoryScope::where('unit_type', $ancestor['level'])
                ->where('unit_id', $ancestor['id'])
                ->first();

            if ($scope && is_array($scope->visible_sub_units) && in_array($currentLevel, $scope->visible_sub_units, true)) {
                $authorizedUnits[] = [
                    'level' => $ancestor['level'],
                    'id' => (int) $ancestor['id'],
                ];
            }
        }

        return Product::where('status', 'active')
            ->where(function ($query) use ($authorizedUnits) {
                foreach ($authorizedUnits as $unit) {
                    $uLevel = $unit['level'];
                    $uId = $unit['id'];

                    $query->orWhereHas('dealer.profile', function ($profQ) use ($uLevel, $uId) {
                        if ($uLevel === 'shakha') {
                            $profQ->where('shakha_id', $uId);
                        } elseif ($uLevel === 'nagar') {
                            $profQ->where('nagar_id', $uId)
                                  ->where(function ($q) {
                                      $q->whereNull('shakha_id')->orWhere('shakha_id', 0);
                                  });
                        } elseif ($uLevel === 'jila') {
                            $profQ->where('jila_id', $uId)
                                  ->where(function ($q) {
                                      $q->whereNull('nagar_id')->orWhere('nagar_id', 0);
                                  })
                                  ->where(function ($q) {
                                      $q->whereNull('shakha_id')->orWhere('shakha_id', 0);
                                  });
                        } elseif ($uLevel === 'vibhag') {
                            $profQ->where('vibhag_id', $uId)
                                  ->where(function ($q) {
                                      $q->whereNull('jila_id')->orWhere('jila_id', 0);
                                  })
                                  ->where(function ($q) {
                                      $q->whereNull('nagar_id')->orWhere('nagar_id', 0);
                                  })
                                  ->where(function ($q) {
                                      $q->whereNull('shakha_id')->orWhere('shakha_id', 0);
                                  });
                        } elseif ($uLevel === 'prant') {
                            $profQ->where('prant_id', $uId)
                                  ->where(function ($q) {
                                      $q->whereNull('vibhag_id')->orWhere('vibhag_id', 0);
                                  })
                                  ->where(function ($q) {
                                      $q->whereNull('jila_id')->orWhere('jila_id', 0);
                                  })
                                  ->where(function ($q) {
                                      $q->whereNull('nagar_id')->orWhere('nagar_id', 0);
                                  })
                                  ->where(function ($q) {
                                      $q->whereNull('shakha_id')->orWhere('shakha_id', 0);
                                  });
                        } elseif ($uLevel === 'kshetra') {
                            $profQ->where('kshetra_id', $uId)
                                  ->where(function ($q) {
                                      $q->whereNull('prant_id')->orWhere('prant_id', 0);
                                  })
                                  ->where(function ($q) {
                                      $q->whereNull('vibhag_id')->orWhere('vibhag_id', 0);
                                  })
                                  ->where(function ($q) {
                                      $q->whereNull('jila_id')->orWhere('jila_id', 0);
                                  })
                                  ->where(function ($q) {
                                      $q->whereNull('nagar_id')->orWhere('nagar_id', 0);
                                  })
                                  ->where(function ($q) {
                                      $q->whereNull('shakha_id')->orWhere('shakha_id', 0);
                                  });
                        }
                    });
                }
            })
            ->select('id', 'name', 'price', 'stock', 'image_url', 'sku')
            ->orderBy('name')
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'price' => (float) $p->price,
                    'stock' => (int) $p->stock,
                    'image_url' => $p->image_url ?: '/images/products/shirt.svg',
                    'sku' => $p->sku,
                ];
            });
    }

    /**
     * Check if authenticated user has access to toli module and this unit.
     */
    protected function checkToliAccess(User $user, array $hierarchy): bool
    {
        if ($user->isSuperAdmin() || $user->isAdmin()) {
            return true;
        }

        if ($user->isKaryakarta() || $user->belongsToToli()) {
            return true;
        }

        $profile = $user->profile;
        if (!$profile) {
            return false;
        }

        // Check unit match
        $level = $hierarchy['level'];
        $targetId = $hierarchy['target']->id;

        if ($level === 'shakha' && (int) $profile->shakha_id === (int) $targetId) {
            return true;
        }
        if ($level === 'nagar' && (int) $profile->nagar_id === (int) $targetId) {
            return true;
        }
        if ($level === 'jila' && (int) $profile->jila_id === (int) $targetId) {
            return true;
        }
        if ($level === 'vibhag' && (int) $profile->vibhag_id === (int) $targetId) {
            return true;
        }
        if ($level === 'kshetra' && (int) $profile->kshetra_id === (int) $targetId) {
            return true;
        }

        return true; // Authorized toli members
    }

    /**
     * Translate level to Hindi label.
     */
    protected function getLevelHindi(string $level): string
    {
        return match ($level) {
            'shakha' => 'शाखा',
            'nagar' => 'नगर',
            'jila' => 'ज़िला',
            'vibhag' => 'विभाग',
            'prant' => 'प्रान्त',
            'kshetra' => 'क्षेत्र',
            default => 'इकाई',
        };
    }

    /**
     * Login endpoint with credentials (mobile/email and password).
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'login' => 'required|string',
            'password' => 'required|string',
        ]);

        $login = trim($request->input('login'));
        $password = $request->input('password');

        // Standard credential login (by email or phone)
        $user = User::where('email', $login)
            ->orWhere('phone', $login)
            ->first();

        if (!$user || !Hash::check($password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'गलत मोबाइल / ईमेल या पासवर्ड। कृपया जाँच करें।',
            ], 401);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'आपका खाता निष्क्रिय है। कृपया व्यवस्थापक से संपर्क करें।',
            ], 403);
        }

        Auth::login($user, true);

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'role' => $user->role,
            ],
            'message' => 'लॉगिन सफल हुआ।',
        ]);
    }

    /**
     * Logout endpoint to clear session and stored passcode.
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'success' => true,
            'message' => 'सफलतापूर्वक लॉग आउट किया गया।',
        ]);
    }

    /**
     * Store new Swayamsevak (Member).
     */
    public function storeMember(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'mobile' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:1000',
            'shakha_id' => 'required|exists:shakhas,id',
            'ganvesh' => 'required|boolean',
            'shikshan' => 'nullable|string|max:100',
        ]);

        Swayamsevak::create($validated);

        return back()->with('success', 'स्वयंसेवक सफलतापूर्वक सूची में जोड़ा गया।');
    }

    /**
     * Update Swayamsevak (Member).
     */
    public function updateMember(Request $request, Swayamsevak $swayamsevak): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'mobile' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:1000',
            'shakha_id' => 'required|exists:shakhas,id',
            'ganvesh' => 'required|boolean',
            'shikshan' => 'nullable|string|max:100',
        ]);

        $swayamsevak->update($validated);

        return back()->with('success', 'स्वयंसेवक विवरण सफलतापूर्वक अपडेट किया गया।');
    }

    /**
     * Delete Swayamsevak (Member).
     */
    public function destroyMember(Swayamsevak $swayamsevak): RedirectResponse
    {
        $swayamsevak->delete();

        return back()->with('success', 'स्वयंसेवक को सूची से हटा दिया गया।');
    }

    /**
     * Download CSV Template for bulk Swayamsevak upload.
     */
    public function downloadTemplate(): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="swayamsevak_template.csv"',
        ];

        return response()->stream(function () {
            $handle = fopen('php://output', 'w');
            // Write UTF-8 BOM for accurate Hindi rendering in Excel
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            fputcsv($handle, ['name', 'mobile', 'address', 'ganvesh', 'shikshan']);
            fputcsv($handle, ['रमेश कुमार', '9876543210', 'शिवाजी नगर, गली नं. 2', 'हाँ', 'प्राथमिक']);
            fputcsv($handle, ['सुरेश शर्मा', '9876543211', 'स्टेशन रोड', 'नहीं', 'प्रारंभिक']);
            fputcsv($handle, ['अनिल वर्मा', '9876543212', 'गांधी चौक', 'हाँ', 'संघ शिक्षा वर्ग']);

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Bulk import Swayamsevaks from CSV file.
     */
    public function importMembers(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:5120',
            'shakha_id' => 'required|exists:shakhas,id',
        ]);

        $shakhaId = (int) $request->input('shakha_id');
        $file = $request->file('file');

        $handle = fopen($file->getRealPath(), 'r');
        if (!$handle) {
            return back()->with('error', 'फ़ाइल खोलने में त्रुटि हुई।');
        }

        // Read header
        $header = fgetcsv($handle);
        if (!$header) {
            fclose($handle);
            return back()->with('error', 'फ़ाइल खाली है।');
        }

        // Normalize header names (remove UTF-8 BOM and lower-case)
        $cleanHeader = array_map(function ($col) {
            $c = preg_replace('/[\x{FEFF}\x{200B}]/u', '', trim($col));
            return strtolower($c);
        }, $header);

        $nameIdx = array_search('name', $cleanHeader);
        $mobileIdx = array_search('mobile', $cleanHeader);
        $addressIdx = array_search('address', $cleanHeader);
        $ganveshIdx = array_search('ganvesh', $cleanHeader);
        $shikshanIdx = array_search('shikshan', $cleanHeader);

        if ($nameIdx === false) {
            fclose($handle);
            return back()->with('error', 'फ़ाइल में "name" कॉलम होना आवश्यक है।');
        }

        $importedCount = 0;
        DB::beginTransaction();

        try {
            while (($row = fgetcsv($handle)) !== false) {
                if (empty($row) || !isset($row[$nameIdx]) || trim($row[$nameIdx]) === '') {
                    continue;
                }

                $name = trim($row[$nameIdx]);
                $mobile = $mobileIdx !== false && isset($row[$mobileIdx]) ? trim($row[$mobileIdx]) : null;
                $address = $addressIdx !== false && isset($row[$addressIdx]) ? trim($row[$addressIdx]) : null;

                $ganveshRaw = $ganveshIdx !== false && isset($row[$ganveshIdx]) ? mb_strtolower(trim($row[$ganveshIdx])) : '';
                $ganvesh = in_array($ganveshRaw, ['yes', 'y', 'haan', 'हाँ', '1', 'true', 'युक्त']);

                $shikshan = $shikshanIdx !== false && isset($row[$shikshanIdx]) ? trim($row[$shikshanIdx]) : null;

                Swayamsevak::create([
                    'name' => $name,
                    'mobile' => $mobile,
                    'address' => $address,
                    'shakha_id' => $shakhaId,
                    'ganvesh' => $ganvesh,
                    'shikshan' => $shikshan,
                ]);

                $importedCount++;
            }

            DB::commit();
            fclose($handle);

            return back()->with('success', "{$importedCount} स्वयंसेवक सफलतापूर्वक जोड़े गए।");
        } catch (\Throwable $e) {
            DB::rollBack();
            fclose($handle);
            return back()->with('error', 'आयात में त्रुटि: ' . $e->getMessage());
        }
    }

    /**
     * Update New Ganvesh figure for a Shakha.
     */
    public function updateNewGanvesh(Request $request, Shakha $shakha): RedirectResponse
    {
        $validated = $request->validate([
            'new_ganvesh' => 'required|integer|min:0|max:10000',
        ]);

        $shakha->update([
            'new_ganvesh' => (int) $validated['new_ganvesh'],
        ]);

        return back()->with('success', "शाखा '{$shakha->shakha_name}' का नया गणवेश आंकड़ा अपडेट किया गया।");
    }

    /**
     * Place fast toli order (uniform distribution flow).
     * Delivery address is skipped and the order is auto-tagged to the toli unit.
     */
    public function placeOrder(Request $request): JsonResponse|RedirectResponse
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1|max:500',
            'payment_status' => 'required|in:paid,payment_due,placed,completed',
            'notes' => 'nullable|string|max:500',
            'swayamsevak_id' => 'nullable|exists:swayamsevaks,id',
            'shakha_id' => 'nullable|exists:shakhas,id',
            'nagar_id' => 'nullable|exists:nagars,id',
            'jila_id' => 'nullable|exists:jilas,id',
            'vibhag_id' => 'nullable|exists:vibhags,id',
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'अनधिकृत अनुरोध।'], 401);
        }

        DB::beginTransaction();
        try {
            $product = Product::lockForUpdate()->find($request->input('product_id'));
            $quantity = (int) $request->input('quantity');

            if (!$product || $product->stock < $quantity) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => "मांग के अनुसार स्टॉक उपलब्ध नहीं है। उपलब्ध स्टॉक: " . ($product?->stock ?? 0),
                ], 422);
            }

            // Decrement stock
            $product->decrement('stock', $quantity);

            $subtotal = $product->price * $quantity;
            $paymentStatusInput = $request->input('payment_status');

            // Map payment and delivery status based on selected payment status
            $paymentStatus = match ($paymentStatusInput) {
                'paid' => 'paid',
                'completed' => 'paid',
                'payment_due' => 'pending',
                default => 'pending',
            };

            $deliveryStatus = match ($paymentStatusInput) {
                'completed' => 'delivered',
                default => 'pending',
            };

            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'customer_id' => $user->id,
                'delivery_location_id' => null, // Delivery address skipped for toli direct distribution
                'delivery_partner_id' => null,
                'subtotal' => $subtotal,
                'delivery_fee' => 0.00,
                'total_amount' => $subtotal,
                'payment_method' => $paymentStatusInput === 'paid' ? 'cash' : 'due',
                'payment_status' => $paymentStatus,
                'delivery_status' => $deliveryStatus,
                'order_status' => $paymentStatusInput,
                'is_toli_order' => true,
                'swayamsevak_id' => $request->input('swayamsevak_id'),
                'shakha_id' => $request->input('shakha_id'),
                'nagar_id' => $request->input('nagar_id'),
                'jila_id' => $request->input('jila_id'),
                'vibhag_id' => $request->input('vibhag_id'),
                'notes' => $request->input('notes'),
                'placed_at' => now(),
                'delivered_at' => $deliveryStatus === 'delivered' ? now() : null,
            ]);

            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'dealer_id' => $product->dealer_id,
                'product_name' => $product->name,
                'unit_price' => $product->price,
                'quantity' => $quantity,
                'subtotal' => $subtotal,
            ]);

            DeliveryLog::create([
                'order_id' => $order->id,
                'status' => $order->order_status,
                'notes' => 'टोली गणवेश वितरण मॉड्यूल द्वारा दर्ज किया गया।',
                'updated_by' => $user->id,
            ]);

            DB::commit();

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'order' => [
                        'id' => $order->id,
                        'order_number' => $order->order_number,
                        'total_amount' => (float) $order->total_amount,
                        'order_status' => $order->order_status,
                        'swayamsevak_id' => $order->swayamsevak_id,
                        'product_name' => $product->name,
                        'quantity' => $quantity,
                    ],
                    'message' => 'ऑर्डर सफलतापूर्वक दर्ज किया गया।',
                ]);
            }

            return back()->with('success', "ऑर्डर #{$order->order_number} सफलतापूर्वक दर्ज हुआ।");
        } catch (\Throwable $e) {
            DB::rollBack();
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'ऑर्डर दर्ज करने में त्रुटि: ' . $e->getMessage(),
                ], 500);
            }
            return back()->with('error', 'ऑर्डर दर्ज करने में त्रुटि: ' . $e->getMessage());
        }
    }

    /**
     * Update order status by toli member.
     */
    public function updateOrderStatus(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:paid,payment_due,placed,completed,delivered',
        ]);

        $newStatus = $validated['status'];
        $updates = ['order_status' => $newStatus];

        if ($newStatus === 'paid') {
            $updates['payment_status'] = 'paid';
        } elseif ($newStatus === 'completed' || $newStatus === 'delivered') {
            $updates['delivery_status'] = 'delivered';
            $updates['delivered_at'] = now();
            if ($newStatus === 'completed') {
                $updates['payment_status'] = 'paid';
            }
        } elseif ($newStatus === 'payment_due') {
            $updates['payment_status'] = 'pending';
        }

        $order->update($updates);

        DeliveryLog::create([
            'order_id' => $order->id,
            'status' => $newStatus,
            'notes' => 'स्थिति टोली सदस्य द्वारा अपडेट की गई: ' . $newStatus,
            'updated_by' => Auth::id(),
        ]);

        return back()->with('success', "ऑर्डर #{$order->order_number} की स्थिति अपडेट की गई।");
    }

    /**
     * Cancel toli order and restock inventory.
     */
    public function cancelOrder(Request $request, Order $order): RedirectResponse
    {
        $user = Auth::user();
        if (!$order->canBeCancelled()) {
            return back()->with('error', 'यह ऑर्डर रद्द नहीं किया जा सकता।');
        }

        DB::beginTransaction();
        try {
            $order->update([
                'order_status' => 'cancelled',
                'cancelled_at' => now(),
                'cancelled_by' => $user->id,
                'cancellation_reason' => $request->input('reason', 'टोली सदस्य द्वारा रद्द'),
                'restocked' => true,
                'restocked_at' => now(),
                'restocked_by' => $user->id,
            ]);

            // Restock items
            foreach ($order->items as $item) {
                if ($item->product) {
                    $item->product->restock($item->quantity);
                }
            }

            DeliveryLog::create([
                'order_id' => $order->id,
                'status' => 'cancelled',
                'notes' => 'ऑर्डर टोली द्वारा रद्द एवं स्टॉक पुनः जोड़ा गया।',
                'updated_by' => $user->id,
            ]);

            DB::commit();
            return back()->with('success', "ऑर्डर #{$order->order_number} सफलतापूर्वक रद्द किया गया एवं स्टॉक वापस जोड़ दिया गया।");
        } catch (\Throwable $e) {
            DB::rollBack();
            return back()->with('error', 'ऑर्डर रद्द करने में त्रुटि: ' . $e->getMessage());
        }
    }

    /**
     * Raise return request for completed toli order.
     */
    public function returnOrder(Request $request, Order $order): RedirectResponse
    {
        $user = Auth::user();
        if (!$order->canRaiseReturnRequest()) {
            return back()->with('error', 'इस ऑर्डर पर वापसी अनुरोध नहीं भेजा जा सकता।');
        }

        $firstItem = $order->items->first();

        ReturnRequest::create([
            'order_id' => $order->id,
            'customer_id' => $user->id,
            'dealer_id' => $firstItem?->dealer_id ?? 1,
            'status' => 'return_request_raised',
            'reason' => $request->input('reason', 'आकार या गुणवत्ता परिवर्तन हेतु'),
            'customer_notes' => $request->input('notes'),
            'raised_at' => now(),
        ]);

        return back()->with('success', "ऑर्डर #{$order->order_number} का वापसी अनुरोध दर्ज किया गया।");
    }

    /**
     * Store product demand in toli module (for out of stock items).
     */
    public function storeDemand(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'मांग दर्ज करने के लिए कृपया पहले लॉगिन करें।',
            ], 401);
        }

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'swayamsevak_id' => 'nullable|exists:swayamsevaks,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        $product = Product::findOrFail($validated['product_id']);

        if ($product->stock > 0) {
            return response()->json([
                'success' => false,
                'message' => 'मांग केवल 0 स्टॉक वाले उत्पादों के लिए ही दर्ज की जा सकती है। यह उत्पाद अभी स्टॉक में उपलब्ध है।',
            ], 422);
        }

        $demand = ProductDemand::create([
            'product_id' => $product->id,
            'customer_id' => $user->id,
            'swayamsevak_id' => $validated['swayamsevak_id'] ?? null,
            'quantity' => (int) $validated['quantity'],
            'original_quantity' => (int) $validated['quantity'],
            'status' => 'pending',
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'मांग सफलतापूर्वक दर्ज की गई! जब डीलर द्वारा स्टॉक बढ़ाया जाएगा, आपकी मांग के अनुपात में पूर्ति की जाएगी।',
            'demand' => $demand->load('product', 'swayamsevak'),
        ]);
    }
}
