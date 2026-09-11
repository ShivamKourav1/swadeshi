<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DealerCategoryController extends Controller
{
    /**
     * Display a listing of categories for dealers and admins.
     */
    public function index(Request $request): Response
    {
        $this->authorizeDealer();

        $search = $request->input('search');

        $categories = Category::withCount('products')
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Dealer/Categories/Index', [
            'categories' => $categories,
            'filters' => [
                'search' => $search ?? '',
            ],
        ]);
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request): RedirectResponse
    {
        $this->authorizeDealer();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:categories,slug',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
        ]);

        if (empty($validated['slug'])) {
            $baseSlug = Str::slug($validated['name']);
            $slug = $baseSlug;
            $counter = 1;
            while (Category::where('slug', $slug)->exists()) {
                $slug = $baseSlug . '-' . $counter;
                $counter++;
            }
            $validated['slug'] = $slug;
        }

        $validated['is_active'] = $request->boolean('is_active', true);

        Category::create($validated);

        return redirect()->route('dealer.categories.index')->with('success', 'Category created successfully!');
    }

    /**
     * Update the specified category.
     */
    public function update(Request $request, Category $category): RedirectResponse
    {
        $this->authorizeDealer();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:categories,slug,' . $category->id,
            'description' => 'nullable|string',
            'image_url' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
        ]);

        $validated['is_active'] = $request->boolean('is_active', true);

        $category->update($validated);

        return redirect()->route('dealer.categories.index')->with('success', 'Category updated successfully!');
    }

    /**
     * Remove the specified category from storage.
     */
    public function destroy(Request $request, Category $category): RedirectResponse
    {
        $this->authorizeDealer();

        $productsCount = $category->products()->count();
        if ($productsCount > 0) {
            return redirect()->route('dealer.categories.index')->with('error', "Cannot delete category '{$category->name}' because it contains {$productsCount} products. Please reassign or delete the products first.");
        }

        $category->delete();

        return redirect()->route('dealer.categories.index')->with('success', 'Category deleted successfully!');
    }

    /**
     * Ensure only dealers and admins can manage categories.
     */
    private function authorizeDealer(): void
    {
        $user = auth()->user();
        if (!$user || ($user->role !== 'dealer' && $user->role !== 'admin')) {
            abort(403, 'Unauthorized. Only dealers and admins can manage product categories.');
        }
    }
}
