import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Radio, ChevronRight, BookOpen } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';
import JoinPopup from '@/components/JoinPopup';

interface DemoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DemoModal = ({ isOpen, onClose }: DemoModalProps) => {
    const { login, logout } = useAuthStore();
    const navigate = useNavigate();
    const [phase, setPhase] = useState<'loading' | 'ready' | 'idle'>('idle');
    const [joinOpen, setJoinOpen] = useState(false);
    const hasStarted = useRef(false);

    const startDemo = useCallback(async () => {
        if (hasStarted.current) return;
        hasStarted.current = true;
        setPhase('loading');

        // Short delay for smooth loading animation
        await new Promise(r => setTimeout(r, 1200));

        const result = await login('demo@geotrack.tn', 'demo');
        if (result.success) {
            setPhase('ready');
        } else {
            toast.error("Échec de la connexion au mode démo");
            setPhase('idle');
            hasStarted.current = false;
            onClose();
        }
    }, [login, onClose]);

    useEffect(() => {
        if (isOpen && phase === 'idle') {
            startDemo();
        }
        if (!isOpen) {
            setPhase('idle');
            hasStarted.current = false;
        }
    }, [isOpen, phase, startDemo]);

    const handleClose = () => {
        logout();
        setPhase('idle');
        hasStarted.current = false;
        onClose();
    };

    return (
        <>
            <Dialog
                open={isOpen}
                onOpenChange={(open) => {
                    if (!open) handleClose();
                }}
            >
                <DialogContent className="max-w-[1600px] w-[98vw] h-[96vh] bg-[#0A0D14] backdrop-blur-xl border-orange-500/30 shadow-[0_0_80px_rgba(249,115,22,0.12)] rounded-2xl p-0 overflow-hidden flex flex-col gap-0 border-2">
                    {/* Title Bar */}
                    <div className="h-14 bg-gradient-to-r from-orange-600 to-orange-500 shrink-0 flex items-center justify-between px-5 text-white relative z-50 shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <Radio className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <div className="font-bold text-sm tracking-wide">Mode Démonstration Interactive</div>
                                <div className="text-[11px] text-orange-100/80 hidden sm:block">Données fictives • Lecture seule</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-white/10 text-white hover:bg-white/20 border-white/20 font-semibold rounded-full px-4 text-xs h-8 gap-1.5"
                                onClick={() => { handleClose(); navigate('/guide'); }}
                            >
                                <BookOpen className="w-3.5 h-3.5" />
                                Guide
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-white text-orange-600 hover:bg-orange-50 hover:text-orange-700 border-none font-bold rounded-full px-5 text-xs h-8 shadow-sm"
                                onClick={() => setJoinOpen(true)}
                            >
                                Rejoindre Nous
                                <ChevronRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                            <button
                                onClick={handleClose}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors ml-1"
                            >
                                <X className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 w-full relative bg-[#0A0D14]">
                        {phase === 'loading' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                {/* Animated GeoTrack Logo */}
                                <div className="relative mb-8">
                                    {/* Outer rotating ring */}
                                    <div className="absolute -inset-6 border-2 border-dashed border-[#00E599]/20 rounded-full animate-[spin_8s_linear_infinite]" />
                                    {/* Middle pulsing glow */}
                                    <div className="absolute -inset-4 bg-[#00E599]/10 rounded-full animate-pulse" />
                                    {/* Inner rotating ring */}
                                    <div className="absolute -inset-3 border-2 border-[#00E599]/30 rounded-full animate-[spin_3s_linear_infinite_reverse]" />
                                    {/* Active dot on ring */}
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#00E599] rounded-full shadow-[0_0_12px_#00E599] animate-[spin_3s_linear_infinite_reverse] origin-[50%_calc(50%+1.25rem)]" />

                                    {/* Logo center */}
                                    <div className="w-20 h-20 rounded-2xl bg-[#00E599] flex items-center justify-center relative z-10 shadow-[0_0_40px_rgba(0,229,153,0.3)]">
                                        <Radio className="w-10 h-10 text-black" />
                                    </div>
                                </div>

                                {/* Text */}
                                <div className="text-center space-y-3">
                                    <h3 className="text-2xl font-bold text-white tracking-wide">
                                        GeoTrack
                                    </h3>
                                    <p className="text-sm text-white/50 font-medium">
                                        Préparation de l'environnement de démonstration...
                                    </p>
                                    {/* Animated progress bar */}
                                    <div className="w-48 h-1 bg-white/10 rounded-full mx-auto overflow-hidden mt-4">
                                        <div className="h-full bg-gradient-to-r from-[#00E599] to-[#00E599]/60 rounded-full animate-[loading_1.2s_ease-in-out_infinite]"
                                            style={{ width: '60%', animation: 'loading 1.2s ease-in-out infinite' }} />
                                    </div>
                                </div>

                                {/* Decorative floating dots */}
                                <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-[#00E599]/40 rounded-full animate-ping" />
                                <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-orange-500/30 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
                                <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-[#00E599]/30 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
                            </div>
                        )}

                        {phase === 'ready' && (
                            <iframe
                                src="/dashboard"
                                className="w-full h-full border-0 absolute inset-0"
                                title="GeoTrack Demo Dashboard"
                                style={{ opacity: 1, animation: 'fadeIn 0.6s ease-out' }}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Join Popup triggered from the demo header */}
            <JoinPopup isOpen={joinOpen} onClose={() => setJoinOpen(false)} />

            {/* Inline keyframes */}
            <style>{`
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(80%); }
                    100% { transform: translateX(-100%); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </>
    );
};

export default DemoModal;
