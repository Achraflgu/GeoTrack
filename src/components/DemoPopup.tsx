import { X, MapPin, Truck, Bell, BarChart3, Shield, Users, Activity, ChevronRight, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface DemoPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onJoin?: () => void;
}

const DemoPopup = ({ isOpen, onClose, onJoin }: DemoPopupProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-6xl max-h-[90vh] bg-[#0F1219] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-300">

                {/* Demo Banner */}
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-2.5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span className="text-white font-bold text-sm">Mode Démonstration</span>
                        <span className="text-white/80 text-xs hidden sm:inline">— Données fictives, lecture seule</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button size="sm" className="bg-white text-orange-600 hover:bg-white/90 font-bold text-xs rounded-full px-4 h-7" onClick={() => { onClose(); onJoin?.(); }}>
                            Nous Rejoindre
                            <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Dashboard Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Dashboard Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-7 h-7 rounded-lg bg-[#00E599] flex items-center justify-center">
                                    <Radio className="w-4 h-4 text-black" />
                                </div>
                                <span className="text-white font-bold text-lg">GeoTrack Dashboard</span>
                            </div>
                            <p className="text-white/40 text-xs">Bienvenue, Utilisateur Démo — Dernière connexion : il y a 2 min</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#00E599]/20 flex items-center justify-center">
                                <Bell className="w-4 h-4 text-[#00E599]" />
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00E599] to-blue-500 flex items-center justify-center text-black font-bold text-xs">D</div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { icon: Truck, label: 'Véhicules actifs', value: '24', change: '+3 cette semaine', color: 'text-[#00E599]', bgColor: 'bg-[#00E599]/10' },
                            { icon: MapPin, label: 'En mouvement', value: '18', change: '75% de la flotte', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
                            { icon: Bell, label: 'Alertes actives', value: '5', change: '2 critiques', color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
                            { icon: Activity, label: 'Km parcourus', value: '1,247', change: 'Aujourd\'hui', color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-[#161B26] border border-white/5 rounded-2xl p-5 relative overflow-hidden group cursor-not-allowed">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/[0.02] to-transparent rounded-bl-3xl" />
                                <div className={`w-10 h-10 ${stat.bgColor} rounded-xl flex items-center justify-center mb-3`}>
                                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                                <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                                <p className="text-xs text-white/40">{stat.label}</p>
                                <p className={`text-xs ${stat.color} mt-1`}>{stat.change}</p>
                            </div>
                        ))}
                    </div>

                    {/* Map + Device List */}
                    <div className="grid lg:grid-cols-3 gap-4">
                        {/* Fake Map */}
                        <div className="lg:col-span-2 bg-[#161B26] border border-white/5 rounded-2xl p-4 relative overflow-hidden h-72 cursor-not-allowed">
                            <div className="flex items-center justify-between mb-3 relative z-10">
                                <span className="text-white font-bold text-sm">Carte en direct</span>
                                <span className="text-[#00E599] text-xs flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#00E599] animate-pulse" />
                                    Temps réel
                                </span>
                            </div>
                            {/* Abstract map lines */}
                            <div className="absolute inset-0 mt-12">
                                <svg className="w-full h-full opacity-20" viewBox="0 0 500 250">
                                    <line x1="50" y1="30" x2="200" y2="120" stroke="#00E599" strokeWidth="1.5" />
                                    <line x1="200" y1="120" x2="350" y2="80" stroke="#00E599" strokeWidth="1.5" />
                                    <line x1="350" y1="80" x2="450" y2="180" stroke="#00E599" strokeWidth="1.5" />
                                    <line x1="100" y1="150" x2="250" y2="200" stroke="#3B82F6" strokeWidth="1" strokeDasharray="4" />
                                    <line x1="250" y1="200" x2="400" y2="150" stroke="#3B82F6" strokeWidth="1" strokeDasharray="4" />
                                    {/* Grid lines */}
                                    <line x1="0" y1="60" x2="500" y2="60" stroke="white" strokeWidth="0.3" />
                                    <line x1="0" y1="120" x2="500" y2="120" stroke="white" strokeWidth="0.3" />
                                    <line x1="0" y1="180" x2="500" y2="180" stroke="white" strokeWidth="0.3" />
                                    <line x1="120" y1="0" x2="120" y2="250" stroke="white" strokeWidth="0.3" />
                                    <line x1="250" y1="0" x2="250" y2="250" stroke="white" strokeWidth="0.3" />
                                    <line x1="380" y1="0" x2="380" y2="250" stroke="white" strokeWidth="0.3" />
                                </svg>
                                {/* Vehicle dots */}
                                <div className="absolute top-[30px] left-[80px] w-4 h-4 rounded-full bg-[#00E599] border-2 border-[#161B26] shadow-[0_0_10px_#00E599] animate-pulse" />
                                <div className="absolute top-[100px] left-[200px] w-4 h-4 rounded-full bg-[#00E599] border-2 border-[#161B26] shadow-[0_0_10px_#00E599]" />
                                <div className="absolute top-[60px] left-[350px] w-4 h-4 rounded-full bg-blue-400 border-2 border-[#161B26] shadow-[0_0_10px_#3B82F6]" />
                                <div className="absolute top-[150px] left-[400px] w-3 h-3 rounded-full bg-orange-400 border-2 border-[#161B26] shadow-[0_0_8px_#F97316]" />
                                <div className="absolute top-[170px] left-[150px] w-3 h-3 rounded-full bg-[#00E599] border-2 border-[#161B26]" />
                            </div>
                        </div>

                        {/* Device List */}
                        <div className="bg-[#161B26] border border-white/5 rounded-2xl p-4 h-72 overflow-hidden cursor-not-allowed">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-white font-bold text-sm">Appareils récents</span>
                                <span className="text-white/30 text-xs">24 total</span>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { name: 'Camion A-201', status: 'En route', speed: '67 km/h', statusColor: 'bg-[#00E599]' },
                                    { name: 'Fourgon B-105', status: 'Arrêté', speed: '0 km/h', statusColor: 'bg-orange-400' },
                                    { name: 'Voiture C-302', status: 'En route', speed: '45 km/h', statusColor: 'bg-[#00E599]' },
                                    { name: 'Camion D-410', status: 'Hors ligne', speed: '—', statusColor: 'bg-red-400' },
                                    { name: 'Pick-up E-008', status: 'En route', speed: '82 km/h', statusColor: 'bg-[#00E599]' },
                                ].map((device) => (
                                    <div key={device.name} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                                        <div className={`w-2 h-2 rounded-full ${device.statusColor} shrink-0`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-white truncate">{device.name}</p>
                                            <p className="text-[10px] text-white/40">{device.status}</p>
                                        </div>
                                        <span className="text-xs text-white/50 font-mono">{device.speed}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Alerts + Chart */}
                    <div className="grid lg:grid-cols-2 gap-4">
                        {/* Recent Alerts */}
                        <div className="bg-[#161B26] border border-white/5 rounded-2xl p-4 cursor-not-allowed">
                            <span className="text-white font-bold text-sm mb-3 block">Alertes récentes</span>
                            <div className="space-y-2.5">
                                {[
                                    { text: 'Excès de vitesse — Camion A-201 (120km/h)', type: 'Critique', typeColor: 'text-red-400 bg-red-500/10' },
                                    { text: 'Batterie faible — Fourgon B-105 (12%)', type: 'Warning', typeColor: 'text-orange-400 bg-orange-500/10' },
                                    { text: 'Sortie de zone — Voiture C-302', type: 'Info', typeColor: 'text-blue-400 bg-blue-500/10' },
                                ].map((alert, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${alert.typeColor} shrink-0 mt-0.5`}>{alert.type}</span>
                                        <p className="text-xs text-white/60 leading-relaxed">{alert.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Fake Chart */}
                        <div className="bg-[#161B26] border border-white/5 rounded-2xl p-4 cursor-not-allowed">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-white font-bold text-sm">Activité de la flotte</span>
                                <span className="text-white/30 text-xs">7 derniers jours</span>
                            </div>
                            <div className="flex items-end gap-2 h-32 px-2">
                                {[40, 65, 50, 80, 70, 90, 60].map((h, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                        <div
                                            className="w-full rounded-md bg-gradient-to-t from-[#00E599]/60 to-[#00E599]/20"
                                            style={{ height: `${h}%` }}
                                        />
                                        <span className="text-[9px] text-white/30">{['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][i]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom CTA */}
                <div className="border-t border-white/5 px-6 py-4 bg-[#0A0D14] flex items-center justify-between shrink-0">
                    <p className="text-white/40 text-xs hidden sm:block">
                        Ceci est une prévisualisation. Les données affichées sont fictives.
                    </p>
                    <div className="flex items-center gap-3 ml-auto">
                        <Button
                            variant="outline"
                            className="bg-transparent border-white/10 text-white/70 hover:bg-white/5 rounded-full text-sm px-5"
                            onClick={onClose}
                        >
                            Fermer
                        </Button>
                        <Button className="bg-[#00E599] text-black hover:bg-[#00E599]/90 font-bold rounded-full text-sm px-5" onClick={() => { onClose(); onJoin?.(); }}>
                            Nous Rejoindre
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DemoPopup;
