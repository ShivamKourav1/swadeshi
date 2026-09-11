import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Package, Clock, Truck, CheckCircle2, ChevronRight, XCircle, RotateCcw, Store } from 'lucide-react';

export default function Index({ orders }) {
    const getStatusBadge = (deliveryStatus, orderStatus, restocked, stage, returnRequest) => {
        if (returnRequest && orderStatus !== 'cancelled') {
            if (returnRequest.status === 'return_request_raised') {
                return <span className="bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-lg text-xs font-extrabold flex items-center"><RotateCcw className="w-3.5 h-3.5 mr-1 text-amber-700 animate-spin-slow"/> RETURN REQUESTED</span>;
            }
            if (returnRequest.status === 'return_request_accepted') {
                return <span className="bg-sky-100 text-sky-900 border border-sky-300 px-3 py-1 rounded-lg text-xs font-extrabold flex items-center"><Store className="w-3.5 h-3.5 mr-1 text-sky-700"/> RETURN ACCEPTED</span>;
            }
            if (returnRequest.status === 'return_request_rejected') {
                return <span className="bg-rose-100 text-rose-900 border border-rose-300 px-3 py-1 rounded-lg text-xs font-extrabold flex items-center"><XCircle className="w-3.5 h-3.5 mr-1 text-rose-700"/> RETURN REJECTED</span>;
            }
        }

        if (orderStatus === 'cancelled') {
            return (
                <div className="flex items-center space-x-1.5">
                    <span className="bg-rose-100 text-rose-800 border border-rose-200 px-3 py-1 rounded-lg text-xs font-extrabold flex items-center">
                        <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600"/> CANCELLED
                    </span>
                    {restocked ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                            RESTOCKED
                        </span>
                    ) : (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center">
                            <RotateCcw className="w-2.5 h-2.5 mr-1 text-amber-600 animate-spin-slow" /> RETURN TRANSIT
                        </span>
                    )}
                </div>
            );
        }
        if (orderStatus === 'completed') {
            return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-lg text-xs font-extrabold flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1"/> COMPLETED</span>;
        }
        if (deliveryStatus === 'pending' || orderStatus === 'placed') {
            return <span className="bg-sky-100 text-sky-900 border border-sky-300 px-3 py-1 rounded-lg text-xs font-extrabold flex items-center"><Clock className="w-3.5 h-3.5 mr-1 text-sky-700"/> ORDER PLACED</span>;
        }
        if (deliveryStatus === 'dispatched') {
            return <span className="bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-lg text-xs font-extrabold flex items-center"><Truck className="w-3.5 h-3.5 mr-1 text-amber-700"/> DISPATCHED</span>;
        }
        if (deliveryStatus === 'in_transit') {
            return <span className="bg-orange-100 text-orange-900 border border-orange-300 px-3 py-1 rounded-lg text-xs font-extrabold flex items-center"><Clock className="w-3.5 h-3.5 mr-1 text-orange-700"/> IN TRANSIT</span>;
        }
        return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-lg text-xs font-bold">{deliveryStatus.toUpperCase()}</span>;
    };

    return (
        <AuthenticatedLayout>
            <Head title="My Orders" />

            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center space-x-2.5">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-2xl">
                        <Package className="w-6 h-6" />
                    </div>
                    <span>My Order History</span>
                </h1>

                {orders.data.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-amber-100 shadow-sm">
                        <Package className="w-16 h-16 text-amber-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No orders placed yet</h3>
                        <p className="text-gray-500 text-sm mb-6">Browse products and place your first Cash on Delivery order!</p>
                        <Link href="/" className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold px-6 py-3 rounded-2xl text-sm transition shadow-md shadow-amber-500/20 inline-block">
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.data.map((order) => (
                            <div key={order.id} className="bg-white rounded-2xl border border-amber-100/80 p-6 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <div className="flex items-center space-x-3 mb-2">
                                        <span className="font-extrabold text-gray-900 text-base">{order.order_number}</span>
                                        {getStatusBadge(order.delivery_status, order.order_status, order.restocked, order.cancellation_stage, order.return_request)}
                                    </div>
                                    <div className="text-xs text-gray-500 space-x-3">
                                        <span>Placed: {new Date(order.created_at).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>Method: <strong className="uppercase">{order.payment_method}</strong></span>
                                        <span>•</span>
                                        <span>Items: <strong>{order.items.length}</strong></span>
                                    </div>
                                    {order.delivery_location && (
                                        <div className="text-xs text-gray-600 mt-2">
                                            📍 Deliver to: {order.delivery_location.recipient_name}, {order.delivery_location.city}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center space-x-4 w-full sm:w-auto justify-between border-t sm:border-0 pt-3 sm:pt-0">
                                    <div className="text-right">
                                        <div className="text-xs text-gray-400 font-medium">Total Payable</div>
                                        <div className="text-lg font-black text-amber-600">₹{order.total_amount}</div>
                                    </div>
                                    <Link
                                        href={route('orders.show', order.id)}
                                        className="bg-gray-100 hover:bg-amber-50 text-gray-700 hover:text-amber-700 p-2.5 rounded-xl transition cursor-pointer"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
