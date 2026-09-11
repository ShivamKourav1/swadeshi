import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Shield,
    Plus,
    Edit3,
    Trash2,
    Users,
    CheckSquare,
    Square,
    Lock,
    Unlock,
    Info,
    CheckCircle2,
    X,
    Building2,
    ShoppingBag,
    Truck,
    Layers,
    UserCheck,
    Search,
} from 'lucide-react';

export default function Index({ roles, allPermissions, permissionsByGroup }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [filterSearch, setFilterSearch] = useState('');

    const { data, setData, post, put, processing, reset, errors, clearErrors } = useForm({
        name: '',
        display_name: '',
        description: '',
        permissions: [],
    });

    const openCreateModal = () => {
        setEditingRole(null);
        clearErrors();
        reset();
        setData({
            name: '',
            display_name: '',
            description: '',
            permissions: [],
        });
        setIsModalOpen(true);
    };

    const openEditModal = (role) => {
        setEditingRole(role);
        clearErrors();
        const rolePermNames = role.permissions ? role.permissions.map((p) => p.name) : [];
        setData({
            name: role.name,
            display_name: role.display_name,
            description: role.description || '',
            permissions: rolePermNames,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRole(null);
        reset();
        clearErrors();
    };

    const togglePermission = (permName) => {
        setData((prev) => {
            const exists = prev.permissions.includes(permName);
            return {
                ...prev,
                permissions: exists
                    ? prev.permissions.filter((p) => p !== permName)
                    : [...prev.permissions, permName],
            };
        });
    };

    const toggleGroupPermissions = (groupPerms) => {
        const groupNames = groupPerms.map((p) => p.name);
        const allSelected = groupNames.every((name) => data.permissions.includes(name));

        setData((prev) => {
            if (allSelected) {
                // Deselect group
                return {
                    ...prev,
                    permissions: prev.permissions.filter((p) => !groupNames.includes(p)),
                };
            } else {
                // Select all in group
                const combined = Array.from(new Set([...prev.permissions, ...groupNames]));
                return {
                    ...prev,
                    permissions: combined,
                };
            }
        });
    };

    const selectAllPermissions = () => {
        const allNames = allPermissions.map((p) => p.name);
        setData((prev) => ({ ...prev, permissions: allNames }));
    };

    const deselectAllPermissions = () => {
        setData((prev) => ({ ...prev, permissions: [] }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingRole) {
            put(route('admin.roles.update', editingRole.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('admin.roles.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (role) => {
        if (role.is_system) {
            alert(`System role '${role.display_name}' is locked and cannot be deleted.`);
            return;
        }

        if (confirm(`Are you sure you want to delete custom role '${role.display_name}'?`)) {
            router.delete(route('admin.roles.destroy', role.id));
        }
    };

    const filteredRoles = roles.filter(
        (r) =>
            r.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
            r.display_name.toLowerCase().includes(filterSearch.toLowerCase()) ||
            (r.description && r.description.toLowerCase().includes(filterSearch.toLowerCase()))
    );

    const getGroupIcon = (group) => {
        switch (group) {
            case 'Organization Units':
                return <Building2 className="w-4 h-4 text-amber-600" />;
            case 'Karyakarta Intelligence':
                return <Layers className="w-4 h-4 text-indigo-600" />;
            case 'Administration':
                return <Shield className="w-4 h-4 text-purple-600" />;
            case 'E-Commerce':
                return <ShoppingBag className="w-4 h-4 text-emerald-600" />;
            case 'Delivery Partner':
                return <Truck className="w-4 h-4 text-orange-600" />;
            default:
                return <Shield className="w-4 h-4 text-gray-600" />;
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Admin - Roles & Rights Management" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Card */}
                <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center space-x-2 text-purple-200 text-xs font-bold uppercase tracking-wider mb-1">
                            <Shield className="w-4 h-4" />
                            <span>Access Control & RBAC Matrix</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black">Roles & Rights Management (भूमिका व अधिकार)</h1>
                        <p className="text-purple-200 text-xs mt-1">
                            Create custom roles, assign granular permissions for organizational units, and control operational rights.
                        </p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <Link
                            href={route('admin.users.index')}
                            className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-3 rounded-2xl text-xs transition flex items-center space-x-1.5"
                        >
                            <Users className="w-4 h-4" />
                            <span>Manage Users</span>
                        </Link>
                        <button
                            onClick={openCreateModal}
                            className="bg-white text-purple-950 hover:bg-purple-50 font-black px-5 py-3 rounded-2xl text-xs transition shadow-lg flex items-center space-x-2 cursor-pointer"
                        >
                            <Plus className="w-4 h-4 text-purple-700" />
                            <span>Create New Role</span>
                        </button>
                    </div>
                </div>

                {/* Metrics Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-xs">
                        <div className="text-[11px] font-bold text-gray-500 uppercase">Total Defined Roles</div>
                        <div className="text-2xl font-black text-purple-900 mt-1">{roles.length}</div>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-indigo-100 shadow-xs">
                        <div className="text-[11px] font-bold text-gray-500 uppercase">System Core Roles</div>
                        <div className="text-2xl font-black text-indigo-900 mt-1">
                            {roles.filter((r) => r.is_system).length}
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-amber-100 shadow-xs">
                        <div className="text-[11px] font-bold text-gray-500 uppercase">Custom Org Roles</div>
                        <div className="text-2xl font-black text-amber-900 mt-1">
                            {roles.filter((r) => !r.is_system).length}
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-xs">
                        <div className="text-[11px] font-bold text-gray-500 uppercase">Total Rights (Permissions)</div>
                        <div className="text-2xl font-black text-emerald-900 mt-1">{allPermissions.length}</div>
                    </div>
                </div>

                {/* Search Bar & Filter */}
                <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={filterSearch}
                            onChange={(e) => setFilterSearch(e.target.value)}
                            placeholder="Filter roles by name, title, or description..."
                            className="w-full pl-10 pr-4 py-2.5 text-xs border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:outline-none"
                        />
                    </div>
                    <div className="text-xs text-gray-500 font-bold hidden sm:block">
                        Showing <span className="text-purple-800 font-black">{filteredRoles.length}</span> of{' '}
                        {roles.length} roles
                    </div>
                </div>

                {/* Roles Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredRoles.map((role) => {
                        const assignedPerms = role.permissions || [];
                        return (
                            <div
                                key={role.id}
                                className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
                            >
                                <div className="p-6 space-y-4">
                                    {/* Role Title & Badges */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <h2 className="text-base font-black text-gray-900">
                                                    {role.display_name}
                                                </h2>
                                                {role.is_system ? (
                                                    <span
                                                        className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 flex items-center"
                                                        title="System role protected from deletion"
                                                    >
                                                        <Lock className="w-2.5 h-2.5 mr-1" /> SYSTEM
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 flex items-center">
                                                        <Unlock className="w-2.5 h-2.5 mr-1" /> CUSTOM
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[11px] font-mono text-gray-400 mt-0.5 font-semibold">
                                                slug: {role.name}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span className="bg-indigo-50 text-indigo-700 font-black px-2.5 py-1 rounded-xl text-xs inline-flex items-center space-x-1">
                                                <Users className="w-3.5 h-3.5" />
                                                <span>{role.users_count ?? 0}</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Role Description */}
                                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                        {role.description || 'No description provided.'}
                                    </p>

                                    {/* Rights & Permissions Preview */}
                                    <div className="space-y-2 pt-2 border-t border-gray-100">
                                        <div className="flex justify-between items-center text-[11px] font-bold text-gray-500">
                                            <span>Granted Permissions ({assignedPerms.length})</span>
                                        </div>

                                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                                            {assignedPerms.length === 0 ? (
                                                <span className="text-[11px] text-gray-400 italic">No permissions assigned</span>
                                            ) : (
                                                assignedPerms.map((perm) => (
                                                    <span
                                                        key={perm.id || perm.name}
                                                        className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-md border border-gray-200"
                                                    >
                                                        {perm.display_name || perm.name}
                                                    </span>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Action Buttons */}
                                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                                    <button
                                        onClick={() => openEditModal(role)}
                                        className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center space-x-1 px-3 py-1.5 rounded-xl hover:bg-indigo-50 transition cursor-pointer"
                                    >
                                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                                        <span>Configure Rights</span>
                                    </button>

                                    {!role.is_system && (
                                        <button
                                            onClick={() => handleDelete(role)}
                                            className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center space-x-1 px-3 py-1.5 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                                            <span>Delete</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Create / Edit Role Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                            {/* Modal Header */}
                            <div className="p-6 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex justify-between items-center">
                                <div>
                                    <div className="text-xs uppercase font-bold text-purple-200">
                                        {editingRole ? 'Role Configuration' : 'New Role Setup'}
                                    </div>
                                    <h2 className="text-xl font-black">
                                        {editingRole ? `Edit Role: ${editingRole.display_name}` : 'Create New System Role'}
                                    </h2>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="p-2 text-purple-200 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body / Form */}
                            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Role Machine Slug */}
                                    <div>
                                        <label className="block font-bold text-gray-700 uppercase mb-1">
                                            Machine Identifier / Slug *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                            disabled={editingRole?.is_system}
                                            placeholder="e.g. mandal_karyakarta"
                                            className={`w-full p-3 border rounded-xl font-mono text-xs ${
                                                editingRole?.is_system
                                                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                                    : 'border-gray-300 focus:ring-2 focus:ring-purple-400'
                                            }`}
                                        />
                                        {errors.name && <div className="text-rose-600 mt-1">{errors.name}</div>}
                                    </div>

                                    {/* Display Title */}
                                    <div>
                                        <label className="block font-bold text-gray-700 uppercase mb-1">
                                            Display Name / Title *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.display_name}
                                            onChange={(e) => setData('display_name', e.target.value)}
                                            placeholder="e.g. Mandal Karyakarta (मंडल कार्यकर्ता)"
                                            className="w-full p-3 border border-gray-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-400"
                                        />
                                        {errors.display_name && (
                                            <div className="text-rose-600 mt-1">{errors.display_name}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block font-bold text-gray-700 uppercase mb-1">Role Description</label>
                                    <input
                                        type="text"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Describe the operational mandate and scope for this role..."
                                        className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-400"
                                    />
                                    {errors.description && <div className="text-rose-600 mt-1">{errors.description}</div>}
                                </div>

                                {/* Permissions Matrix Selector */}
                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                        <div>
                                            <h3 className="font-extrabold text-sm text-gray-900">
                                                Assign Rights & Permissions (अधिकार चयन)
                                            </h3>
                                            <p className="text-gray-500 text-[11px]">
                                                Select which modules and administrative operations are enabled for this role.
                                            </p>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <button
                                                type="button"
                                                onClick={selectAllPermissions}
                                                className="px-2.5 py-1 bg-purple-50 text-purple-700 font-bold rounded-lg hover:bg-purple-100 transition cursor-pointer"
                                            >
                                                Select All
                                            </button>
                                            <button
                                                type="button"
                                                onClick={deselectAllPermissions}
                                                className="px-2.5 py-1 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition cursor-pointer"
                                            >
                                                Clear All
                                            </button>
                                        </div>
                                    </div>

                                    {/* Grouped Permissions Cards */}
                                    <div className="space-y-4">
                                        {Object.entries(permissionsByGroup).map(([groupName, groupPerms]) => {
                                            const groupNames = groupPerms.map((p) => p.name);
                                            const allSelected = groupNames.every((name) =>
                                                data.permissions.includes(name)
                                            );
                                            const someSelected = groupNames.some((name) =>
                                                data.permissions.includes(name)
                                            );

                                            return (
                                                <div
                                                    key={groupName}
                                                    className="bg-gray-50/70 border border-gray-200 rounded-2xl p-4 space-y-3"
                                                >
                                                    <div className="flex justify-between items-center border-b pb-2 border-gray-200/80">
                                                        <div className="flex items-center space-x-2 font-extrabold text-gray-800 text-xs">
                                                            {getGroupIcon(groupName)}
                                                            <span>{groupName}</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleGroupPermissions(groupPerms)}
                                                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                                                        >
                                                            {allSelected ? 'Deselect Group' : 'Select Group'}
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                        {groupPerms.map((perm) => {
                                                            const isChecked = data.permissions.includes(perm.name);
                                                            return (
                                                                <label
                                                                    key={perm.id}
                                                                    onClick={() => togglePermission(perm.name)}
                                                                    className={`p-3 rounded-xl border flex items-start space-x-2.5 transition cursor-pointer select-none ${
                                                                        isChecked
                                                                            ? 'bg-purple-50/90 border-purple-300 text-purple-900 shadow-2xs'
                                                                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                                                    }`}
                                                                >
                                                                    <div className="mt-0.5">
                                                                        {isChecked ? (
                                                                            <CheckSquare className="w-4 h-4 text-purple-700 flex-shrink-0" />
                                                                        ) : (
                                                                            <Square className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-extrabold text-xs">
                                                                            {perm.display_name}
                                                                        </div>
                                                                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                                                                            {perm.name}
                                                                        </div>
                                                                        {perm.description && (
                                                                            <div className="text-[10px] text-gray-400 mt-1 leading-tight">
                                                                                {perm.description}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Modal Actions */}
                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-6 py-2.5 text-xs font-black text-white bg-purple-900 hover:bg-purple-950 rounded-xl transition shadow-md flex items-center space-x-2 cursor-pointer"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>{processing ? 'Saving...' : editingRole ? 'Save Changes' : 'Create Role'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
