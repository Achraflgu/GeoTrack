import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dashboardChatApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import {
    Bot, X, Send, Sparkles, BarChart3, AlertTriangle, Radio,
    Battery, Gauge, MapPin, ChevronDown, Minus, MessageSquarePlus, RotateCcw
} from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const AIChatWidget = () => {
    const { lang } = useI18n();
    const { user } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>(() => {
        try {
            const saved = localStorage.getItem('dashboard_chat_history');
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
            }
        } catch (e) {
            console.error('Failed to load chat history', e);
        }
        return [];
    });
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(() => {
        return localStorage.getItem('dashboard_chat_session') || null;
    });
    const [hasGreeted, setHasGreeted] = useState(false);

    useEffect(() => {
        localStorage.setItem('dashboard_chat_history', JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
        if (sessionId) {
            localStorage.setItem('dashboard_chat_session', sessionId);
        } else {
            localStorage.removeItem('dashboard_chat_session');
        }
    }, [sessionId]);

    const startNewConversation = () => {
        setMessages([]);
        setSessionId(null);
        setHasGreeted(false);
        localStorage.removeItem('dashboard_chat_history');
        localStorage.removeItem('dashboard_chat_session');
    };

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const isFr = lang === 'fr';

    const quickActions = isFr
        ? [
            { label: 'Résumé', icon: BarChart3 },
            { label: 'Alertes', icon: AlertTriangle },
            { label: 'Appareils', icon: Radio },
            { label: 'Batteries', icon: Battery },
            { label: 'Vitesse', icon: Gauge },
            { label: 'Zones', icon: MapPin },
        ]
        : [
            { label: 'Summary', icon: BarChart3 },
            { label: 'Alerts', icon: AlertTriangle },
            { label: 'Devices', icon: Radio },
            { label: 'Battery', icon: Battery },
            { label: 'Speed', icon: Gauge },
            { label: 'Zones', icon: MapPin },
        ];

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Welcome message on first open
    useEffect(() => {
        if (isOpen && !hasGreeted && messages.length === 0) {
            setHasGreeted(true);
            const welcome: Message = {
                role: 'assistant',
                content: isFr
                    ? `👋 Bonjour **${user?.name || ''}**! Je suis l'assistant IA GeoTrack.\n\nJe peux répondre à vos questions sur votre fleet en temps réel. Essayez les raccourcis ci-dessous ou posez votre question!`
                    : `👋 Hi **${user?.name || ''}**! I'm the GeoTrack AI assistant.\n\nI can answer questions about your fleet in real-time. Try the shortcuts below or ask away!`,
                timestamp: new Date(),
            };
            setMessages([welcome]);
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen, hasGreeted, isFr, user, messages.length]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || loading) return;

        const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const result = await dashboardChatApi.send(text, sessionId, {
                role: user?.role || 'operator',
                name: user?.name || 'User',
                enterpriseId: (user as any)?.enterpriseId || '',
                enterpriseName: (user as any)?.enterpriseName || '',
            });

            setSessionId(result.sessionId);

            const aiMsg: Message = {
                role: 'assistant',
                content: result.reply,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err: any) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: isFr ? '❌ Erreur de connexion. Réessayez.' : '❌ Connection error. Try again.',
                timestamp: new Date(),
            }]);
        } finally {
            setLoading(false);
        }
    };

    // Simple markdown renderer
    const renderMarkdown = (text: string) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br/>')
            .replace(/• /g, '<span class="text-[#00E599]">•</span> ');
    };

    // AI Chat is a Pro/Enterprise feature for Operators.
    // Must be placed here *after* all hooks to avoid React "Rendered more hooks" errors.
    if (user?.role === 'operator') {
        const userPlan = (user as any)?.plan || 'starter';
        if (userPlan === 'starter') {
            return null;
        }
    }

    return (
        <>
            {/* Floating chat button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-[1000] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${isOpen
                        ? 'bg-muted border border-border'
                        : 'bg-gradient-to-br from-[#00E599] to-[#00B377] text-black'
                    }`}
            >
                {isOpen ? <ChevronDown className="w-5 h-5" /> : <Bot className="w-6 h-6" />}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-background animate-pulse" />
                )}
            </button>

            {/* Chat panel */}
            <div className={`fixed bottom-24 right-6 z-[999] w-[400px] max-h-[600px] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
                }`}>
                {/* Header */}
                <div className="bg-gradient-to-r from-[#00E599] to-[#00C27A] px-4 py-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-black/15 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-black text-[15px] leading-tight">GeoTrack AI</h3>
                            <p className="text-[11px] text-black/55 leading-tight flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                {isFr ? 'Assistant fleet intelligent' : 'Smart fleet assistant'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                        <button onClick={startNewConversation} title={isFr ? "Nouvelle conversation" : "New conversation"}
                            className="p-1.5 rounded-lg hover:bg-black/10 transition-colors text-black/60 hover:text-black">
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <button onClick={() => setIsOpen(false)} title={isFr ? "Réduire" : "Minimize"}
                            className="p-1.5 rounded-lg hover:bg-black/10 transition-colors text-black/60 hover:text-black">
                            <Minus className="w-4 h-4" />
                        </button>
                        <button onClick={() => setIsOpen(false)} title={isFr ? "Fermer" : "Close"}
                            className="p-1.5 rounded-lg hover:bg-black/10 transition-colors text-black/60 hover:text-black">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[300px] max-h-[400px]">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-[#00E599] text-black rounded-br-md'
                                    : 'bg-muted/50 border border-border/50 rounded-bl-md'
                                }`}>
                                <div
                                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                                    className="[&_strong]:font-bold"
                                />
                                <p className={`text-[9px] mt-1.5 ${msg.role === 'user' ? 'text-black/40' : 'text-muted-foreground/40'
                                    }`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}

                    {/* Loading indicator */}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-muted/50 border border-border/50 rounded-2xl rounded-bl-md px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-[#00E599] animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-[#00E599] animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-[#00E599] animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Quick actions */}
                {messages.length <= 1 && (
                    <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0 w-full mt-2">
                        {quickActions.map(({ label, icon: Icon }) => (
                            <button
                                key={label}
                                onClick={() => sendMessage(label)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/30 border border-border/50 text-xs font-medium hover:bg-muted/60 hover:border-[#00E599]/30 transition-all"
                            >
                                <Icon className="w-3 h-3 text-[#00E599]" />
                                {label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input */}
                <div className="p-3 border-t border-border shrink-0">
                    <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                        className="flex gap-2">
                        <Input
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder={isFr ? 'Posez votre question...' : 'Ask a question...'}
                            className="flex-1 bg-background h-10 text-sm"
                            disabled={loading}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={loading || !input.trim()}
                            className="h-10 w-10 bg-[#00E599] text-black hover:bg-[#00D48A] shrink-0"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default AIChatWidget;
