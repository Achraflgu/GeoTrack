import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Radio, ChevronRight, BookOpen, Play, Sun, Moon, Languages } from 'lucide-react';
import DemoModal from '@/components/modals/DemoModal';
import JoinPopup from '@/components/JoinPopup';
import { useTheme } from '@/lib/theme';
import { useI18n } from '@/lib/i18n';

const PublicNavbar = () => {
    const [demoOpen, setDemoOpen] = useState(false);
    const [joinOpen, setJoinOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const { lang, setLang, t } = useI18n();

    const handleDemoLogin = () => {
        setDemoOpen(true);
    };

    const isDark = theme === 'dark';

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${isDark ? 'bg-[#0A0D14]/90 border-white/5' : 'bg-white/90 border-gray-100 shadow-sm'}`}>
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <div className="w-9 h-9 rounded-lg bg-[#00E599] flex items-center justify-center">
                                <Radio className={`w-5 h-5 ${isDark ? 'text-black' : 'text-white'}`} />
                            </div>
                            <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>GeoTrack</span>
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium">
                        <Link to="/" className={`${isDark ? 'text-white hover:text-[#00E599]' : 'text-gray-900 hover:text-[#00E599]'} transition-colors`}>
                            {t('nav.home')}
                        </Link>
                        <a href="/#traceurs" className={`${isDark ? 'text-white/70' : 'text-gray-600'} hover:text-[#00E599] transition-colors`}>
                            {t('nav.trackers')}
                        </a>
                        <a href="/#comment-ca-marche" className={`${isDark ? 'text-white/70' : 'text-gray-600'} hover:text-[#00E599] transition-colors`}>
                            {t('nav.howItWorks')}
                        </a>
                        <a href="/#tarifs" className={`${isDark ? 'text-white/70' : 'text-gray-600'} hover:text-[#00E599] transition-colors`}>
                            {t('nav.pricing')}
                        </a>
                        <button
                            onClick={handleDemoLogin}
                            className={`${isDark ? 'text-white/70' : 'text-gray-600'} hover:text-[#00E599] transition-colors flex items-center gap-1.5`}
                        >
                            <Play className="w-3.5 h-3.5" />
                            {t('nav.demo')}
                        </button>
                        <Link to="/guide" className={`${isDark ? 'text-white/70' : 'text-gray-600'} hover:text-[#00E599] transition-colors flex items-center gap-1.5`}>
                            <BookOpen className="w-3.5 h-3.5" />
                            {t('nav.guide')}
                        </Link>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Language toggle */}
                        <button
                            onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border transition-all text-xs font-bold ${isDark ? 'bg-white/5 border-white/10 text-white/70 hover:text-[#00E599] hover:border-[#00E599]/30' : 'bg-gray-50 border-gray-200 text-gray-600 hover:text-[#00E599] hover:border-[#00E599]/30 hover:bg-white'}`}
                            title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
                        >
                            <Languages className="w-3.5 h-3.5" />
                            {lang === 'fr' ? 'EN' : 'FR'}
                        </button>

                        {/* Theme toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-full border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white/70 hover:text-[#00E599] hover:border-[#00E599]/30' : 'bg-gray-50 border-gray-200 text-gray-600 hover:text-[#00E599] hover:border-[#00E599]/30 hover:bg-white'}`}
                            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                        >
                            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>

                        <Button
                            variant="outline"
                            className={`bg-transparent font-semibold rounded-full px-5 text-sm ${isDark ? 'border-[#00E599]/30 text-[#00E599] hover:bg-[#00E599]/10' : 'border-[#00E599] text-[#00E599] hover:bg-[#00E599] hover:text-black shadow-sm'}`}
                            onClick={() => setJoinOpen(true)}
                        >
                            {t('nav.join')}
                        </Button>
                        <Link to="/login">
                            <Button className="bg-[#00E599] text-black hover:bg-[#00E599]/90 font-bold rounded-full px-5 text-sm">
                                {t('nav.login')}
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>
            <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
            <JoinPopup isOpen={joinOpen} onClose={() => setJoinOpen(false)} />
        </>
    );
};

export default PublicNavbar;
