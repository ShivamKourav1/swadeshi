import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Award,
    Plus,
    Search,
    Edit3,
    Trash2,
    X,
    Check,
    AlertCircle,
    Building2,
    Shield,
    Users
} from 'lucide-react';

export default function DaayitwaIndex({
    daayitwas = [],
    unitLevels = {},
    flash = {}
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLevelFilter, setSelectedLevelFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDaayitwa, setEditingDaayitwa] = useState(null);
    const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        unit_level: 'shakha',
    });

    const levelBadges = {
        shakha: { label: 'शाखा (Shakha)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
        basti: { label: 'बस्ती (Basti)', color: 'bg-teal-100 text-teal-800 border-teal-200' },
        nagar: { label: 'नगर (Nagar)', color: 'bg-blue-100 text-blue-800 border-blue-200' },
        nager: { label: 'नगर (Nagar)', color: 'bg-blue-100 text-blue-800 border-blue-200' },
        jila: { label: 'जिला (Jila)', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
        vibhag: { label: 'विभाग (Vibhag)', color: 'bg-purple-100 text-purple-800 border-purple-200' },
        prant: { label: 'प्रान्त (Prant)', color: 'bg-orange-100 text-orange-800 border-orange-200' },
        kshetra: { label: 'क्षेत्र (Kshetra)', color: 'bg-red-100 text-red-800 border-red-200' },
    };

    const openCreateModal = () => {
        setEditingDaayitwa(null);
        reset();
        clearErrors();
        setData({
            name: '',
            unit_level: selectedLevelFilter !== 'all' ? selectedLevelFilter : 'shakha',
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingDaayitwa(item);
        clearErrors();
        setData({
            name: item.name,
            unit_level: item.unit_level,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingDaayitwa(null);
        reset();
        clearErrors();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingDaayitwa) {
            put(route('karyakarta.daayitwa.update', editingDaayitwa.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('karyakarta.daayitwa.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (item) => {
        router.delete(route('karyakarta.daayitwa.destroy', item.id), {
            onSuccess: () => setDeleteConfirmItem(null),
        });
    };

    const filteredDaayitwas = daayitwas.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = selectedLevelFilter === 'all' || item.unit_level === selectedLevelFilter;
        return matchesSearch && matchesLevel;
    });

    return (
        <AuthenticatedLayout>
            <Head title="दायित्व प्रबंधन (Daayitwa Management)" />

            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center space-x-2 text-amber-200 text-xs font-bold uppercase tracking-wider mb-2">
                            <Shield className="w-4 h-4" />
                            <span>Superadmin Jurisdiction & Organization Structure</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black">
                            दायित्व प्रबंधन (Daayitwa / Responsibilities)
                        </h1>
                        <p className="text-amber-100 text-xs mt-1.5 max-w-2xl leading-relaxed">
                            विभिन्न संगठनात्मक स्तरों (शाखा, बस्ती, नगर, जिला, विभाग, प्रान्त, क्षेत्र) के दायित्वों की सूची का प्रबंधन करें। टोली एवं स्वयंसेवक निर्माण में यही दायित्व ड्रॉपडाउन में उपलब्ध होंगे।
                        </p>
                    </div>

                    <button
                        onClick={openCreateModal}
                        className="bg-white text-amber-900 hover:bg-amber-50 font-black px-4 py-2.5 rounded-2xl shadow-lg transition flex items-center space-x-2 text-sm shrink-0 cursor-pointer"
                    >
                        <Plus className="w-4 h-4 text-amber-700" />
                        <span>नया दायित्व जोड़ें</span>
                    </button>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
                    {/* Search */}
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="दायित्व खोजें (Search)..."
                            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white"
                        />
                    </div>

                    {/* Level Filter Tabs */}
                    <div className="flex flex-wrap gap-1.5 w-full md:w-auto items-center">
                        <span className="text-xs font-bold text-stone-500 mr-1">स्तर (Level):</span>
                        {[
                            { id: 'all', label: 'सभी' },
                            { id: 'shakha', label: 'शाखा' },
                            { id: 'basti', label: 'बस्ती' },
                            { id: 'nagar', label: 'नगर' },
                            { id: 'jila', label: 'जिला' },
                            { id: 'vibhag', label: 'विभाग' },
                            { id: 'prant', label: 'प्रान्त' },
                            { id: 'kshetra', label: 'क्षेत्र' },
                        ].map((lvl) => (
                            <button
                                key={lvl.id}
                                onClick={() => setSelectedLevelFilter(lvl.id)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    selectedLevelFilter === lvl.id
                                        ? 'bg-amber-600 text-white shadow-xs'
                                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                }`}
                            >
                                {lvl.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Daayitwa Cards Grid / Table */}
                <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
                    {filteredDaayitwas.length === 0 ? (
                        <div className="p-12 text-center text-stone-500 space-y-2">
                            <Award className="w-12 h-12 text-stone-300 mx-auto" />
                            <p className="font-bold text-stone-700">कोई दायित्व नहीं मिला।</p>
                            <p className="text-xs text-stone-400">नया दायित्व जोड़ने हेतु ऊपर बटन पर क्लिक करें।</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[11px]">
                                        <th className="p-3.5">#</th>
                                        <th className="p-3.5">दायित्व नाम (Responsibility)</th>
                                        <th className="p-3.5">इकाई स्तर (Unit Level)</th>
                                        <th className="p-3.5 text-center">संबद्ध स्वयंसेवक संख्या</th>
                                        <th className="p-3.5 text-right">कार्रवाई (Actions)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {filteredDaayitwas.map((item, idx) => {
                                        const badge = levelBadges[item.unit_level] || {
                                            label: item.unit_level,
                                            color: 'bg-gray-100 text-gray-800 border-gray-200',
                                        };
                                        return (
                                            <tr key={item.id} className="hover:bg-amber-50/40 transition">
                                                <td className="p-3.5 font-mono text-stone-400">{idx + 1}</td>
                                                <td className="p-3.5">
                                                    <span className="font-extrabold text-stone-900 text-sm">
                                                        {item.name}
                                                    </span>
                                                </td>
                                                <td className="p-3.5">
                                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.color}`}>
                                                        {badge.label}
                                                    </span>
                                                </td>
                                                <td className="p-3.5 text-center">
                                                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg bg-stone-100 text-stone-700 font-bold text-xs">
                                                        <Users className="w-3.5 h-3.5 text-stone-400" />
                                                        <span>{item.swayamsevaks_count}</span>
                                                    </span>
                                                </td>
                                                <td className="p-3.5 text-right space-x-1.5">
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="inline-flex items-center space-x-1 bg-stone-50 hover:bg-amber-50 text-stone-700 hover:text-amber-800 px-2.5 py-1 rounded-lg border border-stone-200 transition text-xs font-semibold cursor-pointer"
                                                    >
                                                        <Edit3 className="w-3 h-3 text-amber-600" />
                                                        <span>संपादित करें</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirmItem(item)}
                                                        className="inline-flex items-center space-x-1 bg-stone-50 hover:bg-red-50 text-stone-500 hover:text-red-700 px-2 py-1 rounded-lg border border-stone-200 transition text-xs font-semibold cursor-pointer"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
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

            {/* Create / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
                    <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-amber-200 overflow-hidden animate-scale-in">
                        <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-4 text-white flex items-center justify-between">
                            <h2 className="text-base font-bold flex items-center space-x-2">
                                <Award className="w-5 h-5 text-amber-200" />
                                <span>{editingDaayitwa ? 'दायित्व संपादित करें' : 'नया दायित्व जोड़ें'}</span>
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
                            {/* Daayitwa Name */}
                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    दायित्व का नाम (Responsibility Title) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="उदा. मुख्य शिक्षक, कार्यवाह, पालक, प्रचारक"
                                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:bg-white"
                                    required
                                />
                                {errors.name && (
                                    <p className="text-red-600 text-[11px] mt-1">{errors.name}</p>
                                )}
                            </div>

                            {/* Unit Level */}
                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    इकाई स्तर (Unit Level Scope) <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.unit_level}
                                    onChange={(e) => setData('unit_level', e.target.value)}
                                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:bg-white"
                                    required
                                >
                                    <option value="shakha">शाखा (Shakha)</option>
                                    <option value="basti">बस्ती (Basti)</option>
                                    <option value="nagar">नगर (Nagar)</option>
                                    <option value="jila">जिला (Jila)</option>
                                    <option value="vibhag">विभाग (Vibhag)</option>
                                    <option value="prant">प्रान्त (Prant)</option>
                                    <option value="kshetra">क्षेत्र (Kshetra)</option>
                                </select>
                                <p className="text-stone-400 text-[11px] mt-1">
                                    यह दायित्व केवल इसी स्तर की टोली अथवा स्वयंसेवक प्रपत्र में दिखाई देगा।
                                </p>
                                {errors.unit_level && (
                                    <p className="text-red-600 text-[11px] mt-1">{errors.unit_level}</p>
                                )}
                            </div>

                            {/* Submit & Cancel */}
                            <div className="flex justify-end space-x-2 pt-3 border-t border-stone-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition cursor-pointer"
                                >
                                    रद्द करें
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow transition cursor-pointer"
                                >
                                    {processing ? 'सहेज रहे हैं...' : editingDaayitwa ? 'अपडेट करें' : 'सहेजें'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmItem && (
                <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-red-200 space-y-4 animate-scale-in">
                        <div className="flex items-center space-x-3 text-red-600">
                            <AlertCircle className="w-6 h-6 shrink-0" />
                            <h3 className="font-black text-sm">दायित्व हटाएं?</h3>
                        </div>
                        <p className="text-xs text-stone-600 leading-relaxed">
                            क्या आप निश्चित रूप से दायित्व <strong>'{deleteConfirmItem.name}'</strong> हटाना चाहते हैं?
                            {deleteConfirmItem.swayamsevaks_count > 0 && (
                                <span className="block mt-1 text-red-600 font-bold">
                                    ध्यान दें: इस दायित्व से {deleteConfirmItem.swayamsevaks_count} स्वयंसेवक संबद्ध हैं।
                                </span>
                            )}
                        </p>
                        <div className="flex justify-end space-x-2 pt-2">
                            <button
                                onClick={() => setDeleteConfirmItem(null)}
                                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
                            >
                                रद्द करें
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirmItem)}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow"
                            >
                                हाँ, हटाएं
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
