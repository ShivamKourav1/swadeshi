<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductDemand;
use App\Models\Swayamsevak;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductDemandController extends Controller
{
    /**
     * Store a new product demand from the storefront.
     * Only permitted if product stock is 0.
     */
    public function store(Request $request): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'swayamsevak_id' => 'nullable|exists:swayamsevaks,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        $product = Product::findOrFail($validated['product_id']);

        // Demands can ONLY be created when product stock is 0
        if ($product->stock > 0) {
            $msg = 'मांग केवल शून्य (0) स्टॉक वाले उत्पादों के लिए ही दर्ज की जा सकती है। यह उत्पाद अभी स्टॉक में उपलब्ध है।';
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $msg], 422);
            }
            return back()->with('error', $msg);
        }

        $user = $request->user();

        $demand = ProductDemand::create([
            'product_id' => $product->id,
            'customer_id' => $user->id,
            'swayamsevak_id' => $validated['swayamsevak_id'] ?? null,
            'quantity' => (int) $validated['quantity'],
            'original_quantity' => (int) $validated['quantity'],
            'status' => 'pending',
            'notes' => $validated['notes'] ?? null,
        ]);

        $successMsg = 'उत्पाद मांग सफलतापूर्वक दर्ज की गई! जब डीलर द्वारा स्टॉक बढ़ाया जाएगा, आपकी मांग के अनुपात में स्टॉक उपलब्ध कराया जाएगा।';

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => $successMsg,
                'demand' => $demand->load('product', 'swayamsevak'),
            ]);
        }

        return back()->with('success', $successMsg);
    }

    /**
     * Fetch swayamsevaks for a given shakha or the authenticated user's unit.
     */
    public function getSwayamsevaks(Request $request): JsonResponse
    {
        $shakhaId = $request->query('shakha_id');

        if (!$shakhaId && $user = $request->user()) {
            $loc = $user->deliveryLocations()->where('is_default', true)->first()
                ?: $user->deliveryLocations()->latest()->first();
            $shakhaId = $loc?->shakha_id ?: $user->profile?->shakha_id;
        }

        if (!$shakhaId) {
            return response()->json([]);
        }

        $swayamsevaks = Swayamsevak::where('shakha_id', $shakhaId)
            ->select('id', 'name', 'mobile', 'shakha_id', 'ganvesh')
            ->orderBy('name')
            ->get();

        return response()->json($swayamsevaks);
    }
}
