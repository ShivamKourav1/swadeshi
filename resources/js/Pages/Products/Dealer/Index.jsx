import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Store, Plus, Edit3, Trash2, Tag, AlertCircle, FolderTree, Sparkles, Search } from 'lucide-react';

export default function Index({
    products,
    filters = {},
    can_seed_shakha_products = false,
    standard_products_count = 0,
    standard_products_total = 23
}) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const perPage = filters.per_page || 50;

    const handleDelete = (productId) => {
        if (confirm('Are you sure you want to delete this product?')) {
            router.delete(route('dealer.products.destroy', productId));
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('dealer.products.index'), { search: searchTerm, per_page: perPage }, { preserveState: true });
    };

    const handlePerPageChange = (newPerPage) => {
        router.get(route('dealer.products.index'), { search: searchTerm, per_page: newPerPage }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Dealer Inventory Management" />

            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-amber-100 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center space-x-2.5">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-2xl">
                                <Store className="w-6 h-6" />
                            </div>
                            <span>Dealer Product Inventory</span>
                        </h1>
                        <p className="text-xs text-gray-500 mt-1">
                            Manage your catalog, prices, and stock inventory. Total Products: <strong className="text-amber-700">{products.total || 0}</strong>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                        {can_seed_shakha_products && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm('Generate / synchronize all 23 official Shakha products in your dealer inventory (Shirts, Pants, Belts, Shoes, Cap, etc.)?')) {
                                        router.post(route('dealer.products.seed_shakha'));
                                    }
                                }}
                                className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold px-4 py-3 rounded-2xl text-xs transition shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 cursor-pointer"
                                title="Create or sync all 23 standard Shakha products"
                            >
                                <Sparkles className="w-4 h-4 text-emerald-200" />
                                <span>
                                    {standard_products_count >= standard_products_total
                                        ? `Sync All ${standard_products_total} Shakha Products (${standard_products_count}/${standard_products_total})`
                                        : `Create All 23 Shakha Products (${standard_products_count}/${standard_products_total} in stock)`}
                                </span>
                            </button>
                        )}
                        <Link
                            href={route('dealer.categories.index')}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold px-4 py-3 rounded-2xl text-xs transition flex items-center space-x-1.5 cursor-pointer"
                        >
                            <FolderTree className="w-4 h-4 text-amber-700" />
                            <span>Manage Categories</span>
                        </Link>
                        <Link
                            href={route('dealer.products.create')}
                            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold px-5 py-3 rounded-2xl text-sm transition shadow-md shadow-amber-500/20 flex items-center space-x-2 cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add New Product</span>
                        </Link>
                    </div>
                </div>

                {/* Search Bar & Per Page Filter */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by product name, SKU, or description (case-insensitive)..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-2xl transition cursor-pointer"
                        >
                            Search
                        </button>
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchTerm('');
                                    router.get(route('dealer.products.index'), { per_page: perPage });
                                }}
                                className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-2xl transition cursor-pointer"
                            >
                                Clear
                            </button>
                        )}
                    </form>

                    <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-2xl border border-gray-200 text-xs">
                        <span className="text-gray-500 font-medium">Show:</span>
                        <select
                            value={perPage}
                            onChange={(e) => handlePerPageChange(e.target.value)}
                            className="bg-transparent font-bold text-gray-800 border-none focus:ring-0 p-0 text-xs cursor-pointer"
                        >
                            <option value="15">15 / page</option>
                            <option value="25">25 / page</option>
                            <option value="50">50 / page</option>
                            <option value="100">100 / page</option>
                        </select>
                    </div>
                </div>

                {/* Inventory Table */}
                <div className="bg-white rounded-3xl border border-amber-100 shadow-sm overflow-hidden">
                    {products.data.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <Tag className="w-12 h-12 mx-auto mb-2 text-amber-200" />
                            <div className="text-base font-bold text-gray-700">No products added to inventory</div>
                            <p className="text-xs text-gray-400 mt-1 mb-4">Add products to display them on the public storefront.</p>
                            <Link href={route('dealer.products.create')} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-amber-500/20 inline-block">
                                Create First Product
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                    <tr>
                                        <th className="p-4">Product Details</th>
                                        <th className="p-4">SKU</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4">Price</th>
                                        <th className="p-4">Stock</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-medium">
                                    {products.data.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50/50">
                                            <td className="p-4 flex items-center space-x-3">
                                                <div className="w-12 h-12 bg-orange-50/40 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-amber-100">
                                                    {product.image_url ? (
                                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Store className="w-5 h-5 text-amber-300" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 text-sm line-clamp-1">{product.name}</div>
                                                </div>
                                            </td>
                                            <td className="p-4 font-mono text-gray-500">{product.sku}</td>
                                            <td className="p-4 text-gray-700">{product.category?.name || 'Uncategorized'}</td>
                                            <td className="p-4 font-extrabold text-gray-900">₹{product.price}</td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                                                    product.stock > 10 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {product.stock} units
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase ${
                                                    product.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {product.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                <Link
                                                    href={route('dealer.products.edit', product.id)}
                                                    className="p-2 text-gray-500 hover:text-amber-600 inline-block hover:bg-amber-50 rounded-lg transition"
                                                    title="Edit Product"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="p-2 text-gray-500 hover:text-rose-600 inline-block hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                                    title="Delete Product"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination Links & Statistics Footer */}
                    {products.total > 0 && (
                        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50/50 gap-3">
                            <div className="text-xs text-gray-500 font-medium">
                                Showing <span className="font-bold text-gray-800">{products.from || 0}</span> to <span className="font-bold text-gray-800">{products.to || 0}</span> of <span className="font-bold text-gray-800">{products.total}</span> products
                            </div>
                            {products.links && products.links.length > 3 && (
                                <div className="flex justify-center items-center space-x-1">
                                    {products.links.map((link, i) => (
                                        <Link
                                            key={i}
                                            href={link.url || '#'}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className={`px-3 py-1.5 text-xs rounded-xl font-bold transition ${
                                                link.active
                                                    ? 'bg-amber-600 text-white shadow-xs'
                                                    : link.url
                                                    ? 'text-gray-700 hover:bg-amber-50 hover:text-amber-700 bg-white border border-gray-200'
                                                    : 'text-gray-300 cursor-not-allowed bg-transparent'
                                            }`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
