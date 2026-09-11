<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function index(Request $request): Response
    {
        $cart = $request->session()->get('cart', []);
        $total = 0;

        foreach ($cart as $item) {
            $total += $item['price'] * $item['quantity'];
        }

        return Inertia::render('Cart/Index', [
            'cart' => array_values($cart),
            'total' => round($total, 2),
        ]);
    }

    public function add(Request $request, Product $product): RedirectResponse
    {
        $request->validate([
            'quantity' => ['nullable', 'integer', 'min:1'],
        ]);

        $quantity = $request->input('quantity', 1);

        if ($product->stock < $quantity) {
            return back()->with('error', 'Requested quantity exceeds available stock.');
        }

        $cart = $request->session()->get('cart', []);

        if (isset($cart[$product->id])) {
            $newQty = $cart[$product->id]['quantity'] + $quantity;
            if ($product->stock < $newQty) {
                return back()->with('error', 'Requested quantity exceeds available stock.');
            }
            $cart[$product->id]['quantity'] = $newQty;
        } else {
            $cart[$product->id] = [
                'id' => $product->id,
                'dealer_id' => $product->dealer_id,
                'name' => $product->name,
                'price' => (float) $product->price,
                'image_url' => $product->image_url,
                'quantity' => $quantity,
                'stock' => $product->stock,
            ];
        }

        $request->session()->put('cart', $cart);

        return back()->with('success', "{$product->name} added to cart!");
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $quantity = $request->input('quantity');

        if ($product->stock < $quantity) {
            return back()->with('error', 'Quantity exceeds available stock.');
        }

        $cart = $request->session()->get('cart', []);

        if (isset($cart[$product->id])) {
            $cart[$product->id]['quantity'] = $quantity;
            $request->session()->put('cart', $cart);
        }

        return back()->with('success', 'Cart updated!');
    }

    public function remove(Request $request, Product $product): RedirectResponse
    {
        $cart = $request->session()->get('cart', []);

        if (isset($cart[$product->id])) {
            unset($cart[$product->id]);
            $request->session()->put('cart', $cart);
        }

        return back()->with('success', 'Item removed from cart!');
    }

    public function clear(Request $request): RedirectResponse
    {
        $request->session()->forget('cart');
        return back()->with('success', 'Cart cleared!');
    }
}
