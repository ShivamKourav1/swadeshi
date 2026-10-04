import React, { useState, useEffect } from 'react';
import { router, Link } from '@inertiajs/react';
import {
    ClipboardList,
    X,
    User,
    FileText,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    LogIn,
} from 'lucide-react';

export default function DemandModal({ product, isOpen, onClose, user }) {
    if (!isOpen || !product) return null;

    const [quantity, setQuantity] = useState(1);
    const [swayamsevakId, setSwayamsevakId] = useState('');
    const [notes, setNotes] = useState('');
    const [swayamsevaks, setSwayamsevaks] = useState([]);
    const [loadingSwayamsevaks, setLoadingSwayamsevaks] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen || !user) return;

        setQuantity(1);
        setSwayamsevakId('');
        setNotes('');
        setError('');

        // Fetch swayamsevaks for user's unit/basti if available
        setLoadingSwayamsevaks(true);
        fetch('/api/swayamsevaks', {
            headers: {
                Accept: 'application/json',
            },
        })
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => {
                setSwayamsevaks(Array.isArray(data) ? data : []);
                setLoadingSwayamsevaks(false);
            })
            .catch(() => {
                setSwayamsevaks([]);
                setLoadingSwayamsevaks(false);
            });
    }, [isOpen, product?.id, user]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (quantity < 1) {
            setError('मात्रा कम से कम 1 होनी चाहिए।');
            return;
        }

        setSubmitting(true);
        setError('');

        router.post(
            route('demands.store'),
            {
                product_id: product.id,
                quantity: quantity,
                swayamsevak_id: swayamsevakId || null,
                notes: notes || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSubmitting(false);
                    onClose();
                },
                onError: (err) => {
                    setSubmitting(false);
                    setError(err.message || Object.values(err)[0] || 'मांग दर्ज करने में त्रुटि हुई।');
                },
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-amber-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
                    <div className="flex items-center space-x-2.5">
                        <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl shadow-xs">
                            <ClipboardList className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-stone-900 text-base sm:text-lg">
                                उत्पाद मांग दर्ज करें
                            </h3>
                            <p className="text-[11px] text-stone-500">
                                आउट ऑफ स्टॉक उत्पाद हेतु अग्रिम अनुरोध
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-white transition cursor-pointer"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Unauthenticated Prompt */}
                {!user ? (
                    <div className="p-6 text-center space-y-4">
                        <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto">
                            <LogIn className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-stone-900 text-base">
                            मांग दर्ज करने हेतु लॉगिन आवश्यक है
                        </h4>
                        <p className="text-xs text-stone-500 max-w-xs mx-auto">
                            कृपया अपने खाते में लॉगिन करें ताकि डीलर आपके संपर्क और पते के अनुसार स्टॉक उपलब्ध करा सके।
                        </p>
                        <div className="pt-2 flex items-center justify-center space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-50"
                            >
                                बंद करें
                            </button>
                            <Link
                                href={route('login')}
                                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                            >
                                लॉगिन करें
                            </Link>
                        </div>
                    </div>
                ) : (
                    /* Authenticated Demand Form */
                    <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
                        {error && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Product Summary */}
                        <div className="flex items-center space-x-3.5 bg-amber-50/50 p-3 rounded-2xl border border-amber-100">
                            <div className="w-16 h-16 bg-white rounded-xl border border-stone-200 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/images/products/shirt.svg';
                                    }}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-stone-900 text-sm leading-snug truncate">
                                    {product.name}
                                </h4>
                                {product.sku && (
                                    <div className="text-[11px] text-stone-400 mt-0.5">
                                        कोड: {product.sku}
                                    </div>
                                )}
                                <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-base font-black text-amber-800">
                                        ₹{product.price}
                                    </span>
                                    <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                        वर्तमान स्टॉक: 0
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Info Note */}
                        <div className="text-[11px] text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200 leading-relaxed">
                            ℹ️ यह उत्पाद वर्तमान में आउट ऑफ स्टॉक है। मांग दर्ज करने पर डीलर आपकी आवश्यकता का आकलन कर सकेगा। जैसे ही स्टॉक जोड़ा जाएगा, आपकी मांग प्राथमिकता से पूरी की जाएगी।
                        </div>

                        {/* Quantity Stepper */}
                        <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1.5">
                                अपेक्षित मात्रा (संख्या) <span className="text-rose-500">*</span>
                            </label>
                            <div className="flex items-center space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-10 h-10 bg-stone-100 hover:bg-stone-200 rounded-xl text-lg font-bold flex items-center justify-center transition cursor-pointer"
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-24 text-center py-2 bg-stone-50 border border-stone-300 rounded-xl text-base font-bold focus:ring-2 focus:ring-amber-500"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-10 h-10 bg-stone-100 hover:bg-stone-200 rounded-xl text-lg font-bold flex items-center justify-center transition cursor-pointer"
                                >
                                    +
                                </button>
                                <div className="ml-auto text-right">
                                    <span className="text-[10px] text-stone-400 block">अनुमानित मूल्य</span>
                                    <span className="text-base font-black text-amber-800">
                                        ₹{(parseFloat(product.price || 0) * quantity).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Optional Swayamsevak (Member) Selection */}
                        <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">
                                अभिप्रेत स्वयंसेवक / सदस्य (वैकल्पिक)
                            </label>
                            <select
                                value={swayamsevakId}
                                onChange={(e) => setSwayamsevakId(e.target.value)}
                                disabled={loadingSwayamsevaks}
                                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500"
                            >
                                <option value="">-- कोई नहीं / स्वयं हेतु (सामान्य) --</option>
                                {swayamsevaks.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name} {m.mobile ? `(${m.mobile})` : ''} {m.ganvesh ? '• (गणवेश युक्त)' : ''}
                                    </option>
                                ))}
                            </select>
                            <p className="text-[10px] text-stone-400 mt-1">
                                यदि यह मांग किसी विशिष्ट स्वयंसेवक के लिए है, तो चयन करें।
                            </p>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">
                                विशेष टिप्पणी / निर्देश (वैकल्पिक)
                            </label>
                            <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="उदा. साइज ३८, तत्काल आवश्यकता आदि"
                                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                            />
                        </div>

                        {/* Actions */}
                        <div className="pt-2 flex items-center space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-stone-50 transition cursor-pointer"
                            >
                                रद्द करें
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                            >
                                {submitting ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span>मांग दर्ज हो रही है...</span>
                                    </>
                                ) : (
                                    <>
                                        <ClipboardList className="w-4 h-4" />
                                        <span>मांग दर्ज करें</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
