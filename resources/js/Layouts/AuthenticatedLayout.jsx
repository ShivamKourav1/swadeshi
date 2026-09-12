import React from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { ShoppingCart, Package, Truck, Store, LogOut, User as UserIcon, MapPin, Shield, Globe, Award, Building2, BookOpen } from 'lucide-react';
import { useTranslation } from '@/i18n/translations';

export default function AuthenticatedLayout({ children, title }) {
    const { auth, flash, cartCount, locale } = usePage().props;
    const user = auth?.user;
    const { t } = useTranslation(locale || 'hi');

    const switchLanguage = (targetLocale) => {
        router.post(route('language.switch', targetLocale), {}, { preserveScroll: true });
    };

    return (
        <div className="min-h-screen bg-orange-50/30 flex flex-col font-sans">
            {/* Top Navigation Bar */}
            <header className="bg-white border-b border-amber-100 sticky top-0 z-50 shadow-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        {/* Logo / Brand Name */}
                        <div className="flex items-center space-x-3">
                            <Link href={route('products.index')} className="flex items-center space-x-2">
                                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl shadow-xs">
                                    <Store className="w-5 h-5" />
                                </div>
                                <span className="text-xl font-black bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 bg-clip-text text-transparent">
                                    {t('brand_name')}
                                </span>
                            </Link>
                        </div>

                        {/* Navigation Links */}
                        <nav className="hidden md:flex items-center space-x-6">
                            <Link
                                href={route('products.index')}
                                className="text-gray-700 hover:text-amber-600 font-semibold text-sm transition"
                            >
                                {t('storefront')}
                            </Link>
                            <Link
                                href={route('manual')}
                                className="text-gray-700 hover:text-amber-600 font-semibold text-sm transition flex items-center space-x-1"
                            >
                                <BookOpen className="w-4 h-4 text-amber-600" />
                                <span>{t('user_manual')}</span>
                            </Link>
                            {user && user.role === 'customer' && (
                                <Link
                                    href={route('orders.index')}
                                    className="text-gray-700 hover:text-amber-600 font-semibold text-sm transition"
                                >
                                    {t('my_orders')}
                                </Link>
                            )}
                            {user && (
                                <Link
                                    href={route('locations.index')}
                                    className="text-gray-700 hover:text-amber-600 font-semibold text-sm transition flex items-center space-x-1"
                                >
                                    <MapPin className="w-4 h-4 text-gray-500" />
                                    <span>{t('saved_locations')}</span>
                                </Link>
                            )}

                            {(user?.role === 'dealer' || user?.role === 'admin') && (
                                <>
                                    <Link
                                        href={route('dealer.products.index')}
                                        className="text-gray-700 hover:text-amber-600 font-semibold text-sm transition"
                                    >
                                        {t('dealer_inventory')}
                                    </Link>
                                    <Link
                                        href={route('dealer.categories.index')}
                                        className="text-amber-800 bg-amber-100/80 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-amber-200 transition"
                                    >
                                        {t('dealer_categories')}
                                    </Link>
                                    <Link
                                        href={route('dealer.orders.index')}
                                        className="text-gray-700 hover:text-amber-600 font-semibold text-sm transition"
                                    >
                                        {t('dealer_orders')}
                                    </Link>
                                </>
                            )}

                            {(user?.role === 'karyakarta' || user?.role === 'admin') && (
                                <>
                                    <Link
                                        href={route('karyakarta.dashboard')}
                                        className="text-amber-900 bg-amber-100 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-amber-200 transition flex items-center space-x-1.5"
                                    >
                                        <Award className="w-4 h-4 text-amber-700" />
                                        <span>{t('karyakarta_panel')}</span>
                                    </Link>
                                    <Link
                                        href={route('karyakarta.units.index')}
                                        className="text-amber-900 bg-amber-200/80 px-3 py-1.5 rounded-lg text-sm font-extrabold hover:bg-amber-300 transition flex items-center space-x-1.5 shadow-xs"
                                    >
                                        <Building2 className="w-4 h-4 text-amber-800" />
                                        <span>{t('org_units')}</span>
                                    </Link>
                                </>
                            )}

                            {(user?.role === 'delivery_partner' || user?.role === 'admin') && (
                                <Link
                                    href={route('delivery.index')}
                                    className="text-orange-800 bg-orange-100/80 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-orange-200 transition flex items-center space-x-1"
                                >
                                    <Truck className="w-4 h-4 text-orange-700" />
                                    <span>{t('delivery_panel')}</span>
                                </Link>
                            )}

                            {user?.role === 'admin' && (
                                <>
                                    <Link
                                        href={route('admin.users.index')}
                                        className="text-purple-800 bg-purple-100 px-3 py-1.5 rounded-lg text-sm font-extrabold hover:bg-purple-200 transition flex items-center space-x-1"
                                    >
                                        <Shield className="w-4 h-4 text-purple-700" />
                                        <span>{t('admin_panel')}</span>
                                    </Link>
                                    <Link
                                        href={route('admin.roles.index')}
                                        className="text-indigo-800 bg-indigo-100 px-3 py-1.5 rounded-lg text-sm font-extrabold hover:bg-indigo-200 transition flex items-center space-x-1"
                                    >
                                        <Shield className="w-4 h-4 text-indigo-700" />
                                        <span>{t('roles_rights')}</span>
                                    </Link>
                                </>
                            )}
                        </nav>

                        {/* User Actions & Language Switcher */}
                        <div className="flex items-center space-x-4">
                            {/* Language Switcher Control Button */}
                            <div className="flex items-center bg-gray-100 border border-gray-200 rounded-xl p-1 text-xs font-bold">
                                <button
                                    onClick={() => switchLanguage('hi')}
                                    className={`px-2.5 py-1 rounded-lg transition ${
                                        (locale || 'hi') === 'hi'
                                            ? 'bg-white text-amber-700 shadow-sm font-extrabold'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    🇮🇳 हिंदी
                                </button>
                                <button
                                    onClick={() => switchLanguage('en')}
                                    className={`px-2.5 py-1 rounded-lg transition ${
                                        locale === 'en'
                                            ? 'bg-white text-amber-700 shadow-sm font-extrabold'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    🇬🇧 English
                                </button>
                            </div>

                            {/* Shopping Cart Icon */}
                            <Link
                                href={route('cart.index')}
                                className="relative p-2 text-gray-700 hover:text-amber-600 transition"
                                title={t('shopping_cart')}
                            >
                                <ShoppingCart className="w-6 h-6" />
                                {cartCount > 0 && (
                                    <span className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse shadow-xs">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>

                            {/* User Profile / Auth Status */}
                            {user ? (
                                <div className="flex items-center space-x-3 border-l pl-4 border-gray-200">
                                    <div className="text-right hidden sm:block">
                                        <div className="text-sm font-bold text-gray-900">{user.name}</div>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                                            {user.role}
                                        </span>
                                    </div>
                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="p-2 text-gray-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                                        title={t('logout')}
                                    >
                                        <LogOut className="w-5 h-5" />
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-3">
                                    <Link
                                        href={route('login')}
                                        className="text-sm font-bold text-gray-700 hover:text-amber-600 transition"
                                    >
                                        {t('sign_in')}
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-md transition"
                                    >
                                        {t('register')}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Flash Messages */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 w-full">
                {flash?.success && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl shadow-sm text-sm font-medium flex items-center justify-between">
                        <span>✅ {flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl shadow-sm text-sm font-medium flex items-center justify-between">
                        <span>⚠️ {flash.error}</span>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-amber-100 py-6 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
                    वस्तु भंडार (Vastu Bhandar) Platform &copy; 2026. Production-Ready Bilingual (Hindi / English) Laravel 12 + React Engine.
                </div>
            </footer>
        </div>
    );
}
