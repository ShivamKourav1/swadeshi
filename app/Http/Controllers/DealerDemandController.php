<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductDemand;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DealerDemandController extends Controller
{
    /**
     * Display a separate page for dealer to view demands for each product having stock 0.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (!$user->isDealer() && !$user->isAdmin()) {
            abort(403, 'Unauthorized. Only dealers and administrators can access product demands.');
        }

        $search = $request->input('search');
        $categoryId = $request->input('category_id');

        // Query products belonging to dealer that have stock == 0 (or <= 0)
        $productsQuery = Product::where('stock', '<=', 0);

        if (!$user->isAdmin()) {
            $productsQuery->where('dealer_id', $user->id);
        }

        if ($search) {
            $productsQuery->search($search);
        }

        if ($categoryId) {
            $productsQuery->where('category_id', $categoryId);
        }

        $products = $productsQuery->with([
            'category',
            'demands' => function ($q) {
                $q->with([
                    'customer:id,name,email,mobile',
                    'swayamsevak:id,name,mobile,basti_id,shakha_id',
                    'swayamsevak.basti:id,basti_name',
                    'swayamsevak.shakha:id,basti_name',
                ])->orderBy('created_at', 'desc');
            }
        ])
        ->orderBy('name', 'asc')
        ->paginate(20)
        ->through(function ($product) {
            $activeDemandUnits = $product->demands->sum('quantity');
            $totalOriginalUnits = $product->demands->sum('original_quantity');
            $pendingDemandsCount = $product->demands->where('quantity', '>', 0)->count();

            return [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'price' => $product->price,
                'stock' => $product->stock,
                'image_url' => $product->image_url,
                'category' => $product->category ? [
                    'id' => $product->category->id,
                    'name' => $product->category->name,
                ] : null,
                'active_demand_units' => $activeDemandUnits,
                'total_original_units' => $totalOriginalUnits,
                'pending_demands_count' => $pendingDemandsCount,
                'demands' => $product->demands->map(function ($demand) {
                    $bastiName = $demand->swayamsevak?->basti?->basti_name ?? $demand->swayamsevak?->shakha?->shakha_name;
                    return [
                        'id' => $demand->id,
                        'customer' => [
                            'id' => $demand->customer?->id,
                            'name' => $demand->customer?->name ?? 'अज्ञात ग्राहक',
                            'email' => $demand->customer?->email,
                            'mobile' => $demand->customer?->mobile,
                        ],
                        'swayamsevak' => $demand->swayamsevak ? [
                            'id' => $demand->swayamsevak->id,
                            'name' => $demand->swayamsevak->name,
                            'mobile' => $demand->swayamsevak->mobile,
                            'basti_name' => $bastiName,
                            'shakha_name' => $bastiName,
                        ] : null,
                        'quantity' => $demand->quantity,
                        'original_quantity' => $demand->original_quantity,
                        'status' => $demand->status,
                        'notes' => $demand->notes,
                        'created_at' => $demand->created_at?->toIso8601String(),
                        'created_at_human' => $demand->created_at?->diffForHumans(),
                    ];
                }),
            ];
        })
        ->withQueryString();

        // Overall summary statistics for zero-stock products
        $allZeroStockQuery = Product::where('stock', '<=', 0);
        if (!$user->isAdmin()) {
            $allZeroStockQuery->where('dealer_id', $user->id);
        }
        $zeroStockProductIds = (clone $allZeroStockQuery)->pluck('id');

        $totalZeroStockProducts = $zeroStockProductIds->count();
        $totalPendingDemandUnits = ProductDemand::whereIn('product_id', $zeroStockProductIds)->sum('quantity');
        $totalDemandRequests = ProductDemand::whereIn('product_id', $zeroStockProductIds)->count();

        $categories = Category::where('is_active', true)->get(['id', 'name']);

        $shareableProducts = (clone $allZeroStockQuery)
            ->select('id', 'name', 'sku', 'price', 'stock', 'category_id')
            ->withSum('demands as pending_demand_units', 'quantity')
            ->with('category:id,name')
            ->orderBy('name', 'asc')
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'sku' => $p->sku,
                    'category' => $p->category?->name,
                    'pending_demand_units' => (int) ($p->pending_demand_units ?? 0),
                ];
            });

        return Inertia::render('Dealer/Demands', [
            'products' => $products,
            'shareable_products' => $shareableProducts,
            'categories' => $categories,
            'summary' => [
                'zero_stock_products_count' => $totalZeroStockProducts,
                'total_pending_demand_units' => (int) $totalPendingDemandUnits,
                'total_demand_requests' => $totalDemandRequests,
            ],
            'filters' => [
                'search' => $search ?? '',
                'category_id' => $categoryId ?? '',
            ],
        ]);
    }

    /**
     * Quick restock product directly from Demands page.
     */
    public function quickRestock(Request $request, Product $product): RedirectResponse
    {
        $user = $request->user();

        if (!$user->isAdmin() && $product->dealer_id !== $user->id) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'added_stock' => 'required|integer|min:1',
        ]);

        $added = (int) $validated['added_stock'];
        $product->restock($added);

        return back()->with('success', "उत्पाद '{$product->name}' में {$added} इकाइयां स्टॉक में जोड़ी गईं एवं मांग के आंकड़े तदनुसार घटा दिए गए!");
    }

    /**
     * Download Excel/CSV file of zero-stock products demand list (1 row per product).
     */
    public function exportCsv(Request $request): StreamedResponse
    {
        $user = $request->user();

        if (!$user->isDealer() && !$user->isAdmin()) {
            abort(403, 'Unauthorized. Only dealers and administrators can export demands.');
        }

        $search = $request->input('search');
        $categoryId = $request->input('category_id');
        $onlyPending = $request->boolean('only_pending', false);

        $query = Product::where('stock', '<=', 0);

        if (!$user->isAdmin()) {
            $query->where('dealer_id', $user->id);
        }

        if ($search) {
            $query->search($search);
        }

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        $products = $query->select('id', 'name', 'sku', 'price', 'stock', 'category_id')
            ->withSum('demands as pending_demand_units', 'quantity')
            ->withCount(['demands as total_demand_requests' => function ($q) {
                $q->where('quantity', '>', 0);
            }])
            ->with('category:id,name')
            ->orderBy('name', 'asc')
            ->get();

        if ($onlyPending) {
            $products = $products->filter(function ($p) {
                return (int) ($p->pending_demand_units ?? 0) > 0;
            });
        }

        $dateStr = now()->format('Y-m-d');
        $filename = "demands_zero_stock_{$dateStr}.csv";

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($products) {
            $handle = fopen('php://output', 'w');
            // Write UTF-8 BOM so Microsoft Excel correctly displays Hindi/Devanagari characters
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // CSV Header Row (1 row per product)
            fputcsv($handle, [
                'क्र. सं. (Sr No)',
                'उत्पाद का नाम (Product Name)',
                'एसकेयू कोड (SKU)',
                'श्रेणी (Category)',
                'मूल्य (Price ₹)',
                'वर्तमान स्टॉक (Current Stock)',
                'लंबित मांग संख्या (Pending Demand Units)',
                'मांग अनुरोधों की संख्या (Demand Requests)',
                'स्थिति (Status)'
            ]);

            $idx = 1;
            foreach ($products as $p) {
                fputcsv($handle, [
                    $idx++,
                    $p->name,
                    $p->sku ?? 'N/A',
                    $p->category?->name ?? 'सामान्य',
                    number_format((float) $p->price, 2, '.', ''),
                    0,
                    (int) ($p->pending_demand_units ?? 0),
                    (int) ($p->total_demand_requests ?? 0),
                    'आउट ऑफ स्टॉक (मांग अपेक्षित)'
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }
}
