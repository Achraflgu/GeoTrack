import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ordersApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    ShoppingCart, Search, Filter, Clock, CheckCircle2, Truck, Zap,
    XCircle, Eye, X, MessageSquare, Bot, User as UserIcon, Package,
    ArrowRight, RefreshCw, ChevronDown, Calendar, Mail, Phone, Building2, AlertCircle, Plus, PackagePlus
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    pending: { label: 'En attente', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20', icon: Clock },
    confirmed: { label: 'Confirmée', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', icon: CheckCircle2 },
    installing: { label: 'Installation', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20', icon: Truck },
    active: { label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', icon: Zap },
    cancelled: { label: 'Annulée', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20', icon: XCircle },
};

const SOURCE_BADGE: Record<string, { label: string; icon: any; color: string }> = {
    popup:          { label: 'Formulaire',     icon: Package,     color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' },
    manual:         { label: 'Ajout Manuel',   icon: Phone,       color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
    client_upgrade: { label: 'Upgrade Client', icon: PackagePlus, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
};

const PLAN_LABELS: Record<string, string> = { starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise' };
const CYCLE_LABELS: Record<string, string> = { monthly: 'Mensuel', biannual: '6 Mois', annual: 'Annuel' };

const OrdersPage = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processResult, setProcessResult] = useState<any>(null);
    const [isPrefixModalOpen, setIsPrefixModalOpen] = useState(false);
    const [prefixes, setPrefixes] = useState({ operator: 'Telecom', sim: '', serie: '', imei: '' });
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', action: '', orderId: '' });
    const [newOrder, setNewOrder] = useState({
        fullName: '', phone: '', email: '', company: '',
        gpsCount: 1, plan: 'starter', billingCycle: 'monthly',
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [ordersData, statsData] = await Promise.all([
                ordersApi.getAll({ status: statusFilter !== 'all' ? statusFilter : undefined, source: sourceFilter !== 'all' ? sourceFilter : undefined, search: search || undefined }),
                ordersApi.getStats(),
            ]);
            setOrders(ordersData);
            setStats(statsData);
        } catch (err: any) {
            toast.error('Erreur de chargement', { description: err.message });
        } finally {
            setLoading(false);
        }
    }, [statusFilter, sourceFilter, search]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            await ordersApi.updateStatus(orderId, { status: newStatus });
            toast.success(`Statut mis à jour : ${STATUS_CONFIG[newStatus]?.label}`);
            fetchData();
            if (selectedOrder?._id === orderId) {
                setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
            }
        } catch (err: any) {
            toast.error('Erreur', { description: err.message });
        }
    };

    const handleSaveNotes = async (orderId: string) => {
        try {
            await ordersApi.updateStatus(orderId, { adminNotes });
            toast.success('Notes sauvegardées');
            fetchData();
        } catch (err: any) {
            toast.error('Erreur', { description: err.message });
        }
    };

    const handleDelete = async (orderId: string) => {
        if (!confirm('Supprimer cette commande ?')) return;
        try {
            await ordersApi.delete(orderId);
            toast.success('Commande supprimée');
            setSelectedOrder(null);
            fetchData();
        } catch (err: any) {
            toast.error('Erreur', { description: err.message });
        }
    };

    const handleAddOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Determine costs dynamically
            const monthlyPrice = newOrder.plan === 'starter' ? 49 : newOrder.plan === 'pro' ? 39 : 30; // 30 is fallback for enterprise
            let recurringCost = newOrder.gpsCount * monthlyPrice;
            if (newOrder.billingCycle === 'biannual') recurringCost *= 0.9;
            if (newOrder.billingCycle === 'annual') recurringCost *= 0.8;

            const totalDueToday = (newOrder.gpsCount * 110) + 40 + (recurringCost * 3);

            await ordersApi.create({
                ...newOrder,
                gpsTypes: [{ type: 'véhicules', count: newOrder.gpsCount }],
                totalDueToday: Math.round(totalDueToday),
                recurringCost: Math.round(recurringCost),
                source: 'manual',
                paymentMethod: 'on_installation'
            });
            toast.success('Nouvelle commande ajoutée avec succès !');
            setIsAddModalOpen(false);
            setNewOrder({ fullName: '', phone: '', email: '', company: '', gpsCount: 1, plan: 'starter', billingCycle: 'monthly' });
            fetchData();
        } catch (err: any) {
            toast.error('Erreur lors de la création', { description: err.message || 'Une erreur est survenue' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getNextStatus = (current: string): string | null => {
        const flow: Record<string, string> = { pending: 'confirmed', confirmed: 'installing', installing: 'active' };
        return flow[current] || null;
    };

    const handleProcessOrder = async (orderId: string) => {
        setIsPrefixModalOpen(false);
        setIsProcessing(true);
        setProcessResult(null);
        try {
            const result = await ordersApi.process(orderId, prefixes);
            setProcessResult(result);
            toast.success('✅ Commande activée avec succès!');
            fetchData();
        } catch (err: any) {
            toast.error('Erreur de traitement', { description: err.message });
            setIsProcessing(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                {/* Page Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <ShoppingCart className="w-7 h-7 text-[#00E599]" />
                        Gestion des Commandes
                    </h1>
                    <p className="text-sm text-muted-foreground">Gérez les demandes reçues via le chatbot IA et le formulaire de contact.</p>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                        { label: 'Total', value: stats.total || 0, icon: ShoppingCart, color: 'text-white', bg: 'bg-white/5 border-white/10' },
                        { label: 'En attente', value: stats.pending || 0, icon: Clock, color: 'text-orange-400', bg: 'bg-orange-400/5 border-orange-400/10' },
                        { label: 'Confirmées', value: stats.confirmed || 0, icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-400/5 border-blue-400/10' },
                        { label: 'Installation', value: stats.installing || 0, icon: Truck, color: 'text-purple-400', bg: 'bg-purple-400/5 border-purple-400/10' },
                        { label: 'Actives', value: stats.active || 0, icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-400/5 border-emerald-400/10' },
                        { label: 'Annulées', value: stats.cancelled || 0, icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/5 border-red-400/10' },
                    ].map(s => (
                        <div key={s.label} className={`rounded-xl border ${s.bg} p-4 flex items-center gap-3`}>
                            <s.icon className={`w-5 h-5 ${s.color}`} />
                            <div>
                                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                                <p className="text-xs text-muted-foreground">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px] max-w-[350px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom, email, référence..."
                            className="pl-9 bg-card border-border" />
                    </div>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                        className="h-10 px-3 rounded-md bg-card border border-border text-sm text-foreground">
                        <option value="all">Tous les statuts</option>
                        {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                            <option key={key} value={key}>{val.label}</option>
                        ))}
                    </select>
                    <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
                        className="h-10 px-3 rounded-md bg-card border border-border text-sm text-foreground">
                        <option value="all">Toutes les sources</option>
                        <option value="popup">Formulaire (nouveau client)</option>
                        <option value="manual">Saisie Manuelle</option>
                        <option value="client_upgrade">Upgrade Client</option>
                    </select>
                    <Button onClick={fetchData} variant="outline" size="sm" className="gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5" /> Actualiser
                    </Button>
                    <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="gap-1.5 bg-[#00E599] text-black hover:bg-[#00E599]/90 ml-auto">
                        <Plus className="w-4 h-4" /> Nouvelle Commande
                    </Button>
                </div>

                {/* Orders Table */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/30 border-b border-border">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Réf.</th>
                                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
                                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">GPS</th>
                                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Total</th>
                                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Source</th>
                                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">
                                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" /> Chargement...
                                    </td></tr>
                                ) : orders.length === 0 ? (
                                    <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">
                                        <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        Aucune commande trouvée
                                    </td></tr>
                                ) : orders.map(order => {
                                    const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                                    const StatusIcon = statusCfg.icon;
                                    const sourceCfg = SOURCE_BADGE[order.source] || SOURCE_BADGE.popup;
                                    const SourceIcon = sourceCfg.icon;
                                    return (
                                        <tr key={order._id} className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                                            onClick={() => { setSelectedOrder(order); setAdminNotes(order.adminNotes || ''); }}>
                                            <td className="px-4 py-3 font-mono text-xs text-[#00E599]">{order.orderRef}</td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-foreground">{order.fullName}</p>
                                                <p className="text-xs text-muted-foreground">{order.email}</p>
                                            </td>
                                            <td className="px-4 py-3 font-semibold">{order.gpsCount}</td>
                                            <td className="px-4 py-3 text-xs">{PLAN_LABELS[order.plan] || order.plan}</td>
                                            <td className="px-4 py-3 font-bold text-[#00E599]">{order.totalDueToday} TND</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sourceCfg.color}`}>
                                                    <SourceIcon className="w-3 h-3" /> {sourceCfg.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusCfg.bg} ${statusCfg.color}`}>
                                                    <StatusIcon className="w-3 h-3" /> {statusCfg.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground">
                                                {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                    <Eye className="w-3.5 h-3.5" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Order Detail Panel (Slide-over) */}
                {selectedOrder && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedOrder(null)} />
                        <div className="relative w-full max-w-lg bg-card border-l border-border h-full overflow-y-auto animate-in slide-in-from-right">
                            {/* Detail Header */}
                            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
                                <div>
                                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                        <ShoppingCart className="w-5 h-5 text-[#00E599]" />
                                        {selectedOrder.orderRef}
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(selectedOrder.createdAt).toLocaleString('fr-FR')}
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Status & Source */}
                                <div className="flex items-center gap-3">
                                    {(() => {
                                        const sc = STATUS_CONFIG[selectedOrder.status] || STATUS_CONFIG.pending;
                                        const SI = sc.icon;
                                        return <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${sc.bg} ${sc.color}`}>
                                            <SI className="w-3.5 h-3.5" /> {sc.label}
                                        </span>;
                                    })()}
                                    {(() => {
                                        const src = SOURCE_BADGE[selectedOrder.source] || SOURCE_BADGE.popup;
                                        const SrcI = src.icon;
                                        return <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${src.color}`}>
                                            <SrcI className="w-3.5 h-3.5" /> {src.label}
                                        </span>;
                                    })()}
                                </div>

                                {/* Client Info */}
                                <div className="rounded-xl border border-border p-4 space-y-3">
                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <UserIcon className="w-3.5 h-3.5" /> Informations Client
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <p className="font-semibold text-foreground text-base">{selectedOrder.fullName}</p>
                                        {selectedOrder.company && <p className="flex items-center gap-2 text-muted-foreground"><Building2 className="w-3.5 h-3.5" /> {selectedOrder.company}</p>}
                                        <p className="flex items-center gap-2 text-muted-foreground"><Mail className="w-3.5 h-3.5" /> {selectedOrder.email}</p>
                                        <p className="flex items-center gap-2 text-muted-foreground"><Phone className="w-3.5 h-3.5" /> {selectedOrder.phone}</p>
                                    </div>
                                </div>

                                {/* Order Details */}
                                <div className="rounded-xl border border-border p-4 space-y-3">
                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <Package className="w-3.5 h-3.5" /> Détail Commande
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">GPS</span>
                                            <span className="font-semibold">{selectedOrder.gpsCount} appareil{selectedOrder.gpsCount > 1 ? 's' : ''}</span>
                                        </div>

                                        {/* Upgrade context vs new order */}
                                        {selectedOrder.source === 'client_upgrade' ? (
                                            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                                                <PackagePlus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                <div>
                                                    <p className="text-xs font-semibold text-emerald-400">Mise à jour du parc existant</p>
                                                    <p className="text-[10px] text-muted-foreground">Abonnement actuel conservé — matériel uniquement</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Plan</span>
                                                    <span className="font-semibold">{PLAN_LABELS[selectedOrder.plan] || selectedOrder.plan}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Cycle</span>
                                                    <span className="font-semibold">{CYCLE_LABELS[selectedOrder.billingCycle] || selectedOrder.billingCycle}</span>
                                                </div>
                                            </>
                                        )}

                                        {selectedOrder.gpsTypes?.length > 0 && (
                                            <div className="pt-2 border-t border-border">
                                                <p className="text-xs text-muted-foreground mb-1.5">Types :</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {selectedOrder.gpsTypes.map((t: any, i: number) => (
                                                        <span key={i} className="px-2 py-0.5 rounded-md bg-muted text-xs flex items-center gap-1">
                                                            {t.emoji && <span>{t.emoji}</span>}{t.count}× {t.label || t.type}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {selectedOrder.notes && (
                                            <div className="pt-2 border-t border-border">
                                                <p className="text-xs text-muted-foreground mb-1">Note du client :</p>
                                                <p className="text-xs bg-muted/40 rounded-lg p-2 italic">{selectedOrder.notes}</p>
                                            </div>
                                        )}

                                        <div className="pt-2 border-t border-border flex justify-between">
                                            <span className="font-semibold text-foreground">Total matériel</span>
                                            <span className="text-lg font-bold text-[#00E599]">{selectedOrder.totalDueToday} TND</span>
                                        </div>
                                        {selectedOrder.source !== 'client_upgrade' && selectedOrder.recurringCost > 0 && (
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">Récurrent</span>
                                                <span className="font-medium">{selectedOrder.recurringCost} TND / cycle</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Admin Notes */}
                                <div className="rounded-xl border border-border p-4 space-y-3">
                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <MessageSquare className="w-3.5 h-3.5" /> Notes Admin
                                    </h3>
                                    <textarea
                                        value={adminNotes}
                                        onChange={e => setAdminNotes(e.target.value)}
                                        rows={3}
                                        placeholder="Ajouter des notes internes..."
                                        className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none"
                                    />
                                    <Button size="sm" onClick={() => handleSaveNotes(selectedOrder._id)} className="bg-[#00E599] text-black hover:bg-[#00E599]/90">
                                        Sauvegarder les notes
                                    </Button>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedOrder.status === 'pending' && (
                                            <Button onClick={() => setConfirmDialog({
                                                isOpen: true,
                                                title: 'Confirmer la commande',
                                                message: 'Êtes-vous sûr que la commande a été confirmée avec le client par téléphone ou email ?',
                                                action: 'confirmed',
                                                orderId: selectedOrder._id
                                            })}
                                                className="bg-blue-500 text-white hover:bg-blue-600 gap-1.5 shadow-md">
                                                <CheckCircle2 className="w-4 h-4" /> Confirmer
                                            </Button>
                                        )}
                                        {selectedOrder.status === 'confirmed' && (
                                            <Button onClick={() => setConfirmDialog({
                                                isOpen: true,
                                                title: 'Démarrer l\'Installation',
                                                message: 'Confirmez-vous l\'envoi de cette commande vers l\'étape d\'installation physique ?',
                                                action: 'installing',
                                                orderId: selectedOrder._id
                                            })}
                                                className="bg-purple-500 text-white hover:bg-purple-600 gap-1.5 shadow-md">
                                                <Truck className="w-4 h-4" /> Démarrer l'Installation
                                            </Button>
                                        )}
                                        {selectedOrder.status === 'installing' && (
                                            <>
                                                <Button onClick={() => setIsPrefixModalOpen(true)}
                                                    disabled={isProcessing}
                                                    className="bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 gap-1.5 shadow-lg">
                                                    <Zap className="w-4 h-4" />
                                                    {isProcessing ? 'Activation...' : '⚡ Activer (Création AI)'}
                                                </Button>
                                                <Button onClick={() => setConfirmDialog({
                                                    isOpen: true,
                                                    title: 'Activation Manuelle',
                                                    message: 'Avez-vous créé le compte client et les appareils manuellement ? Confirmez-vous l\'activation définitive ?',
                                                    action: 'active',
                                                    orderId: selectedOrder._id
                                                })}
                                                    className="bg-[#00E599] text-black hover:bg-[#00E599]/90 gap-1.5">
                                                    <CheckCircle2 className="w-4 h-4" /> Marquer comme Actif
                                                </Button>
                                            </>
                                        )}
                                        {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'active' && (
                                            <Button variant="outline" onClick={() => setConfirmDialog({
                                                isOpen: true,
                                                title: 'Annuler la commande',
                                                message: 'Êtes-vous sûr de vouloir annuler définitivement cette commande ? Cette action est irréversible.',
                                                action: 'cancelled',
                                                orderId: selectedOrder._id
                                            })}
                                                className="text-red-400 border-red-400/20 hover:bg-red-400/10 gap-1.5">
                                                <XCircle className="w-4 h-4" /> Annuler
                                            </Button>
                                        )}
                                        <Button variant="outline" onClick={() => handleDelete(selectedOrder._id)}
                                            className="text-red-400 border-red-400/20 hover:bg-red-400/10 gap-1.5 ml-auto">
                                            Supprimer
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Process Result Modal */}
                {processResult && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="bg-card border border-border rounded-2xl shadow-2xl w-[500px] max-h-[80vh] overflow-y-auto">
                            <div className="p-6 border-b border-border bg-gradient-to-r from-violet-500/10 to-purple-600/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                        <Zap className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold">✅ Commande Activée!</h2>
                                        <p className="text-sm text-muted-foreground">Ref: {processResult.orderRef}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                {/* Steps */}
                                <div className="space-y-2">
                                    {processResult.steps?.map((s: any, i: number) => (
                                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${s.status === 'created' || s.status === 'activated' || s.status === 'sent'
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : s.status === 'exists' || s.status === 'skipped'
                                                    ? 'bg-blue-500/20 text-blue-400'
                                                    : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                {s.status === 'created' || s.status === 'activated' || s.status === 'sent' ? '✓' :
                                                    s.status === 'exists' ? '→' : '!'}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium capitalize">{s.step}</p>
                                                <p className="text-xs text-muted-foreground">{s.status}{s.name ? `: ${s.name}` : ''}{s.count ? `: ${s.count} créés` : ''}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Credentials */}
                                {processResult.user?.tempPassword && (
                                    <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                                        <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                                            <UserIcon className="w-4 h-4" /> Accès créés
                                        </h3>
                                        <div className="space-y-1.5 text-sm">
                                            <p><span className="text-muted-foreground">Email:</span> <code className="text-[#00E599]">{processResult.user.email}</code></p>
                                            <p><span className="text-muted-foreground">Mot de passe:</span> <code className="text-orange-400 font-bold">{processResult.user.tempPassword}</code></p>
                                            <p><span className="text-muted-foreground">Entreprise:</span> {processResult.enterprise?.name}</p>
                                            <p><span className="text-muted-foreground">Appareils:</span> {processResult.devices?.length} GPS créés</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t border-border flex justify-end">
                                <Button onClick={() => { setProcessResult(null); setIsProcessing(false); setSelectedOrder(null); }}
                                    className="bg-[#00E599] text-black hover:bg-[#00E599]/90">
                                    Fermer
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Prefix Configuration Modal */}
                {isPrefixModalOpen && selectedOrder && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isProcessing && setIsPrefixModalOpen(false)} />
                        <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between p-6 border-b border-border">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-violet-400" />
                                    Configuration des Identifiants
                                </h2>
                                <Button variant="ghost" size="icon" onClick={() => !isProcessing && setIsPrefixModalOpen(false)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                            
                            <div className="p-6 space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Veuillez entrer les préfixes d'installation pour la création automatique des {selectedOrder.gpsCount} GPS.
                                </p>
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Préj. Abonné (SIM)</label>
                                        <Input placeholder="Ex: 507" value={prefixes.sim} onChange={e => setPrefixes(p => ({ ...p, sim: e.target.value }))} className="bg-background" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Préfixe Série</label>
                                        <Input placeholder="Ex: TL-" value={prefixes.serie} onChange={e => setPrefixes(p => ({ ...p, serie: e.target.value }))} className="bg-background" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Préfixe IMEI</label>
                                        <Input placeholder="Ex: 35914" value={prefixes.imei} onChange={e => setPrefixes(p => ({ ...p, imei: e.target.value }))} className="bg-background" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-3 p-4 border-t border-border bg-muted/10 rounded-b-2xl">
                                <Button type="button" variant="outline" onClick={() => setIsPrefixModalOpen(false)} disabled={isProcessing}>
                                    Annuler
                                </Button>
                                <Button onClick={() => handleProcessOrder(selectedOrder._id)} disabled={isProcessing} className="bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700">
                                    {isProcessing ? 'Création...' : 'Créer et Activer'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Custom Confirmation Popup */}
                {confirmDialog.isOpen && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDialog(d => ({ ...d, isOpen: false }))} />
                        <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${confirmDialog.action === 'cancelled' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                    {confirmDialog.action === 'cancelled' ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                                </div>
                                <h2 className="text-lg font-bold">{confirmDialog.title}</h2>
                            </div>
                            <p className="text-sm text-muted-foreground mb-6 mt-2">{confirmDialog.message}</p>
                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setConfirmDialog(d => ({ ...d, isOpen: false }))}>
                                    Annuler
                                </Button>
                                <Button className={confirmDialog.action === 'cancelled' ? "bg-red-500 hover:bg-red-600 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"} 
                                    onClick={() => {
                                        if (confirmDialog.orderId) handleStatusChange(confirmDialog.orderId, confirmDialog.action);
                                        setConfirmDialog(d => ({ ...d, isOpen: false }));
                                }}>
                                    Confirmer
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Order Modal */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSubmitting && setIsAddModalOpen(false)} />
                        <div className="relative w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between p-6 border-b border-border">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5 text-[#00E599]" />
                                    Créer une Commande Manuelle
                                </h2>
                                <Button variant="ghost" size="icon" onClick={() => !isSubmitting && setIsAddModalOpen(false)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <form onSubmit={handleAddOrder} className="p-6 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Nom complet *</label>
                                        <Input required placeholder="Ex: Jean Dupont" value={newOrder.fullName} onChange={e => setNewOrder({ ...newOrder, fullName: e.target.value })} className="bg-background" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Téléphone *</label>
                                        <Input required type="tel" placeholder="Ex: 55 123 456" value={newOrder.phone} onChange={e => setNewOrder({ ...newOrder, phone: e.target.value })} className="bg-background" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email *</label>
                                        <Input required type="email" placeholder="contact@email.com" value={newOrder.email} onChange={e => setNewOrder({ ...newOrder, email: e.target.value })} className="bg-background" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Société (Optionnel)</label>
                                        <Input placeholder="Nom de l'entreprise" value={newOrder.company} onChange={e => setNewOrder({ ...newOrder, company: e.target.value })} className="bg-background" />
                                    </div>
                                </div>

                                <div className="border-t border-border pt-4 grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Nb. de GPS *</label>
                                        <Input required type="number" min={1} value={newOrder.gpsCount} onChange={e => setNewOrder({ ...newOrder, gpsCount: parseInt(e.target.value) || 1 })} className="bg-background" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Plan *</label>
                                        <select value={newOrder.plan} onChange={e => setNewOrder({ ...newOrder, plan: e.target.value })} className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm text-foreground">
                                            <option value="starter">Starter (1-5)</option>
                                            <option value="pro">Pro (6-50)</option>
                                            <option value="enterprise">Enterprise (50+)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Cycle Facturation *</label>
                                        <select value={newOrder.billingCycle} onChange={e => setNewOrder({ ...newOrder, billingCycle: e.target.value })} className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm text-foreground">
                                            <option value="monthly">Mensuel</option>
                                            <option value="biannual">6 Mois (-10%)</option>
                                            <option value="annual">Annuel (-20%)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Preview Costs calculation */}
                                <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-between border border-border border-dashed">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Estimation au paiement (livraison + install + 3 mois de garantie)</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xl font-bold text-[#00E599]">
                                            {(() => {
                                                const mp = newOrder.plan === 'starter' ? 49 : newOrder.plan === 'pro' ? 39 : 30;
                                                let rc = newOrder.gpsCount * mp;
                                                if (newOrder.billingCycle === 'biannual') rc *= 0.9;
                                                if (newOrder.billingCycle === 'annual') rc *= 0.8;
                                                return Math.round((newOrder.gpsCount * 110) + 40 + (rc * 3));
                                            })()} TND
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                    <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
                                        Annuler
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting} className="bg-[#00E599] text-black hover:bg-[#00E599]/90">
                                        {isSubmitting ? 'Création...' : 'Créer la commande'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default OrdersPage;
