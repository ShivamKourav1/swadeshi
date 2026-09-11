import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FolderTree, Plus, Edit3, Trash2, Search, Image, CheckCircle, XCircle, Package, ArrowLeft, ExternalLink } from 'lucide-react';

export default function Index({ categories, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const { data, setData, post, put, processing, reset, errors, clearErrors } = useForm({
        name: '',
        slug: '',
        description: '',
        image_url: '',
        is_active: true,
    });

    const presetImages = [
        { label: 'Ganvesh', path: '/images/categories/ganvesh.jpg' },
        { label: 'Books', path: '/images/categories/books.png' },
        { label: 'Ghosh', path: '/images/categories/ghosh.jpg' },
    ];

    const openAddModal = () => {
        setEditingCategory(null);
        clearErrors();
        reset();
        setData({
            name: '',
            slug: '',
            description: '',
            image_url: '',
            is_active: true,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (cat) => {
        setEditingCategory(cat);
        clearErrors();
        setData({
            name: cat.name,
            slug: cat.slug,
            description: cat.description || '',
            image_url: cat.image_url || '',
            is_active: Boolean(cat.is_active),
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        reset();
        clearErrors();
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('dealer.categories.index'), { search: searchTerm }, { preserveState: true });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingCategory) {
            put(route('dealer.categories.update', editingCategory.id), {
                preserveScroll: true,
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('dealer.categories.store'), {
                preserveScroll: true,
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (cat) => {
        if (cat.products_count > 0) {
            alert(`Cannot delete '${cat.name}' because it contains ${cat.products_count} product(s). Please reassign or delete the products first.`);
            return;
        }

        if (confirm(`Are you sure you want to delete the category '${cat.name}'?`)) {
            router.delete(route('dealer.categories.destroy', cat.id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Category Management - Dealer Dashboard" />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header Card */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-amber-100 shadow-sm">
                    <div>
                        <div className="flex items-center space-x-2 text-amber-700 text-xs font-bold uppercase tracking-wider mb-1">
                            <FolderTree className="w-4 h-4" />
                            <span>Dealer Catalog Control</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center space-x-2.5">
                            <span>Category Management (श्रेणी प्रबंधन)</span>
                        </h1>
                        <p className="text-xs text-gray-500 mt-1">
                            Organize your store catalog into categories, assign thumbnail icons/photos, and manage storefront visibility.
                        </p>
                    </div>

                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                        <Link
                            href={route('dealer.products.index')}
                            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-xs transition flex items-center space-x-1 cursor-pointer"
                        >
                            <Package className="w-4 h-4 mr-1 text-gray-500" />
                            <span>View Inventory</span>
                        </Link>
                        <button
                            onClick={openAddModal}
                            className="flex-1 sm:flex-initial bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold px-5 py-3 rounded-2xl text-sm transition shadow-md shadow-amber-500/20 flex items-center justify-center space-x-2 cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Category</span>
                        </button>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="text-sm font-bold text-gray-700">
                            Total Categories: <span className="text-amber-600 font-extrabold">{categories.total ?? categories.data?.length ?? 0}</span>
                        </div>

                        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-72">
                                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by category name or slug..."
                                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                                Search
                            </button>
                        </form>
                    </div>

                    {/* Category List Cards / Table */}
                    {categories.data.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 border-t border-gray-100">
                            <FolderTree className="w-12 h-12 mx-auto mb-2 text-amber-200" />
                            <div className="text-base font-bold text-gray-700">No categories found</div>
                            <p className="text-xs text-gray-400 mt-1 mb-4">Create your first category to start organizing products.</p>
                            <button
                                onClick={openAddModal}
                                className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
                            >
                                Add Category
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto border-t border-gray-100 pt-2">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                    <tr>
                                        <th className="p-4">Thumbnail</th>
                                        <th className="p-4">Category Name</th>
                                        <th className="p-4">Slug Identifier</th>
                                        <th className="p-4">Products Linked</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-medium">
                                    {categories.data.map((cat) => (
                                        <tr key={cat.id} className="hover:bg-amber-50/20 transition">
                                            {/* Thumbnail */}
                                            <td className="p-4">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-orange-50 border border-amber-200 flex items-center justify-center flex-shrink-0 shadow-2xs">
                                                    {cat.image_url ? (
                                                        <img
                                                            src={cat.image_url}
                                                            alt={cat.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Image className="w-5 h-5 text-amber-400" />
                                                    )}
                                                </div>
                                            </td>

                                            {/* Name & Description */}
                                            <td className="p-4">
                                                <div className="font-extrabold text-gray-900 text-sm">{cat.name}</div>
                                                <div className="text-gray-500 text-[11px] line-clamp-1 max-w-sm mt-0.5">
                                                    {cat.description || 'No description provided.'}
                                                </div>
                                            </td>

                                            {/* Slug */}
                                            <td className="p-4 font-mono text-gray-500">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                                                    {cat.slug}
                                                </span>
                                            </td>

                                            {/* Products Count */}
                                            <td className="p-4">
                                                <span className="inline-flex items-center space-x-1 font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                                                    <Package className="w-3.5 h-3.5 text-amber-600" />
                                                    <span>{cat.products_count ?? 0} item(s)</span>
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="p-4">
                                                {cat.is_active ? (
                                                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                                                        <span>Active</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold uppercase bg-gray-100 text-gray-600 border border-gray-200">
                                                        <XCircle className="w-3 h-3 text-gray-400" />
                                                        <span>Hidden</span>
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="p-4 text-right space-x-2">
                                                <button
                                                    onClick={() => openEditModal(cat)}
                                                    className="p-2 text-gray-600 hover:text-amber-700 inline-block hover:bg-amber-50 rounded-xl transition cursor-pointer"
                                                    title="Edit Category"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cat)}
                                                    className={`p-2 inline-block rounded-xl transition cursor-pointer ${
                                                        cat.products_count > 0
                                                            ? 'text-gray-300 hover:text-gray-400 cursor-not-allowed'
                                                            : 'text-gray-500 hover:text-rose-600 hover:bg-rose-50'
                                                    }`}
                                                    title={cat.products_count > 0 ? 'Contains products; cannot delete' : 'Delete Category'}
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
                </div>
            </div>

            {/* Add / Edit Category Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-amber-100">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <h3 className="font-extrabold text-gray-900 text-lg flex items-center space-x-2">
                                <FolderTree className="w-5 h-5 text-amber-600" />
                                <span>{editingCategory ? 'Edit Category' : 'Create New Category'}</span>
                            </h3>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 font-bold p-1 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                            {/* Name */}
                            <div>
                                <label className="block font-bold text-gray-700 uppercase mb-1">
                                    Category Name (नाम) *
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="E.g. Ganvesh (गणवेश) or Puja Items (पूजा सामग्री)"
                                    className="w-full p-3 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500"
                                    required
                                />
                                {errors.name && <div className="text-rose-600 text-xs mt-1">{errors.name}</div>}
                            </div>

                            {/* Slug */}
                            <div>
                                <label className="block font-bold text-gray-700 uppercase mb-1">
                                    URL Slug Identifier (स्लग)
                                </label>
                                <input
                                    type="text"
                                    value={data.slug}
                                    onChange={(e) => setData('slug', e.target.value)}
                                    placeholder="e.g. ganvesh, books, ghosh (auto-generated if empty)"
                                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500"
                                />
                                {errors.slug && <div className="text-rose-600 text-xs mt-1">{errors.slug}</div>}
                            </div>

                            {/* Thumbnail Image URL & Quick Picker */}
                            <div>
                                <label className="block font-bold text-gray-700 uppercase mb-1">
                                    Thumbnail Image URL / Path (थंबनेल फोटो)
                                </label>
                                <input
                                    type="text"
                                    value={data.image_url}
                                    onChange={(e) => setData('image_url', e.target.value)}
                                    placeholder="/images/categories/ganvesh.jpg or https://..."
                                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                                />
                                {errors.image_url && <div className="text-rose-600 text-xs mt-1">{errors.image_url}</div>}

                                {/* Preset Image Shortcuts */}
                                <div className="mt-2">
                                    <span className="text-[11px] font-bold text-gray-500">Quick Select from Public Images:</span>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        {presetImages.map((preset) => (
                                            <button
                                                key={preset.path}
                                                type="button"
                                                onClick={() => setData('image_url', preset.path)}
                                                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer ${
                                                    data.image_url === preset.path
                                                        ? 'bg-amber-100 border-amber-400 text-amber-900'
                                                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-amber-50'
                                                }`}
                                            >
                                                <img src={preset.path} alt={preset.label} className="w-3.5 h-3.5 rounded-full object-cover" />
                                                <span>{preset.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Live Image Preview Container */}
                                {data.image_url && (
                                    <div className="mt-2.5 p-2 bg-orange-50/40 border border-amber-200 rounded-xl flex items-center space-x-3">
                                        <img
                                            src={data.image_url}
                                            alt="Preview"
                                            className="w-12 h-12 rounded-lg object-cover border border-amber-200"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                        <div className="text-[11px] text-gray-600 truncate flex-1">
                                            <div className="font-bold text-amber-800">Thumbnail Preview</div>
                                            <span className="text-gray-400 font-mono text-[10px]">{data.image_url}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block font-bold text-gray-700 uppercase mb-1">
                                    Description (विवरण)
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Brief description of products included in this category..."
                                    rows={2}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                                />
                                {errors.description && <div className="text-rose-600 text-xs mt-1">{errors.description}</div>}
                            </div>

                            {/* Visibility Toggle */}
                            <div className="bg-amber-50/60 border border-amber-200 p-3 rounded-xl flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-gray-800 text-xs">Visible on Storefront</div>
                                    <div className="text-[11px] text-gray-500">Show this category in public product catalog & filters</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                                </label>
                            </div>

                            {/* Modal Action Buttons */}
                            <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold text-xs cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-extrabold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
                                >
                                    {processing ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
