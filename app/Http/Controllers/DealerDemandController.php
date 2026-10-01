<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductDemand;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

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
                    'swayamsevak:id,name,mobile,shakha_id',
                    'swayamsevak.shakha:id,shakha_name',
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
                            'shakha_name' => $demand->swayamsevak->shakha?->shakha_name,
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

        return Inertia::render('Dealer/Demands', [
            'products' => $products,
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
}
