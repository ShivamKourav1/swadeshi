import React, { useState, useMemo, useEffect, useRef } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';
import {
    Calendar,
    Clock,
    MapPin,
    Users,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Plus,
    Edit3,
    Trash2,
    Share2,
    FileText,
    Check,
    Copy,
    MessageCircle,
    Search,
    Filter,
    ChevronDown,
    ChevronUp,
    UserPlus,
    X,
    Sparkles,
    TrendingUp,
    Printer,
    RefreshCw,
    Shield,
    CheckSquare,
    Square,
    ChevronRight,
} from 'lucide-react';

const COMMON_BAITHAK_TYPES = [
    'शाखा टोली बैठक',
    'बस्ती टोली बैठक',
    'नगर टोली बैठक',
    'जिला कार्यकारिणी बैठक',
    'साप्ताहिक बैठक',
    'मासिक बैठक',
    'विशेष / आपातकालीन बैठक',
    'उत्सव पूर्व तैयारी बैठक',
    'समीक्षा एवं योजना बैठक',
];

const UNIT_LEVEL_OPTIONS = [
    { value: 'kshetra', label: 'क्षेत्र (Kshetra)' },
    { value: 'prant', label: 'प्रान्त (Prant)' },
    { value: 'vibhag', label: 'विभाग (Vibhag)' },
    { value: 'jila', label: 'जिला (Jila)' },
    { value: 'nagar', label: 'नगर (Nagar)' },
    { value: 'basti', label: 'बस्ती (Basti)' },
    { value: 'shakha', label: 'शाखा (Shakha)' },
];

/**
 * Format Pravaas (Guest / Atithi) text for WhatsApp/Soochna messages.
 * Example output: प्रवास : अनिल जी चौधरी, जिला कार्यवाह, जिला बदरीनाथ
 */
function formatPravaasText(guests = []) {
    if (!guests || guests.length === 0) return '';

    const lines = guests.map((g) => {
        const parts = [g.name];
        if (g.daayitwa_name) parts.push(g.daayitwa_name);
        if (g.unit_name) parts.push(g.unit_name);
        return parts.join(', ');
    });

    if (lines.length === 1) {
        return `🚗 *प्रवास :* ${lines[0]}\n━━━━━━━━━━━━━━━━━━━━\n`;
    }

    return `🚗 *प्रवास :*\n` + lines.map((l) => `  • ${l}`).join('\n') + `\n━━━━━━━━━━━━━━━━━━━━\n`;
}

/**
 * Build Full Schedule Soochna Message Text
 */
function buildSoochnaMessage(unit, baithak) {
    const guests = baithak.attendees?.filter((a) => a.attendee_type === 'guest') || baithak.guests || [];
    const pravaasSection = formatPravaasText(guests);

    return (
        `🚩 *${unit?.name ? `${unit.name} (${unit.level_hindi})` : 'टोली'} बैठक सूचना*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📌 *विषय:* ${baithak.title}\n` +
        `🏷️ *प्रकार:* ${baithak.baithak_type || 'बैठक'}\n` +
        `📅 *दिनांक:* ${baithak.baithak_date_formatted || baithak.baithak_date}\n` +
        (baithak.baithak_time ? `⏰ *समय:* ${baithak.baithak_time}\n` : '') +
        (baithak.venue ? `📍 *स्थान:* ${baithak.venue}\n` : '') +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        (pravaasSection ? `${pravaasSection}` : '') +
        (baithak.agenda ? `📋 *कार्यसूची (Agenda):*\n${baithak.agenda}\n━━━━━━━━━━━━━━━━━━━━\n` : '') +
        (baithak.expected_daayitwas?.length > 0
            ? `👥 *अपेक्षित दायित्व:* ${baithak.expected_daayitwas.join(', ')}\n━━━━━━━━━━━━━━━━━━━━\n`
            : '') +
        (baithak.comments_scheduling ? `💬 *विशेष सूचना:* ${baithak.comments_scheduling}\n━━━━━━━━━━━━━━━━━━━━\n` : '') +
        `सभी अपेक्षित कार्यकर्ता बंधु समय पर गणवेश/उपस्थिति सुनिश्चित करें।\n` +
        `जय श्री राम | भारत माता की जय 🚩`
    );
}

/**
 * Build Full Minutes of Meeting (Itivritta) Message Text
 */
