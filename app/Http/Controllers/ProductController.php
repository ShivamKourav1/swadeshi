<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductRequest;
use App\Models\Category;
use App\Models\Jila;
use App\Models\Nagar;
use App\Models\Product;
use App\Models\Shakha;
use App\Services\ShakhaProductService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    /**
     * Storefront: List active products with searching and filtering.
     */
    public function index(Request $request): Response
    {
        $categories = Category::where('is_active', true)->get();

        $jilas = Jila::select('id', 'jila_name')->orderBy('jila_name')->get();
        $nagars = Nagar::with('jila:id,jila_name')->select('id', 'nagar_name', 'jila_id')->orderBy('nagar_name')->get();
        $shakhas = Shakha::with('nagar:id,nagar_name')->select('id', 'shakha_name', 'nagar_id')->orderBy('shakha_name')->get();

        // Check user's location if authenticated
        $userUnit = null;
        if ($user = $request->user()) {
            $loc = $user->deliveryLocations()->where('is_default', true)->first()
                ?: $user->deliveryLocations()->latest()->first();
            $prof = $user->profile;

            $shakhaId = $loc?->shakha_id ?: $prof?->shakha_id;
            $nagarId = $loc?->nagar_id ?: $prof?->nagar_id;
            $jilaId = $loc?->jila_id ?: $prof?->jila_id;

            if ($nagarId) {
                $n = Nagar::find($nagarId);
                if ($n) {
                    $userUnit = [
                        'type' => 'nagar',
                        'id' => $n->id,
                        'name' => $n->nagar_name,
                        'label' => "{$n->nagar_name} Nagar",
                    ];
                }
            } elseif ($shakhaId) {
                $s = Shakha::find($shakhaId);
                if ($s) {
                    $userUnit = [
                        'type' => 'shakha',
                        'id' => $s->id,
                        'name' => $s->shakha_name,
                        'label' => "{$s->shakha_name} (Shakha)",
                    ];
                }
            } elseif ($jilaId) {
                $j = Jila::find($jilaId);
                if ($j) {
                    $userUnit = [
                        'type' => 'jila',
                        'id' => $j->id,
                        'name' => $j->jila_name,
                        'label' => "{$j->jila_name} Jila",
                    ];
                }
            }
        }

        $products = Product::with([
            'dealer.profile.shakha',
            'dealer.profile.nagar',
            'dealer.profile.jila',
            'dealer.profile.vibhag',
            'dealer.roles',
            'category'
        ])
            ->active()
            ->search($request->input('search'))
            ->byCategory($request->input('category_id'))
            ->byOrgUnit(
                $request->input('org_unit_type'),
                $request->input('org_unit_id'),
                $request->input('org_unit_search'),
                $request->boolean('only_karyakarta')
            )
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Products/Index', [
            'products' => $products,
            'categories' => $categories,
            'orgUnits' => [
                'jilas' => $jilas,
                'nagars' => $nagars,
                'shakhas' => $shakhas,
            ],
            'userUnit' => $userUnit,
            'filters' => [
                'search' => $request->input('search', ''),
                'category_id' => $request->input('category_id', ''),
                'org_unit_type' => $request->input('org_unit_type', ''),
                'org_unit_id' => $request->input('org_unit_id', ''),
                'org_unit_search' => $request->input('org_unit_search', ''),
                'only_karyakarta' => $request->boolean('only_karyakarta'),
            ],
        ]);
    }

    /**
     * Show single product details.
     */
    public function show(Product $product): Response
    {
        $product->load([
            'dealer.profile.shakha',
            'dealer.profile.nagar',
            'dealer.profile.jila',
            'dealer.profile.vibhag',
            'dealer.roles',
            'category'
        ]);

        return Inertia::render('Products/Show', [
            'product' => $product,
        ]);
    }

    /**
     * Dealer Dashboard: List dealer's products.
     */
    public function dealerIndex(Request $request): Response
    {
        $user = $request->user();
        $search = $request->input('search');
        $perPage = (int) $request->input('per_page', 50);
        if ($perPage < 10 || $perPage > 200) {
            $perPage = 50;
        }

        $products = Product::where('dealer_id', $user->id)
            ->with('category')
            ->search($search)
            ->orderBy('id', 'asc')
            ->paginate($perPage)
            ->withQueryString();

        // Standard Shakha products count
        $standardTotal = count(ShakhaProductService::getProductList());
        $dealerStandardCount = Product::where('dealer_id', $user->id)
            ->where('sku', 'like', 'SHK-%')
            ->count();

        // Dealer can seed if any standard products are missing
        $canSeedShakhaProducts = ($user->isDealer() || $user->hasRole('superadmin'))
            && ($dealerStandardCount < $standardTotal);

        return Inertia::render('Products/Dealer/Index', [
            'products' => $products,
            'filters' => [
                'search' => $search ?? '',
                'per_page' => $perPage,
            ],
            'can_seed_shakha_products' => $canSeedShakhaProducts,
            'standard_products_count' => $dealerStandardCount,
            'standard_products_total' => $standardTotal,
        ]);
    }

    /**
     * Batch creation or sync of all 23 standard Shakha products for dealers.
     */
    public function seedShakhaProducts(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (!$user->isDealer() && !$user->hasRole('superadmin')) {
            abort(403, 'Unauthorized. Only dealers can access this facility.');
        }

        $standardTotal = count(ShakhaProductService::getProductList());
        $existingCount = Product::where('dealer_id', $user->id)
            ->where('sku', 'like', 'SHK-%')
            ->count();

        if ($existingCount >= $standardTotal && $user->profile && $user->profile->has_seeded_shakha_products) {
            return redirect()->route('dealer.products.index')
                ->with('error', 'Standard Shakha products have already been generated for this account.');
        }

        $count = ShakhaProductService::createForDealer($user);

        return redirect()->route('dealer.products.index')
            ->with('success', "All {$standardTotal} standard Shakha products (including Shirts, Pants, Shoes, Cap, Belts, etc.) are synchronized in your inventory!");
    }

    public function create(): Response
    {
        $categories = Category::where('is_active', true)->get();

        return Inertia::render('Products/Dealer/Create', [
            'categories' => $categories,
        ]);
    }

    public function store(ProductRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $validated['dealer_id'] = $request->user()->id;
        $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(5);

        Product::create($validated);

        return redirect()->route('dealer.products.index')->with('success', 'Product created successfully!');
    }

    public function edit(Product $product): Response
    {
        $this->authorizeProductOwnership(auth()->user(), $product);

        $categories = Category::where('is_active', true)->get();

        return Inertia::render('Products/Dealer/Edit', [
            'product' => $product,
            'categories' => $categories,
        ]);
    }

    public function update(ProductRequest $request, Product $product): RedirectResponse
    {
        $this->authorizeProductOwnership($request->user(), $product);

        $validated = $request->validated();
        if ($product->name !== $validated['name']) {
            $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(5);
        }

        $product->update($validated);

        return redirect()->route('dealer.products.index')->with('success', 'Product updated successfully!');
    }

    public function destroy(Request $request, Product $product): RedirectResponse
    {
        $this->authorizeProductOwnership($request->user(), $product);

        $product->delete();

        return redirect()->route('dealer.products.index')->with('success', 'Product deleted successfully!');
    }

    private function authorizeProductOwnership($user, Product $product): void
    {
        if (!$user->isAdmin() && $product->dealer_id !== $user->id) {
            abort(403, 'Unauthorized action on product.');
        }
    }
}
