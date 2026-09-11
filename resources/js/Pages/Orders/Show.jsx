import React, { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    ArrowLeft, Package, Truck, CheckCircle2, Clock, MapPin, 
    UserCheck, Receipt, Building2, Ban, RotateCcw, AlertTriangle, 
    CheckCircle, XCircle, FileText, Send, Check, X, Store
} from 'lucide-react';

export default function Show({ order }) {
    const { auth } = usePage().props;
    const user = auth?.user;

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);

    const [showRestockModal, setShowRestockModal] = useState(false);
    const [isRestocking, setIsRestocking] = useState(false);

    // Return Request States
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnReason, setReturnReason] = useState('Defective or damaged product');
    const [customerNotes, setCustomerNotes] = useState('');
    const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showFulfillModal, setShowFulfillModal] = useState(false);
    const [dealerNotes, setDealerNotes] = useState('');
    const [isProcessingReturnAction, setIsProcessingReturnAction] = useState(false);

    const canCancel = order.order_status !== 'cancelled' && 
                      order.order_status !== 'completed' && 
                      order.delivery_status !== 'delivered';

    const isDeliveredOrCompleted = order.order_status === 'completed' || order.delivery_status === 'delivered';
    const isCustomer = user?.role === 'customer' && user?.id === order.customer_id;
    const isDealerOrAdmin = user?.role === 'dealer' || user?.role === 'admin';
    const isDealerOfThisOrder = isDealerOrAdmin && (user?.role === 'admin' || order.items?.some(i => i.dealer_id === user?.id));

    const returnRequest = order.return_request;
    const canRaiseReturn = isCustomer && 
                          isDeliveredOrCompleted && 
                          order.order_status !== 'cancelled' && 
                          (!returnRequest || returnRequest.status === 'return_request_rejected');

    const handleCancel = (e) => {
        e.preventDefault();
        setIsCancelling(true);
        router.post(route('orders.cancel', order.id), {
            reason: cancelReason
        }, {
            onFinish: () => {
                setIsCancelling(false);
                setShowCancelModal(false);
            }
        });
    };

    const handleConfirmRestock = () => {
        setIsRestocking(true);
        router.post(route('dealer.orders.confirm_restock', order.id), {}, {
            onFinish: () => {
                setIsRestocking(false);
                setShowRestockModal(false);
            }
        });
    };

    const handleRaiseReturn = (e) => {
        e.preventDefault();
        setIsSubmittingReturn(true);
        router.post(route('orders.return_request.store', order.id), {
            reason: returnReason,
            customer_notes: customerNotes,
        }, {
            onFinish: () => {
                setIsSubmittingReturn(false);
                setShowReturnModal(false);
                setCustomerNotes('');
            }
        });
    };

    const handleAcceptReturn = (e) => {
        e.preventDefault();
        if (!returnRequest) return;
        setIsProcessingReturnAction(true);
        router.post(route('dealer.return_requests.accept', returnRequest.id), {
            dealer_notes: dealerNotes,
        }, {
            onFinish: () => {
                setIsProcessingReturnAction(false);
                setShowAcceptModal(false);
                setDealerNotes('');
            }
        });
    };

    const handleRejectReturn = (e) => {
        e.preventDefault();
        if (!returnRequest) return;
        setIsProcessingReturnAction(true);
        router.post(route('dealer.return_requests.reject', returnRequest.id), {
            dealer_notes: dealerNotes,
        }, {
            onFinish: () => {
                setIsProcessingReturnAction(false);
                setShowRejectModal(false);
                setDealerNotes('');
            }
        });
    };

    const handleFulfillReturn = () => {
        if (!returnRequest) return;
        setIsProcessingReturnAction(true);
        router.post(route('dealer.return_requests.fulfill', returnRequest.id), {}, {
            onFinish: () => {
                setIsProcessingReturnAction(false);
                setShowFulfillModal(false);
            }
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Order #${order.order_number}`} />

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <Link href={route('orders.index')} className="inline-flex items-center text-sm text-gray-500 hover:text-amber-600 font-bold transition">
                        <ArrowLeft className="w-4 h-4 mr-1 text-amber-600" /> Back to My Orders
                    </Link>

                    <div className="flex items-center space-x-2">
                        {canCancel && (
                            <button
                                type="button"
                                onClick={() => setShowCancelModal(true)}
                                className="inline-flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-2 rounded-2xl text-xs font-bold transition shadow-xs cursor-pointer"
                            >
                                <Ban className="w-4 h-4 text-rose-600" />
                                <span>Cancel Order</span>
                            </button>
                        )}

                        {canRaiseReturn && (
                            <button
                                type="button"
                                onClick={() => setShowReturnModal(true)}
                                className="inline-flex items-center space-x-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-4 py-2 rounded-2xl text-xs font-bold transition shadow-xs cursor-pointer"
                            >
                                <RotateCcw className="w-4 h-4 text-amber-700" />
                                <span>Request Return / Replacement</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Return Request Status Card */}
                {returnRequest && (
                    <div className={`rounded-3xl p-6 shadow-sm border space-y-4 ${
                        returnRequest.status === 'return_request_raised'
                            ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                            : returnRequest.status === 'return_request_accepted'
                            ? 'bg-sky-50/90 border-sky-200 text-sky-950'
                            : returnRequest.status === 'return_request_rejected'
                            ? 'bg-rose-50/90 border-rose-200 text-rose-950'
                            : 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                    }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center space-x-3">
                                <div className={`p-3 rounded-2xl ${
                                    returnRequest.status === 'return_request_raised'
                                        ? 'bg-amber-200/70 text-amber-900'
                                        : returnRequest.status === 'return_request_accepted'
                                        ? 'bg-sky-200/70 text-sky-900'
                                        : returnRequest.status === 'return_request_rejected'
                                        ? 'bg-rose-200/70 text-rose-900'
                                        : 'bg-emerald-200/70 text-emerald-900'
                                }`}>
                                    <RotateCcw className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-xs font-black uppercase tracking-wider opacity-75">
                                        Return Policy Management
                                    </div>
                                    <h2 className="text-lg font-black">
                                        {returnRequest.status === 'return_request_raised' && 'Return Request Submitted (Awaiting Dealer Review)'}
                                        {returnRequest.status === 'return_request_accepted' && 'Return Accepted — Awaiting Physical Product at Dealer Store'}
                                        {returnRequest.status === 'return_request_rejected' && 'Return Request Rejected by Dealer'}
                                        {returnRequest.status === 'return_request_fulfilled' && 'Return Fulfilled & Order Cancelled'}
                                    </h2>
                                </div>
                            </div>

                            <span className="px-3 py-1 bg-white/80 border border-current/20 font-extrabold text-xs rounded-xl uppercase self-start sm:self-auto">
                                {returnRequest.status.replace(/_/g, ' ')}
                            </span>
                        </div>

                        <div className="bg-white/80 rounded-2xl p-4 border border-current/10 text-xs space-y-2">
                            <div>
                                <span className="font-bold text-gray-700">Reason: </span>
                                <span className="text-gray-900 font-semibold">{returnRequest.reason}</span>
                            </div>
                            {returnRequest.customer_notes && (
                                <div>
                                    <span className="font-bold text-gray-700">Customer Note: </span>
                                    <span className="text-gray-900">{returnRequest.customer_notes}</span>
                                </div>
                            )}
                            {returnRequest.dealer_notes && (
                                <div className="pt-1 border-t border-gray-100">
                                    <span className="font-bold text-gray-700">Dealer Response: </span>
                                    <span className="text-gray-900 font-medium">{returnRequest.dealer_notes}</span>
                                </div>
                            )}
                            <div className="text-[11px] text-gray-500 pt-1 flex flex-wrap gap-x-4 gap-y-1">
                                <span>Raised: {new Date(returnRequest.raised_at || returnRequest.created_at).toLocaleString()}</span>
                                {returnRequest.accepted_at && <span>• Accepted: {new Date(returnRequest.accepted_at).toLocaleString()}</span>}
                                {returnRequest.rejected_at && <span>• Rejected: {new Date(returnRequest.rejected_at).toLocaleString()}</span>}
                                {returnRequest.fulfilled_at && <span>• Fulfilled: {new Date(returnRequest.fulfilled_at).toLocaleString()}</span>}
                            </div>
                        </div>

                        {/* Customer Physical Return Guidance Notice */}
                        {returnRequest.status === 'return_request_accepted' && (
                            <div className="bg-sky-100/90 border border-sky-300 rounded-2xl p-3 text-xs text-sky-950 flex items-start space-x-2">
                                <Store className="w-5 h-5 text-sky-700 flex-shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold">Next Step: </span>
                                    <span>Please physically bring or ship the product to the dealer store location. Once the dealer physically inspects and confirms receipt, this return will be marked fulfilled, the order will be cancelled, and inventory/refund will be finalized.</span>
                                </div>
                            </div>
                        )}

                        {/* Dealer Action Buttons */}
                        {isDealerOfThisOrder && (
                            <div className="pt-2 flex flex-wrap items-center gap-2">
                                {returnRequest.status === 'return_request_raised' && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDealerNotes('');
                                                setShowAcceptModal(true);
                                            }}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
                                        >
                                            <Check className="w-4 h-4" />
                                            <span>Accept Return Request</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDealerNotes('');
                                                setShowRejectModal(true);
                                            }}
                                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
                                        >
                                            <X className="w-4 h-4" />
                                            <span>Reject Return Request</span>
                                        </button>
                                    </>
                                )}

                                {returnRequest.status === 'return_request_accepted' && (
                                    <button
                                        type="button"
                                        onClick={() => setShowFulfillModal(true)}
                                        className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Confirm Physical Product Received & Fulfill Return</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Cancellation Alert Banner */}
                {order.order_status === 'cancelled' && (
                    <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 shadow-sm space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
                                    <XCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-rose-900">Order Cancelled</h2>
                                    <div className="text-xs text-rose-700 mt-0.5">
                                        Cancelled on {new Date(order.cancelled_at || order.updated_at).toLocaleString()}
                                        {order.cancelled_by_user && (
                                            <span> by <strong className="font-semibold">{order.cancelled_by_user.name} ({order.cancelled_by_user.role})</strong></span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <span className="px-3 py-1 bg-rose-200 text-rose-900 font-extrabold text-xs rounded-xl uppercase tracking-wider">
                                {order.cancellation_stage === 'before_dispatch' ? 'Cancelled Before Dispatch' : 'Cancelled In Transit / Return'}
                            </span>
                        </div>

                        {order.cancellation_reason && (
                            <div className="bg-white/80 rounded-2xl p-3 border border-rose-100 text-xs">
                                <span className="font-bold text-gray-700">Reason / Remark: </span>
                                <span className="text-gray-900 font-medium">{order.cancellation_reason}</span>
                            </div>
                        )}

                        {/* Physical Stock Status Card */}
                        <div className={`p-4 rounded-2xl border ${
                            order.restocked 
                                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
                                : 'bg-amber-50/80 border-amber-200 text-amber-900'
                        }`}>
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center space-x-2">
                                    {order.restocked ? (
                                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                                    ) : (
                                        <RotateCcw className="w-5 h-5 text-amber-600 animate-spin-slow" />
                                    )}
                                    <div>
                                        <div className="font-bold text-xs uppercase tracking-wide">
                                            {order.restocked ? 'Stock Restored to Inventory' : 'Awaiting Physical Return to Dealer Sight'}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-0.5">
                                            {order.restocked ? (
                                                <span>
                                                    Product quantities were replenished into stock.
                                                    {order.restocked_at && ` (Restocked on ${new Date(order.restocked_at).toLocaleString()})`}
                                                </span>
                                            ) : (
                                                <span>
                                                    Stock will <strong>only</strong> be restored when the returned package physically arrives at the dealer's location.
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action for Dealer/Admin to verify receipt if not return request flow */}
                                {isDealerOfThisOrder && !order.restocked && !returnRequest && (
                                    <button
                                        type="button"
                                        onClick={() => setShowRestockModal(true)}
                                        className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Confirm Returned Stock Received</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Header Summary Box */}
                <div className="bg-white rounded-3xl border border-amber-100 p-6 lg:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="text-xs text-amber-800 font-bold uppercase tracking-wider mb-1">Order Details</div>
                        <h1 className="text-2xl font-extrabold text-gray-900">{order.order_number}</h1>
                        <div className="text-xs text-gray-500 mt-1">Placed on {new Date(order.created_at).toLocaleString()}</div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <div className="text-right">
                            <div className="text-xs text-gray-400 font-medium">Delivery Status</div>
                            <span className={`inline-block mt-0.5 px-3 py-1 font-extrabold text-xs rounded-lg uppercase border ${
                                order.delivery_status === 'cancelled' || order.delivery_status === 'returned'
                                    ? 'bg-rose-100 text-rose-900 border-rose-200' 
                                    : order.delivery_status === 'pending' || order.delivery_status === 'placed'
                                    ? 'bg-sky-100 text-sky-900 border-sky-200'
                                    : order.delivery_status === 'delivered'
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                                    : 'bg-amber-100 text-amber-900 border-amber-200'
                            }`}>
                                {order.delivery_status === 'pending' ? 'ORDER PLACED' : order.delivery_status}
                            </span>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-400 font-medium">Order Status</div>
                            <span className={`inline-block mt-0.5 px-3 py-1 font-extrabold text-xs rounded-lg uppercase ${
                                order.order_status === 'completed' 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : order.order_status === 'cancelled'
                                    ? 'bg-rose-100 text-rose-900 border-rose-200'
                                    : order.order_status === 'placed'
                                    ? 'bg-sky-100 text-sky-900 border border-sky-200'
                                    : 'bg-orange-100 text-orange-900 border border-orange-200'
                            }`}>
                                {order.order_status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Delivery Tracking & Delivery Partner Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Delivery Address */}
                    <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-2 border-b border-gray-100 pb-3 mb-3">
                            <MapPin className="w-4 h-4 text-amber-600" />
                            <span>Delivery Destination</span>
                        </h3>
                        {order.delivery_location ? (
                            <div className="text-xs text-gray-700 space-y-1">
                                <div className="font-bold text-sm text-gray-900">{order.delivery_location.recipient_name}</div>
                                {order.delivery_location.organizational_hierarchy && (
                                    <div className="inline-flex items-center space-x-1 bg-amber-50 text-amber-900 border border-amber-200 font-bold px-2 py-0.5 rounded-lg text-[11px] my-1">
                                        <Building2 className="w-3 h-3 text-amber-700 mr-1" />
                                        <span>{order.delivery_location.organizational_hierarchy}</span>
                                    </div>
                                )}
                                <div>{order.delivery_location.address_line_1} {order.delivery_location.address_line_2}</div>
                                <div>{order.delivery_location.city}, {order.delivery_location.state} {order.delivery_location.postal_code}</div>
                                <div className="text-gray-400 pt-1">Phone: {order.delivery_location.phone}</div>
                            </div>
                        ) : (
                            <div className="text-xs text-gray-400">Address detail unavailable.</div>
                        )}
                    </div>

                    {/* Assigned Delivery Partner */}
                    <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-2 border-b border-gray-100 pb-3 mb-3">
                            <Truck className="w-4 h-4 text-amber-600" />
                            <span>Assigned Delivery Partner</span>
                        </h3>
                        {order.delivery_partner ? (
                            <div className="text-xs text-gray-700 space-y-1">
                                <div className="font-bold text-sm text-gray-900 flex items-center space-x-1">
                                    <UserCheck className="w-4 h-4 text-emerald-600 mr-1" />
                                    <span>{order.delivery_partner.name}</span>
                                </div>
                                <div className="text-gray-500">Contact: {order.delivery_partner.phone || order.delivery_partner.email}</div>
                                <div className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg font-semibold inline-block mt-2">
                                    Responsible for COD Cash Collection
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200/60">
                                Standard fulfillment
                            </div>
                        )}
                    </div>
                </div>

                {/* Items Ordered Table */}
                <div className="bg-white rounded-3xl border border-amber-100 p-6 shadow-sm">
                    <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center space-x-2">
                        <Package className="w-4 h-4 text-amber-600" />
                        <span>Order Items ({order.items.length})</span>
                    </h3>

                    <div className="space-y-3">
                        {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center text-xs p-3 bg-orange-50/20 rounded-xl border border-amber-100/60">
                                <div>
                                    <div className="font-bold text-gray-900 text-sm">{item.product_name}</div>
                                    <div className="text-gray-500">Unit Price: ₹{item.unit_price}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-gray-700">Qty: {item.quantity}</div>
                                    <div className="font-extrabold text-amber-600 text-sm">₹{item.subtotal}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between items-center text-sm font-bold">
                        <span>Total Paid / Payable</span>
                        <span className="text-xl text-amber-600 font-black">₹{order.total_amount}</span>
                    </div>
                </div>

                {/* Delivery Logs Timeline */}
                <div className="bg-white rounded-3xl border border-amber-100 p-6 shadow-sm">
                    <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>Delivery Audit Log & Status History</span>
                    </h3>

                    {order.delivery_logs.length === 0 ? (
                        <div className="text-xs text-gray-400">No status logs recorded yet.</div>
                    ) : (
                        <div className="space-y-4 border-l-2 border-amber-200 pl-4 ml-2">
                            {order.delivery_logs.map((log) => (
                                <div key={log.id} className="relative text-xs">
                                    <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ${
                                        log.status === 'cancelled' 
                                            ? 'bg-rose-500' 
                                            : log.status === 'returned' || log.status === 'return_fulfilled'
                                            ? 'bg-emerald-600'
                                            : log.status === 'return_requested' || log.status === 'return_accepted'
                                            ? 'bg-sky-500'
                                            : 'bg-gradient-to-r from-amber-500 to-orange-600'
                                    }`}></div>
                                    <div className="font-bold text-gray-900 uppercase">{log.status}</div>
                                    <div className="text-gray-500">{log.notes}</div>
                                    <div className="text-[10px] text-gray-400 mt-0.5">
                                        By: {log.delivery_partner?.name || 'System'} • {new Date(log.created_at).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Cancel Order Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-rose-100">
                        <div className="flex items-center space-x-3 text-rose-600">
                            <div className="p-3 bg-rose-50 rounded-2xl">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-black text-gray-900">Cancel Order #{order.order_number}?</h3>
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed">
                            {order.delivery_status === 'pending' || order.delivery_status === 'placed'
                                ? 'This order has not been dispatched yet. Cancelling will immediately return item quantities to available inventory stock.'
                                : 'This order has already been dispatched. Cancelling will record a return request. Physical stock will be restored once the dealer receives and verifies the returned items.'}
                        </p>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-700">Reason for Cancellation (Optional)</label>
                            <textarea
                                rows="3"
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="E.g. Ordered by mistake, found alternative, incorrect address..."
                                className="w-full text-xs rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            ></textarea>
                        </div>

                        <div className="flex justify-end space-x-3 pt-2">
                            <button
                                type="button"
                                disabled={isCancelling}
                                onClick={() => setShowCancelModal(false)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                            >
                                Never Mind
                            </button>
                            <button
                                type="button"
                                disabled={isCancelling}
                                onClick={handleCancel}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                            >
                                <Ban className="w-4 h-4" />
                                <span>{isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Raise Return Request Modal (Customer) */}
            {showReturnModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <form onSubmit={handleRaiseReturn} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-amber-100">
                        <div className="flex items-center space-x-3 text-amber-700">
                            <div className="p-3 bg-amber-50 rounded-2xl">
                                <RotateCcw className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-black text-gray-900">Request Return / Refund</h3>
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed">
                            Submit a return request to the dealer for Order #{order.order_number}. Once accepted, you will physically deliver the product to the dealer store for inspection and order cancellation.
                        </p>

                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Reason for Return *</label>
                                <select
                                    value={returnReason}
                                    onChange={(e) => setReturnReason(e.target.value)}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                                >
                                    <option value="Defective or damaged product">Defective or damaged product</option>
                                    <option value="Wrong item or size delivered">Wrong item or size delivered</option>
                                    <option value="Item does not match description">Item does not match description</option>
                                    <option value="Quality not satisfactory">Quality not satisfactory</option>
                                    <option value="Other reason">Other reason</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Additional Details / Notes</label>
                                <textarea
                                    rows="3"
                                    value={customerNotes}
                                    onChange={(e) => setCustomerNotes(e.target.value)}
                                    placeholder="Explain issue details or preferred return timing..."
                                    className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:ring-2 focus:ring-amber-500"
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-2">
                            <button
                                type="button"
                                disabled={isSubmittingReturn}
                                onClick={() => setShowReturnModal(false)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmittingReturn}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                            >
                                <Send className="w-4 h-4" />
                                <span>{isSubmittingReturn ? 'Submitting...' : 'Submit Return Request'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Accept Return Request Modal (Dealer/Admin) */}
            {showAcceptModal && returnRequest && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <form onSubmit={handleAcceptReturn} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-emerald-100">
                        <div className="flex items-center space-x-3 text-emerald-700">
                            <div className="p-3 bg-emerald-50 rounded-2xl">
                                <Check className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-black text-gray-900">Accept Return Request</h3>
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed">
                            Agree to accept the return request for Order #{order.order_number}. The customer will bring/send the physical goods to your store. Stock will only be restored once goods physically arrive.
                        </p>

                        <div className="space-y-2 text-xs">
                            <label className="block font-bold text-gray-700">Dealer Instructions / Store Address Note (Optional)</label>
                            <textarea
                                rows="3"
                                value={dealerNotes}
                                onChange={(e) => setDealerNotes(e.target.value)}
                                placeholder="E.g. Please bring package to our store counter between 10am-6pm..."
                                className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:ring-2 focus:ring-emerald-500"
                            ></textarea>
                        </div>

                        <div className="flex justify-end space-x-3 pt-2">
                            <button
                                type="button"
                                disabled={isProcessingReturnAction}
                                onClick={() => setShowAcceptModal(false)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isProcessingReturnAction}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                            >
                                <Check className="w-4 h-4" />
                                <span>{isProcessingReturnAction ? 'Accepting...' : 'Confirm Accept Return'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Reject Return Request Modal (Dealer/Admin) */}
            {showRejectModal && returnRequest && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <form onSubmit={handleRejectReturn} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-rose-100">
                        <div className="flex items-center space-x-3 text-rose-600">
                            <div className="p-3 bg-rose-50 rounded-2xl">
                                <X className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-black text-gray-900">Reject Return Request</h3>
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed">
                            Please provide a reason for rejecting the return request.
                        </p>

                        <div className="space-y-2 text-xs">
                            <label className="block font-bold text-gray-700">Rejection Reason *</label>
                            <textarea
                                rows="3"
                                required
                                value={dealerNotes}
                                onChange={(e) => setDealerNotes(e.target.value)}
                                placeholder="E.g. Return window expired / Item used / Non-returnable..."
                                className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:ring-2 focus:ring-rose-500"
                            ></textarea>
                        </div>

                        <div className="flex justify-end space-x-3 pt-2">
                            <button
                                type="button"
                                disabled={isProcessingReturnAction}
                                onClick={() => setShowRejectModal(false)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isProcessingReturnAction || !dealerNotes.trim()}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                            >
                                <X className="w-4 h-4" />
                                <span>{isProcessingReturnAction ? 'Rejecting...' : 'Reject Return Request'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Fulfill Return Modal (Dealer/Admin) */}
            {showFulfillModal && returnRequest && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-emerald-100">
                        <div className="flex items-center space-x-3 text-emerald-700">
                            <div className="p-3 bg-emerald-50 rounded-2xl">
                                <Package className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-black text-gray-900">Fulfill Return & Cancel Order</h3>
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed">
                            Have you physically received and inspected the returned product at your store/sight for <strong>Order #{order.order_number}</strong>?
                            <br /><br />
                            Confirming this will:
                            <br />
                            1. Set return request to <strong>return_request_fulfilled</strong>.
                            <br />
                            2. Cancel the Order automatically with reason/remark <strong>"Return Request"</strong>.
                            <br />
                            3. Increment product quantities back into your inventory stock.
                        </p>

                        <div className="flex justify-end space-x-3 pt-2">
                            <button
                                type="button"
                                disabled={isProcessingReturnAction}
                                onClick={() => setShowFulfillModal(false)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isProcessingReturnAction}
                                onClick={handleFulfillReturn}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{isProcessingReturnAction ? 'Fulfilling...' : 'Yes, Confirm Return Received & Fulfill'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Restock Confirmation Modal (Dealer/Admin - Direct Return) */}
            {showRestockModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-emerald-100">
                        <div className="flex items-center space-x-3 text-emerald-700">
                            <div className="p-3 bg-emerald-50 rounded-2xl">
                                <Package className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-black text-gray-900">Verify Returned Stock Received</h3>
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed">
                            Have you physically received and inspected the returned product package at your store/warehouse?
                            <br /><br />
                            Confirming this will restore <strong>{order.items?.length || 0} product item(s)</strong> back into active inventory stock.
                        </p>

                        <div className="flex justify-end space-x-3 pt-2">
                            <button
                                type="button"
                                disabled={isRestocking}
                                onClick={() => setShowRestockModal(false)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
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
