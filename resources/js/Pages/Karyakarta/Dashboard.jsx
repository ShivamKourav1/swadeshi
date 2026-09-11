import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Award,
    Package,
    Truck,
    Clock,
    CheckCircle2,
    Search,
    MapPin,
    Filter,
    ExternalLink,
    ChevronRight,
    DollarSign,
    RefreshCw,
    Building2,
    Users,
    XCircle,
} from 'lucide-react';

export default function Dashboard({ scope, metrics, orders, filters, filterOptions }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters?.delivery_status || '');
    const [selectedJila, setSelectedJila] = useState(filters?.jila_id || '');
    const [selectedNagar, setSelectedNagar] = useState(filters?.nagar_id || '');
    const [selectedShakha, setSelectedShakha] = useState(filters?.shakha_id || '');

    // Filter nagars based on selected jila
    const availableNagars = selectedJila
        ? filterOptions?.nagars?.filter((n) => String(n.jila_id) === String(selectedJila))
        : filterOptions?.nagars || [];

    // Filter shakhas based on selected nagar
    const availableShakhas = selectedNagar
        ? filterOptions?.shakhas?.filter((s) => String(s.nagar_id) === String(selectedNagar))
        : filterOptions?.shakhas || [];

    const handleFilterSubmit = (e) => {
        if (e) e.preventDefault();
        router.get(
            route('karyakarta.dashboard'),
            {
                search: searchTerm,
                delivery_status: selectedStatus,
                jila_id: selectedJila,
                nagar_id: selectedNagar,
                shakha_id: selectedShakha,
            },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setSearchTerm('');
        setSelectedStatus('');
        setSelectedJila('');
        setSelectedNagar('');
        setSelectedShakha('');
        router.get(route('karyakarta.dashboard'), {}, { preserveState: true });
    };

    const getStatusBadge = (deliveryStatus, orderStatus) => {
        if (orderStatus === 'cancelled') {
            return (
                <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center">
                    <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" /> CANCELLED
                </span>
            );
        }
        if (orderStatus === 'completed') {
            return (
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> COMPLETED
                </span>
            );
        }
        if (deliveryStatus === 'dispatched') {
            return (
                <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center">
                    <Truck className="w-3.5 h-3.5 mr-1 text-amber-700" /> DISPATCHED
                </span>
            );
        }
        if (deliveryStatus === 'in_transit') {
            return (
                <span className="bg-orange-100 text-orange-900 border border-orange-300 px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-orange-700" /> IN TRANSIT
                </span>
            );
        }
        return (
            <span className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-lg text-xs font-bold uppercase">
                {deliveryStatus}
            </span>
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Karyakarta Dashboard - Organization Tracking" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center space-x-2 text-amber-200 text-xs font-bold uppercase tracking-wider mb-2">
                            <Award className="w-4 h-4" />
                            <span>Organizational Order Intelligence & Field Tracking</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black">
                            Karyakarta Dashboard (कार्यकर्ता डैशबोर्ड)
                        </h1>
                        <p className="text-amber-100 text-xs mt-1.5 max-w-2xl leading-relaxed">
                            Monitor and audit orders, delivery fulfillments, and unit distributions belonging to your assigned organizational jurisdiction.
                        </p>
                    </div>

                    {/* Assigned Scope Badge Card */}
                    <div className="bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/20 text-right w-full md:w-auto shadow-inner">
                        <div className="text-[11px] uppercase font-bold text-amber-200 flex items-center justify-end space-x-1 mb-0.5">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Assigned Jurisdiction Scope</span>
                        </div>
                        <div className="text-base sm:text-lg font-black text-white">
                            {scope.name}
                        </div>
                        <div className="text-[11px] text-amber-100 mt-0.5">
                            Role: <strong className="uppercase">{scope.level} Level Officer</strong>
                        </div>
                        <div className="pt-2">
                            <Link
                                href={route('karyakarta.units.index')}
                                className="inline-flex items-center space-x-1 bg-white text-amber-900 hover:bg-amber-100 text-xs font-black px-3 py-1.5 rounded-xl shadow-xs transition"
                            >
                                <Building2 className="w-3.5 h-3.5 text-amber-700" />
                                <span>Manage Org Units & Toli</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-3xl border border-amber-100 shadow-sm flex items-center space-x-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                            <Package className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-gray-400 uppercase">Total Orders</div>
                            <div className="text-2xl font-black text-gray-900">{metrics.total_orders}</div>
                            <div className="text-[11px] font-bold text-amber-600">₹{metrics.total_revenue} value</div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-amber-100 shadow-sm flex items-center space-x-4">
                        <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
                            <Truck className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-gray-400 uppercase">Dispatched</div>
                            <div className="text-2xl font-black text-gray-900">{metrics.dispatched}</div>
                            <div className="text-[11px] text-gray-500">Ready for transit</div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-amber-100 shadow-sm flex items-center space-x-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-gray-400 uppercase">In Transit</div>
                            <div className="text-2xl font-black text-gray-900">{metrics.in_transit}</div>
                            <div className="text-[11px] text-orange-600 font-bold">On the way</div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-amber-100 shadow-sm flex items-center space-x-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-gray-400 uppercase">Completed</div>
                            <div className="text-2xl font-black text-emerald-600">{metrics.completed}</div>
                            <div className="text-[11px] text-emerald-700 font-bold">{metrics.delivered} delivered</div>
                        </div>
                    </div>
                </div>

                {/* Filter and Search Panel */}
                <div className="bg-white rounded-3xl border border-amber-100 shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <h2 className="font-extrabold text-gray-900 text-base flex items-center space-x-2">
                            <Filter className="w-4 h-4 text-amber-600" />
                            <span>Organizational Unit Filter & Search (इकाई अनुसार खोज)</span>
                        </h2>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="text-xs font-bold text-gray-500 hover:text-amber-700 flex items-center space-x-1 cursor-pointer"
                        >
                            <RefreshCw className="w-3.5 h-3.5 mr-1" />
                            <span>Reset Filters</span>
                        </button>
                    </div>

                    <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                        {/* Search Input */}
                        <div className="lg:col-span-2 relative">
                            <label className="block font-bold text-gray-700 uppercase mb-1">Search Keywords</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search order #, customer name, phone, address..."
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 text-xs"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block font-bold text-gray-700 uppercase mb-1">Delivery Status</label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-xl font-semibold focus:ring-2 focus:ring-amber-500 bg-white text-xs"
                            >
                                <option value="">All Statuses</option>
                                <option value="dispatched">Dispatched</option>
                                <option value="in_transit">In Transit</option>
                                <option value="delivered">Delivered</option>
                            </select>
                        </div>

                        {/* Jila Filter */}
                        {filterOptions?.jilas?.length > 1 && (
                            <div>
                                <label className="block font-bold text-gray-700 uppercase mb-1">Jila (जिला)</label>
                                <select
                                    value={selectedJila}
                                    onChange={(e) => {
                                        setSelectedJila(e.target.value);
                                        setSelectedNagar('');
                                        setSelectedShakha('');
                                    }}
                                    className="w-full p-2 border border-gray-300 rounded-xl font-semibold focus:ring-2 focus:ring-amber-500 bg-white text-xs"
                                >
                                    <option value="">All Jilas in Scope</option>
                                    {filterOptions.jilas.map((j) => (
                                        <option key={j.id} value={j.id}>
                                            {j.jila_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Nagar Filter */}
                        <div>
                            <label className="block font-bold text-gray-700 uppercase mb-1">Nagar (नगर)</label>
                            <select
                                value={selectedNagar}
                                onChange={(e) => {
                                    setSelectedNagar(e.target.value);
                                    setSelectedShakha('');
                                }}
                                className="w-full p-2 border border-gray-300 rounded-xl font-semibold focus:ring-2 focus:ring-amber-500 bg-white text-xs"
                            >
                                <option value="">All Nagars</option>
                                {availableNagars.map((n) => (
                                    <option key={n.id} value={n.id}>
                                        {n.nagar_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Shakha Filter */}
                        <div>
                            <label className="block font-bold text-gray-700 uppercase mb-1">Shakha (शाखा)</label>
                            <select
                                value={selectedShakha}
                                onChange={(e) => setSelectedShakha(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-xl font-semibold focus:ring-2 focus:ring-amber-500 bg-white text-xs"
                            >
                                <option value="">All Shakhas</option>
                                {availableShakhas.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.shakha_name} ({s.aayu_varg})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Submit button */}
                        <div className="sm:col-span-2 lg:col-span-5 flex justify-end pt-2">
                            <button
                                type="submit"
                                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-md shadow-amber-500/20 text-xs transition cursor-pointer flex items-center space-x-1.5"
                            >
                                <Search className="w-3.5 h-3.5" />
                                <span>Apply Filters</span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-3xl border border-amber-100 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                        <div className="font-extrabold text-gray-900 text-sm">
                            Matched Orders in Jurisdiction: <span className="text-amber-600">{orders.total ?? orders.data?.length ?? 0}</span>
                        </div>
                    </div>

                    {orders.data.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <Package className="w-12 h-12 mx-auto mb-2 text-amber-200" />
                            <div className="text-base font-bold text-gray-700">No orders found for this criteria</div>
                            <p className="text-xs text-gray-400 mt-1">Try resetting the filter or changing the search terms.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                    <tr>
                                        <th className="p-4">Order # & Date</th>
                                        <th className="p-4">Customer & Contact</th>
                                        <th className="p-4">Organizational Unit Belonging</th>
                                        <th className="p-4">Delivery Address</th>
                                        <th className="p-4">Items / Total</th>
                                        <th className="p-4">Delivery Status</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-medium">
                                    {orders.data.map((order) => {
                                        const loc = order.delivery_location;
                                        return (
                                            <tr key={order.id} className="hover:bg-amber-50/20 transition">
                                                {/* Order # */}
                                                <td className="p-4">
                                                    <div className="font-black text-gray-900 text-sm">
                                                        {order.order_number}
                                                    </div>
                                                    <div className="text-[11px] text-gray-400 mt-0.5">
                                                        {new Date(order.created_at).toLocaleDateString()}
                                                    </div>
                                                </td>

                                                {/* Customer */}
                                                <td className="p-4">
                                                    <div className="font-bold text-gray-900">
                                                        {order.customer?.name || loc?.recipient_name}
                                                    </div>
                                                    <div className="text-gray-500 text-[11px]">
                                                        {order.customer?.phone || loc?.phone || 'No Phone'}
                                                    </div>
                                                </td>

                                                {/* Organizational Hierarchy Tag */}
                                                <td className="p-4">
                                                    {loc?.organizational_hierarchy ? (
                                                        <div className="space-y-1">
                                                            <div className="inline-flex items-center space-x-1 bg-amber-50 text-amber-900 border border-amber-200 font-bold px-2.5 py-1 rounded-lg text-[11px]">
                                                                <Building2 className="w-3 h-3 text-amber-700 mr-1 flex-shrink-0" />
                                                                <span>{loc.organizational_hierarchy}</span>
                                                            </div>
                                                            {loc.shakha?.aayu_varg && (
                                                                <div className="text-[10px] text-gray-400">
                                                                    Age Group: <strong>{loc.shakha.aayu_varg}</strong> ({loc.shakha.type})
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 italic text-[11px]">
                                                            General Address (No Org Tag)
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Address */}
                                                <td className="p-4 text-gray-600 max-w-xs">
                                                    {loc ? (
                                                        <div>
                                                            <div className="font-medium text-gray-800 line-clamp-1">{loc.address_line_1}</div>
                                                            <div className="text-[11px] text-gray-400">{loc.city}, {loc.state} {loc.postal_code}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">N/A</span>
                                                    )}
                                                </td>

                                                {/* Items / Total */}
                                                <td className="p-4">
                                                    <div className="font-black text-amber-600 text-sm">
                                                        ₹{order.total_amount}
                                                    </div>
                                                    <div className="text-[11px] text-gray-500">
                                                        {order.items?.length ?? 0} item(s) • <strong className="uppercase">{order.payment_method}</strong>
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="p-4">
                                                    {getStatusBadge(order.delivery_status, order.order_status)}
                                                </td>

                                                {/* Action */}
                                                <td className="p-4 text-right">
                                                    <Link
                                                        href={route('karyakarta.orders.show', order.id)}
                                                        className="p-2 text-amber-700 hover:text-orange-700 bg-amber-50 hover:bg-amber-100 rounded-xl inline-flex items-center transition cursor-pointer font-bold text-xs"
                                                    >
                                                        <span>Inspect</span>
                                                        <ChevronRight className="w-4 h-4 ml-0.5" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
