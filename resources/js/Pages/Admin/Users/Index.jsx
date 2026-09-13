import React, { useState, useRef } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
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
    FileSpreadsheet,
    Upload,
    Download,
    X,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';

export default function Index({ users, roles = [], filters, can_manage_roles = false, is_superadmin = false, is_toli_admin = false }) {
    const [selectedRole, setSelectedRole] = useState(filters.role || '');
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [showImportModal, setShowImportModal] = useState(false);
    const fileInputRef = useRef(null);

    const { data: importData, setData: setImportData, post: postImport, processing: importProcessing, errors: importErrors, reset: resetImport } = useForm({
        file: null,
    });

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

    const handleImportSubmit = (e) => {
        e.preventDefault();
        if (!importData.file) {
            alert('Please select an Excel or CSV file to import.');
            return;
        }

        postImport(route('admin.users.import'), {
            onSuccess: () => {
                setShowImportModal(false);
                resetImport();
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
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
        if (roleName === 'superadmin') return 'bg-rose-100 text-rose-800 border-rose-200';
        if (roleName === 'admin') return 'bg-purple-100 text-purple-800 border-purple-200';
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
                            <span>{is_superadmin ? 'Superadmin Control Panel (मुख्य व्यवस्थापक)' : 'Toli Administrator Control Panel (टोली प्रशासक)'}</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black">User & Access Management (उपयोगकर्ता प्रबंधन)</h1>
                        <p className="text-purple-200 text-xs mt-1">
                            {is_toli_admin ? 'Scoped management for users and resources within your assigned organizational toli.' : 'Manage user accounts, assign multiple roles & permissions, and configure organizational jurisdictions.'}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => setShowImportModal(true)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-3 rounded-2xl text-xs transition shadow-md flex items-center space-x-2 cursor-pointer"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>Import Users (Excel/CSV)</span>
                        </button>

                        {can_manage_roles && (
                            <Link
                                href={route('admin.roles.index')}
                                className="bg-white/15 hover:bg-white/25 text-white font-extrabold px-4 py-3 rounded-2xl text-xs transition flex items-center space-x-2"
                            >
                                <KeyRound className="w-4 h-4" />
                                <span>Roles & Rights Matrix</span>
                            </Link>
                        )}

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
                            {(is_superadmin ? ['superadmin', 'admin', 'karyakarta', 'dealer', 'customer', 'delivery_partner'] : ['admin', 'karyakarta', 'dealer', 'customer', 'delivery_partner']).map((roleKey) => {
                                const matched = roles.find((r) => r.name === roleKey);
                                const label = matched ? matched.display_name.split('(')[0].trim() : roleKey.replace('_', ' ');
                                return (
                                    <button
                                        key={roleKey}
                                        onClick={() => handleFilter(roleKey)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                                            selectedRole === roleKey
                                                ? 'bg-indigo-700 text-white shadow-sm'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {roleKey === 'superadmin' ? '👑 ' : roleKey === 'dealer' ? '🏪 ' : roleKey === 'delivery_partner' ? '🚚 ' : ''}
                                        {label}
                                    </button>
                                );
                            })}
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

            {/* Import Users Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in duration-200">
                        <button
                            type="button"
                            onClick={() => {
                                setShowImportModal(false);
                                resetImport();
                            }}
                            className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                                <FileSpreadsheet className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Import Users (Excel / CSV)</h3>
                                <p className="text-xs text-gray-500">Bulk upload members with Toli roles</p>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 mb-5 text-xs text-amber-900 space-y-1.5">
                            <div className="font-bold flex items-center gap-1.5 text-amber-950">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                                <span>Template Structure & Guidelines:</span>
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800 ml-1">
                                <li><strong>Required Columns:</strong> <code>name</code>, <code>mobile</code>, <code>Is Shakha Toli Member</code>, <code>Is Nagar Toli Member</code>, <code>Is Jila Toli Member</code></li>
                                <li><strong>Default Password:</strong> Set automatically to the user's <strong>mobile number</strong>.</li>
                                <li><strong>Toli Flags:</strong> Value should be <code>Yes</code> / <code>No</code> (or <code>1</code> / <code>0</code>).</li>
                            </ul>
                        </div>

                        <div className="mb-5 flex justify-between items-center bg-gray-50 p-3 rounded-2xl border border-gray-200">
                            <div>
                                <div className="text-xs font-bold text-gray-800">Need the official template?</div>
                                <div className="text-[11px] text-gray-500">Pre-formatted columns with sample data</div>
                            </div>
                            <a
                                href={route('admin.users.import_template')}
                                download
                                className="inline-flex items-center space-x-1.5 text-xs font-black text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-200 transition cursor-pointer"
                            >
                                <Download className="w-4 h-4" />
                                <span>Download Template</span>
                            </a>
                        </div>

                        <form onSubmit={handleImportSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                    Select Excel (.xlsx) or CSV (.csv) File
                                </label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                    onChange={(e) => setImportData('file', e.target.files[0])}
                                    className="block w-full text-xs text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer border border-gray-200 rounded-2xl p-1 bg-white"
                                />
                                {importErrors.file && (
                                    <div className="text-rose-600 text-[11px] mt-1 font-semibold">
                                        {importErrors.file}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end space-x-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowImportModal(false);
                                        resetImport();
                                    }}
                                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={importProcessing || !importData.file}
                                    className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer"
                                >
                                    <Upload className="w-4 h-4" />
                                    <span>{importProcessing ? 'Importing...' : 'Upload & Import'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
