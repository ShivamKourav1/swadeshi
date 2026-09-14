import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Search, ShoppingCart, Filter, Tag, Store, CheckCircle, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/i18n/translations';

export default function Index({ products, categories, filters }) {
    const { locale, cartCount } = usePage().props;
    const { t } = useTranslation(locale || 'hi');

    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category_id || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('products.index'), {
            search: searchTerm,
            category_id: selectedCategory,
        }, { preserveState: true });
    };

    const handleCategoryClick = (catId) => {
        const newCat = selectedCategory === catId ? '' : catId;
        setSelectedCategory(newCat);
        router.get(route('products.index'), {
            search: searchTerm,
            category_id: newCat,
        }, { preserveState: true });
    };

    const addToCart = (productId) => {
        router.post(route('cart.add', productId), { quantity: 1 }, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title={t('hero_title')} />

            {/* Saffron Hero / Search Header */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-8 mb-8 text-white shadow-xl">
                <div className="max-w-3xl">
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
                        {t('hero_title')}
                    </h1>
                    <p className="text-amber-100 text-sm sm:text-base mb-6">
                        {t('hero_subtitle')}
                    </p>

                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={t('search_placeholder')}
                                className="w-full pl-11 pr-4 py-3 bg-white text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-inner text-sm font-medium"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-amber-950 hover:bg-black text-white px-6 py-3 rounded-xl font-bold text-sm transition shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
                        >
                            <Search className="w-4 h-4" />
                            <span>{t('search_btn')}</span>
                        </button>

                        <Link
                            href={route('cart.index')}
                            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-5 py-3 rounded-xl font-bold text-sm transition shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            <span>{t('go_to_cart')}</span>
                            {cartCount > 0 && (
                                <span className="bg-white text-amber-950 text-xs px-2 py-0.5 rounded-full font-black ml-1">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    </form>
                </div>
            </div>

            {/* Category Showcase Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {categories.map((cat) => {
                    const isSelected = String(selectedCategory) === String(cat.id);
                    return (
                        <div
                            key={cat.id}
                            onClick={() => handleCategoryClick(isSelected ? '' : cat.id)}
                            className={`relative overflow-hidden rounded-3xl p-4 sm:p-5 border transition-all duration-300 cursor-pointer flex items-center space-x-4 ${
                                isSelected
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20 border-transparent scale-[1.02]'
                                    : 'bg-white hover:bg-orange-50/50 text-gray-900 border-amber-100 hover:border-amber-300 shadow-sm'
                            }`}
                        >
                            <div className={`w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border-2 shadow-xs ${
                                isSelected ? 'border-white/70' : 'border-amber-200'
                            }`}>
                                <img
                                    src={cat.image_url}
                                    alt={cat.name}
                                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-extrabold text-base leading-tight truncate">
                                    {cat.name}
                                </h3>
                                <p className={`text-xs mt-1 line-clamp-1 ${isSelected ? 'text-amber-100' : 'text-gray-500'}`}>
                                    {cat.description}
                                </p>
                                <div className="mt-2 flex items-center text-[11px] font-bold">
                                    <span className={isSelected ? 'text-white' : 'text-amber-600'}>
                                        {isSelected ? '✓ Filter Applied' : 'Browse Products →'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Category Filter Quick Chips */}
            <div className="mb-8">
                <div className="flex items-center space-x-2 mb-3">
                    <Filter className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Quick Filter</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => handleCategoryClick('')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
                            selectedCategory === ''
                                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                                : 'bg-white text-gray-700 hover:bg-amber-50 border border-gray-200'
                        }`}
                    >
                        {t('all_categories')}
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryClick(cat.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer flex items-center space-x-2 ${
                                String(selectedCategory) === String(cat.id)
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                                    : 'bg-white text-gray-700 hover:bg-amber-50 border border-gray-200'
                            }`}
                        >
                            {cat.image_url && (
                                <img
                                    src={cat.image_url}
                                    alt={cat.name}
                                    className="w-5 h-5 rounded-full object-cover border border-amber-200"
                                />
                            )}
                            <span>{cat.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Grid */}
            {products.data.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
                    <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-gray-800">{t('no_products_found')}</h3>
                    <p className="text-gray-500 text-sm mt-1">{t('no_products_sub')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.data.map((product) => (
                        <div
                            key={product.id}
                            className="bg-white rounded-2xl border border-amber-100/80 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col group"
                        >
                            {/* Product Image */}
                            <div className="relative h-48 bg-gray-100 overflow-hidden">
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                                        <Store className="w-12 h-12 text-amber-300" />
                                    </div>
                                )}
                                {product.category && (
                                    <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-amber-800 text-xs font-bold px-2.5 py-1 rounded-lg shadow-xs border border-amber-100">
                                        {product.category.name}
                                    </span>
                                )}
                            </div>

                            {/* Product Details */}
                            <div className="p-5 flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="text-xs text-gray-400 font-mono mb-1">{t('sku')}: {product.sku}</div>
                                    <Link href={route('products.show', product.id)}>
                                        <h3 className="font-bold text-gray-900 group-hover:text-amber-600 transition line-clamp-1">
                                            {product.name}
                                        </h3>
                                    </Link>
                                    <p className="text-xs text-gray-500 line-clamp-2 mt-1 mb-3">
                                        {product.description || 'High quality product supplied by verified dealer.'}
                                    </p>
                                </div>

                                <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-auto">
                                    <div>
                                        <div className="text-xl font-black text-gray-900">₹{product.price}</div>
                                        <div className="text-xs text-emerald-600 font-medium flex items-center mt-0.5">
                                            <CheckCircle className="w-3 h-3 mr-1" /> {t('stock')}: {product.stock}
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-1.5">
                                        <button
                                            onClick={() => addToCart(product.id)}
                                            disabled={product.stock <= 0}
                                            className={`p-2.5 rounded-xl transition flex items-center justify-center cursor-pointer ${
                                                product.stock > 0
                                                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-sm'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                            title={product.stock > 0 ? t('add_to_cart') : t('out_of_stock')}
                                        >
                                            <ShoppingCart className="w-4 h-4" />
                                        </button>

                                        <Link
                                            href={route('cart.index')}
                                            className="p-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 transition flex items-center justify-center cursor-pointer shadow-xs"
                                            title={t('go_to_cart')}
                                        >
                                            <ArrowRight className="w-4 h-4 text-amber-600" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AuthenticatedLayout>
    );
}
