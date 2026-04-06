import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Radio, MapPin, Shield, Truck, Building2, ChevronRight, Zap, Globe, Lock, Phone, Mail, MapPinned, CheckCircle2, Cpu, Battery, Signal, Clock, Play, BookOpen, Loader2, Star, Plus, Minus, Check, Satellite, Navigation, Wifi, Car, Dog, Briefcase, Baby, Watch, Bike, Smartphone } from 'lucide-react';
import FloatingIcons from '@/components/FloatingIcons';
import PublicNavbar from '@/components/layout/PublicNavbar';
import JoinPopup from '@/components/JoinPopup';
import DemoModal from '@/components/modals/DemoModal';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';

const Index = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [joinOpen, setJoinOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const { t } = useI18n();
  const { theme } = useTheme();

  // Theme-aware helper classes
  const isDark = theme === 'dark';
  
  // Ultra-Premium Creative Glassmorphism & 3D Interactive Cards
  const cardBg = isDark
    ? 'bg-[#121620]/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)] hover:shadow-[0_20px_50px_rgba(0,229,153,0.15)] hover:bg-[#1A2130]/80 hover:-translate-y-2 hover:border-[#00E599]/30 transition-all duration-500 relative overflow-hidden group'
    : 'bg-white/40 backdrop-blur-2xl border-[1.5px] border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:bg-white/70 hover:shadow-[0_20px_40px_rgba(0,229,153,0.15)] hover:-translate-y-2 transition-all duration-500 ring-1 ring-white/50 relative overflow-hidden group';
  
  const cardBgAlt = isDark
    ? 'bg-gradient-to-br from-[#1A2130]/90 to-[#121620]/90 backdrop-blur-2xl border border-[#00E599]/40 shadow-[0_20px_50px_rgba(0,229,153,0.2)] hover:shadow-[0_30px_60px_rgba(0,229,153,0.3)] hover:-translate-y-3 hover:scale-[1.02] transition-all duration-500 relative overflow-hidden group'
    : 'bg-gradient-to-br from-white/90 via-white/70 to-emerald-50/50 backdrop-blur-3xl border-[2px] border-white shadow-[0_20px_50px_rgba(0,229,153,0.12)] ring-2 ring-[#00E599]/20 hover:ring-[#00E599]/40 hover:shadow-[0_30px_60px_rgba(0,229,153,0.25)] hover:-translate-y-3 hover:scale-[1.02] transition-all duration-500 relative overflow-hidden group';
  
  const subtitleColor = isDark ? 'text-white/50' : 'text-slate-500 font-medium';
  const bodyColor = isDark ? 'text-white/60' : 'text-slate-600';
  const bodyColorLight = isDark ? 'text-white/70' : 'text-slate-600';
  const bodyColorMed = isDark ? 'text-white/80' : 'text-slate-700';
  const bodyColorStrong = isDark ? 'text-white/90' : 'text-slate-900';
  const mutedColor = isDark ? 'text-white/40' : 'text-slate-400';
  const borderColor = isDark ? 'border-white/5' : 'border-white/60';
  const innerBg = isDark ? 'bg-white/5' : 'bg-white/60 shadow-inner';
  const footerBg = isDark ? '' : 'bg-white/40 backdrop-blur-xl border-t border-white';

  const handleDemoLogin = async () => {
    setDemoOpen(true);
  };
  const faqs = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
    { q: t('faq.q5'), a: t('faq.a5') },
    { q: t('faq.q6'), a: t('faq.a6') }
  ];

  return (
    <div className={`min-h-screen font-sans selection:bg-[#00E599]/30 relative transition-colors duration-500 overflow-hidden ${isDark ? 'bg-[#0A0D14] text-white' : 'bg-[#EBF4F6] text-slate-900'}`}>

      {/* Animated Background Layers & Map - Vibrant Watercolor mesh in light mode */}
      <div className={`fixed inset-0 pointer-events-none z-0 overflow-hidden ${isDark ? '' : 'bg-[#F0F5F4]'}`}>
        {/* Tunisia Map Background */}
        <div className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 ${isDark ? 'opacity-10 mix-blend-luminosity' : 'opacity-10 mix-blend-multiply grayscale-[50%]'}`} style={{ backgroundImage: "url('/images/tunisia_map_bg.png')" }} />

        {/* Abstract Blobs / Ethereal Orbs */}
        <div className={`absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full filter blur-[100px] animate-blob ${isDark ? 'mix-blend-multiply opacity-60 bg-[#00E599]/10' : 'mix-blend-screen opacity-100 bg-[#00E599]/20'}`} />
        <div className={`absolute top-[20%] right-[-10%] w-[45vw] h-[45vw] rounded-full filter blur-[100px] animate-blob animation-delay-2000 ${isDark ? 'mix-blend-multiply opacity-60 bg-blue-500/10' : 'mix-blend-multiply opacity-40 bg-[#3b82f6]/20'}`} />
        <div className={`absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] rounded-full filter blur-[120px] animate-blob animation-delay-4000 ${isDark ? 'mix-blend-multiply opacity-60 bg-purple-500/10' : 'mix-blend-multiply opacity-40 bg-[#a855f7]/15'}`} />

        {/* Grid pattern for light mode only for tech feel */}
        {!isDark && (
          <div className="absolute inset-0 bg-[radial-gradient(#00E599_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.05]"></div>
        )}
      </div>

      {/* Shared floating icons */}
      <div className="relative z-0">
        <FloatingIcons />
      </div>

      <div className="relative z-10">
        <PublicNavbar />

        {/* Hero Section */}
        <section className="pt-36 pb-20 px-6 relative flex flex-col justify-center items-center text-center">
          <div className="container mx-auto relative z-10 max-w-4xl space-y-8">
            <div className={`inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full border ${isDark ? 'border-[#00E599]/20 bg-[#00E599]/10 shadow-[0_0_15px_rgba(0,229,153,0.1)]' : 'border-[#00E599]/30 bg-white/80 backdrop-blur-md shadow-lg'} text-[#00E599] text-sm font-bold mb-4`}>
              <Zap className="w-4 h-4" />
              {t('hero.badge')}
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight drop-shadow-sm">
              {t('hero.title1')}<br />
              <span className="text-[#00E599] relative">
                {t('hero.title2')}
                {!isDark && (
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none"><path d="M2 6 C50 2 150 2 198 6" stroke="#00E599" strokeWidth="4" strokeLinecap="round" opacity="0.3" /></svg>
                )}
              </span>
            </h1>

            <p className={`text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
              {t('hero.subtitle')}
            </p>

            {/* Use-case emoji badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {[
                { emoji: '🚗', label: 'Véhicules' },
                { emoji: '👤', label: 'Personnes' },
                { emoji: '🐕', label: 'Animaux' },
                { emoji: '👶', label: 'Enfants' },
                { emoji: '🎒', label: 'Objets' },
                { emoji: '🏍️', label: 'Motos' },
                { emoji: '🚛', label: 'Camions' },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-1.5 px-4 py-2 ${isDark ? 'bg-white/5 border-white/10 text-white/70 hover:border-[#00E599]/30' : 'bg-white/60 backdrop-blur-md border border-white text-slate-700 shadow-sm hover:border-[#00E599]/40 hover:bg-white'} rounded-full text-sm font-semibold hover:text-[#00E599] hover:-translate-y-1 transition-all cursor-default relative overflow-hidden group`} style={{ animation: `homeFloat${i % 4} 8s ease-in-out ${i * 0.3}s infinite` }}>
                  {!isDark && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />}
                  <span className="text-base relative z-10">{item.emoji}</span>
                  <span className="relative z-10">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button
                className="bg-[#00E599] text-black hover:bg-[#00E599]/90 font-bold rounded-full px-8 h-14 text-base shadow-[0_0_30px_rgba(0,229,153,0.3)] hover:shadow-[0_0_40px_rgba(0,229,153,0.5)] transition-shadow"
                onClick={() => setJoinOpen(true)}
              >
                {t('hero.joinBtn')}
              </Button>
              <Button
                variant="outline"
                className={`bg-transparent font-bold rounded-full px-8 h-14 text-base gap-2 ${isDark ? 'border-white/20 text-white hover:bg-white/5 hover:text-white' : 'border-gray-200 text-gray-800 hover:bg-white hover:shadow-md hover:border-gray-300'}`}
                onClick={handleDemoLogin}
              >
                <Play className="w-5 h-5 fill-current" />
                {t('hero.demoBtn')}
              </Button>
            </div>

            {/* Removed internal hero dashboard preview as requested */}
          </div>
        </section>

        {/* Nos Produits */}
        <section id="produits" className="py-24 px-6 relative">
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Nos Produits GPS</h2>
              <p className={`text-lg font-medium ${subtitleColor}`}>Une gamme complète de traceurs pour tous vos besoins</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Product 1: Vehicules */}
              <div className={`${cardBg} rounded-[2rem] flex flex-col rounded-3xl`}>
                {/* Shiny overlay for cards */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-20" />
                
                <div className="h-56 relative overflow-hidden bg-black/5">
                  <img src="/images/gps_tracker_vehicle.png" alt="Traceurs Véhicules" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className={`absolute inset-0 opacity-60 group-hover:opacity-80 transition-opacity duration-300 ${isDark ? 'bg-gradient-to-t from-[#0A0D14]/80 via-[#0A0D14]/20' : 'bg-gradient-to-t from-black/30 via-transparent'}`} />
                </div>
                <div className="p-8 flex flex-col flex-grow text-center relative z-10">
                  <h3 className="text-2xl font-bold mb-3">Traceurs Véhicules</h3>
                  <p className={`font-medium ${bodyColor} leading-relaxed flex-grow`}>
                    Installation fixe ou sur prise OBD. Suivi ultra-précis en temps réel, alertes de vitesse, diagnostic moteur et coupure moteur à distance.
                  </p>
                </div>
              </div>

              {/* Product 2: Autonomes / Objets */}
              <div className={`${cardBgAlt} rounded-[2rem] flex flex-col relative transform lg:-translate-y-4 rounded-3xl`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00E599]/20 blur-[40px] pointer-events-none rounded-full z-0" />
                <div className="absolute inset-0 bg-gradient-to-tl from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-20" />
                
                <div className="absolute top-4 right-4 z-30 bg-[#00E599] text-black px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
                  Best Seller
                </div>
                <div className="h-64 relative overflow-hidden bg-black/5 z-10">
                  <img src="/images/gps_tracker_autonomous.png" alt="Traceurs Autonomes" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className={`absolute inset-0 opacity-60 group-hover:opacity-80 transition-opacity duration-300 ${isDark ? 'bg-gradient-to-t from-[#0A0D14]/80 via-[#0A0D14]/20' : 'bg-gradient-to-t from-black/30 via-transparent'}`} />
                </div>
                <div className="p-8 flex flex-col flex-grow text-center bg-gradient-to-b from-transparent to-[#00E599]/5 relative z-10">
                  <h3 className="text-2xl font-bold mb-3 text-[#00E599]">Traceurs Autonomes</h3>
                  <p className={`font-medium ${bodyColor} leading-relaxed flex-grow`}>
                    Aucune installation requise. Magnétiques, étanches (IP67) avec une batterie très longue durée (jusqu'à 5 ans) pour conteneurs et marchandises.
                  </p>
                </div>
              </div>

              {/* Product 3: Personnels */}
              <div className={`${cardBg} rounded-[2rem] flex flex-col rounded-3xl`}>
                <div className="absolute inset-0 bg-gradient-to-bl from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-20" />
                
                <div className="h-56 relative overflow-hidden bg-black/5">
                  <img src="/images/gps_tracker_personal.png" alt="Traceurs Personnels" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className={`absolute inset-0 opacity-60 group-hover:opacity-80 transition-opacity duration-300 ${isDark ? 'bg-gradient-to-t from-[#0A0D14]/80 via-transparent' : 'bg-gradient-to-t from-black/20 via-transparent'}`} />
                </div>
                <div className="p-8 flex flex-col flex-grow text-center relative">
                  <h3 className="text-2xl font-bold mb-3">Traceurs Personnels</h3>
                  <p className={`font-medium ${bodyColor} leading-relaxed flex-grow`}>
                    Format mini de poche ou montre GPS. Idéal pour travailleurs isolés, enfants ou personnes âgées. Bouton SOS d'urgence et audio bidirectionnel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Nos Traceurs GPS */}
        <section id="traceurs" className="py-24 px-6 relative">
          <div className="container mx-auto max-w-5xl relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3">{t('trackers.title')}</h2>
              <p className={`text-base font-medium ${subtitleColor}`}>{t('trackers.subtitle')}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: Cpu, title: 'Haute précision', desc: 'GPS + GLONASS' },
                { icon: Battery, title: 'Longue autonomie', desc: "Jusqu'à 30 jours" },
                { icon: Signal, title: 'Connectivité', desc: 'SNC/2G/4G' },
                { icon: Shield, title: 'Résistant', desc: 'IP67 étanche' },
              ].map((item, idx) => (
                <div key={idx} className={`${cardBg} rounded-[2rem] p-8 text-center`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#00E599]/10 blur-[30px] rounded-full pointer-events-none" />
                  <div className={`w-16 h-16 mx-auto ${innerBg} rounded-2xl flex items-center justify-center mb-6 text-[#00E599] group-hover:bg-gradient-to-tr group-hover:from-[#00E599] group-hover:to-emerald-300 group-hover:text-black transition-all duration-500 shadow-inner group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,229,153,0.4)] relative z-10`}>
                    <item.icon className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 relative z-10">{item.title}</h3>
                  <p className={`text-sm font-medium ${mutedColor} relative z-10`}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comment ça marche */}
        <section id="comment-ca-marche" className={`py-24 px-6 relative ${theme === 'dark' ? 'bg-[#0E111A]/60' : 'bg-white'} border-y ${borderColor}`}>
          <div className="container mx-auto max-w-5xl relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3">{t('how.title')}</h2>
              <p className={`text-base font-medium ${subtitleColor}`}>{t('how.subtitle')}</p>
            </div>

            <div className="grid md:grid-cols-4 gap-8 text-center relative">
              {/* Connecting line for desktop */}
              <div className={`hidden md:block absolute top-[36px] left-[12%] right-[12%] h-1 ${isDark ? 'bg-white/5' : 'bg-[#00E599]/20'}`} />

              {[
                { step: '1', title: t('how.step1.title'), desc: t('how.step1.desc') },
                { step: '2', title: t('how.step2.title'), desc: t('how.step2.desc') },
                { step: '3', title: t('how.step3.title'), desc: t('how.step3.desc') },
                { step: '4', title: t('how.step4.title'), desc: t('how.step4.desc') },
              ].map((item, idx) => (
                <div key={item.step} className="relative z-10 group">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#00E599] to-emerald-500 text-black rounded-3xl rotate-3 flex items-center justify-center font-black text-3xl mb-8 shadow-[0_10px_30px_rgba(0,229,153,0.4)] group-hover:-rotate-3 group-hover:scale-110 transition-all duration-300">
                    {item.step}
                  </div>
                  <h3 className="font-extrabold text-xl mb-3">{item.title}</h3>
                  <p className={`text-sm font-medium ${subtitleColor} leading-relaxed px-4`}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Fonctionnalités de la plateforme */}
        <section className="py-24 px-6 relative">
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3">{t('features.title')}</h2>
              <p className={`text-base font-medium ${subtitleColor}`}>{t('features.subtitle')}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: MapPin, title: t('features.realtime'), desc: t('features.realtimeDesc') },
                { icon: Building2, title: t('features.multi'), desc: t('features.multiDesc') },
                { icon: Clock, title: t('features.history'), desc: t('features.historyDesc') },
                { icon: Shield, title: t('features.secure'), desc: t('features.secureDesc') },
                { icon: Globe, title: t('features.coverage'), desc: t('features.coverageDesc') },
                { icon: Lock, title: t('features.data'), desc: t('features.dataDesc') },
              ].map((feature, idx) => (
                <div key={idx} className={`${cardBg} rounded-3xl p-8`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#00E599]/10 blur-[30px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-14 h-14 bg-gradient-to-br from-[#00E599]/20 to-[#00E599]/5 rounded-2xl flex items-center justify-center mb-6 text-[#00E599] group-hover:scale-110 group-hover:bg-[#00E599] group-hover:text-black transition-all duration-500 shadow-sm relative z-10">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-xl mb-3 relative z-10">{feature.title}</h3>
                  <p className={`text-sm font-medium ${subtitleColor} leading-relaxed relative z-10`}>{feature.desc}</p>
                </div>
              ))}

              <div className="md:col-span-3 flex justify-center mt-8">
                <Button variant="outline" className={`h-14 ${isDark ? 'border-white/10 text-white hover:bg-white/5' : 'border-white bg-white/50 backdrop-blur-md text-slate-800 hover:bg-white shadow-[0_4px_15px_rgba(0,0,0,0.05)]'} rounded-full px-8 font-bold`} onClick={() => setJoinOpen(true)}>
                  Voir toutes les fonctionnalités
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Explorez la plateforme sans inscription (Demo Highlight) */}
        <section className={`py-24 px-6 relative ${theme === 'dark' ? 'bg-[#0E111A]/80' : 'bg-white/30 backdrop-blur-3xl'} border-y ${borderColor}`}>
          {/* Light mode specific background decorations for this section */}
          {!isDark && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
              <div className="absolute -right-40 top-1/2 -translate-y-1/2 w-96 h-96 bg-[#00E599]/10 rounded-full blur-[80px]"></div>
              <div className="absolute -left-40 top-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-[80px]"></div>
            </div>
          )}
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full border border-[#00E599]/30 bg-[#00E599]/10 text-[#00E599] text-sm font-bold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#00E599] animate-pulse" />
                Mode Démo Live
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">
                Explorez la plateforme <span className="text-[#00E599]">sans inscription</span>
              </h2>
              <div className={`space-y-4 font-medium text-lg ${bodyColor}`}>
                <p>
                  Plongez directement dans notre interface et découvrez comment GeoTrack vous donne le contrôle total sur votre flotte. Aucune carte de crédit, aucun engagement.
                </p>
                <ul className="space-y-4 pt-4 text-left max-w-xl mx-auto">
                  {[
                    "Tableau de bord interactif complet",
                    "Cartographie détaillée avec trafic",
                    "Simulateur de mouvements fictifs",
                    "Recherche des alertes et rapports"
                  ].map((li, i) => (
                    <li key={i} className={`flex items-center gap-4 ${isDark ? 'text-white/80' : 'text-gray-800'}`}>
                      <div className="w-6 h-6 rounded-full bg-[#00E599]/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-[#00E599]" />
                      </div>
                      <span className="font-semibold">{li}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8">
                <Button
                  className="bg-[#00E599] text-black hover:bg-[#00E599]/90 font-bold rounded-full px-10 h-14 shadow-xl hover:shadow-[0_0_30px_rgba(0,229,153,0.4)] transition-all"
                  onClick={handleDemoLogin}
                >
                  Lancer la simulation interactive
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Tarifs (Nos Formules) */}
        <section id="tarifs" className="py-32 px-6 relative">
          <div className="container mx-auto max-w-5xl relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-extrabold mb-4">Nos Formules</h2>
              <p className={`text-lg font-medium ${subtitleColor}`}>Une offre transparente et adaptée à votre flotte</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 items-center">
              {/* Starter */}
              <div className={`${cardBg} rounded-[2.5rem] p-10 flex flex-col h-full transform transition-transform hover:-translate-y-2`}>
                <h3 className="text-2xl font-bold mb-2">Starter</h3>
                <p className={`text-sm font-medium ${subtitleColor} mb-8`}>Pour les petites flottes (1 à 5)</p>
                <div className="mb-8">
                  <span className="text-5xl font-extrabold">49</span>
                  <span className={`text-sm font-bold ${subtitleColor}`}> TND/mois/v.</span>
                </div>
                <ul className="space-y-5 mb-10 flex-1">
                  {['Jusqu\'à 5 appareils', 'Tableau de bord géo', 'Historique 30 jours', 'Alertes e-mail', 'Support standard'].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <Check className="w-5 h-5 text-[#00E599] shrink-0" />
                      <span className={`font-semibold ${bodyColorMed}`}>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className={`w-full ${innerBg} ${isDark ? 'border-white/10 hover:bg-white/10 text-white' : 'border-black/5 hover:bg-white/80 text-gray-900'} rounded-full font-bold h-14`}>
                  Commencer
                </Button>
              </div>

              {/* Pro - Highlighted */}
              <div className={`${cardBgAlt} rounded-[2.5rem] p-10 flex flex-col relative transform md:-translate-y-6 z-10`}>
                <div className="absolute inset-0 bg-gradient-to-br from-[#00E599]/5 to-transparent rounded-[2.5rem] pointer-events-none" />
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#00E599] to-emerald-400 text-black text-sm font-extrabold px-6 py-1.5 rounded-full shadow-[0_5px_15px_rgba(0,229,153,0.4)] animate-pulse">
                  Populaire
                </div>
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <p className={`text-sm font-medium ${subtitleColor} mb-8`}>Pour les PME en croissance</p>
                <div className="mb-8 relative">
                  {/* Glow behind price */}
                  <div className="absolute top-1/2 left-8 -translate-y-1/2 w-16 h-16 bg-[#00E599]/20 blur-[20px] rounded-full"></div>
                  <span className="text-6xl font-black relative z-10 text-[#00E599]">39</span>
                  <span className={`text-sm font-bold ${subtitleColor} relative z-10`}> TND/mois/v.</span>
                </div>
                <ul className="space-y-5 mb-10 flex-1">
                  {['Jusqu\'à 50 appareils', 'API Intégrations', 'Historique 90 jours', 'Alertes SMS + App + Mail', 'Rapports exportables', 'Sous-comptes illimités', 'Support prioritaire'].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <Check className="w-5 h-5 text-[#00E599] shrink-0" />
                      <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-[#00E599] text-black hover:bg-[#00E599]/90 rounded-full font-black h-14 shadow-lg hover:shadow-[0_0_20px_rgba(0,229,153,0.5)] transition-shadow">
                  Choisir l'offre Pro
                </Button>
              </div>

              {/* Enterprise */}
              <div className={`${cardBg} rounded-[2.5rem] p-10 flex flex-col h-full transform transition-transform hover:-translate-y-2`}>
                <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                <p className={`text-sm font-medium ${subtitleColor} mb-8`}>Pour les flottes &gt; 50 véhicules</p>
                <div className="mb-8">
                  <span className="text-4xl font-extrabold pb-2 inline-block">Sur devis</span>
                </div>
                <ul className="space-y-5 mb-10 flex-1">
                  {['Appareils illimités', 'Marque blanche (API)', 'Historique illimité', 'Toutes les alertes', 'Diagnostic OBD', 'Serveur exclusif', 'SLA garanti'].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <Check className="w-5 h-5 text-[#00E599] shrink-0" />
                      <span className={`font-semibold ${bodyColorMed}`}>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className={`w-full ${innerBg} ${isDark ? 'border-white/10 hover:bg-white/10 text-white' : 'border-black/5 hover:bg-white/80 text-gray-900'} rounded-full font-bold h-14`}>
                  Contactez l'équipe
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Ce que disent nos clients */}
        <section className={`py-24 px-6 relative ${theme === 'dark' ? 'bg-[#0E111A]/80' : 'bg-white'} border-y ${borderColor}`}>
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Ce que disent nos clients</h2>
              <p className={`text-base font-medium ${subtitleColor}`}>Plus de 50 flottes optimisées partout en Tunisie</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  text: "Depuis que nous utilisons GeoTrack, nous avons réduit notre consommation de carburant de 15%. La plateforme est intuitive et le service client est toujours très réactif. Une décision excellente pour notre entreprise.",
                  author: "Anis B.",
                  company: "Manager Flotte, Transport Ezzahra"
                },
                {
                  text: "La fonction géoloc combinée aux alertes d'entretien nous fait gagner un temps précieux chaque matin. Nos chauffeurs sont plus sereins. Le retour sur l'investissement est concret.",
                  author: "Chokri M.",
                  company: "Fondateur, Société Générale de Livraison"
                },
                {
                  text: "GeoTrack nous offre exactement le niveau de précision dont on a besoin. On suit en temps réel presque seconde par seconde et l'historique de 90 jours est un énorme avantage comptable.",
                  author: "Farid K.",
                  company: "Directeur Opérations, Tunis Logistics"
                }
              ].map((review, i) => (
                <div key={i} className={`${cardBg} p-10 rounded-[3rem] flex flex-col justify-between group`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#00E599]/5 blur-[40px] pointer-events-none rounded-full" />
                  <div className="relative z-10">
                    <div className="flex gap-1.5 mb-6 opacity-80 group-hover:opacity-100 transition-opacity">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className="w-5 h-5 text-[#00E599] fill-[#00E599]" />
                      ))}
                    </div>
                    <p className={`text-base md:text-lg ${bodyColorStrong} leading-relaxed font-medium mb-8`}>"{review.text}"</p>
                  </div>
                  <div className="flex items-center gap-4 pt-4 border-t border-[#00E599]/10">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00E599] to-emerald-500 flex items-center justify-center font-bold text-black border-2 border-transparent shadow-md">
                      {review.author[0]}
                    </div>
                    <div>
                      <p className="font-extrabold text-base">{review.author}</p>
                      <p className="text-sm font-semibold text-[#00E599]">{review.company}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Ribbon */}
        <section className={`py-16 px-6 ${borderColor} border-b ${isDark ? 'bg-[#00E599]/5' : 'bg-white/40 backdrop-blur-xl relative overflow-hidden'}`}>
          {!isDark && <div className="absolute inset-0 bg-gradient-to-r from-[#00E599]/[0.03] via-transparent to-[#00E599]/[0.03]"></div>}
          <div className="container mx-auto max-w-5xl text-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: '500+', label: 'Appareils déployés' },
                { value: '50+', label: 'Entreprises clientes' },
                { value: '24', label: 'Gouvernorats couverts' },
                { value: '24/7', label: 'Support technique' },
              ].map((stat) => (
                <div key={stat.label} className="group cursor-default">
                  <p className="text-4xl md:text-5xl font-black text-[#00E599] mb-2 group-hover:scale-110 transition-transform origin-center drop-shadow-sm">{stat.value}</p>
                  <p className={`text-xs md:text-sm font-bold uppercase tracking-widest ${subtitleColor}`}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className={`py-24 px-6 relative`}>
          {/* Decorative emojis for FAQ section */}
          <div className="absolute top-10 left-10 text-5xl opacity-[0.08] pointer-events-none" style={{ animation: 'homeFloat0 7s ease-in-out infinite' }}>❓</div>
          <div className="absolute bottom-20 right-10 text-5xl opacity-[0.08] pointer-events-none" style={{ animation: 'homeFloat1 8s ease-in-out 1s infinite' }}>💡</div>
          <div className="absolute top-1/2 right-20 text-4xl opacity-[0.05] pointer-events-none" style={{ animation: 'homeFloat2 9s ease-in-out 2s infinite' }}>🤖</div>

          <div className="container mx-auto max-w-3xl relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">{t('faq.title')}</h2>
              <p className={`text-base font-medium ${subtitleColor}`}>{t('faq.subtitle')}</p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className={`${cardBg} rounded-2xl overflow-hidden transition-all duration-300`}>
                  <button
                    className="w-full text-left px-8 py-6 font-bold text-lg flex items-center justify-between hover:bg-[#00E599]/5 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className={openFaq === i ? 'text-[#00E599]' : ''}>{faq.q}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${openFaq === i ? 'bg-[#00E599]/20' : innerBg}`}>
                      {openFaq === i ? <Minus className="w-5 h-5 text-[#00E599]" /> : <Plus className={`w-5 h-5 ${subtitleColor}`} />}
                    </div>
                  </button>
                  <div className={`px-8 overflow-hidden transition-all duration-300 ease-in-out ${openFaq === i ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className={`text-base font-medium ${bodyColorLight} leading-relaxed`}>
                      {faq.a}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chatbot CTA after FAQ */}
            <div className={`mt-16 ${cardBg} border-2 border-[#00E599]/30 rounded-[2rem] p-10 text-center relative overflow-hidden group hover:border-[#00E599]/50 transition-colors`}>
              <div className="absolute inset-0 bg-gradient-to-r from-[#00E599]/10 via-transparent to-[#00E599]/10 opacity-50"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#00E599]/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(0,229,153,0.2)]">
                    <span className="text-3xl">🤖</span>
                  </div>
                </div>
                <h3 className="text-2xl font-extrabold mb-3">Besoin d'aide ? Notre assistant IA est là !</h3>
                <p className={`text-base font-medium mb-8 max-w-lg mx-auto ${subtitleColor}`}>
                  L'assistant GeoTrack connaît tout sur la plateforme : tarifs, fonctionnalités, architecture, démo... Posez-lui n'importe quelle question.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {[
                    { emoji: '🛰️', label: "C'est quoi GeoTrack ?" },
                    { emoji: '💰', label: 'Les tarifs' },
                    { emoji: '🏗️', label: 'Architecture' },
                    { emoji: '📖', label: 'Guide d\'utilisation' },
                  ].map((item, i) => (
                    <button key={i} className={`px-5 py-2.5 rounded-full ${isDark ? 'bg-white/5 border-white/10 text-[#00E599]' : 'bg-white border-[#00E599]/20 text-emerald-600'} border font-bold hover:bg-[#00E599]/10 hover:border-[#00E599]/50 hover:-translate-y-1 transition-all shadow-sm`}>
                      <span className="mr-2">{item.emoji}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
                <p className={`text-sm font-semibold mt-6 text-[#00E599] animate-pulse`}>💬 Cliquez sur le bouton vert en bas à droite pour discuter avec GeoTrack AI</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contactez-nous */}
        <section id="contact" className={`py-24 px-6 relative ${theme === 'dark' ? 'bg-[#0E111A]/80' : 'bg-white'} border-y ${borderColor}`}>
          <div className="container mx-auto max-w-4xl relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Contactez-nous</h2>
              <p className={`text-base font-medium ${subtitleColor}`}>Demandez un devis ou planifiez une démo gratuite de la plateforme</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Phone, title: 'Téléphone', value: '+216 71 000 000', href: 'tel:+21671000000' },
                { icon: Mail, title: 'Email', value: 'contact@geotrack.tn', href: 'mailto:contact@geotrack.tn' },
                { icon: MapPinned, title: 'Adresse', value: 'Tunis, Tunisie', href: '#' },
              ].map((item) => (
                <a
                  key={item.title}
                  href={item.href}
                  className={`${cardBg} p-8 text-center rounded-[2rem] group`}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-[#00E599]/10 blur-[30px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className={`w-14 h-14 mx-auto ${innerBg} rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#00E599] transition-colors duration-500 shadow-inner group-hover:scale-110 relative z-10`}>
                    <item.icon className="w-7 h-7 text-[#00E599] group-hover:text-black transition-colors duration-500" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 relative z-10">{item.title}</h3>
                  <p className={`text-sm font-semibold ${subtitleColor} relative z-10`}>{item.value}</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Footer */}
        <section className="py-24 px-6 relative overflow-hidden flex justify-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00E599]/10 blur-[120px] pointer-events-none rounded-full" />
          <div className={`container mx-auto max-w-4xl text-center relative z-10 ${isDark ? 'border border-white/5 bg-gradient-to-br from-[#1A2130]/90 to-[#121620]/90 shadow-[0_20px_50px_rgba(0,229,153,0.15)] ring-1 ring-[#00E599]/20' : 'border border-white bg-white/40 shadow-2xl'} backdrop-blur-2xl p-16 rounded-[3rem]`}>
            {/* Inner reflective highlight only for light mode */}
            {!isDark && <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/0 rounded-[3rem] pointer-events-none" />}
            {/* Inner reflective top edge for dark mode */}
            {isDark && <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-[3rem] pointer-events-none" />}
            <h2 className={`text-4xl md:text-5xl font-extrabold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Prêt à équiper votre flotte ?</h2>
            <p className={`text-lg md:text-xl font-medium ${bodyColorStrong} mb-10 max-w-2xl mx-auto leading-relaxed`}>
              Contactez-nous pour une démonstration sur place de notre solution de géolocalisation et optimisez dès aujourd'hui vos performances.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button
                className="w-full sm:w-auto bg-[#00E599] text-black hover:bg-[#00E599]/90 font-black rounded-full px-10 h-16 text-lg shadow-[0_0_30px_rgba(0,229,153,0.3)] hover:scale-105 transition-all"
                onClick={() => setJoinOpen(true)}
              >
                Rejoindre Nous
              </Button>
              <a href="tel:+21671000000" className="w-full sm:w-auto text-center">
                <Button variant="outline" className={`w-full sm:w-auto bg-transparent ${isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300 text-gray-800 hover:bg-white/50'} rounded-full px-10 h-16 font-bold text-lg gap-3`}>
                  <Phone className="w-5 h-5 fill-current" />
                  Appelez-nous
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className={`py-16 px-6 ${borderColor} border-t text-sm font-medium ${mutedColor} ${footerBg} relative`}>
          {!isDark && <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent pointer-events-none -z-10"></div>}
          <div className="container mx-auto max-w-6xl grid md:grid-cols-4 gap-12 mb-12 relative z-10">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#00E599] flex items-center justify-center shadow-[0_0_15px_rgba(0,229,153,0.4)]">
                  <Radio className={`w-5 h-5 ${isDark ? 'text-black' : 'text-white'}`} />
                </div>
                <span className={`text-2xl font-black bg-clip-text text-transparent ${isDark ? 'bg-gradient-to-r from-white to-gray-400' : 'bg-gradient-to-r from-slate-900 to-slate-500'}`}>GeoTrack</span>
              </div>
              <p className="max-w-sm mb-6 leading-relaxed">Plateforme de géolocalisation GPS professionnelle pour contrôler vos véhicules, personnes, animaux et optimiser votre logistique.</p>
            </div>
            <div>
              <h4 className={`font-bold text-base mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Produits</h4>
              <ul className="space-y-4">
                <li><a href="#" className="hover:text-[#00E599] transition-colors">Traceur Voitures</a></li>
                <li><a href="#" className="hover:text-[#00E599] transition-colors">Traceur Camions</a></li>
                <li><a href="#" className="hover:text-[#00E599] transition-colors">Traceur Autonome</a></li>
                <li><a href="#" className="hover:text-[#00E599] transition-colors">Traceur OBD</a></li>
              </ul>
            </div>
            <div>
              <h4 className={`font-bold text-base mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Mentions</h4>
              <ul className="space-y-4">
                <li><a href="#" className="hover:text-[#00E599] transition-colors">Mentions Légales</a></li>
                <li><a href="#" className="hover:text-[#00E599] transition-colors">Politique de Confidentialité</a></li>
                <li><a href="#" className="hover:text-[#00E599] transition-colors">Conditions d'Utilisation</a></li>
              </ul>
            </div>
          </div>

          <div className={`container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4 ${borderColor} border-t pt-8 relative z-10`}>
            <span>{t('footer.rights')}</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2">
                <Globe className="w-4 h-4" /> {t('footer.location')}
              </span>
            </div>
          </div>
        </footer>

      </div>{/* end z-10 wrapper */}

      {/* Adding CSS animation variables to global scope via style tag */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 15s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        @keyframes homeFloat0 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-10px) rotate(2deg); } }
        @keyframes homeFloat1 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-8px) rotate(-2deg); } }
        @keyframes homeFloat2 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-12px) rotate(3deg); } }
        @keyframes homeFloat3 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-9px) rotate(-1deg); } }
      `}</style>

      <JoinPopup isOpen={joinOpen} onClose={() => setJoinOpen(false)} />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div >
  );
};

export default Index;
