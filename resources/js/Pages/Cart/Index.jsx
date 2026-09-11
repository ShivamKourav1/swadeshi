import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Trash2, ShoppingBag, ArrowRight, Store } from 'lucide-react';

export default function Index({ cart, total }) {
    const updateQuantity = (productId, newQty) => {
        if (newQty < 1) return;
        router.put(route('cart.update', productId), { quantity: newQty }, { preserveScroll: true });
    };

    const removeItem = (productId) => {
        router.delete(route('cart.remove', productId), { preserveScroll: true });
    };

    const clearCart = () => {
        router.delete(route('cart.clear'), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Shopping Cart" />

            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center space-x-2.5">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-2xl">
                        <ShoppingBag className="w-6 h-6" />
                    </div>
                    <span>Your Shopping Cart</span>
                </h1>

                {cart.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-amber-100 shadow-sm">
                        <ShoppingBag className="w-16 h-16 text-amber-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Your cart is currently empty</h3>
                        <p className="text-gray-500 text-sm mb-6">Explore our storefront catalog and add items to your cart.</p>
                        <Link
                            href="/"
                            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold px-6 py-3 rounded-2xl text-sm transition inline-flex items-center space-x-2 shadow-md shadow-amber-500/20"
                        >
                            <span>Browse Storefront</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items List */}
                        <div className="lg:col-span-2 space-y-4">
                            {cart.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white p-4 rounded-2xl border border-amber-100/80 shadow-sm flex items-center justify-between gap-4"
                                >
                                    <div className="w-16 h-16 bg-orange-50/50 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-amber-100">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Store className="w-6 h-6 text-amber-300" />
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</h4>
                                        <div className="text-xs text-gray-500">₹{item.price} each</div>
                                    </div>

                                    {/* Quantity Controls */}
                                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            className="px-2.5 py-1 text-gray-600 hover:bg-amber-50 hover:text-amber-700 font-bold transition cursor-pointer"
                                        >
                                            -
                                        </button>
                                        <span className="px-3 py-1 text-xs font-bold text-gray-900">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            className="px-2.5 py-1 text-gray-600 hover:bg-amber-50 hover:text-amber-700 font-bold transition cursor-pointer"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <div className="text-right">
                                        <div className="font-extrabold text-gray-900 text-sm">
                                            ₹{(item.price * item.quantity).toFixed(2)}
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="text-xs text-rose-600 hover:underline mt-1 inline-flex items-center cursor-pointer"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 mr-0.5" /> Remove
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-between items-center pt-2">
                                <button
                                    onClick={clearCart}
                                    className="text-xs text-gray-500 hover:text-rose-600 font-medium transition cursor-pointer"
                                >
                                    Clear Entire Cart
                                </button>
                                <Link href="/" className="text-xs text-amber-600 hover:text-amber-700 hover:underline font-bold">
                                    + Continue Shopping
                                </Link>
                            </div>
                        </div>

                        {/* Summary & Checkout Button */}
                        <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm h-fit space-y-4">
                            <h3 className="font-bold text-gray-900 text-lg border-b border-gray-100 pb-3">Order Summary</h3>

                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="font-semibold text-gray-900">₹{total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Standard Delivery Fee</span>
                                    <span className="font-semibold text-gray-900">₹10.00</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                                <span className="font-bold text-gray-900 text-base">Total Amount</span>
                                <span className="font-black text-amber-600 text-xl">₹{(total + 10.00).toFixed(2)}</span>
                            </div>

                            <Link
                                href={route('checkout.index')}
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition flex items-center justify-center space-x-2 shadow-md shadow-amber-500/20"
                            >
                                <span>Proceed to Checkout</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
