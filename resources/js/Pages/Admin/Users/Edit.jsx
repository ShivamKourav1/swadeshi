import React, { useState, useMemo } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowLeft,
    UserCheck,
    Shield,
    Store,
    Truck,
    Building2,
    Lock,
    Save,
    Trash2,
    CheckCircle2,
    MapPin,
} from 'lucide-react';

export default function Edit({ user, roles, kshetras, prants, vibhags, jilas, nagars, shakhas }) {
    const profile = user.profile || {};
    const initialRoleIds = user.roles ? user.roles.map((r) => r.id) : [];

    const { data, setData, put, processing, errors } = useForm({
        name: user.name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'karyakarta',
        role_ids: initialRoleIds,
        phone: user.phone || '',
        status: user.status || 'active',
        bio: profile.bio || '',
        business_name: profile.business_name || '',
        business_address: profile.business_address || '',
        vehicle_type: profile.vehicle_type || '',
        vehicle_number: profile.vehicle_number || '',
        kshetra_id: profile.kshetra_id ? String(profile.kshetra_id) : '',
        prant_id: profile.prant_id ? String(profile.prant_id) : '',
        vibhag_id: profile.vibhag_id ? String(profile.vibhag_id) : '',
        jila_id: profile.jila_id ? String(profile.jila_id) : '',
        nagar_id: profile.nagar_id ? String(profile.nagar_id) : '',
        shakha_id: profile.shakha_id ? String(profile.shakha_id) : '',
    });

    // Cascading filters for organizational units
    const filteredPrants = useMemo(() => {
        if (!data.kshetra_id) return prants;
        return prants.filter((p) => String(p.kshetra_id) === String(data.kshetra_id));
    }, [data.kshetra_id, prants]);

    const filteredVibhags = useMemo(() => {
        if (!data.prant_id) return vibhags;
        return vibhags.filter((v) => String(v.prant_id) === String(data.prant_id));
    }, [data.prant_id, vibhags]);

    const filteredJilas = useMemo(() => {
        if (!data.vibhag_id) return jilas;
        return jilas.filter((j) => String(j.vibhag_id) === String(data.vibhag_id));
    }, [data.vibhag_id, jilas]);

    const filteredNagars = useMemo(() => {
        if (!data.jila_id) return nagars;
        return nagars.filter((n) => String(n.jila_id) === String(data.jila_id));
    }, [data.jila_id, nagars]);

    const filteredShakhas = useMemo(() => {
        if (!data.nagar_id) return shakhas;
        return shakhas.filter((s) => String(s.nagar_id) === String(data.nagar_id));
    }, [data.nagar_id, shakhas]);

    const toggleRoleId = (roleId) => {
        setData((prev) => {
            const exists = prev.role_ids.includes(roleId);
            const nextIds = exists
                ? prev.role_ids.filter((id) => id !== roleId)
                : [...prev.role_ids, roleId];

            let newRole = prev.role;
            if (!exists) {
                const checked = roles.find((r) => r.id === roleId);
                if (checked && (prev.role === 'customer' || !prev.role)) {
                    newRole = checked.name.includes('karyakarta') ? 'karyakarta' : checked.name;
                }
            } else if (exists && nextIds.length > 0) {
                const remaining = roles.find((r) => nextIds.includes(r.id));
                if (remaining && (prev.role === 'customer' || !prev.role)) {
                    newRole = remaining.name.includes('karyakarta') ? 'karyakarta' : remaining.name;
                }
            }

            return {
                ...prev,
                role: newRole,
                role_ids: nextIds,
            };
        });
    };

    const handlePrimaryRoleChange = (e) => {
        const newRole = e.target.value;
        setData((prev) => {
            const matched = roles.find((r) => r.name === newRole);
            let updatedIds = [...prev.role_ids];
            if (matched && !updatedIds.includes(matched.id)) {
                updatedIds.push(matched.id);
            }
            return {
                ...prev,
                role: newRole,
                role_ids: updatedIds,
            };
        });
    };

    const clearJurisdiction = () => {
        setData((prev) => ({
            ...prev,
            kshetra_id: '',
            prant_id: '',
            vibhag_id: '',
            jila_id: '',
            nagar_id: '',
            shakha_id: '',
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('admin.users.update', user.id));
    };

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete user '${user.name}'? This action cannot be undone.`)) {
            router.delete(route('admin.users.destroy', user.id));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Admin - Edit User: ${user.name}`} />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Back Link */}
                <div className="flex justify-between items-center">
                    <Link
                        href={route('admin.users.index')}
                        className="inline-flex items-center text-xs text-gray-500 hover:text-purple-600 font-bold transition"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to User Directory
                    </Link>

                    <button
                        type="button"
                        onClick={handleDelete}
                        className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center space-x-1 px-3 py-1.5 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                    >
                        <Trash2 className="w-4 h-4 mr-1" />
                        <span>Delete User</span>
                    </button>
                </div>

                <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-6 border-b border-gray-100">
                        <div>
                            <div className="flex items-center space-x-2 text-purple-700 text-xs font-bold uppercase tracking-wider mb-0.5">
                                <UserCheck className="w-4 h-4" />
                                <span>User Profile & Jurisdiction Editor</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                                Edit Account: {user.name}
                            </h1>
                            <div className="text-xs text-gray-400 font-mono mt-0.5">ID: #{user.id} | {user.email}</div>
                        </div>

                        <div>
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                                    user.status === 'active'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-rose-100 text-rose-800'
                                }`}
                            >
                                Status: {user.status}
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 pt-6 text-xs">
                        {/* 1. Basic Account Information */}
                        <div className="space-y-4">
                            <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center space-x-2">
                                <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                                <span>1. Basic Account Information</span>
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-bold text-gray-700 uppercase mb-1">Full Name *</label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-400"
                                    />
                                    {errors.name && <div className="text-rose-600 mt-1">{errors.name}</div>}
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 uppercase mb-1">Email Address *</label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-400"
                                    />
                                    {errors.email && <div className="text-rose-600 mt-1">{errors.email}</div>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block font-bold text-gray-700 uppercase mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="+91 9826012345"
                                        className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-400"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 uppercase mb-1">Account Status *</label>
                                    <select
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-400"
                                    >
                                        <option value="active">Active (सक्रिय)</option>
                                        <option value="inactive">Inactive (निष्क्रिय)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 uppercase mb-1">
                                        Update Password (Leave blank to keep current)
                                    </label>
                                    <input
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Enter new password (min 8 chars)"
                                        className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-400"
                                    />
                                    {errors.password && <div className="text-rose-600 mt-1">{errors.password}</div>}
                                </div>
                            </div>
                        </div>

                        {/* 2. Roles & Rights Assignment */}
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center space-x-2">
                                    <Shield className="w-4 h-4 text-indigo-600" />
                                    <span>2. Role & Privileges Assignment</span>
                                </h2>

                                <span className="text-[11px] text-gray-400 font-medium">
                                    Current Primary: <strong className="text-purple-900 uppercase">{data.role}</strong>
                                </span>
                            </div>

                            {/* Quick Role Selection Presets */}
                            <div>
                                <label className="block font-bold text-gray-600 text-[11px] uppercase mb-1.5">
                                    Quick Role Shortcuts (त्वरित भूमिका चयन)
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const dealerRole = roles.find((r) => r.name === 'dealer');
                                            setData((prev) => ({
                                                ...prev,
                                                role: 'dealer',
                                                role_ids: dealerRole && !prev.role_ids.includes(dealerRole.id)
                                                    ? [...prev.role_ids, dealerRole.id]
                                                    : prev.role_ids,
                                            }));
                                        }}
                                        className={`px-3 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 border transition cursor-pointer ${
                                            data.role === 'dealer'
                                                ? 'bg-blue-700 text-white border-blue-700 shadow-md ring-2 ring-blue-300'
                                                : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200'
                                        }`}
                                    >
                                        <Store className="w-3.5 h-3.5" />
                                        <span>Dealer / Store (विक्रेता बनाएं)</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            const customerRole = roles.find((r) => r.name === 'customer');
                                            setData((prev) => ({
                                                ...prev,
                                                role: 'customer',
                                                role_ids: customerRole && !prev.role_ids.includes(customerRole.id)
                                                    ? [...prev.role_ids, customerRole.id]
                                                    : prev.role_ids,
                                            }));
                                        }}
                                        className={`px-3 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 border transition cursor-pointer ${
                                            data.role === 'customer'
                                                ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                                        }`}
                                    >
                                        <UserCheck className="w-3.5 h-3.5" />
                                        <span>Customer (ग्राहक)</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            const deliveryRole = roles.find((r) => r.name === 'delivery_partner');
                                            setData((prev) => ({
                                                ...prev,
                                                role: 'delivery_partner',
                                                role_ids: deliveryRole && !prev.role_ids.includes(deliveryRole.id)
                                                    ? [...prev.role_ids, deliveryRole.id]
                                                    : prev.role_ids,
                                            }));
                                        }}
                                        className={`px-3 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 border transition cursor-pointer ${
                                            data.role === 'delivery_partner'
                                                ? 'bg-orange-600 text-white border-orange-600 shadow-md ring-2 ring-orange-300'
                                                : 'bg-orange-50 hover:bg-orange-100 text-orange-900 border-orange-200'
                                        }`}
                                    >
                                        <Truck className="w-3.5 h-3.5" />
                                        <span>Delivery Partner (वितरण साथी)</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            const karyakartaRole = roles.find((r) => r.name === 'karyakarta') || roles.find((r) => r.name.includes('karyakarta'));
                                            setData((prev) => ({
                                                ...prev,
                                                role: 'karyakarta',
                                                role_ids: karyakartaRole && !prev.role_ids.includes(karyakartaRole.id)
                                                    ? [...prev.role_ids, karyakartaRole.id]
                                                    : prev.role_ids,
                                            }));
                                        }}
                                        className={`px-3 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 border transition cursor-pointer ${
                                            data.role === 'karyakarta' || data.role.includes('karyakarta')
                                                ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
                                                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                                        }`}
                                    >
                                        <Building2 className="w-3.5 h-3.5" />
                                        <span>Karyakarta (कार्यकर्ता)</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 uppercase mb-1">Primary Role *</label>
                                <select
                                    value={data.role}
                                    onChange={handlePrimaryRoleChange}
                                    className="w-full p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl text-xs font-extrabold focus:ring-2 focus:ring-indigo-400"
                                >
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.name}>
                                            {r.name === 'dealer' ? '🏪 ' : r.name === 'delivery_partner' ? '🚚 ' : r.name === 'admin' ? '🛡️ ' : ''}
                                            {r.display_name} ({r.name})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 uppercase mb-2">
                                    Assigned Roles (Multi-Role Support)
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                    {roles.map((r) => {
                                        const isChecked = data.role_ids.includes(r.id);
                                        const isDealer = r.name === 'dealer';
                                        return (
                                            <div
                                                key={r.id}
                                                onClick={() => toggleRoleId(r.id)}
                                                className={`p-3 rounded-xl border flex items-start space-x-2.5 transition cursor-pointer select-none ${
                                                    isChecked
                                                        ? isDealer
                                                            ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold ring-1 ring-blue-300'
                                                            : 'bg-purple-50 border-purple-300 text-purple-900 font-bold'
                                                        : isDealer
                                                            ? 'bg-blue-50/30 border-blue-200 text-blue-900 hover:bg-blue-50/70'
                                                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => {}}
                                                    className={`mt-0.5 rounded cursor-pointer ${
                                                        isDealer ? 'text-blue-600 focus:ring-blue-400' : 'text-purple-600 focus:ring-purple-400'
                                                    }`}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs flex items-center gap-1 font-bold">
                                                        {isDealer && <Store className="w-3.5 h-3.5 text-blue-700 flex-shrink-0" />}
                                                        <span className="truncate">{r.display_name}</span>
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 font-mono">{r.name}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* 3. Organizational Jurisdiction Scope */}
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <div className="flex justify-between items-center">
                                <h2 className="text-sm font-extrabold text-amber-900 uppercase tracking-wider flex items-center space-x-2">
                                    <Building2 className="w-4 h-4 text-amber-600" />
                                    <span>3. Organizational Jurisdiction Scope (संगठनात्मक अधिकार क्षेत्र)</span>
                                </h2>

                                <button
                                    type="button"
                                    onClick={clearJurisdiction}
                                    className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                                >
                                    Clear Scope (Set Global)
                                </button>
                            </div>
                            <p className="text-gray-500 text-[11px]">
                                Assign the geographical boundary for this user. A user assigned to a Jila can manage nagars and shakhas within that Jila, but cannot manage outside units.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-amber-50/40 p-4 rounded-2xl border border-amber-200">
                                {/* Kshetra */}
                                <div>
                                    <label className="block font-bold text-amber-900 mb-1">1. Kshetra (क्षेत्र)</label>
                                    <select
                                        value={data.kshetra_id}
                                        onChange={(e) => {
                                            setData((prev) => ({
                                                ...prev,
                                                kshetra_id: e.target.value,
                                                prant_id: '',
                                                vibhag_id: '',
                                                jila_id: '',
                                                nagar_id: '',
                                                shakha_id: '',
                                            }));
                                        }}
                                        className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="">-- All / Not Restricted --</option>
                                        {kshetras.map((k) => (
                                            <option key={k.id} value={k.id}>
                                                {k.kshetra_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Prant */}
                                <div>
                                    <label className="block font-bold text-amber-900 mb-1">2. Prant (प्रान्त)</label>
                                    <select
                                        value={data.prant_id}
                                        onChange={(e) => {
                                            setData((prev) => ({
                                                ...prev,
                                                prant_id: e.target.value,
                                                vibhag_id: '',
                                                jila_id: '',
                                                nagar_id: '',
                                                shakha_id: '',
                                            }));
                                        }}
                                        className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="">-- All / Not Restricted --</option>
                                        {filteredPrants.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.prant_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Vibhag */}
                                <div>
                                    <label className="block font-bold text-amber-900 mb-1">3. Vibhag (विभाग)</label>
                                    <select
                                        value={data.vibhag_id}
                                        onChange={(e) => {
                                            setData((prev) => ({
                                                ...prev,
                                                vibhag_id: e.target.value,
                                                jila_id: '',
                                                nagar_id: '',
                                                shakha_id: '',
                                            }));
                                        }}
                                        className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="">-- All / Not Restricted --</option>
                                        {filteredVibhags.map((v) => (
                                            <option key={v.id} value={v.id}>
                                                {v.vibhag_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Jila */}
                                <div>
                                    <label className="block font-bold text-amber-900 mb-1">4. Jila (जिला)</label>
                                    <select
                                        value={data.jila_id}
                                        onChange={(e) => {
                                            setData((prev) => ({
                                                ...prev,
                                                jila_id: e.target.value,
                                                nagar_id: '',
                                                shakha_id: '',
                                            }));
                                        }}
                                        className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="">-- All / Not Restricted --</option>
                                        {filteredJilas.map((j) => (
                                            <option key={j.id} value={j.id}>
                                                {j.jila_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Nagar */}
                                <div>
                                    <label className="block font-bold text-amber-900 mb-1">5. Nagar (नगर)</label>
                                    <select
                                        value={data.nagar_id}
                                        onChange={(e) => {
                                            setData((prev) => ({
                                                ...prev,
                                                nagar_id: e.target.value,
                                                shakha_id: '',
                                            }));
                                        }}
                                        className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="">-- All / Not Restricted --</option>
                                        {filteredNagars.map((n) => (
                                            <option key={n.id} value={n.id}>
                                                {n.nagar_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Shakha */}
                                <div>
                                    <label className="block font-bold text-amber-900 mb-1">6. Shakha (शाखा)</label>
                                    <select
                                        value={data.shakha_id}
                                        onChange={(e) => setData('shakha_id', e.target.value)}
                                        className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="">-- All / Not Restricted --</option>
                                        {filteredShakhas.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.shakha_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 4. Business & Delivery Metadata */}
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center space-x-2">
                                <Store className="w-4 h-4 text-emerald-600" />
                                <span>4. Business & Operational Profiles (Optional)</span>
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Store / Business Name</label>
                                    <input
                                        type="text"
                                        value={data.business_name}
                                        onChange={(e) => setData('business_name', e.target.value)}
                                        placeholder="e.g. Malwa Sangh Bhandar"
                                        className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-400"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Business Address</label>
                                    <input
                                        type="text"
                                        value={data.business_address}
                                        onChange={(e) => setData('business_address', e.target.value)}
                                        placeholder="e.g. 101 Keshav Kunj, Main Road"
                                        className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Vehicle Type (For Delivery Agent)</label>
                                    <input
                                        type="text"
                                        value={data.vehicle_type}
                                        onChange={(e) => setData('vehicle_type', e.target.value)}
                                        placeholder="e.g. Delivery Van / Two Wheeler"
                                        className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-400"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Vehicle Plate / Registration #</label>
                                    <input
                                        type="text"
                                        value={data.vehicle_number}
                                        onChange={(e) => setData('vehicle_number', e.target.value)}
                                        placeholder="e.g. MP-09-AB-1234"
                                        className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-400"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Bio / Notes</label>
                                <textarea
                                    rows="2"
                                    value={data.bio}
                                    onChange={(e) => setData('bio', e.target.value)}
                                    placeholder="Add background notes or responsibilities..."
                                    className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-400"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-4 border-t border-gray-200">
                            <button
                                type="submit"
                                disabled={processing}
                                className="bg-purple-900 hover:bg-purple-950 text-white font-black text-sm px-8 py-3.5 rounded-2xl transition flex items-center space-x-2 shadow-lg cursor-pointer"
                            >
                                <Save className="w-4 h-4" />
                                <span>{processing ? 'Saving Changes...' : 'Save User & Scope Changes'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
