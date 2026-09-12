import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { usePage, Link } from '@inertiajs/react';
import { useTranslation } from '@/i18n/translations';
import { 
    BookOpen, 
    ShoppingCart, 
    Store, 
    Truck, 
    Award, 
    Shield, 
    HelpCircle, 
    MapPin, 
    CheckCircle2, 
    ArrowRight, 
    Globe, 
    RotateCcw,
    Layers,
    DollarSign,
    ExternalLink
} from 'lucide-react';

export default function ManualIndex() {
    const { locale } = usePage().props;
    const { t } = useTranslation(locale || 'hi');
    const isHi = (locale || 'hi') === 'hi';

    const [activeTab, setActiveTab] = useState('customer');

    const tabs = [
        { id: 'overview', label: isHi ? 'प्लेटफ़ॉर्म परिचय' : 'Overview', icon: BookOpen },
        { id: 'customer', label: isHi ? 'ग्राहक मार्गदर्शिका' : 'Customer Guide', icon: ShoppingCart },
        { id: 'dealer', label: isHi ? 'डीलर पोर्टल' : 'Dealer Portal', icon: Store },
        { id: 'delivery', label: isHi ? 'डिलीवरी पार्टनर' : 'Delivery Partner', icon: Truck },
        { id: 'karyakarta', label: isHi ? 'कार्यकर्ता व संगठन' : 'Karyakarta (Org)', icon: Award },
        { id: 'admin', label: isHi ? 'व्यवस्थापक (Admin)' : 'Admin Panel', icon: Shield },
        { id: 'faq', label: isHi ? 'अक्सर पूछे जाने वाले प्रश्न' : 'FAQ & Support', icon: HelpCircle },
    ];

    return (
        <AuthenticatedLayout title={isHi ? 'उपयोगकर्ता मार्गदर्शिका | वस्तु भंडार' : 'User Manual | Vastu Bhandar'}>
            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-3xl p-8 text-white shadow-xl mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                                <BookOpen className="w-4 h-4" />
                                <span>{isHi ? 'आधिकारिक प्रलेखन' : 'Official Documentation'}</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                                {isHi ? 'वस्तु भंडार — संपूर्ण मार्गदर्शिका' : 'Vastu Bhandar — Complete User Manual'}
                            </h1>
                            <p className="mt-2 text-amber-100 text-sm sm:text-base max-w-2xl">
                                {isHi 
                                    ? 'स्टोरफ्रंट, जीपीएस स्थान चयन, डीलर इन्वेंटरी, संगठन संरचना व डिलीवरी प्रणाली की संपूर्ण जानकारी।'
                                    : 'A complete, step-by-step feature guide for customers, verified dealers, delivery agents, and administrators.'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href={route('products.index')}
                                className="inline-flex items-center space-x-2 bg-white text-amber-700 font-extrabold px-5 py-3 rounded-2xl shadow-md hover:bg-amber-50 transition"
                            >
                                <span>{isHi ? 'स्टोरफ्रंट पर जाएं' : 'Go to Storefront'}</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Main Content Layout with Sidebar Tabs */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Navigation Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl p-3 border border-amber-100 shadow-sm sticky top-24 space-y-1">
                            <div className="px-3 py-2 text-xs font-black uppercase tracking-wider text-gray-400">
                                {isHi ? 'विषय सूची' : 'Contents'}
                            </div>
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-bold text-sm transition text-left ${
                                            isActive
                                                ? 'bg-amber-500 text-white shadow-md'
                                                : 'text-gray-600 hover:bg-amber-50 hover:text-amber-700'
                                        }`}
                                    >
                                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-amber-600'}`} />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}

                            <div className="pt-4 mt-4 border-t border-gray-100 px-3 pb-2 text-xs text-gray-500 flex items-center space-x-1">
                                <Globe className="w-3.5 h-3.5 text-amber-600" />
                                <span>{isHi ? 'भाषा बदलने हेतु ऊपर हेडर बटन का उपयोग करें।' : 'Use top header to toggle language.'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tab Panels */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-sm">
                            {/* 1. OVERVIEW TAB */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    <div className="border-b border-gray-100 pb-4">
                                        <h2 className="text-2xl font-black text-gray-900">
                                            {isHi ? 'प्लेटफ़ॉर्म मुख्य विशेषताएं' : 'Platform Overview & Architecture'}
                                        </h2>
                                        <p className="text-gray-500 text-sm mt-1">
                                            {isHi 
                                                ? 'वस्तु भंडार एक सांस्कृतिक एवं संगठनात्मक ई-कॉमर्स आपूर्ति मंच है।'
                                                : 'Vastu Bhandar is a specialized cultural and organizational supply chain marketplace.'}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
                                            <div className="font-extrabold text-amber-900 flex items-center space-x-2">
                                                <Globe className="w-5 h-5 text-amber-600" />
                                                <span>{isHi ? 'द्विभाषी इंटरफ़ेस (Bilingual)' : 'Instant Bilingual UI'}</span>
                                            </div>
                                            <p className="text-xs text-gray-600 leading-relaxed">
                                                {isHi 
                                                    ? 'हिंदी और अंग्रेजी में तुरंत टॉगल करें। आपकी कार्ट या फॉर्म का डेटा सुरक्षित रहता है।'
                                                    : 'Switch between English and Hindi with one click. Your selections and cart stay intact.'}
                                            </p>
                                        </div>

                                        <div className="p-5 rounded-2xl bg-orange-50/50 border border-orange-100 space-y-2">
                                            <div className="font-extrabold text-orange-900 flex items-center space-x-2">
                                                <MapPin className="w-5 h-5 text-orange-600" />
                                                <span>{isHi ? 'जीपीएस पिन स्थान (Leaflet Map)' : 'GPS Map Pinning'}</span>
                                            </div>
                                            <p className="text-xs text-gray-600 leading-relaxed">
                                                {isHi 
                                                    ? 'शाखा मैदानों या ग्रामीण क्षेत्रों में सटीक डिलीवरी हेतु इंटरेक्टिव मैप पर अपना स्थान पिन करें।'
                                                    : 'Pinpoint precise physical coordinates on an interactive map for easy driver dispatch.'}
                                            </p>
                                        </div>

                                        <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
                                            <div className="font-extrabold text-blue-900 flex items-center space-x-2">
                                                <Layers className="w-5 h-5 text-blue-600" />
                                                <span>{isHi ? '6-स्तरीय संगठन संरचना' : '6-Tier Org Hierarchy'}</span>
                                            </div>
                                            <p className="text-xs text-gray-600 leading-relaxed">
                                                {isHi 
                                                    ? 'क्षेत्र ➔ प्रान्त ➔ विभाग ➔ जिला ➔ नगर ➔ शाखा स्तर तक व्यवस्थित वितरण और ट्रैकिंग।'
                                                    : 'From Kshetra down to Shakha, track and filter supplies across regional hierarchies.'}
                                            </p>
                                        </div>

                                        <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                                            <div className="font-extrabold text-emerald-900 flex items-center space-x-2">
                                                <DollarSign className="w-5 h-5 text-emerald-600" />
                                                <span>{isHi ? 'कैश ऑन डिलीवरी (COD) व स्ट्राइप' : 'COD & Secure Online Pay'}</span>
                                            </div>
                                            <p className="text-xs text-gray-600 leading-relaxed">
                                                {isHi 
                                                    ? 'डोरस्टेप पर नकद भुगतान करें या ऑनलाइन डेबिट/क्रेडिट कार्ड से सुरक्षित ऑर्डर करें।'
                                                    : 'Full Cash on Delivery support with delivery partner collection, plus encrypted online checkout.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 2. CUSTOMER TAB */}
                            {activeTab === 'customer' && (
                                <div className="space-y-6">
                                    <div className="border-b border-gray-100 pb-4">
                                        <h2 className="text-2xl font-black text-gray-900">
                                            {isHi ? 'ग्राहक / क्रेता मार्गदर्शिका' : 'Customer / Buyer Guide'}
                                        </h2>
                                        <p className="text-gray-500 text-sm mt-1">
                                            {isHi 
                                                ? 'उत्पाद खोजने, पता सहेजने, ऑर्डर करने एवं रिटर्न अनुरोध करने की संपूर्ण प्रक्रिया।'
                                                : 'How to browse, pinpoint addresses, complete checkout, and track orders.'}
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50">
                                            <h3 className="font-bold text-gray-900 flex items-center space-x-2">
                                                <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-black">1</span>
                                                <span>{isHi ? 'उत्पाद खोजना व श्रेणियां' : 'Browsing Categories & Search'}</span>
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-2">
                                                {isHi 
                                                    ? 'स्टोरफ्रंट पर गणवेश (Ganvesh), पुस्तकें (Books) एवं घोष सामग्री (Ghosh) में से श्रेणी चुनें, या सीधे सर्च बार में नाम अथवा SKU कोड से खोजें।'
                                                    : 'Filter by categories (Ganvesh, Books, Ghosh) on the storefront, or search by item title or SKU code in the search bar.'}
                                            </p>
                                        </div>

                                        <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50">
                                            <h3 className="font-bold text-gray-900 flex items-center space-x-2">
                                                <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-black">2</span>
                                                <span>{isHi ? 'सटीक जीपीएस स्थान (Address Pinning)' : 'Saving Delivery Locations'}</span>
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-2">
                                                {isHi 
                                                    ? 'हेडर मेन्यू में "सहेजे गए पते" (/locations) पर जाएं। इंटरेक्टिव मैप पर अपने घर या शाखा मैदान को क्लिक करें या "वर्तमान जीपीएस स्थान" बटन दबाएं।'
                                                    : 'Go to "Saved Locations" (/locations). Click directly on the interactive map or tap "Use My Current Location" to pin precise coordinates.'}
                                            </p>
                                        </div>

                                        <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50">
                                            <h3 className="font-bold text-gray-900 flex items-center space-x-2">
                                                <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-black">3</span>
                                                <span>{isHi ? 'चेकआउट एवं भुगतान विकल्प' : 'Cart & Checkout'}</span>
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-2">
                                                {isHi 
                                                    ? 'कार्ट (/cart) में मात्रा समायोजित करें, फिर चेकआउट (/checkout) पर कैश ऑन डिलीवरी (COD) अथवा ऑनलाइन कार्ड भुगतान चुनकर ऑर्डर दें।'
                                                    : 'Adjust quantities in /cart, then select your saved delivery address and choose Cash on Delivery (COD) or Stripe card payment.'}
                                            </p>
                                        </div>

                                        <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50">
                                            <h3 className="font-bold text-gray-900 flex items-center space-x-2">
                                                <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-black">4</span>
                                                <span>{isHi ? 'ऑर्डर ट्रैकिंग व रिटर्न' : 'Order Tracking, Cancellation & Returns'}</span>
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-2">
                                                {isHi 
                                                    ? '"मेरे ऑर्डर" (/orders) में प्रत्येक ऑर्डर की स्थिति देखें। डिलीवरी से पूर्व रद्द कर सकते हैं, तथा प्राप्त होने पर "रिटर्न अनुरोध" सबमिट कर सकते हैं।'
                                                    : 'Track order progress under /orders. You can cancel orders before delivery, or submit return requests with notes once delivered.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3. DEALER TAB */}
                            {activeTab === 'dealer' && (
                                <div className="space-y-6">
                                    <div className="border-b border-gray-100 pb-4">
                                        <h2 className="text-2xl font-black text-gray-900">
                                            {isHi ? 'डीलर पोर्टल मार्गदर्शिका' : 'Dealer Portal Guide'}
                                        </h2>
                                        <p className="text-gray-500 text-sm mt-1">
                                            {isHi 
                                                ? 'इन्वेंटरी नियंत्रण, उत्पाद जोड़ना, ऑर्डर पूर्ति व रिटर्न अनुरोध प्रबंधन।'
                                                : 'Product inventory management, restock confirmation, and resolving return requests.'}
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl border border-gray-200">
                                            <h4 className="font-extrabold text-gray-900">{isHi ? 'इन्वेंटरी प्रबंधन (/dealer/products)' : 'Inventory CRUD (/dealer/products)'}</h4>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {isHi 
                                                    ? 'नए उत्पाद जोड़ें, मूल्य (₹), SKU, स्टॉक संख्या व चित्र यूआरएल भरें। किसी भी समय स्टॉक अपडेट करें।'
                                                    : 'Add new items, assign SKUs, update stock counts, and upload images. Out-of-stock items automatically prevent overselling.'}
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-xl border border-gray-200">
                                            <h4 className="font-extrabold text-gray-900">{isHi ? 'रद्द ऑर्डर्स का रीस्टॉक (/dealer/orders)' : 'Restock Confirmation'}</h4>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {isHi 
                                                    ? 'यदि कोई ग्राहक डिलीवरी से पूर्व ऑर्डर रद्द करता है, तो डीलर ऑर्डर्स पैनल में "Confirm Restock" बटन दबाकर उस स्टॉक को दोबारा इन्वेंटरी में जोड़ें।'
                                                    : 'When a customer cancels an order, it lands in your restock alert queue. Click "Confirm Restock" to safely return items to inventory.'}
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-xl border border-gray-200">
                                            <h4 className="font-extrabold text-gray-900">{isHi ? 'ग्राहक रिटर्न अनुरोध का निस्तारण' : 'Handling Return Requests'}</h4>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {isHi 
                                                    ? 'ग्राहकों द्वारा भेजे गए रिटर्न अनुरोधों को देखें और Accept, Reject, या Fulfill (प्रतिस्थापन पूर्ण) करें।'
                                                    : 'Inspect return requests from buyers and choose to Accept, Reject (with reason), or mark as Fulfilled upon replacement.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 4. DELIVERY PARTNER TAB */}
                            {activeTab === 'delivery' && (
                                <div className="space-y-6">
                                    <div className="border-b border-gray-100 pb-4">
                                        <h2 className="text-2xl font-black text-gray-900">
                                            {isHi ? 'डिलीवरी पार्टनर गाइड' : 'Delivery Partner Guide'}
                                        </h2>
                                        <p className="text-gray-500 text-sm mt-1">
                                            {isHi 
                                                ? 'ऑर्डर क्लेम करना, जीपीएस नेविगेशन एवं डिलीवरी स्थिति अपडेट करना।'
                                                : 'Claiming orders from the pool, GPS coordinate navigation, and COD handling.'}
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl border border-gray-200">
                                            <h4 className="font-extrabold text-gray-900">{isHi ? 'उपलब्ध ऑर्डर्स क्लेम करें (/delivery/dashboard)' : 'Claiming Pickups'}</h4>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {isHi 
                                                    ? 'डैशबोर्ड में उपलब्ध ऑर्डर्स की सूची देखें और अपने क्षेत्र का ऑर्डर "Claim Order" बटन दबाकर स्वयं को असाइन करें।'
                                                    : 'Review pending orders available in your delivery zone and click "Claim Order" to add them to your delivery queue.'}
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-xl border border-gray-200">
                                            <h4 className="font-extrabold text-gray-900">{isHi ? 'सटीक जीपीएस मैप नेविगेशन' : 'GPS Coordinates Navigation'}</h4>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {isHi 
                                                    ? 'ऑर्डर विवरण में ग्राहक द्वारा पिन किए गए अक्षांश व देशांतर (Latitude/Longitude) पर क्लिक करें ताकि गूगल मैप्स में सीधा मार्ग खुल जाए।'
                                                    : 'Click on the recipient GPS coordinates on your active delivery card to launch turn-by-turn navigation in Google Maps.'}
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-xl border border-gray-200">
                                            <h4 className="font-extrabold text-gray-900">{isHi ? 'कैश ऑन डिलीवरी (COD) व स्थिति' : 'Status Updates & COD'}</h4>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {isHi 
                                                    ? 'ऑर्डर निकलते समय "Out for Delivery" करें, पार्सल देने पर नकद राशि प्राप्त करें और "Delivered" चिन्हित करें।'
                                                    : 'Mark orders as "Out for Delivery" during transit, collect cash on COD orders, and update status to "Delivered" upon drop-off.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 5. KARYAKARTA TAB */}
                            {activeTab === 'karyakarta' && (
                                <div className="space-y-6">
                                    <div className="border-b border-gray-100 pb-4">
                                        <h2 className="text-2xl font-black text-gray-900">
                                            {isHi ? 'कार्यकर्ता व संगठन प्रबंधन' : 'Karyakarta (Organization Management)'}
                                        </h2>
                                        <p className="text-gray-500 text-sm mt-1">
                                            {isHi 
                                                ? '6-स्तरीय संगठनात्मक इकाइयां एवं आपूर्ति वितरण विश्लेषण।'
                                                : 'Manage the 6-tier administrative structure and review regional supply fulfillment.'}
                                        </p>
                                    </div>

                                    <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs font-mono space-y-1 text-amber-900">
                                        <div>1. Kshetra (क्षेत्र - Zonal)</div>
                                        <div className="pl-4">└── 2. Prant (प्रान्त - State/Province)</div>
                                        <div className="pl-8">└── 3. Vibhag (विभाग - Division)</div>
                                        <div className="pl-12">└── 4. Jila (जिला - District)</div>
                                        <div className="pl-16">└── 5. Nagar (नगर - City/Town)</div>
                                        <div className="pl-20">└── 6. Shakha (शाखा - Community Unit)</div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="p-4 rounded-xl border border-gray-200">
                                            <h4 className="font-extrabold text-gray-900">{isHi ? 'इकाइयां जोड़ना व प्रबंधित करना (/karyakarta/units)' : 'Managing Units'}</h4>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {isHi 
                                                    ? 'किसी भी स्तर की इकाई (जैसे नया नगर अथवा शाखा) बनाएं और उसे उसकी मूल इकाई से संबद्ध करें।'
                                                    : 'Add or update units at any level and link them to their respective parent unit (e.g. associate a Shakha to its Nagar).'}
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-xl border border-gray-200">
                                            <h4 className="font-extrabold text-gray-900">{isHi ? 'विश्लेषण व आपूर्ति डैशबोर्ड (/karyakarta/dashboard)' : 'Analytics Dashboard'}</h4>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {isHi 
                                                    ? 'देखें कि किस नगर व शाखा में कुल कितने ऑर्डर पहुंचे हैं और आपूर्ति सुचारू रूप से हो रही है या नहीं।'
                                                    : 'Inspect total orders, revenue metrics, and unit-by-unit order volume to ensure smooth supply distribution.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 6. ADMIN TAB */}
                            {activeTab === 'admin' && (
                                <div className="space-y-6">
                                    <div className="border-b border-gray-100 pb-4">
                                        <h2 className="text-2xl font-black text-gray-900">
                                            {isHi ? 'सिस्टम व्यवस्थापक (Admin)' : 'System Administrator Guide'}
                                        </h2>
                                        <p className="text-gray-500 text-sm mt-1">
                                            {isHi 
                                                ? 'उपयोगकर्ता खाते, भूमिकाएं एवं अधिकार (RBAC) प्रबंधन।'
                                                : 'User lifecycle governance and Role-Based Access Control.'}
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl border border-gray-200">
                                            <h4 className="font-extrabold text-gray-900">{isHi ? 'उपयोगकर्ता प्रबंधन (/admin/users)' : 'User Management'}</h4>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {isHi 
                                                    ? 'नए कर्मचारियों/डीलरों का पंजीकरण करें, उनकी भूमिका बदलें, अथवा आवश्यकतानुसार खाता सक्रिय/निलंबित (Toggle Status) करें।'
                                                    : 'Onboard personnel, assign roles, edit details, or temporarily suspend accounts with one click.'}
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-xl border border-gray-200">
                                            <h4 className="font-extrabold text-gray-900">{isHi ? 'भूमिका व अधिकार प्रबंधन (/admin/roles)' : 'Roles & Rights (RBAC)'}</h4>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {isHi 
                                                    ? 'सिस्टम की अनुमतियों (Permissions) को विभिन्न भूमिकाओं से जोड़ें या नई कस्टम भूमिकाएं तैयार करें।'
                                                    : 'Configure granular permissions and bind them to custom or existing organizational roles without code redeployment.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 7. FAQ TAB */}
                            {activeTab === 'faq' && (
                                <div className="space-y-6">
                                    <div className="border-b border-gray-100 pb-4">
                                        <h2 className="text-2xl font-black text-gray-900">
                                            {isHi ? 'अक्सर पूछे जाने वाले प्रश्न (FAQ)' : 'Frequently Asked Questions'}
                                        </h2>
                                        <p className="text-gray-500 text-sm mt-1">
                                            {isHi ? 'सामान्य समस्याओं के त्वरित उत्तर।' : 'Quick answers to common questions.'}
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                                            <div className="font-bold text-gray-900">
                                                {isHi ? 'प्रश्न: भाषा कैसे बदलें?' : 'Q: How do I change language?'}
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                {isHi 
                                                    ? 'उत्तर: स्क्रीन के सबसे ऊपर दाईं ओर "हिंदी / English" टॉगल बटन पर क्लिक करें। संपूर्ण पोर्टल तुरंत बदल जाएगा।'
                                                    : 'A: Click the "हिंदी / English" toggle button in the top navigation bar at any time.'}
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                                            <div className="font-bold text-gray-900">
                                                {isHi ? 'प्रश्न: पते में मैप पिन लगाना क्यों आवश्यक है?' : 'Q: Why is GPS map pinning needed?'}
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                {isHi 
                                                    ? 'उत्तर: कई शाखा मैदानों या ग्रामीण केंद्रों पर मकान नंबर नहीं होते। मैप पिन से डिलीवरी एजेंट बिना भटके सटीक स्थान पर पहुंच जाता है।'
                                                    : 'A: Community centers and open grounds often lack street numbers. The GPS map marker leads delivery agents directly to the spot.'}
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                                            <div className="font-bold text-gray-900">
                                                {isHi ? 'प्रश्न: ऑर्डर रद्द करने पर क्या होता है?' : 'Q: What happens if an order is cancelled?'}
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                {isHi 
                                                    ? 'उत्तर: डिलीवरी से पूर्व रद्द होने पर उत्पाद डीलर के रीस्टॉक क्यू में चले जाते हैं, जिसे डीलर एक क्लिक में इन्वेंटरी में वापस जोड़ सकता है।'
                                                    : 'A: Items in cancelled orders are automatically queued for the dealer to restock back into catalog inventory.'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
