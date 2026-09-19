import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Store, LogIn } from 'lucide-react';

export default function Login({ showDemoCredentials }) {
    const { is_production } = usePage().props;
    const canShowDemo = showDemoCredentials !== undefined
        ? Boolean(showDemoCredentials)
        : !Boolean(is_production);

    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    const fillDemo = (email) => {
        setData({
            email: email,
            password: 'password',
            remember: false,
        });
    };

    return (
        <div className="min-h-screen bg-orange-50/40 flex items-center justify-center p-4">
            <Head title="Sign In" />

            <div className="max-w-md w-full bg-white rounded-3xl border border-amber-100 p-8 shadow-xl space-y-6">
                <div className="text-center">
                    <Link href="/" className="inline-flex items-center space-x-2 text-amber-600 font-extrabold text-2xl mb-2">
                        <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl shadow-xs">
                            <Store className="w-6 h-6" />
                        </div>
                        <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">वस्तु भंडार</span>
                    </Link>
                    <h2 className="text-xl font-bold text-gray-900">Welcome Back</h2>
                    <p className="text-xs text-gray-500 mt-1">Sign in to your customer, dealer, or delivery partner account</p>
                </div>

                {/* Quick Demo Credentials Assistant (Hidden in production) */}
                {canShowDemo && (
                    <div className="bg-amber-50 border border-amber-200/80 p-3.5 rounded-2xl text-xs space-y-2">
                        <div className="font-extrabold text-amber-900 uppercase text-[11px]">Quick Demo Login Shortcuts:</div>
                        <div className="flex flex-wrap gap-1.5">
                            <button type="button" onClick={() => fillDemo('customer@ecommerce.com')} className="bg-white hover:bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200 font-bold transition cursor-pointer">
                                Customer
                            </button>
                            <button type="button" onClick={() => fillDemo('dealer@ecommerce.com')} className="bg-white hover:bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200 font-bold transition cursor-pointer">
                                Dealer
                            </button>
                            <button type="button" onClick={() => fillDemo('delivery@ecommerce.com')} className="bg-white hover:bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200 font-bold transition cursor-pointer">
                                Delivery Agent
                            </button>
                            <button type="button" onClick={() => fillDemo('karyakarta@ecommerce.com')} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-2.5 py-1 rounded-lg font-extrabold transition cursor-pointer shadow-xs">
                                Karyakarta (Jila)
                            </button>
                            <button type="button" onClick={() => fillDemo('karyakarta_vibhag@ecommerce.com')} className="bg-white hover:bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200 font-bold transition cursor-pointer">
                                Karyakarta (Vibhag)
                            </button>
                            <button type="button" onClick={() => fillDemo('admin@ecommerce.com')} className="bg-white hover:bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200 font-bold transition cursor-pointer">
                                Admin
                            </button>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    <div>
                        <label className="block font-bold text-gray-700 uppercase mb-1">
                            Email Address or Mobile Number (ईमेल या मोबाइल नंबर)
                        </label>
                        <input
                            type="text"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="e.g. user@example.com or 9826012345"
                            className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                        />
                        {errors.email && <div className="text-rose-600 mt-1">{errors.email}</div>}
                    </div>

                    <div>
                        <label className="block font-bold text-gray-700 uppercase mb-1">Password</label>
                        <input
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                        />
                        {errors.password && <div className="text-rose-600 mt-1">{errors.password}</div>}
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2 font-semibold text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="rounded text-amber-600 focus:ring-amber-500"
                            />
                            <span>Remember Me</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:from-amber-300 disabled:to-orange-300 text-white font-extrabold text-sm rounded-xl transition shadow-md shadow-amber-500/20 flex items-center justify-center space-x-2 cursor-pointer"
                    >
                        <LogIn className="w-4 h-4" />
                        <span>Sign In</span>
                    </button>
                </form>

                <div className="text-center text-xs text-gray-500 border-t border-gray-100 pt-4">
                    Don't have an account?{' '}
                    <Link href={route('register')} className="text-amber-600 font-bold hover:underline">
                        Register Now
                    </Link>
                </div>
            </div>
        </div>
    );
}
