import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    ShoppingCart,
    Package,
    Truck,
    Store,
    LogOut,
    User as UserIcon,
    MapPin,
    Shield,
    Globe,
    Award,
    Building2,
    BookOpen,
    Layers,
    Users,
    KeyRound,
    ChevronDown,
    Menu,
    X,
} from 'lucide-react';
import { useTranslation } from '@/i18n/translations';

export default function AuthenticatedLayout({ children, title }) {
    const { auth, flash, cartCount, locale } = usePage().props;
    const { url } = usePage();
    const user = auth?.user;
    const { t } = useTranslation(locale || 'hi');

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);

    const switchLanguage = (targetLocale) => {
        router.post(route('language.switch', targetLocale), {}, { preserveScroll: true });
    };

    const toggleDropdown = (name) => {
        setOpenDropdown(openDropdown === name ? null : name);
    };

    // Close dropdowns on outside click or Escape key
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('[data-dropdown-container]')) {
                setOpenDropdown(null);
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setOpenDropdown(null);
                setMobileMenuOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Close menus on page navigation
    useEffect(() => {
        setMobileMenuOpen(false);
        setOpenDropdown(null);
    }, [url]);

    // Lock body scroll when mobile drawer is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [mobileMenuOpen]);

    // Permissions & Roles
    const isSuperadmin = Boolean(user?.is_superadmin || user?.role === 'superadmin');
    const isAdmin = Boolean(isSuperadmin || user?.is_admin || user?.role === 'admin' || user?.is_toli_admin);
    const isDealer = Boolean(isAdmin || user?.is_dealer || user?.role === 'dealer');
    const isKaryakarta = Boolean(isAdmin || user?.is_karyakarta || user?.role === 'karyakarta' || user?.role?.includes('karyakarta'));
    const isDelivery = Boolean(isAdmin || user?.is_delivery_partner || user?.role === 'delivery_partner');
    const isCustomerOnly = Boolean(user && !isDealer && !isAdmin && !isKaryakarta && !isDelivery);

    // Active link helpers
    const isStorefrontActive = url === '/' || (url.startsWith('/products') && !url.startsWith('/dealer/products'));
    const isManualActive = url.startsWith('/manual');
    const isOrdersActive = url.startsWith('/orders');
    const isLocationsActive = url.startsWith('/locations');
    const isDealerActive = url.startsWith('/dealer');
    const isKaryakartaActive = url.startsWith('/karyakarta');
    const isDeliveryActive = url.startsWith('/delivery');
    const isAdminActive = url.startsWith('/admin');

    const getRoleBadge = () => {
        if (!user) return null;
        if (isSuperadmin) {
            return { label: t('superadmin'), color: 'bg-purple-100 text-purple-800 border-purple-200' };
        }
        if (user.is_toli_admin) {
            return { label: 'Toli Admin', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
        }
        if (user.is_admin || user.role === 'admin') {
            return { label: t('admin'), color: 'bg-purple-100 text-purple-800 border-purple-200' };
        }
        if (user.is_karyakarta || user.role === 'karyakarta') {
            return { label: t('karyakarta'), color: 'bg-amber-100 text-amber-800 border-amber-200' };
        }
        if (user.is_dealer || user.role === 'dealer') {
            return { label: t('dealer'), color: 'bg-orange-100 text-orange-800 border-orange-200' };
        }
        if (user.is_delivery_partner || user.role === 'delivery_partner') {
            return { label: t('delivery'), color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
        }
        return { label: user.role || 'Customer', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    };

    const roleBadge = getRoleBadge();

    return (
        <div className="min-h-screen bg-orange-50/30 flex flex-col font-sans overflow-x-hidden">
            {/* Top Navigation Bar */}
            <header className="bg-white border-b border-amber-100 sticky top-0 z-40 shadow-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center gap-2">
                        {/* Left: Mobile Menu Toggle Button & Brand Logo */}
                        <div className="flex items-center space-x-2.5 sm:space-x-3 flex-shrink-0">
                            {/* Mobile Hamburger Button (Visible on < lg) */}
                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="lg:hidden p-2 rounded-xl text-gray-700 hover:text-amber-600 hover:bg-amber-50 focus:outline-none transition cursor-pointer"
                                aria-label="Toggle Navigation Menu"
                            >
                                {mobileMenuOpen ? (
                                    <X className="w-6 h-6 text-amber-700" />
                                ) : (
                                    <Menu className="w-6 h-6" />
                                )}
                            </button>

                            {/* Brand Logo & Name */}
                            <Link href={route('products.index')} className="flex items-center space-x-2 sm:space-x-2.5">
                                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl shadow-xs flex-shrink-0">
                                    <Store className="w-5 h-5" />
                                </div>
                                <span className="text-lg sm:text-xl font-black bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 bg-clip-text text-transparent tracking-tight whitespace-nowrap">
                                    {t('brand_name')}
                                </span>
                            </Link>
                        </div>

                        {/* Middle: Desktop Navigation Bar (Visible on lg: 1024px and wider) */}
                        <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
                            {/* Storefront */}
                            <Link
                                href={route('products.index')}
                                className={`px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl text-xs xl:text-sm font-bold transition flex items-center space-x-1.5 ${
                                    isStorefrontActive
                                        ? 'text-amber-800 bg-amber-100/70 font-black'
                                        : 'text-gray-700 hover:text-amber-600 hover:bg-amber-50/50'
                                }`}
                            >
                                <span>{t('storefront')}</span>
                            </Link>

                            {/* User Manual */}
                            <Link
                                href={route('manual')}
                                className={`px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl text-xs xl:text-sm font-bold transition flex items-center space-x-1.5 ${
                                    isManualActive
                                        ? 'text-amber-800 bg-amber-100/70 font-black'
                                        : 'text-gray-700 hover:text-amber-600 hover:bg-amber-50/50'
                                }`}
                            >
                                <BookOpen className="w-4 h-4 text-amber-600" />
                                <span>{t('user_manual')}</span>
                            </Link>

                            {/* Customer Only Direct Links */}
                            {isCustomerOnly && (
                                <>
                                    <Link
                                        href={route('orders.index')}
                                        className={`px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl text-xs xl:text-sm font-bold transition ${
                                            isOrdersActive
                                                ? 'text-amber-800 bg-amber-100/70 font-black'
                                                : 'text-gray-700 hover:text-amber-600 hover:bg-amber-50/50'
                                        }`}
                                    >
                                        {t('my_orders')}
                                    </Link>
                                    <Link
                                        href={route('locations.index')}
                                        className={`px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl text-xs xl:text-sm font-bold transition flex items-center space-x-1 ${
                                            isLocationsActive
                                                ? 'text-amber-800 bg-amber-100/70 font-black'
                                                : 'text-gray-700 hover:text-amber-600 hover:bg-amber-50/50'
                                        }`}
                                    >
                                        <MapPin className="w-3.5 h-3.5 text-gray-500" />
                                        <span>{t('saved_locations')}</span>
                                    </Link>
                                </>
                            )}

                            {/* Dealer Dropdown */}
                            {isDealer && (
                                <div className="relative" data-dropdown-container>
                                    <button
                                        type="button"
                                        onClick={() => toggleDropdown('dealer')}
                                        className={`px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                                            isDealerActive
                                                ? 'bg-amber-100 text-amber-950 border-amber-300 ring-2 ring-amber-400/20'
                                                : 'bg-amber-50/60 text-amber-900 border-amber-200 hover:bg-amber-100'
                                        }`}
                                    >
                                        <Package className="w-3.5 h-3.5 text-amber-700" />
                                        <span>{t('dealer')}</span>
                                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === 'dealer' ? 'rotate-180' : ''}`} />
                                    </button>

                                    {openDropdown === 'dealer' && (
                                        <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-amber-100 p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                                            <Link
                                                href={route('dealer.products.index')}
                                                onClick={() => setOpenDropdown(null)}
                                                className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-amber-700 hover:bg-amber-50 transition"
                                            >
                                                <Package className="w-4 h-4 text-amber-600" />
                                                <span>{t('dealer_inventory')}</span>
                                            </Link>
                                            <Link
                                                href={route('dealer.categories.index')}
                                                onClick={() => setOpenDropdown(null)}
                                                className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-amber-700 hover:bg-amber-50 transition"
                                            >
                                                <Layers className="w-4 h-4 text-amber-600" />
                                                <span>{t('dealer_categories')}</span>
                                            </Link>
                                            <Link
                                                href={route('dealer.orders.index')}
                                                onClick={() => setOpenDropdown(null)}
                                                className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-amber-700 hover:bg-amber-50 transition"
                                            >
                                                <ShoppingCart className="w-4 h-4 text-amber-600" />
                                                <span>{t('dealer_orders')}</span>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Karyakarta Dropdown */}
                            {isKaryakarta && (
                                <div className="relative" data-dropdown-container>
                                    <button
                                        type="button"
                                        onClick={() => toggleDropdown('karyakarta')}
                                        className={`px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                                            isKaryakartaActive
                                                ? 'bg-orange-100 text-orange-950 border-orange-300 ring-2 ring-orange-400/20'
                                                : 'bg-orange-50/60 text-orange-900 border-orange-200 hover:bg-orange-100'
                                        }`}
                                    >
                                        <Award className="w-3.5 h-3.5 text-orange-700" />
                                        <span>{t('karyakarta')}</span>
                                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === 'karyakarta' ? 'rotate-180' : ''}`} />
                                    </button>

                                    {openDropdown === 'karyakarta' && (
                                        <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-orange-100 p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                                            <Link
                                                href={route('karyakarta.dashboard')}
                                                onClick={() => setOpenDropdown(null)}
                                                className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-orange-700 hover:bg-orange-50 transition"
                                            >
                                                <Award className="w-4 h-4 text-orange-600" />
                                                <span>{t('karyakarta_panel')}</span>
                                            </Link>
                                            <Link
                                                href={route('karyakarta.units.index')}
                                                onClick={() => setOpenDropdown(null)}
                                                className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-orange-700 hover:bg-orange-50 transition"
                                            >
                                                <Building2 className="w-4 h-4 text-orange-600" />
                                                <span>{t('org_units')}</span>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Delivery Agent Panel (Direct compact pill) */}
                            {isDelivery && (
                                <Link
                                    href={route('delivery.index')}
                                    className={`px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border ${
                                        isDeliveryActive
                                            ? 'bg-emerald-100 text-emerald-950 border-emerald-300 ring-2 ring-emerald-400/20'
                                            : 'bg-emerald-50/60 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                                    }`}
                                >
                                    <Truck className="w-3.5 h-3.5 text-emerald-700" />
                                    <span>{t('delivery')}</span>
                                </Link>
                            )}

                            {/* Administration Dropdown (Purple Theme) */}
                            {isAdmin && (
                                <div className="relative" data-dropdown-container>
                                    <button
                                        type="button"
                                        onClick={() => toggleDropdown('admin')}
                                        className={`px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl text-xs font-extrabold transition flex items-center space-x-1.5 cursor-pointer border ${
                                            isAdminActive
                                                ? 'bg-purple-100 text-purple-950 border-purple-300 ring-2 ring-purple-400/20'
                                                : 'bg-purple-50/60 text-purple-900 border-purple-200 hover:bg-purple-100'
                                        }`}
                                    >
                                        <Shield className="w-3.5 h-3.5 text-purple-700" />
                                        <span>{isSuperadmin ? t('superadmin') : t('admin')}</span>
                                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === 'admin' ? 'rotate-180' : ''}`} />
                                    </button>

                                    {openDropdown === 'admin' && (
                                        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-purple-100 p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                                            <Link
                                                href={route('admin.users.index')}
                                                onClick={() => setOpenDropdown(null)}
                                                className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-purple-700 hover:bg-purple-50 transition"
                                            >
                                                <Users className="w-4 h-4 text-purple-600" />
                                                <span>{t('admin_panel')} ({t('user_management')})</span>
                                            </Link>
                                            {isSuperadmin && (
                                                <Link
                                                    href={route('admin.roles.index')}
                                                    onClick={() => setOpenDropdown(null)}
                                                    className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 transition"
                                                >
                                                    <KeyRound className="w-4 h-4 text-indigo-600" />
                                                    <span>{t('roles_rights')}</span>
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </nav>

                        {/* Right: Actions (Language, Cart, Profile, Logout) */}
                        {/* flex-shrink-0 guarantees this section is NEVER clipped or pushed out of view! */}
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 ml-auto">
                            {/* Language Switcher */}
                            <div className="flex items-center bg-gray-100 border border-gray-200 rounded-xl p-0.5 text-xs font-bold flex-shrink-0">
                                <button
                                    onClick={() => switchLanguage('hi')}
                                    className={`px-2 py-1 rounded-lg transition text-[11px] sm:text-xs cursor-pointer ${
                                        (locale || 'hi') === 'hi'
                                            ? 'bg-white text-amber-800 shadow-2xs font-black'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                    title="हिंदी"
                                >
                                    🇮🇳 HI
                                </button>
                                <button
                                    onClick={() => switchLanguage('en')}
                                    className={`px-2 py-1 rounded-lg transition text-[11px] sm:text-xs cursor-pointer ${
                                        locale === 'en'
                                            ? 'bg-white text-amber-800 shadow-2xs font-black'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                    title="English"
                                >
                                    🇬🇧 EN
                                </button>
                            </div>

                            {/* Shopping Cart Icon */}
                            <Link
                                href={route('cart.index')}
                                className="relative p-2 text-gray-700 hover:text-amber-600 transition flex-shrink-0"
                                title={t('shopping_cart')}
                            >
                                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                                {cartCount > 0 && (
                                    <span className="absolute top-0.5 right-0.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] sm:text-xs font-black w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center animate-pulse shadow-xs">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>

                            {/* User Authentication Status / Profile */}
                            {user ? (
                                <div className="flex items-center space-x-1.5 sm:space-x-2 border-l pl-2 sm:pl-3 border-gray-200 flex-shrink-0">
                                    {/* Profile Dropdown */}
                                    <div className="relative" data-dropdown-container>
                                        <button
                                            type="button"
                                            onClick={() => toggleDropdown('user')}
                                            className="flex items-center space-x-2 p-1 sm:px-2.5 sm:py-1 rounded-xl hover:bg-amber-50/70 transition cursor-pointer border border-transparent hover:border-amber-200"
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-black text-xs flex items-center justify-center shadow-xs flex-shrink-0">
                                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <div className="text-left hidden xl:block">
                                                <div className="text-xs font-bold text-gray-900 truncate max-w-[120px]">
                                                    {user.name}
                                                </div>
                                                <span className={`inline-block text-[10px] font-black px-1.5 py-0.2 rounded border uppercase tracking-wider ${roleBadge.color}`}>
                                                    {roleBadge.label}
                                                </span>
                                            </div>
                                            <ChevronDown className={`w-3.5 h-3.5 text-gray-500 hidden sm:block transition-transform duration-200 ${openDropdown === 'user' ? 'rotate-180' : ''}`} />
                                        </button>

                                        {/* User Dropdown Menu */}
                                        {openDropdown === 'user' && (
                                            <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-amber-100 p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                                                <div className="p-3 border-b border-gray-100 bg-amber-50/40 rounded-xl mb-1">
                                                    <div className="font-extrabold text-sm text-gray-900 truncate">{user.name}</div>
                                                    <div className="text-xs text-gray-500 truncate">{user.email || user.phone}</div>
                                                    <div className="mt-1.5">
                                                        <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider ${roleBadge.color}`}>
                                                            {roleBadge.label}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-0.5 py-1">
                                                    <Link
                                                        href={route('orders.index')}
                                                        onClick={() => setOpenDropdown(null)}
                                                        className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-amber-700 hover:bg-amber-50 transition"
                                                    >
                                                        <ShoppingCart className="w-4 h-4 text-amber-600" />
                                                        <span>{t('my_orders')}</span>
                                                    </Link>
                                                    <Link
                                                        href={route('locations.index')}
                                                        onClick={() => setOpenDropdown(null)}
                                                        className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-amber-700 hover:bg-amber-50 transition"
                                                    >
                                                        <MapPin className="w-4 h-4 text-amber-600" />
                                                        <span>{t('saved_locations')}</span>
                                                    </Link>
                                                </div>

                                                <div className="border-t border-gray-100 pt-1 mt-1">
                                                    <Link
                                                        href={route('logout')}
                                                        method="post"
                                                        as="button"
                                                        onClick={() => setOpenDropdown(null)}
                                                        className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        <span>{t('logout')}</span>
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Direct Quick Logout Button (Always in view, never hidden!) */}
                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="p-2 text-gray-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition cursor-pointer flex-shrink-0"
                                        title={t('logout')}
                                    >
                                        <LogOut className="w-5 h-5" />
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                    <Link
                                        href={route('login')}
                                        className="text-xs sm:text-sm font-bold text-gray-700 hover:text-amber-600 transition px-2 py-1 whitespace-nowrap"
                                    >
                                        {t('sign_in')}
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs sm:text-sm font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-md transition whitespace-nowrap"
                                    >
                                        {t('register')}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Drawer Backdrop */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 lg:hidden animate-in fade-in duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Navigation Drawer Sheet */}
            <div
                className={`fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl z-50 lg:hidden flex flex-col transform transition-transform duration-300 ease-in-out ${
                    mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Drawer Header */}
                <div className="p-4 border-b border-amber-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 flex-shrink-0">
                    <div className="flex items-center space-x-2.5">
                        <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl shadow-xs">
                            <Store className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-base font-black text-gray-900 leading-tight">{t('brand_name')}</div>
                            <div className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">
                                {user ? roleBadge.label : 'Guest'}
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-white/80 transition cursor-pointer"
                        aria-label="Close Menu"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Drawer Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* User Profile Card */}
                    {user ? (
                        <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-black text-sm flex items-center justify-center shadow-xs flex-shrink-0">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-extrabold text-gray-900 truncate">{user.name}</div>
                                <div className="text-xs text-gray-500 truncate">{user.email || user.phone}</div>
                                <div className="mt-1">
                                    <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${roleBadge.color}`}>
                                        {roleBadge.label}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            <Link
                                href={route('login')}
                                onClick={() => setMobileMenuOpen(false)}
                                className="w-full text-center py-2.5 px-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 hover:bg-gray-50"
                            >
                                {t('sign_in')}
                            </Link>
                            <Link
                                href={route('register')}
                                onClick={() => setMobileMenuOpen(false)}
                                className="w-full text-center py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold shadow-xs hover:from-amber-600 hover:to-orange-700"
                            >
                                {t('register')}
                            </Link>
                        </div>
                    )}

                    {/* Language Switcher Row in Drawer */}
                    <div className="bg-amber-50/60 p-2.5 rounded-2xl border border-amber-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-700 flex items-center space-x-1.5">
                            <Globe className="w-4 h-4 text-amber-600" />
                            <span>भाषा / Language</span>
                        </span>
                        <div className="flex items-center space-x-1.5">
                            <button
                                onClick={() => switchLanguage('hi')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    (locale || 'hi') === 'hi'
                                        ? 'bg-amber-600 text-white shadow-2xs'
                                        : 'bg-white text-gray-700 hover:bg-amber-100'
                                }`}
                            >
                                हिंदी
                            </button>
                            <button
                                onClick={() => switchLanguage('en')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    locale === 'en'
                                        ? 'bg-amber-600 text-white shadow-2xs'
                                        : 'bg-white text-gray-700 hover:bg-amber-100'
                                }`}
                            >
                                English
                            </button>
                        </div>
                    </div>

                    {/* General Store Navigation */}
                    <div className="space-y-1">
                        <div className="text-[11px] font-black uppercase tracking-wider text-gray-400 px-3 py-1">
                            {t('storefront')}
                        </div>
                        <Link
                            href={route('products.index')}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold transition ${
                                isStorefrontActive
                                    ? 'bg-amber-100/70 text-amber-950 font-black'
                                    : 'text-gray-700 hover:bg-amber-50 hover:text-amber-800'
                            }`}
                        >
                            <Store className="w-4 h-4 text-amber-600" />
                            <span>{t('storefront')}</span>
                        </Link>
                        <Link
                            href={route('manual')}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold transition ${
                                isManualActive
                                    ? 'bg-amber-100/70 text-amber-950 font-black'
                                    : 'text-gray-700 hover:bg-amber-50 hover:text-amber-800'
                            }`}
                        >
                            <BookOpen className="w-4 h-4 text-amber-600" />
                            <span>{t('user_manual')}</span>
                        </Link>
                        {user && (
                            <>
                                <Link
                                    href={route('orders.index')}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold transition ${
                                        isOrdersActive
                                            ? 'bg-amber-100/70 text-amber-950 font-black'
                                            : 'text-gray-700 hover:bg-amber-50 hover:text-amber-800'
                                    }`}
                                >
                                    <ShoppingCart className="w-4 h-4 text-amber-600" />
                                    <span>{t('my_orders')}</span>
                                </Link>
                                <Link
                                    href={route('locations.index')}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold transition ${
                                        isLocationsActive
                                            ? 'bg-amber-100/70 text-amber-950 font-black'
                                            : 'text-gray-700 hover:bg-amber-50 hover:text-amber-800'
                                    }`}
                                >
                                    <MapPin className="w-4 h-4 text-amber-600" />
                                    <span>{t('saved_locations')}</span>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Administration Section (If Admin / Superadmin) */}
                    {isAdmin && (
                        <div className="space-y-1 pt-2 border-t border-gray-100">
                            <div className="text-[11px] font-black uppercase tracking-wider text-purple-700 px-3 py-1 flex items-center space-x-1.5">
                                <Shield className="w-3.5 h-3.5 text-purple-700" />
                                <span>{isSuperadmin ? t('superadmin') : t('admin')}</span>
                            </div>
                            <Link
                                href={route('admin.users.index')}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold text-purple-900 hover:bg-purple-50 transition"
                            >
                                <Users className="w-4 h-4 text-purple-700" />
                                <span>{t('admin_panel')} ({t('user_management')})</span>
                            </Link>
                            {isSuperadmin && (
                                <Link
                                    href={route('admin.roles.index')}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold text-indigo-900 hover:bg-indigo-50 transition"
                                >
                                    <KeyRound className="w-4 h-4 text-indigo-700" />
                                    <span>{t('roles_rights')}</span>
                                </Link>
                            )}
                        </div>
                    )}

                    {/* Karyakarta Section */}
                    {isKaryakarta && (
                        <div className="space-y-1 pt-2 border-t border-gray-100">
                            <div className="text-[11px] font-black uppercase tracking-wider text-orange-700 px-3 py-1 flex items-center space-x-1.5">
                                <Award className="w-3.5 h-3.5 text-orange-700" />
                                <span>{t('karyakarta')}</span>
                            </div>
                            <Link
                                href={route('karyakarta.dashboard')}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold text-orange-900 hover:bg-orange-50 transition"
                            >
                                <Award className="w-4 h-4 text-orange-700" />
                                <span>{t('karyakarta_panel')}</span>
                            </Link>
                            <Link
                                href={route('karyakarta.units.index')}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold text-orange-900 hover:bg-orange-50 transition"
                            >
                                <Building2 className="w-4 h-4 text-orange-700" />
                                <span>{t('org_units')}</span>
                            </Link>
                        </div>
                    )}

                    {/* Dealer Operations Section */}
                    {isDealer && (
                        <div className="space-y-1 pt-2 border-t border-gray-100">
                            <div className="text-[11px] font-black uppercase tracking-wider text-amber-700 px-3 py-1 flex items-center space-x-1.5">
                                <Package className="w-3.5 h-3.5 text-amber-700" />
                                <span>{t('dealer')}</span>
                            </div>
                            <Link
                                href={route('dealer.products.index')}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold text-amber-900 hover:bg-amber-50 transition"
                            >
                                <Package className="w-4 h-4 text-amber-700" />
                                <span>{t('dealer_inventory')}</span>
                            </Link>
                            <Link
                                href={route('dealer.categories.index')}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold text-amber-900 hover:bg-amber-50 transition"
                            >
                                <Layers className="w-4 h-4 text-amber-700" />
                                <span>{t('dealer_categories')}</span>
                            </Link>
                            <Link
                                href={route('dealer.orders.index')}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold text-amber-900 hover:bg-amber-50 transition"
                            >
                                <ShoppingCart className="w-4 h-4 text-amber-700" />
                                <span>{t('dealer_orders')}</span>
                            </Link>
                        </div>
                    )}

                    {/* Delivery Partner Section */}
                    {isDelivery && (
                        <div className="space-y-1 pt-2 border-t border-gray-100">
                            <div className="text-[11px] font-black uppercase tracking-wider text-emerald-700 px-3 py-1 flex items-center space-x-1.5">
                                <Truck className="w-3.5 h-3.5 text-emerald-700" />
                                <span>{t('delivery')}</span>
                            </div>
                            <Link
                                href={route('delivery.index')}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold text-emerald-900 hover:bg-emerald-50 transition"
                            >
                                <Truck className="w-4 h-4 text-emerald-700" />
                                <span>{t('delivery_panel')}</span>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Drawer Footer with Big Logout Button */}
                {user && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            onClick={() => setMobileMenuOpen(false)}
                            className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl font-bold text-sm shadow-2xs transition cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>{t('logout')}</span>
                        </Link>
                    </div>
                )}
            </div>

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
