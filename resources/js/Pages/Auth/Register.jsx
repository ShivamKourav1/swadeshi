import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Store, UserPlus, Building2, Award } from 'lucide-react';

export default function Register({ orgData }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'customer',
        phone: '',
        business_name: '',
        vehicle_type: '',
        vehicle_number: '',
        kshetra_id: '',
        prant_id: '',
        vibhag_id: '',
        jila_id: '',
        nagar_id: '',
        shakha_id: '',
    });

    // Cascaded filtering
    const filteredPrants = data.kshetra_id
        ? orgData?.prants?.filter((p) => String(p.kshetra_id) === String(data.kshetra_id))
        : orgData?.prants || [];

    const filteredVibhags = data.prant_id
        ? orgData?.vibhags?.filter((v) => String(v.prant_id) === String(data.prant_id))
        : orgData?.vibhags || [];

    const filteredJilas = data.vibhag_id
        ? orgData?.jilas?.filter((j) => String(j.vibhag_id) === String(data.vibhag_id))
        : orgData?.jilas || [];

    const filteredNagars = data.jila_id
        ? orgData?.nagars?.filter((n) => String(n.jila_id) === String(data.jila_id))
        : orgData?.nagars || [];

    const filteredShakhas = data.nagar_id
        ? orgData?.shakhas?.filter((s) => String(s.nagar_id) === String(data.nagar_id))
        : orgData?.shakhas || [];

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('register'));
    };

    return (
        <div className="min-h-screen bg-orange-50/40 flex items-center justify-center p-4">
            <Head title="Register Account" />

            <div className="max-w-lg w-full bg-white rounded-3xl border border-amber-100 p-8 shadow-xl space-y-6">
                <div className="text-center">
                    <Link href="/" className="inline-flex items-center space-x-2 text-amber-600 font-extrabold text-2xl mb-2">
                        <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl shadow-xs">
                            <Store className="w-6 h-6" />
                        </div>
                        <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">वस्तु भंडार</span>
                    </Link>
                    <h2 className="text-xl font-bold text-gray-900">Create Account</h2>
                    <p className="text-xs text-gray-500 mt-1">Select your account role (Customer, Dealer, Delivery Agent, Karyakarta)</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    {/* Role Selector */}
                    <div>
                        <label className="block font-bold text-gray-700 uppercase mb-1">Account Type / Role *</label>
                        <select
                            value={data.role}
                            onChange={(e) => setData('role', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500 bg-white"
                        >
                            <option value="customer">Customer (Buy Products)</option>
                            <option value="dealer">Dealer (Vendor / Sell Products)</option>
                            <option value="delivery_partner">Delivery Partner (Fulfill COD Orders)</option>
                            <option value="karyakarta">Karyakarta (कार्यकर्ता - Organization Unit Member)</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-bold text-gray-700 uppercase mb-1">Full Name *</label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                            />
                            {errors.name && <div className="text-rose-600 mt-1">{errors.name}</div>}
                        </div>
                        <div>
                            <label className="block font-bold text-gray-700 uppercase mb-1">Phone Number</label>
                            <input
                                type="text"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                    </div>

                    {/* Dealer Store Name */}
                    {data.role === 'dealer' && (
                        <div>
                            <label className="block font-bold text-gray-700 uppercase mb-1">Business / Store Name *</label>
                            <input
                                type="text"
                                value={data.business_name}
                                onChange={(e) => setData('business_name', e.target.value)}
                                placeholder="E.g. ElectroWorld Store"
                                className="w-full p-3 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500"
                            />
                            {errors.business_name && <div className="text-rose-600 mt-1">{errors.business_name}</div>}
                        </div>
                    )}

                    {/* Delivery Partner Vehicle */}
                    {data.role === 'delivery_partner' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block font-bold text-gray-700 uppercase mb-1">Vehicle Type *</label>
                                <input
                                    type="text"
                                    value={data.vehicle_type}
                                    onChange={(e) => setData('vehicle_type', e.target.value)}
                                    placeholder="E.g. Motorbike / Van"
                                    className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                                />
                                {errors.vehicle_type && <div className="text-rose-600 mt-1">{errors.vehicle_type}</div>}
                            </div>
                            <div>
                                <label className="block font-bold text-gray-700 uppercase mb-1">Vehicle Number</label>
                                <input
                                    type="text"
                                    value={data.vehicle_number}
                                    onChange={(e) => setData('vehicle_number', e.target.value)}
                                    placeholder="E.g. MP-09-AB-1234"
                                    className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Karyakarta Organization Jurisdiction Scope */}
                    {data.role === 'karyakarta' && (
                        <div className="p-4 bg-orange-50/70 border border-amber-200 rounded-2xl space-y-3">
                            <div className="flex items-center space-x-2 text-amber-900">
                                <Award className="w-4 h-4 text-amber-700" />
                                <span className="font-extrabold text-xs">
                                    Organizational Jurisdiction (कार्यक्षेत्र निर्धारण - Optional)
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-500 leading-relaxed">
                                Select your assigned organizational unit (e.g. Vibhag, Jila, Nagar, or Shakha). If left blank, you will have global organization access.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                {/* Kshetra */}
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Kshetra (क्षेत्र)</label>
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
                                        className="w-full p-2 border border-gray-300 rounded-xl bg-white text-xs focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="">Select Kshetra</option>
                                        {orgData?.kshetras?.map((k) => (
                                            <option key={k.id} value={k.id}>
                                                {k.kshetra_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Prant */}
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Prant (प्रान्त)</label>
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
                                        className="w-full p-2 border border-gray-300 rounded-xl bg-white text-xs focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="">Select Prant</option>
                                        {filteredPrants?.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.prant_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Vibhag */}
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Vibhag (विभाग)</label>
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
                                        className="w-full p-2 border border-gray-300 rounded-xl bg-white text-xs focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="">Select Vibhag</option>
                                        {filteredVibhags?.map((v) => (
                                            <option key={v.id} value={v.id}>
                                                {v.vibhag_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Jila */}
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Jila (जिला)</label>
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
                                        className="w-full p-2 border border-gray-300 rounded-xl bg-white text-xs focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="">Select Jila</option>
                                        {filteredJilas?.map((j) => (
                                            <option key={j.id} value={j.id}>
                                                {j.jila_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Nagar */}
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Nagar (नगर)</label>
                                    <select
                                        value={data.nagar_id}
                                        onChange={(e) => {
                                            setData((prev) => ({
                                                ...prev,
                                                nagar_id: e.target.value,
                                                shakha_id: '',
                                            }));
                                        }}
                                        className="w-full p-2 border border-gray-300 rounded-xl bg-white text-xs focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="">Select Nagar</option>
                                        {filteredNagars?.map((n) => (
                                            <option key={n.id} value={n.id}>
                                                {n.nagar_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Shakha */}
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Shakha (शाखा)</label>
                                    <select
                                        value={data.shakha_id}
                                        onChange={(e) => setData('shakha_id', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-xl bg-white text-xs focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="">Select Shakha</option>
                                        {filteredShakhas?.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.shakha_name} ({s.aayu_varg})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block font-bold text-gray-700 uppercase mb-1">Email Address *</label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                        />
                        {errors.email && <div className="text-rose-600 mt-1">{errors.email}</div>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-bold text-gray-700 uppercase mb-1">Password *</label>
                            <input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                            />
                            {errors.password && <div className="text-rose-600 mt-1">{errors.password}</div>}
                        </div>
                        <div>
                            <label className="block font-bold text-gray-700 uppercase mb-1">Confirm Password *</label>
                            <input
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:from-amber-300 disabled:to-orange-300 text-white font-extrabold text-sm rounded-xl transition shadow-md shadow-amber-500/20 flex items-center justify-center space-x-2 cursor-pointer"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>Register Account</span>
                    </button>
                </form>

                <div className="text-center text-xs text-gray-500 border-t border-gray-100 pt-4">
                    Already have an account?{' '}
                    <Link href={route('login')} className="text-amber-600 font-bold hover:underline">
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
