import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Search,
    ShoppingCart,
    Filter,
    Tag,
    Store,
    CheckCircle,
    ArrowRight,
    MapPin,
    Compass,
    RotateCcw,
    X,
} from 'lucide-react';
import { useTranslation } from '@/i18n/translations';

export default function Index({ products, categories, filters, orgUnits, userUnit }) {
    const { locale, cartCount } = usePage().props;
    const { t } = useTranslation(locale || 'hi');

    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category_id || '');
    const [unitType, setUnitType] = useState(filters.org_unit_type || '');
    const [unitId, setUnitId] = useState(filters.org_unit_id || '');
    const [unitSearch, setUnitSearch] = useState(filters.org_unit_search || '');
    const [onlyKaryakarta, setOnlyKaryakarta] = useState(Boolean(filters.only_karyakarta));

    const applyFilters = (overrides = {}) => {
        const query = {
            search: searchTerm,
            category_id: selectedCategory,
            org_unit_type: unitType,
            org_unit_id: unitId,
            org_unit_search: unitSearch,
            only_karyakarta: onlyKaryakarta ? '1' : '',
            ...overrides,
        };

        Object.keys(query).forEach((key) => {
            if (query[key] === '' || query[key] === false || query[key] === null || query[key] === undefined) {
                delete query[key];
            }
        });

        router.get(route('products.index'), query, { preserveState: true });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        applyFilters({ search: searchTerm });
    };

    const handleCategoryClick = (catId) => {
        const newCat = String(selectedCategory) === String(catId) ? '' : catId;
        setSelectedCategory(newCat);
        applyFilters({ category_id: newCat });
    };

    const handleUnitTypeChange = (e) => {
        const newType = e.target.value;
        setUnitType(newType);
        setUnitId('');
        applyFilters({ org_unit_type: newType, org_unit_id: '' });
    };

    const handleUnitSelect = (e) => {
        const newId = e.target.value;
        setUnitId(newId);
        applyFilters({ org_unit_id: newId });
    };

    const handleUnitSearchSubmit = (e) => {
        if (e) e.preventDefault();
        applyFilters({ org_unit_search: unitSearch });
    };

    const handleKaryakartaToggle = (e) => {
        const checked = e.target.checked;
        setOnlyKaryakarta(checked);
        applyFilters({ only_karyakarta: checked ? '1' : '' });
    };

    const handleMyUnitClick = () => {
        if (!userUnit) return;
        setUnitType(userUnit.type);
        setUnitId(userUnit.id);
        setUnitSearch('');
        applyFilters({
            org_unit_type: userUnit.type,
            org_unit_id: userUnit.id,
            org_unit_search: '',
        });
    };

    const handleClearAll = () => {
        setSearchTerm('');
        setSelectedCategory('');
        setUnitType('');
        setUnitId('');
        setUnitSearch('');
        setOnlyKaryakarta(false);
        router.get(route('products.index'), {}, { preserveState: true });
    };

    const addToCart = (productId) => {
        router.post(route('cart.add', productId), { quantity: 1 }, { preserveScroll: true });
    };

    const hasActiveFilters = Boolean(
        searchTerm || selectedCategory || unitType || unitId || unitSearch || onlyKaryakarta
    );

    // Get selected unit display name
    let selectedUnitLabel = '';
    if (unitType === 'nagar' && unitId) {
        const n = orgUnits?.nagars?.find((item) => String(item.id) === String(unitId));
        if (n) selectedUnitLabel = `${n.nagar_name} Nagar`;
    } else if (unitType === 'jila' && unitId) {
        const j = orgUnits?.jilas?.find((item) => String(item.id) === String(unitId));
        if (j) selectedUnitLabel = `${j.jila_name} Jila`;
    } else if (unitType === 'shakha' && unitId) {
        const s = orgUnits?.shakhas?.find((item) => String(item.id) === String(unitId));
        if (s) selectedUnitLabel = s.shakha_name;
    }

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

            {/* Advanced Organizational Unit Filter Box */}
            <div className="bg-white rounded-3xl p-6 mb-8 border border-amber-200/80 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xs flex-shrink-0">
                            <Compass className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-gray-900 text-base flex items-center">
                                {t('filter_by_org_unit')}
                                <span className="ml-2 text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                    Advanced Search
                                </span>
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Filter products by Shakha, Nagar, or Jila to buy from nearest Karyakarta dealers.
                            </p>
                        </div>
                    </div>

                    {/* Quick Button for User's Registered Delivery Unit */}
                    {userUnit && (
                        <button
                            type="button"
                            onClick={handleMyUnitClick}
                            className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border shadow-2xs ${
                                unitType === userUnit.type && String(unitId) === String(userUnit.id)
                                    ? 'bg-amber-600 text-white border-amber-700'
                                    : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                            }`}
                        >
                            <MapPin className="w-4 h-4 text-amber-500" />
                            <span>{t('my_nearest_unit')}: <span className="underline">{userUnit.label}</span></span>
                        </button>
                    )}
                </div>

                {/* Filter Controls Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    {/* Unit Type Selector */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">{t('unit_type')}</label>
                        <select
                            value={unitType}
                            onChange={handleUnitTypeChange}
                            className="w-full bg-gray-50 hover:bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition cursor-pointer"
                        >
                            <option value="">{t('all_units')}</option>
                            <option value="nagar">{t('nagar')}</option>
                            <option value="jila">{t('jila')}</option>
                            <option value="shakha">{t('shakha')}</option>
                        </select>
                    </div>

                    {/* Specific Unit Dropdown */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">{t('select_unit')}</label>
                        <select
                            value={unitId}
                            onChange={handleUnitSelect}
                            disabled={!unitType}
                            className="w-full bg-gray-50 hover:bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 transition cursor-pointer"
                        >
                            <option value="">
                                {unitType ? `-- All ${unitType.toUpperCase()} Units --` : `-- Select Unit Type First --`}
                            </option>
                            {unitType === 'nagar' && orgUnits?.nagars?.map((n) => (
                                <option key={n.id} value={n.id}>
                                    {n.nagar_name} Nagar {n.jila?.jila_name ? `(${n.jila.jila_name} Jila)` : ''}
                                </option>
                            ))}
                            {unitType === 'jila' && orgUnits?.jilas?.map((j) => (
                                <option key={j.id} value={j.id}>
                                    {j.jila_name} Jila
                                </option>
                            ))}
                            {unitType === 'shakha' && orgUnits?.shakhas?.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.shakha_name} {s.nagar?.nagar_name ? `(${s.nagar.nagar_name})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Unit Keyword Search */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">{t('unit_search_placeholder')}</label>
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={unitSearch}
                                onChange={(e) => setUnitSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleUnitSearchSubmit(e)}
                                placeholder="e.g. Madhav Nagar, Badrinath"
                                className="w-full bg-gray-50 hover:bg-white border border-gray-300 rounded-xl pl-3 pr-9 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                            />
                            <button
                                type="button"
                                onClick={handleUnitSearchSubmit}
                                className="absolute right-2.5 p-1 text-amber-600 hover:text-amber-800 cursor-pointer"
                                title="Apply Unit Search"
                            >
                                <Search className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Karyakarta Toggle & Clear Filters */}
                    <div className="flex flex-col justify-end space-y-2">
                        <label className="flex items-center space-x-2 text-xs font-bold text-gray-700 cursor-pointer select-none bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/50 hover:bg-amber-50">
                            <input
                                type="checkbox"
                                checked={onlyKaryakarta}
                                onChange={handleKaryakartaToggle}
                                className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                            />
                            <span className="text-gray-900">⭐ {t('karyakarta_dealers_only')}</span>
                        </label>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="inline-flex items-center justify-center space-x-1.5 text-xs font-bold text-red-600 hover:text-red-700 py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 transition cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>{t('clear_all_filters')}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Active Filter Pills Bar */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap items-center gap-2 pt-4 mt-4 border-t border-gray-100 text-xs">
                        <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                            {t('active_filters')}:
                        </span>

                        {searchTerm && (
                            <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-900 px-3 py-1 rounded-full font-bold">
                                <span>Keyword: "{searchTerm}"</span>
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        applyFilters({ search: '' });
                                    }}
                                    className="hover:text-red-600 cursor-pointer"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}

                        {selectedCategory && (
                            <span className="inline-flex items-center space-x-1 bg-orange-100 text-orange-900 px-3 py-1 rounded-full font-bold">
                                <span>
                                    Category: {categories.find((c) => String(c.id) === String(selectedCategory))?.name || selectedCategory}
                                </span>
                                <button
                                    onClick={() => {
                                        setSelectedCategory('');
                                        applyFilters({ category_id: '' });
                                    }}
                                    className="hover:text-red-600 cursor-pointer"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}

                        {selectedUnitLabel && (
                            <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-900 px-3 py-1 rounded-full font-bold">
                                <span>📍 {selectedUnitLabel}</span>
                                <button
                                    onClick={() => {
                                        setUnitId('');
                                        applyFilters({ org_unit_id: '' });
                                    }}
                                    className="hover:text-red-600 cursor-pointer"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}

                        {unitType && !selectedUnitLabel && (
                            <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-900 px-3 py-1 rounded-full font-bold">
                                <span>Type: {unitType.toUpperCase()}</span>
                                <button
                                    onClick={() => {
                                        setUnitType('');
                                        setUnitId('');
                                        applyFilters({ org_unit_type: '', org_unit_id: '' });
                                    }}
                                    className="hover:text-red-600 cursor-pointer"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}

                        {unitSearch && (
                            <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-900 px-3 py-1 rounded-full font-bold">
                                <span>Unit: "{unitSearch}"</span>
                                <button
                                    onClick={() => {
                                        setUnitSearch('');
                                        applyFilters({ org_unit_search: '' });
                                    }}
                                    className="hover:text-red-600 cursor-pointer"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}

                        {onlyKaryakarta && (
                            <span className="inline-flex items-center space-x-1 bg-amber-600 text-white px-3 py-1 rounded-full font-bold">
                                <span>⭐ Karyakarta Only</span>
                                <button
                                    onClick={() => {
                                        setOnlyKaryakarta(false);
                                        applyFilters({ only_karyakarta: '' });
                                    }}
                                    className="hover:text-amber-200 cursor-pointer"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                    </div>
                )}
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
                <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-sm">
                    <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-gray-800">{t('no_products_found')}</h3>
                    <p className="text-gray-500 text-sm mt-1">{t('no_products_sub')}</p>
                    {hasActiveFilters && (
                        <button
                            onClick={handleClearAll}
                            className="mt-4 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                            {t('clear_all_filters')}
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.data.map((product) => (
                        <div
                            key={product.id}
                            className="bg-white rounded-3xl border border-amber-100/80 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col group"
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
                                    <div className="flex items-center justify-between text-xs text-gray-400 font-mono mb-1">
                                        <span>{t('sku')}: {product.sku}</span>
                                        {product.stock <= 5 && product.stock > 0 && (
                                            <span className="text-amber-600 font-bold font-sans text-[11px]">Only {product.stock} left</span>
                                        )}
                                    </div>

                                    <Link href={route('products.show', product.id)}>
                                        <h3 className="font-bold text-gray-900 group-hover:text-amber-600 transition line-clamp-1 text-base">
                                            {product.name}
                                        </h3>
                                    </Link>
                                    <p className="text-xs text-gray-500 line-clamp-2 mt-1 mb-3">
                                        {product.description || 'High quality product supplied by verified dealer.'}
                                    </p>

                                    {/* Dealer & Organizational Unit Info Badge */}
                                    <div className="bg-amber-50/60 rounded-2xl p-2.5 mb-3 border border-amber-200/60 space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center space-x-1.5 font-bold text-gray-900 truncate">
                                                <Store className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                                                <span className="truncate">{product.dealer?.name || 'Verified Dealer'}</span>
                                            </div>
                                            {product.dealer_unit_info?.is_karyakarta && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-600 text-white flex-shrink-0">
                                                    ⭐ Karyakarta
                                                </span>
                                            )}
                                        </div>

                                        {/* Toli or Location Tag */}
                                        {product.dealer_unit_info?.toli_badge ? (
                                            <div className="text-[11px] font-bold text-amber-900 flex items-center space-x-1">
                                                <span className="text-amber-700">🏛️</span>
                                                <span className="truncate">{product.dealer_unit_info.toli_badge}</span>
                                            </div>
                                        ) : product.dealer_unit_info?.unit_name ? (
                                            <div className="text-[11px] font-semibold text-gray-700 flex items-center space-x-1">
                                                <MapPin className="w-3 h-3 text-amber-600 flex-shrink-0" />
                                                <span className="truncate">{product.dealer_unit_info.unit_name}</span>
                                            </div>
                                        ) : null}
                                    </div>
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

