import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Boxes,
    Building2,
    CheckSquare,
    Square,
    Save,
    ArrowLeft,
    CheckCircle2,
    Info,
    Clock,
    UserCheck,
    Layers,
    ShieldAlert,
} from 'lucide-react';

export default function Index({ unit, availableSubUnits, selectedSubUnits, lastUpdated, updatedBy }) {
    const { data, setData, post, processing, wasSuccessful } = useForm({
        sub_units: selectedSubUnits || [],
    });

    const handleToggle = (unitId) => {
        if (data.sub_units.includes(unitId)) {
            setData(
                'sub_units',
                data.sub_units.filter((id) => id !== unitId)
            );
        } else {
            setData('sub_units', [...data.sub_units, unitId]);
        }
    };

    const handleSelectAll = () => {
        setData('sub_units', availableSubUnits.map((u) => u.id));
    };

    const handleDeselectAll = () => {
        setData('sub_units', []);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('karyakarta.inventory-scope.update'), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="टोली स्तरीय वस्तु भंडार इकाई प्रबंधन | Karyakarta" />

            <div className="max-w-5xl mx-auto space-y-6 pb-12">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center space-x-2 text-amber-200 text-xs font-bold uppercase tracking-wider mb-2">
                            <Boxes className="w-4 h-4" />
                            <span>Toli Level Inventory Scope Management</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black">
                            टोली स्तरीय वस्तु भंडार इकाई प्रबंधन
                        </h1>
                        <p className="text-amber-100 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
                            अपने अधिकार क्षेत्र के अंतर्गत अधीनस्थ इकाइयों (Sub-Units) के टोली पृष्ठों पर गणवेश एवं वस्तु भंडार उत्पादों की उपलब्धता व दृश्यता को नियंत्रित करें।
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={route('karyakarta.dashboard')}
                            className="inline-flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>कार्यकर्ता डैशबोर्ड</span>
                        </Link>
                    </div>
                </div>

                {/* Assigned Jurisdiction Scope Card */}
                <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200">
                            <Building2 className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                आपका असाइन अधिकार क्षेत्र (Jurisdiction Scope)
                            </div>
                            <div className="text-xl font-black text-gray-900 mt-0.5">
                                {unit.name}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                                <span className="bg-orange-100 text-orange-800 text-xs font-black px-2.5 py-0.5 rounded-lg border border-orange-200">
                                    {unit.level_hindi} ({unit.level})
                                </span>
                                <span className="text-xs text-gray-500">
                                    इकाई कोड: #{unit.id}
                                </span>
                            </div>
                        </div>
                    </div>

                    {(lastUpdated || updatedBy) && (
                        <div className="text-xs text-stone-500 bg-amber-50/60 p-3 rounded-2xl border border-amber-100 sm:text-right space-y-1">
                            {lastUpdated && (
                                <div className="flex items-center sm:justify-end space-x-1">
                                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                                    <span>अंतिम अपडेट: {lastUpdated}</span>
                                </div>
                            )}
                            {updatedBy && (
                                <div className="flex items-center sm:justify-end space-x-1">
                                    <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                                    <span>द्वारा: {updatedBy}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Explanatory Guidance Alert */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5 text-amber-950 flex items-start space-x-3.5">
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm space-y-1.5 leading-relaxed">
                        <div className="font-black text-amber-900">
                            उत्पाद दृश्यता नियंत्रण नियम (Product Visibility Control Rules):
                        </div>
                        <p>
                            टोली पृष्ठों पर डिफ़ॉल्ट रूप से सभी उत्पाद नहीं दिखने चाहिए। इस सेटिंग से आप तय करते हैं कि आपके अधिकार क्षेत्र (जैसे <strong>{unit.name}</strong>) के डीलर के उत्पाद किन अधीनस्थ स्तरों पर दिखेंगे:
                        </p>
                        <ul className="list-disc list-inside space-y-0.5 text-stone-700 pl-1">
                            <li>यदि आप केवल <strong>नगर</strong> चुनते हैं, तो इस अधिकार क्षेत्र के अधीनस्थ नगर टोली पृष्ठों पर ही उत्पाद दिखाई देंगे।</li>
                            <li>यदि आप केवल <strong>शाखा</strong> चुनते हैं, तो केवल शाखा टोली पृष्ठों पर उत्पाद दिखाई देंगे।</li>
                            <li>यदि आप दोनों चुनते हैं, तो नगर एवं शाखा दोनों स्तरों के टोली पृष्ठों पर उत्पाद उपलब्ध रहेंगे।</li>
                        </ul>
                    </div>
                </div>

                {/* Main Settings Form */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                        <div>
                            <h2 className="text-lg font-black text-gray-900 flex items-center space-x-2">
                                <Layers className="w-5 h-5 text-amber-600" />
                                <span>अधीनस्थ इकाइयाँ चयन (Select Subordinate Units)</span>
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                जिन अधीनस्थ स्तरों पर आप उत्पादों की उपलब्धता देना चाहते हैं, उन्हें चेक करें।
                            </p>
                        </div>

                        {availableSubUnits.length > 1 && (
                            <div className="flex items-center space-x-2">
                                <button
                                    type="button"
                                    onClick={handleSelectAll}
                                    className="text-xs font-bold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition cursor-pointer"
                                >
                                    सभी चुनें (Select All)
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeselectAll}
                                    className="text-xs font-bold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl border border-stone-200 transition cursor-pointer"
                                >
                                    हटाएं (Clear All)
                                </button>
                            </div>
                        )}
                    </div>

                    {availableSubUnits.length === 0 ? (
                        <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200 space-y-2">
                            <ShieldAlert className="w-10 h-10 text-stone-400 mx-auto" />
                            <div className="font-bold text-stone-700 text-sm">
                                इस इकाई स्तर की कोई अधीनस्थ उप-इकाई नहीं है।
                            </div>
                            <p className="text-xs text-stone-500">
                                शाखा स्तर के अंतर्गत कोई अधीनस्थ इकाइयां नहीं आती हैं।
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {availableSubUnits.map((subUnit) => {
                                    const isSelected = data.sub_units.includes(subUnit.id);
                                    return (
                                        <div
                                            key={subUnit.id}
                                            onClick={() => handleToggle(subUnit.id)}
                                            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer select-none flex items-start space-x-4 ${
                                                isSelected
                                                    ? 'border-amber-600 bg-amber-50/50 shadow-sm'
                                                    : 'border-stone-200 hover:border-amber-300 bg-white hover:bg-amber-50/20'
                                            }`}
                                        >
                                            <div className="pt-0.5 shrink-0 text-amber-600">
                                                {isSelected ? (
                                                    <CheckSquare className="w-6 h-6 text-amber-600 fill-amber-100" />
                                                ) : (
                                                    <Square className="w-6 h-6 text-stone-400" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-base font-black text-stone-900">
                                                        {subUnit.hindi_label}
                                                    </span>
                                                    <span className="text-xs font-bold text-stone-500">
                                                        ({subUnit.id})
                                                    </span>
                                                    {isSelected && (
                                                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full ml-auto">
                                                            सक्रिय (Active)
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                                                    {unit.name} के अंतर्गत आने वाले सभी <strong>{subUnit.hindi_label}</strong> टोली पृष्ठों पर वस्तु भंडार उपलब्ध रहेगा।
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Submit Row */}
                            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-xs text-stone-500">
                                    चयनित उप-इकाइयाँ: <strong className="text-stone-800">{data.sub_units.length}</strong> / {availableSubUnits.length}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-800 text-white font-black text-sm px-6 py-3 rounded-2xl shadow-md transition disabled:opacity-50 cursor-pointer"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{processing ? 'सुरक्षित किया जा रहा है...' : 'सेटिंग्स सुरक्षित करें (Save Scope Settings)'}</span>
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
