import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ShoppingCart, ArrowLeft, Store, ShieldCheck, Truck, Check } from 'lucide-react';
import { useTranslation } from '@/i18n/translations';

export default function Show({ product }) {
    const { locale } = usePage().props;
    const { t } = useTranslation(locale || 'hi');
    const [quantity, setQuantity] = useState(1);

    const handleAddToCart = () => {
        router.post(route('cart.add', product.id), { quantity }, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title={product.name} />

            <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-amber-600 font-semibold mb-6 transition">
                <ArrowLeft className="w-4 h-4 mr-1 text-amber-600" /> Back to Storefront
            </Link>

            <div className="bg-white rounded-3xl border border-amber-100/80 shadow-sm overflow-hidden p-6 lg:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Product Image Display */}
                    <div className="bg-orange-50/30 rounded-2xl overflow-hidden flex items-center justify-center p-4 border border-amber-100 min-h-[350px]">
                        {product.image_url ? (
                            <img
                                src={product.image_url}
                                alt={product.name}
                                className="max-h-[400px] w-auto object-contain rounded-xl"
                            />
                        ) : (
                            <Store className="w-24 h-24 text-amber-300" />
                        )}
                    </div>

                    {/* Product Information */}
                    <div className="flex flex-col justify-between">
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                {product.category && (
                                    <span className="bg-amber-50 text-amber-800 border border-amber-200/60 text-xs font-bold px-3 py-1 rounded-lg">
                                        {product.category.name}
                                    </span>
                                )}
                                <span className="text-xs text-gray-400 font-mono">SKU: {product.sku}</span>
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">{product.name}</h1>

                            <div className="text-3xl font-black text-amber-600 mb-6">₹{product.price}</div>

                            <p className="text-gray-600 text-sm leading-relaxed mb-6">
                                {product.description || 'No detailed description provided for this product.'}
                            </p>

                            {/* Dealer Information */}
                            {product.dealer && (
                                <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200/70 mb-6 flex items-center justify-between">
                                    <div>
                                        <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Verified Dealer</div>
                                        <div className="font-bold text-gray-900 text-sm">{product.dealer.name}</div>
                                        <div className="text-xs text-gray-500">{product.dealer.email}</div>
                                    </div>
                                    <ShieldCheck className="w-8 h-8 text-amber-600" />
                                </div>
                            )}

                            {/* Cash on Delivery Notice */}
                            <div className="flex items-center space-x-3 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl mb-6">
                                <Truck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                <span>Eligible for Cash on Delivery (COD) with real-time delivery partner tracking!</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-4">
                            <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="px-3.5 py-2 text-gray-600 hover:bg-amber-50 hover:text-amber-700 font-bold transition cursor-pointer"
                                >
                                    -
                                </button>
                                <span className="px-4 py-2 text-sm font-extrabold text-gray-900">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                    className="px-3.5 py-2 text-gray-600 hover:bg-amber-50 hover:text-amber-700 font-bold transition cursor-pointer"
                                >
                                    +
                                </button>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                disabled={product.stock <= 0}
                                className={`flex-1 w-full sm:w-auto py-3.5 px-6 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center space-x-2 cursor-pointer ${
                                    product.stock > 0
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-500/20'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <ShoppingCart className="w-5 h-5" />
                                <span>{product.stock > 0 ? t('add_to_cart') : t('out_of_stock')}</span>
                            </button>

                            <Link
                                href={route('cart.index')}
                                className="w-full sm:w-auto py-3.5 px-6 rounded-xl font-bold text-sm transition border-2 border-amber-500 hover:border-amber-600 bg-amber-50 hover:bg-amber-100 text-amber-950 flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
                            >
                                <ShoppingCart className="w-5 h-5 text-amber-600" />
                                <span>{t('go_to_cart')}</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
