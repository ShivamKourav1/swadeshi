import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ClipboardList,
    Package,
    AlertCircle,
    Search,
    ChevronDown,
    ChevronUp,
    PlusCircle,
    CheckCircle2,
    Calendar,
    User,
    Users,
    Phone,
    FileText,
    ArrowRight,
    RefreshCw,
    X,
} from 'lucide-react';

export default function Demands({ products, categories, summary, filters }) {
    const { auth } = usePage().props;
    const isKaryakartaDealer = Boolean(auth?.user?.is_karyakarta_dealer);

    const [search, setSearch] = useState(filters.search || '');
    const [categoryId, setCategoryId] = useState(filters.category_id || '');
    const [expandedProducts, setExpandedProducts] = useState({});
    
    // Quick restock modal state
    const [restockProduct, setRestockProduct] = useState(null);
    const [restockQty, setRestockQty] = useState(1);
    const [isRestocking, setIsRestocking] = useState(false);

    const toggleExpand = (id) => {
        setExpandedProducts((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(
            route('dealer.demands.index'),
            {
                search: search || undefined,
                category_id: categoryId || undefined,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const handleClearFilters = () => {
        setSearch('');
        setCategoryId('');
        router.get(route('dealer.demands.index'));
    };

    const handleQuickRestockSubmit = (e) => {
        e.preventDefault();
        if (!restockProduct || restockQty < 1) return;

        setIsRestocking(true);
        router.post(
            route('dealer.demands.quick_restock', restockProduct.id),
            {
                added_stock: restockQty,
            },
            {
                onSuccess: () => {
                    setRestockProduct(null);
                    setRestockQty(1);
                    setIsRestocking(false);
                },
                onError: () => {
                    setIsRestocking(false);
                },
            }
        );
    };

    return (
        <AuthenticatedLayout title={isKaryakartaDealer ? "उत्पाद मांग (Product Demands) - वस्तु भंडार प्रमुख" : "उत्पाद मांग (Product Demands) - डीलर"}>
            <Head title={isKaryakartaDealer ? "उत्पाद मांग (Product Demands) - वस्तु भंडार प्रमुख" : "उत्पाद मांग (Product Demands) - डीलर डैशबोर्ड"} />

            <div className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-3">
                            <ClipboardList className="w-4 h-4" />
                            <span>मांग पूर्वानुमान एवं स्टॉक योजना</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                            शून्य स्टॉक उत्पाद मांग प्रबंधन (Zero-Stock Demands)
                        </h1>
                        <p className="mt-2 text-amber-100 text-sm sm:text-base max-w-2xl leading-relaxed">
                            जब किसी उत्पाद का स्टॉक 0 हो जाता है, तो ग्राहक और टोली सदस्य अपनी अग्रिम मांग दर्ज कर सकते हैं।
                            यहाँ से आप मांग का अनुमान लगाकर आवश्यकतानुसार स्टॉक जोड़ सकते हैं। स्टॉक जोड़ते ही मांग के आंकड़े स्वतः कम हो जाएंगे।
                        </p>
                    </div>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-xs flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                            <Package className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
                                शून्य स्टॉक उत्पाद
                            </div>
                            <div className="text-2xl font-black text-rose-600">
                                {summary.zero_stock_products_count}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-xs flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                            <ClipboardList className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
                                कुल लंबित मांग (इकाइयां)
                            </div>
                            <div className="text-2xl font-black text-amber-700">
                                {summary.total_pending_demand_units}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-xs flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
                                कुल मांग प्रविष्टियां
                            </div>
                            <div className="text-2xl font-black text-stone-900">
                                {summary.total_demand_requests}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Controls */}
                <form
                    onSubmit={handleFilter}
                    className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between"
                >
                    <div className="flex-1 w-full flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="उत्पाद का नाम या कोड (SKU) से खोजें..."
                                className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white"
                            />
                        </div>

                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="w-full sm:w-48 py-2 px-3 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white"
                        >
                            <option value="">सभी श्रेणियां</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center space-x-2 w-full md:w-auto">
                        <button
                            type="submit"
                            className="flex-1 md:flex-none px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition cursor-pointer"
                        >
                            फ़िल्टर लागू करें
                        </button>
                        {(filters.search || filters.category_id) && (
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer"
                            >
                                रीसेट
                            </button>
                        )}
                    </div>
                </form>

                {/* Zero Stock Products with Demands */}
                {products.data.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-stone-200">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-stone-800">
                            कोई शून्य-स्टॉक मांग लंबित नहीं है
                        </h3>
                        <p className="text-stone-500 text-sm mt-1 max-w-md mx-auto">
                            वर्तमान में आपके किसी भी 0-स्टॉक उत्पाद पर मांग दर्ज नहीं है, अथवा सभी उत्पादों में पर्याप्त स्टॉक उपलब्ध है।
                        </p>
                        <div className="mt-6">
                            <Link
                                href={route('dealer.products.index')}
                                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
                            >
                                <span>इन्वेंटरी देखें</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {products.data.map((product) => {
                            const isExpanded = expandedProducts[product.id] ?? true;
                            const hasActiveDemands = product.active_demand_units > 0;

                            return (
                                <div
                                    key={product.id}
                                    className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden transition hover:border-amber-300"
                                >
                                    {/* Product Summary Header Card */}
                                    <div className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-stone-50/50 to-white">
                                        <div className="flex items-center space-x-4">
                                            {/* Product Image */}
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-stone-100 rounded-xl border border-stone-200 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = '/images/products/shirt.svg';
                                                    }}
                                                />
                                            </div>

                                            {/* Name & SKU */}
                                            <div>
                                                <div className="flex items-center space-x-2 flex-wrap">
                                                    <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-snug">
                                                        {product.name}
                                                    </h3>
                                                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                        स्टॉक: 0 (आउट ऑफ स्टॉक)
                                                    </span>
                                                </div>

                                                <div className="flex items-center space-x-3 text-xs text-stone-500 mt-1">
                                                    {product.sku && <span>कोड: {product.sku}</span>}
                                                    {product.category && <span>श्रेणी: {product.category.name}</span>}
                                                    <span className="font-bold text-amber-800">मूल्य: ₹{product.price}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Demand Badge & Actions */}
                                        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-stone-100">
                                            <div className="text-right">
                                                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-extrabold text-sm sm:text-base">
                                                    <ClipboardList className="w-4 h-4 text-amber-700" />
                                                    <span>कुल मांग: {product.active_demand_units} इकाइयां</span>
                                                </div>
                                                <div className="text-[11px] text-stone-500 mt-0.5">
                                                    {product.pending_demands_count} सक्रिय अनुरोध
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setRestockProduct(product);
                                                        setRestockQty(Math.max(1, product.active_demand_units));
                                                    }}
                                                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center space-x-1 cursor-pointer"
                                                    title="स्टॉक जोड़ें और मांग घटाएं"
                                                >
                                                    <PlusCircle className="w-3.5 h-3.5" />
                                                    <span>स्टॉक जोड़ें</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => toggleExpand(product.id)}
                                                    className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 transition cursor-pointer"
                                                    aria-label="Toggle Demands Details"
                                                >
                                                    {isExpanded ? (
                                                        <ChevronUp className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expandable Demand Requests List */}
                                    {isExpanded && (
                                        <div className="border-t border-stone-100 bg-stone-50/40 p-4 sm:p-5">
                                            {product.demands.length === 0 ? (
                                                <p className="text-xs text-stone-400 italic">
                                                    इस उत्पाद के लिए कोई व्यक्तिगत मांग अनुरोध दर्ज नहीं है।
                                                </p>
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left text-xs">
                                                        <thead>
                                                            <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                                                                <th className="pb-2.5">दिनांक / समय</th>
                                                                <th className="pb-2.5">मांगकर्ता (ग्राहक)</th>
                                                                <th className="pb-2.5">अभिप्रेत स्वयंसेवक / सदस्य</th>
                                                                <th className="pb-2.5 text-center">मांग संख्या</th>
                                                                <th className="pb-2.5">स्थिति</th>
                                                                <th className="pb-2.5">टिप्पणी / विवरण</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-stone-100">
                                                            {product.demands.map((demand) => (
                                                                <tr key={demand.id} className="hover:bg-amber-50/40 transition">
                                                                    <td className="py-2.5 text-stone-600 whitespace-nowrap">
                                                                        <div className="font-semibold text-stone-900">
                                                                            {demand.created_at_human}
                                                                        </div>
                                                                        <div className="text-[10px] text-stone-400">
                                                                            {new Date(demand.created_at).toLocaleDateString('hi-IN', {
                                                                                day: 'numeric',
                                                                                month: 'short',
                                                                                year: 'numeric',
                                                                                hour: '2-digit',
                                                                                minute: '2-digit',
                                                                            })}
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2.5">
                                                                        <div className="font-bold text-stone-900 flex items-center space-x-1">
                                                                            <User className="w-3 h-3 text-stone-400" />
                                                                            <span>{demand.customer.name}</span>
                                                                        </div>
                                                                        {demand.customer.mobile && (
                                                                            <div className="text-[10px] text-stone-500 flex items-center space-x-1 mt-0.5">
                                                                                <Phone className="w-2.5 h-2.5 text-stone-400" />
                                                                                <span>{demand.customer.mobile}</span>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-2.5">
                                                                        {demand.swayamsevak ? (
                                                                            <div>
                                                                                <span className="font-semibold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-md inline-block">
                                                                                    {demand.swayamsevak.name}
                                                                                </span>
                                                                                {demand.swayamsevak.shakha_name && (
                                                                                    <div className="text-[10px] text-stone-500 mt-0.5">
                                                                                        शाखा: {demand.swayamsevak.shakha_name}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-stone-400">— सामान्य —</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-2.5 text-center whitespace-nowrap">
                                                                        <span className="inline-block px-2.5 py-1 rounded-lg bg-orange-100 text-orange-950 font-black text-sm">
                                                                            {demand.quantity}
                                                                        </span>
                                                                        {demand.original_quantity > demand.quantity && (
                                                                            <div className="text-[10px] text-stone-400 mt-0.5">
                                                                                (मूल: {demand.original_quantity})
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-2.5 whitespace-nowrap">
                                                                        {demand.quantity === 0 ? (
                                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                                                ✓ पूर्ण (Fulfilled)
                                                                            </span>
                                                                        ) : demand.quantity < demand.original_quantity ? (
                                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                                                                आंशिक शेष
                                                                            </span>
                                                                        ) : (
                                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                                                लंबित (Pending)
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-2.5 max-w-xs text-stone-600 truncate">
                                                                        {demand.notes ? (
                                                                            <span title={demand.notes}>
                                                                                {demand.notes}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-stone-400">—</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {products.links && products.links.length > 3 && (
                    <div className="flex items-center justify-center space-x-1.5 pt-4">
                        {products.links.map((link, idx) => (
                            <Link
                                key={idx}
                                href={link.url || '#'}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                    link.active
                                        ? 'bg-amber-600 text-white shadow-xs'
                                        : link.url
                                        ? 'bg-white border border-stone-200 text-stone-700 hover:bg-amber-50'
                                        : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Restock Modal */}
            {restockProduct && (
                <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden animate-scale-in">
                        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                            <div className="flex items-center space-x-2">
                                <PlusCircle className="w-5 h-5 text-emerald-600" />
                                <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                                    स्टॉक जोड़ें (Restock)
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRestockProduct(null)}
                                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-200 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleQuickRestockSubmit} className="p-5 space-y-4">
                            {/* Product Info */}
                            <div className="flex items-center space-x-3 bg-amber-50/60 p-3 rounded-xl border border-amber-100">
                                <img
                                    src={restockProduct.image_url}
                                    alt={restockProduct.name}
                                    className="w-12 h-12 object-contain rounded-lg bg-white p-1 border border-stone-200"
                                />
                                <div>
                                    <div className="font-bold text-stone-900 text-sm">
                                        {restockProduct.name}
                                    </div>
                                    <div className="text-xs text-amber-800 font-semibold mt-0.5">
                                        सक्रिय मांग: {restockProduct.active_demand_units} इकाइयां
                                    </div>
                                </div>
                            </div>

                            {/* Added Quantity Stepper */}
                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                                    स्टॉक में जोड़ने हेतु मात्रा (Quantity to Add) *
                                </label>
                                <div className="flex items-center space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setRestockQty(Math.max(1, restockQty - 1))}
                                        className="w-10 h-10 bg-stone-100 hover:bg-stone-200 rounded-lg text-lg font-bold flex items-center justify-center transition"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        value={restockQty}
                                        onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-24 text-center py-2 bg-stone-50 border border-stone-300 rounded-lg text-base font-bold focus:ring-2 focus:ring-amber-500"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setRestockQty(restockQty + 1)}
                                        className="w-10 h-10 bg-stone-100 hover:bg-stone-200 rounded-lg text-lg font-bold flex items-center justify-center transition"
                                    >
                                        +
                                    </button>
                                </div>
                                <p className="text-[11px] text-stone-500 mt-2">
                                    💡 <strong>नोट:</strong> जैसे ही स्टॉक जोड़ा जाएगा, लंबित मांगें FIFO (पहले आओ पहले पाओ) क्रम में {Math.min(restockQty, restockProduct.active_demand_units)} इकाइयों तक स्वतः कम हो जाएंगी।
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setRestockProduct(null)}
                                    className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-stone-50 transition"
                                >
                                    रद्द करें
                                </button>
                                <button
                                    type="submit"
                                    disabled={isRestocking}
                                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
                                >
                                    {isRestocking ? (
                                        <>
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            <span>जोड़ा जा रहा है...</span>
                                        </>
                                    ) : (
                                        <span>स्टॉक जोड़ें</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
