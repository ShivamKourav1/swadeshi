import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft, Save, Tag } from 'lucide-react';

export default function Create({ categories }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        sku: '',
        category_id: categories[0]?.id || '',
        price: '',
        stock: '',
        description: '',
        image_url: '',
        status: 'active',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('dealer.products.store'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Create Product" />

            <div className="max-w-3xl mx-auto space-y-6">
                <Link href={route('dealer.products.index')} className="inline-flex items-center text-sm text-gray-500 hover:text-amber-600 font-bold transition">
                    <ArrowLeft className="w-4 h-4 mr-1 text-amber-600" /> Back to Dealer Inventory
                </Link>

                <div className="bg-white rounded-3xl border border-amber-100 p-6 sm:p-8 shadow-sm">
                    <h1 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center space-x-2.5">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-2xl">
                            <Tag className="w-6 h-6" />
                        </div>
                        <span>Add New Product</span>
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-5 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block font-bold text-gray-700 uppercase mb-1">Product Title *</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="E.g. Wireless Ergonomic Mouse"
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
                                    placeholder="E.g. WEM-8092"
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
                                    placeholder="499.00"
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
                                    placeholder="50"
                                    className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 font-bold"
                                />
                                {errors.stock && <div className="text-rose-600 text-xs mt-1">{errors.stock}</div>}
                            </div>
                        </div>

                        <div>
                            <label className="block font-bold text-gray-700 uppercase mb-1">Image URL (Optional)</label>
                            <input
                                type="url"
                                value={data.image_url}
                                onChange={(e) => setData('image_url', e.target.value)}
                                placeholder="https://images.unsplash.com/..."
                                className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                            />
                        </div>

                        <div>
                            <label className="block font-bold text-gray-700 uppercase mb-1">Product Description</label>
                            <textarea
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={4}
                                placeholder="Write key features, specifications..."
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
                                <span>{processing ? 'Saving...' : 'Create Product'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
