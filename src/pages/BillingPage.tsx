import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/lib/store';
import { billingApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    CreditCard, Crown, Zap, Check, X, ArrowRight, Sparkles,
    Shield, MapPin, Bot, Bell, Radio, Settings, MessageSquare,
    LayoutDashboard, Receipt, Clock, ChevronDown, ChevronUp,
    Hexagon, CalendarDays, Banknote, Building2, ArrowUpRight,
    FileText, Download, RefreshCw, Star, Lock
} from 'lucide-react';

interface Payment {
    _id: string;
    invoiceRef: string;
    plan: string;
    previousPlan: string;
    amount: number;
    billingCycle: string;
    status: string;
    method: string;
    dueDate: string;
    paidAt: string;
    description: string;
    createdAt: string;
}

const PLAN_PRICING = {
    starter: { monthly: 29, biannual: 156, annual: 278 },
    pro: { monthly: 39, biannual: 210, annual: 374 },
};

const BillingPage = () => {
    const { user } = useAuthStore();
    const { lang } = useI18n();
    const isFr = lang === 'fr';

    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [planInfo, setPlanInfo] = useState<any>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'biannual' | 'annual'>('monthly');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [upgrading, setUpgrading] = useState(false);
    const [expandedPayment, setExpandedPayment] = useState<string | null>(null);

    const userPlan = (user as any)?.plan || 'starter';
    const isStarter = userPlan === 'starter';
    const isPro = userPlan === 'pro' || userPlan === 'enterprise';

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            if (user?.id) {
                const [payData, planData] = await Promise.all([
                    billingApi.getPayments(user.id),
                    billingApi.getCurrentPlan(user.id)
                ]);
                setPayments(payData);
                setPlanInfo(planData);
                
                // Keep local auth store in sync with real billing status
                if (planData && user && planData.billingStatus !== (user as any).billingStatus) {
                    useAuthStore.setState({ 
                        user: { 
                            ...user, 
                            billingStatus: planData.billingStatus, 
                            billingNextDue: planData.billingNextDue 
                        } as any 
                    });
                }
            }
        } catch (err) {
            console.error('Failed to fetch payments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async () => {
        if (!paymentMethod) {
            toast.error(isFr ? 'Choisissez un mode de paiement' : 'Choose a payment method');
            return;
        }
        setUpgrading(true);
        try {
            const result = await billingApi.requestUpgrade({
                userId: user!.id,
                targetPlan: 'pro',
                billingCycle,
                method: paymentMethod,
            });
            if (result.success) {
                // Update user plan in auth store
                useAuthStore.getState().updateProfile({ plan: 'pro' } as any);
                toast.success(
                    isFr ? '🎉 Félicitations! Vous êtes maintenant sur le plan Pro!' : '🎉 Congratulations! You are now on the Pro plan!',
                    { duration: 5000 }
                );
                setShowUpgradeModal(false);
                fetchPayments();
            }
        } catch (err: any) {
            toast.error(err.message || 'Upgrade failed');
        } finally {
            setUpgrading(false);
        }
    };

    const handleCancelPlan = async () => {
        if (!confirm(isFr ? 'Êtes-vous sûr de vouloir annuler votre abonnement Pro ?' : 'Are you sure you want to cancel your Pro subscription?')) return;
        try {
            await billingApi.cancelPlan(user!.id);
            toast.success(isFr ? 'Abonnement pro sera annulé à la fin de la période' : 'Pro subscription will be cancelled at period end');
            fetchPayments();
        } catch (err: any) {
            toast.error(err.message || 'Cancel failed');
        }
    };

    const handleResumePlan = async () => {
        try {
            await billingApi.resumePlan(user!.id);
            toast.success(isFr ? 'Abonnement Pro réactivé' : 'Pro subscription resumed');
            fetchPayments();
        } catch (err: any) {
            toast.error(err.message || 'Resume failed');
        }
    };

    const handleRemoveMethod = async () => {
        if (!confirm(isFr ? 'Supprimer ce mode de paiement ?' : 'Remove this payment method?')) return;
        try {
            await billingApi.removeMethod(user!.id);
            toast.success(isFr ? 'Mode de paiement supprimé' : 'Payment method removed');
            fetchPayments();
        } catch (err: any) {
            toast.error(err.message || 'Remove failed');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string; text: string; dot: string; label: string }> = {
            paid: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400', label: isFr ? 'Payé' : 'Paid' },
            pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400', label: isFr ? 'En attente' : 'Pending' },
            overdue: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400', label: isFr ? 'En retard' : 'Overdue' },
            refunded: { bg: 'bg-gray-500/10', text: 'text-gray-400', dot: 'bg-gray-400', label: isFr ? 'Remboursé' : 'Refunded' },
            cancelled: { bg: 'bg-gray-500/10', text: 'text-gray-400', dot: 'bg-gray-400', label: isFr ? 'Annulé' : 'Cancelled' },
        };
        const s = styles[status] || styles.pending;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                {s.label}
            </span>
        );
    };

    const getMethodLabel = (method: string) => {
        const labels: Record<string, string> = {
            d17: 'D17',
            mastercard: 'Mastercard',
            bank_transfer: isFr ? 'Virement Bancaire' : 'Bank Transfer',
        };
        return labels[method] || method;
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    // Feature comparison
    const features = [
        { name: isFr ? 'Tableau de bord' : 'Dashboard', icon: LayoutDashboard, starter: true, pro: true },
        { name: isFr ? 'Carte temps réel' : 'Real-Time Map', icon: MapPin, starter: true, pro: true },
        { name: isFr ? 'Appareils GPS' : 'GPS Devices', icon: Radio, starter: true, pro: true },
        { name: isFr ? 'Alertes' : 'Alerts', icon: Bell, starter: true, pro: true },
        { name: 'Support', icon: MessageSquare, starter: true, pro: true },
        { name: isFr ? 'Paramètres' : 'Settings', icon: Settings, starter: true, pro: true },
        { name: isFr ? 'Zones GPS (Geofences)' : 'GPS Zones (Geofences)', icon: Hexagon, starter: false, pro: true },
        { name: isFr ? 'Assistant IA GeoTrack' : 'GeoTrack AI Assistant', icon: Bot, starter: false, pro: true },
        { name: isFr ? 'Historique 90 jours' : '90 Days History', icon: Clock, starter: false, pro: true },
        { name: isFr ? 'Rapports avancés' : 'Advanced Reports', icon: FileText, starter: false, pro: true },
    ];

    const paymentMethods = [
        { id: 'd17', name: 'D17', desc: isFr ? 'Paiement mobile D17' : 'D17 Mobile Payment', icon: '📱', color: 'from-blue-500 to-cyan-500' },
        { id: 'mastercard', name: 'Mastercard', desc: isFr ? 'Carte bancaire' : 'Bank Card', icon: '💳', color: 'from-orange-500 to-red-500' },
        { id: 'bank_transfer', name: isFr ? 'Virement' : 'Transfer', desc: isFr ? 'Virement bancaire' : 'Bank Transfer', icon: '🏦', color: 'from-emerald-500 to-teal-500' },
    ];

    const proPrice = billingCycle === 'annual' ? PLAN_PRICING.pro.annual : billingCycle === 'biannual' ? PLAN_PRICING.pro.biannual : PLAN_PRICING.pro.monthly;
    
    let monthlyEquiv = PLAN_PRICING.pro.monthly;
    if (billingCycle === 'annual') monthlyEquiv = Math.round((PLAN_PRICING.pro.annual / 12) * 10) / 10;
    if (billingCycle === 'biannual') monthlyEquiv = Math.round((PLAN_PRICING.pro.biannual / 6) * 10) / 10;

    let savingsPercent = 0;
    if (billingCycle === 'annual') savingsPercent = Math.round((1 - PLAN_PRICING.pro.annual / (PLAN_PRICING.pro.monthly * 12)) * 100);
    if (billingCycle === 'biannual') savingsPercent = Math.round((1 - PLAN_PRICING.pro.biannual / (PLAN_PRICING.pro.monthly * 6)) * 100);

    return (
        <DashboardLayout>
            <div className="h-screen flex flex-col overflow-hidden">
                {/* Header */}
                <header className="px-6 py-4 border-b border-border/50 bg-card/50 backdrop-blur-sm shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-[#00E599]" />
                                {isFr ? 'Facturation & Abonnement' : 'Billing & Subscription'}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {isFr ? 'Gérez votre plan et suivez vos paiements' : 'Manage your plan and track your payments'}
                            </p>
                        </div>
                        <Badge className={`px-3 py-1.5 text-sm font-bold ${isPro ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0' : 'bg-[#00E599]/10 text-[#00E599] border-[#00E599]/20'}`}>
                            {isPro ? <Crown className="w-3.5 h-3.5 mr-1.5" /> : <Zap className="w-3.5 h-3.5 mr-1.5" />}
                            {userPlan.toUpperCase()}
                        </Badge>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="max-w-5xl mx-auto space-y-6">

                        {/* ── Suspended Banner ──────────────────────── */}
                        {planInfo?.billingStatus === 'suspended' && (
                            <div className="rounded-2xl bg-red-500/10 border-2 border-red-500/30 p-6 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in duration-300">
                                <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center shrink-0">
                                    <Lock className="w-7 h-7 text-red-400" />
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                    <h3 className="font-bold text-red-400 text-lg">{isFr ? '⛔ Compte suspendu' : '⛔ Account Suspended'}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {isFr
                                            ? 'Votre accès est limité. Contactez l\'administration au +216 71 000 000 pour régulariser votre paiement et réactiver votre compte.'
                                            : 'Your access is restricted. Contact administration at +216 71 000 000 to settle your payment and reactivate your account.'}
                                    </p>
                                </div>
                                <Button 
                                    variant="outline" 
                                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 shrink-0"
                                    onClick={fetchPayments}
                                    disabled={loading}
                                >
                                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                    {isFr ? 'Vérifier le statut' : 'Check Status'}
                                </Button>
                            </div>
                        )}

                        {/* ── Warning Banner ───────────────────────── */}
                        {planInfo?.billingStatus === 'warning' && (
                            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-5 flex items-center gap-4 animate-in fade-in duration-300">
                                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 animate-pulse">
                                    <Bell className="w-6 h-6 text-amber-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-amber-400">
                                        {isFr ? '⚠️ Paiement bientôt dû' : '⚠️ Payment Due Soon'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        {isFr
                                            ? `Votre paiement arrive à échéance le ${planInfo?.billingNextDue ? new Date(planInfo.billingNextDue).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}. Veuillez régulariser pour éviter la suspension de votre compte.`
                                            : `Your payment is due on ${planInfo?.billingNextDue ? new Date(planInfo.billingNextDue).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}. Please settle to avoid account suspension.`}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ── Current Plan Hero ────────────────────────── */}
                        <div className={`relative overflow-hidden rounded-2xl border ${isPro ? 'border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-card to-orange-500/5' : 'border-[#00E599]/20 bg-gradient-to-br from-[#00E599]/5 via-card to-emerald-500/5'}`}>
                            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: isPro ? 'radial-gradient(circle, #f59e0b, transparent)' : 'radial-gradient(circle, #00E599, transparent)' }} />
                            <div className="relative p-8">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isPro ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-[#00E599] to-emerald-600'}`}>
                                                {isPro ? <Crown className="w-6 h-6 text-white" /> : <Zap className="w-6 h-6 text-white" />}
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold">
                                                    {isFr ? 'Plan' : 'Plan'} {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}
                                                </h2>
                                                <p className="text-sm text-muted-foreground">
                                                    {isPro
                                                        ? (isFr ? 'Toutes les fonctionnalités débloquées' : 'All features unlocked')
                                                        : (isFr ? 'Plan de base — mettez à niveau pour débloquer plus' : 'Basic plan — upgrade to unlock more')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-baseline gap-1 mt-4">
                                            <span className="text-4xl font-black">
                                                {isPro ? PLAN_PRICING.pro.monthly : PLAN_PRICING.starter.monthly}
                                            </span>
                                            <span className="text-lg text-muted-foreground font-medium">TND</span>
                                            <span className="text-sm text-muted-foreground">/{isFr ? 'mois' : 'mo'}</span>
                                        </div>

                                        {payments.length > 0 && payments[0].dueDate && (
                                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                                                <CalendarDays className="w-3.5 h-3.5" />
                                                {isFr ? 'Prochaine échéance:' : 'Next due:'} {formatDate(payments[0].dueDate)}
                                            </p>
                                        )}
                                    </div>

                                    {isStarter ? (
                                        <Button
                                            onClick={() => setShowUpgradeModal(true)}
                                            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all gap-2 px-6 h-12 text-sm font-bold"
                                        >
                                            <Crown className="w-4 h-4" />
                                            {isFr ? 'Passer au Pro' : 'Upgrade to Pro'}
                                            <ArrowUpRight className="w-4 h-4" />
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => setShowUpgradeModal(true)}
                                            variant="outline"
                                            className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 transition-all gap-2 px-6 h-12 text-sm font-bold"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            {isFr ? 'Modifier le cycle' : 'Change plan cycle'}
                                        </Button>
                                    )}
                                </div>

                                {/* Cancel at period end banner */}
                                {planInfo && planInfo.cancelAtPeriodEnd && (
                                    <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        {isFr 
                                            ? `Votre plan basculera vers le plan Starter le ${formatDate(planInfo.nextDueDate)}` 
                                            : `Your plan will downgrade to Starter on ${formatDate(planInfo.nextDueDate)}`}
                                    </div>
                                )}

                                {/* Active payment method & cancellation info */}
                                {planInfo && (planInfo.savedPaymentMethod || isPro) && (
                                    <div className="mt-6 pt-6 border-t border-border/50 flex flex-wrap items-center justify-between gap-4">
                                        {planInfo.savedPaymentMethod && (
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-card/60 flex items-center justify-center border border-border">
                                                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">{isFr ? 'Mode de paiement actif' : 'Active payment method'}</p>
                                                    <p className="font-semibold text-sm">{getMethodLabel(planInfo.savedPaymentMethod)}</p>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={handleRemoveMethod} className="ml-2 text-destructive hover:bg-destructive/10">
                                                    {isFr ? 'Retirer' : 'Remove'}
                                                </Button>
                                            </div>
                                        )}

                                        {isPro && (
                                            planInfo.cancelAtPeriodEnd ? (
                                                <Button variant="outline" size="sm" onClick={handleResumePlan} className="text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10 ml-auto gap-2">
                                                    <RefreshCw className="w-3.5 h-3.5" />
                                                    {isFr ? 'Réactiver l\'abonnement' : 'Resume Subscription'}
                                                </Button>
                                            ) : (
                                                <Button variant="outline" size="sm" onClick={handleCancelPlan} className="text-destructive border-destructive/20 hover:bg-destructive/10 ml-auto">
                                                    {isFr ? 'Annuler l\'abonnement' : 'Cancel Subscription'}
                                                </Button>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Plan Comparison ──────────────────────────── */}
                        <div className="rounded-2xl border border-border bg-card overflow-hidden">
                            <div className="p-5 border-b border-border">
                                <h3 className="font-bold flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    {isFr ? 'Comparaison des plans' : 'Plan Comparison'}
                                </h3>
                            </div>

                            {/* Table header */}
                            <div className="grid grid-cols-[1fr_140px_140px] px-5 py-3 bg-muted/30 border-b border-border text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                <span>{isFr ? 'Fonctionnalité' : 'Feature'}</span>
                                <span className="text-center">Starter</span>
                                <span className="text-center bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Pro</span>
                            </div>

                            {/* Pricing row */}
                            <div className="grid grid-cols-[1fr_140px_140px] px-5 py-3 border-b border-border/50 items-center">
                                <span className="text-sm font-semibold flex items-center gap-2">
                                    <Banknote className="w-4 h-4 text-muted-foreground" />
                                    {isFr ? 'Prix mensuel' : 'Monthly Price'}
                                </span>
                                <span className="text-center font-bold text-lg">29 <span className="text-xs text-muted-foreground font-normal">TND</span></span>
                                <span className="text-center font-bold text-lg text-amber-500">39 <span className="text-xs text-muted-foreground font-normal">TND</span></span>
                            </div>

                            {/* Feature rows */}
                            {features.map((feature, i) => (
                                <div key={i} className={`grid grid-cols-[1fr_140px_140px] px-5 py-3 items-center ${i < features.length - 1 ? 'border-b border-border/30' : ''} ${!feature.starter && !isPro ? 'bg-amber-500/[0.02]' : ''}`}>
                                    <span className="text-sm flex items-center gap-2.5">
                                        <feature.icon className={`w-4 h-4 ${feature.starter ? 'text-muted-foreground' : 'text-amber-500'}`} />
                                        {feature.name}
                                        {!feature.starter && (
                                            <Badge className="text-[9px] px-1.5 py-0 bg-amber-500/10 text-amber-500 border-amber-500/20">PRO</Badge>
                                        )}
                                    </span>
                                    <span className="flex justify-center">
                                        {feature.starter
                                            ? <Check className="w-5 h-5 text-[#00E599]" />
                                            : <Lock className="w-4 h-4 text-muted-foreground/30" />}
                                    </span>
                                    <span className="flex justify-center">
                                        <Check className="w-5 h-5 text-amber-500" />
                                    </span>
                                </div>
                            ))}

                            {/* CTA row */}
                            {isStarter && (
                                <div className="px-5 py-4 bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-t border-amber-500/10">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            {isFr ? '🚀 Passez au Pro pour seulement +10 TND/mois' : '🚀 Upgrade to Pro for only +10 TND/month'}
                                        </p>
                                        <Button size="sm" onClick={() => setShowUpgradeModal(true)}
                                            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 gap-1.5">
                                            <Crown className="w-3.5 h-3.5" />
                                            {isFr ? 'Passer au Pro' : 'Upgrade'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Payment History ─────────────────────────── */}
                        <div className="rounded-2xl border border-border bg-card overflow-hidden">
                            <div className="p-5 border-b border-border flex items-center justify-between">
                                <h3 className="font-bold flex items-center gap-2">
                                    <Receipt className="w-4 h-4 text-[#00E599]" />
                                    {isFr ? 'Historique des paiements' : 'Payment History'}
                                </h3>
                                <Button variant="ghost" size="sm" onClick={fetchPayments} className="gap-1.5 text-xs">
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    {isFr ? 'Actualiser' : 'Refresh'}
                                </Button>
                            </div>

                            {loading ? (
                                <div className="p-12 flex items-center justify-center">
                                    <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                                </div>
                            ) : payments.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Receipt className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {isFr ? 'Aucun paiement enregistré' : 'No payments recorded'}
                                    </p>
                                    <p className="text-xs text-muted-foreground/60 mt-1">
                                        {isFr ? 'Vos factures apparaîtront ici' : 'Your invoices will appear here'}
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/40">
                                    {payments.map(payment => (
                                        <div key={payment._id} className="group">
                                            <button
                                                onClick={() => setExpandedPayment(expandedPayment === payment._id ? null : payment._id)}
                                                className="w-full px-5 py-4 flex items-center gap-4 hover:bg-muted/20 transition-colors"
                                            >
                                                {/* Invoice icon */}
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                    payment.status === 'paid' ? 'bg-emerald-500/10' :
                                                    payment.status === 'overdue' ? 'bg-red-500/10' : 'bg-amber-500/10'
                                                }`}>
                                                    <FileText className={`w-5 h-5 ${
                                                        payment.status === 'paid' ? 'text-emerald-400' :
                                                        payment.status === 'overdue' ? 'text-red-400' : 'text-amber-400'
                                                    }`} />
                                                </div>

                                                {/* Details */}
                                                <div className="flex-1 text-left min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-sm font-semibold">{payment.invoiceRef}</span>
                                                        <Badge className="text-[9px] px-1.5 py-0 bg-muted/50 text-muted-foreground border-border">
                                                            {payment.plan.toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {formatDate(payment.createdAt)} • {getMethodLabel(payment.method)} • {payment.billingCycle === 'annual' ? (isFr ? 'Annuel' : 'Annual') : (isFr ? 'Mensuel' : 'Monthly')}
                                                    </p>
                                                </div>

                                                {/* Amount */}
                                                <div className="text-right shrink-0">
                                                    <span className="font-bold text-lg">{payment.amount}</span>
                                                    <span className="text-xs text-muted-foreground ml-1">TND</span>
                                                </div>

                                                {/* Status */}
                                                <div className="shrink-0">
                                                    {getStatusBadge(payment.status)}
                                                </div>

                                                {/* Expand */}
                                                <div className="shrink-0">
                                                    {expandedPayment === payment._id
                                                        ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                                        : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                                </div>
                                            </button>

                                            {/* Expanded details */}
                                            {expandedPayment === payment._id && (
                                                <div className="px-5 pb-4 pt-0 bg-muted/10 animate-in slide-in-from-top-2">
                                                    <div className="ml-14 grid grid-cols-2 gap-4 text-xs">
                                                        <div>
                                                            <span className="text-muted-foreground">{isFr ? 'Description' : 'Description'}</span>
                                                            <p className="font-medium mt-0.5">{payment.description || '—'}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">{isFr ? 'Échéance' : 'Due Date'}</span>
                                                            <p className="font-medium mt-0.5">{formatDate(payment.dueDate)}</p>
                                                        </div>
                                                        {payment.paidAt && (
                                                            <div>
                                                                <span className="text-muted-foreground">{isFr ? 'Payé le' : 'Paid On'}</span>
                                                                <p className="font-medium mt-0.5">{formatDate(payment.paidAt)}</p>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <span className="text-muted-foreground">{isFr ? 'Plan précédent' : 'Previous Plan'}</span>
                                                            <p className="font-medium mt-0.5">{payment.previousPlan || '—'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            {/* ── Upgrade Modal ──────────────────────────────── */}
            {showUpgradeModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowUpgradeModal(false)} />

                    {/* Modal */}
                    <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in">
                        {/* Header glow */}
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />

                        <div className="relative p-6 space-y-6">
                            {/* Title */}
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
                                    <Crown className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold">
                                    {isPro
                                        ? (isFr ? 'Modifier votre cycle d\'abonnement' : 'Change your billing cycle')
                                        : (isFr ? 'Passer au Plan Pro' : 'Upgrade to Pro Plan')}
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {isPro
                                        ? (isFr ? 'Choisissez un nouveau cycle ou mode de paiement.' : 'Choose a new cycle or payment method.')
                                        : (isFr ? 'Débloquez toutes les fonctionnalités premium' : 'Unlock all premium features')}
                                </p>
                            </div>

                            {/* Billing cycle toggle */}
                            <div className="flex items-center justify-center gap-1 p-1 rounded-xl bg-muted/30 border border-border overflow-hidden">
                                <button
                                    onClick={() => setBillingCycle('monthly')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${billingCycle === 'monthly' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    {isFr ? 'Mensuel' : 'Monthly'}
                                </button>
                                <button
                                    onClick={() => setBillingCycle('biannual')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all relative ${billingCycle === 'biannual' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    {isFr ? '6 Mois' : '6 Months'}
                                    <Badge className="absolute -top-1.5 right-0 text-[8px] px-1 py-0 h-3 bg-[#00E599] text-black border-0">
                                        -10%
                                    </Badge>
                                </button>
                                <button
                                    onClick={() => setBillingCycle('annual')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all relative ${billingCycle === 'annual' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    {isFr ? '12 Mois' : '12 Months'}
                                    <Badge className="absolute -top-1.5 right-0 text-[8px] px-1 py-0 h-3 bg-[#00E599] text-black border-0">
                                        -20%
                                    </Badge>
                                </button>
                            </div>

                            {/* Price display */}
                            <div className="text-center py-2">
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-5xl font-black bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                                        {proPrice}
                                    </span>
                                    <span className="text-lg text-muted-foreground font-medium">TND</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {billingCycle === 'monthly'
                                        ? (isFr ? 'Facturation mensuelle' : 'Billed monthly')
                                        : billingCycle === 'biannual'
                                        ? `≈ ${monthlyEquiv} TND/${isFr ? 'mois' : 'mo'} • ${isFr ? 'Économisez' : 'Save'} ${(39 * 6) - PLAN_PRICING.pro.biannual} TND/6mo`
                                        : `≈ ${monthlyEquiv} TND/${isFr ? 'mois' : 'mo'} • ${isFr ? 'Économisez' : 'Save'} ${(39 * 12) - PLAN_PRICING.pro.annual} TND/${isFr ? 'an' : 'yr'}`}
                                </p>
                            </div>

                            {/* Pro features unlock - Hide if already Pro */}
                            {!isPro && (
                                <div className="bg-muted/20 rounded-xl p-4 space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                                        {isFr ? '✨ Fonctionnalités débloquées' : '✨ Features unlocked'}
                                    </p>
                                    {features.filter(f => !f.starter).map((f, i) => (
                                        <div key={i} className="flex items-center gap-2.5 text-sm">
                                            <Check className="w-4 h-4 text-amber-500 shrink-0" />
                                            <f.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                            <span>{f.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Payment method */}
                            <div className="space-y-3">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    {isFr ? '💳 Mode de paiement' : '💳 Payment Method'}
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    {paymentMethods.map(pm => (
                                        <button
                                            key={pm.id}
                                            onClick={() => setPaymentMethod(pm.id)}
                                            className={`p-3 rounded-xl border-2 transition-all text-center ${
                                                paymentMethod === pm.id
                                                    ? 'border-amber-500 bg-amber-500/5 shadow-md shadow-amber-500/10'
                                                    : 'border-border hover:border-border/80 bg-card'
                                            }`}
                                        >
                                            <span className="text-2xl block mb-1">{pm.icon}</span>
                                            <span className="text-xs font-bold block">{pm.name}</span>
                                            <span className="text-[10px] text-muted-foreground block mt-0.5">{pm.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" className="flex-1 h-12" onClick={() => setShowUpgradeModal(false)}>
                                    {isFr ? 'Annuler' : 'Cancel'}
                                </Button>
                                <Button
                                    onClick={handleUpgrade}
                                    disabled={!paymentMethod || upgrading}
                                    className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg shadow-amber-500/20 font-bold gap-2"
                                >
                                    {upgrading ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Crown className="w-4 h-4" />
                                            {isPro
                                                ? (isFr ? `Mettre à jour — ${proPrice} TND` : `Update — ${proPrice} TND`)
                                                : (isFr ? `Confirmer — ${proPrice} TND` : `Confirm — ${proPrice} TND`)}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default BillingPage;
