import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import LocationPicker from '@/Components/LocationPicker';
import {
    MapPin,
    Plus,
    Trash2,
    CheckCircle2,
    Navigation,
    ExternalLink,
    Edit3,
    Sparkles,
    ShieldAlert,
    Building2,
    Flag,
} from 'lucide-react';

export default function Index({ locations, orgData }) {
    const [showModal, setShowModal] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [showManualCoords, setShowManualCoords] = useState(false);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        label: 'Home',
        recipient_name: '',
        phone: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'India',
        latitude: '',
        longitude: '',
        is_default: false,
        kshetra_id: '',
        prant_id: '',
        vibhag_id: '',
        jila_id: '',
        nagar_id: '',
        shakha_id: '',
    });

    const openAddModal = () => {
        setEditingLocation(null);
        reset();
        clearErrors();
        setShowManualCoords(false);
        setShowModal(true);
    };

    const openEditModal = (loc) => {
        setEditingLocation(loc);
        clearErrors();
        setShowManualCoords(false);
        setData({
            label: loc.label || 'Home',
            recipient_name: loc.recipient_name || '',
            phone: loc.phone || '',
            address_line_1: loc.address_line_1 || '',
            address_line_2: loc.address_line_2 || '',
            city: loc.city || '',
            state: loc.state || '',
            postal_code: loc.postal_code || '',
            country: loc.country || 'India',
            latitude: loc.latitude ? String(loc.latitude) : '',
            longitude: loc.longitude ? String(loc.longitude) : '',
            is_default: Boolean(loc.is_default),
            kshetra_id: loc.kshetra_id ? String(loc.kshetra_id) : '',
            prant_id: loc.prant_id ? String(loc.prant_id) : '',
            vibhag_id: loc.vibhag_id ? String(loc.vibhag_id) : '',
            jila_id: loc.jila_id ? String(loc.jila_id) : '',
            nagar_id: loc.nagar_id ? String(loc.nagar_id) : '',
            shakha_id: loc.shakha_id ? String(loc.shakha_id) : '',
        });
        setShowModal(true);
    };

    const handleLocationSelect = (loc) => {
        setData((prev) => ({
            ...prev,
            latitude: loc.latitude || prev.latitude,
            longitude: loc.longitude || prev.longitude,
            address_line_1: loc.address_line_1 || prev.address_line_1,
            address_line_2: loc.address_line_2 || prev.address_line_2,
            city: loc.city || prev.city,
            state: loc.state || prev.state,
            postal_code: loc.postal_code || prev.postal_code,
            country: loc.country || prev.country || 'India',
        }));
    };

    // Filter cascaded units
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
        if (editingLocation) {
            put(route('locations.update', editingLocation.id), {
                onSuccess: () => {
                    reset();
                    setShowModal(false);
                    setEditingLocation(null);
                },
            });
        } else {
            post(route('locations.store'), {
                onSuccess: () => {
                    reset();
                    setShowModal(false);
                },
            });
        }
    };

    const handleDelete = (id) => {
        router.delete(route('locations.destroy', id), {
            preserveScroll: true,
            onSuccess: () => setShowDeleteConfirm(null),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Delivery Locations" />

            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-amber-100 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center space-x-2.5">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-2xl">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <span>Saved Delivery Locations</span>
                        </h1>
                        <p className="text-xs text-gray-500 mt-1">
                            Manage your delivery addresses and organizational unit belongings (Kshetra, Prant, Vibhag, Jila, Nagar, Shakha).
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openAddModal}
                        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold px-5 py-3 rounded-2xl text-sm transition shadow-md shadow-amber-500/20 hover:shadow-lg flex items-center space-x-2 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add New Address</span>
                    </button>
                </div>

                {/* Locations Grid */}
                {locations.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-dashed border-amber-300 p-12 text-center space-y-4 shadow-xs">
                        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                            <MapPin className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-base">No Saved Locations Yet</h3>
                            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                                Add your delivery addresses with interactive map coordinates and organizational unit tags.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={openAddModal}
                            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition inline-flex items-center space-x-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add First Location</span>
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {locations.map((loc) => (
                            <div
                                key={loc.id}
                                className={`bg-white p-6 rounded-3xl border shadow-sm flex flex-col justify-between space-y-4 transition hover:shadow-md ${
                                    loc.is_default ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-gray-200'
                                }`}
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-extrabold text-gray-900 text-base">
                                                {loc.recipient_name}
                                            </span>
                                            <span className="bg-amber-100/70 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded-md">
                                                {loc.label}
                                            </span>
                                        </div>
                                        {loc.is_default && (
                                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center shadow-2xs">
                                                <CheckCircle2 className="w-3 h-3 mr-1" /> DEFAULT
                                            </span>
                                        )}
                                    </div>

                                    {/* Organizational Unit Tag */}
                                    {loc.organizational_hierarchy && (
                                        <div className="bg-amber-50/70 border border-amber-200 p-2 rounded-xl text-[11px] text-amber-900 flex items-start space-x-1.5 font-bold">
                                            <Building2 className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <span>{loc.organizational_hierarchy}</span>
                                                {loc.shakha?.aayu_varg && (
                                                    <span className="text-[10px] text-amber-700 block font-medium">
                                                        Age Group: {loc.shakha.aayu_varg} • {loc.shakha.type}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="text-xs text-gray-600 space-y-1">
                                        <div className="font-medium text-gray-800">
                                            {loc.address_line_1} {loc.address_line_2 ? `, ${loc.address_line_2}` : ''}
                                        </div>
                                        <div>
                                            {loc.city}, {loc.state} {loc.postal_code}, {loc.country}
                                        </div>
                                        <div className="text-gray-400 pt-1 font-medium">
                                            Phone: <span className="text-gray-700">{loc.phone}</span>
                                        </div>
                                    </div>

                                    {/* GPS Tag & Map Link */}
                                    {loc.latitude && loc.longitude && (
                                        <div className="pt-2 flex flex-wrap items-center gap-2">
                                            <div className="inline-flex items-center text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg font-mono">
                                                <Navigation className="w-3 h-3 mr-1 text-amber-600" />
                                                Lat: {Number(loc.latitude).toFixed(4)}, Lng: {Number(loc.longitude).toFixed(4)}
                                            </div>
                                            <a
                                                href={`https://www.openstreetmap.org/?mlat=${loc.latitude}&mlon=${loc.longitude}#map=16/${loc.latitude}/${loc.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center text-[11px] text-amber-600 hover:text-amber-800 font-bold hover:underline"
                                            >
                                                <span>View on Map</span>
                                                <ExternalLink className="w-3 h-3 ml-1" />
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Actions Footer */}
                                <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-xs">
                                    <button
                                        type="button"
                                        onClick={() => openEditModal(loc)}
                                        className="text-amber-600 hover:text-amber-800 font-bold flex items-center space-x-1 p-1 cursor-pointer"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        <span>Edit Address</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(loc.id)}
                                        className="text-rose-500 hover:text-rose-700 font-bold flex items-center space-x-1 p-1 cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add / Edit Location Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 my-8 max-h-[92vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                <div className="flex items-center space-x-2.5">
                                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-gray-900 text-base">
                                            {editingLocation ? 'Edit Delivery Location' : 'Add New Delivery Location'}
                                        </h3>
                                        <p className="text-[11px] text-gray-500">
                                            Pick your location on the map to auto-fill GPS & address details.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 font-bold transition cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Interactive Location Selection Panel */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-extrabold text-gray-800 flex items-center space-x-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                        <span>Interactive Location Selector (Free OpenStreetMap)</span>
                                    </label>
                                    <span className="text-[10px] text-gray-400">Drag pin or search below</span>
                                </div>

                                <LocationPicker
                                    initialLat={data.latitude}
                                    initialLng={data.longitude}
                                    onLocationSelect={handleLocationSelect}
                                />
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4 text-xs pt-1">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-bold text-gray-700 mb-1">Address Label *</label>
                                        <select
                                            value={data.label}
                                            onChange={(e) => setData('label', e.target.value)}
                                            className="w-full p-2.5 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500"
                                        >
                                            <option value="Home">Home</option>
                                            <option value="Work / Office">Work / Office</option>
                                            <option value="Shakha / Unit">Shakha / Unit</option>
                                            <option value="Warehouse">Warehouse</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        {errors.label && <div className="text-rose-600 text-[11px] mt-0.5">{errors.label}</div>}
                                    </div>
                                    <div>
                                        <label className="block font-bold text-gray-700 mb-1">Recipient Name *</label>
                                        <input
                                            type="text"
                                            value={data.recipient_name}
                                            onChange={(e) => setData('recipient_name', e.target.value)}
                                            placeholder="Full Name"
                                            className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                                        />
                                        {errors.recipient_name && <div className="text-rose-600 text-[11px] mt-0.5">{errors.recipient_name}</div>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-bold text-gray-700 mb-1">Phone Number *</label>
                                        <input
                                            type="text"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            placeholder="+91 9876543210"
                                            className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                                        />
                                        {errors.phone && <div className="text-rose-600 text-[11px] mt-0.5">{errors.phone}</div>}
                                    </div>
                                    <div>
                                        <label className="block font-bold text-gray-700 mb-1">Country *</label>
                                        <input
                                            type="text"
                                            value={data.country}
                                            onChange={(e) => setData('country', e.target.value)}
                                            placeholder="Country"
                                            className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                                        />
                                        {errors.country && <div className="text-rose-600 text-[11px] mt-0.5">{errors.country}</div>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Address Line 1 (Street/Area) *</label>
                                    <input
                                        type="text"
                                        value={data.address_line_1}
                                        onChange={(e) => setData('address_line_1', e.target.value)}
                                        placeholder="House/Flat No., Building, Street Name"
                                        className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                                    />
                                    {errors.address_line_1 && <div className="text-rose-600 text-[11px] mt-0.5">{errors.address_line_1}</div>}
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Address Line 2 (Landmark / Optional)</label>
                                    <input
                                        type="text"
                                        value={data.address_line_2}
                                        onChange={(e) => setData('address_line_2', e.target.value)}
                                        placeholder="Near Landmark, Suite, Floor, etc."
                                        className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block font-bold text-gray-700 mb-1">City *</label>
                                        <input
                                            type="text"
                                            value={data.city}
                                            onChange={(e) => setData('city', e.target.value)}
                                            placeholder="City"
                                            className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                                        />
                                        {errors.city && <div className="text-rose-600 text-[11px] mt-0.5">{errors.city}</div>}
                                    </div>
                                    <div>
                                        <label className="block font-bold text-gray-700 mb-1">State *</label>
                                        <input
                                            type="text"
                                            value={data.state}
                                            onChange={(e) => setData('state', e.target.value)}
                                            placeholder="State"
                                            className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                                        />
                                        {errors.state && <div className="text-rose-600 text-[11px] mt-0.5">{errors.state}</div>}
                                    </div>
                                    <div>
                                        <label className="block font-bold text-gray-700 mb-1">Postal / PIN Code *</label>
                                        <input
                                            type="text"
                                            value={data.postal_code}
                                            onChange={(e) => setData('postal_code', e.target.value)}
                                            placeholder="Postal Code"
                                            className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                                        />
                                        {errors.postal_code && <div className="text-rose-600 text-[11px] mt-0.5">{errors.postal_code}</div>}
                                    </div>
                                </div>

                                {/* Organizational Unit Belonging Subsection */}
                                <div className="p-4 bg-orange-50/60 border border-amber-200 rounded-2xl space-y-3">
                                    <div className="flex items-center space-x-2 text-amber-900">
                                        <Building2 className="w-4 h-4 text-amber-700" />
                                        <span className="font-extrabold text-xs">
                                            Organizational Belonging (संगठनात्मक संबद्धता - Optional)
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-500">
                                        Associate this address with an organizational unit for tracking, karyakarta coordination, and reports.
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
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

                                {/* Default Checkbox */}
                                <div className="flex items-center space-x-2 pt-1">
                                    <input
                                        type="checkbox"
                                        id="is_default"
                                        checked={data.is_default}
                                        onChange={(e) => setData('is_default', e.target.checked)}
                                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                                    />
                                    <label htmlFor="is_default" className="font-bold text-gray-700 cursor-pointer">
                                        Set as default shipping address
                                    </label>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-extrabold shadow-md shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
                                    >
                                        {processing ? 'Saving...' : editingLocation ? 'Update Address' : 'Save Address'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
                        <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-rose-100">
                            <div className="flex items-center space-x-3 text-rose-600">
                                <ShieldAlert className="w-6 h-6" />
                                <h3 className="font-extrabold text-gray-900 text-base">Delete Location?</h3>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                Are you sure you want to remove this delivery address? This action cannot be undone.
                            </p>
                            <div className="flex justify-end space-x-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(showDeleteConfirm)}
                                    className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md cursor-pointer"
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