function buildMinutesMessage(unit, baithak, stats) {
    const guests = baithak.attendees?.filter((a) => a.attendee_type === 'guest') || baithak.guests || [];
    const pravaasSection = formatPravaasText(guests);
    const attendeesAbsent = baithak.attendees?.filter((a) => a.is_expected && !a.is_present) || [];

    const expectedCount = stats?.expected ?? baithak.total_expected_count ?? 0;
    const presentCount = stats?.present ?? baithak.attended_count ?? 0;
    const absentCount = stats?.absentExpected ?? attendeesAbsent.length;

    return (
        `🚩 *${unit?.name ? `${unit.name} (${unit.level_hindi})` : 'टोली'} बैठक कार्यवृत्त (Minutes)*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📌 *विषय:* ${baithak.title}\n` +
        `📅 *दिनांक:* ${baithak.baithak_date_formatted || baithak.baithak_date}\n` +
        (baithak.venue ? `📍 *स्थान:* ${baithak.venue}\n` : '') +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        (pravaasSection ? `${pravaasSection}` : '') +
        `👥 *उपस्थिति स्थिति:*\n` +
        `• कुल अपेक्षित: ${expectedCount}\n` +
        `• उपस्थित: ${presentCount}\n` +
        `• अनुपस्थित: ${absentCount}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        (baithak.minutes ? `📝 *कार्यवाही विवरण एवं निर्णय:*\n${baithak.minutes}\n━━━━━━━━━━━━━━━━━━━━\n` : '') +
        (baithak.comments_minutes ? `📌 *आगामी योजना / टिप्पणी:*\n${baithak.comments_minutes}\n━━━━━━━━━━━━━━━━━━━━\n` : '') +
        `जय श्री राम | भारत माता की जय 🚩`
    );
}

export default function BaithakSection({
    unit,
    baithaks = [],
    daayitwas = [],
    swayamsevaks = [],
    isAuthenticated = false,
    onRequireLogin,
    showToast = () => {},
}) {
    // Local list of baithaks for immediate UI updates
    const [localBaithaks, setLocalBaithaks] = useState(baithaks);

    // Sync when props change
    useEffect(() => {
        setLocalBaithaks(baithaks);
    }, [baithaks]);

    // Filter states
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'scheduled', 'completed', 'cancelled'
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [editingBaithak, setEditingBaithak] = useState(null);

    // Attendance & Minutes Modal state
    const [activeAttendanceBaithak, setActiveAttendanceBaithak] = useState(null);

    // Soochna Review Modal state (Requirement 1)
    const [reviewingSoochnaBaithak, setReviewingSoochnaBaithak] = useState(null);

    // Filtered Baithaks
    const filteredBaithaks = useMemo(() => {
        return localBaithaks.filter((b) => {
            if (statusFilter !== 'all' && b.status !== statusFilter) {
                return false;
            }
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
                b.title?.toLowerCase().includes(q) ||
                b.baithak_type?.toLowerCase().includes(q) ||
                b.venue?.toLowerCase().includes(q) ||
                b.agenda?.toLowerCase().includes(q)
            );
        });
    }, [localBaithaks, statusFilter, searchQuery]);

    // Statistics
    const stats = useMemo(() => {
        const total = localBaithaks.length;
        const scheduled = localBaithaks.filter((b) => b.status === 'scheduled').length;
        const completed = localBaithaks.filter((b) => b.status === 'completed').length;
        const cancelled = localBaithaks.filter((b) => b.status === 'cancelled').length;

        let totalExpected = 0;
        let totalAttended = 0;
        localBaithaks
            .filter((b) => b.status === 'completed')
            .forEach((b) => {
                totalExpected += b.total_expected_count || 0;
                totalAttended += b.attended_count || 0;
            });
        const avgPercentage = totalExpected > 0 ? Math.round((totalAttended / totalExpected) * 100) : 0;

        return { total, scheduled, completed, cancelled, avgPercentage };
    }, [localBaithaks]);

    // Handle Open Schedule Modal (Create or Edit)
    const handleOpenSchedule = (baithak = null) => {
        if (!isAuthenticated) {
            onRequireLogin?.();
            return;
        }
        setEditingBaithak(baithak);
        setShowScheduleModal(true);
    };

    // Handle Open Attendance Modal
    const handleOpenAttendance = (baithak) => {
        if (!isAuthenticated) {
            onRequireLogin?.();
            return;
        }
        setActiveAttendanceBaithak(JSON.parse(JSON.stringify(baithak)));
    };

    // Handle Open Soochna Review Modal (Requirement 1)
    const handleOpenSoochnaReview = (baithak) => {
        setReviewingSoochnaBaithak(baithak);
    };

    // Handle Delete Baithak
    const handleDeleteBaithak = async (baithak) => {
        if (!isAuthenticated) {
            onRequireLogin?.();
            return;
        }
        if (!window.confirm(`क्या आप बैठक "${baithak.title}" को हटाना चाहते हैं?`)) {
            return;
        }

        try {
            const res = await axios.delete(`/toli/baithaks/${baithak.id}`);
            if (res.data?.success) {
                setLocalBaithaks((prev) => prev.filter((b) => b.id !== baithak.id));
                showToast(res.data.message || 'बैठक सफलतापूर्वक हटा दी गई।', 'success');
                router.reload({ only: ['baithaks'] });
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'बैठक हटाने में त्रुटि हुई।', 'error');
        }
    };

    return (
        <div className="space-y-4">
            {/* Header & Overview Card */}
            <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                    <h2 className="text-base font-bold text-stone-900 flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-amber-600" />
                        <span>बैठक प्रबंधन एवं कार्यवृत्त (Meetings & MoM)</span>
                    </h2>
                    <p className="text-xs text-stone-500">
                        {unit?.name} ({unit?.level_hindi}) इकाई बैठकों का आयोजन, अपेक्षित दायित्वानुसार उपस्थिति पंजी, एवं कार्यवाही विवरण (Minutes)।
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => handleOpenSchedule()}
                        className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition flex items-center space-x-1.5 cursor-pointer shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>नई बैठक आयोजित करें</span>
                    </button>
                </div>
            </div>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-white p-3 rounded-xl border border-orange-200/80 shadow-xs">
                    <span className="text-xs text-stone-500 font-medium">📋 कुल बैठकें</span>
                    <p className="text-xl sm:text-2xl font-black text-stone-900 mt-1">{stats.total}</p>
                    <span className="text-[10px] text-stone-400">समस्त पंजीकृत बैठकें</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-xs">
                    <span className="text-xs text-amber-700 font-medium">⏳ प्रस्तावित / आगामी</span>
                    <p className="text-xl sm:text-2xl font-black text-amber-800 mt-1">{stats.scheduled}</p>
                    <span className="text-[10px] text-amber-600 font-semibold">आगामी बैठकें</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-emerald-200/80 shadow-xs">
                    <span className="text-xs text-emerald-700 font-medium">✅ सम्पन्न बैठकें</span>
                    <p className="text-xl sm:text-2xl font-black text-emerald-800 mt-1">{stats.completed}</p>
                    <span className="text-[10px] text-emerald-600 font-semibold">कार्यवृत्त सहित</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-blue-200/80 shadow-xs">
                    <span className="text-xs text-blue-700 font-medium">📈 औसत उपस्थिति %</span>
                    <p className="text-xl sm:text-2xl font-black text-blue-800 mt-1">{stats.avgPercentage}%</p>
                    <span className="text-[10px] text-blue-600 font-semibold">सम्पन्न बैठकों में</span>
                </div>
            </div>

            {/* Filters & Search Toolbar */}
            <div className="bg-white p-3 rounded-xl border border-orange-100 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Status Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    <button
                        type="button"
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                            statusFilter === 'all'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                        }`}
                    >
                        सभी ({stats.total})
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatusFilter('scheduled')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                            statusFilter === 'scheduled'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-800'
                        }`}
                    >
                        प्रस्तावित ({stats.scheduled})
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatusFilter('completed')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                            statusFilter === 'completed'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                        }`}
                    >
                        सम्पन्न ({stats.completed})
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatusFilter('cancelled')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                            statusFilter === 'cancelled'
                                ? 'bg-stone-600 text-white shadow-xs'
                                : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                        }`}
                    >
                        स्थगित ({stats.cancelled})
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="बैठक खोजें..."
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:border-amber-500 focus:bg-white transition"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 text-xs"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Baithaks List */}
            {filteredBaithaks.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-dashed border-stone-300 space-y-3">
                    <Calendar className="w-10 h-10 text-stone-300 mx-auto" />
                    <div className="space-y-1">
                        <p className="text-stone-700 font-bold text-sm">कोई बैठक उपलब्ध नहीं है।</p>
                        <p className="text-stone-400 text-xs">
                            {searchQuery || statusFilter !== 'all'
                                ? 'वर्तमान फ़िल्टर के अनुसार कोई परिणाम नहीं मिला।'
                                : 'इस इकाई में अभी तक कोई बैठक निर्धारित नहीं की गई है। "नई बैठक आयोजित करें" बटन से पहली बैठक जोड़ें।'}
                        </p>
                    </div>
                    {isAuthenticated && (
                        <button
                            type="button"
                            onClick={() => handleOpenSchedule()}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition inline-flex items-center space-x-1.5 cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>पहली बैठक निर्धारित करें</span>
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredBaithaks.map((baithak) => {
                        const isScheduled = baithak.status === 'scheduled';
                        const isCompleted = baithak.status === 'completed';
                        const isCancelled = baithak.status === 'cancelled';

                        const attendancePct =
                            baithak.total_expected_count > 0
                                ? Math.round((baithak.attended_count / baithak.total_expected_count) * 100)
                                : 0;

                        // Find any guests
                        const guestAttendees = baithak.attendees?.filter((a) => a.attendee_type === 'guest') || [];

                        return (
                            <div
                                key={baithak.id}
                                className={`bg-white rounded-xl border transition shadow-xs overflow-hidden ${
                                    isCompleted
                                        ? 'border-emerald-200 hover:border-emerald-300'
                                        : isScheduled
                                        ? 'border-amber-300 bg-amber-50/20 hover:border-amber-400'
                                        : 'border-stone-200 opacity-80'
                                }`}
                            >
                                <div className="p-4 space-y-3">
                                    {/* Top Row: Badges & Actions */}
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {/* Status Badge */}
                                            <span
                                                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center space-x-1 ${
                                                    isCompleted
                                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                                        : isScheduled
                                                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                                                        : 'bg-stone-100 text-stone-600 border-stone-300'
                                                }`}
                                            >
                                                {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                                                {isScheduled && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                                                {isCancelled && <XCircle className="w-3.5 h-3.5 text-stone-500" />}
                                                <span>
                                                    {isCompleted ? 'सम्पन्न' : isScheduled ? 'प्रस्तावित' : 'स्थगित'}
                                                </span>
                                            </span>

                                            {/* Baithak Type Badge */}
                                            {baithak.baithak_type && (
                                                <span className="bg-stone-100 text-stone-700 border border-stone-200 text-[11px] font-semibold px-2 py-0.5 rounded-md">
                                                    {baithak.baithak_type}
                                                </span>
                                            )}

                                            {/* Pravaas guest badge if present */}
                                            {guestAttendees.length > 0 && (
                                                <span className="bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1">
                                                    <span>🚗 प्रवास:</span>
                                                    <span>{guestAttendees.map((g) => g.name).join(', ')}</span>
                                                </span>
                                            )}
                                        </div>

                                        {/* Quick Card Top Actions */}
                                        <div className="flex items-center gap-1.5">
                                            {/* Requirement 1: Opens Soochna Review Modal */}
                                            <button
                                                type="button"
                                                onClick={() => handleOpenSoochnaReview(baithak)}
                                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
                                                title="बैठक सूचना संदेश समीक्षा करें व कॉपी / व्हाट्सएप करें"
                                            >
                                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>सूचना समीक्षा</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleOpenSchedule(baithak)}
                                                className="bg-stone-100 hover:bg-stone-200 text-stone-700 p-1.5 rounded-lg text-xs transition cursor-pointer"
                                                title="बैठक संपादित करें"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleDeleteBaithak(baithak)}
                                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-1.5 rounded-lg text-xs transition cursor-pointer"
                                                title="बैठक हटाएं"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Title & Metadata */}
                                    <div>
                                        <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-snug">
                                            {baithak.title}
                                        </h3>

                                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs text-stone-600">
                                            <div className="flex items-center space-x-1 font-semibold text-stone-800">
                                                <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                                                <span>{baithak.baithak_date_formatted || baithak.baithak_date}</span>
                                            </div>

                                            {baithak.baithak_time && (
                                                <div className="flex items-center space-x-1">
                                                    <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                                    <span>{baithak.baithak_time}</span>
                                                </div>
                                            )}

                                            {baithak.venue && (
                                                <div className="flex items-center space-x-1">
                                                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                                    <span className="truncate max-w-xs">{baithak.venue}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Pravaas Atithi Detail Card (Requirement 3) */}
                                    {guestAttendees.length > 0 && (
                                        <div className="bg-purple-50/70 p-2.5 rounded-lg border border-purple-200/80 text-xs text-purple-950 flex items-start space-x-2">
                                            <span className="font-bold shrink-0">🚗 प्रवास :</span>
                                            <span className="font-medium">
                                                {guestAttendees
                                                    .map((g) => {
                                                        const parts = [g.name];
                                                        if (g.daayitwa_name) parts.push(g.daayitwa_name);
                                                        if (g.unit_name) parts.push(g.unit_name);
                                                        return parts.join(', ');
                                                    })
                                                    .join(' | ')}
                                            </span>
                                        </div>
                                    )}

                                    {/* Agenda snippet */}
                                    {baithak.agenda && (
                                        <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200/60 text-xs text-stone-700">
                                            <span className="font-bold text-stone-900 block mb-0.5">📋 कार्यसूची (Agenda):</span>
                                            <p className="line-clamp-2 whitespace-pre-line text-stone-600">
                                                {baithak.agenda}
                                            </p>
                                        </div>
                                    )}

                                    {/* Expected Daayitwas Chips */}
                                    {baithak.expected_daayitwas?.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="text-[11px] font-bold text-stone-500 mr-1">अपेक्षित दायित्व:</span>
                                            {baithak.expected_daayitwas.map((d, i) => (
                                                <span
                                                    key={i}
                                                    className="bg-amber-50 text-amber-900 border border-amber-200/80 text-[10px] font-semibold px-2 py-0.5 rounded-md"
                                                >
                                                    {d}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Attendance Metric Bar & Footer Button */}
                                    <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex-1 max-w-md">
                                            <div className="flex items-center justify-between text-xs mb-1">
                                                <span className="font-bold text-stone-700">
                                                    उपस्थिति: {baithak.attended_count} / {baithak.total_expected_count}
                                                </span>
                                                <span
                                                    className={`font-black ${
                                                        attendancePct >= 75
                                                            ? 'text-emerald-700'
                                                            : attendancePct >= 50
                                                            ? 'text-amber-700'
                                                            : 'text-stone-500'
                                                    }`}
                                                >
                                                    {attendancePct}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-300 ${
                                                        attendancePct >= 75
                                                            ? 'bg-emerald-500'
                                                            : attendancePct >= 50
                                                            ? 'bg-amber-500'
                                                            : 'bg-stone-400'
                                                    }`}
                                                    style={{ width: `${Math.min(attendancePct, 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleOpenAttendance(baithak)}
                                            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
                                        >
                                            <FileText className="w-4 h-4" />
                                            <span>
                                                {isCompleted
                                                    ? 'उपस्थिति एवं कार्यवृत्त देखें'
                                                    : 'उपस्थिति दर्ज करें व कार्यवृत्त'}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ============================================================ */}
            {/* MODAL 1: SCHEDULE / EDIT BAITHAK MODAL */}
            {/* ============================================================ */}
            {showScheduleModal && (
                <ScheduleBaithakModal
                    unit={unit}
                    editingBaithak={editingBaithak}
                    daayitwas={daayitwas}
                    onClose={() => {
                        setShowScheduleModal(false);
                        setEditingBaithak(null);
                    }}
                    onSuccess={(updatedBaithak, isNew) => {
                        if (isNew) {
                            setLocalBaithaks((prev) => [updatedBaithak, ...prev]);
                            showToast('बैठक सफलतापूर्वक निर्धारित की गई!', 'success');
                        } else {
                            setLocalBaithaks((prev) =>
                                prev.map((b) => (b.id === updatedBaithak.id ? updatedBaithak : b))
                            );
                            showToast('बैठक विवरण सफलतापूर्वक अद्यतन किया गया!', 'success');
                        }
                        setShowScheduleModal(false);
                        setEditingBaithak(null);
                        router.reload({ only: ['baithaks'] });
                    }}
                    showToast={showToast}
                />
            )}

            {/* ============================================================ */}
            {/* MODAL 2: ATTENDANCE & MINUTES OF MEETING (MoM) MODAL */}
            {/* ============================================================ */}
            {activeAttendanceBaithak && (
                <AttendanceAndMinutesModal
                    unit={unit}
                    baithak={activeAttendanceBaithak}
                    onClose={() => setActiveAttendanceBaithak(null)}
                    onSuccess={(updatedBaithak) => {
                        setLocalBaithaks((prev) =>
                            prev.map((b) => (b.id === updatedBaithak.id ? updatedBaithak : b))
                        );
                        setActiveAttendanceBaithak(null);
                        showToast('उपस्थिति एवं कार्यवृत्त सफलतापूर्वक सहेजा गया!', 'success');
                        router.reload({ only: ['baithaks'] });
                    }}
                    showToast={showToast}
                />
            )}

            {/* ============================================================ */}
            {/* MODAL 3: SOOCHNA REVIEW MODAL (Requirement 1) */}
            {/* ============================================================ */}
            {reviewingSoochnaBaithak && (
                <SoochnaReviewModal
                    unit={unit}
                    baithak={reviewingSoochnaBaithak}
                    onClose={() => setReviewingSoochnaBaithak(null)}
                    showToast={showToast}
                />
            )}
        </div>
    );
}

/**
 * Requirement 1: Dedicated Modal to Review Soochna Message, Copy & Share to WhatsApp
 */
function SoochnaReviewModal({ unit, baithak, onClose, showToast }) {
    const [copied, setCopied] = useState(false);
    const messageText = useMemo(() => buildSoochnaMessage(unit, baithak), [unit, baithak]);

    const handleCopy = () => {
        navigator.clipboard.writeText(messageText);
        setCopied(true);
        showToast('बैठक सूचना संदेश क्लिपबोर्ड पर कॉपी किया गया!', 'success');
        setTimeout(() => setCopied(false), 2500);
    };

    const handleWhatsAppShare = () => {
        const encoded = encodeURIComponent(messageText);
        window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    };

    return (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-orange-200 overflow-hidden my-6 animate-scale-in flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-4 text-white flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-2">
                        <MessageCircle className="w-5 h-5" />
                        <div>
                            <h2 className="text-base sm:text-lg font-bold">बैठक सूचना संदेश पूर्वावलोकन</h2>
                            <p className="text-xs text-amber-100">
                                {baithak.title} ({baithak.baithak_date_formatted || baithak.baithak_date})
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body Preview */}
                <div className="p-4 overflow-y-auto flex-1 space-y-3">
                    <p className="text-xs text-stone-500">
                        व्हाट्सएप या संदेश पर साझा किए जाने वाले सूचना प्रारूप की समीक्षा करें। आप इसे कॉपी कर सकते हैं या सीधे व्हाट्सएप पर भेज सकते हैं:
                    </p>

                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 font-mono text-xs whitespace-pre-line text-stone-800 leading-relaxed shadow-inner select-all">
                        {messageText}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-stone-50 border-t border-stone-200 p-3.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-stone-200 hover:bg-stone-300 text-stone-800 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition"
                    >
                        बंद करें
                    </button>

                    <div className="flex items-center space-x-2">
                        <button
                            type="button"
                            onClick={handleCopy}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs ${
                                copied
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white hover:bg-stone-100 text-stone-800 border border-stone-300'
                            }`}
                        >
                            {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-stone-600" />}
                            <span>{copied ? 'कॉपी हुआ!' : 'संदेश कॉपी करें'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleWhatsAppShare}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span>व्हाट्सएप पर साझा करें</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Sub-Component: Schedule / Edit Baithak Modal
 */
function ScheduleBaithakModal({ unit, editingBaithak, daayitwas = [], onClose, onSuccess, showToast }) {
    const isEdit = !!editingBaithak;

    const [form, setForm] = useState({
        title: editingBaithak?.title || '',
        baithak_type: editingBaithak?.baithak_type || 'शाखा टोली बैठक',
        baithak_date: editingBaithak?.baithak_date || new Date().toISOString().split('T')[0],
        baithak_time: editingBaithak?.baithak_time || '06:30 PM',
        venue: editingBaithak?.venue || '',
        agenda: editingBaithak?.agenda || '',
        status: editingBaithak?.status || 'scheduled',
        comments_scheduling: editingBaithak?.comments_scheduling || '',
        expected_daayitwas: editingBaithak?.expected_daayitwas || [],
        guests: editingBaithak?.attendees
            ?.filter((a) => a.attendee_type === 'guest')
            ?.map((g) => ({
                swayamsevak_id: g.swayamsevak_id,
                name: g.name,
                mobile: g.mobile,
                daayitwa_name: g.daayitwa_name,
                unit_name: g.unit_name,
                unit_level: g.unit_level,
                is_expected: g.is_expected,
            })) || [],
    });

    const [submitting, setSubmitting] = useState(false);

    // Requirement 2: Searchable Daayitwa Dropdown showing 5 options at a time
    const [daayitwaSearch, setDaayitwaSearch] = useState('');
    const [isDaayitwaDropdownOpen, setIsDaayitwaDropdownOpen] = useState(false);
    const daayitwaDropdownRef = useRef(null);

    // Filter available daayitwas based on search input
    const filteredDaayitwas = useMemo(() => {
        const query = daayitwaSearch.trim().toLowerCase();
        return daayitwas.filter((d) => {
            const matchesQuery = !query || d.name.toLowerCase().includes(query);
            return matchesQuery;
        });
    }, [daayitwas, daayitwaSearch]);

    // Handle outside click to close Daayitwa dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (daayitwaDropdownRef.current && !daayitwaDropdownRef.current.contains(event.target)) {
                setIsDaayitwaDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Add Daayitwa to selected list
    const handleAddDaayitwa = (daayitwaName) => {
        if (!form.expected_daayitwas.includes(daayitwaName)) {
            setForm((prev) => ({
                ...prev,
                expected_daayitwas: [...prev.expected_daayitwas, daayitwaName],
            }));
            showToast(`दायित्व "${daayitwaName}" जोड़ा गया।`, 'success');
        }
        setDaayitwaSearch('');
        setIsDaayitwaDropdownOpen(false);
    };

    // Remove Daayitwa from selected list
    const handleRemoveDaayitwa = (daayitwaName) => {
        setForm((prev) => ({
            ...prev,
            expected_daayitwas: prev.expected_daayitwas.filter((name) => name !== daayitwaName),
        }));
    };

    // Quick Select all key Shakha / Nagar Daayitwas
    const selectKeyDaayitwas = () => {
        const keyList = [
            'कार्यवाह',
            'सह कार्यवाह',
            'मुख्य शिक्षक',
            'शारीरिक शिक्षण प्रमुख',
            'बौद्धिक शिक्षण प्रमुख',
            'व्यवस्था प्रमुख',
            'प्रचार प्रमुख',
            'निधि प्रमुख',
        ];
        setForm((prev) => ({
            ...prev,
            expected_daayitwas: Array.from(new Set([...prev.expected_daayitwas, ...keyList])),
        }));
        showToast('प्रमुख दायित्व जोड़ दिए गए।', 'success');
    };

    // Requirement 4: Guest Selector State & Handlers
    const handleAddGuests = (newGuests) => {
        setForm((prev) => {
            const existingIds = new Set(prev.guests.map((g) => g.swayamsevak_id).filter(Boolean));
            const existingNames = new Set(prev.guests.map((g) => g.name.toLowerCase().trim()));

            const filteredNew = newGuests.filter((g) => {
                if (g.swayamsevak_id && existingIds.has(g.swayamsevak_id)) return false;
                if (!g.swayamsevak_id && existingNames.has(g.name.toLowerCase().trim())) return false;
                return true;
            });

            return {
                ...prev,
                guests: [...prev.guests, ...filteredNew],
            };
        });
        showToast(`${newGuests.length} अतिथि जोड़े गए।`, 'success');
    };

    const handleRemoveGuest = (idx) => {
        setForm((prev) => ({
            ...prev,
            guests: prev.guests.filter((_, i) => i !== idx),
        }));
    };

    const handleUpdateGuestField = (idx, field, value) => {
        setForm((prev) => ({
            ...prev,
            guests: prev.guests.map((g, i) => (i === idx ? { ...g, [field]: value } : g)),
        }));
    };

    // Form Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.baithak_date) {
            showToast('कृपया बैठक का शीर्षक एवं दिनांक भरें।', 'error');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                unit_level: unit.level,
                unit_id: unit.id,
                title: form.title.trim(),
                baithak_type: form.baithak_type,
                baithak_date: form.baithak_date,
                baithak_time: form.baithak_time?.trim() || null,
                venue: form.venue?.trim() || null,
                agenda: form.agenda?.trim() || null,
                status: form.status,
                comments_scheduling: form.comments_scheduling?.trim() || null,
                expected_daayitwas: form.expected_daayitwas,
                guests: form.guests,
            };

            let res;
            if (isEdit) {
                res = await axios.put(`/toli/baithaks/${editingBaithak.id}`, payload);
            } else {
                res = await axios.post('/toli/baithaks', payload);
            }

            if (res.data?.success && res.data?.baithak) {
                onSuccess(res.data.baithak, !isEdit);
            } else {
                showToast(res.data?.message || 'बैठक सहेजने में विफल।', 'error');
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'सर्वर पर बैठक सहेजने में त्रुटि हुई।', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-orange-200 overflow-hidden my-6 animate-scale-in">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-4 text-white flex items-center justify-between">
                    <div>
                        <h2 className="text-base sm:text-lg font-bold flex items-center space-x-2">
                            <Calendar className="w-5 h-5" />
                            <span>{isEdit ? 'बैठक विवरण संपादित करें' : 'नई बैठक निर्धारित करें'}</span>
                        </h2>
                        <p className="text-xs text-amber-100">
                            {unit?.name} ({unit?.level_hindi}) इकाई के अंतर्गत
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                            बैठक का शीर्षक / विषय <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="उदा. मासिक शाखा टोली बैठक / विजयदशमी उत्सव योजना"
                            className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm focus:outline-hidden focus:border-amber-500 focus:bg-white"
                        />
                    </div>

                    {/* Baithak Type & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">
                                बैठक का प्रकार
                            </label>
                            <input
                                list="baithak-types-list"
                                value={form.baithak_type}
                                onChange={(e) => setForm({ ...form, baithak_type: e.target.value })}
                                placeholder="प्रकार चुनें या लिखें"
                                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm focus:outline-hidden focus:border-amber-500 focus:bg-white"
                            />
                            <datalist id="baithak-types-list">
                                {COMMON_BAITHAK_TYPES.map((type, idx) => (
                                    <option key={idx} value={type} />
                                ))}
                            </datalist>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">
                                स्थिति (Status)
                            </label>
                            <select
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm focus:outline-hidden focus:border-amber-500 focus:bg-white"
                            >
                                <option value="scheduled">प्रस्तावित (Scheduled)</option>
                                <option value="completed">सम्पन्न (Completed)</option>
                                <option value="cancelled">स्थगित (Cancelled)</option>
                            </select>
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">
                                बैठक दिनांक <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="date"
                                required
                                value={form.baithak_date}
                                onChange={(e) => setForm({ ...form, baithak_date: e.target.value })}
                                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm focus:outline-hidden focus:border-amber-500 focus:bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">
                                समय (Time)
                            </label>
                            <input
                                type="text"
                                value={form.baithak_time}
                                onChange={(e) => setForm({ ...form, baithak_time: e.target.value })}
                                placeholder="उदा. सायं 06:30 बजे / 06:30 PM"
                                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm focus:outline-hidden focus:border-amber-500 focus:bg-white"
                            />
                        </div>
                    </div>

                    {/* Venue */}
                    <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                            स्थान / स्थल (Venue)
                        </label>
                        <input
                            type="text"
                            value={form.venue}
                            onChange={(e) => setForm({ ...form, venue: e.target.value })}
                            placeholder="उदा. सरस्वती शिशु मंदिर परिसर, कक्ष क्रमांक 3"
                            className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm focus:outline-hidden focus:border-amber-500 focus:bg-white"
                        />
                    </div>

                    {/* Agenda */}
                    <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                            कार्यसूची (Agenda)
                        </label>
                        <textarea
                            rows={3}
                            value={form.agenda}
                            onChange={(e) => setForm({ ...form, agenda: e.target.value })}
                            placeholder="1. गत कार्यवृत्त समीक्षा&#10;2. शाखा विस्तार एवं उपस्थिति&#10;3. गणवेश व साहित्य मांग&#10;4. आगामी कार्यक्रम"
                            className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm focus:outline-hidden focus:border-amber-500 focus:bg-white"
                        />
                    </div>

                    {/* Comments on Scheduling / Notice */}
                    <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                            विशेष सूचना / निर्देश (Notice Note)
                        </label>
                        <input
                            type="text"
                            value={form.comments_scheduling}
                            onChange={(e) => setForm({ ...form, comments_scheduling: e.target.value })}
                            placeholder="उदा. सभी कार्यकर्ता पूर्ण गणवेश में अपेक्षित हैं"
                            className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm focus:outline-hidden focus:border-amber-500 focus:bg-white"
                        />
                    </div>

                    {/* ============================================================ */}
                    {/* Requirement 2: SEARCHABLE DAAYITWA DROPDOWN (5 OPTIONS AT A TIME) */}
                    {/* ============================================================ */}
                    <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/90 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-amber-950">
                                👥 अपेक्षित दायित्व चयन (Expected Designations)
                            </label>
                            <button
                                type="button"
                                onClick={selectKeyDaayitwas}
                                className="text-[11px] font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                            >
                                प्रमुख दायित्व चुनें
                            </button>
                        </div>

                        {/* Searchable Dropdown Box */}
                        <div ref={daayitwaDropdownRef} className="relative">
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                                <input
                                    type="text"
                                    value={daayitwaSearch}
                                    onFocus={() => setIsDaayitwaDropdownOpen(true)}
                                    onChange={(e) => {
                                        setDaayitwaSearch(e.target.value);
                                        setIsDaayitwaDropdownOpen(true);
                                    }}
                                    placeholder="दायित्व खोजें एवं जोड़ने हेतु क्लिक करें..."
                                    className="w-full pl-8 pr-8 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-hidden focus:border-amber-500 shadow-2xs"
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsDaayitwaDropdownOpen(!isDaayitwaDropdownOpen)}
                                    className="absolute right-2 top-2 text-stone-400 hover:text-stone-600 p-0.5"
                                >
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Dropdown Menu - EXACTLY 5 OPTIONS VISIBLE AT A TIME */}
                            {isDaayitwaDropdownOpen && (
                                <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg overflow-hidden animate-scale-in">
                                    <div className="max-h-[190px] overflow-y-auto divide-y divide-stone-100">
                                        {filteredDaayitwas.length === 0 ? (
                                            <div className="p-3 text-center text-xs text-stone-400">
                                                कोई दायित्व नहीं मिला।
                                            </div>
                                        ) : (
                                            filteredDaayitwas.map((d) => {
                                                const isAlreadySelected = form.expected_daayitwas.includes(d.name);
                                                return (
                                                    <div
                                                        key={d.id}
                                                        onClick={() => handleAddDaayitwa(d.name)}
                                                        className={`p-2.5 text-xs flex items-center justify-between cursor-pointer transition ${
                                                            isAlreadySelected
                                                                ? 'bg-amber-50/60 text-amber-900 font-semibold'
                                                                : 'hover:bg-amber-50 text-stone-800'
                                                        }`}
                                                    >
                                                        <span className="flex items-center space-x-2">
                                                            {isAlreadySelected ? (
                                                                <Check className="w-3.5 h-3.5 text-amber-600" />
                                                            ) : (
                                                                <span className="w-3.5 h-3.5 inline-block text-stone-300">•</span>
                                                            )}
                                                            <span>{d.name}</span>
                                                        </span>
                                                        {isAlreadySelected ? (
                                                            <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-bold">
                                                                चयनित
                                                            </span>
                                                        ) : (
                                                            <Plus className="w-3.5 h-3.5 text-stone-400" />
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                    <div className="bg-stone-50 px-3 py-1 border-t border-stone-100 text-[10px] text-stone-400 text-right">
                                        5 विकल्प प्रति दृश्य (स्क्रॉल करें)
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Selected Daayitwas Section */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-bold text-amber-900">
                                    चयनित अपेक्षित दायित्व ({form.expected_daayitwas.length}):
                                </span>
                                {form.expected_daayitwas.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, expected_daayitwas: [] })}
                                        className="text-[10px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                                    >
                                        सभी हटाएं
                                    </button>
                                )}
                            </div>

                            {form.expected_daayitwas.length === 0 ? (
                                <p className="text-xs text-stone-400 italic bg-white/70 p-2.5 rounded-lg border border-dashed border-stone-200">
                                    अभी कोई दायित्व चयनित नहीं है। ऊपर ड्रॉपडाउन से दायित्व खोजकर जोड़ें।
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {form.expected_daayitwas.map((name, i) => (
                                        <span
                                            key={i}
                                            className="bg-amber-600 text-white text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center space-x-1.5 shadow-2xs"
                                        >
                                            <span>{name}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveDaayitwa(name)}
                                                className="hover:bg-amber-700 rounded p-0.5"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ============================================================ */}
                    {/* Requirement 4: MULTI-GUEST SELECTION VIA UNIT LEVEL & SCOPE AREA */}
                    {/* ============================================================ */}
                    <GuestSelectionManager
                        guests={form.guests}
                        onAddGuests={handleAddGuests}
                        onRemoveGuest={handleRemoveGuest}
                        onUpdateGuestField={handleUpdateGuestField}
                    />

                    {/* Footer Buttons */}
                    <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition"
                        >
                            रद्द करें
                        </button>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>सहेजा जा रहा है...</span>
                                </>
                            ) : (
                                <span>{isEdit ? 'बैठक अद्यतन करें' : 'बैठक निर्धारित करें'}</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/**
 * Requirement 4: Guest Selection Manager Component with Unit Level, Scope Area & Search Dropdowns
 */
function GuestSelectionManager({ guests = [], onAddGuests, onRemoveGuest, onUpdateGuestField }) {
    const [selectedLevel, setSelectedLevel] = useState('');
    const [unitsList, setUnitsList] = useState([]);
    const [loadingUnits, setLoadingUnits] = useState(false);
    const [selectedUnitId, setSelectedUnitId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [swayamsevaks, setSwayamsevaks] = useState([]);
    const [searchingSwayamsevaks, setSearchingSwayamsevaks] = useState(false);

    // Multi-select tracking for checkboxes
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);

    // Manual guest form toggle
    const [showManualForm, setShowManualForm] = useState(false);
    const [manualGuest, setManualGuest] = useState({
        name: '',
        mobile: '',
        daayitwa_name: '',
        unit_name: '',
    });

    // When Level changes, fetch units of that level
    useEffect(() => {
        if (!selectedLevel) {
            setUnitsList([]);
            setSelectedUnitId('');
            setSwayamsevaks([]);
            return;
        }

        const fetchUnits = async () => {
            try {
                setLoadingUnits(true);
                const res = await axios.get('/toli/baithaks/units', {
                    params: { level: selectedLevel },
                });
                if (res.data?.success) {
                    setUnitsList(res.data.units || []);
                    setSelectedUnitId('');
                    setSwayamsevaks([]);
                }
            } catch (err) {
                console.error('Failed to load units for level:', err);
            } finally {
                setLoadingUnits(false);
            }
        };

        fetchUnits();
    }, [selectedLevel]);

    // When Level / Unit ID or Search changes, search Swayamsevaks
    useEffect(() => {
        if (!selectedLevel && !searchQuery.trim()) {
            setSwayamsevaks([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setSearchingSwayamsevaks(true);
                const res = await axios.get('/toli/baithaks/guests/search', {
                    params: {
                        unit_level: selectedLevel || undefined,
                        unit_id: selectedUnitId || undefined,
                        q: searchQuery.trim() || undefined,
                    },
                });
                if (res.data?.success) {
                    setSwayamsevaks(res.data.swayamsevaks || []);
                }
            } catch (err) {
                console.error('Guest search failed:', err);
            } finally {
                setSearchingSwayamsevaks(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [selectedLevel, selectedUnitId, searchQuery]);

    // Toggle single member selection checkbox
    const toggleSelectMember = (s) => {
        setSelectedMemberIds((prev) =>
            prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]
        );
    };

    // Add selected members to guest list
    const handleAddSelectedMembers = () => {
        const membersToAdd = swayamsevaks
            .filter((s) => selectedMemberIds.includes(s.id))
            .map((s) => ({
                swayamsevak_id: s.id,
                name: s.name,
                mobile: s.mobile,
                daayitwa_name: s.daayitwa_name || '',
                unit_name: s.unit_name || '',
                unit_level: s.unit_level || selectedLevel || 'basti',
                is_expected: true,
            }));

        onAddGuests(membersToAdd);
        setSelectedMemberIds([]);
    };

    // Add single member directly
    const handleAddSingleMember = (s) => {
        onAddGuests([
            {
                swayamsevak_id: s.id,
                name: s.name,
                mobile: s.mobile,
                daayitwa_name: s.daayitwa_name || '',
                unit_name: s.unit_name || '',
                unit_level: s.unit_level || selectedLevel || 'basti',
                is_expected: true,
            },
        ]);
    };

    // Add manual guest
    const handleAddManualGuest = (e) => {
        e.preventDefault();
        if (!manualGuest.name.trim()) return;

        onAddGuests([
            {
                swayamsevak_id: null,
                name: manualGuest.name.trim(),
                mobile: manualGuest.mobile?.trim() || null,
                daayitwa_name: manualGuest.daayitwa_name?.trim() || '',
                unit_name: manualGuest.unit_name?.trim() || '',
                unit_level: 'other',
                is_expected: true,
            },
        ]);

        setManualGuest({ name: '', mobile: '', daayitwa_name: '', unit_name: '' });
        setShowManualForm(false);
    };

    return (
        <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-xs font-bold text-stone-800 flex items-center space-x-1.5">
                        <UserPlus className="w-4 h-4 text-amber-600" />
                        <span>अतिथि / प्रवास कार्यकर्ता चयन (Guest & Pravaas Members)</span>
                    </span>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                        इकाई स्तर व क्षेत्र चुनकर स्वयंसेवक खोजें एवं बैठक में अतिथि (प्रवास) के रूप में जोड़ें।
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setShowManualForm(!showManualForm)}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-900 cursor-pointer underline"
                >
                    {showManualForm ? 'फ़िल्टर पर लौटें' : '+ बाहरी अतिथि सीधे दर्ज करें'}
                </button>
            </div>

            {/* Filter Section: Level Dropdown + Scope Area Dropdown + Search Input */}
            {!showManualForm ? (
                <div className="space-y-2.5 bg-white p-3 rounded-lg border border-stone-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* 1. Unit Level Dropdown */}
                        <div>
                            <label className="block text-[10px] font-bold text-stone-600 mb-1">
                                इकाई स्तर चुनें (Select Unit Level)
                            </label>
                            <select
                                value={selectedLevel}
                                onChange={(e) => setSelectedLevel(e.target.value)}
                                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:outline-hidden focus:border-amber-500"
                            >
                                <option value="">-- सभी स्तर / सीधा खोजें --</option>
                                {UNIT_LEVEL_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 2. Scope Area Dropdown */}
                        <div>
                            <label className="block text-[10px] font-bold text-stone-600 mb-1">
                                इकाई क्षेत्र चुनें (Scope Area)
                            </label>
                            <select
                                value={selectedUnitId}
                                disabled={!selectedLevel || loadingUnits}
                                onChange={(e) => setSelectedUnitId(e.target.value)}
                                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:outline-hidden focus:border-amber-500 disabled:opacity-50"
                            >
                                <option value="">
                                    {loadingUnits
                                        ? 'लोड हो रहा है...'
                                        : !selectedLevel
                                        ? '-- पहले स्तर चुनें --'
                                        : `-- सभी ${selectedLevel} --`}
                                </option>
                                {unitsList.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 3. Search Bar for Swayamsevak under selected filter */}
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="स्वयंसेवक का नाम या मोबाइल नंबर से खोजें..."
                            className="w-full pl-8 pr-8 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:border-amber-500"
                        />
                        {searchingSwayamsevaks && (
                            <RefreshCw className="w-3.5 h-3.5 absolute right-3 top-2.5 text-stone-400 animate-spin" />
                        )}
                    </div>

                    {/* Swayamsevaks Results List with Multiple Selection */}
                    {swayamsevaks.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between text-[11px] text-stone-600">
                                <span>उपलब्ध स्वयंसेवक ({swayamsevaks.length}):</span>
                                {selectedMemberIds.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleAddSelectedMembers}
                                        className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition shadow-2xs"
                                    >
                                        चयनित ({selectedMemberIds.length}) अतिथि जोड़ें
                                    </button>
                                )}
                            </div>

                            <div className="max-h-48 overflow-y-auto border border-stone-200 rounded-lg divide-y divide-stone-100 bg-white">
                                {swayamsevaks.map((s) => {
                                    const isAlreadyAdded = guests.some((g) => g.swayamsevak_id === s.id);
                                    const isSelected = selectedMemberIds.includes(s.id);

                                    return (
                                        <div
                                            key={s.id}
                                            className={`p-2 text-xs flex items-center justify-between transition ${
                                                isAlreadyAdded
                                                    ? 'bg-stone-50 opacity-60'
                                                    : isSelected
                                                    ? 'bg-amber-50'
                                                    : 'hover:bg-stone-50'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                                                {!isAlreadyAdded && (
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelectMember(s)}
                                                        className="w-3.5 h-3.5 rounded text-amber-600 cursor-pointer"
                                                    />
                                                )}

                                                <div className="min-w-0">
                                                    <div className="flex items-center space-x-1.5">
                                                        <span className="font-bold text-stone-800">{s.name}</span>
                                                        {s.daayitwa_name && (
                                                            <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-1.5 py-0.2 rounded">
                                                                {s.daayitwa_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-stone-500 flex items-center space-x-2">
                                                        {s.unit_name && <span>📍 {s.unit_name}</span>}
                                                        {s.mobile && <span>📞 {s.mobile}</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                {isAlreadyAdded ? (
                                                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                                                        जोड़ा गया
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddSingleMember(s)}
                                                        className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer"
                                                    >
                                                        + जोड़ें
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Manual Guest Entry Form */
                <div className="p-3 bg-white border border-stone-300 rounded-lg space-y-2 animate-scale-in">
                    <span className="text-xs font-bold text-stone-800 block">बाहरी अतिथि / मार्गदर्शक विवरण:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                            type="text"
                            placeholder="नाम *"
                            value={manualGuest.name}
                            onChange={(e) => setManualGuest({ ...manualGuest, name: e.target.value })}
                            className="p-1.5 text-xs border border-stone-300 rounded"
                        />
                        <input
                            type="text"
                            placeholder="मोबाइल"
                            value={manualGuest.mobile}
                            onChange={(e) => setManualGuest({ ...manualGuest, mobile: e.target.value })}
                            className="p-1.5 text-xs border border-stone-300 rounded"
                        />
                        <input
                            type="text"
                            placeholder="दायित्व (उदा. जिला कार्यवाह)"
                            value={manualGuest.daayitwa_name}
                            onChange={(e) => setManualGuest({ ...manualGuest, daayitwa_name: e.target.value })}
                            className="p-1.5 text-xs border border-stone-300 rounded"
                        />
                        <input
                            type="text"
                            placeholder="इकाई (उदा. जिला बदरीनाथ)"
                            value={manualGuest.unit_name}
                            onChange={(e) => setManualGuest({ ...manualGuest, unit_name: e.target.value })}
                            className="p-1.5 text-xs border border-stone-300 rounded"
                        />
                    </div>
                    <div className="flex justify-end pt-1">
                        <button
                            type="button"
                            onClick={handleAddManualGuest}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 text-xs font-bold rounded cursor-pointer"
                        >
                            अतिथि जोड़ें
                        </button>
                    </div>
                </div>
            )}

            {/* List of Added Guests with Editable Fields & Pravaas preview */}
            <div>
                <span className="text-[11px] font-bold text-stone-700 block mb-1">
                    वर्तमान अतिथि / प्रवास सूची ({guests.length}):
                </span>

                {guests.length === 0 ? (
                    <p className="text-xs text-stone-400 italic bg-white p-2 rounded border border-dashed border-stone-200">
                        कोई अतिथि सम्मिलित नहीं है।
                    </p>
                ) : (
                    <div className="space-y-1.5">
                        {guests.map((g, idx) => (
                            <div
                                key={idx}
                                className="bg-white p-2.5 rounded-lg border border-purple-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                            >
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center space-x-1.5">
                                        <span className="font-bold text-stone-900 text-xs">{g.name}</span>
                                        {g.mobile && <span className="text-[10px] text-stone-400">({g.mobile})</span>}
                                    </div>

                                    {/* Editable Daayitwa & Unit Name inputs */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                        <div className="flex items-center space-x-1">
                                            <span className="text-[10px] text-stone-400 shrink-0">दायित्व:</span>
                                            <input
                                                type="text"
                                                value={g.daayitwa_name || ''}
                                                onChange={(e) => onUpdateGuestField(idx, 'daayitwa_name', e.target.value)}
                                                placeholder="उदा. जिला कार्यवाह"
                                                className="w-full text-xs p-1 bg-stone-50 border border-stone-200 rounded"
                                            />
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <span className="text-[10px] text-stone-400 shrink-0">इकाई:</span>
                                            <input
                                                type="text"
                                                value={g.unit_name || ''}
                                                onChange={(e) => onUpdateGuestField(idx, 'unit_name', e.target.value)}
                                                placeholder="उदा. जिला बदरीनाथ"
                                                className="w-full text-xs p-1 bg-stone-50 border border-stone-200 rounded"
                                            />
                                        </div>
                                    </div>

                                    <div className="text-[10px] text-purple-700 font-mono">
                                        प्रवास पंक्ति: {g.name}
                                        {g.daayitwa_name ? `, ${g.daayitwa_name}` : ''}
                                        {g.unit_name ? `, ${g.unit_name}` : ''}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => onRemoveGuest(idx)}
                                    className="text-stone-400 hover:text-rose-600 p-1 self-end sm:self-center cursor-pointer"
                                    title="हटाएं"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Sub-Component: Attendance & Minutes of Meeting (MoM) Modal
 */
function AttendanceAndMinutesModal({ unit, baithak, onClose, onSuccess, showToast }) {
    const [activeTab, setActiveTab] = useState('attendance'); // 'attendance', 'minutes', 'share'
    const [attendees, setAttendees] = useState(baithak.attendees || []);
    const [minutes, setMinutes] = useState(baithak.minutes || '');
    const [commentsMinutes, setCommentsMinutes] = useState(baithak.comments_minutes || '');
    const [status, setStatus] = useState(baithak.status || 'scheduled');
    const [submitting, setSubmitting] = useState(false);

    // Filters for attendees list
    const [filterType, setFilterType] = useState('all'); // 'all', 'expected', 'present', 'absent', 'guests'
    const [searchAttendee, setSearchAttendee] = useState('');

    // Inline add guest during meeting
    const [showNewGuestForm, setShowNewGuestForm] = useState(false);
    const [newGuest, setNewGuest] = useState({
        name: '',
        mobile: '',
        daayitwa_name: '',
        unit_name: '',
    });

    // Attendance stats
    const stats = useMemo(() => {
        const total = attendees.length;
        const expected = attendees.filter((a) => a.is_expected).length;
        const present = attendees.filter((a) => a.is_present).length;
        const absentExpected = attendees.filter((a) => a.is_expected && !a.is_present).length;
        const guestsPresent = attendees.filter((a) => a.attendee_type === 'guest' && a.is_present).length;
        const percentage = expected > 0 ? Math.round((present / expected) * 100) : total > 0 ? Math.round((present / total) * 100) : 0;

        return { total, expected, present, absentExpected, guestsPresent, percentage };
    }, [attendees]);

    // Filtered Attendees
    const filteredAttendees = useMemo(() => {
        return attendees.filter((a) => {
            if (filterType === 'expected' && !a.is_expected) return false;
            if (filterType === 'present' && !a.is_present) return false;
            if (filterType === 'absent' && a.is_present) return false;
            if (filterType === 'guests' && a.attendee_type !== 'guest') return false;

            if (!searchAttendee.trim()) return true;
            const q = searchAttendee.toLowerCase();
            return (
                a.name?.toLowerCase().includes(q) ||
                a.mobile?.includes(q) ||
                a.daayitwa_name?.toLowerCase().includes(q) ||
                a.unit_name?.toLowerCase().includes(q)
            );
        });
    }, [attendees, filterType, searchAttendee]);

    // Toggle Single Attendance
    const toggleAttendance = (attendeeId, isPresent) => {
        setAttendees((prev) =>
            prev.map((a) => (a.id === attendeeId ? { ...a, is_present: isPresent } : a))
        );
    };

    // Update Remark
    const updateRemark = (attendeeId, remarks) => {
        setAttendees((prev) =>
            prev.map((a) => (a.id === attendeeId ? { ...a, remarks } : a))
        );
    };

    // Mark All Present
    const markAllPresent = () => {
        setAttendees((prev) => prev.map((a) => ({ ...a, is_present: true })));
        showToast('सभी कार्यकर्ताओं को उपस्थित किया गया।', 'success');
    };

    // Mark All Absent
    const markAllAbsent = () => {
        setAttendees((prev) => prev.map((a) => ({ ...a, is_present: false })));
        showToast('सभी कार्यकर्ताओं को अनुपस्थित किया गया।', 'info');
    };

    // Add Guest on the fly
    const handleAddGuestOnTheFly = (e) => {
        e.preventDefault();
        if (!newGuest.name.trim()) return;

        const temporaryId = -1 * (Date.now() + Math.floor(Math.random() * 1000));
        const added = {
            id: temporaryId,
            swayamsevak_id: null,
            attendee_type: 'guest',
            name: newGuest.name.trim(),
            mobile: newGuest.mobile?.trim() || null,
            daayitwa_name: newGuest.daayitwa_name?.trim() || null,
            unit_name: newGuest.unit_name?.trim() || null,
            unit_level: 'basti',
            is_expected: true,
            is_present: true,
            remarks: 'बैठक स्थल पर जोड़ा गया',
        };

        setAttendees((prev) => [added, ...prev]);
        setNewGuest({ name: '', mobile: '', daayitwa_name: '', unit_name: '' });
        setShowNewGuestForm(false);
        showToast(`अतिथि "${added.name}" को उपस्थित दर्ज किया गया।`, 'success');
    };

    // Save Attendance & MoM
    const handleSave = async () => {
        try {
            setSubmitting(true);

            // Separate existing attendees vs new guests
            const existingAttendeesPayload = attendees
                .filter((a) => a.id > 0)
                .map((a) => ({
                    id: a.id,
                    is_present: a.is_present,
                    remarks: a.remarks || null,
                }));

            const newGuestsPayload = attendees
                .filter((a) => a.id < 0)
                .map((a) => ({
                    name: a.name,
                    mobile: a.mobile,
                    daayitwa_name: a.daayitwa_name,
                    unit_name: a.unit_name,
                    unit_level: a.unit_level,
                    is_expected: a.is_expected,
                    is_present: a.is_present,
                    remarks: a.remarks,
                }));

            const payload = {
                attendees: existingAttendeesPayload,
                new_guests: newGuestsPayload,
                minutes: minutes?.trim() || null,
                comments_minutes: commentsMinutes?.trim() || null,
                status: status,
            };

            const res = await axios.put(`/toli/baithaks/${baithak.id}/attendance`, payload);
            if (res.data?.success && res.data?.baithak) {
                onSuccess(res.data.baithak);
            } else {
                showToast(res.data?.message || 'सहेजने में विफल।', 'error');
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'सर्वर पर सहेजने में त्रुटि हुई।', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Formatted WhatsApp Minutes text (Requirement 3: Includes Pravaas section)
    const minutesMessageText = useMemo(() => {
        return buildMinutesMessage(unit, { ...baithak, attendees, minutes, comments_minutes: commentsMinutes }, stats);
    }, [unit, baithak, attendees, minutes, commentsMinutes, stats]);

    const handleCopyMinutes = () => {
        navigator.clipboard.writeText(minutesMessageText);
        showToast('कार्यवृत्त विवरण क्लिपबोर्ड पर कॉपी हुआ!', 'success');
    };

    const handleSendMinutesToWhatsApp = () => {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(minutesMessageText)}`, '_blank');
    };

    return (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-orange-200 overflow-hidden my-4 flex flex-col max-h-[92vh] animate-scale-in">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-4 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div>
                        <div className="flex items-center space-x-2">
                            <h2 className="text-base sm:text-lg font-bold">{baithak.title}</h2>
                            <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {baithak.baithak_type || 'बैठक'}
                            </span>
                        </div>
                        <p className="text-xs text-amber-100 flex items-center space-x-3 mt-1">
                            <span>📅 {baithak.baithak_date_formatted || baithak.baithak_date}</span>
                            {baithak.venue && <span>📍 {baithak.venue}</span>}
                        </p>
                    </div>

                    <div className="flex items-center space-x-2">
                        {/* Status Switcher in header */}
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="bg-white/20 border border-white/40 text-white text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:bg-amber-700"
                        >
                            <option value="scheduled" className="text-stone-900">प्रस्तावित (Scheduled)</option>
                            <option value="completed" className="text-stone-900">सम्पन्न (Completed)</option>
                            <option value="cancelled" className="text-stone-900">स्थगित (Cancelled)</option>
                        </select>

                        <button
                            type="button"
                            onClick={onClose}
                            className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Metric Summary Bar */}
                <div className="bg-stone-50 border-b border-stone-200 p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center shrink-0">
                    <div className="bg-white p-2 rounded-lg border border-stone-200">
                        <span className="text-[10px] text-stone-500 font-semibold block">कुल अपेक्षित</span>
                        <span className="text-base sm:text-lg font-black text-stone-900">{stats.expected}</span>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-emerald-200">
                        <span className="text-[10px] text-emerald-700 font-semibold block">उपस्थित</span>
                        <span className="text-base sm:text-lg font-black text-emerald-800">{stats.present}</span>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-rose-200">
                        <span className="text-[10px] text-rose-700 font-semibold block">अनुपस्थित (अपेक्षित)</span>
                        <span className="text-base sm:text-lg font-black text-rose-800">{stats.absentExpected}</span>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-blue-200">
                        <span className="text-[10px] text-blue-700 font-semibold block">उपस्थिति %</span>
                        <span className="text-base sm:text-lg font-black text-blue-800">{stats.percentage}%</span>
                    </div>
                </div>

                {/* Sub-Tabs */}
                <div className="bg-amber-100/50 border-b border-amber-200 px-4 flex space-x-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => setActiveTab('attendance')}
                        className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
                            activeTab === 'attendance'
                                ? 'border-amber-600 text-amber-900 bg-white/70'
                                : 'border-transparent text-stone-600 hover:text-stone-900'
                        }`}
                    >
                        <Users className="w-3.5 h-3.5" />
                        <span>उपस्थिति पंजी ({stats.present}/{stats.total})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('minutes')}
                        className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
                            activeTab === 'minutes'
                                ? 'border-amber-600 text-amber-900 bg-white/70'
                                : 'border-transparent text-stone-600 hover:text-stone-900'
                        }`}
                    >
                        <FileText className="w-3.5 h-3.5" />
                        <span>कार्यवाही विवरण / इतिवृत्त (Minutes)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('share')}
                        className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
                            activeTab === 'share'
                                ? 'border-amber-600 text-amber-900 bg-white/70'
                                : 'border-transparent text-stone-600 hover:text-stone-900'
                        }`}
                    >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>साझा करें / व्हाट्सएप</span>
                    </button>
                </div>

                {/* Modal Tab Content Area */}
                <div className="p-4 overflow-y-auto flex-1">
                    {/* TAB A: ATTENDANCE REGISTER */}
                    {activeTab === 'attendance' && (
                        <div className="space-y-3">
                            {/* Toolbar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                {/* Filter Pills */}
                                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setFilterType('all')}
                                        className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                                            filterType === 'all'
                                                ? 'bg-stone-800 text-white'
                                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                        }`}
                                    >
                                        सभी ({stats.total})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilterType('expected')}
                                        className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                                            filterType === 'expected'
                                                ? 'bg-amber-600 text-white'
                                                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                                        }`}
                                    >
                                        अपेक्षित ({stats.expected})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilterType('present')}
                                        className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                                            filterType === 'present'
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                        }`}
                                    >
                                        उपस्थित ({stats.present})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilterType('absent')}
                                        className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                                            filterType === 'absent'
                                                ? 'bg-rose-600 text-white'
                                                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                                        }`}
                                    >
                                        अनुपस्थित
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilterType('guests')}
                                        className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                                            filterType === 'guests'
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                                        }`}
                                    >
                                        अतिथि / प्रवास
                                    </button>
                                </div>

                                {/* Quick Bulk Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={markAllPresent}
                                        className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-md transition cursor-pointer"
                                    >
                                        सभी उपस्थित
                                    </button>
                                    <button
                                        type="button"
                                        onClick={markAllAbsent}
                                        className="text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-md transition cursor-pointer"
                                    >
                                        सभी अनुपस्थित
                                    </button>
                                </div>
                            </div>

                            {/* Search & Add Guest */}
                            <div className="flex items-center justify-between gap-2">
                                <div className="relative flex-1">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                                    <input
                                        type="text"
                                        value={searchAttendee}
                                        onChange={(e) => setSearchAttendee(e.target.value)}
                                        placeholder="कार्यकर्ता / दायित्व खोजें..."
                                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:border-amber-500"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowNewGuestForm(!showNewGuestForm)}
                                    className="bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer shrink-0"
                                >
                                    <UserPlus className="w-3.5 h-3.5" />
                                    <span>+ आगंतुक जोड़ें</span>
                                </button>
                            </div>

                            {/* Inline Add Guest Form */}
                            {showNewGuestForm && (
                                <form
                                    onSubmit={handleAddGuestOnTheFly}
                                    className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2 animate-scale-in"
                                >
                                    <span className="text-xs font-bold text-purple-900 block">
                                        बैठक में उपस्थित आगंतुक / अतिथि दर्ज करें:
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                        <input
                                            type="text"
                                            required
                                            placeholder="नाम *"
                                            value={newGuest.name}
                                            onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                                            className="p-1.5 text-xs bg-white border border-stone-300 rounded"
                                        />
                                        <input
                                            type="text"
                                            placeholder="मोबाइल"
                                            value={newGuest.mobile}
                                            onChange={(e) => setNewGuest({ ...newGuest, mobile: e.target.value })}
                                            className="p-1.5 text-xs bg-white border border-stone-300 rounded"
                                        />
                                        <input
                                            type="text"
                                            placeholder="दायित्व (उदा. जिला कार्यवाह)"
                                            value={newGuest.daayitwa_name}
                                            onChange={(e) => setNewGuest({ ...newGuest, daayitwa_name: e.target.value })}
                                            className="p-1.5 text-xs bg-white border border-stone-300 rounded"
                                        />
                                        <input
                                            type="text"
                                            placeholder="इकाई (उदा. जिला बदरीनाथ)"
                                            value={newGuest.unit_name}
                                            onChange={(e) => setNewGuest({ ...newGuest, unit_name: e.target.value })}
                                            className="p-1.5 text-xs bg-white border border-stone-300 rounded"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setShowNewGuestForm(false)}
                                            className="text-xs text-stone-500 hover:text-stone-800"
                                        >
                                            रद्द करें
                                        </button>
                                        <button
                                            type="submit"
                                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1 rounded cursor-pointer"
                                        >
                                            उपस्थित जोड़ें
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Attendees List Table / Cards */}
                            <div className="space-y-2">
                                {filteredAttendees.length === 0 ? (
                                    <p className="text-center text-xs text-stone-400 py-6">कोई कार्यकर्ता नहीं मिला।</p>
                                ) : (
                                    filteredAttendees.map((a) => (
                                        <div
                                            key={a.id}
                                            className={`p-2.5 sm:p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                                                a.is_present
                                                    ? 'bg-emerald-50/40 border-emerald-200'
                                                    : 'bg-white border-stone-200'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                                                {/* Present/Absent Indicator Circle */}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleAttendance(a.id, !a.is_present)}
                                                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition cursor-pointer ${
                                                        a.is_present
                                                            ? 'bg-emerald-600 text-white shadow-xs'
                                                            : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
                                                    }`}
                                                >
                                                    {a.is_present ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-3.5 h-3.5" />}
                                                </button>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <span className="font-bold text-stone-900 text-xs sm:text-sm">
                                                            {a.name}
                                                        </span>
                                                        {a.daayitwa_name && (
                                                            <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                                                {a.daayitwa_name}
                                                            </span>
                                                        )}
                                                        {a.attendee_type === 'guest' ? (
                                                            <span className="bg-purple-100 text-purple-800 text-[9px] font-bold px-1.5 py-0.2 rounded border border-purple-200">
                                                                🚗 प्रवास / अतिथि
                                                            </span>
                                                        ) : a.is_expected ? (
                                                            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-semibold px-1.5 py-0.2 rounded">
                                                                अपेक्षित
                                                            </span>
                                                        ) : (
                                                            <span className="bg-stone-100 text-stone-600 text-[9px] font-semibold px-1.5 py-0.2 rounded">
                                                                सामान्य
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="text-[11px] text-stone-500 flex flex-wrap gap-x-2.5 mt-0.5">
                                                        {a.mobile && <span>📞 {a.mobile}</span>}
                                                        {a.unit_name && <span>📍 {a.unit_name}</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Toggles & Remarks */}
                                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                                <input
                                                    type="text"
                                                    placeholder="टिप्पणी (उदा. ससूचना अवकाश)"
                                                    value={a.remarks || ''}
                                                    onChange={(e) => updateRemark(a.id, e.target.value)}
                                                    className="w-36 sm:w-48 text-[11px] p-1 bg-white border border-stone-200 rounded focus:outline-hidden focus:border-amber-400"
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() => toggleAttendance(a.id, true)}
                                                    className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                                                        a.is_present
                                                            ? 'bg-emerald-600 text-white shadow-xs'
                                                            : 'bg-stone-100 text-stone-600 hover:bg-emerald-50 hover:text-emerald-700'
                                                    }`}
                                                >
                                                    उपस्थित
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => toggleAttendance(a.id, false)}
                                                    className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                                                        !a.is_present
                                                            ? 'bg-rose-600 text-white shadow-xs'
                                                            : 'bg-stone-100 text-stone-600 hover:bg-rose-50 hover:text-rose-700'
                                                    }`}
                                                >
                                                    अनुपस्थित
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB B: MINUTES OF MEETING (MoM) */}
                    {activeTab === 'minutes' && (
                        <div className="space-y-4">
                            {/* Agenda Ref */}
                            {baithak.agenda && (
                                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-xs text-amber-950">
                                    <span className="font-bold block mb-1">📋 बैठक कार्यसूची (Agenda):</span>
                                    <p className="whitespace-pre-line text-stone-700">{baithak.agenda}</p>
                                </div>
                            )}

                            {/* Pravaas banner if guests exist (Requirement 3) */}
                            {formatPravaasText(baithak.attendees?.filter((a) => a.attendee_type === 'guest')) && (
                                <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200 text-xs text-purple-900 font-mono whitespace-pre-line">
                                    {formatPravaasText(baithak.attendees?.filter((a) => a.attendee_type === 'guest'))}
                                </div>
                            )}

                            {/* Minutes Editor */}
                            <div>
                                <label className="block text-xs font-bold text-stone-800 mb-1">
                                    कार्यवाही विवरण एवं लिए गए निर्णय (Minutes & Decisions)
                                </label>
                                <textarea
                                    rows={8}
                                    value={minutes}
                                    onChange={(e) => setMinutes(e.target.value)}
                                    placeholder="बैठक में हुई चर्चा, गत कार्य समीक्षा, आगामी योजना एवं लिए गए निर्णयों का विस्तृत विवरण लिखें..."
                                    className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:border-amber-500 focus:bg-white leading-relaxed"
                                />
                                <span className="text-[11px] text-stone-400 mt-0.5 block">
                                    सुझाव: प्रमुख निर्णयों को बिंदुवार (1, 2, 3...) लिखें ताकि बाद में समीक्षा में सुविधा हो।
                                </span>
                            </div>

                            {/* Additional Comments / Directives */}
                            <div>
                                <label className="block text-xs font-bold text-stone-800 mb-1">
                                    आगामी कार्य योजना एवं निर्देश (Directives / Action Plan)
                                </label>
                                <textarea
                                    rows={3}
                                    value={commentsMinutes}
                                    onChange={(e) => setCommentsMinutes(e.target.value)}
                                    placeholder="उदा. आगामी रविवार तक सभी शाखाओं की सूची पूर्ण करनी है..."
                                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:border-amber-500 focus:bg-white"
                                />
                            </div>
                        </div>
                    )}

                    {/* TAB C: SHARE & EXPORT (Includes Pravaas Section - Requirement 3) */}
                    {activeTab === 'share' && (
                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-3">
                                <h3 className="text-sm font-bold text-stone-900 flex items-center space-x-2">
                                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                                    <span>व्हाट्सएप कार्यवृत्त प्रारूप (WhatsApp Minutes Preview)</span>
                                </h3>

                                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 font-mono text-xs whitespace-pre-line text-stone-800 select-all leading-relaxed">
                                    {minutesMessageText}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleSendMinutesToWhatsApp}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        <span>व्हाट्सएप पर भेजें</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleCopyMinutes}
                                        className="bg-stone-100 hover:bg-stone-200 text-stone-800 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                                    >
                                        <Copy className="w-4 h-4" />
                                        <span>क्लिपबोर्ड पर कॉपी करें</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => window.print()}
                                        className="bg-stone-100 hover:bg-stone-200 text-stone-800 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                                    >
                                        <Printer className="w-4 h-4" />
                                        <span>प्रिंट / PDF</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="bg-stone-50 border-t border-stone-200 p-3.5 flex items-center justify-between gap-3 shrink-0">
                    <span className="text-xs text-stone-500 font-medium hidden sm:inline">
                        उपस्थिति: <strong className="text-emerald-700">{stats.present} उपस्थित</strong> | <strong className="text-stone-700">{stats.expected} अपेक्षित</strong>
                    </span>

                    <div className="flex items-center space-x-2 ml-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-stone-200 hover:bg-stone-300 text-stone-800 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition"
                        >
                            बंद करें
                        </button>

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={submitting}
                            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>सहेजा जा रहा है...</span>
                                </>
                            ) : (
                                <span>उपस्थिति एवं कार्यवृत्त सहेजें</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
