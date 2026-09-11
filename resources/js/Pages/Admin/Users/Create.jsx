import React, { useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft, UserPlus, Shield, Store, Truck, Building2 } from 'lucide-react';

export default function Create({
    roles = [],
    kshetras = [],
    prants = [],
    vibhags = [],
    jilas = [],
    nagars = [],
    shakhas = [],
}) {
    const defaultRoleId = roles.find((r) => r.name === 'karyakarta')?.id || roles[0]?.id || 1;

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        role: 'karyakarta',
        role_ids: defaultRoleId ? [defaultRoleId] : [],
        phone: '',
        bio: '',
        business_name: '',
        business_address: '',
        vehicle_type: '',
        vehicle_number: '',
        kshetra_id: '',
        prant_id: '',
        vibhag_id: '',
        jila_id: '',
        nagar_id: '',
        shakha_id: '',
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
            return {
                ...prev,
                role_ids: exists
                    ? prev.role_ids.filter((id) => id !== roleId)
                    : [...prev.role_ids, roleId],
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

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.users.store'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Admin - Onboard User & Assign Roles" />

            <div className="max-w-4xl mx-auto space-y-6">
                <Link
                    href={route('admin.users.index')}
                    className="inline-flex items-center text-xs text-gray-500 hover:text-purple-600 font-bold transition"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to User Directory
                </Link>

                <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm">
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 mb-1 flex items-center space-x-2">
                        <UserPlus className="w-6 h-6 text-purple-700" />
                        <span>Onboard User & Assign Privileges</span>
                    </h1>
                    <p className="text-xs text-gray-500 mb-6">
                        Create user credentials, assign functional roles (Admin, Karyakarta, Dealer, Delivery Partner), and restrict organizational jurisdiction.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6 text-xs">
                        {/* 1. Account Credentials */}
                        <div className="space-y-4">
                            <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center space-x-2">
                                <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                                <span>1. Basic Account Credentials</span>
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-bold text-gray-700 uppercase mb-1">Full Name *</label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="E.g. Vikramaditya Sharma"
                                        className="w-full p-3 border border-gray-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-400"
                                    />
                                    {errors.name && <div className="text-rose-600 mt-1">{errors.name}</div>}
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 uppercase mb-1">Login Email Address *</label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="user@ecommerce.com"
                                        className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-400"
                                    />
                                    {errors.email && <div className="text-rose-600 mt-1">{errors.email}</div>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-bold text-gray-700 uppercase mb-1">Initial Password *</label>
                                    <input
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Minimum 8 characters"
                                        className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-400"
                                    />
                                    {errors.password && <div className="text-rose-600 mt-1">{errors.password}</div>}
                                </div>

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
                            </div>
                        </div>

                        {/* 2. Roles Assignment */}
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center space-x-2">
                                <Shield className="w-4 h-4 text-indigo-600" />
                                <span>2. Role & Privileges Assignment</span>
                            </h2>

                            <div>
                                <label className="block font-bold text-gray-700 uppercase mb-1">Primary Role *</label>
                                <select
                                    value={data.role}
                                    onChange={handlePrimaryRoleChange}
                                    className="w-full p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl text-xs font-extrabold focus:ring-2 focus:ring-indigo-400"
                                >
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.name}>
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
                                        return (
                                            <div
                                                key={r.id}
                                                onClick={() => toggleRoleId(r.id)}
                                                className={`p-3 rounded-xl border flex items-start space-x-2 transition cursor-pointer select-none ${
                                                    isChecked
                                                        ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold'
                                                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => {}}
                                                    className="mt-0.5 rounded text-purple-600 focus:ring-purple-400 cursor-pointer"
                                                />
                                                <div>
                                                    <div className="text-xs">{r.display_name}</div>
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
                            <h2 className="text-sm font-extrabold text-amber-900 uppercase tracking-wider flex items-center space-x-2">
                                <Building2 className="w-4 h-4 text-amber-600" />
                                <span>3. Organizational Jurisdiction Scope (Optional)</span>
                            </h2>
                            <p className="text-gray-500 text-[11px]">
                                Leave unselected for Global scope. If assigned to a unit (e.g. Jila), this user will only have rights within that specific unit.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-amber-50/40 p-4 rounded-2xl border border-amber-200">
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
                                        <option value="">-- All / Global --</option>
                                        {kshetras.map((k) => (
                                            <option key={k.id} value={k.id}>
                                                {k.kshetra_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

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
                                        <option value="">-- All / Global --</option>
                                        {filteredPrants.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.prant_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

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
                                        <option value="">-- All / Global --</option>
                                        {filteredVibhags.map((v) => (
                                            <option key={v.id} value={v.id}>
                                                {v.vibhag_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

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
                                        <option value="">-- All / Global --</option>
                                        {filteredJilas.map((j) => (
                                            <option key={j.id} value={j.id}>
                                                {j.jila_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

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
                                        <option value="">-- All / Global --</option>
                                        {filteredNagars.map((n) => (
                                            <option key={n.id} value={n.id}>
                                                {n.nagar_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-amber-900 mb-1">6. Shakha (शाखा)</label>
                                    <select
                                        value={data.shakha_id}
                                        onChange={(e) => setData('shakha_id', e.target.value)}
                                        className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="">-- All / Global --</option>
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
                                <span>4. Business & Delivery Metadata (Optional)</span>
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Store / Business Name</label>
                                    <input
                                        type="text"
                                        value={data.business_name}
                                        onChange={(e) => setData('business_name', e.target.value)}
                                        placeholder="E.g. Apex Electronics Ltd"
                                        className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-400"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Business Address</label>
                                    <input
                                        type="text"
                                        value={data.business_address}
                                        onChange={(e) => setData('business_address', e.target.value)}
                                        placeholder="120 Commerce Way, Suite 400"
                                        className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Vehicle Type (For Delivery Partner)</label>
                                    <input
                                        type="text"
                                        value={data.vehicle_type}
                                        onChange={(e) => setData('vehicle_type', e.target.value)}
                                        placeholder="E.g. Delivery Van / Cargo Bike"
                                        className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-400"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Vehicle Plate / Registration #</label>
                                    <input
                                        type="text"
                                        value={data.vehicle_number}
                                        onChange={(e) => setData('vehicle_number', e.target.value)}
                                        placeholder="E.g. MP-09-AB-1234"
                                        className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-400"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Bio / Role Notes</label>
                                <textarea
                                    rows="2"
                                    value={data.bio}
                                    onChange={(e) => setData('bio', e.target.value)}
                                    placeholder="Add background notes or responsibilities..."
                                    className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-400"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-200">
                            <button
                                type="submit"
                                disabled={processing}
                                className="bg-purple-900 hover:bg-purple-950 text-white font-black text-sm px-8 py-3.5 rounded-2xl transition flex items-center space-x-2 shadow-lg cursor-pointer"
                            >
                                <UserPlus className="w-4 h-4" />
                                <span>{processing ? 'Onboarding User...' : 'Complete User Onboarding'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
