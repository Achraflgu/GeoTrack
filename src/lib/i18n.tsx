import { createContext, useContext, useState, ReactNode } from 'react';

type Lang = 'fr' | 'en';

const translations: Record<string, Record<Lang, string>> = {
    // Navbar
    'nav.home': { fr: 'Accueil', en: 'Home' },
    'nav.trackers': { fr: 'Vos Traceurs', en: 'Your Trackers' },
    'nav.howItWorks': { fr: 'Comment ça marche', en: 'How It Works' },
    'nav.pricing': { fr: 'Tarifs', en: 'Pricing' },
    'nav.demo': { fr: 'Démo', en: 'Demo' },
    'nav.guide': { fr: 'Guide', en: 'Guide' },
    'nav.join': { fr: 'Rejoindre Nous', en: 'Join Us' },
    'nav.login': { fr: 'Espace Client', en: 'Client Area' },

    // Hero
    'hero.badge': { fr: 'Traceurs GPS + Plateforme de suivi en Tunisie', en: 'GPS Trackers + Tracking Platform in Tunisia' },
    'hero.title1': { fr: 'Suivez en temps réel avec nos', en: 'Track in real time with our' },
    'hero.title2': { fr: 'traceurs GPS', en: 'GPS trackers' },
    'hero.subtitle': { fr: 'Véhicules, personnes, animaux, objets de valeur — nos traceurs GPS professionnels et notre plateforme complète vous permettent de tout suivre en temps réel depuis la Tunisie.', en: 'Vehicles, people, pets, valuables — our professional GPS trackers and complete platform let you track everything in real time from Tunisia.' },
    'hero.joinBtn': { fr: 'Rejoindre Nous', en: 'Join Us' },
    'hero.demoBtn': { fr: 'Voir la Démo', en: 'Watch Demo' },

    // Trackers section
    'trackers.title': { fr: '📡 Nos Traceurs GPS', en: '📡 Our GPS Trackers' },
    'trackers.subtitle': { fr: 'Appareils GPS professionnels certifiés, conçus pour les conditions tunisiennes', en: 'Professional certified GPS devices, designed for Tunisian conditions' },

    // How it works
    'how.title': { fr: '⚡ Comment ça marche ?', en: '⚡ How Does It Work?' },
    'how.subtitle': { fr: 'Un processus simple en 4 étapes', en: 'A simple 4-step process' },
    'how.step1.title': { fr: 'Commandez', en: 'Order' },
    'how.step1.desc': { fr: 'Choisissez le nombre de traceurs GPS adaptés à vos besoins', en: 'Choose the number of GPS trackers suited to your needs' },
    'how.step2.title': { fr: 'Installation', en: 'Installation' },
    'how.step2.desc': { fr: 'Notre équipe installe et configure les appareils', en: 'Our team installs and configures the devices' },
    'how.step3.title': { fr: 'Activation', en: 'Activation' },
    'how.step3.desc': { fr: 'Recevez vos identifiants pour la plateforme', en: 'Receive your platform credentials' },
    'how.step4.title': { fr: 'Suivi', en: 'Tracking' },
    'how.step4.desc': { fr: 'Surveillez vos appareils en temps réel 24/7', en: 'Monitor your devices in real time 24/7' },

    // Features
    'features.title': { fr: '🛡️ Fonctionnalités de la plateforme', en: '🛡️ Platform Features' },
    'features.subtitle': { fr: 'Tout ce dont vous avez besoin pour gérer vos appareils de bout en bout', en: 'Everything you need to manage your devices end to end' },
    'features.viewAll': { fr: 'Voir toutes les fonctionnalités', en: 'View all features' },
    'features.realtime': { fr: 'Suivi en temps réel', en: 'Real-time Tracking' },
    'features.realtimeDesc': { fr: 'Visualisez la position de tous vos appareils avec un rafraîchissement au niveau de 10s', en: 'View the position of all your devices with 10s refresh rate' },
    'features.multi': { fr: 'Gestion multi-usages', en: 'Multi-purpose Management' },
    'features.multiDesc': { fr: 'Chaque utilisateur gère ses propres appareils avec son espace indépendant et sécurisé.', en: 'Each user manages their own devices with their independent and secure space.' },
    'features.history': { fr: 'Historique complet', en: 'Complete History' },
    'features.historyDesc': { fr: 'Consultez le déroulé des trajets passés à tout moment pour détecter les optimisations.', en: 'Review past trip history at any time to detect optimizations.' },
    'features.secure': { fr: 'Accès sécurisé', en: 'Secure Access' },
    'features.secureDesc': { fr: 'Connexion protégée avec rôles et permissions personnalisés et gestion des mots de passe.', en: 'Protected login with customized roles and permissions and password management.' },
    'features.coverage': { fr: 'Couverture Tunisie', en: 'Tunisia Coverage' },
    'features.coverageDesc': { fr: "Réseau optimisé pour une couverture maximale sur l'ensemble du territoire tunisien.", en: 'Network optimized for maximum coverage across the entire Tunisian territory.' },
    'features.data': { fr: 'Protection des données', en: 'Data Protection' },
    'features.dataDesc': { fr: 'Vos données de localisation sont stockées de manière chiffrée limitant tout accès tiers.', en: 'Your location data is encrypted, limiting any third-party access.' },

    // Testimonials
    'testimonials.title': { fr: '💬 Ce que disent nos clients', en: '💬 What Our Clients Say' },
    'testimonials.subtitle': { fr: 'Plus de 50 entreprises optimisées partout en Tunisie', en: 'Over 50 companies optimized across Tunisia' },

    // Stats
    'stats.devices': { fr: 'Appareils déployés', en: 'Devices Deployed' },
    'stats.companies': { fr: 'Entreprises clientes', en: 'Client Companies' },
    'stats.regions': { fr: 'Gouvernorats couverts', en: 'Regions Covered' },
    'stats.support': { fr: 'Support technique', en: 'Technical Support' },

    // FAQ
    'faq.title': { fr: '❓ Questions fréquentes', en: '❓ Frequently Asked Questions' },
    'faq.subtitle': { fr: 'Trouvez les réponses à vos questions les plus courantes', en: 'Find answers to your most common questions' },
    'faq.q1': { fr: 'Que puis-je suivre avec GeoTrack ?', en: 'What can I track with GeoTrack?' },
    'faq.a1': { fr: 'Véhicules, motos, personnes, enfants, animaux, sacs, objets de valeur — tout ce que vous souhaitez protéger.', en: 'Vehicles, motorcycles, people, children, pets, bags, valuables — anything you want to protect.' },
    'faq.q2': { fr: "Combien de temps prend l'installation ?", en: 'How long does installation take?' },
    'faq.a2': { fr: 'En moyenne 30 à 45 minutes par appareil.', en: 'On average 30 to 45 minutes per device.' },
    'faq.q3': { fr: 'Avez-vous le contrôle du code ?', en: 'Do you own the code?' },
    'faq.a3': { fr: 'Oui, la plateforme vous appartient entièrement.', en: 'Yes, the platform belongs entirely to you.' },
    'faq.q4': { fr: 'Pouvez-vous ajouter de nouveaux traceurs ?', en: 'Can you add new trackers?' },
    'faq.a4': { fr: "Absolument, l'ajout se fait très facilement depuis le tableau de bord.", en: 'Absolutely, adding devices is very easy from the dashboard.' },
    'faq.q5': { fr: "Comment est hébergée l'application ?", en: 'How is the app hosted?' },
    'faq.a5': { fr: 'Vos données sont hébergées sur des serveurs sécurisés en Europe avec redondance temporelle.', en: 'Your data is hosted on secure European servers with temporal redundancy.' },
    'faq.q6': { fr: 'Quel est le coût du service ?', en: 'What is the service cost?' },
    'faq.a6': { fr: 'Ceci dépend de votre volume. Nos tarifs débutent à 49 TND/mois par appareil.', en: 'This depends on your volume. Our rates start at 49 TND/month per device.' },

    // Contact
    'contact.title': { fr: '📞 Contactez-nous', en: '📞 Contact Us' },
    'contact.subtitle': { fr: 'Demandez un devis ou des informations sur nos solutions GPS', en: 'Request a quote or information about our GPS solutions' },
    'contact.sendBtn': { fr: 'Envoyer le message', en: 'Send Message' },

    // Footer
    'footer.rights': { fr: 'GeoTrack Tunisie © Tous droits réservés 2026.', en: 'GeoTrack Tunisia © All rights reserved 2026.' },
    'footer.location': { fr: 'Made in Tunisia, Route de Djerba Km11', en: 'Made in Tunisia, Route de Djerba Km11' },

    // Demo section
    'demo.title': { fr: 'Explorez la plateforme sans inscription', en: 'Explore the Platform Without Signing Up' },
    'demo.subtitle': { fr: 'Accédez à une version complète de démonstration — tableau de bord, carte, alertes, rapports — sans créer de compte.', en: 'Access a full demo version — dashboard, map, alerts, reports — without creating an account.' },
    'demo.btn': { fr: '▶ Lancer le mode Démo', en: '▶ Launch Demo Mode' },
    'demo.guideLink': { fr: 'Suivre le guide en étapes', en: 'Follow the step-by-step guide' },

    // Pricing
    'pricing.title': { fr: '💎 Nos Formules', en: '💎 Our Plans' },
    'pricing.subtitle': { fr: "Des solutions adaptées à chaque besoin, du personnel au professionnel.", en: 'Solutions adapted to every need, from personal to professional.' },

    // Guide page
    'guide.badge': { fr: 'Guide de la plateforme', en: 'Platform Guide' },
    'guide.title1': { fr: 'Découvrez GeoTrack en', en: 'Discover GeoTrack in' },
    'guide.title2': { fr: '5 étapes', en: '5 steps' },
    'guide.subtitle': { fr: 'Apprenez à utiliser toutes les fonctionnalités de notre plateforme GPS. Que vous suiviez un véhicule, un enfant, un animal ou un objet de valeur — maîtrisez GeoTrack en quelques minutes.', en: "Learn how to use all the features of our GPS platform. Whether you're tracking a vehicle, a child, a pet, or a valuable — master GeoTrack in minutes." },
    'guide.tryDemo': { fr: '🚀 Essayer la démo en direct', en: '🚀 Try the live demo' },
    'guide.seeInDemo': { fr: 'Voir dans la démo', en: 'See in demo' },

    // Dashboard
    'dash.myDashboard': { fr: 'Mon Tableau de bord', en: 'My Dashboard' },
    'dash.totalDevices': { fr: 'Total Appareils', en: 'Total Devices' },
    'dash.online': { fr: 'En ligne', en: 'Online' },
    'dash.moving': { fr: 'En mouvement', en: 'Moving' },
    'dash.offline': { fr: 'Hors ligne', en: 'Offline' },
    'dash.alerts': { fr: 'Alertes', en: 'Alerts' },
    'dash.mapPreview': { fr: 'Aperçu de la carte', en: 'Map Preview' },
    'dash.viewFullMap': { fr: 'Voir la carte complète', en: 'View full map' },
    'dash.myDevices': { fr: 'Mes Appareils', en: 'My Devices' },
    'dash.viewAll': { fr: 'Voir tout', en: 'View all' },
    'dash.noDevices': { fr: 'Aucun appareil assigné', en: 'No assigned devices' },
    'dash.movingDevices': { fr: 'Mes appareils en mouvement', en: 'My moving devices' },
    'dash.noMoving': { fr: 'Aucun appareil en mouvement', en: 'No moving devices' },
    'dash.recentAlerts': { fr: 'Mes alertes récentes', en: 'My recent alerts' },
    'dash.noAlerts': { fr: 'Aucune alerte récente', en: 'No recent alerts' },
    'dash.search': { fr: 'Rechercher...', en: 'Search...' },

    // Sidebar
    'sidebar.dashboard': { fr: 'Tableau de bord', en: 'Dashboard' },
    'sidebar.map': { fr: 'Carte temps réel', en: 'Real-time Map' },
    'sidebar.devices': { fr: 'Mes appareils', en: 'My Devices' },
    'sidebar.allDevices': { fr: 'Tous les appareils', en: 'All Devices' },
    'sidebar.alerts': { fr: 'Alertes', en: 'Alerts' },
    'sidebar.support': { fr: 'Support', en: 'Support' },
    'sidebar.profile': { fr: 'Mon Profil', en: 'My Profile' },
    'sidebar.enterprises': { fr: 'Entreprises', en: 'Enterprises' },
    'sidebar.users': { fr: 'Utilisateurs', en: 'Users' },
    'sidebar.audit': { fr: "Journal d'audit", en: 'Audit Log' },
    'sidebar.settings': { fr: 'Paramètres', en: 'Settings' },
    'sidebar.logout': { fr: 'Déconnexion', en: 'Logout' },
    'sidebar.overview': { fr: "Vue d'ensemble", en: 'Overview' },
    'sidebar.surveillance': { fr: 'Surveillance', en: 'Surveillance' },
    'sidebar.geofences': { fr: 'Zones GPS', en: 'GPS Zones' },
};

interface I18nContextType {
    lang: Lang;
    setLang: (lang: Lang) => void;
    t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
    lang: 'fr',
    setLang: () => { },
    t: (key: string) => key,
});

export const I18nProvider = ({ children }: { children: ReactNode }) => {
    const [lang, setLangState] = useState<Lang>(() => {
        const saved = localStorage.getItem('geotrack-lang');
        return (saved === 'fr' || saved === 'en') ? saved : 'fr';
    });

    const setLang = (l: Lang) => {
        setLangState(l);
        localStorage.setItem('geotrack-lang', l);
    };

    const t = (key: string): string => {
        return translations[key]?.[lang] || key;
    };

    return (
        <I18nContext.Provider value={{ lang, setLang, t }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useI18n = () => useContext(I18nContext);
