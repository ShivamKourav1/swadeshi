import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Shield,
    UserPlus,
    Search,
    UserCheck,
    Power,
    Store,
    Truck,
    User as UserIcon,
    Building2,
    Edit3,
    Trash2,
    MapPin,
    Layers,
    KeyRound,
} from 'lucide-react';

export default function Index({ users, roles = [], filters }) {
    const [selectedRole, setSelectedRole] = useState(filters.role || '');
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const handleFilter = (roleVal) => {
        setSelectedRole(roleVal);
        router.get(
            route('admin.users.index'),
            {
                role: roleVal,
                search: searchTerm,
            },
            { preserveState: true }
        );
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route('admin.users.index'),
            {
                role: selectedRole,
                search: searchTerm,
            },
            { preserveState: true }
        );
    };

    const toggleUserStatus = (userId) => {
        router.patch(route('admin.users.toggle', userId), {}, { preserveScroll: true });
    };

    const handleDeleteUser = (user) => {
        if (confirm(`Are you sure you want to delete user '${user.name}'?`)) {
            router.delete(route('admin.users.destroy', user.id), { preserveScroll: true });
        }
    };

    const getRoleBadgeStyle = (roleName) => {
        if (roleName.includes('admin')) return 'bg-purple-100 text-purple-800 border-purple-200';
        if (roleName.includes('karyakarta')) return 'bg-amber-100 text-amber-900 border-amber-200';
        if (roleName.includes('dealer')) return 'bg-blue-100 text-blue-900 border-blue-200';
        if (roleName.includes('delivery')) return 'bg-orange-100 text-orange-900 border-orange-200';
        return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getJurisdictionLabel = (profile) => {
        if (!profile) return 'Global (No limit)';
        if (profile.shakha) return `Shakha: ${profile.shakha.shakha_name}`;
        if (profile.nagar) return `Nagar: ${profile.nagar.nagar_name}`;
        if (profile.jila) return `Jila: ${profile.jila.jila_name}`;
        if (profile.vibhag) return `Vibhag: ${profile.vibhag.vibhag_name}`;
        if (profile.prant) return `Prant: ${profile.prant.prant_name}`;
        if (profile.kshetra) return `Kshetra: ${profile.kshetra.kshetra_name}`;
        return 'Global Jurisdiction';
    };

    return (
        <AuthenticatedLayout>
            <Head title="Admin - User & Access Management" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Card */}
                <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center space-x-2 text-purple-200 text-xs font-bold uppercase tracking-wider mb-1">
                            <Shield className="w-4 h-4" />
                            <span>System Administrator Control Panel</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black">User & Access Management (उपयोगकर्ता प्रबंधन)</h1>
                        <p className="text-purple-200 text-xs mt-1">
                            Manage user accounts, assign multiple roles & permissions, and configure organizational jurisdictions.
                        </p>
                    </div>

                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                        <Link
                            href={route('admin.roles.index')}
                            className="bg-white/15 hover:bg-white/25 text-white font-extrabold px-4 py-3 rounded-2xl text-xs transition flex items-center space-x-2"
                        >
                            <KeyRound className="w-4 h-4" />
                            <span>Roles & Rights Matrix</span>
                        </Link>

                        <Link
                            href={route('admin.users.create')}
                            className="bg-white text-purple-950 hover:bg-purple-50 font-black px-5 py-3 rounded-2xl text-xs transition shadow-lg flex items-center space-x-2 cursor-pointer"
                        >
                            <UserPlus className="w-4 h-4 text-purple-700" />
                            <span>Onboard New User</span>
                        </Link>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        {/* Role Filter Tabs */}
                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
                            <button
                                onClick={() => handleFilter('')}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                    selectedRole === ''
                                        ? 'bg-purple-900 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                All Roles
                            </button>
                            {roles.slice(0, 6).map((r) => (
                                <button
                                    key={r.id}
                                    onClick={() => handleFilter(r.name)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                        selectedRole === r.name
                                            ? 'bg-indigo-700 text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {r.display_name.split('(')[0].trim()}
                                </button>
                            ))}
                        </div>

                        {/* Search Input */}
                        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by name, email, phone..."
                                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-purple-900 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-purple-950 transition"
                            >
                                Search
                            </button>
                        </form>
                    </div>

                    {/* Users Table */}
                    <div className="overflow-x-auto border-t border-gray-100 pt-4">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                <tr>
                                    <th className="p-4">User Details</th>
                                    <th className="p-4">Assigned Roles</th>
                                    <th className="p-4">Jurisdiction Scope</th>
                                    <th className="p-4">Business / Vehicle Info</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-medium">
                                {users.data.map((u) => {
                                    const userRoles = u.roles && u.roles.length > 0 ? u.roles : [{ name: u.role, display_name: u.role }];
                                    return (
                                        <tr key={u.id} className="hover:bg-gray-50/60 transition">
                                            <td className="p-4">
                                                <div className="font-black text-gray-900 text-sm">{u.name}</div>
                                                <div className="text-gray-500 text-[11px]">{u.email}</div>
                                                {u.phone && (
                                                    <div className="text-gray-400 text-[10px] font-mono">{u.phone}</div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {userRoles.map((r, idx) => (
                                                        <span
                                                            key={idx}
                                                            className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border ${getRoleBadgeStyle(
                                                                r.name
                                                            )}`}
                                                        >
                                                            {r.display_name || r.name.replace('_', ' ')}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center space-x-1.5 text-gray-800 font-bold">
                                                    <MapPin className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                                                    <span>{getJurisdictionLabel(u.profile)}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {u.profile?.business_name && (
                                                    <div className="font-bold text-amber-800">
                                                        🏢 {u.profile.business_name}
                                                    </div>
                                                )}
                                                {u.profile?.vehicle_type && (
                                                    <div className="font-bold text-orange-800">
                                                        🚚 {u.profile.vehicle_type} ({u.profile.vehicle_number || 'N/A'})
                                                    </div>
                                                )}
                                                {!u.profile?.business_name && !u.profile?.vehicle_type && (
                                                    <span className="text-gray-400 italic">Standard</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                        u.status === 'active'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-rose-100 text-rose-800'
                                                    }`}
                                                >
                                                    {u.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Link
                                                        href={route('admin.users.edit', u.id)}
                                                        className="p-1.5 text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition"
                                                        title="Edit User & Roles"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </Link>

                                                    <button
                                                        onClick={() => toggleUserStatus(u.id)}
                                                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                                                            u.status === 'active'
                                                                ? 'text-rose-600 hover:bg-rose-50'
                                                                : 'text-emerald-600 hover:bg-emerald-50'
                                                        }`}
                                                        title={u.status === 'active' ? 'Deactivate User' : 'Activate User'}
                                                    >
                                                        <Power className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDeleteUser(u)}
                                                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Links */}
                    {users.links && users.links.length > 3 && (
                        <div className="flex justify-center items-center space-x-1 pt-4 border-t border-gray-100">
                            {users.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-3 py-1.5 text-xs rounded-xl font-bold transition ${
                                        link.active
                                            ? 'bg-purple-900 text-white'
                                            : link.url
                                            ? 'text-gray-700 hover:bg-gray-100'
                                            : 'text-gray-300 cursor-not-allowed'
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
