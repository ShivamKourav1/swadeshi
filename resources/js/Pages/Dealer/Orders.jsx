import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { DollarSign, Package, Search, CheckCircle2, RotateCcw, XCircle, AlertCircle, ExternalLink } from 'lucide-react';

export default function Orders({ orderItems, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [selectedOrderToRestock, setSelectedOrderToRestock] = useState(null);
    const [isRestocking, setIsRestocking] = useState(false);

    const totalRevenue = orderItems.data.reduce((acc, item) => {
        // Exclude cancelled revenue if cancelled
        if (item.order?.order_status === 'cancelled') return acc;
        return acc + Number(item.subtotal);
    }, 0);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('dealer.orders.index'), { search: searchTerm }, { preserveState: true });
    };

    const handleConfirmRestock = () => {
        if (!selectedOrderToRestock) return;
        setIsRestocking(true);
        router.post(route('dealer.orders.confirm_restock', selectedOrderToRestock.id), {}, {
            onFinish: () => {
                setIsRestocking(false);
                setSelectedOrderToRestock(null);
            }
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Dealer Orders & Revenue" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 rounded-3xl p-8 text-white shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center space-x-2">
                            <DollarSign className="w-8 h-8" />
                            <span>Dealer Sales & Order Dashboard</span>
                        </h1>
                        <p className="text-emerald-100 text-sm mt-1">
                            Real-time order line item breakdown, cancellation returns, and inventory restock management.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 text-right">
                        <div className="text-xs uppercase font-bold text-emerald-200">Active Catalog Sales Revenue</div>
                        <div className="text-2xl font-black">₹{totalRevenue.toFixed(2)}</div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="font-bold text-gray-900 text-lg flex items-center space-x-2">
                            <Package className="w-5 h-5 text-emerald-600" />
                            <span>Ordered Line Items ({orderItems.data.length})</span>
                        </h2>

                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by order #, product, or customer..."
                                    className="w-full sm:w-64 pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer transition">
                                Search
                            </button>
                        </form>
                    </div>

                    {orderItems.data.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <div>No orders found matching your search.</div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto border-t pt-4">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                    <tr>
                                        <th className="p-3.5">Order #</th>
                                        <th className="p-3.5">Product Name</th>
                                        <th className="p-3.5">Customer</th>
                                        <th className="p-3.5">Qty</th>
                                        <th className="p-3.5">Unit Price</th>
                                        <th className="p-3.5">Subtotal</th>
                                        <th className="p-3.5">Order Status</th>
                                        <th className="p-3.5">Return / Restock Action</th>
                                        <th className="p-3.5 text-right">View</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-medium">
                                    {orderItems.data.map((item) => {
                                        const order = item.order;
                                        const isCancelled = order?.order_status === 'cancelled';
                                        const isRestocked = order?.restocked;

                                        return (
                                            <tr key={item.id} className="hover:bg-gray-50/60 transition">
                                                <td className="p-3.5 font-bold text-gray-900">
                                                    <Link 
                                                        href={route('orders.show', order?.id)}
                                                        className="hover:text-emerald-700 transition flex items-center space-x-1"
                                                    >
                                                        <span>{order?.order_number}</span>
                                                    </Link>
                                                </td>
                                                <td className="p-3.5 font-bold text-amber-800">{item.product_name}</td>
                                                <td className="p-3.5 text-gray-700">{order?.customer?.name}</td>
                                                <td className="p-3.5 font-bold text-gray-900">{item.quantity}</td>
                                                <td className="p-3.5">₹{item.unit_price}</td>
                                                <td className="p-3.5 font-black text-emerald-700 text-sm">₹{item.subtotal}</td>
                                                <td className="p-3.5">
                                                    {isCancelled ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                                                            <XCircle className="w-3 h-3 mr-1 text-rose-600" /> CANCELLED
                                                        </span>
                                                    ) : order?.return_request && order.return_request.status === 'return_request_raised' ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                                                            <RotateCcw className="w-3 h-3 mr-1 text-amber-700 animate-spin-slow" /> RETURN REQUESTED
                                                        </span>
                                                    ) : order?.return_request && order.return_request.status === 'return_request_accepted' ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-extrabold bg-sky-100 text-sky-900 border border-sky-300">
                                                            <RotateCcw className="w-3 h-3 mr-1 text-sky-700" /> RETURN ACCEPTED
                                                        </span>
                                                    ) : order?.order_status === 'completed' ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-extrabold bg-emerald-100 text-emerald-800">
                                                            <CheckCircle2 className="w-3 h-3 mr-1" /> COMPLETED
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-900 uppercase">
                                                            {order?.delivery_status || 'PROCESSING'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3.5">
                                                    {order?.return_request ? (
                                                        order.return_request.status === 'return_request_raised' ? (
                                                            <Link
                                                                href={route('orders.show', order.id)}
                                                                className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition"
                                                            >
                                                                Review Return
                                                            </Link>
                                                        ) : order.return_request.status === 'return_request_accepted' ? (
                                                            <Link
                                                                href={route('orders.show', order.id)}
                                                                className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition"
                                                            >
                                                                Fulfill Return
                                                            </Link>
                                                        ) : isCancelled && isRestocked ? (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                                                Restocked (+{item.quantity})
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-500 text-[11px]">{order.return_request.status.replace(/_/g, ' ')}</span>
                                                        )
                                                    ) : isCancelled ? (
                                                        isRestocked ? (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                                                Restocked (+{item.quantity})
                                                            </span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedOrderToRestock(order)}
                                                                className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition cursor-pointer"
                                                            >
                                                                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                                                Confirm Return Received
                                                            </button>
                                                        )
                                                    ) : (
                                                        <span className="text-gray-400 text-[11px]">—</span>
                                                    )}
                                                </td>
                                                <td className="p-3.5 text-right">
                                                    <Link
                                                        href={route('orders.show', order?.id)}
                                                        className="p-1.5 inline-block text-gray-400 hover:text-emerald-700 transition"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
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

            {/* Restock Confirmation Modal */}
            {selectedOrderToRestock && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-emerald-100">
                        <div className="flex items-center space-x-3 text-emerald-700">
                            <div className="p-3 bg-emerald-50 rounded-2xl">
                                <Package className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-black text-gray-900">Verify Return & Restock Stock</h3>
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed">
                            Have the cancelled physical goods for <strong>Order #{selectedOrderToRestock.order_number}</strong> arrived back at your store/sight?
                            <br /><br />
                            Confirming receipt will automatically increment product inventory counts back into your stock.
                        </p>

                        <div className="flex justify-end space-x-3 pt-2">
                            <button
                                type="button"
                                disabled={isRestocking}
                                onClick={() => setSelectedOrderToRestock(null)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isRestocking}
                                onClick={handleConfirmRestock}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{isRestocking ? 'Restocking...' : 'Yes, Confirm Stock Received'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
