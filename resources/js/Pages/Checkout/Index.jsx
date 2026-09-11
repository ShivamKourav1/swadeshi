import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { MapPin, CreditCard, ShieldCheck, Truck, CheckCircle2, AlertCircle, Navigation, Building2 } from 'lucide-react';

export default function Index({ cart, locations, subtotal, deliveryFee, total }) {
    const defaultLoc = locations.find((l) => l.is_default) || locations[0];

    const { data, setData, post, processing, errors } = useForm({
        delivery_location_id: defaultLoc ? defaultLoc.id : '',
        payment_method: 'cod',
        notes: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('orders.store'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Checkout Order" />

            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center space-x-2.5">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-2xl">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <span>Checkout & Order Placement</span>
                </h1>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Location & Payment Method */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Delivery Location Selection */}
                        <div className="bg-white p-6 rounded-3xl border border-amber-100/80 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900 text-lg flex items-center space-x-2">
                                    <MapPin className="w-5 h-5 text-amber-600" />
                                    <span>1. Select Delivery Location</span>
                                </h3>
                                <Link
                                    href={route('locations.index')}
                                    className="text-xs text-amber-600 hover:text-amber-700 hover:underline font-bold"
                                >
                                    + Add New Address
                                </Link>
                            </div>

                            {locations.length === 0 ? (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                        <span>No delivery location saved! Please add a delivery location to continue.</span>
                                    </div>
                                    <Link
                                        href={route('locations.index')}
                                        className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition"
                                    >
                                        Add Location
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {locations.map((loc) => (
                                        <label
                                            key={loc.id}
                                            className={`flex items-start space-x-3 p-4 rounded-2xl border cursor-pointer transition ${
                                                String(data.delivery_location_id) === String(loc.id)
                                                    ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20 shadow-sm'
                                                    : 'border-gray-200 hover:bg-amber-50/30'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="delivery_location_id"
                                                value={loc.id}
                                                checked={String(data.delivery_location_id) === String(loc.id)}
                                                onChange={(e) => setData('delivery_location_id', e.target.value)}
                                                className="mt-1 text-amber-600 focus:ring-amber-500"
                                            />
                                            <div className="flex-1 text-xs">
                                                <div className="font-bold text-gray-900 text-sm flex items-center space-x-2">
                                                    <span>{loc.recipient_name} ({loc.label})</span>
                                                    {loc.is_default && (
                                                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                                                            DEFAULT
                                                        </span>
                                                    )}
                                                </div>

                                                {loc.organizational_hierarchy && (
                                                    <div className="inline-flex items-center space-x-1 bg-amber-100/70 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded-md mt-1">
                                                        <Building2 className="w-3 h-3 text-amber-700 mr-1" />
                                                        <span>{loc.organizational_hierarchy}</span>
                                                    </div>
                                                )}

                                                <div className="text-gray-600 mt-1">
                                                    {loc.address_line_1}, {loc.address_line_2 ? loc.address_line_2 + ', ' : ''}
                                                    {loc.city}, {loc.state} {loc.postal_code}, {loc.country}
                                                </div>
                                                <div className="text-gray-400 mt-0.5">Phone: {loc.phone}</div>
                                                {loc.latitude && loc.longitude && (
                                                    <div className="text-[11px] text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-md font-mono mt-1.5 w-fit flex items-center">
                                                        <Navigation className="w-3 h-3 mr-1 text-amber-600" /> GPS Pin: {Number(loc.latitude).toFixed(4)}, {Number(loc.longitude).toFixed(4)}
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                            {errors.delivery_location_id && (
                                <div className="text-rose-600 text-xs font-medium mt-2">{errors.delivery_location_id}</div>
                            )}
                        </div>

                        {/* Payment Method Selection */}
                        <div className="bg-white p-6 rounded-3xl border border-amber-100/80 shadow-sm">
                            <h3 className="font-bold text-gray-900 text-lg flex items-center space-x-2 mb-4">
                                <CreditCard className="w-5 h-5 text-amber-600" />
                                <span>2. Payment Method</span>
                            </h3>

                            <div className="space-y-3">
                                {/* Cash on Delivery */}
                                <label
                                    className={`flex items-center space-x-3 p-4 rounded-2xl border cursor-pointer transition ${
                                        data.payment_method === 'cod'
                                            ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                                            : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="payment_method"
                                        value="cod"
                                        checked={data.payment_method === 'cod'}
                                        onChange={(e) => setData('payment_method', e.target.value)}
                                        className="text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900 text-sm flex items-center space-x-2">
                                            <Truck className="w-4 h-4 text-emerald-600" />
                                            <span>Cash on Delivery (COD)</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Pay cash to delivery partner upon package delivery. On order place, status will be <strong>DISPATCHED</strong>.
                                        </p>
                                    </div>
                                </label>

                                {/* Stripe Payment Gateway */}
                                <label
                                    className={`flex items-center space-x-3 p-4 rounded-2xl border cursor-pointer opacity-70 transition ${
                                        data.payment_method === 'stripe'
                                            ? 'border-amber-600 bg-amber-50/50 shadow-sm'
                                            : 'border-gray-200'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="payment_method"
                                        value="stripe"
                                        checked={data.payment_method === 'stripe'}
                                        onChange={(e) => setData('payment_method', e.target.value)}
                                        className="text-amber-600 focus:ring-amber-500"
                                    />
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900 text-sm flex items-center space-x-2">
                                            <CreditCard className="w-4 h-4 text-amber-600" />
                                            <span>Credit Card / Stripe (Gateway Extension Ready)</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Instant online payment processing driver architecture.
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Order Notes */}
                        <div className="bg-white p-6 rounded-3xl border border-amber-100/80 shadow-sm">
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                                Delivery Instructions / Notes (Optional)
                            </label>
                            <textarea
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="E.g. Leave package with front desk security..."
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm h-fit space-y-4">
                        <h3 className="font-bold text-gray-900 text-lg border-b border-gray-100 pb-3">Items Summary ({cart.length})</h3>

                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                            {cart.map((item) => (
                                <div key={item.id} className="flex justify-between text-xs">
                                    <div>
                                        <div className="font-semibold text-gray-800 line-clamp-1">{item.name}</div>
                                        <div className="text-gray-400">Qty: {item.quantity} x ₹{item.price}</div>
                                    </div>
                                    <div className="font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-gray-100 pt-3 space-y-2 text-xs text-gray-600">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span className="font-semibold text-gray-900">₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Delivery Fee</span>
                                <span className="font-semibold text-gray-900">₹{deliveryFee.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                            <span className="font-bold text-gray-900 text-sm">Total Payable</span>
                            <span className="font-black text-amber-600 text-xl">₹{total.toFixed(2)}</span>
                        </div>

                        <button
                            type="submit"
                            disabled={processing || locations.length === 0}
                            className={`w-full py-4 px-4 rounded-xl font-extrabold text-sm transition shadow-lg flex items-center justify-center space-x-2 cursor-pointer ${
                                processing || locations.length === 0
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                        >
                            <CheckCircle2 className="w-5 h-5" />
                            <span>{processing ? 'Placing Order...' : 'Confirm & Place Order'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
