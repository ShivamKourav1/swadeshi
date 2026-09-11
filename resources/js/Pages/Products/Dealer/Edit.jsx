import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft, Save, Edit3 } from 'lucide-react';

export default function Edit({ product, categories }) {
    const { data, setData, put, processing, errors } = useForm({
        name: product.name,
        sku: product.sku,
        category_id: product.category_id || '',
        price: product.price,
        stock: product.stock,
        description: product.description || '',
        image_url: product.image_url || '',
        status: product.status,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('dealer.products.update', product.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Edit - ${product.name}`} />

            <div className="max-w-3xl mx-auto space-y-6">
                <Link href={route('dealer.products.index')} className="inline-flex items-center text-sm text-gray-500 hover:text-amber-600 font-bold transition">
                    <ArrowLeft className="w-4 h-4 mr-1 text-amber-600" /> Back to Dealer Inventory
                </Link>

                <div className="bg-white rounded-3xl border border-amber-100 p-6 sm:p-8 shadow-sm">
                    <h1 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center space-x-2.5">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-2xl">
                            <Edit3 className="w-6 h-6" />
                        </div>
                        <span>Edit Product #{product.id}</span>
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-5 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block font-bold text-gray-700 uppercase mb-1">Product Title *</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                                />
                                {errors.name && <div className="text-rose-600 text-xs mt-1">{errors.name}</div>}
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 uppercase mb-1">SKU Number *</label>
                                <input
                                    type="text"
                                    value={data.sku}
                                    onChange={(e) => setData('sku', e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-amber-500"
                                />
                                {errors.sku && <div className="text-rose-600 text-xs mt-1">{errors.sku}</div>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block font-bold text-gray-700 uppercase">Category *</label>
                                    <Link href={route('dealer.categories.index')} className="text-[11px] text-amber-600 hover:text-amber-800 font-bold hover:underline">
                                        + Manage
                                    </Link>
                                </div>
                                <select
                                    value={data.category_id}
                                    onChange={(e) => setData('category_id', e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 bg-white"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 uppercase mb-1">Price (₹) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.price}
                                    onChange={(e) => setData('price', e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 font-bold"
                                />
                                {errors.price && <div className="text-rose-600 text-xs mt-1">{errors.price}</div>}
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 uppercase mb-1">Stock Quantity *</label>
                                <input
                                    type="number"
                                    value={data.stock}
                                    onChange={(e) => setData('stock', e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 font-bold"
                                />
                                {errors.stock && <div className="text-rose-600 text-xs mt-1">{errors.stock}</div>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block font-bold text-gray-700 uppercase mb-1">Image URL</label>
                                <input
                                    type="url"
                                    value={data.image_url}
                                    onChange={(e) => setData('image_url', e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 uppercase mb-1">Status</label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl text-sm font-semibold bg-white focus:ring-2 focus:ring-amber-500"
                                >
                                    <option value="active">Active (Visible)</option>
                                    <option value="inactive">Inactive (Hidden)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block font-bold text-gray-700 uppercase mb-1">Product Description</label>
                            <textarea
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={4}
                                className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-sm px-6 py-3.5 rounded-2xl transition flex items-center space-x-2 shadow-md shadow-amber-500/20 cursor-pointer"
                            >
                                <Save className="w-4 h-4" />
                                <span>{processing ? 'Updating...' : 'Update Product'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
