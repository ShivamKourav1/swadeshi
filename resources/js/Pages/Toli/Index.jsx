import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import {
    Users,
    Shirt,
    Package,
    Share2,
    FileSpreadsheet,
    FileText,
    Copy,
    Check,
    Search,
    Plus,
    Edit3,
    Trash2,
    X,
    Phone,
    MapPin,
    AlertCircle,
    CheckCircle2,
    LogOut,
    Key,
    ExternalLink,
    ChevronRight,
    TrendingUp,
    Clock,
    DollarSign,
    RefreshCw,
    Download,
    Upload,
    Sparkles,
    Shield,
    MessageCircle,
    CornerDownRight,
    ClipboardList,
    QrCode,
    UserPlus,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function ToliIndex({
    isAuthenticated = false,
    authUser = null,
    hasAccess = true,
    unit,
    subUnits = [],
    swayamsevaks = [],
    swayamsevakStats = { total: 0, ganvesh: 0, non_ganvesh: 0, new_ganvesh: 0 },
    availableBastis = [],
    availableShakhas = availableBastis || [],
    products = [],
    orders = [],
    orderStats = { total: 0, paid: 0, payment_due: 0, delivered: 0, completed: 0, cancelled: 0 },
    reportText = '',
    shikshanOptions = [],
    flash = {}
}) {
    const bastisList = (availableBastis && availableBastis.length > 0) ? availableBastis : (availableShakhas || []);
    const isBasti = unit?.level === 'basti' || unit?.level === 'shakha';
    const currentBastiId = unit?.basti_id || unit?.shakha_id || (isBasti ? unit?.id : null);

    // Current active navigation tab
    const [activeTab, setActiveTab] = useState('members'); // 'members', 'distribution', 'orders', 'subunits'

    // Notification toast state
    const [toastMessage, setToastMessage] = useState(flash?.success || flash?.error || null);
    const [toastType, setToastType] = useState(flash?.error ? 'error' : 'success');

    useEffect(() => {
        if (flash?.error) {
            showToast(flash.error, 'error');
        } else if (flash?.success) {
            showToast(flash.success, 'success');
        }
    }, [flash]);

    // Login Modal state (main application credentials only)
    const [showLoginModal, setShowLoginModal] = useState(!isAuthenticated);
    const [loginCredential, setLoginCredential] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginSubmitting, setLoginSubmitting] = useState(false);

    // Member search & filter
    const [memberSearch, setMemberSearch] = useState('');
    const [memberGanveshFilter, setMemberGanveshFilter] = useState('all'); // 'all', 'equipped', 'unequipped'
    const [memberShakhaFilter, setMemberShakhaFilter] = useState('all');

    // Member Add/Edit Modal
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [memberForm, setMemberForm] = useState({
        name: '',
        mobile: '',
        address: '',
        basti_id: currentBastiId || (bastisList[0]?.id ?? ''),
        shakha_id: currentBastiId || (bastisList[0]?.id ?? ''),
        ganvesh: false,
        shikshan: 'प्रारंभिक'
    });
    const [memberFormSubmitting, setMemberFormSubmitting] = useState(false);

    // CSV Bulk Import Modal
    const [showImportModal, setShowImportModal] = useState(false);
    const [importShakhaId, setImportShakhaId] = useState(currentBastiId || (bastisList[0]?.id ?? ''));
    const [importFile, setImportFile] = useState(null);
    const [importSubmitting, setImportSubmitting] = useState(false);

    // New Ganvesh Update Modal
    const [showNewGanveshModal, setShowNewGanveshModal] = useState(false);
    const [selectedShakhaForNewGanvesh, setSelectedShakhaForNewGanvesh] = useState(currentBastiId || (bastisList[0]?.id ?? ''));
    const [newGanveshValue, setNewGanveshValue] = useState(unit?.new_ganvesh ?? 0);
    const [newGanveshSubmitting, setNewGanveshSubmitting] = useState(false);

    // Local mutable swayamsevaks list to support instant inline creation without full reload
    const [localSwayamsevaks, setLocalSwayamsevaks] = useState(swayamsevaks);
    useEffect(() => {
        setLocalSwayamsevaks(swayamsevaks);
    }, [swayamsevaks]);

    // QR Code Modal state
    const [selectedQrUnit, setSelectedQrUnit] = useState(null);

    // Searchable Swayamsevak combobox & inline quick-create in Order/Demand form
    const [orderMemberSearch, setOrderMemberSearch] = useState('');
    const [isOrderMemberDropdownOpen, setIsOrderMemberDropdownOpen] = useState(false);
    const [showInlineMemberCreate, setShowInlineMemberCreate] = useState(false);
    const [inlineMemberForm, setInlineMemberForm] = useState({
        name: '',
        mobile: '',
        address: '',
        ganvesh: false,
        shikshan: 'प्रारंभिक'
    });
    const [inlineMemberSubmitting, setInlineMemberSubmitting] = useState(false);
    const [inlineMemberError, setInlineMemberError] = useState('');

    // Distribution (Uniform Products) Search & Order Modal
    const [productSearch, setProductSearch] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [orderQuantity, setOrderQuantity] = useState(1);
    const [orderPaymentStatus, setOrderPaymentStatus] = useState('paid'); // 'paid', 'payment_due', 'placed', 'completed'
    const [orderNotes, setOrderNotes] = useState('');
    const [orderShakhaId, setOrderShakhaId] = useState(isBasti ? (currentBastiId || '') : '');
    const [orderSwayamsevakId, setOrderSwayamsevakId] = useState('');
    const [orderSubmitting, setOrderSubmitting] = useState(false);

    // Post-Order Success Screen (3 buttons)
    const [placedOrderDetails, setPlacedOrderDetails] = useState(null);
    const [showOrderSuccessModal, setShowOrderSuccessModal] = useState(false);

    // Orders Filter & Actions
    const [ordersStatusFilter, setOrdersStatusFilter] = useState('all');
    const [ordersShakhaFilter, setOrdersShakhaFilter] = useState('all');
    const [selectedOrderForStatus, setSelectedOrderForStatus] = useState(null);
    const [newOrderStatusValue, setNewOrderStatusValue] = useState('');
    const [statusUpdateSubmitting, setStatusUpdateSubmitting] = useState(false);

    // Cancellation & Return Modals
    const [orderToCancel, setOrderToCancel] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelSubmitting, setCancelSubmitting] = useState(false);

    const [orderToReturn, setOrderToReturn] = useState(null);
    const [returnReason, setReturnReason] = useState('आकार परिवर्तन हेतु');
    const [returnNotes, setReturnNotes] = useState('');
    const [returnSubmitting, setReturnSubmitting] = useState(false);

    // Report (वृत्त) Modal
    const [showReportModal, setShowReportModal] = useState(false);
    const [copiedReport, setCopiedReport] = useState(false);

    // Copied feedback helper
    const [copiedIndex, setCopiedIndex] = useState(null);

    // Toast auto-clear
    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const showToast = (message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
    };

    // Manual Login handler (main application mobile/email and password)
    const handleManualLogin = async (e) => {
        e.preventDefault();
        setLoginError('');

        if (!loginCredential.trim() || !loginPassword.trim()) {
            setLoginError('कृपया मोबाइल/ईमेल एवं पासवर्ड दर्ज करें।');
            return;
        }

        setLoginSubmitting(true);
        try {
            const res = await axios.post('/toli/login', {
                login: loginCredential.trim(),
                password: loginPassword.trim()
            });

            if (res.data?.success) {
                setShowLoginModal(false);
                showToast('लॉगिन सफल हुआ!', 'success');
                router.reload();
            } else {
                setLoginError(res.data?.message || 'लॉगिन में त्रुटि हुई।');
            }
        } catch (err) {
            setLoginError(err.response?.data?.message || 'गलत मोबाइल/ईमेल या पासवर्ड।');
        } finally {
            setLoginSubmitting(false);
        }
    };

    // Logout handler
    const handleLogout = async () => {
        try {
            await axios.post('/toli/logout');
            setShowLoginModal(true);
            showToast('सफलतापूर्वक लॉग आउट किया गया।', 'success');
            router.reload();
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    // Copy to clipboard helper
    const copyToClipboard = (text, idx = null) => {
        navigator.clipboard.writeText(text);
        if (idx !== null) {
            setCopiedIndex(idx);
            setTimeout(() => setCopiedIndex(null), 2000);
        } else {
            setCopiedReport(true);
            setTimeout(() => setCopiedReport(false), 2000);
        }
        showToast('क्लिपबोर्ड पर कॉपी हो गया!', 'success');
    };

    // Share to WhatsApp helper
    const shareToWhatsApp = (text) => {
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    // Helper to download Sub-Toli QR Code as PNG image
    const handleDownloadQrImage = (targetUnit) => {
        if (!targetUnit) return;

        try {
            // Find the SVG element in the DOM
            let svgElement = null;
            if (selectedQrUnit && (selectedQrUnit.id === targetUnit.id || selectedQrUnit.name === targetUnit.name)) {
                svgElement = document.getElementById('enlarged-toli-qr-svg');
            }
            if (!svgElement && targetUnit.id) {
                svgElement = document.getElementById(`sub-unit-qr-svg-${targetUnit.id}`);
            }
            if (!svgElement) {
                svgElement = document.getElementById('enlarged-toli-qr-svg');
            }

            if (!svgElement) {
                showToast('QR कोड इमेज प्राप्त नहीं हो सकी।', 'error');
                return;
            }

            const serializer = new XMLSerializer();
            let source = serializer.serializeToString(svgElement);

            if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
                source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
            }

            const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
            const URL = window.URL || window.webkitURL || window;
            const blobUrl = URL.createObjectURL(svgBlob);

            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const qrSize = 500;
                const padding = 36;
                const headerHeight = 76;
                const footerHeight = 44;

                canvas.width = qrSize + (padding * 2);
                canvas.height = qrSize + (padding * 2) + headerHeight + footerHeight;
                const ctx = canvas.getContext('2d');

                // 1. Clean background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 2. Saffron Header Banner
                ctx.fillStyle = '#ea580c';
                ctx.fillRect(0, 0, canvas.width, headerHeight);

                // 3. Header Title & Subtitle
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 22px "Noto Sans", sans-serif, system-ui';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`🚩 ${targetUnit.name} (${targetUnit.type_hindi || 'उप-इकाई'})`, canvas.width / 2, 32);

                ctx.fillStyle = '#ffedd5';
                ctx.font = 'bold 12px "Noto Sans", sans-serif, system-ui';
                ctx.fillText('टोली गणवेश एवं वस्तु भंडार वितरण पृष्ठ', canvas.width / 2, 54);

                // 4. Draw QR Code in center
                const qrCardX = padding;
                const qrCardY = headerHeight + padding;
                ctx.drawImage(img, qrCardX, qrCardY, qrSize, qrSize);

                // 5. Border around canvas
                ctx.strokeStyle = '#fdba74';
                ctx.lineWidth = 4;
                ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

                // 6. Footer Text
                ctx.fillStyle = '#78716c';
                ctx.font = '12px "Noto Sans", sans-serif, system-ui';
                ctx.fillText('मोबाइल कैमरा से स्कैन कर सीधे खोलें • वस्तु भंडार', canvas.width / 2, canvas.height - 22);

                const pngUrl = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                const safeName = (targetUnit.name || 'toli_qr').replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_');
                downloadLink.download = `toli_qr_${safeName}.png`;
                downloadLink.href = pngUrl;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);

                URL.revokeObjectURL(blobUrl);
                showToast(`QR कोड इमेज (${targetUnit.name}) डाउनलोड हो गई!`, 'success');
            };

            img.onerror = () => {
                URL.revokeObjectURL(blobUrl);
                showToast('QR कोड इमेज तैयार करने में त्रुटि हुई।', 'error');
            };

            img.src = blobUrl;
        } catch (err) {
            console.error('QR download error:', err);
            showToast('QR कोड इमेज डाउनलोड नहीं हो सकी।', 'error');
        }
    };

    // Open Add Member Modal
    const handleOpenAddMember = () => {
        setEditingMember(null);
        setMemberForm({
            name: '',
            mobile: '',
            address: '',
            basti_id: currentBastiId || (bastisList[0]?.id ?? ''),
            shakha_id: currentBastiId || (bastisList[0]?.id ?? ''),
            ganvesh: false,
            shikshan: 'प्रारंभिक'
        });
        setShowMemberModal(true);
    };

    // Open Edit Member Modal
    const handleOpenEditMember = (m) => {
        setEditingMember(m);
        setMemberForm({
            name: m.name,
            mobile: m.mobile || '',
            address: m.address || '',
            basti_id: m.basti_id || m.shakha_id,
            shakha_id: m.basti_id || m.shakha_id,
            ganvesh: m.ganvesh,
            shikshan: m.shikshan || 'प्रारंभिक'
        });
        setShowMemberModal(true);
    };

    // Save Member (Add or Edit)
    const handleSaveMember = (e) => {
        e.preventDefault();
        if (!memberForm.name.trim()) {
            showToast('कृपया स्वयंसेवक का नाम दर्ज करें।', 'error');
            return;
        }

        setMemberFormSubmitting(true);
        if (editingMember) {
            router.put(`/toli/members/${editingMember.id}`, memberForm, {
                preserveScroll: true,
                onSuccess: () => {
                    setShowMemberModal(false);
                    setMemberFormSubmitting(false);
                    showToast('स्वयंसेवक विवरण अपडेट हुआ।', 'success');
                },
                onError: () => setMemberFormSubmitting(false)
            });
        } else {
            router.post('/toli/members', memberForm, {
                preserveScroll: true,
                onSuccess: () => {
                    setShowMemberModal(false);
                    setMemberFormSubmitting(false);
                    showToast('नया स्वयंसेवक सफलतापूर्वक जोड़ा गया।', 'success');
                },
                onError: () => setMemberFormSubmitting(false)
            });
        }
    };

    // Delete Member
    const handleDeleteMember = (m) => {
        if (!confirm(`क्या आप '${m.name}' को सूची से हटाना चाहते हैं?`)) return;
        router.delete(`/toli/members/${m.id}`, {
            preserveScroll: true,
            onSuccess: () => showToast('स्वयंसेवक को सूची से हटा दिया गया।', 'success')
        });
    };

    // CSV / Excel Bulk Import
    const handleImportSubmit = (e) => {
        e.preventDefault();
        if (!importFile) {
            showToast('कृपया CSV या Excel फ़ाइल चुनें।', 'error');
            return;
        }

        const targetId = importShakhaId || currentBastiId || (bastisList[0]?.id ?? '');
        if (!targetId) {
            showToast('कृपया बस्ती अथवा शाखा का चयन करें।', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', importFile);
        formData.append('basti_id', targetId);
        formData.append('shakha_id', targetId);

        setImportSubmitting(true);
        router.post('/toli/members/import', formData, {
            preserveScroll: true,
            onSuccess: (page) => {
                setShowImportModal(false);
                setImportFile(null);
                setImportSubmitting(false);
                if (page.props?.flash?.error) {
                    showToast(page.props.flash.error, 'error');
                } else {
                    showToast(page.props?.flash?.success || 'स्वयंसेवक सूची सफलतापूर्वक आयात हुई।', 'success');
                }
            },
            onError: (errors) => {
                setImportSubmitting(false);
                const firstErr = Object.values(errors || {})[0] || 'आयात में त्रुटि हुई। कृपया फ़ाइल प्रारूप जाँचें।';
                showToast(firstErr, 'error');
            }
        });
    };

    // Update New Ganvesh Figure
    const handleUpdateNewGanvesh = (e) => {
        e.preventDefault();
        const targetShakhaId = isBasti ? unit.id : selectedShakhaForNewGanvesh;
        if (!targetShakhaId) {
            showToast('कृपया बस्ती चुनें।', 'error');
            return;
        }

        setNewGanveshSubmitting(true);
        router.post(`/toli/bastis/${targetShakhaId}/new-ganvesh`, {
            new_ganvesh: parseInt(newGanveshValue) || 0
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowNewGanveshModal(false);
                setNewGanveshSubmitting(false);
                showToast('नया गणवेश आंकड़ा अपडेट किया गया।', 'success');
            },
            onError: () => setNewGanveshSubmitting(false)
        });
    };

    // Filter products based on search (key up minimum 3 characters)
    const filteredProducts = useMemo(() => {
        if (!productSearch || productSearch.trim().length < 3) {
            return products;
        }
        const q = productSearch.trim().toLowerCase();
        return products.filter((p) =>
            p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q))
        );
    }, [products, productSearch]);

    // Open Quick Order Modal for a product
    const handleOpenOrderModal = (product) => {
        setSelectedProduct(product);
        setOrderQuantity(1);
        setOrderPaymentStatus('paid');
        setOrderNotes('');
        const initialShakha = isBasti ? (currentBastiId || '') : '';
        setOrderShakhaId(initialShakha);
        setOrderSwayamsevakId('');
        setOrderMemberSearch('');
        setIsOrderMemberDropdownOpen(false);
        setShowInlineMemberCreate(false);
        setInlineMemberError('');
        setInlineMemberForm({
            name: '',
            mobile: '',
            address: '',
            ganvesh: false,
            shikshan: 'प्रारंभिक'
        });
        setShowOrderSuccessModal(false);
    };

    // Open Quick Demand Modal for an out of stock product
    const handleOpenDemandModal = (product) => {
        setSelectedProduct(product);
        setOrderQuantity(1);
        setOrderNotes('');
        const initialShakha = isBasti ? (currentBastiId || '') : '';
        setOrderShakhaId(initialShakha);
        setOrderSwayamsevakId('');
        setOrderMemberSearch('');
        setIsOrderMemberDropdownOpen(false);
        setShowInlineMemberCreate(false);
        setInlineMemberError('');
        setInlineMemberForm({
            name: '',
            mobile: '',
            address: '',
            ganvesh: false,
            shikshan: 'प्रारंभिक'
        });
        setShowOrderSuccessModal(false);
    };

    const effectiveOrderShakhaId = isBasti ? (currentBastiId || '') : orderShakhaId;

    const currentSelectedShakha = useMemo(() => {
        if (!effectiveOrderShakhaId) return null;
        return bastisList.find((s) => String(s.id) === String(effectiveOrderShakhaId)) || (isBasti ? { id: unit.id, basti_name: unit.name, shakha_name: unit.name } : null);
    }, [bastisList, effectiveOrderShakhaId, unit, isBasti]);

    // Available swayamsevaks for order dropdown (populated only after selecting basti, or automatically on basti-level page)
    const availableMembersForOrder = useMemo(() => {
        if (!effectiveOrderShakhaId) return [];
        return localSwayamsevaks.filter((s) => String(s.basti_id || s.shakha_id) === String(effectiveOrderShakhaId));
    }, [localSwayamsevaks, effectiveOrderShakhaId]);

    // Filtered swayamsevaks for the search dropdown
    const filteredOrderMembers = useMemo(() => {
        if (!effectiveOrderShakhaId) return [];
        const list = localSwayamsevaks.filter((s) => String(s.basti_id || s.shakha_id) === String(effectiveOrderShakhaId));
        if (!orderMemberSearch.trim()) return list;
        const q = orderMemberSearch.toLowerCase().trim();
        return list.filter((m) =>
            (m.name && m.name.toLowerCase().includes(q)) ||
            (m.mobile && m.mobile.includes(q))
        );
    }, [localSwayamsevaks, effectiveOrderShakhaId, orderMemberSearch]);

    // Selected member object
    const selectedOrderMember = useMemo(() => {
        if (!orderSwayamsevakId) return null;
        return localSwayamsevaks.find((s) => String(s.id) === String(orderSwayamsevakId)) || null;
    }, [localSwayamsevaks, orderSwayamsevakId]);

    // Fast inline member creation handler
    const handleCreateMemberInline = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setInlineMemberError('');

        if (!inlineMemberForm.name.trim()) {
            setInlineMemberError('कृपया स्वयंसेवक का नाम दर्ज करें।');
            return;
        }
        if (!effectiveOrderShakhaId) {
            setInlineMemberError('कृपया पहले बस्ती का चयन करें।');
            return;
        }

        setInlineMemberSubmitting(true);
        try {
            const payload = {
                name: inlineMemberForm.name.trim(),
                mobile: inlineMemberForm.mobile.trim() || null,
                address: inlineMemberForm.address.trim() || null,
                basti_id: effectiveOrderShakhaId,
                shakha_id: effectiveOrderShakhaId,
                ganvesh: !!inlineMemberForm.ganvesh,
                shikshan: inlineMemberForm.shikshan || 'प्रारंभिक',
            };

            const res = await axios.post('/toli/members', payload);
            if (res.data?.success && res.data?.swayamsevak) {
                const newMember = res.data.swayamsevak;
                setLocalSwayamsevaks((prev) => [newMember, ...prev]);
                setOrderSwayamsevakId(String(newMember.id));
                setOrderMemberSearch('');
                setShowInlineMemberCreate(false);
                setIsOrderMemberDropdownOpen(false);
                showToast(`नया स्वयंसेवक "${newMember.name}" पंजीकृत कर चयनित किया गया!`, 'success');
            } else {
                setInlineMemberError(res.data?.message || 'स्वयंसेवक जोड़ने में त्रुटि हुई।');
            }
        } catch (err) {
            setInlineMemberError(err.response?.data?.message || 'सर्वर पर स्वयंसेवक जोड़ने में त्रुटि हुई।');
        } finally {
            setInlineMemberSubmitting(false);
        }
    };

    // Place Fast Toli Order
    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        if (!selectedProduct) return;

        if (!isBasti && !effectiveOrderShakhaId) {
            showToast('कृपया पहले बस्ती का चयन करें।', 'error');
            return;
        }

        setOrderSubmitting(true);
        try {
            const payload = {
                product_id: selectedProduct.id,
                quantity: parseInt(orderQuantity) || 1,
                payment_status: orderPaymentStatus,
                notes: orderNotes.trim() || null,
                swayamsevak_id: orderSwayamsevakId ? parseInt(orderSwayamsevakId) : null,
                basti_id: effectiveOrderShakhaId || null,
                shakha_id: effectiveOrderShakhaId || null,
                nagar_id: unit?.nagar_id || null,
                jila_id: unit?.jila_id || null,
                vibhag_id: unit?.vibhag_id || null
            };

            const res = await axios.post('/toli/orders', payload);
            if (res.data?.success) {
                const matchedMember = localSwayamsevaks.find((s) => String(s.id) === String(orderSwayamsevakId));
                setPlacedOrderDetails({
                    ...res.data.order,
                    product_name: selectedProduct.name,
                    quantity: orderQuantity,
                    payment_status: orderPaymentStatus,
                    swayamsevak_name: matchedMember ? matchedMember.name : null,
                    total_amount: selectedProduct.price * orderQuantity
                });
                setSelectedProduct(null); // Close order form
                setShowOrderSuccessModal(true); // Open 3-button success modal
                showToast('ऑर्डर सफलतापूर्वक दर्ज किया गया!', 'success');
                router.reload({ only: ['orders', 'orderStats', 'products'] });
            } else {
                showToast(res.data?.message || 'ऑर्डर दर्ज नहीं हो सका।', 'error');
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'ऑर्डर दर्ज करने में त्रुटि हुई।', 'error');
        } finally {
            setOrderSubmitting(false);
        }
    };

    const [demandSubmitting, setDemandSubmitting] = useState(false);

    // Place Fast Toli Demand (for zero-stock items)
    const handlePlaceDemand = async (e) => {
        e.preventDefault();
        if (!selectedProduct) return;

        if (!isBasti && !effectiveOrderShakhaId) {
            showToast('कृपया पहले बस्ती का चयन करें।', 'error');
            return;
        }

        setDemandSubmitting(true);
        try {
            const payload = {
                product_id: selectedProduct.id,
                quantity: parseInt(orderQuantity) || 1,
                swayamsevak_id: orderSwayamsevakId || null,
                notes: orderNotes.trim() || null,
            };

            const res = await axios.post('/toli/demands', payload);
            if (res.data?.success) {
                setSelectedProduct(null); // Close demand form
                showToast(res.data.message || 'मांग सफलतापूर्वक दर्ज की गई!', 'success');
            } else {
                showToast(res.data?.message || 'मांग दर्ज नहीं हो सकी।', 'error');
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'मांग दर्ज करने में त्रुटि हुई।', 'error');
        } finally {
            setDemandSubmitting(false);
        }
    };

    // Filter swaymsevaks
    const filteredSwayamsevaks = useMemo(() => {
        return localSwayamsevaks.filter((s) => {
            const matchesSearch = !memberSearch.trim() ||
                s.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
                (s.mobile && s.mobile.includes(memberSearch)) ||
                (s.address && s.address.toLowerCase().includes(memberSearch.toLowerCase()));

            const matchesGanvesh =
                memberGanveshFilter === 'all' ||
                (memberGanveshFilter === 'equipped' && s.ganvesh) ||
                (memberGanveshFilter === 'unequipped' && !s.ganvesh);

            const matchesShakha =
                memberShakhaFilter === 'all' ||
                String(s.basti_id || s.shakha_id) === String(memberShakhaFilter);

            return matchesSearch && matchesGanvesh && matchesShakha;
        });
    }, [localSwayamsevaks, memberSearch, memberGanveshFilter, memberShakhaFilter]);

    // Filter orders
    const filteredOrders = useMemo(() => {
        return orders.filter((o) => {
            const matchesStatus =
                ordersStatusFilter === 'all' ||
                o.order_status === ordersStatusFilter ||
                (ordersStatusFilter === 'paid' && o.payment_status === 'paid') ||
                (ordersStatusFilter === 'payment_due' && (o.order_status === 'payment_due' || o.payment_status === 'pending'));

            const matchesShakha =
                ordersShakhaFilter === 'all' ||
                String(o.basti_id || o.shakha_id) === String(ordersShakhaFilter);

            return matchesStatus && matchesShakha;
        });
    }, [orders, ordersStatusFilter, ordersShakhaFilter]);

    // Handle Order Status Update
    const handleUpdateOrderStatus = (e) => {
        e.preventDefault();
        if (!selectedOrderForStatus || !newOrderStatusValue) return;

        setStatusUpdateSubmitting(true);
        router.put(`/toli/orders/${selectedOrderForStatus.id}/status`, {
            status: newOrderStatusValue
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedOrderForStatus(null);
                setStatusUpdateSubmitting(false);
                showToast('ऑर्डर की स्थिति अपडेट की गई।', 'success');
            },
            onError: () => setStatusUpdateSubmitting(false)
        });
    };

    // Handle Order Cancellation
    const handleCancelOrder = (e) => {
        e.preventDefault();
        if (!orderToCancel) return;

        setCancelSubmitting(true);
        router.post(`/toli/orders/${orderToCancel.id}/cancel`, {
            reason: cancelReason || 'टोली सदस्य द्वारा रद्द'
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setOrderToCancel(null);
                setCancelSubmitting(false);
                showToast('ऑर्डर रद्द किया गया एवं स्टॉक वापस जोड़ दिया गया।', 'success');
            },
            onError: () => setCancelSubmitting(false)
        });
    };

    // Handle Return Request
    const handleReturnOrder = (e) => {
        e.preventDefault();
        if (!orderToReturn) return;

        setReturnSubmitting(true);
        router.post(`/toli/orders/${orderToReturn.id}/return`, {
            reason: returnReason,
            notes: returnNotes
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setOrderToReturn(null);
                setReturnSubmitting(false);
                showToast('वापसी अनुरोध सफलतापूर्वक दर्ज किया गया।', 'success');
            },
            onError: () => setReturnSubmitting(false)
        });
    };

    // Target title & hierarchy subtitle
    const parentSubtitle = useMemo(() => {
        if (!unit?.parents || unit.parents.length === 0) return '';
        return unit.parents.map((p) => p.name).join(' • ');
    }, [unit]);

    return (
        <div className="min-h-screen bg-orange-50/60 text-stone-900 font-sans pb-16 selection:bg-amber-200">
            <Head title={`🚩 ${unit?.name || 'टोली पृष्ठ'} | वस्तु भंडार`} />

            {/* Notification Toast */}
            {toastMessage && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center space-x-2 animate-bounce transition-all duration-300 ${
                    toastType === 'error' ? 'bg-red-50 border-red-300 text-red-800' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                }">
                    {toastType === 'error' ? <AlertCircle className="w-5 h-5 text-red-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Sticky Mobile-First Saffron Header */}
            <header className="sticky top-0 z-40 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-md">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                    {/* Unit Info */}
                    <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center space-x-1.5 text-xs text-amber-200 font-medium tracking-wide">
                            <span>🚩</span>
                            <span>{unit?.level_hindi || 'इकाई'} पृष्ठ</span>
                            {unit?.parents && unit.parents.length > 0 ? (
                                <>
                                    <span>•</span>
                                    <span className="truncate max-w-[260px] inline-flex items-center space-x-1">
                                        {unit.parents.map((p, idx) => (
                                            <span key={p.id || idx} className="inline-flex items-center">
                                                {idx > 0 && <span className="mx-1 opacity-60">/</span>}
                                                {p.url ? (
                                                    <a href={p.url} className="hover:underline hover:text-white transition" title={`${p.name} (${p.level})`}>
                                                        {p.name}
                                                    </a>
                                                ) : (
                                                    <span>{p.name}</span>
                                                )}
                                            </span>
                                        ))}
                                    </span>
                                </>
                            ) : parentSubtitle ? (
                                <>
                                    <span>•</span>
                                    <span className="truncate max-w-[200px]">{parentSubtitle}</span>
                                </>
                            ) : null}
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold truncate text-white tracking-tight flex items-center space-x-1.5 mt-0.5">
                            <span>{unit?.name}</span>
                        </h1>
                    </div>

                    {/* Header Action Buttons */}
                    <div className="flex items-center space-x-2 shrink-0">
                        {/* Report Button */}
                        <button
                            onClick={() => setShowReportModal(true)}
                            className="bg-amber-800/80 hover:bg-amber-900 text-amber-100 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium flex items-center space-x-1 transition border border-amber-500/40 shadow-sm"
                            title="वृत्त रिपोर्ट देखें व शेयर करें"
                        >
                            <FileText className="w-4 h-4 text-amber-300" />
                            <span className="hidden sm:inline">वृत्त</span>
                        </button>

                        {/* Auth Status / Login / Logout */}
                        {isAuthenticated ? (
                            <button
                                onClick={handleLogout}
                                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg text-xs transition"
                                title="लॉग आउट करें"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowLoginModal(true)}
                                className="bg-white text-orange-700 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold shadow hover:bg-amber-50 transition"
                            >
                                लॉगिन
                            </button>
                        )}
                    </div>
                </div>

                {/* Sub-Header Tabs */}
                <div className="bg-amber-700/60 border-t border-amber-500/30">
                    <div className="max-w-5xl mx-auto px-2 flex overflow-x-auto no-scrollbar space-x-1">
                        <button
                            onClick={() => setActiveTab('members')}
                            className={`px-3 py-2.5 text-xs md:text-sm font-semibold rounded-t-lg transition flex items-center space-x-1.5 whitespace-nowrap shrink-0 ${
                                activeTab === 'members'
                                    ? 'bg-orange-50/90 text-orange-900 shadow-sm font-bold'
                                    : 'text-amber-100 hover:bg-amber-600/40'
                            }`}
                        >
                            <Users className="w-4 h-4" />
                            <span>सूची संपादन ({swayamsevakStats.total})</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('distribution')}
                            className={`px-3 py-2.5 text-xs md:text-sm font-semibold rounded-t-lg transition flex items-center space-x-1.5 whitespace-nowrap shrink-0 ${
                                activeTab === 'distribution'
                                    ? 'bg-orange-50/90 text-orange-900 shadow-sm font-bold'
                                    : 'text-amber-100 hover:bg-amber-600/40'
                            }`}
                        >
                            <Shirt className="w-4 h-4" />
                            <span>गणवेश वितरण</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`px-3 py-2.5 text-xs md:text-sm font-semibold rounded-t-lg transition flex items-center space-x-1.5 whitespace-nowrap shrink-0 ${
                                activeTab === 'orders'
                                    ? 'bg-orange-50/90 text-orange-900 shadow-sm font-bold'
                                    : 'text-amber-100 hover:bg-amber-600/40'
                            }`}
                        >
                            <Package className="w-4 h-4" />
                            <span>टोली ऑर्डर्स ({orderStats.total})</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('subunits')}
                            className={`px-3 py-2.5 text-xs md:text-sm font-semibold rounded-t-lg transition flex items-center space-x-1.5 whitespace-nowrap shrink-0 ${
                                activeTab === 'subunits'
                                    ? 'bg-orange-50/90 text-orange-900 shadow-sm font-bold'
                                    : 'text-amber-100 hover:bg-amber-600/40'
                            }`}
                        >
                            <Share2 className="w-4 h-4" />
                            <span>उप-इकाई लिंक ({subUnits.length})</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-5xl mx-auto px-3 sm:px-4 py-4 space-y-4">

                {/* TAB 1: सूची संपादन (SWAYAMSEVAK MANAGEMENT) */}
                {activeTab === 'members' && (
                    <div className="space-y-4">
                        {/* Summary Stats Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {/* Total Members */}
                            <div className="bg-white p-3 rounded-xl border border-orange-200/80 shadow-xs flex flex-col justify-between">
                                <span className="text-xs text-stone-500 font-medium">👥 कुल स्वयंसेवक</span>
                                <div className="text-2xl font-black text-stone-800 mt-1">
                                    {swayamsevakStats.total}
                                </div>
                                <span className="text-[11px] text-stone-400 mt-0.5">पंजीकृत सूची</span>
                            </div>

                            {/* Ganvesh Equipped */}
                            <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-xs flex flex-col justify-between">
                                <span className="text-xs text-emerald-700 font-medium">👕 गणवेश युक्त</span>
                                <div className="text-2xl font-black text-emerald-800 mt-1">
                                    {swayamsevakStats.ganvesh}
                                </div>
                                <span className="text-[11px] text-emerald-600 mt-0.5">
                                    {swayamsevakStats.total > 0 ? `${Math.round((swayamsevakStats.ganvesh / swayamsevakStats.total) * 100)}% युक्त` : '0%'}
                                </span>
                            </div>

                            {/* Without Ganvesh */}
                            <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-xs flex flex-col justify-between">
                                <span className="text-xs text-amber-700 font-medium">⚠️ गणवेश अपेक्षित</span>
                                <div className="text-2xl font-black text-amber-800 mt-1">
                                    {swayamsevakStats.non_ganvesh}
                                </div>
                                <span className="text-[11px] text-amber-600 mt-0.5">गणवेश शेष</span>
                            </div>

                            {/* New Ganvesh Figure */}
                            <div className="bg-white p-3 rounded-xl border border-orange-300 bg-gradient-to-br from-white to-orange-50/50 shadow-xs flex flex-col justify-between relative group">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-orange-800 font-bold">✨ नया गणवेश</span>
                                    <button
                                        onClick={() => setShowNewGanveshModal(true)}
                                        className="text-[11px] text-orange-700 hover:text-orange-900 bg-orange-100 hover:bg-orange-200 px-1.5 py-0.5 rounded flex items-center space-x-0.5"
                                        title="नया गणवेश आंकड़ा बदलें"
                                    >
                                        <Edit3 className="w-3 h-3" />
                                        <span>अपडेट</span>
                                    </button>
                                </div>
                                <div className="text-2xl font-black text-orange-900 mt-1">
                                    {swayamsevakStats.new_ganvesh}
                                </div>
                                <span className="text-[11px] text-orange-700 mt-0.5">इस सत्र में नया गणवेश</span>
                            </div>
                        </div>

                        {/* Action Buttons: Add Member, Import CSV, Template */}
                        <div className="bg-white p-3 rounded-xl border border-orange-100 shadow-xs flex flex-wrap gap-2 items-center justify-between">
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                <button
                                    onClick={handleOpenAddMember}
                                    className="flex-1 sm:flex-initial bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center justify-center space-x-1.5 shadow-xs transition"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>नया स्वयंसेवक जोड़ें</span>
                                </button>

                                <button
                                    onClick={() => setShowImportModal(true)}
                                    className="flex-1 sm:flex-initial bg-stone-100 hover:bg-stone-200 text-stone-800 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center space-x-1.5 border border-stone-300 transition"
                                >
                                    <Upload className="w-4 h-4 text-stone-600" />
                                    <span>एक्सेल / CSV अपलोड</span>
                                </button>
                            </div>

                            <a
                                href="/toli/members/template"
                                download
                                className="text-xs text-amber-700 hover:text-amber-900 hover:underline flex items-center space-x-1 ml-auto py-1"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>नमूना फ़ाइल (CSV) डाउनलोड करें</span>
                            </a>
                        </div>

                        {/* Search and Filters */}
                        <div className="bg-white p-3 rounded-xl border border-orange-100 shadow-xs space-y-2.5">
                            <div className="relative">
                                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                    placeholder="स्वयंसेवक का नाम, मोबाइल या पता खोजें..."
                                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                                />
                                {memberSearch && (
                                    <button
                                        onClick={() => setMemberSearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                                    >
                                        हटाएं
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2 text-xs">
                                <span className="self-center font-medium text-stone-500">गणवेश स्थिति:</span>
                                {[
                                    { id: 'all', label: 'सभी' },
                                    { id: 'equipped', label: '🟢 गणवेश युक्त' },
                                    { id: 'unequipped', label: '⚪ गणवेश अपेक्षित' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setMemberGanveshFilter(tab.id)}
                                        className={`px-2.5 py-1 rounded-md font-medium transition ${
                                            memberGanveshFilter === tab.id
                                                ? 'bg-amber-600 text-white'
                                                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}

                                {bastisList.length > 1 && (
                                    <div className="ml-auto flex items-center space-x-1">
                                        <span className="text-stone-500 font-medium">बस्ती:</span>
                                        <select
                                            value={memberShakhaFilter}
                                            onChange={(e) => setMemberShakhaFilter(e.target.value)}
                                            className="px-2 py-1 bg-stone-50 border border-stone-200 rounded text-xs focus:ring-1 focus:ring-amber-500"
                                        >
                                            <option value="all">सभी बस्तियां</option>
                                            {bastisList.map((s) => (
                                                <option key={s.id} value={s.id}>{s.basti_name || s.shakha_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Swayamsevaks List */}
                        <div className="space-y-2">
                            {filteredSwayamsevaks.length === 0 ? (
                                <div className="bg-white rounded-xl p-8 text-center border border-dashed border-stone-300">
                                    <Users className="w-12 h-12 text-stone-300 mx-auto mb-2" />
                                    <p className="text-stone-600 font-medium">कोई स्वयंसेवक नहीं मिला।</p>
                                    <p className="text-xs text-stone-400 mt-1">नया स्वयंसेवक जोड़ने के लिए ऊपर दिए गए बटन का प्रयोग करें।</p>
                                </div>
                            ) : (
                                filteredSwayamsevaks.map((m) => (
                                    <div
                                        key={m.id}
                                        className="bg-white p-3.5 rounded-xl border border-orange-100 shadow-xs hover:border-amber-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                    >
                                        {/* Member Info */}
                                        <div className="space-y-1 min-w-0">
                                            <div className="flex items-center space-x-2">
                                                <h3 className="font-bold text-stone-900 text-base">{m.name}</h3>
                                                {m.ganvesh ? (
                                                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-0.5">
                                                        <span>🟢</span>
                                                        <span>गणवेश युक्त</span>
                                                    </span>
                                                ) : (
                                                    <span className="bg-amber-100 text-amber-800 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center space-x-0.5">
                                                        <span>⚪</span>
                                                        <span>गणवेश शेष</span>
                                                    </span>
                                                )}
                                                {m.shikshan && (
                                                    <span className="bg-stone-100 text-stone-700 text-[10px] font-medium px-1.5 py-0.5 rounded">
                                                        {m.shikshan}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                                                {m.mobile && (
                                                    <div className="flex items-center space-x-1">
                                                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                                                        <a href={`tel:${m.mobile}`} className="text-amber-700 font-medium hover:underline">
                                                            {m.mobile}
                                                        </a>
                                                        <button
                                                            onClick={() => shareToWhatsApp(`नमस्ते ${m.name} जी, संघ गणवेश वितरण एवं टोली सूचना।`)}
                                                            className="text-emerald-600 hover:text-emerald-700 ml-1"
                                                            title="व्हाट्सएप संदेश भेजें"
                                                        >
                                                            <MessageCircle className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}

                                                {m.address && (
                                                    <div className="flex items-center space-x-1 truncate max-w-xs">
                                                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                                        <span className="truncate">{m.address}</span>
                                                    </div>
                                                )}

                                                {(m.basti_name || m.shakha_name) && (
                                                    <span className="text-[11px] text-stone-400">
                                                        ({m.basti_name || m.shakha_name})
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                                            <button
                                                onClick={() => handleOpenEditMember(m)}
                                                className="bg-stone-50 hover:bg-amber-50 text-stone-700 hover:text-amber-800 p-2 rounded-lg border border-stone-200 hover:border-amber-300 transition text-xs flex items-center space-x-1"
                                                title="संपादन करें"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                                <span className="hidden sm:inline">संपादित करें</span>
                                            </button>

                                            <button
                                                onClick={() => handleDeleteMember(m)}
                                                className="bg-stone-50 hover:bg-red-50 text-stone-500 hover:text-red-700 p-2 rounded-lg border border-stone-200 hover:border-red-300 transition text-xs"
                                                title="हटाएं"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 2: गणवेश वितरण (UNIFORM PRODUCTS & FAST ORDERING) */}
                {activeTab === 'distribution' && (
                    <div className="space-y-4">
                        {/* Instant Search Bar (Key up starts on 3 characters) */}
                        <div className="bg-white p-3.5 rounded-xl border border-orange-100 shadow-xs space-y-1">
                            <div className="relative">
                                <Search className="w-5 h-5 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    placeholder="🔍 गणवेश उत्पाद खोजें... (कम से कम ३ अक्षर टाइप करें)"
                                    className="w-full pl-10 pr-4 py-2.5 bg-orange-50/50 border border-orange-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                                />
                                {productSearch && (
                                    <button
                                        onClick={() => setProductSearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-semibold px-2 py-1 bg-stone-100 rounded"
                                    >
                                        हटाएं
                                    </button>
                                )}
                            </div>
                            <p className="text-[11px] text-stone-400 pl-1">
                                {productSearch.length > 0 && productSearch.length < 3
                                    ? 'कम से कम ३ अक्षर टाइप करें...'
                                    : `उपलब्ध उत्पाद: ${filteredProducts.length}`}
                            </p>
                        </div>

                        {/* Single-Column Row Product Listing with Small Left Images */}
                        <div className="space-y-2">
                            {filteredProducts.length === 0 ? (
                                <div className="bg-white rounded-xl p-8 text-center border border-dashed border-stone-300">
                                    <Shirt className="w-12 h-12 text-stone-300 mx-auto mb-2" />
                                    <p className="text-stone-600 font-medium">कोई गणवेश उत्पाद नहीं मिला।</p>
                                    <p className="text-xs text-stone-400 mt-1">खोज शब्द बदलकर पुनः प्रयास करें।</p>
                                </div>
                            ) : (
                                filteredProducts.map((p) => {
                                    const inStock = p.stock > 0;
                                    return (
                                        <div
                                            key={p.id}
                                            className="bg-white p-3 rounded-xl border border-orange-100 shadow-xs hover:border-amber-300 transition flex items-center space-x-3.5"
                                        >
                                            {/* Left Small Product Image */}
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-stone-50 rounded-lg border border-stone-200 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                                                <img
                                                    src={p.image_url}
                                                    alt={p.name}
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = '/images/products/shirt.svg';
                                                    }}
                                                />
                                            </div>

                                            {/* Product Details */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-stone-900 text-sm sm:text-base leading-snug truncate">
                                                    {p.name}
                                                </h3>
                                                {p.sku && (
                                                    <p className="text-[11px] text-stone-400 truncate mt-0.5">
                                                        कोड: {p.sku}
                                                    </p>
                                                )}
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className="text-base sm:text-lg font-black text-amber-800">
                                                        ₹{p.price}
                                                    </span>
                                                    {inStock ? (
                                                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                            उपलब्ध: {p.stock}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                                            आउट ऑफ स्टॉक
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Order or Demand Action Button */}
                                            <div className="shrink-0 pl-1">
                                                {inStock ? (
                                                    <button
                                                        onClick={() => handleOpenOrderModal(p)}
                                                        className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition flex items-center space-x-1 bg-amber-600 hover:bg-amber-700 text-white active:scale-95 cursor-pointer"
                                                    >
                                                        <span>ऑर्डर करें</span>
                                                        <ChevronRight className="w-4 h-4 hidden sm:inline" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleOpenDemandModal(p)}
                                                        className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition flex items-center space-x-1 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white active:scale-95 cursor-pointer"
                                                    >
                                                        <ClipboardList className="w-3.5 h-3.5 mr-0.5" />
                                                        <span>मांग दर्ज करें</span>
                                                        <ChevronRight className="w-4 h-4 hidden sm:inline" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 3: टोली ऑर्डर्स (ORDERS TRACKING & MANAGEMENT) */}
                {activeTab === 'orders' && (
                    <div className="space-y-4">
                        {/* Order Aggregate Statistics */}
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            <div className="bg-white p-2.5 rounded-xl border border-stone-200 text-center shadow-xs">
                                <span className="text-[10px] text-stone-500 font-medium block">कुल ऑर्डर्स</span>
                                <span className="text-xl font-black text-stone-800">{orderStats.total}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-emerald-200 text-center shadow-xs">
                                <span className="text-[10px] text-emerald-700 font-medium block">पूर्ण भुगतान</span>
                                <span className="text-xl font-black text-emerald-800">{orderStats.paid}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-amber-200 text-center shadow-xs">
                                <span className="text-[10px] text-amber-700 font-medium block">भुगतान बाकी</span>
                                <span className="text-xl font-black text-amber-800">{orderStats.payment_due}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-blue-200 text-center shadow-xs">
                                <span className="text-[10px] text-blue-700 font-medium block">डिलीवर हुआ</span>
                                <span className="text-xl font-black text-blue-800">{orderStats.delivered}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-purple-200 text-center shadow-xs">
                                <span className="text-[10px] text-purple-700 font-medium block">पूर्ण (वितरित)</span>
                                <span className="text-xl font-black text-purple-800">{orderStats.completed}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-red-200 text-center shadow-xs">
                                <span className="text-[10px] text-red-700 font-medium block">रद्द</span>
                                <span className="text-xl font-black text-red-800">{orderStats.cancelled}</span>
                            </div>
                        </div>

                        {/* Order Filters */}
                        <div className="bg-white p-3 rounded-xl border border-orange-100 shadow-xs flex flex-wrap gap-2 items-center justify-between text-xs">
                            <div className="flex flex-wrap gap-1.5 items-center">
                                <span className="font-medium text-stone-500 mr-1">स्थिति:</span>
                                {[
                                    { id: 'all', label: 'सभी' },
                                    { id: 'paid', label: 'पूर्ण भुगतान' },
                                    { id: 'payment_due', label: 'बाकी भुगतान' },
                                    { id: 'placed', label: 'दर्ज' },
                                    { id: 'completed', label: 'पूर्ण' },
                                    { id: 'cancelled', label: 'रद्द' },
                                ].map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => setOrdersStatusFilter(s.id)}
                                        className={`px-2.5 py-1 rounded-md font-medium transition ${
                                            ordersStatusFilter === s.id
                                                ? 'bg-amber-600 text-white'
                                                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                        }`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>

                            {bastisList.length > 1 && (
                                <div className="flex items-center space-x-1 ml-auto">
                                    <span className="text-stone-500 font-medium">बस्ती:</span>
                                    <select
                                        value={ordersShakhaFilter}
                                        onChange={(e) => setOrdersShakhaFilter(e.target.value)}
                                        className="px-2 py-1 bg-stone-50 border border-stone-200 rounded text-xs focus:ring-1 focus:ring-amber-500"
                                    >
                                        <option value="all">सभी बस्तियां</option>
                                        {bastisList.map((s) => (
                                            <option key={s.id} value={s.id}>{s.basti_name || s.shakha_name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Orders List */}
                        <div className="space-y-2.5">
                            {filteredOrders.length === 0 ? (
                                <div className="bg-white rounded-xl p-8 text-center border border-dashed border-stone-300">
                                    <Package className="w-12 h-12 text-stone-300 mx-auto mb-2" />
                                    <p className="text-stone-600 font-medium">कोई ऑर्डर नहीं मिला।</p>
                                    <p className="text-xs text-stone-400 mt-1">गणवेश वितरण टैब से नया ऑर्डर दर्ज करें।</p>
                                </div>
                            ) : (
                                filteredOrders.map((o) => {
                                    const isPaid = o.order_status === 'paid' || o.payment_status === 'paid';
                                    const isDue = o.order_status === 'payment_due' || o.payment_status === 'pending';
                                    const isCompleted = o.order_status === 'completed';
                                    const isCancelled = o.order_status === 'cancelled';

                                    return (
                                        <div
                                            key={o.id}
                                            className="bg-white p-3.5 rounded-xl border border-orange-100 shadow-xs space-y-2"
                                        >
                                            {/* Order Top Line */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-bold text-sm text-stone-800">#{o.order_number}</span>
                                                    {o.is_toli_order && (
                                                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                                            टोली ऑर्डर
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center space-x-1.5">
                                                    {isPaid && (
                                                        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
                                                            🟢 पूर्ण भुगतान
                                                        </span>
                                                    )}
                                                    {isDue && (
                                                        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                                                            🟡 भुगतान बाकी
                                                        </span>
                                                    )}
                                                    {isCompleted && (
                                                        <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-0.5 rounded-full">
                                                            🟣 पूर्ण
                                                        </span>
                                                    )}
                                                    {isCancelled && (
                                                        <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full">
                                                            🔴 रद्द
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Order Items Info */}
                                            <div className="bg-stone-50 p-2 rounded-lg space-y-1 text-xs">
                                                {o.items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-stone-700">
                                                        <span className="font-medium truncate max-w-[240px]">
                                                            {item.product_name} × {item.quantity}
                                                        </span>
                                                        <span className="font-semibold text-stone-900">
                                                            ₹{item.subtotal}
                                                        </span>
                                                    </div>
                                                ))}
                                                <div className="border-t border-stone-200 pt-1 flex justify-between font-bold text-amber-900">
                                                    <span>कुल राशि:</span>
                                                    <span>₹{o.total_amount}</span>
                                                </div>
                                            </div>

                                            {/* Metadata: Placed At, Notes, Shakha, Intended Swayamsevak */}
                                            <div className="flex flex-wrap items-center justify-between text-xs text-stone-500 gap-y-1">
                                                <div className="space-y-1">
                                                    <div className="space-x-2">
                                                        <span>📅 {o.placed_at}</span>
                                                        {(o.basti_name || o.shakha_name) && <span>• बस्ती: {o.basti_name || o.shakha_name}</span>}
                                                        <span className="text-stone-400">• दर्जकर्ता: {o.customer_name}</span>
                                                        {o.notes && <span className="italic text-amber-800 font-medium">• {o.notes}</span>}
                                                    </div>
                                                    {o.swayamsevak_name && (
                                                        <div className="flex items-center space-x-1 pt-0.5">
                                                            <span className="inline-flex items-center bg-amber-50 text-amber-900 border border-amber-200/90 px-2 py-0.5 rounded-md text-xs font-semibold">
                                                                👤 अभिप्रेत स्वयंसेवक: {o.swayamsevak_name} {o.swayamsevak_mobile ? `(${o.swayamsevak_mobile})` : ''}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Buttons for Toli Member */}
                                                <div className="flex items-center space-x-1.5 ml-auto">
                                                    {/* Change Status */}
                                                    {!isCancelled && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedOrderForStatus(o);
                                                                setNewOrderStatusValue(o.order_status);
                                                            }}
                                                            className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-1 rounded font-medium transition"
                                                        >
                                                            स्थिति बदलें
                                                        </button>
                                                    )}

                                                    {/* Cancel Order */}
                                                    {o.can_cancel && (
                                                        <button
                                                            onClick={() => {
                                                                setOrderToCancel(o);
                                                                setCancelReason('');
                                                            }}
                                                            className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-2 py-1 rounded font-medium transition"
                                                        >
                                                            रद्द करें
                                                        </button>
                                                    )}

                                                    {/* Return Request */}
                                                    {o.can_return && (
                                                        <button
                                                            onClick={() => {
                                                                setOrderToReturn(o);
                                                                setReturnReason('आकार परिवर्तन हेतु');
                                                                setReturnNotes('');
                                                            }}
                                                            className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 px-2 py-1 rounded font-medium transition"
                                                        >
                                                            वापसी अनुरोध
                                                        </button>
                                                    )}

                                                    {o.return_request_status && (
                                                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-semibold">
                                                            वापसी: {o.return_request_status}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 4: उप-इकाई लिंक (SUB-UNIT URLS & SHARING) */}
                {activeTab === 'subunits' && (
                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-xs">
                            <h2 className="text-base font-bold text-stone-900 flex items-center space-x-2">
                                <Share2 className="w-5 h-5 text-amber-600" />
                                <span>अधीनस्थ उप-इकाई पृष्ठ लिंक एवं QR कोड</span>
                            </h2>
                            <p className="text-xs text-stone-500 mt-1">
                                नीचे दी गई प्रत्येक उप-इकाई का QR कोड व सुरक्षित लिंक उपलब्ध है। इन्हें मोबाइल से स्कैन करें, कॉपी करें या व्हाट्सएप पर साझा करें।
                            </p>
                        </div>

                        <div className="space-y-2">
                            {subUnits.length === 0 ? (
                                <div className="bg-white rounded-xl p-8 text-center border border-dashed border-stone-300">
                                    <p className="text-stone-600 font-medium">कोई अधीनस्थ उप-इकाई नहीं है।</p>
                                </div>
                            ) : (
                                subUnits.map((sub, idx) => (
                                    <div
                                        key={sub.id}
                                        className={`bg-white p-3.5 rounded-xl border transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                            sub.is_current ? 'border-amber-400 bg-amber-50/30' : 'border-orange-100 hover:border-amber-200'
                                        }`}
                                    >
                                        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                                            {/* QR Code Thumbnail Image */}
                                            <button
                                                type="button"
                                                onClick={() => setSelectedQrUnit(sub)}
                                                className="cursor-pointer bg-white p-1.5 rounded-xl border border-stone-200 hover:border-amber-500 hover:shadow-md shadow-2xs transition group shrink-0 text-center"
                                                title="बड़ा QR कोड देखने व स्कैन करने हेतु क्लिक करें"
                                            >
                                                <div className="bg-white p-0.5 rounded">
                                                    <QRCodeSVG
                                                        id={`sub-unit-qr-svg-${sub.id}`}
                                                        value={sub.full_url}
                                                        size={64}
                                                        level="M"
                                                        className="group-hover:scale-105 transition-transform"
                                                    />
                                                </div>
                                                <span className="block text-[9px] text-stone-500 mt-1 font-semibold group-hover:text-amber-700">QR बड़ा करें</span>
                                            </button>

                                            <div className="space-y-1 min-w-0 flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                                                        {sub.name}
                                                    </h3>
                                                    <span className="bg-stone-100 text-stone-600 text-[10px] font-semibold px-2 py-0.5 rounded">
                                                        {sub.type_hindi}
                                                    </span>
                                                    {sub.is_current && (
                                                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                                                            वर्तमान इकाई
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="text-xs text-stone-500 flex flex-wrap gap-x-3">
                                                    <span>👥 स्वयंसेवक: {sub.members_count ?? 0}</span>
                                                    <span>👕 गणवेश: {sub.ganvesh_count ?? 0}</span>
                                                    <span>✨ नया गणवेश: {sub.new_ganvesh ?? 0}</span>
                                                </div>

                                                <p className="text-[11px] text-stone-400 font-mono select-all truncate max-w-sm">
                                                    {sub.full_url}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center shrink-0">
                                            {/* Show QR Modal */}
                                            <button
                                                type="button"
                                                onClick={() => setSelectedQrUnit(sub)}
                                                className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1 transition cursor-pointer"
                                                title="QR कोड बड़ा देखें"
                                            >
                                                <QrCode className="w-3.5 h-3.5 text-amber-700" />
                                                <span>QR कोड</span>
                                            </button>

                                            {/* Download QR Image */}
                                            <button
                                                type="button"
                                                onClick={() => handleDownloadQrImage(sub)}
                                                className="bg-stone-100 hover:bg-amber-50 text-stone-800 hover:text-amber-900 border border-stone-200 hover:border-amber-300 px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1 transition cursor-pointer"
                                                title="QR इमेज (PNG) डाउनलोड करें"
                                            >
                                                <Download className="w-3.5 h-3.5 text-stone-600" />
                                                <span>QR डाउनलोड</span>
                                            </button>

                                            {/* Copy URL */}
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(sub.full_url, idx)}
                                                className="bg-stone-100 hover:bg-stone-200 text-stone-800 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1 transition cursor-pointer"
                                                title="लिंक कॉपी करें"
                                            >
                                                {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                                <span>{copiedIndex === idx ? 'कॉपी हुआ' : 'कॉपी'}</span>
                                            </button>

                                            {/* WhatsApp Share */}
                                            <button
                                                type="button"
                                                onClick={() => shareToWhatsApp(`🚩 ${sub.name} (${sub.type_hindi}) टोली पृष्ठ:\n${sub.full_url}`)}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1 shadow-xs transition cursor-pointer"
                                                title="व्हाट्सएप पर शेयर करें"
                                            >
                                                <MessageCircle className="w-3.5 h-3.5" />
                                                <span>व्हाट्सएप</span>
                                            </button>

                                            {/* Open Link */}
                                            {!sub.is_current && (
                                                <a
                                                    href={sub.url}
                                                    className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition flex items-center space-x-1"
                                                >
                                                    <span>खोलें</span>
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* ============================================================ */}
            {/* MODALS */}
            {/* ============================================================ */}

            {/* 1. SECURE CREDENTIAL LOGIN MODAL */}
            {showLoginModal && !isAuthenticated && (
                <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-orange-200 overflow-hidden animate-scale-in">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-5 text-white text-center relative">
                            <button
                                type="button"
                                onClick={() => setShowLoginModal(false)}
                                className="absolute right-3 top-3 text-white/80 hover:text-white p-1 rounded-lg"
                                title="बंद करें"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <span className="text-3xl block mb-1">🚩</span>
                            <h2 className="text-xl font-bold tracking-tight">टोली प्रवेश / लॉगिन</h2>
                            <p className="text-xs text-amber-100 mt-1">
                                {unit?.name ? `${unit.name} (${unit.level_hindi}) टोली पृष्ठ` : 'टोली विशिष्ट पृष्ठ'}
                            </p>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleManualLogin} className="p-5 space-y-4">
                            <p className="text-xs text-stone-600">
                                टोली में गणवेश वितरण एवं ऑर्डर दर्ज करने हेतु मुख्य पोर्टल के लॉगिन विवरण (मोबाइल नंबर / ईमेल एवं पासवर्ड) से प्रवेश करें।
                            </p>

                            {loginError && (
                                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs font-medium border border-red-200 flex items-center space-x-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{loginError}</span>
                                </div>
                            )}

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                                        मोबाइल नंबर या ईमेल
                                    </label>
                                    <input
                                        type="text"
                                        value={loginCredential}
                                        onChange={(e) => setLoginCredential(e.target.value)}
                                        placeholder="उदा. 9876543210"
                                        className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                                        पासवर्ड
                                    </label>
                                    <input
                                        type="password"
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        placeholder="पासवर्ड दर्ज करें"
                                        className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loginSubmitting}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl text-sm shadow-md transition flex items-center justify-center space-x-1.5"
                            >
                                {loginSubmitting ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span>सत्यापन जारी है...</span>
                                    </>
                                ) : (
                                    <span>प्रवेश करें (Login)</span>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 2. PRODUCT VIEW & QUICK ORDER / DEMAND MODAL */}
            {selectedProduct && (
                <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-orange-200 overflow-hidden animate-scale-in">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-4 text-white flex items-center justify-between">
                            <h2 className="text-base font-bold flex items-center space-x-2">
                                {selectedProduct.stock > 0 ? (
                                    <>
                                        <Shirt className="w-5 h-5 text-amber-200" />
                                        <span>गणवेश वितरण ऑर्डर दर्ज करें</span>
                                    </>
                                ) : (
                                    <>
                                        <ClipboardList className="w-5 h-5 text-amber-200" />
                                        <span>उत्पाद मांग दर्ज करें (Product Demand)</span>
                                    </>
                                )}
                            </h2>
                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={selectedProduct.stock > 0 ? handlePlaceOrder : handlePlaceDemand} className="p-4 space-y-4">
                            {/* Product Info Display */}
                            <div className="flex items-center space-x-3 bg-orange-50/60 p-3 rounded-xl border border-orange-100">
                                <div className="w-16 h-16 bg-white rounded-lg p-1 border border-stone-200 shrink-0 flex items-center justify-center">
                                    <img
                                        src={selectedProduct.image_url}
                                        alt={selectedProduct.name}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-stone-900 text-sm">{selectedProduct.name}</h3>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <span className="text-base font-black text-amber-900">₹{selectedProduct.price}</span>
                                        {selectedProduct.stock > 0 ? (
                                            <span className="text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-medium">
                                                स्टॉक उपलब्ध: {selectedProduct.stock}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full font-bold">
                                                वर्तमान स्टॉक: 0 (आउट ऑफ स्टॉक)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Info note for Demand form */}
                            {selectedProduct.stock <= 0 && (
                                <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 leading-relaxed">
                                    ℹ️ यह उत्पाद वर्तमान में स्टॉक में नहीं है। टोली मांग दर्ज कर रही है ताकि डीलर आवश्यकतानुसार स्टॉक तैयार/उपलब्ध करा सके।
                                </div>
                            )}

                            {/* Quantity Stepper */}
                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    मात्रा (संख्या)
                                </label>
                                <div className="flex items-center space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                                        className="w-10 h-10 bg-stone-100 hover:bg-stone-200 rounded-lg text-lg font-bold flex items-center justify-center transition cursor-pointer"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        max={selectedProduct.stock > 0 ? selectedProduct.stock : undefined}
                                        value={orderQuantity}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 1;
                                            setOrderQuantity(selectedProduct.stock > 0 ? Math.min(selectedProduct.stock, Math.max(1, val)) : Math.max(1, val));
                                        }}
                                        className="w-20 text-center py-2 bg-stone-50 border border-stone-300 rounded-lg text-base font-bold focus:ring-2 focus:ring-amber-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (selectedProduct.stock > 0) {
                                                setOrderQuantity(Math.min(selectedProduct.stock, orderQuantity + 1));
                                            } else {
                                                setOrderQuantity(orderQuantity + 1);
                                            }
                                        }}
                                        className="w-10 h-10 bg-stone-100 hover:bg-stone-200 rounded-lg text-lg font-bold flex items-center justify-center transition cursor-pointer"
                                    >
                                        +
                                    </button>
                                    <div className="ml-auto text-right">
                                        <span className="text-xs text-stone-500 block">कुल राशि</span>
                                        <span className="text-lg font-black text-amber-800">
                                            ₹{(selectedProduct.price * orderQuantity).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Status Selection (Absent in Demand form) */}
                            {selectedProduct.stock > 0 && (
                                <div>
                                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                                        भुगतान स्थिति (Payment Status)
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        {[
                                            { id: 'paid', label: '🟢 पूर्ण भुगतान (Paid)', desc: 'नकद या पूर्ण अग्रिम प्राप्त' },
                                            { id: 'payment_due', label: '🟡 भुगतान बाकी (Due)', desc: 'राशि बाद में देय' },
                                            { id: 'placed', label: '🔵 ऑर्डर दर्ज (Placed)', desc: 'सामान्य ऑर्डर' },
                                            { id: 'completed', label: '🟣 पूर्ण / वितरित (Completed)', desc: 'तुरंत गणवेश सुपुर्द' },
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => setOrderPaymentStatus(opt.id)}
                                                className={`p-2.5 rounded-xl border text-left transition ${
                                                    orderPaymentStatus === opt.id
                                                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400 font-bold text-amber-950'
                                                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                                                }`}
                                            >
                                                <div className="text-xs font-bold">{opt.label}</div>
                                                <div className="text-[10px] text-stone-500 mt-0.5">{opt.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Basti Assignment (if not at basti level) */}
                            {!isBasti && (
                                <div>
                                    <label className="block text-xs font-bold text-stone-700 mb-1">
                                        बस्ती का चयन <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={orderShakhaId}
                                        onChange={(e) => {
                                            setOrderShakhaId(e.target.value);
                                            setOrderSwayamsevakId('');
                                            setOrderMemberSearch('');
                                            setShowInlineMemberCreate(false);
                                            setIsOrderMemberDropdownOpen(false);
                                        }}
                                        required
                                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="">-- कृपया बस्ती का चयन करें --</option>
                                        {bastisList.map((s) => (
                                            <option key={s.id} value={s.id}>{s.basti_name || s.shakha_name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Swayamsevak (Member) Searchable Combobox & Inline Creation Form */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-bold text-stone-700">
                                        अभिप्रेत स्वयंसेवक / सदस्य (वैकल्पिक)
                                    </label>
                                    {effectiveOrderShakhaId && !showInlineMemberCreate && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setInlineMemberForm({
                                                    name: orderMemberSearch.trim(),
                                                    mobile: '',
                                                    address: '',
                                                    ganvesh: false,
                                                    shikshan: 'प्रारंभिक'
                                                });
                                                setShowInlineMemberCreate(true);
                                                setIsOrderMemberDropdownOpen(false);
                                            }}
                                            className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center space-x-1 cursor-pointer"
                                        >
                                            <UserPlus className="w-3 h-3" />
                                            <span>+ नया स्वयंसेवक बनाएं</span>
                                        </button>
                                    )}
                                </div>

                                {!effectiveOrderShakhaId ? (
                                    <div className="w-full p-2.5 bg-stone-100 border border-stone-200 rounded-lg text-xs text-stone-400 font-medium">
                                        -- पहले ऊपर बस्ती का चयन करें --
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {/* If a member is selected: display compact card */}
                                        {selectedOrderMember ? (
                                            <div className="flex items-center justify-between p-2.5 bg-amber-50 border border-amber-300 rounded-xl">
                                                <div className="flex items-center space-x-2.5 min-w-0">
                                                    <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-xs shrink-0">
                                                        {selectedOrderMember.name.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-0.5">
                                                            <span className="font-bold text-xs text-stone-900 truncate">{selectedOrderMember.name}</span>
                                                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${selectedOrderMember.ganvesh ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}`}>
                                                                {selectedOrderMember.ganvesh ? 'गणवेश युक्त' : 'गणवेश अपेक्षित'}
                                                            </span>
                                                        </div>
                                                        <div className="text-[11px] text-stone-500 flex items-center space-x-2 mt-0.5">
                                                            {selectedOrderMember.mobile ? <span>📱 {selectedOrderMember.mobile}</span> : <span className="italic text-stone-400">फ़ोन नंबर नहीं</span>}
                                                            {selectedOrderMember.shikshan && <span>• {selectedOrderMember.shikshan}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setOrderSwayamsevakId('');
                                                        setOrderMemberSearch('');
                                                        setIsOrderMemberDropdownOpen(true);
                                                    }}
                                                    className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition shrink-0 cursor-pointer"
                                                    title="सदस्य हटाएं / दूसरा चुनें"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            /* Search input + dropdown */
                                            <div className="relative">
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={orderMemberSearch}
                                                        onChange={(e) => {
                                                            setOrderMemberSearch(e.target.value);
                                                            setIsOrderMemberDropdownOpen(true);
                                                        }}
                                                        onFocus={() => setIsOrderMemberDropdownOpen(true)}
                                                        placeholder="नाम या मोबाइल नंबर से खोजें..."
                                                        className="w-full pl-8 pr-8 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500"
                                                    />
                                                    <Search className="w-4 h-4 text-stone-400 absolute left-2.5 top-2.5 pointer-events-none" />
                                                    {orderMemberSearch && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setOrderMemberSearch('')}
                                                            className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Backdrop to close dropdown on click outside */}
                                                {isOrderMemberDropdownOpen && (
                                                    <div
                                                        className="fixed inset-0 z-20"
                                                        onClick={() => setIsOrderMemberDropdownOpen(false)}
                                                    />
                                                )}

                                                {/* Dropdown Results Menu */}
                                                {isOrderMemberDropdownOpen && (
                                                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-300 rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto divide-y divide-stone-100">
                                                        {/* General / None option */}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setOrderSwayamsevakId('');
                                                                setIsOrderMemberDropdownOpen(false);
                                                                setShowInlineMemberCreate(false);
                                                            }}
                                                            className="w-full p-2.5 text-left text-xs font-medium text-stone-600 hover:bg-stone-50 transition flex items-center justify-between cursor-pointer"
                                                        >
                                                            <span>-- कोई नहीं / सामान्य वितरण (वैकल्पिक) --</span>
                                                            <Check className="w-3.5 h-3.5 text-stone-400 opacity-60" />
                                                        </button>

                                                        {/* Filtered members */}
                                                        {filteredOrderMembers.map((m) => (
                                                            <button
                                                                key={m.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setOrderSwayamsevakId(String(m.id));
                                                                    setIsOrderMemberDropdownOpen(false);
                                                                    setShowInlineMemberCreate(false);
                                                                    setOrderMemberSearch('');
                                                                }}
                                                                className="w-full p-2 text-left hover:bg-amber-50/70 transition flex items-center justify-between cursor-pointer"
                                                            >
                                                                <div className="min-w-0 pr-2">
                                                                    <div className="flex items-center space-x-2">
                                                                        <span className="text-xs font-bold text-stone-900 truncate">{m.name}</span>
                                                                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${m.ganvesh ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}`}>
                                                                            {m.ganvesh ? 'युक्त' : 'अपेक्षित'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-[11px] text-stone-500 flex items-center space-x-2 mt-0.5">
                                                                        {m.mobile ? <span>📱 {m.mobile}</span> : <span className="italic text-stone-400">फ़ोन नहीं</span>}
                                                                        {m.shikshan && <span>• {m.shikshan}</span>}
                                                                    </div>
                                                                </div>
                                                                <ChevronRight className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                                                            </button>
                                                        ))}

                                                        {/* When no record found */}
                                                        {filteredOrderMembers.length === 0 && (
                                                            <div className="p-3 text-center bg-stone-50">
                                                                <p className="text-xs text-stone-600 mb-2">
                                                                    "{orderMemberSearch}" नाम या मोबाइल से कोई स्वयंसेवक नहीं मिला।
                                                                </p>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const isDigits = /^\d+$/.test(orderMemberSearch.trim());
                                                                        setInlineMemberForm({
                                                                            name: isDigits ? '' : orderMemberSearch.trim(),
                                                                            mobile: isDigits ? orderMemberSearch.trim() : '',
                                                                            address: '',
                                                                            ganvesh: false,
                                                                            shikshan: 'प्रारंभिक'
                                                                        });
                                                                        setShowInlineMemberCreate(true);
                                                                        setIsOrderMemberDropdownOpen(false);
                                                                    }}
                                                                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                                                                >
                                                                    <UserPlus className="w-3.5 h-3.5" />
                                                                    <span>+ नया स्वयंसेवक बनाएं {orderMemberSearch ? `"${orderMemberSearch}"` : ''}</span>
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* Add member quick action at bottom */}
                                                        {filteredOrderMembers.length > 0 && (
                                                            <div className="p-2 bg-amber-50/50 flex items-center justify-between">
                                                                <span className="text-[11px] text-stone-500">सूची में नाम नहीं है?</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setInlineMemberForm({
                                                                            name: orderMemberSearch.trim(),
                                                                            mobile: '',
                                                                            address: '',
                                                                            ganvesh: false,
                                                                            shikshan: 'प्रारंभिक'
                                                                        });
                                                                        setShowInlineMemberCreate(true);
                                                                        setIsOrderMemberDropdownOpen(false);
                                                                    }}
                                                                    className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center space-x-1 cursor-pointer"
                                                                >
                                                                    <Plus className="w-3 h-3" />
                                                                    <span>+ नया स्वयंसेवक जोड़ें</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* INLINE QUICK SWAYAMSEVAK CREATION FORM */}
                                        {showInlineMemberCreate && (
                                            <div className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50/60 border-2 border-amber-400 rounded-xl shadow-xs">
                                                <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-200">
                                                    <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900">
                                                        <UserPlus className="w-4 h-4 text-amber-700" />
                                                        <span>त्वरित स्वयंसेवक पंजीकरण {currentSelectedShakha ? `(बस्ती: ${currentSelectedShakha.basti_name || currentSelectedShakha.shakha_name})` : ''}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowInlineMemberCreate(false)}
                                                        className="text-stone-400 hover:text-stone-600 p-0.5 rounded cursor-pointer"
                                                        title="बंद करें"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {inlineMemberError && (
                                                    <div className="mb-2 p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-1.5">
                                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                                        <span>{inlineMemberError}</span>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-stone-700 mb-0.5">
                                                            स्वयंसेवक का नाम <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={inlineMemberForm.name}
                                                            onChange={(e) => setInlineMemberForm({ ...inlineMemberForm, name: e.target.value })}
                                                            placeholder="उदा. रमेश शर्मा"
                                                            className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-[11px] font-bold text-stone-700 mb-0.5">
                                                            मोबाइल नंबर (वैकल्पिक)
                                                        </label>
                                                        <input
                                                            type="tel"
                                                            value={inlineMemberForm.mobile}
                                                            onChange={(e) => setInlineMemberForm({ ...inlineMemberForm, mobile: e.target.value })}
                                                            placeholder="10 अंकों का मोबाइल"
                                                            className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-[11px] font-bold text-stone-700 mb-0.5">
                                                            शिक्षण
                                                        </label>
                                                        <select
                                                            value={inlineMemberForm.shikshan}
                                                            onChange={(e) => setInlineMemberForm({ ...inlineMemberForm, shikshan: e.target.value })}
                                                            className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
                                                        >
                                                            {(shikshanOptions && shikshanOptions.length > 0 ? shikshanOptions : ['प्रारंभिक', 'प्राथमिक', 'प्रथम वर्ष', 'द्वितीय वर्ष', 'तृतीय वर्ष']).map((opt) => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="flex items-center pt-4">
                                                        <label className="inline-flex items-center space-x-2 text-xs font-semibold text-stone-700 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={inlineMemberForm.ganvesh}
                                                                onChange={(e) => setInlineMemberForm({ ...inlineMemberForm, ganvesh: e.target.checked })}
                                                                className="w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500 cursor-pointer"
                                                            />
                                                            <span>पूर्व से पूर्ण गणवेश युक्त</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex items-center justify-end space-x-2 pt-2 border-t border-amber-200/60">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowInlineMemberCreate(false)}
                                                        className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-800 font-semibold cursor-pointer"
                                                    >
                                                        रद्द करें
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={inlineMemberSubmitting}
                                                        onClick={handleCreateMemberInline}
                                                        className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                                                    >
                                                        {inlineMemberSubmitting ? (
                                                            <>
                                                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                                <span>सहेजा जा रहा है...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Check className="w-3.5 h-3.5" />
                                                                <span>जोड़ें एवं चयनित करें</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    टिप्पणी / विवरण (वैकल्पिक)
                                </label>
                                <input
                                    type="text"
                                    value={orderNotes}
                                    onChange={(e) => setOrderNotes(e.target.value)}
                                    placeholder="उदा. 38 साइज, विशेष निर्देश"
                                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                                />
                            </div>

                            {/* Address Skipped Notice (Absent in Demand form) */}
                            {selectedProduct.stock > 0 && (
                                <div className="text-[11px] text-stone-500 bg-stone-50 p-2 rounded-lg border border-stone-200">
                                    ℹ️ <strong>डिलीवरी पता छोड़ दिया गया है:</strong> यह ऑर्डर सीधे टोली गणवेश वितरण अंतर्गत इकाई ({unit?.name}) के खाते में दर्ज होगा।
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={selectedProduct.stock > 0 ? orderSubmitting : demandSubmitting}
                                className={`w-full font-bold py-3 rounded-xl text-sm shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                                    selectedProduct.stock > 0
                                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                        : 'bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white'
                                }`}
                            >
                                {selectedProduct.stock > 0 ? (
                                    orderSubmitting ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span>ऑर्डर दर्ज हो रहा है...</span>
                                        </>
                                    ) : (
                                        <span>ऑर्डर सुरक्षित दर्ज करें</span>
                                    )
                                ) : (
                                    demandSubmitting ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span>मांग दर्ज हो रही है...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ClipboardList className="w-4 h-4" />
                                            <span>मांग दर्ज करें</span>
                                        </>
                                    )
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 3. POST-ORDER SUCCESS SCREEN (3 BUTTONS) */}
            {showOrderSuccessModal && placedOrderDetails && (
                <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-emerald-300 overflow-hidden animate-scale-in text-center p-6 space-y-4">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>

                        <div>
                            <h2 className="text-xl font-black text-stone-900">ऑर्डर सफलतापूर्वक दर्ज हुआ!</h2>
                            <p className="text-sm text-stone-600 mt-1">
                                ऑर्डर क्रमांक: <strong className="text-amber-800">#{placedOrderDetails.order_number}</strong>
                            </p>
                        </div>

                        <div className="bg-orange-50/70 p-3 rounded-xl border border-orange-100 text-xs text-left space-y-1">
                            <div className="flex justify-between">
                                <span className="text-stone-500">उत्पाद:</span>
                                <span className="font-bold text-stone-800">{placedOrderDetails.product_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-stone-500">मात्रा:</span>
                                <span className="font-bold text-stone-800">{placedOrderDetails.quantity}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-stone-500">कुल राशि:</span>
                                <span className="font-bold text-amber-900">₹{placedOrderDetails.total_amount}</span>
                            </div>
                            {placedOrderDetails.swayamsevak_name && (
                                <div className="flex justify-between border-t border-orange-200/60 pt-1">
                                    <span className="text-stone-500">अभिप्रेत स्वयंसेवक:</span>
                                    <span className="font-bold text-amber-900">👤 {placedOrderDetails.swayamsevak_name}</span>
                                </div>
                            )}
                        </div>

                        {/* EXACT 3 BUTTONS AS REQUESTED */}
                        <div className="space-y-2 pt-2">
                            {/* Button 1: Main Menu */}
                            <button
                                onClick={() => {
                                    setShowOrderSuccessModal(false);
                                    setActiveTab('members');
                                }}
                                className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-2.5 rounded-xl text-sm transition"
                            >
                                🏠 मुख्य मेन्यू (Main Menu)
                            </button>

                            {/* Button 2: Place Another Order */}
                            <button
                                onClick={() => {
                                    setShowOrderSuccessModal(false);
                                    setActiveTab('distribution');
                                }}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-sm shadow transition"
                            >
                                ➕ दूसरा ऑर्डर करें (Place Another Order)
                            </button>

                            {/* Button 3: View Orders List */}
                            <button
                                onClick={() => {
                                    setShowOrderSuccessModal(false);
                                    setActiveTab('orders');
                                }}
                                className="w-full bg-stone-800 hover:bg-stone-900 text-white font-bold py-2.5 rounded-xl text-sm transition"
                            >
                                📋 सभी ऑर्डर्स देखें (View Orders List)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. PREDEFINED RSS REPORT (वृत्त) MODAL */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-orange-200 overflow-hidden animate-scale-in">
                        <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-4 text-white flex items-center justify-between">
                            <h2 className="text-base font-bold flex items-center space-x-2">
                                <FileText className="w-5 h-5 text-amber-200" />
                                <span>🚩 संघ वृत्त (रिपोर्ट)</span>
                            </h2>
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="text-white/80 hover:text-white p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 font-mono text-xs text-stone-800 whitespace-pre-wrap leading-relaxed select-all">
                                {reportText}
                            </div>

                            <div className="flex space-x-2 pt-1">
                                <button
                                    onClick={() => copyToClipboard(reportText)}
                                    className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition border border-stone-300"
                                >
                                    {copiedReport ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                    <span>{copiedReport ? 'रिपोर्ट कॉपी हो गई!' : '📋 कॉपी करें'}</span>
                                </button>

                                <button
                                    onClick={() => shareToWhatsApp(reportText)}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-1.5 shadow transition"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    <span>🟢 व्हाट्सएप पर भेजें</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. ADD / EDIT SWAYAMSEVAK MODAL */}
            {showMemberModal && (
                <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-orange-200 overflow-hidden animate-scale-in">
                        <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-4 text-white flex items-center justify-between">
                            <h2 className="text-base font-bold flex items-center space-x-2">
                                <Users className="w-5 h-5 text-amber-200" />
                                <span>{editingMember ? 'स्वयंसेवक विवरण संपादित करें' : 'नया स्वयंसेवक जोड़ें'}</span>
                            </h2>
                            <button
                                onClick={() => setShowMemberModal(false)}
                                className="text-white/80 hover:text-white p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveMember} className="p-4 space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    नाम <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={memberForm.name}
                                    onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                                    placeholder="स्वयंसेवक का पूरा नाम"
                                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    मोबाइल नंबर
                                </label>
                                <input
                                    type="tel"
                                    value={memberForm.mobile}
                                    onChange={(e) => setMemberForm({ ...memberForm, mobile: e.target.value })}
                                    placeholder="10 अंकों का मोबाइल नंबर"
                                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    निवास का पता
                                </label>
                                <textarea
                                    rows={2}
                                    value={memberForm.address}
                                    onChange={(e) => setMemberForm({ ...memberForm, address: e.target.value })}
                                    placeholder="मोहल्ला, गली या पूरा पता"
                                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                                />
                            </div>

                            {bastisList.length > 1 && (
                                <div>
                                    <label className="block text-xs font-bold text-stone-700 mb-1">
                                        बस्ती
                                    </label>
                                    <select
                                        value={memberForm.basti_id || memberForm.shakha_id}
                                        onChange={(e) => setMemberForm({ ...memberForm, basti_id: e.target.value, shakha_id: e.target.value })}
                                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                                    >
                                        {bastisList.map((s) => (
                                            <option key={s.id} value={s.id}>{s.basti_name || s.shakha_name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                                    गणवेश उपलब्धता
                                </label>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setMemberForm({ ...memberForm, ganvesh: true })}
                                        className={`p-2 rounded-lg border font-bold transition flex items-center justify-center space-x-1 ${
                                            memberForm.ganvesh
                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-400 ring-2 ring-emerald-300'
                                                : 'bg-stone-50 text-stone-600 border-stone-200'
                                        }`}
                                    >
                                        <span>🟢 हाँ (गणवेश युक्त)</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setMemberForm({ ...memberForm, ganvesh: false })}
                                        className={`p-2 rounded-lg border font-bold transition flex items-center justify-center space-x-1 ${
                                            !memberForm.ganvesh
                                                ? 'bg-amber-100 text-amber-800 border-amber-400 ring-2 ring-amber-300'
                                                : 'bg-stone-50 text-stone-600 border-stone-200'
                                        }`}
                                    >
                                        <span>⚪ नहीं (गणवेश शेष)</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    संघ शिक्षण
                                </label>
                                <select
                                    value={memberForm.shikshan}
                                    onChange={(e) => setMemberForm({ ...memberForm, shikshan: e.target.value })}
                                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                                >
                                    {shikshanOptions.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={memberFormSubmitting}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-sm shadow transition mt-2"
                            >
                                {memberFormSubmitting ? 'सुरक्षित हो रहा है...' : (editingMember ? 'अपडेट करें' : 'सुरक्षित करें')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 6. CSV BULK IMPORT MODAL */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-orange-200 overflow-hidden animate-scale-in">
                        <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-4 text-white flex items-center justify-between">
                            <h2 className="text-base font-bold flex items-center space-x-2">
                                <FileSpreadsheet className="w-5 h-5 text-amber-200" />
                                <span>स्वयंसेवक CSV / एक्सेल आयात</span>
                            </h2>
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="text-white/80 hover:text-white p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleImportSubmit} className="p-4 space-y-3 text-xs">
                            <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 space-y-1">
                                <p className="font-semibold text-stone-800">समर्थित फ़ाइल: CSV या Excel (.xlsx)</p>
                                <p className="text-stone-500 font-mono">कॉलम: name, mobile, address, ganvesh, shikshan</p>
                                <p className="text-amber-800 text-[11px] font-medium bg-amber-50 rounded px-1.5 py-0.5 border border-amber-200/60 inline-block">
                                    ℹ️ पहले से मौजूद मोबाइल नंबर वाले रिकॉर्ड स्वतः छोड़ (skip) दिए जाएंगे।
                                </p>
                                <a
                                    href="/toli/members/template"
                                    download
                                    className="text-amber-700 hover:underline font-bold block pt-1"
                                >
                                    📄 नमूना (Template) फ़ाइल यहाँ से डाउनलोड करें
                                </a>
                            </div>

                            {bastisList.length > 1 ? (
                                <div>
                                    <label className="block text-xs font-bold text-stone-700 mb-1">
                                        लक्षित बस्ती / शाखा
                                    </label>
                                    <select
                                        value={importShakhaId}
                                        onChange={(e) => setImportShakhaId(e.target.value)}
                                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                                        required
                                    >
                                        {bastisList.map((s) => (
                                            <option key={s.id} value={s.id}>{s.basti_name || s.shakha_name}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="bg-amber-50 text-amber-900 border border-amber-200 rounded-lg p-2.5">
                                    <span className="text-stone-600">लक्षित इकाई: </span>
                                    <span className="font-bold">{bastisList[0]?.basti_name || bastisList[0]?.shakha_name || unit?.name || 'वर्तमान इकाई'}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    फ़ाइल चुनें (.csv, .xlsx, .xls)
                                </label>
                                <input
                                    type="file"
                                    accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xls,application/vnd.ms-excel"
                                    onChange={(e) => setImportFile(e.target.files[0] || null)}
                                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={importSubmitting || !importFile}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-sm shadow transition mt-2 cursor-pointer"
                            >
                                {importSubmitting ? 'आयात जारी है...' : 'अपलोड एवं आयात करें'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 7. UPDATE NEW GANVESH MODAL */}
            {showNewGanveshModal && (
                <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3">
                    <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-orange-200 overflow-hidden animate-scale-in">
                        <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-4 text-white flex items-center justify-between">
                            <h2 className="text-base font-bold flex items-center space-x-1.5">
                                <Sparkles className="w-5 h-5 text-amber-200" />
                                <span>नया गणवेश आंकड़ा अपडेट</span>
                            </h2>
                            <button
                                onClick={() => setShowNewGanveshModal(false)}
                                className="text-white/80 hover:text-white p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateNewGanvesh} className="p-4 space-y-3">
                            {!isBasti && bastisList.length > 0 && (
                                <div>
                                    <label className="block text-xs font-bold text-stone-700 mb-1">
                                        बस्ती चुनें
                                    </label>
                                    <select
                                        value={selectedShakhaForNewGanvesh}
                                        onChange={(e) => {
                                            setSelectedShakhaForNewGanvesh(e.target.value);
                                            const matched = bastisList.find((s) => String(s.id) === String(e.target.value));
                                            if (matched) setNewGanveshValue(matched.new_ganvesh ?? 0);
                                        }}
                                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                                    >
                                        {bastisList.map((s) => (
                                            <option key={s.id} value={s.id}>{s.basti_name || s.shakha_name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    नया गणवेश संख्या (संख्या)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={newGanveshValue}
                                    onChange={(e) => setNewGanveshValue(e.target.value)}
                                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-base font-bold text-center focus:ring-2 focus:ring-amber-500"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={newGanveshSubmitting}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-sm shadow transition"
                            >
                                {newGanveshSubmitting ? 'अपडेट जारी है...' : 'नया गणवेश संख्या सहेजें'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 8. ORDER STATUS UPDATE MODAL */}
            {selectedOrderForStatus && (
                <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3">
                    <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-orange-200 overflow-hidden animate-scale-in">
                        <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-4 text-white flex items-center justify-between">
                            <h2 className="text-base font-bold">ऑर्डर स्थिति अपडेट</h2>
                            <button
                                onClick={() => setSelectedOrderForStatus(null)}
                                className="text-white/80 hover:text-white p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateOrderStatus} className="p-4 space-y-3">
                            <p className="text-xs text-stone-600">
                                ऑर्डर क्रमांक: <strong>#{selectedOrderForStatus.order_number}</strong>
                            </p>

                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    नई स्थिति चुनें
                                </label>
                                <select
                                    value={newOrderStatusValue}
                                    onChange={(e) => setNewOrderStatusValue(e.target.value)}
                                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold"
                                >
                                    <option value="paid">🟢 पूर्ण भुगतान (Paid)</option>
                                    <option value="payment_due">🟡 भुगतान बाकी (Payment Due)</option>
                                    <option value="placed">🔵 ऑर्डर दर्ज (Placed)</option>
                                    <option value="completed">🟣 पूर्ण / सुपुर्द (Completed)</option>
                                    <option value="delivered">📦 डिलीवर हुआ (Delivered)</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={statusUpdateSubmitting}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-sm shadow transition"
                            >
                                {statusUpdateSubmitting ? 'अपडेट जारी है...' : 'स्थिति सहेजें'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 9. CANCEL ORDER MODAL */}
            {orderToCancel && (
                <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3">
                    <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-red-200 overflow-hidden animate-scale-in">
                        <div className="bg-red-600 p-4 text-white flex items-center justify-between">
                            <h2 className="text-base font-bold">ऑर्डर रद्द करें</h2>
                            <button
                                onClick={() => setOrderToCancel(null)}
                                className="text-white/80 hover:text-white p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCancelOrder} className="p-4 space-y-3">
                            <p className="text-xs text-stone-600">
                                क्या आप ऑर्डर <strong>#{orderToCancel.order_number}</strong> को रद्द करना चाहते हैं? उत्पाद स्टॉक पुनः गोदाम में जोड़ दिया जाएगा।
                            </p>

                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    रद्द करने का कारण
                                </label>
                                <input
                                    type="text"
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="उदा. गलत आकार चुना गया"
                                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={cancelSubmitting}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-sm shadow transition"
                            >
                                {cancelSubmitting ? 'रद्द हो रहा है...' : 'हाँ, ऑर्डर रद्द करें'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 10. RETURN REQUEST MODAL */}
            {orderToReturn && (
                <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3">
                    <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-amber-200 overflow-hidden animate-scale-in">
                        <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-4 text-white flex items-center justify-between">
                            <h2 className="text-base font-bold">वापसी अनुरोध दर्ज करें</h2>
                            <button
                                onClick={() => setOrderToReturn(null)}
                                className="text-white/80 hover:text-white p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleReturnOrder} className="p-4 space-y-3">
                            <p className="text-xs text-stone-600">
                                ऑर्डर <strong>#{orderToReturn.order_number}</strong>
                            </p>

                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    वापसी का कारण
                                </label>
                                <select
                                    value={returnReason}
                                    onChange={(e) => setReturnReason(e.target.value)}
                                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium"
                                >
                                    <option value="आकार परिवर्तन हेतु">आकार परिवर्तन (Size Exchange)</option>
                                    <option value="दोषपूर्ण उत्पाद">दोषपूर्ण उत्पाद (Defective)</option>
                                    <option value="गलत सामग्री प्राप्त हुई">गलत सामग्री प्राप्त हुई</option>
                                    <option value="अन्य कारण">अन्य कारण</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    अतिरिक्त टिप्पणी (वैकल्पिक)
                                </label>
                                <textarea
                                    rows={2}
                                    value={returnNotes}
                                    onChange={(e) => setReturnNotes(e.target.value)}
                                    placeholder="टिप्पणी दर्ज करें..."
                                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={returnSubmitting}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-sm shadow transition"
                            >
                                {returnSubmitting ? 'अनुरोध दर्ज हो रहा है...' : 'वापसी अनुरोध भेजें'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 11. ENLARGED QR CODE MODAL */}
            {selectedQrUnit && (
                <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-amber-200 overflow-hidden animate-scale-in text-center">
                        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 p-4 text-white flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <QrCode className="w-5 h-5 text-amber-200" />
                                <h2 className="text-base font-bold text-left">टोली पृष्ठ QR कोड</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedQrUnit(null)}
                                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <h3 className="text-lg font-bold text-stone-900">{selectedQrUnit.name}</h3>
                                <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                    {selectedQrUnit.type_hindi || 'उप-इकाई'} टोली पृष्ठ
                                </span>
                            </div>

                            {/* Crisp Enlarged QR Code */}
                            <div className="inline-block p-4 bg-white rounded-2xl border-2 border-amber-200 shadow-md">
                                <QRCodeSVG
                                    id="enlarged-toli-qr-svg"
                                    value={selectedQrUnit.full_url}
                                    size={210}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>

                            <p className="text-xs text-stone-500">
                                इस QR कोड को किसी भी मोबाइल कैमरा या स्कैनर ऐप से स्कैन करके सीधे टोली पृष्ठ खोला जा सकता है।
                            </p>

                            {/* Download QR Image as PNG */}
                            <button
                                type="button"
                                onClick={() => handleDownloadQrImage(selectedQrUnit)}
                                className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-orange-500/20 transition cursor-pointer"
                            >
                                <Download className="w-4 h-4" />
                                <span>QR इमेज डाउनलोड करें (PNG)</span>
                            </button>

                            <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-left">
                                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                                    वेबलिंक (URL)
                                </label>
                                <p className="text-xs font-mono text-stone-800 break-all select-all">
                                    {selectedQrUnit.full_url}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(selectedQrUnit.full_url)}
                                    className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition cursor-pointer"
                                >
                                    <Copy className="w-4 h-4 text-stone-600" />
                                    <span>लिंक कॉपी</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => shareToWhatsApp(`🚩 ${selectedQrUnit.name} (${selectedQrUnit.type_hindi || 'इकाई'}) टोली पृष्ठ:\n${selectedQrUnit.full_url}`)}
                                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-xs transition cursor-pointer"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    <span>व्हाट्सएप</span>
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedQrUnit(null)}
                                className="w-full py-2 text-xs font-semibold text-stone-500 hover:text-stone-700 cursor-pointer"
                            >
                                बंद करें
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
