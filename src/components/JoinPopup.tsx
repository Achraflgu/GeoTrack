import { useState, useEffect } from 'react';
import { X, User, Building2, ChevronRight, ChevronLeft, Phone, Mail, CreditCard, Check, Radio, Plus, Minus, Pencil, Banknote, ShieldCheck, AlertCircle, PackageCheck, Truck, RefreshCw, LogIn, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ordersApi } from '@/lib/api';

interface JoinPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

const SESSION_KEY = 'geotrack_join_session_v2';
const SUBMITTED_KEY = 'geotrack_join_submitted_v2';
const TRACKING_KEY = 'geotrack_user_order';

type GpsType = 'vehicules' | 'personnes' | 'animaux' | 'enfants' | 'objets' | 'motos' | 'camions';
type PlanType = '' | 'starter' | 'pro' | 'enterprise';
type BillingCycle = 'monthly' | 'biannual' | 'annual';

interface GpsAllocation {
    type: GpsType;
    emoji: string;
    label: string;
    count: number;
}

interface FormData {
    usageType: '' | 'personnel' | 'professionnel';
    gpsCount: number;
    gpsAllocation: GpsAllocation[];
    plan: PlanType;
    billingCycle: BillingCycle;
    fullName: string;
    email: string;
    phone: string;
    company: string;
    paymentMethod: '' | 'now' | 'on_order';
    lastStep: number;
}

const defaultAllocation: GpsAllocation[] = [
    { type: 'vehicules', emoji: '🚗', label: 'Véhicules', count: 0 },
    { type: 'personnes', emoji: '👤', label: 'Personnes', count: 0 },
    { type: 'animaux', emoji: '🐕', label: 'Animaux', count: 0 },
    { type: 'enfants', emoji: '👶', label: 'Enfants', count: 0 },
    { type: 'objets', emoji: '🎒', label: 'Objets', count: 0 },
    { type: 'motos', emoji: '🏍️', label: 'Motos', count: 0 },
    { type: 'camions', emoji: '🚛', label: 'Camions', count: 0 },
];

const getDefaultForm = (): FormData => ({
    usageType: '',
    gpsCount: 0,
    gpsAllocation: defaultAllocation.map(a => ({ ...a })),
    plan: '',
    billingCycle: 'monthly',
    fullName: '',
    email: '',
    phone: '',
    company: '',
    paymentMethod: '',
    lastStep: 1,
});

const PLANS = {
    starter: { name: 'Starter', price: 49, maxGps: 5, desc: 'Pour les petites flottes (1 à 5)' },
    pro: { name: 'Pro', price: 39, maxGps: 50, desc: 'Pour les PME en croissance' },
    enterprise: { name: 'Enterprise', price: 0, maxGps: Infinity, desc: 'Pour les flottes > 50 véhicules', isCustom: true },
};

const BILLING_DISCOUNTS = {
    monthly: { label: '1 Mois', discountStr: '', discount: 0, monthsToPay: 1 },
    biannual: { label: '6 Mois', discountStr: '-10%', discount: 0.1, monthsToPay: 6 },
    annual: { label: '12 Mois', discountStr: '-20%', discount: 0.2, monthsToPay: 12 },
};

const DEVICE_HARDWARE_COST = 110; // TND per device (example)
const INSTALLATION_FEE = 40; // TND flat fee for the whole join (example)
const SECURITY_DEPOSIT_MONTHS = 3; // Number of months covered by deposit

