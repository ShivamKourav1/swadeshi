import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Building2,
    Award,
    Plus,
    Edit3,
    Trash2,
    Users,
    Phone,
    UserCheck,
    ChevronRight,
    MapPin,
    Flag,
    CheckCircle2,
    XCircle,
    Package,
    ArrowLeft,
} from 'lucide-react';

/**
 * Converts any role key (snake_case, kebab-case, or camelCase) into a clean Title Case display string.
 * Example: 'mukhya_shikshak' -> 'Mukhya Shikshak'
 */
export const toTitleCase = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/[_\-\.]+/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .trim()
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

/**
 * Converts a Title or user string into a snake_case key for backend persistence.
 * Example: 'Mukhya Shikshak' -> 'mukhya_shikshak'
 */
export const toKeyName = (str) => {
    if (!str) return '';
    return String(str)
        .trim()
        .toLowerCase()
        .replace(/[\s\-\.]+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
};

export default function Index({
    activeTab: initialTab,
    kshetras,
    prants,
    vibhags,
    jilas,
    nagars,
    shakhas,
    scope,
    permissions = {},
    is_admin = false,
}) {
    const [currentTab, setCurrentTab] = useState(initialTab || 'shakhas');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);

    // Form for creating and editing units
    const { data, setData, post, put, transform, processing, reset, errors, clearErrors } = useForm({
        kshetra_name: '',
        prant_name: '',
        kshetra_id: '',
        vibhag_name: '',
        prant_id: '',
        jila_name: '',
        vibhag_id: '',
        nagar_name: '',
        jila_id: '',
        shakha_name: '',
        nagar_id: '',
        aayu_varg: 'Baal',
        type: 'dainik',
        status: 'Active',
        toli_members: [], // Array of { role: '', name: '', contact: '' }
    });

    const tabs = [
        { id: 'kshetras', label: 'Kshetras (क्षेत्र)', icon: '🌐', count: kshetras.length, singular: 'kshetra' },
        { id: 'prants', label: 'Prants (प्रान्त)', icon: '🏛️', count: prants.length, singular: 'prant' },
        { id: 'vibhags', label: 'Vibhags (विभाग)', icon: '🏢', count: vibhags.length, singular: 'vibhag' },
        { id: 'jilas', label: 'Jilas (जिला)', icon: '📍', count: jilas.length, singular: 'jila' },
        { id: 'nagars', label: 'Nagars (नगर)', icon: '🏘️', count: nagars.length, singular: 'nagar' },
        { id: 'shakhas', label: 'Shakhas (शाखा)', icon: '🚩', count: shakhas.length, singular: 'shakha' },
    ];

    const currentTabConfig = tabs.find((t) => t.id === currentTab) || tabs[5];
    const canManageCurrentTab = is_admin || Boolean(permissions[`manage_${currentTabConfig.singular}`]);

    /**
     * Parses toli data from various possible formats into a uniform array of objects.
     */
    const getToliArray = (toli) => {
        if (!toli) return [];
        let parsed = toli;
        if (typeof toli === 'string') {
            try {
                parsed = JSON.parse(toli);
            } catch (e) {
                return [];
            }
        }
        if (Array.isArray(parsed)) {
            return parsed.map((item, idx) => {
                if (typeof item === 'object' && item !== null) {
                    return {
                        role: item.role || item.role_key || `Member ${idx + 1}`,
                        name: item.name || '',
                        contact: item.contact || item.phone || '',
                    };
                }
                return {
                    role: `Member ${idx + 1}`,
                    name: String(item),
                    contact: '',
                };
            });
        }
        if (typeof parsed === 'object' && parsed !== null) {
            return Object.entries(parsed).map(([role, val]) => {
                if (typeof val === 'object' && val !== null) {
                    return {
                        role: role,
                        name: val.name || '',
                        contact: val.contact || val.phone || '',
                    };
                }
                return {
                    role: role,
                    name: String(val || ''),
                    contact: '',
                };
            });
        }
        return [];
    };

    /**
     * Default toli template according to unit type.
     */
    const getDefaultToliForTab = (tab) => {
        switch (tab) {
            case 'shakhas':
                return [
                    { role: 'Mukhya Shikshak', name: '', contact: '' },
                    { role: 'Karyavah', name: '', contact: '' },
                ];
            case 'nagars':
                return [
                    { role: 'Nagar Sanghchalak', name: '', contact: '' },
                    { role: 'Nagar Karyavah', name: '', contact: '' },
                ];
            case 'jilas':
                return [
                    { role: 'Jila Sanghchalak', name: '', contact: '' },
                    { role: 'Jila Karyavah', name: '', contact: '' },
                    { role: 'Jila Pracharak', name: '', contact: '' },
                ];
            case 'vibhags':
                return [
                    { role: 'Vibhag Sanghchalak', name: '', contact: '' },
                    { role: 'Vibhag Karyavah', name: '', contact: '' },
                    { role: 'Vibhag Pracharak', name: '', contact: '' },
                ];
            case 'prants':
                return [
                    { role: 'Prant Sanghchalak', name: '', contact: '' },
                    { role: 'Prant Karyavah', name: '', contact: '' },
                    { role: 'Prant Pracharak', name: '', contact: '' },
                ];
            case 'kshetras':
                return [
                    { role: 'Kshetra Sanghchalak', name: '', contact: '' },
                    { role: 'Kshetra Karyavah', name: '', contact: '' },
                    { role: 'Kshetra Pracharak', name: '', contact: '' },
                ];
            default:
                return [{ role: 'Member 1', name: '', contact: '' }];
        }
    };

    /**
     * Quick role suggestion titles for the active tab.
     */
    const getRoleSuggestionsForTab = (tab) => {
        switch (tab) {
            case 'shakhas':
                return ['Mukhya Shikshak', 'Karyavah', 'Gat Nayak', 'Sah Karyavah', 'Shikshak'];
            case 'nagars':
                return ['Nagar Sanghchalak', 'Nagar Karyavah', 'Nagar Pracharak', 'Nagar Sah Karyavah'];
            case 'jilas':
                return ['Jila Sanghchalak', 'Jila Karyavah', 'Jila Pracharak', 'Jila Sah Karyavah'];
            case 'vibhags':
                return ['Vibhag Sanghchalak', 'Vibhag Karyavah', 'Vibhag Pracharak'];
            case 'prants':
                return ['Prant Sanghchalak', 'Prant Karyavah', 'Prant Pracharak'];
            case 'kshetras':
                return ['Kshetra Sanghchalak', 'Kshetra Karyavah', 'Kshetra Pracharak'];
            default:
                return ['Sanghchalak', 'Karyavah', 'Pracharak'];
        }
    };

    const openAddModal = () => {
        setEditingUnit(null);
        clearErrors();
        reset();

        const defaultToli = getDefaultToliForTab(currentTab);

        setData({
            kshetra_name: '',
            prant_name: '',
            kshetra_id: kshetras[0]?.id ? String(kshetras[0].id) : '',
            vibhag_name: '',
            prant_id: prants[0]?.id ? String(prants[0].id) : '',
            jila_name: '',
            vibhag_id: vibhags[0]?.id ? String(vibhags[0].id) : '',
            nagar_name: '',
            jila_id: jilas[0]?.id ? String(jilas[0].id) : '',
            shakha_name: '',
            nagar_id: nagars[0]?.id ? String(nagars[0].id) : '',
            aayu_varg: 'Baal',
            type: 'dainik',
            status: 'Active',
            toli_members: defaultToli,
        });

        setIsModalOpen(true);
    };

    const openEditModal = (unit) => {
        setEditingUnit(unit);
        clearErrors();

        let toliList = getToliArray(unit.toli);
        if (toliList.length === 0) {
            toliList = getDefaultToliForTab(currentTab);
        }

        // Convert role keys to clean Title Case for display in edit form
        const formattedMembers = toliList.map((m) => ({
            role: toTitleCase(m.role || ''),
            name: m.name || '',
            contact: m.contact || '',
        }));

        setData({
            kshetra_name: unit.kshetra_name || '',
            prant_name: unit.prant_name || '',
            kshetra_id: unit.kshetra_id ? String(unit.kshetra_id) : '',
            vibhag_name: unit.vibhag_name || '',
            prant_id: unit.prant_id ? String(unit.prant_id) : '',
            jila_name: unit.jila_name || '',
            vibhag_id: unit.vibhag_id ? String(unit.vibhag_id) : '',
            nagar_name: unit.nagar_name || '',
            jila_id: unit.jila_id ? String(unit.jila_id) : '',
            shakha_name: unit.shakha_name || '',
            nagar_id: unit.nagar_id ? String(unit.nagar_id) : '',
            aayu_varg: unit.aayu_varg || 'Baal',
            type: unit.type || 'dainik',
            status: unit.status || 'Active',
            toli_members: formattedMembers.length > 0 ? formattedMembers : [{ role: '', name: '', contact: '' }],
        });

        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUnit(null);
        reset();
        clearErrors();
    };

    const addToliRow = (suggestedRoleTitle = '') => {
        setData((prev) => ({
            ...prev,
            toli_members: [
                ...prev.toli_members,
                { role: toTitleCase(suggestedRoleTitle), name: '', contact: '' },
            ],
        }));
    };

    const updateToliMember = (index, field, value) => {
        setData((prev) => {
            const updated = [...prev.toli_members];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, toli_members: updated };
        });
    };

    const removeToliMember = (index) => {
        setData((prev) => ({
            ...prev,
            toli_members: prev.toli_members.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const unitType = currentTabConfig.singular;

        // Transform toli_members into structured associative object for storage
        const formattedToli = {};
        (data.toli_members || []).forEach((m, idx) => {
            const rawRole = m.role ? m.role.trim() : '';
            const key = rawRole ? toKeyName(rawRole) : `member_${idx + 1}`;
            if (m.name || m.contact || m.role) {
                formattedToli[key] = {
                    name: m.name || '',
                    contact: m.contact || '',
                };
            }
        });

        // Set transform hook so Inertia sends toli alongside data
        transform((formValues) => ({
            ...formValues,
            toli: formattedToli,
        }));

        if (editingUnit) {
            put(route('karyakarta.units.update', { unitType, id: editingUnit.id }), {
                preserveScroll: true,
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('karyakarta.units.store', { unitType }), {
                preserveScroll: true,
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (unit) => {
        const unitType = currentTabConfig.singular;
        const name =
            unit.shakha_name ||
            unit.nagar_name ||
            unit.jila_name ||
            unit.vibhag_name ||
            unit.prant_name ||
            unit.kshetra_name;

        if (confirm(`Are you sure you want to delete ${currentTabConfig.singular} '${name}'?`)) {
            router.delete(route('karyakarta.units.destroy', { unitType, id: unit.id }), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Organization Structure Management - Karyakarta" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Card */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-amber-100 shadow-sm">
                    <div>
                        <div className="flex items-center space-x-2 text-amber-700 text-xs font-bold uppercase tracking-wider mb-1">
                            <Building2 className="w-4 h-4" />
                            <span>Karyakarta Organization Directory</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center space-x-2.5">
                            <span>Organizational Structure (संगठनात्मक संरचना)</span>
                        </h1>
                        <p className="text-xs text-gray-500 mt-1">
                            Manage hierarchical units (Kshetras, Prants, Vibhags, Jilas, Nagars, Shakhas) and coordinate official Toli members with contact numbers.
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className="bg-amber-100/90 text-amber-900 border border-amber-300 px-3 py-1 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5">
                                <MapPin className="w-3.5 h-3.5 text-amber-700" />
                                <span>Assigned Jurisdiction: {scope?.description || 'Global (All Units)'}</span>
                            </span>

                            {canManageCurrentTab ? (
                                <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-xl text-[11px] font-extrabold flex items-center border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Manage Rights Active
                                </span>
                            ) : (
                                <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-xl text-[11px] font-bold border border-gray-200">
                                    👁️ View Only Access
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                        <Link
                            href={route('karyakarta.dashboard')}
                            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-xs transition flex items-center space-x-1 cursor-pointer"
                        >
                            <Award className="w-4 h-4 mr-1 text-amber-600" />
                            <span>Orders Dashboard</span>
                        </Link>
                        {canManageCurrentTab && (
                            <button
                                onClick={openAddModal}
                                className="flex-1 sm:flex-initial bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold px-5 py-3 rounded-2xl text-sm transition shadow-md shadow-amber-500/20 flex items-center justify-center space-x-2 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add {currentTabConfig.singular.toUpperCase()}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Level Navigation Tabs */}
                <div className="flex flex-wrap gap-2 p-1.5 bg-white rounded-3xl border border-amber-100 shadow-xs">
                    {tabs.map((tab) => {
                        const isActive = currentTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setCurrentTab(tab.id)}
                                className={`flex-1 min-w-[130px] sm:min-w-0 py-3 px-4 rounded-2xl text-xs font-extrabold transition flex items-center justify-center space-x-2 cursor-pointer ${
                                    isActive
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20'
                                        : 'text-gray-600 hover:text-amber-800 hover:bg-amber-50/60'
                                }`}
                            >
                                <span className="text-base">{tab.icon}</span>
                                <span>{tab.label}</span>
                                <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                        isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Content Table & Toli List */}
                <div className="bg-white rounded-3xl border border-amber-100 shadow-sm p-6 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <div className="font-extrabold text-gray-900 text-sm">
                            Total {currentTabConfig.label}: <span className="text-amber-600">{currentTabConfig.count}</span>
                        </div>
                    </div>

                    {/* Shakhas Tab Table */}
                    {currentTab === 'shakhas' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                    <tr>
                                        <th className="p-4">Shakha Name</th>
                                        <th className="p-4">Hierarchy (Nagar & Jila)</th>
                                        <th className="p-4">Age Group (आयु वर्ग)</th>
                                        <th className="p-4">Frequency</th>
                                        <th className="p-4">Toli Members (टोली संपर्क)</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-medium">
                                    {shakhas.map((s) => {
                                        const toliList = getToliArray(s.toli);
                                        return (
                                            <tr key={s.id} className="hover:bg-amber-50/20 transition">
                                                <td className="p-4">
                                                    <div className="font-black text-gray-900 text-sm flex items-center space-x-1.5">
                                                        <Flag className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                                        <span>{s.shakha_name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-gray-600">
                                                    <div className="font-bold text-gray-800">{s.nagar?.nagar_name || 'N/A'}</div>
                                                    <div className="text-[11px] text-gray-400">Jila: {s.nagar?.jila?.jila_name || 'N/A'}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-lg text-[11px] font-bold">
                                                        {s.aayu_varg}
                                                    </span>
                                                </td>
                                                <td className="p-4 uppercase text-gray-600 font-semibold">{s.type}</td>
                                                <td className="p-4">
                                                    {toliList.length === 0 ? (
                                                        <span className="text-gray-400 italic text-[11px]">No toli listed</span>
                                                    ) : (
                                                        <div className="space-y-1.5 max-w-xs">
                                                            {toliList.map((m, i) => (
                                                                <div key={i} className="flex items-center space-x-1.5 text-[11px]">
                                                                    <span className="bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md font-extrabold text-[10px] whitespace-nowrap">
                                                                        {toTitleCase(m.role)}:
                                                                    </span>
                                                                    <span className="font-bold text-gray-900">{m.name || 'N/A'}</span>
                                                                    {m.contact && (
                                                                        <a
                                                                            href={`tel:${m.contact}`}
                                                                            className="text-amber-700 hover:text-amber-900 font-mono text-[10px] flex items-center bg-amber-50 px-1.5 py-0.5 rounded ml-1 font-semibold"
                                                                        >
                                                                            <Phone className="w-2.5 h-2.5 mr-0.5" />
                                                                            {m.contact}
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    {s.status === 'Active' ? (
                                                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center w-fit">
                                                            <CheckCircle2 className="w-3 h-3 mr-1" /> ACTIVE
                                                        </span>
                                                    ) : (
                                                        <span className="bg-gray-100 text-gray-600 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center w-fit">
                                                            <XCircle className="w-3 h-3 mr-1" /> INACTIVE
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    {canManageCurrentTab ? (
                                                        <div className="space-x-2">
                                                            <button
                                                                onClick={() => openEditModal(s)}
                                                                className="p-1.5 text-gray-600 hover:text-amber-700 inline-block hover:bg-amber-50 rounded-xl transition cursor-pointer"
                                                                title="Edit Shakha"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(s)}
                                                                className="p-1.5 text-gray-400 hover:text-rose-600 inline-block hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                                                title="Delete Shakha"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 italic text-[11px] bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                                                            View only
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Nagars Tab Table */}
                    {currentTab === 'nagars' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                    <tr>
                                        <th className="p-4">Nagar Name</th>
                                        <th className="p-4">Parent Jila</th>
                                        <th className="p-4">Linked Shakhas</th>
                                        <th className="p-4">Toli Members (टोली संपर्क)</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-medium">
                                    {nagars.map((n) => {
                                        const toliList = getToliArray(n.toli);
                                        return (
                                            <tr key={n.id} className="hover:bg-amber-50/20 transition">
                                                <td className="p-4">
                                                    <div className="font-black text-gray-900 text-sm">
                                                        {n.nagar_name}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-gray-600">
                                                    <div className="font-bold text-gray-800">{n.jila?.jila_name || 'N/A'}</div>
                                                    <div className="text-[11px] text-gray-400">Vibhag: {n.jila?.vibhag?.vibhag_name || 'N/A'}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center space-x-1">
                                                        <Flag className="w-3.5 h-3.5 text-amber-600" />
                                                        <span>{n.shakhas_count ?? 0} Shakhas</span>
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {toliList.length === 0 ? (
                                                        <span className="text-gray-400 italic text-[11px]">No toli listed</span>
                                                    ) : (
                                                        <div className="space-y-1.5 max-w-xs">
                                                            {toliList.map((m, i) => (
                                                                <div key={i} className="flex items-center space-x-1.5 text-[11px]">
                                                                    <span className="bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md font-extrabold text-[10px] whitespace-nowrap">
                                                                        {toTitleCase(m.role)}:
                                                                    </span>
                                                                    <span className="font-bold text-gray-900">{m.name || 'N/A'}</span>
                                                                    {m.contact && (
                                                                        <a
                                                                            href={`tel:${m.contact}`}
                                                                            className="text-amber-700 hover:text-amber-900 font-mono text-[10px] flex items-center bg-amber-50 px-1.5 py-0.5 rounded ml-1 font-semibold"
                                                                        >
                                                                            <Phone className="w-2.5 h-2.5 mr-0.5" />
                                                                            {m.contact}
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    {canManageCurrentTab ? (
                                                        <div className="space-x-2">
                                                            <button
                                                                onClick={() => openEditModal(n)}
                                                                className="p-1.5 text-gray-600 hover:text-amber-700 inline-block hover:bg-amber-50 rounded-xl transition cursor-pointer"
                                                                title="Edit Nagar"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(n)}
                                                                className="p-1.5 text-gray-400 hover:text-rose-600 inline-block hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                                                title="Delete Nagar"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 italic text-[11px] bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                                                            View only
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Jilas Tab Table */}
                    {currentTab === 'jilas' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                    <tr>
                                        <th className="p-4">Jila Name</th>
                                        <th className="p-4">Parent Vibhag</th>
                                        <th className="p-4">Nagars Count</th>
                                        <th className="p-4">Toli Members (टोली संपर्क)</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-medium">
                                    {jilas.map((j) => {
                                        const toliList = getToliArray(j.toli);
                                        return (
                                            <tr key={j.id} className="hover:bg-amber-50/20 transition">
                                                <td className="p-4 font-black text-gray-900 text-sm">{j.jila_name}</td>
                                                <td className="p-4 text-gray-600">{j.vibhag?.vibhag_name || 'N/A'}</td>
                                                <td className="p-4">
                                                    <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-bold">
                                                        {j.nagars_count ?? 0} Nagars
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {toliList.length === 0 ? (
                                                        <span className="text-gray-400 italic text-[11px]">No toli listed</span>
                                                    ) : (
                                                        <div className="space-y-1.5 max-w-xs">
                                                            {toliList.map((m, i) => (
                                                                <div key={i} className="flex items-center space-x-1.5 text-[11px]">
                                                                    <span className="bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md font-extrabold text-[10px] whitespace-nowrap">
                                                                        {toTitleCase(m.role)}:
                                                                    </span>
                                                                    <span className="font-bold text-gray-900">{m.name || 'N/A'}</span>
                                                                    {m.contact && (
                                                                        <a
                                                                            href={`tel:${m.contact}`}
                                                                            className="text-amber-700 hover:text-amber-900 font-mono text-[10px] flex items-center bg-amber-50 px-1.5 py-0.5 rounded ml-1 font-semibold"
                                                                        >
                                                                            <Phone className="w-2.5 h-2.5 mr-0.5" />
                                                                            {m.contact}
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    {canManageCurrentTab ? (
                                                        <div className="space-x-2">
                                                            <button
                                                                onClick={() => openEditModal(j)}
                                                                className="p-1.5 text-gray-600 hover:text-amber-700 inline-block hover:bg-amber-50 rounded-xl transition cursor-pointer"
                                                                title="Edit Jila"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(j)}
                                                                className="p-1.5 text-gray-400 hover:text-rose-600 inline-block hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                                                title="Delete Jila"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 italic text-[11px] bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                                                            View only
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Vibhags Tab Table */}
                    {currentTab === 'vibhags' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                    <tr>
                                        <th className="p-4">Vibhag Name</th>
                                        <th className="p-4">Parent Prant</th>
                                        <th className="p-4">Jilas Count</th>
                                        <th className="p-4">Toli Members (टोली संपर्क)</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-medium">
                                    {vibhags.map((v) => {
                                        const toliList = getToliArray(v.toli);
                                        return (
                                            <tr key={v.id} className="hover:bg-amber-50/20 transition">
                                                <td className="p-4 font-black text-gray-900 text-sm">{v.vibhag_name}</td>
                                                <td className="p-4 text-gray-600">{v.prant?.prant_name || 'N/A'}</td>
                                                <td className="p-4">
                                                    <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-bold">
                                                        {v.jilas_count ?? 0} Jilas
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {toliList.length === 0 ? (
                                                        <span className="text-gray-400 italic text-[11px]">No toli listed</span>
                                                    ) : (
                                                        <div className="space-y-1.5 max-w-xs">
                                                            {toliList.map((m, i) => (
                                                                <div key={i} className="flex items-center space-x-1.5 text-[11px]">
                                                                    <span className="bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md font-extrabold text-[10px] whitespace-nowrap">
                                                                        {toTitleCase(m.role)}:
                                                                    </span>
                                                                    <span className="font-bold text-gray-900">{m.name || 'N/A'}</span>
                                                                    {m.contact && (
                                                                        <a
                                                                            href={`tel:${m.contact}`}
                                                                            className="text-amber-700 hover:text-amber-900 font-mono text-[10px] flex items-center bg-amber-50 px-1.5 py-0.5 rounded ml-1 font-semibold"
                                                                        >
                                                                            <Phone className="w-2.5 h-2.5 mr-0.5" />
                                                                            {m.contact}
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    {canManageCurrentTab ? (
                                                        <div className="space-x-2">
                                                            <button
                                                                onClick={() => openEditModal(v)}
                                                                className="p-1.5 text-gray-600 hover:text-amber-700 inline-block hover:bg-amber-50 rounded-xl transition cursor-pointer"
                                                                title="Edit Vibhag"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(v)}
                                                                className="p-1.5 text-gray-400 hover:text-rose-600 inline-block hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                                                title="Delete Vibhag"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 italic text-[11px] bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                                                            View only
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Prants Tab Table */}
                    {currentTab === 'prants' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                    <tr>
                                        <th className="p-4">Prant Name</th>
                                        <th className="p-4">Parent Kshetra</th>
                                        <th className="p-4">Vibhags Count</th>
                                        <th className="p-4">Toli Members (टोली संपर्क)</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-medium">
                                    {prants.map((p) => {
                                        const toliList = getToliArray(p.toli);
                                        return (
                                            <tr key={p.id} className="hover:bg-amber-50/20 transition">
                                                <td className="p-4 font-black text-gray-900 text-sm">{p.prant_name}</td>
                                                <td className="p-4 text-gray-600">{p.kshetra?.kshetra_name || 'N/A'}</td>
                                                <td className="p-4">
                                                    <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-bold">
                                                        {p.vibhags_count ?? 0} Vibhags
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {toliList.length === 0 ? (
                                                        <span className="text-gray-400 italic text-[11px]">No toli listed</span>
                                                    ) : (
                                                        <div className="space-y-1.5 max-w-xs">
                                                            {toliList.map((m, i) => (
                                                                <div key={i} className="flex items-center space-x-1.5 text-[11px]">
                                                                    <span className="bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md font-extrabold text-[10px] whitespace-nowrap">
                                                                        {toTitleCase(m.role)}:
                                                                    </span>
                                                                    <span className="font-bold text-gray-900">{m.name || 'N/A'}</span>
                                                                    {m.contact && (
                                                                        <a
                                                                            href={`tel:${m.contact}`}
                                                                            className="text-amber-700 hover:text-amber-900 font-mono text-[10px] flex items-center bg-amber-50 px-1.5 py-0.5 rounded ml-1 font-semibold"
                                                                        >
                                                                            <Phone className="w-2.5 h-2.5 mr-0.5" />
                                                                            {m.contact}
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    {canManageCurrentTab ? (
                                                        <div className="space-x-2">
                                                            <button
                                                                onClick={() => openEditModal(p)}
                                                                className="p-1.5 text-gray-600 hover:text-amber-700 inline-block hover:bg-amber-50 rounded-xl transition cursor-pointer"
                                                                title="Edit Prant"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(p)}
                                                                className="p-1.5 text-gray-400 hover:text-rose-600 inline-block hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                                                title="Delete Prant"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 italic text-[11px] bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                                                            View only
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Kshetras Tab Table */}
                    {currentTab === 'kshetras' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                    <tr>
                                        <th className="p-4">Kshetra Name</th>
                                        <th className="p-4">Prants Count</th>
                                        <th className="p-4">Toli Members (टोली संपर्क)</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-medium">
                                    {kshetras.map((k) => {
                                        const toliList = getToliArray(k.toli);
                                        return (
                                            <tr key={k.id} className="hover:bg-amber-50/20 transition">
                                                <td className="p-4 font-black text-gray-900 text-sm">{k.kshetra_name}</td>
                                                <td className="p-4">
                                                    <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-bold">
                                                        {k.prants_count ?? 0} Prants
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {toliList.length === 0 ? (
                                                        <span className="text-gray-400 italic text-[11px]">No toli listed</span>
                                                    ) : (
                                                        <div className="space-y-1.5 max-w-xs">
                                                            {toliList.map((m, i) => (
                                                                <div key={i} className="flex items-center space-x-1.5 text-[11px]">
                                                                    <span className="bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md font-extrabold text-[10px] whitespace-nowrap">
                                                                        {toTitleCase(m.role)}:
                                                                    </span>
                                                                    <span className="font-bold text-gray-900">{m.name || 'N/A'}</span>
                                                                    {m.contact && (
                                                                        <a
                                                                            href={`tel:${m.contact}`}
                                                                            className="text-amber-700 hover:text-amber-900 font-mono text-[10px] flex items-center bg-amber-50 px-1.5 py-0.5 rounded ml-1 font-semibold"
                                                                        >
                                                                            <Phone className="w-2.5 h-2.5 mr-0.5" />
                                                                            {m.contact}
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    {canManageCurrentTab ? (
                                                        <div className="space-x-2">
                                                            <button
                                                                onClick={() => openEditModal(k)}
                                                                className="p-1.5 text-gray-600 hover:text-amber-700 inline-block hover:bg-amber-50 rounded-xl transition cursor-pointer"
                                                                title="Edit Kshetra"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(k)}
                                                                className="p-1.5 text-gray-400 hover:text-rose-600 inline-block hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                                                title="Delete Kshetra"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 italic text-[11px] bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                                                            View only
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Add / Edit Unit Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 my-8 max-h-[92vh] overflow-y-auto">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                <h3 className="font-extrabold text-gray-900 text-lg flex items-center space-x-2">
                                    <Building2 className="w-5 h-5 text-amber-600" />
                                    <span>
                                        {editingUnit ? `Edit ${currentTabConfig.singular.toUpperCase()}` : `Create New ${currentTabConfig.singular.toUpperCase()}`}
                                    </span>
                                </h3>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 font-bold transition cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                                {/* Unit specific parent selector */}
                                {currentTab === 'prants' && (
                                    <div>
                                        <label className="block font-bold text-gray-700 uppercase mb-1">Parent Kshetra (क्षेत्र) *</label>
                                        <select
                                            value={data.kshetra_id}
                                            onChange={(e) => setData('kshetra_id', e.target.value)}
                                            className="w-full p-2.5 border border-gray-300 rounded-xl font-semibold focus:ring-2 focus:ring-amber-500 bg-white"
                                            required
                                        >
                                            <option value="">Select Kshetra</option>
                                            {kshetras.map((k) => (
                                                <option key={k.id} value={k.id}>{k.kshetra_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {currentTab === 'vibhags' && (
                                    <div>
                                        <label className="block font-bold text-gray-700 uppercase mb-1">Parent Prant (प्रान्त) *</label>
                                        <select
                                            value={data.prant_id}
                                            onChange={(e) => setData('prant_id', e.target.value)}
                                            className="w-full p-2.5 border border-gray-300 rounded-xl font-semibold focus:ring-2 focus:ring-amber-500 bg-white"
                                            required
                                        >
                                            <option value="">Select Prant</option>
                                            {prants.map((p) => (
                                                <option key={p.id} value={p.id}>{p.prant_name} ({p.kshetra?.kshetra_name})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {currentTab === 'jilas' && (
                                    <div>
                                        <label className="block font-bold text-gray-700 uppercase mb-1">Parent Vibhag (विभाग) *</label>
                                        <select
                                            value={data.vibhag_id}
                                            onChange={(e) => setData('vibhag_id', e.target.value)}
                                            className="w-full p-2.5 border border-gray-300 rounded-xl font-semibold focus:ring-2 focus:ring-amber-500 bg-white"
                                            required
                                        >
                                            <option value="">Select Vibhag</option>
                                            {vibhags.map((v) => (
                                                <option key={v.id} value={v.id}>{v.vibhag_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {currentTab === 'nagars' && (
                                    <div>
                                        <label className="block font-bold text-gray-700 uppercase mb-1">Parent Jila (जिला) *</label>
                                        <select
                                            value={data.jila_id}
                                            onChange={(e) => setData('jila_id', e.target.value)}
                                            className="w-full p-2.5 border border-gray-300 rounded-xl font-semibold focus:ring-2 focus:ring-amber-500 bg-white"
                                            required
                                        >
                                            <option value="">Select Jila</option>
                                            {jilas.map((j) => (
                                                <option key={j.id} value={j.id}>{j.jila_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {currentTab === 'shakhas' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block font-bold text-gray-700 uppercase mb-1">Parent Nagar (नगर) *</label>
                                            <select
                                                value={data.nagar_id}
                                                onChange={(e) => setData('nagar_id', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-xl font-semibold focus:ring-2 focus:ring-amber-500 bg-white"
                                                required
                                            >
                                                <option value="">Select Nagar</option>
                                                {nagars.map((n) => (
                                                    <option key={n.id} value={n.id}>{n.nagar_name} ({n.jila?.jila_name})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block font-bold text-gray-700 uppercase mb-1">Age Group (आयु वर्ग) *</label>
                                            <select
                                                value={data.aayu_varg}
                                                onChange={(e) => setData('aayu_varg', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-xl font-semibold focus:ring-2 focus:ring-amber-500 bg-white"
                                            >
                                                <option value="Baal">Baal (बाल)</option>
                                                <option value="Mahavidhyalay">Mahavidhyalay (महाविद्यालय / तरुण)</option>
                                                <option value="Vyavsai">Vyavsai (व्यवसायी)</option>
                                                <option value="Praurh">Praurh (प्रौढ़)</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Unit Name */}
                                <div>
                                    <label className="block font-bold text-gray-700 uppercase mb-1">
                                        {currentTabConfig.singular.toUpperCase()} Name (नाम) *
                                    </label>
                                    <input
                                        type="text"
                                        value={
                                            currentTab === 'kshetras'
                                                ? data.kshetra_name
                                                : currentTab === 'prants'
                                                ? data.prant_name
                                                : currentTab === 'vibhags'
                                                ? data.vibhag_name
                                                : currentTab === 'jilas'
                                                ? data.jila_name
                                                : currentTab === 'nagars'
                                                ? data.nagar_name
                                                : data.shakha_name
                                        }
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (currentTab === 'kshetras') setData('kshetra_name', val);
                                            else if (currentTab === 'prants') setData('prant_name', val);
                                            else if (currentTab === 'vibhags') setData('vibhag_name', val);
                                            else if (currentTab === 'jilas') setData('jila_name', val);
                                            else if (currentTab === 'nagars') setData('nagar_name', val);
                                            else setData('shakha_name', val);
                                        }}
                                        placeholder={`Enter ${currentTabConfig.singular} name...`}
                                        className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500"
                                        required
                                    />
                                </div>

                                {currentTab === 'shakhas' && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block font-bold text-gray-700 uppercase mb-1">Meeting Frequency *</label>
                                            <select
                                                value={data.type}
                                                onChange={(e) => setData('type', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-xl font-semibold focus:ring-2 focus:ring-amber-500 bg-white"
                                            >
                                                <option value="dainik">Dainik (दैनिक - Daily)</option>
                                                <option value="saptahik">Saptahik (साप्ताहिक - Weekly)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block font-bold text-gray-700 uppercase mb-1">Status *</label>
                                            <select
                                                value={data.status}
                                                onChange={(e) => setData('status', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-xl font-semibold focus:ring-2 focus:ring-amber-500 bg-white"
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Toli Members Section */}
                                <div className="p-4 bg-orange-50/70 border border-amber-200 rounded-2xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2 text-amber-900">
                                            <Users className="w-4 h-4 text-amber-700" />
                                            <span className="font-extrabold text-xs">
                                                Toli Members & Contacts (टोली सदस्य व संपर्क सूत्र)
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => addToliRow('')}
                                            className="text-[11px] font-bold text-amber-700 hover:text-amber-900 bg-white px-2.5 py-1 rounded-lg border border-amber-300 transition cursor-pointer flex items-center space-x-1 shadow-2xs"
                                        >
                                            <Plus className="w-3 h-3" />
                                            <span>Add Member</span>
                                        </button>
                                    </div>

                                    {/* Role suggestions chips */}
                                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                        <span className="text-gray-500 font-bold">Quick Add Role:</span>
                                        {getRoleSuggestionsForTab(currentTab).map((roleTitle) => (
                                            <button
                                                key={roleTitle}
                                                type="button"
                                                onClick={() => addToliRow(roleTitle)}
                                                className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md font-bold transition cursor-pointer shadow-2xs"
                                            >
                                                +{roleTitle}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Column Labels for desktop */}
                                    <div className="hidden sm:grid grid-cols-12 gap-2 px-1 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
                                        <div className="col-span-4">Role Title / Designation</div>
                                        <div className="col-span-4">Member Name</div>
                                        <div className="col-span-3">Contact / Phone</div>
                                        <div className="col-span-1 text-right">Action</div>
                                    </div>

                                    {/* Members dynamic list */}
                                    <div className="space-y-2.5 pt-1">
                                        {data.toli_members.map((member, index) => (
                                            <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white p-2.5 rounded-xl border border-amber-200/80 shadow-2xs items-center">
                                                <div className="sm:col-span-4">
                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5 sm:hidden">
                                                        Designation / Title
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={member.role}
                                                        onChange={(e) => updateToliMember(index, 'role', e.target.value)}
                                                        placeholder="e.g. Mukhya Shikshak"
                                                        className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-800 bg-amber-50/30 focus:bg-white focus:ring-2 focus:ring-amber-500"
                                                    />
                                                </div>
                                                <div className="sm:col-span-4">
                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5 sm:hidden">
                                                        Member Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={member.name}
                                                        onChange={(e) => updateToliMember(index, 'name', e.target.value)}
                                                        placeholder="Full Name (e.g. Ramesh Verma)"
                                                        className="w-full p-2 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                                                    />
                                                </div>
                                                <div className="sm:col-span-3">
                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5 sm:hidden">
                                                        Contact / Phone
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={member.contact}
                                                        onChange={(e) => updateToliMember(index, 'contact', e.target.value)}
                                                        placeholder="Phone (e.g. +91 98260XXXXX)"
                                                        className="w-full p-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-amber-500"
                                                    />
                                                </div>
                                                <div className="sm:col-span-1 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeToliMember(index)}
                                                        className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition cursor-pointer"
                                                        title="Remove Member"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-extrabold shadow-md shadow-amber-500/20 transition cursor-pointer"
                                    >
                                        {processing ? 'Saving...' : editingUnit ? 'Update Unit' : 'Create Unit'}
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
