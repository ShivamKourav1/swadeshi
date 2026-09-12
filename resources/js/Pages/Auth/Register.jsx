import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Store, UserPlus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/i18n/translations';

export default function Register() {
    const { locale } = usePage().props;
    const { t } = useTranslation(locale || 'hi');
    const isHi = (locale || 'hi') === 'hi';

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('register'));
    };

    return (
        <div className="min-h-screen bg-orange-50/40 flex items-center justify-center p-4">
            <Head title={isHi ? 'ग्राहक पंजीकरण | वस्तु भंडार' : 'Customer Registration | Vastu Bhandar'} />

            <div className="max-w-md w-full bg-white rounded-3xl border border-amber-100 p-8 shadow-xl space-y-6">
                {/* Brand Logo & Heading */}
                <div className="text-center">
                    <Link href="/" className="inline-flex items-center space-x-2 text-amber-600 font-extrabold text-2xl mb-2">
                        <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl shadow-xs">
                            <Store className="w-6 h-6" />
                        </div>
                        <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                            {t('brand_name')}
                        </span>
                    </Link>
                    <h2 className="text-xl font-bold text-gray-900 mt-1">
                        {isHi ? 'ग्राहक खाता बनाएं' : 'Create Customer Account'}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        {isHi 
                            ? 'उत्पादों की खरीदारी एवं ऑर्डर ट्रैकिंग हेतु पंजीकरण करें।'
                            : 'Sign up to browse, track, and order products.'}
                    </p>
                </div>

                {/* Registration Form */}
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    {/* Full Name */}
                    <div>
                        <label className="block font-bold text-gray-700 uppercase mb-1">
                            {isHi ? 'पूरा नाम *' : 'Full Name *'}
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder={isHi ? 'उदा. राहुल शर्मा' : 'e.g. John Doe'}
                            required
                            className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                        />
                        {errors.name && <div className="text-rose-600 mt-1 font-semibold">{errors.name}</div>}
                    </div>

                    {/* Phone Number */}
                    <div>
                        <label className="block font-bold text-gray-700 uppercase mb-1">
                            {isHi ? 'फ़ोन नंबर' : 'Phone Number'}
                        </label>
                        <input
                            type="tel"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            placeholder="+91 98765 43210"
                            className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                        />
                        {errors.phone && <div className="text-rose-600 mt-1 font-semibold">{errors.phone}</div>}
                    </div>

                    {/* Email Address */}
                    <div>
                        <label className="block font-bold text-gray-700 uppercase mb-1">
                            {isHi ? 'ईमेल पता *' : 'Email Address *'}
                        </label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="name@example.com"
                            required
                            className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                        />
                        {errors.email && <div className="text-rose-600 mt-1 font-semibold">{errors.email}</div>}
                    </div>

                    {/* Passwords */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block font-bold text-gray-700 uppercase mb-1">
                                {isHi ? 'पासवर्ड *' : 'Password *'}
                            </label>
                            <input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                required
                                className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                            />
                            {errors.password && <div className="text-rose-600 mt-1 font-semibold">{errors.password}</div>}
                        </div>
                        <div>
                            <label className="block font-bold text-gray-700 uppercase mb-1">
                                {isHi ? 'पासवर्ड पुष्टि *' : 'Confirm Password *'}
                            </label>
                            <input
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                required
                                className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:from-amber-300 disabled:to-orange-300 text-white font-extrabold text-sm rounded-xl transition shadow-md shadow-amber-500/20 flex items-center justify-center space-x-2 cursor-pointer mt-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>{isHi ? 'खाता बनाएं' : 'Register Account'}</span>
                    </button>
                </form>

                {/* Sign In Link */}
                <div className="text-center text-xs text-gray-500 border-t border-gray-100 pt-4">
                    {isHi ? 'पहले से खाता है? ' : 'Already have an account? '}
                    <Link href={route('login')} className="text-amber-600 font-bold hover:underline">
                        {isHi ? 'साइन इन करें' : 'Sign In'}
                    </Link>
                </div>
            </div>
        </div>
    );
}
