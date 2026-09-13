<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductRequest;
use App\Models\Category;
use App\Models\Product;
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

        $products = Product::with(['dealer', 'category'])
            ->active()
            ->search($request->input('search'))
            ->byCategory($request->input('category_id'))
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Products/Index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => [
                'search' => $request->input('search', ''),
                'category_id' => $request->input('category_id', ''),
            ],
        ]);
    }

    /**
     * Show single product details.
     */
    public function show(Product $product): Response
    {
        $product->load(['dealer', 'category']);

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

        $products = Product::where('dealer_id', $user->id)
            ->with('category')
            ->search($search)
            ->latest()
            ->paginate(15)
            ->withQueryString();

        // Check if user has dual roles (Dealer + Karyakarta) and hasn't yet seeded shakha products
        $hasBothRoles = $user->isDealer() && $user->isKaryakarta();
        $alreadySeeded = ($user->profile && $user->profile->has_seeded_shakha_products)
            || Product::where('dealer_id', $user->id)->where('sku', 'like', 'SHK-%')->exists();

        $canSeedShakhaProducts = $hasBothRoles && !$alreadySeeded;

        return Inertia::render('Products/Dealer/Index', [
            'products' => $products,
            'filters' => [
                'search' => $search ?? '',
            ],
            'can_seed_shakha_products' => $canSeedShakhaProducts,
        ]);
    }

    /**
     * One-time batch creation of all Shakha products for users with both Dealer & Karyakarta roles.
     */
    public function seedShakhaProducts(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (!$user->isDealer() || !$user->isKaryakarta()) {
            abort(403, 'Unauthorized. Only users with both Dealer and Karyakarta roles can access this facility.');
        }

        if ($user->profile && $user->profile->has_seeded_shakha_products) {
            return redirect()->route('dealer.products.index')->with('error', 'Standard Shakha products have already been generated for this account.');
        }

        $count = ShakhaProductService::createForDealer($user);

        return redirect()->route('dealer.products.index')
            ->with('success', "{$count} standard Shakha products added to your inventory successfully!");
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
