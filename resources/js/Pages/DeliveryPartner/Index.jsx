import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Truck, CheckCircle2, DollarSign, MapPin, Camera, User, Clock, Search, Filter } from 'lucide-react';

export default function Index({ orders, filters }) {
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [deliveryStatus, setDeliveryStatus] = useState('in_transit');
    const [markCompleted, setMarkCompleted] = useState(false);
    const [paymentCollected, setPaymentCollected] = useState(true);
    const [amountCollected, setAmountCollected] = useState('');
    const [screenshotUrl, setScreenshotUrl] = useState('');
    const [notes, setNotes] = useState('');

    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState(filters?.delivery_status || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('delivery.index'), {
            search: searchTerm,
            delivery_status: statusFilter,
        }, { preserveState: true });
    };

    const handleStatusFilter = (st) => {
        setStatusFilter(st);
        router.get(route('delivery.index'), {
            search: searchTerm,
            delivery_status: st,
        }, { preserveState: true });
    };

    const handleClaim = (orderId) => {
        router.post(route('delivery.claim', orderId), {}, { preserveScroll: true });
    };

    const openUpdateModal = (order) => {
        setSelectedOrder(order);
        setDeliveryStatus(order.delivery_status === 'dispatched' ? 'in_transit' : order.delivery_status);
        setAmountCollected(order.total_amount);
        setScreenshotUrl(order.payment?.screenshot_url || '');
        setPaymentCollected(order.payment_status === 'paid' || order.payment_method === 'cod');
        setMarkCompleted(order.order_status === 'completed');
    };

    const handleUpdateStatus = (e) => {
        e.preventDefault();
        if (!selectedOrder) return;

        router.put(route('delivery.status.update', selectedOrder.id), {
            delivery_status: deliveryStatus,
            mark_completed: markCompleted,
            payment_collected: paymentCollected,
            amount_collected: amountCollected,
            screenshot_url: screenshotUrl,
            notes: notes,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedOrder(null);
                setNotes('');
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Delivery Partner Dashboard" />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header Banner - Rich Saffron Gradient */}
                <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 rounded-3xl p-8 text-white shadow-lg">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-white/10 backdrop-blur-md rounded-2xl">
                            <Truck className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold">Delivery Agent Command Center</h1>
                    </div>
                    <p className="text-amber-100 text-sm max-w-2xl">
                        Manage dispatched order fulfillment, update transit status, collect Cash on Delivery payments with screenshot receipt proof, and mark deliveries as completed!
                    </p>
                </div>

                {/* Orders List & Filter Controls */}
                <div className="bg-white rounded-3xl border border-amber-100/80 p-6 shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
                        <h2 className="font-bold text-gray-900 text-lg flex items-center space-x-2">
                            <Clock className="w-5 h-5 text-amber-600" />
                            <span>Assigned Orders ({orders.data.length})</span>
                        </h2>

                        {/* Search & Status Filter Controls */}
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            {/* Status Filter Dropdown */}
                            <select
                                value={statusFilter}
                                onChange={(e) => handleStatusFilter(e.target.value)}
                                className="p-2 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 bg-white"
                            >
                                <option value="">All Statuses</option>
                                <option value="dispatched">Dispatched</option>
                                <option value="in_transit">In Transit</option>
                                <option value="delivered">Delivered</option>
                            </select>

                            {/* Search Form */}
                            <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search order #, customer, or address..."
                                        className="w-full sm:w-64 pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                                <button type="submit" className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer">
                                    Search
                                </button>
                            </form>
                        </div>
                    </div>

                    {orders.data.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <Truck className="w-12 h-12 mx-auto mb-2 text-amber-200" />
                            <div>No orders found matching search criteria.</div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.data.map((order) => (
                                <div
                                    key={order.id}
                                    className="border border-amber-100/80 rounded-2xl p-5 hover:border-amber-400 transition bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center space-x-3">
                                            <span className="font-black text-gray-900 text-base">{order.order_number}</span>
                                            {order.delivery_status === 'cancelled' || order.order_status === 'cancelled' ? (
                                                <span className="bg-rose-100 text-rose-800 font-extrabold text-xs px-2.5 py-0.5 rounded-lg uppercase border border-rose-200">
                                                    CANCELLED
                                                </span>
                                            ) : (
                                                <span className="bg-amber-100 text-amber-800 font-extrabold text-xs px-2.5 py-0.5 rounded-lg uppercase border border-amber-200">
                                                    {order.delivery_status}
                                                </span>
                                            )}
                                            <span className={`font-bold text-xs px-2 py-0.5 rounded ${
                                                order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                            }`}>
                                                COD Payment: {order.payment_status.toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="text-xs text-gray-600 flex items-center space-x-2 pt-1">
                                            <User className="w-3.5 h-3.5 text-gray-400" />
                                            <span>Customer: <strong>{order.customer?.name}</strong> ({order.customer?.phone || 'No phone'})</span>
                                        </div>

                                        {order.delivery_location && (
                                            <div className="text-xs text-gray-700 flex items-center space-x-2">
                                                <MapPin className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                                                <span>
                                                    {order.delivery_location.recipient_name} — {order.delivery_location.address_line_1}, {order.delivery_location.city}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end border-t md:border-0 pt-3 md:pt-0">
                                        <div className="text-right">
                                            <div className="text-xs text-gray-400 font-medium">Cash to Collect</div>
                                            <div className="text-xl font-black text-emerald-600">₹{order.total_amount}</div>
                                        </div>

                                        {order.order_status === 'cancelled' ? (
                                            <span className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-2 rounded-xl text-xs font-bold">
                                                Order Cancelled
                                            </span>
                                        ) : !order.delivery_partner_id ? (
                                            <button
                                                onClick={() => handleClaim(order.id)}
                                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm cursor-pointer"
                                            >
                                                Claim Assignment
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => openUpdateModal(order)}
                                                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-amber-500/20 cursor-pointer"
                                            >
                                                Update Status & Payment
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for Status & COD Payment Receipt Update */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in border border-amber-100">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <h3 className="font-extrabold text-gray-900 text-lg">
                                Update Order #{selectedOrder.order_number}
                            </h3>
                            <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 font-bold cursor-pointer">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
                            {/* Delivery Status Selector */}
                            <div>
                                <label className="block font-bold text-gray-700 uppercase mb-1">
                                    Delivery Status Progression
                                </label>
                                <select
                                    value={deliveryStatus}
                                    onChange={(e) => setDeliveryStatus(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500 bg-white"
                                >
                                    <option value="dispatched">DISPATCHED (On Order Place)</option>
                                    <option value="in_transit">IN TRANSIT (On the way)</option>
                                    <option value="delivered">DELIVERED (Package Delivered)</option>
                                </select>
                            </div>

                            {/* COD Cash Collection Section */}
                            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-3">
                                <label className="flex items-center space-x-2 font-bold text-emerald-900 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={paymentCollected}
                                        onChange={(e) => setPaymentCollected(e.target.checked)}
                                        className="text-emerald-600 focus:ring-emerald-500 rounded"
                                    />
                                    <span>Cash Received by Delivery Partner (₹{selectedOrder.total_amount})</span>
                                </label>

                                {paymentCollected && (
                                    <>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1">Amount Cash Collected (₹)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={amountCollected}
                                                onChange={(e) => setAmountCollected(e.target.value)}
                                                className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-sm font-bold"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-gray-700 font-medium mb-1 flex items-center space-x-1">
                                                <Camera className="w-3.5 h-3.5 text-emerald-700" />
                                                <span>Payment Screenshot / Receipt Proof URL (Optional)</span>
                                            </label>
                                            <input
                                                type="url"
                                                value={screenshotUrl}
                                                onChange={(e) => setScreenshotUrl(e.target.value)}
                                                placeholder="https://example.com/receipts/proof.jpg"
                                                className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-xs"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Mark Order as Completed */}
                            <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl">
                                <label className="flex items-center space-x-2 font-extrabold text-amber-950 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={markCompleted}
                                        onChange={(e) => setMarkCompleted(e.target.checked)}
                                        className="text-amber-600 focus:ring-amber-500 rounded"
                                    />
                                    <span>Mark Entire Order Status as COMPLETED</span>
                                </label>
                                <p className="text-[11px] text-amber-800 mt-1">
                                    Per requirements: On delivery and when payment is received, order is marked as COMPLETED by delivery partner.
                                </p>
                            </div>

                            {/* Agent Notes */}
                            <div>
                                <label className="block font-bold text-gray-700 uppercase mb-1">Fulfillment Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Received cash ₹1499 from recipient, signed receipt..."
                                    className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                                    rows={2}
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedOrder(null)}
                                    className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold text-xs cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs shadow-md transition cursor-pointer"
                                >
                                    Save Status & Payment Record
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