const JoinPopup = ({ isOpen, onClose }: JoinPopupProps) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<FormData>(getDefaultForm());
    const [isSubmittedState, setIsSubmittedState] = useState(false);
    const [trackingOrder, setTrackingOrder] = useState<any>(null);

    // Initial check on open
    useEffect(() => {
        if (isOpen) {
            const trackingDataStr = localStorage.getItem(TRACKING_KEY);
            if (trackingDataStr) {
                try {
                    const parsed = JSON.parse(trackingDataStr);
                    setTrackingOrder(parsed);
                    // Dynamically fetch latest
                    ordersApi.track(parsed.ref).then(data => {
                        if (data && data.status) {
                            const updated = { ...parsed, ...data };
                            setTrackingOrder(updated);
                            localStorage.setItem(TRACKING_KEY, JSON.stringify(updated));
                        }
                    }).catch(() => {});
                } catch { /* ignore */ }
                return;
            }

            const hasSubmitted = localStorage.getItem(SUBMITTED_KEY) === 'true';
            if (hasSubmitted) {
                setIsSubmittedState(true);
                return;
            }
            setIsSubmittedState(false);
            try {
                const saved = localStorage.getItem(SESSION_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved) as FormData;
                    if (!parsed.plan) parsed.plan = '';
                    if (!parsed.billingCycle) parsed.billingCycle = 'monthly';
                    setFormData(parsed);
                    setStep(parsed.lastStep || 1);
                }
            } catch { /* ignore */ }
        }
    }, [isOpen]);

    // Save session
    useEffect(() => {
        if (isOpen && !isSubmittedState && !trackingOrder && (formData.usageType || formData.fullName || formData.gpsCount > 0)) {
            localStorage.setItem(SESSION_KEY, JSON.stringify({ ...formData, lastStep: step }));
        }
    }, [formData, step, isOpen, isSubmittedState, trackingOrder]);

    const steps = [
        { num: 1, label: 'Le Projet' },
        { num: 2, label: 'Vos GPS' },
        { num: 3, label: "L'Offre" },
        { num: 4, label: 'Contact' },
        { num: 5, label: 'Facture' },
        { num: 6, label: 'Paiement' },
    ];

    const allocatedTotal = formData.gpsAllocation.reduce((sum, a) => sum + a.count, 0);
    const remaining = formData.gpsCount - allocatedTotal;

    const updateAllocation = (type: GpsType, delta: number) => {
        setFormData(prev => ({
            ...prev,
            gpsAllocation: prev.gpsAllocation.map(a =>
                a.type === type ? { ...a, count: Math.max(0, a.count + delta) } : a
            ),
        }));
    };

    // Auto-select plan based on rules if unset or invalid
    useEffect(() => {
        if (step === 3) {
            if (formData.gpsCount > 50 && formData.plan !== 'enterprise') {
                setFormData(prev => ({ ...prev, plan: 'enterprise' }));
            } else if (formData.gpsCount > 5 && formData.gpsCount <= 50 && formData.plan === 'starter') {
                setFormData(prev => ({ ...prev, plan: 'pro' }));
            }
        }
    }, [step, formData.gpsCount, formData.plan]);

    const canProceed = () => {
        switch (step) {
            case 1: return formData.usageType !== '';
            case 2: return formData.gpsCount > 0 && allocatedTotal === formData.gpsCount;
            case 3: return formData.plan !== '';
            case 4: return !!(formData.fullName && formData.email && formData.phone);
            case 5: return true;
            case 6: return formData.paymentMethod !== '';
            default: return false;
        }
    };

    const handleSubmit = async () => {
        // Send order to backend
        let createdRef = '';
        try {
            const gpsTypes = formData.gpsAllocation
                .filter(a => a.count > 0)
                .map(a => ({ type: a.type, count: a.count }));

            const res = await ordersApi.create({
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                company: formData.company || '',
                usageType: formData.usageType === 'personnel' ? 'personal' : 'professional',
                gpsCount: formData.gpsCount,
                gpsTypes,
                plan: formData.plan,
                billingCycle: formData.billingCycle,
                totalDueToday,
                recurringCost: recurringCostPerCycle,
                paymentMethod: formData.paymentMethod === 'now' ? 'online' : 'on_installation',
                source: 'popup',
            });
            
            createdRef = res.orderRef || (res.data && res.data.orderRef) || '';
        } catch (err) {
            console.warn('[JoinPopup] Order API error:', err);
        }

        localStorage.removeItem(SESSION_KEY);
        
        if (createdRef) {
            const newOrder = { ref: createdRef, email: formData.email, status: 'pending', createdAt: new Date() };
            localStorage.setItem(TRACKING_KEY, JSON.stringify(newOrder));
            setTrackingOrder(newOrder);
        } else {
            localStorage.setItem(SUBMITTED_KEY, 'true');
            setIsSubmittedState(true);
        }
        
        toast.success('Demande envoyée avec succès ! Notre équipe vous contactera sous 24h.', {
            description: formData.paymentMethod === 'now'
                ? 'Vous serez redirigé vers la page de paiement.'
                : 'Votre commande sera préparée et vous pourrez payer à la livraison.'
        });
    };

    const resetFlow = () => {
        localStorage.removeItem(SUBMITTED_KEY);
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(TRACKING_KEY);
        setFormData(getDefaultForm());
        setTrackingOrder(null);
        setStep(1);
        setIsSubmittedState(false);
    };

    const goToStep = (s: number) => setStep(s);

    // Pricing calculation helpers
    const getDiscountedMonthlyPrice = (plan: PlanType, cycle: BillingCycle) => {
        if (!plan || plan === 'enterprise') return 0;
        const basePrice = PLANS[plan].price;
        const discount = BILLING_DISCOUNTS[cycle].discount;
        return basePrice * (1 - discount);
    };

    const baseMonthlyPrice = formData.plan && formData.plan !== 'enterprise' ? PLANS[formData.plan].price : 0;
    const discountedMonthlyPrice = getDiscountedMonthlyPrice(formData.plan, formData.billingCycle);

    const initialHardwareCost = formData.gpsCount * DEVICE_HARDWARE_COST;
    // Standard un-discounted monthly price is used for the security deposit calculation
    const depositCost = formData.gpsCount * baseMonthlyPrice * SECURITY_DEPOSIT_MONTHS;
    const totalDueToday = initialHardwareCost + depositCost + INSTALLATION_FEE;

    const recurringCostPerCycle = formData.gpsCount * discountedMonthlyPrice * BILLING_DISCOUNTS[formData.billingCycle].monthsToPay;

    const renderSubmittedState = () => (
        <DialogContent className="max-w-md p-0 overflow-hidden bg-[#0F1219] border-white/10 rounded-3xl shadow-2xl border-2 [&>button]:hidden">
            <DialogHeader className="sr-only">
                <DialogTitle>Demande Envoyée</DialogTitle>
                <DialogDescription>Votre demande d'abonnement a bien été transmise à notre équipe.</DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0F1219]">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#00E599] flex items-center justify-center">
                        <Check className="w-5 h-5" />
                    </div>
                    <span className="text-white font-bold">Demande Envoyée</span>
                </div>
                <button onClick={onClose} className="text-white/50 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className="p-8 text-center space-y-6">
                <div className="w-24 h-24 mx-auto rounded-full bg-[#00E599]/10 border-2 border-[#00E599]/50 flex items-center justify-center relative">
                    <PackageCheck className="w-12 h-12 text-[#00E599]" />
                    <div className="absolute top-0 right-0 w-6 h-6 rounded-full bg-[#00E599] flex items-center justify-center shadow-[0_0_15px_rgba(0,229,153,0.5)] animate-pulse">
                        <Check className="w-4 h-4 text-black" />
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white mb-2">Requête en cours de traitement</h3>
                    <p className="text-white/50 text-sm leading-relaxed">
                        Notre équipe a bien reçu votre demande. Un conseiller vous contactera très prochainement pour finaliser votre dossier.
                    </p>
                </div>
                <div className="pt-6 border-t border-white/5 space-y-3">
                    <Button className="w-full bg-[#00E599] text-black hover:bg-[#00E599]/90 font-bold rounded-xl h-12" onClick={onClose}>
                        Fermer la fenêtre
                    </Button>
                    <button onClick={resetFlow} className="text-xs text-white/40 hover:text-white transition-colors underline underline-offset-4">
                        Faire une nouvelle demande
                    </button>
                </div>
            </div>
        </DialogContent>
    );

    const renderTrackingState = () => {
        if (!trackingOrder) return null;
        
        const isCancelled = trackingOrder.status === 'cancelled';
        const currentStep = isCancelled ? -1 : 
                           trackingOrder.status === 'active' ? 4 : 
                           trackingOrder.status === 'installing' ? 3 : 
                           trackingOrder.status === 'confirmed' ? 2 : 1;

        const trackingSteps = [
            { num: 1, label: 'En attente', desc: 'Réception de la demande' },
            { num: 2, label: 'Confirmée', desc: 'Validation par l\'équipe' },
            { num: 3, label: 'Installation', desc: 'Pose des équipements' },
            { num: 4, label: 'Activée', desc: 'Accès compte généré' }
        ];

        return (
            <DialogContent className="max-w-xl p-0 overflow-hidden bg-[#0A0D14] border-white/10 rounded-3xl shadow-2xl border-2 [&>button]:hidden">
                <DialogHeader className="sr-only">
                    <DialogTitle>Suivi de commande</DialogTitle>
                    <DialogDescription>Aperçu du statut actuel de votre demande de traceurs en temps réel.</DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-[#0F1219]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#00E599]/10 border border-[#00E599]/30 flex items-center justify-center">
                            <Radio className="w-5 h-5 text-[#00E599]" />
                        </div>
                        <div>
                            <span className="text-white font-bold block">Suivi de commande</span>
                            <span className="text-xs text-white/50 font-medium">Réf: {trackingOrder.ref}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/50 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-8">
                    <div className="bg-[#121620] border border-white/5 rounded-2xl p-6 mb-8 text-center text-sm shadow-inner">
                        <p className="text-white/70">
                            Vous avez déjà une demande d'abonnement en cours chez nous.<br /> 
                            <strong className="text-white">Vous recevrez toutes les informations sur votre email ({trackingOrder.email})</strong>.
                        </p>
                        <p className="text-white/40 mt-3 text-xs flex items-center justify-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" /> En cas de besoin, appelez-nous au +216 71 000 000
                        </p>
                    </div>

                    {isCancelled ? (
                         <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-red-500 mb-2">Commande Annulée</h3>
                            <p className="text-sm text-red-400/80">Votre demande a été annulée. Contactez-nous pour plus d'informations.</p>
                         </div>
                    ) : (
                        <div className="relative pl-6 space-y-8">
                            {/* Vertical Line */}
                            <div className="absolute top-2 bottom-2 left-[2.3rem] w-[2px] bg-white/10 rounded-full" />
                            <div 
                                className="absolute top-2 left-[2.3rem] w-[2px] bg-[#00E599] rounded-full transition-all duration-700 ease-out"
                                style={{ height: currentStep === 1 ? '10%' : currentStep === 2 ? '40%' : currentStep === 3 ? '70%' : '100%' }}
                            />

                            {trackingSteps.map((s, i) => (
                                <div key={s.num} className={`relative flex items-center gap-6 ${currentStep < s.num ? 'opacity-40' : 'opacity-100'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 relative z-10 transition-colors duration-500 ${
                                        currentStep > s.num ? 'bg-[#00E599] text-black shadow-[0_0_15px_rgba(0,229,153,0.3)]' : 
                                        currentStep === s.num ? 'bg-[#121620] border-2 border-[#00E599] text-[#00E599] shadow-[0_0_20px_rgba(0,229,153,0.2)]' : 
                                        'bg-[#121620] border-2 border-white/20 text-white/50'
                                    }`}>
                                        {currentStep > s.num ? <Check className="w-4 h-4" /> : s.num}
                                    </div>
                                    <div>
                                        <h4 className={`text-base font-bold ${currentStep >= s.num ? 'text-white' : 'text-white/50'}`}>{s.label}</h4>
                                        <p className="text-xs text-white/40 mt-0.5">{s.desc}</p>
                                    </div>
                                    {currentStep === s.num && (
                                        <div className="absolute -right-4 top-1/2 -translate-y-1/2 text-[10px] bg-[#00E599]/10 text-[#00E599] px-3 py-1 rounded-full font-bold animate-pulse uppercase tracking-wider hidden sm:block">
                                            En cours
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-t border-white/5 px-6 py-5 bg-[#0F1219] flex items-center justify-between">
                    <button onClick={resetFlow} className="text-xs text-white/40 hover:text-white transition-colors underline underline-offset-4">
                        Annuler mon suivi local
                    </button>
                    {trackingOrder.status === 'active' && (
                        <Button className="bg-[#00E599] text-black font-bold h-9 px-6 rounded-full" onClick={() => window.location.href = '/login'}>
                            Accéder à la plateforme
                        </Button>
                    )}
                </div>
            </DialogContent>
        );
    };

    if (trackingOrder) {
        return (
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                {renderTrackingState()}
            </Dialog>
        );
    }

    if (isSubmittedState) {
        return (
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                {renderSubmittedState()}
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-[#0F1219] border-white/10 rounded-3xl shadow-2xl border-2 flex flex-col max-h-[90vh] gap-0 [&>button]:hidden">
                <DialogHeader className="sr-only">
                    <DialogTitle>Rejoindre GeoTrack</DialogTitle>
                </DialogHeader>

                {/* Custom Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0 bg-[#0F1219]">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#00E599] flex items-center justify-center">
                            <Radio className="w-4 h-4 text-black" />
                        </div>
                        <span className="text-white font-bold">Rejoindre GeoTrack</span>
                    </div>
                    <button onClick={onClose} className="text-white/50 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="px-6 py-5 border-b border-white/5 shrink-0 bg-[#0F1219] overflow-x-auto scrollbar-none">
                    <div className="flex items-center justify-between min-w-[600px] max-w-3xl mx-auto relative px-8">
                        <div className="absolute top-5 left-12 right-12 h-[2px] bg-white/10 z-0" />
                        <div
                            className="absolute top-5 left-12 h-[2px] bg-[#00E599] z-0 transition-all duration-500"
                            style={{ width: `${((step - 1) / 5) * (100 - 15)}%`, maxWidth: 'calc(100% - 3rem)' }}
                        />
                        {steps.map((s) => (
                            <div key={s.num} className="flex flex-col items-center gap-2 relative z-10 w-16">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${s.num < step ? 'bg-[#00E599] text-black' :
                                    s.num === step ? 'bg-[#00E599] text-black shadow-[0_0_15px_rgba(0,229,153,0.3)]' :
                                        'bg-[#1A1F2B] text-white/50 border border-white/10'
                                    }`}>
                                    {s.num < step ? <Check className="w-5 h-5" /> : s.num}
                                </div>
                                <span className={`text-[10px] whitespace-nowrap font-medium text-center ${s.num <= step ? 'text-white/90' : 'text-white/40'}`}>
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#0F1219]">
                    {/* Step 1: Usage Type */}
                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center">
                                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Comment allez-vous utiliser GeoTrack ?</h2>
                                <p className="text-white/50 text-sm">Sélectionnez le type d'usage pour adapter notre offre.</p>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4 max-w-lg mx-auto">
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, usageType: 'personnel' }))}
                                    className={`flex flex-col items-center text-center p-8 rounded-2xl border transition-all group ${formData.usageType === 'personnel' ? 'bg-[#00E599]/10 border-[#00E599] shadow-[0_0_20px_rgba(0,229,153,0.1)]' : 'bg-[#121620] border-white/5 hover:border-[#00E599]/30'}`}
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${formData.usageType === 'personnel' ? 'bg-[#00E599]/20 text-[#00E599]' : 'bg-white/5 text-white/60 group-hover:text-[#00E599]'}`}>
                                        <User className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1">Usage Personnel</h3>
                                    <p className="text-xs text-white/40">Pour mon véhicule privé ou ma famille</p>
                                </button>
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, usageType: 'professionnel' }))}
                                    className={`flex flex-col items-center text-center p-8 rounded-2xl border transition-all group ${formData.usageType === 'professionnel' ? 'bg-[#00E599]/10 border-[#00E599] shadow-[0_0_20px_rgba(0,229,153,0.1)]' : 'bg-[#121620] border-white/5 hover:border-[#00E599]/30'}`}
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${formData.usageType === 'professionnel' ? 'bg-[#00E599]/20 text-[#00E599]' : 'bg-white/5 text-white/60 group-hover:text-[#00E599]'}`}>
                                        <Building2 className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1">Professionnel</h3>
                                    <p className="text-xs text-white/40">Pour la flotte de mon entreprise</p>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: GPS Count & Type Allocation */}
                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-white mb-2">Combien de GPS allez-vous utiliser ?</h2>
                                <p className="text-white/50 text-sm">Choisissez le nombre total puis répartissez par type.</p>
                            </div>
                            <div className="max-w-xl mx-auto space-y-6">
                                {/* Total GPS Counter */}
                                <div className="bg-[#121620] border border-white/5 rounded-2xl p-6 text-center shadow-inner">
                                    <label className="block text-sm font-medium text-white/70 mb-4">Nombre total de GPS</label>
                                    <div className="flex items-center justify-center gap-6">
                                        <button
                                            onClick={() => setFormData(prev => ({ ...prev, gpsCount: Math.max(0, prev.gpsCount - 1) }))}
                                            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-[#00E599]/10 hover:text-[#00E599] hover:border-[#00E599]/30 transition-all"
                                        >
                                            <Minus className="w-5 h-5" />
                                        </button>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.gpsCount || ''}
                                            onChange={(e) => {
                                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                                setFormData(prev => ({ ...prev, gpsCount: val }));
                                            }}
                                            placeholder="0"
                                            className="text-5xl font-extrabold text-[#00E599] tabular-nums w-24 text-center bg-transparent border-none outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <button
                                            onClick={() => setFormData(prev => ({ ...prev, gpsCount: prev.gpsCount + 1 }))}
                                            className="w-12 h-12 rounded-full bg-[#00E599]/10 border border-[#00E599]/30 flex items-center justify-center text-[#00E599] hover:bg-[#00E599]/20 transition-all shadow-[0_0_15px_rgba(0,229,153,0.2)]"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Type Allocation */}
                                {formData.gpsCount > 0 && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2">
                                        <div className="flex items-center justify-between mb-3 px-1">
                                            <label className="text-sm font-medium text-white/70">Répartition par type</label>
                                            <span className={`text-xs font-bold px-3 py-1 rounded-full border transition-all ${remaining === 0 ? 'bg-[#00E599]/10 border-[#00E599]/50 text-[#00E599]' : remaining < 0 ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-orange-500/10 border-orange-500/50 text-orange-400'}`}>
                                                {remaining === 0 ? '✓ Complet' : remaining > 0 ? `${remaining} restant${remaining > 1 ? 's' : ''}` : `${Math.abs(remaining)} en trop`}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {formData.gpsAllocation.map((item) => (
                                                <div
                                                    key={item.type}
                                                    className={`rounded-xl border p-3 flex flex-col justify-between transition-all ${item.count > 0
                                                        ? 'bg-[#00E599]/5 border-[#00E599]/30 shadow-sm'
                                                        : 'bg-[#121620] border-white/5 hover:border-white/10'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="text-lg">{item.emoji}</span>
                                                        <span className="text-xs font-semibold text-white/80">{item.label}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between bg-black/20 rounded-lg p-1">
                                                        <button
                                                            onClick={() => updateAllocation(item.type, -1)}
                                                            disabled={item.count === 0}
                                                            className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/20 disabled:opacity-30 transition-all"
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={item.count || ''}
                                                            onChange={(e) => {
                                                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    gpsAllocation: prev.gpsAllocation.map(a =>
                                                                        a.type === item.type ? { ...a, count: val } : a
                                                                    ),
                                                                }));
                                                            }}
                                                            placeholder="0"
                                                            className={`text-sm font-bold tabular-nums w-8 text-center bg-transparent border-none outline-none p-0 focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${item.count > 0 ? 'text-[#00E599]' : 'text-white/40'}`}
                                                        />
                                                        <button
                                                            onClick={() => updateAllocation(item.type, 1)}
                                                            disabled={remaining <= 0}
                                                            className="w-6 h-6 rounded-md bg-[#00E599]/10 flex items-center justify-center text-[#00E599] hover:bg-[#00E599]/30 disabled:opacity-30 transition-all"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Plan Selection (L'Offre) */}
                    {step === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-white mb-2">Choisissez votre offre</h2>
                                <p className="text-white/50 text-sm">Une offre transparente adaptée à vos {formData.gpsCount} traceurs.</p>
                            </div>

                            {/* Billing Cycle Selector - Fixed at Top */}
                            <div className="flex justify-center mb-8">
                                <div className="bg-[#121620] p-1.5 rounded-2xl border border-white/10 flex items-center relative">
                                    {(['monthly', 'biannual', 'annual'] as BillingCycle[]).map((cycle) => (
                                        <button
                                            key={cycle}
                                            onClick={() => setFormData(prev => ({ ...prev, billingCycle: cycle }))}
                                            className={`relative px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 z-10 ${formData.billingCycle === cycle ? 'text-black shadow-md' : 'text-white/50 hover:text-white'}`}
                                        >
                                            {BILLING_DISCOUNTS[cycle].label}
                                            {BILLING_DISCOUNTS[cycle].discount > 0 && (
                                                <span className={`absolute -top-2 -right-2 text-[9px] font-black px-1.5 py-0.5 rounded-full ${formData.billingCycle === cycle ? 'bg-black text-[#00E599]' : 'bg-[#00E599] text-black'} shadow-sm`}>
                                                    {BILLING_DISCOUNTS[cycle].discountStr}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                    {/* Active background pill */}
                                    <div
                                        className="absolute bg-[#00E599] top-1.5 bottom-1.5 rounded-xl transition-all duration-300 ease-out z-0"
                                        style={{
                                            left: formData.billingCycle === 'monthly' ? '0.375rem' : formData.billingCycle === 'biannual' ? '33.3%' : '66.6%',
                                            width: '33.3%',
                                            transform: formData.billingCycle === 'monthly' ? 'none' : formData.billingCycle === 'biannual' ? 'translateX(0)' : 'translateX(-0.375rem)'
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                                {/* Starter Plan */}
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, plan: 'starter' }))}
                                    disabled={formData.gpsCount > 5}
                                    className={`relative text-left p-6 rounded-2xl border transition-all flex flex-col h-full ${formData.gpsCount > 5 ? 'opacity-40 cursor-not-allowed bg-[#121620]/50 border-white/5' :
                                        formData.plan === 'starter' ? 'bg-[#00E599]/10 border-[#00E599] shadow-[0_0_20px_rgba(0,229,153,0.15)] ring-1 ring-[#00E599]' :
                                            'bg-[#121620] border-white/10 hover:border-white/20 hover:bg-white/5'}`}
                                >
                                    {formData.plan === 'starter' && <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#00E599] flex items-center justify-center"><Check className="w-4 h-4 text-black" /></div>}
                                    <h3 className="text-xl font-bold text-white mb-1">Starter</h3>
                                    <p className="text-xs text-white/50 mb-6">{PLANS.starter.desc}</p>
                                    <div className="mb-6 flex-1 flex flex-col justify-end">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-white">{getDiscountedMonthlyPrice('starter', formData.billingCycle).toFixed(0)}</span>
                                            <span className="text-sm font-medium text-white/40">TND/mois/v.</span>
                                        </div>
                                        {formData.billingCycle !== 'monthly' && (
                                            <span className="text-xs text-white/30 line-through mt-1">{PLANS.starter.price} TND</span>
                                        )}
                                    </div>
                                    <div className="space-y-3 pt-6 border-t border-white/10">
                                        <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00E599]" /><span className="text-xs text-white/70">Jusqu'à 5 appareils</span></div>
                                        <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00E599]" /><span className="text-xs text-white/70">Historique 30 jours</span></div>
                                        <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00E599]" /><span className="text-xs text-white/70">Alertes e-mail</span></div>
                                    </div>
                                    {formData.gpsCount > 5 && (
                                        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 backdrop-blur-[2px]">
                                            <div className="bg-[#1A1F2B] px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold text-white/70 shadow-xl flex items-center gap-2">
                                                <AlertCircle className="w-3.5 h-3.5 text-orange-400" /> Max 5 GPS
                                            </div>
                                        </div>
                                    )}
                                </button>

                                {/* Pro Plan */}
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, plan: 'pro' }))}
                                    disabled={formData.gpsCount > 50}
                                    className={`relative text-left p-6 rounded-2xl border transition-all flex flex-col h-full transform ${formData.gpsCount > 50 ? 'opacity-40 cursor-not-allowed bg-[#121620]/50 border-white/5' :
                                        formData.plan === 'pro' ? 'bg-gradient-to-b from-[#00E599]/10 to-[#00E599]/5 border-[#00E599] shadow-[0_0_30px_rgba(0,229,153,0.2)] ring-1 ring-[#00E599] md:-translate-y-2' :
                                            'bg-[#121620] border-white/10 hover:border-white/20 hover:bg-white/5'}`}
                                >
                                    <div className="absolute -top-3 inset-x-0 flex justify-center">
                                        <span className="bg-[#00E599] text-black text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-lg">Populaire</span>
                                    </div>
                                    {formData.plan === 'pro' && <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#00E599] flex items-center justify-center"><Check className="w-4 h-4 text-black" /></div>}
                                    <h3 className="text-xl font-bold text-white mb-1">Pro</h3>
                                    <p className="text-xs text-white/50 mb-6">{PLANS.pro.desc}</p>
                                    <div className="mb-6 flex-1 flex flex-col justify-end">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-5xl font-black text-[#00E599]">{getDiscountedMonthlyPrice('pro', formData.billingCycle).toFixed(0)}</span>
                                            <span className="text-sm font-medium text-white/40">TND/mois/v.</span>
                                        </div>
                                        {formData.billingCycle !== 'monthly' && (
                                            <span className="text-xs text-white/30 line-through mt-1">{PLANS.pro.price} TND</span>
                                        )}
                                    </div>
                                    <div className="space-y-3 pt-6 border-t border-white/10">
                                        <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00E599]" /><span className="text-xs text-white font-medium">Jusqu'à 50 appareils</span></div>
                                        <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00E599]" /><span className="text-xs text-white font-medium">Historique 90 jours</span></div>
                                        <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00E599]" /><span className="text-xs text-white font-medium">API Intégrations</span></div>
                                        <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00E599]" /><span className="text-xs text-white font-medium">Rapports exportables</span></div>
                                    </div>
                                    {formData.gpsCount > 50 && (
                                        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 backdrop-blur-[2px]">
                                            <div className="bg-[#1A1F2B] px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold text-white/70 shadow-xl flex items-center gap-2">
                                                <AlertCircle className="w-3.5 h-3.5 text-orange-400" /> Max 50 GPS
                                            </div>
                                        </div>
                                    )}
                                </button>

                                {/* Enterprise Plan */}
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, plan: 'enterprise' }))}
                                    className={`relative text-left p-6 rounded-2xl border transition-all flex flex-col h-full ${formData.plan === 'enterprise' ? 'bg-[#00E599]/10 border-[#00E599] shadow-[0_0_20px_rgba(0,229,153,0.15)] ring-1 ring-[#00E599]' : 'bg-[#121620] border-white/10 hover:border-white/20 hover:bg-white/5'}`}
                                >
                                    {formData.plan === 'enterprise' && <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#00E599] flex items-center justify-center"><Check className="w-4 h-4 text-black" /></div>}
                                    <h3 className="text-xl font-bold text-white mb-1">Enterprise</h3>
                                    <p className="text-xs text-white/50 mb-6">{PLANS.enterprise.desc}</p>
                                    <div className="mb-6 flex-1 flex flex-col justify-end">
                                        <span className="text-3xl font-black text-white">Sur devis</span>
                                    </div>
                                    <div className="space-y-3 pt-6 border-t border-white/10">
                                        <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00E599]" /><span className="text-xs text-white/70">Appareils illimités</span></div>
                                        <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00E599]" /><span className="text-xs text-white/70">Marque blanche (API)</span></div>
                                        <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00E599]" /><span className="text-xs text-white/70">Serveur exclusif</span></div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Contact */}
                    {step === 4 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-white mb-2">Vos coordonnées</h2>
                                <p className="text-white/50 text-sm">Comment pouvons-nous vous contacter ?</p>
                            </div>
                            <div className="max-w-xl mx-auto space-y-5">
                                <div className="grid md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-semibold text-white/70 mb-2 uppercase tracking-wide">Nom complet *</label>
                                        <input type="text" value={formData.fullName} onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))} placeholder="Votre nom" className="w-full bg-[#121620] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00E599]/50 focus:ring-1 focus:ring-[#00E599]/50 transition-all font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-white/70 mb-2 uppercase tracking-wide">Entreprise</label>
                                        <input type="text" value={formData.company} onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))} placeholder="Nom de l'entreprise" className="w-full bg-[#121620] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00E599]/50 focus:ring-1 focus:ring-[#00E599]/50 transition-all font-medium" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-white/70 mb-2 uppercase tracking-wide">Email *</label>
                                    <div className="relative">
                                        <Mail className="absolute top-[14px] left-4 w-4 h-4 text-white/30" />
                                        <input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="votre@email.com" className="w-full bg-[#121620] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00E599]/50 focus:ring-1 focus:ring-[#00E599]/50 transition-all font-medium" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-white/70 mb-2 uppercase tracking-wide">Téléphone *</label>
                                    <div className="relative">
                                        <Phone className="absolute top-[14px] left-4 w-4 h-4 text-white/30" />
                                        <input type="tel" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder="+216 XX XXX XXX" className="w-full bg-[#121620] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00E599]/50 focus:ring-1 focus:ring-[#00E599]/50 transition-all font-medium" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Facture / Confirmation */}
                    {step === 5 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-white mb-2">Devis Initial & Engagement</h2>
                                <p className="text-white/50 text-sm">Vérifiez les détails de l'installation et votre abonnement.</p>
                            </div>
                            <div className="max-w-2xl mx-auto grid md:grid-cols-5 gap-4">
                                {/* Left Column: Client Summary */}
                                <div className="md:col-span-2 space-y-4">
                                    <div className="bg-[#121620] border border-white/5 rounded-2xl p-5 relative group">
                                        <button onClick={() => goToStep(4)} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:text-[#00E599] hover:bg-[#00E599]/10 transition-all opacity-0 group-hover:opacity-100">
                                            <Pencil className="w-3 h-3" />
                                        </button>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                                <User className="w-4 h-4 text-white/50" />
                                            </div>
                                            <div>
                                                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1">Informations Client</h3>
                                                <p className="text-xs font-semibold text-white capitalize">{formData.usageType}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 text-sm mt-4 border-t border-white/5 pt-4">
                                            <p className="text-white font-bold">{formData.fullName}</p>
                                            <p className="text-white/60 text-xs">{formData.email}</p>
                                            <p className="text-white/60 text-xs">{formData.phone}</p>
                                            {formData.company && <p className="text-[#00E599] text-xs font-medium mt-1">{formData.company}</p>}
                                        </div>
                                    </div>

                                    {/* Selected Cycle info */}
                                    <div className="bg-[#121620] border border-white/5 rounded-2xl p-4 flex items-start gap-3 relative group">
                                        <button onClick={() => goToStep(3)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:text-[#00E599] hover:bg-[#00E599]/10 transition-all opacity-0 group-hover:opacity-100">
                                            <Pencil className="w-3 h-3" />
                                        </button>
                                        <RefreshCw className="w-5 h-5 text-[#00E599] mt-0.5 shrink-0" />
                                        <div>
                                            <h3 className="text-xs font-bold text-white">Facturation {BILLING_DISCOUNTS[formData.billingCycle].label}</h3>
                                            {formData.billingCycle !== 'monthly' && (
                                                <p className="text-[10px] text-[#00E599] font-medium mt-1 tracking-wide uppercase">Vous économisez {BILLING_DISCOUNTS[formData.billingCycle].discountStr}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Detailed Invoice */}
                                <div className="md:col-span-3 bg-gradient-to-br from-[#121620] to-[#0A0D14] border border-white/10 rounded-2xl p-6 relative shadow-xl overflow-hidden">
                                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-5 flex items-center gap-2">
                                        <Banknote className="w-4 h-4" /> Détail du Paiement Initial
                                    </h3>

                                    {formData.plan !== 'enterprise' ? (
                                        <>
                                            {/* Hardware Cost Line */}
                                            <div className="flex justify-between items-start mb-3 group relative">
                                                <button onClick={() => goToStep(2)} className="absolute top-1 right-12 w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:text-[#00E599] hover:bg-[#00E599]/10 transition-all opacity-0 group-hover:opacity-100">
                                                    <Pencil className="w-3 h-3" />
                                                </button>
                                                <div>
                                                    <p className="text-sm font-semibold text-white mb-0.5 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-white/50" /> Traceurs GPS</p>
                                                    <p className="text-[10px] text-white/40">{formData.gpsCount}x Traçeurs GPS sans fil</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-white">{initialHardwareCost} TND</p>
                                                </div>
                                            </div>

                                            {/* Installation Line */}
                                            <div className="flex justify-between items-start mb-3 group relative">
                                                <div>
                                                    <p className="text-sm font-semibold text-white mb-0.5 flex items-center gap-1.5"><PackageCheck className="w-3.5 h-3.5 text-white/50" /> Frais d'Installation</p>
                                                    <p className="text-[10px] text-white/40">Activation & Pose sur site (Frais Unique)</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-white">{INSTALLATION_FEE} TND</p>
                                                </div>
                                            </div>

                                            {/* Delivery Line */}
                                            <div className="flex justify-between items-start mb-3 group relative">
                                                <div>
                                                    <p className="text-sm font-semibold text-white mb-0.5 flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-white/50" /> Frais de Livraison</p>
                                                    <p className="text-[10px] text-white/40">Partout en Tunisie</p>
                                                </div>
                                                <div className="text-right flex items-center h-full pt-1">
                                                    <span className="bg-[#00E599]/10 text-[#00E599] text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border border-[#00E599]/20">Gratuit</span>
                                                </div>
                                            </div>

                                            {/* Security Deposit Line */}
                                            <div className="flex justify-between items-start pb-4 border-b border-white/5 mb-4 group relative">
                                                <button onClick={() => goToStep(3)} className="absolute top-1 right-12 w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:text-[#00E599] hover:bg-[#00E599]/10 transition-all opacity-0 group-hover:opacity-100">
                                                    <Pencil className="w-3 h-3" />
                                                </button>
                                                <div className="pr-4">
                                                    <p className="text-sm font-semibold text-white mb-0.5 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-white/50" /> Dépôt de garantie</p>
                                                    <p className="text-[10px] text-white/40 leading-relaxed">Couvre les {SECURITY_DEPOSIT_MONTHS} premiers mois d'abonnement au forfait {PLANS[formData.plan].name}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-sm font-bold text-white">{depositCost} TND</p>
                                                </div>
                                            </div>

                                            {/* Total Due Today */}
                                            <div className="flex justify-between items-end pt-2 pb-5 border-b border-white/5 border-dashed mb-5">
                                                <div>
                                                    <p className="text-sm text-white font-bold mb-0.5">Total à payer aujourd'hui</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-4xl font-black text-[#00E599]">{totalDueToday}</span>
                                                        <span className="text-sm font-bold text-white/60">TND</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Recurring Future Warning */}
                                            <div className="bg-[#00E599]/10 rounded-lg p-3 flex gap-3 items-start border border-[#00E599]/20">
                                                <RefreshCw className="w-4 h-4 text-[#00E599] shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-xs font-bold text-[#00E599] mb-1">Prélèvement Récurrent</p>
                                                    <p className="text-[10px] text-white/70">
                                                        Dans {SECURITY_DEPOSIT_MONTHS} mois, votre abonnement sera renouvelé ({BILLING_DISCOUNTS[formData.billingCycle].label}) au tarif de <strong className="text-white">{recurringCostPerCycle.toFixed(0)} TND / {formData.billingCycle === 'monthly' ? 'mois' : formData.billingCycle === 'biannual' ? '6 mois' : 'an'}</strong>.
                                                    </p>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        // Enterprise Custom Flow
                                        <div className="text-center py-6">
                                            <Building2 className="w-12 h-12 text-[#00E599] mx-auto mb-4 opacity-50" />
                                            <h4 className="text-lg font-bold text-white mb-2">Offre Sur Mesure</h4>
                                            <p className="text-white/60 text-xs leading-relaxed max-w-[200px] mx-auto">
                                                Pour {formData.gpsCount} traceurs, un conseiller expert préparera un devis détaillé avec des tarifs préférentiels.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 6: Payment */}
                    {step === 6 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-white mb-2">Mode de paiement</h2>
                                <p className="text-white/50 text-sm">Comment souhaitez-vous régler vos initiales ?</p>
                            </div>
                            <div className="max-w-lg mx-auto space-y-4">
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'now' }))}
                                    className={`w-full flex items-center gap-5 p-6 rounded-2xl text-left transition-all relative overflow-hidden ${formData.paymentMethod === 'now' ? 'bg-[#00E599]/10 border-2 border-[#00E599] shadow-[0_0_25px_rgba(0,229,153,0.1)]' : 'bg-[#121620] border-2 border-white/5 hover:border-[#00E599]/20 group'}`}
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${formData.paymentMethod === 'now' ? 'bg-[#00E599] text-black shadow-lg' : 'bg-white/5 text-white/50 group-hover:text-white'}`}>
                                        <CreditCard className="w-7 h-7" />
                                    </div>
                                    <div className="flex-1 relative z-10">
                                        <p className="text-base font-bold text-white">Payer en ligne</p>
                                        <p className="text-xs text-white/40 mt-1.5 flex items-center gap-2">
                                            <ShieldCheck className="w-3.5 h-3.5 text-[#00E599]" /> Paiement sécurisé (Visa, Mastercard)
                                        </p>
                                    </div>
                                    {formData.paymentMethod === 'now' && <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#00E599] flex items-center justify-center"><Check className="w-4 h-4 text-black" /></div>}
                                </button>

                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'on_order' }))}
                                    className={`w-full flex items-center gap-5 p-6 rounded-2xl text-left transition-all relative overflow-hidden ${formData.paymentMethod === 'on_order' ? 'bg-[#00E599]/10 border-2 border-[#00E599] shadow-[0_0_25px_rgba(0,229,153,0.1)]' : 'bg-[#121620] border-2 border-white/5 hover:border-[#00E599]/20 group'}`}
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${formData.paymentMethod === 'on_order' ? 'bg-[#00E599] text-black shadow-lg' : 'bg-white/5 text-white/50 group-hover:text-white'}`}>
                                        <Banknote className="w-7 h-7" />
                                    </div>
                                    <div className="flex-1 relative z-10">
                                        <div className="flex items-center gap-2">
                                            <div className="flex flex-col">
                                                <p className="text-base font-bold text-white">Payer à l'installation</p>
                                                {formData.plan !== 'enterprise' && (
                                                    <p className="text-[10px] text-[#00E599] font-bold tracking-wide uppercase mt-1">Montant à prévoir : {totalDueToday} TND</p>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-white/40 mt-1.5">Espèces ou chèque lors de notre intervention</p>
                                    </div>
                                    {formData.paymentMethod === 'on_order' && <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#00E599] flex items-center justify-center"><Check className="w-4 h-4 text-black" /></div>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-white/5 px-6 py-4 flex items-center justify-between shrink-0 bg-[#0A0D14]">
                    <div>
                        {step > 1 && (
                            <Button variant="outline" className="bg-transparent border-white/10 text-white/70 hover:bg-white/5 rounded-full text-sm px-5" onClick={() => setStep(step - 1)}>
                                <ChevronLeft className="w-4 h-4 mr-1" /> Retour
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Étape {step} sur 6</span>
                        </div>
                        {step < 6 ? (
                            <Button className="bg-[#00E599] text-black hover:bg-[#00E599]/90 font-bold rounded-full text-sm px-6 h-10 disabled:opacity-40" disabled={!canProceed()} onClick={() => setStep(step + 1)}>
                                Continuer <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        ) : (
                            <Button className="bg-[#00E599] text-black hover:bg-[#00E599]/90 font-bold rounded-full text-sm px-8 h-10 disabled:opacity-40" disabled={!canProceed()} onClick={handleSubmit}>
                                Finaliser <Check className="w-4 h-4 ml-1" />
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default JoinPopup;
