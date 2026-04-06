import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, X, Send, User, Bot, Sparkles, RotateCcw, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

const CHAT_SESSION_KEY = 'geotrack_chat_session';
const CHAT_HISTORY_KEY = 'geotrack_chat_history';
const CHAT_SEEN_KEY = 'geotrack_chat_seen';
const API_BASE = 'http://localhost:3001/api';

interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: number;
}

const i18nChat = {
    headerTitle: { fr: 'Assistant GeoTrack', en: 'GeoTrack Assistant' },
    headerSub: { fr: '🟢 IA Gemma • n8n Agent', en: '🟢 AI Gemma • n8n Agent' },
    welcomeMsg: {
        fr: "👋 Bonjour ! Je suis l'assistant IA GeoTrack.\n\nPosez-moi vos questions sur notre plateforme GPS ou commandez directement ici !",
        en: "👋 Hello! I'm the GeoTrack AI assistant.\n\nAsk me anything about our GPS platform or place an order right here!",
    },
    previewBubble: {
        fr: "👋 Besoin d'aide ? Je suis là pour vous !",
        en: "👋 Need help? I'm here for you!",
    },
    placeholder: { fr: 'Écrivez votre message...', en: 'Type your message...' },
    thinking: { fr: 'Réflexion...', en: 'Thinking...' },
    newChat: { fr: 'Nouvelle conversation', en: 'New conversation' },
    errorOffline: {
        fr: "⚠️ Service IA indisponible. Vérifiez que le serveur est en marche.",
        en: "⚠️ AI service unavailable. Please check the server is running.",
    },
    quickActions: {
        fr: [
            { label: "🛰️ C'est quoi GeoTrack ?", query: "C'est quoi GeoTrack ?" },
            { label: '💰 Tarifs', query: 'Quels sont vos tarifs ?' },
            { label: '🛒 Commander', query: 'Je veux commander des GPS' },
            { label: '🚀 Démo', query: 'Comment essayer la démo ?' },
            { label: '📞 Contact', query: 'Comment vous contacter ?' },
        ],
        en: [
            { label: "🛰️ What is GeoTrack?", query: "What is GeoTrack?" },
            { label: '💰 Pricing', query: 'What are your prices?' },
            { label: '🛒 Order', query: 'I want to order GPS trackers' },
            { label: '🚀 Demo', query: 'How can I try the demo?' },
            { label: '📞 Contact', query: 'How to contact you?' },
        ],
    },
};

export const ChatbotWidget = () => {
    const { lang } = useI18n();
    const t = (key: keyof typeof i18nChat) => i18nChat[key][lang] as string;

    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Init session, restore history, auto-show preview for first-time visitors
    useEffect(() => {
        let sid = localStorage.getItem(CHAT_SESSION_KEY);
        if (!sid) {
            sid = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            localStorage.setItem(CHAT_SESSION_KEY, sid);
        }
        setSessionId(sid);

        try {
            const saved = localStorage.getItem(CHAT_HISTORY_KEY);
            if (saved) {
                const parsed = JSON.parse(saved) as ChatMessage[];
                if (parsed.length > 0) { setMessages(parsed); return; }
            }
        } catch { /* ignore */ }

        setMessages([{
            id: 'welcome',
            text: i18nChat.welcomeMsg[lang],
            sender: 'bot',
            timestamp: Date.now(),
        }]);

        // First-time visitor: show preview bubble after 2s
        const hasSeen = localStorage.getItem(CHAT_SEEN_KEY);
        if (!hasSeen) {
            const timer = setTimeout(() => setShowPreview(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    // Update welcome when lang changes
    useEffect(() => {
        setMessages(prev => prev.map(m =>
            m.id === 'welcome' ? { ...m, text: i18nChat.welcomeMsg[lang] } : m
        ));
    }, [lang]);

    // Save history
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
        }
    }, [messages]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Focus input on open
    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
    }, [isOpen]);

    // Open chat from preview bubble
    const openFromPreview = () => {
        setShowPreview(false);
        setIsOpen(true);
        localStorage.setItem(CHAT_SEEN_KEY, 'true');
    };

    // ─── Send message ────────────────────────────────────────────────
    const handleSendMessage = useCallback(async (e?: React.FormEvent, overrideMsg?: string) => {
        e?.preventDefault();
        const userMessage = (overrideMsg || inputMessage).trim();
        if (!userMessage || isLoading) return;

        setInputMessage('');

        const userMsg: ChatMessage = {
            id: `u-${Date.now()}`,
            text: userMessage,
            sender: 'user',
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage, sessionId }),
            });

            const data = await response.json();
            const reply = data.reply || data.error || (lang === 'fr'
                ? "Désolé, je n'ai pas pu traiter votre message."
                : "Sorry, I couldn't process your message.");

            setMessages(prev => [...prev, {
                id: `b-${Date.now()}`,
                text: reply,
                sender: 'bot',
                timestamp: Date.now(),
            }]);
        } catch {
            setMessages(prev => [...prev, {
                id: `e-${Date.now()}`,
                text: t('errorOffline'),
                sender: 'bot',
                timestamp: Date.now(),
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [inputMessage, isLoading, sessionId, lang]);

    // Reset
    const handleReset = useCallback(() => {
        const newSid = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        localStorage.setItem(CHAT_SESSION_KEY, newSid);
        localStorage.removeItem(CHAT_HISTORY_KEY);
        setSessionId(newSid);
        setMessages([{
            id: `welcome-${Date.now()}`,
            text: i18nChat.welcomeMsg[lang],
            sender: 'bot',
            timestamp: Date.now(),
        }]);
    }, [lang]);

    const quickActions = i18nChat.quickActions[lang];

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            {/* ── Chat Window ───────────────────────────────────────── */}
            {isOpen && !isMinimized && (
                <div className="w-[370px] sm:w-[420px] h-[580px] rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300
                    bg-white dark:bg-[#0C0F18] border border-gray-200 dark:border-white/10">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#00E599] to-[#00C27A] px-4 py-3 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-black/15 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-black text-[15px] leading-tight">{t('headerTitle')}</h3>
                                <p className="text-[11px] text-black/55 leading-tight">{t('headerSub')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                            <button onClick={handleReset} title={t('newChat')}
                                className="p-1.5 rounded-lg hover:bg-black/10 transition-colors text-black/60 hover:text-black">
                                <RotateCcw className="w-4 h-4" />
                            </button>
                            <button onClick={() => setIsMinimized(true)}
                                className="p-1.5 rounded-lg hover:bg-black/10 transition-colors text-black/60 hover:text-black">
                                <Minus className="w-4 h-4" />
                            </button>
                            <button onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-lg hover:bg-black/10 transition-colors text-black/60 hover:text-black">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 px-4 py-3 overflow-y-auto flex flex-col gap-3 bg-gray-50/50 dark:bg-transparent">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-2.5 max-w-[88%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.sender === 'user'
                                    ? 'bg-[#00E599] text-black'
                                    : 'bg-gray-200 dark:bg-white/10 text-[#00E599]'
                                    }`}>
                                    {msg.sender === 'user'
                                        ? <User className="w-3.5 h-3.5" />
                                        : <Sparkles className="w-3.5 h-3.5" />}
                                </div>
                                <div className={`px-3.5 py-2.5 text-[13.5px] leading-[1.55] whitespace-pre-line ${msg.sender === 'user'
                                    ? 'bg-[#00E599] text-black rounded-2xl rounded-tr-md'
                                    : 'bg-white dark:bg-[#151A28] border border-gray-100 dark:border-white/5 text-gray-800 dark:text-white/85 rounded-2xl rounded-tl-md shadow-sm'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-2.5 max-w-[85%] self-start">
                                <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-white/10 text-[#00E599] flex items-center justify-center shrink-0 mt-0.5">
                                    <Sparkles className="w-3.5 h-3.5" />
                                </div>
                                <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-white dark:bg-[#151A28] border border-gray-100 dark:border-white/5 shadow-sm flex items-center gap-2.5">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 rounded-full bg-[#00E599] animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 rounded-full bg-[#00E599] animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 rounded-full bg-[#00E599] animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                    <span className="text-xs text-gray-400 dark:text-white/35">{t('thinking')}</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Actions — ALWAYS visible */}
                    <div className="px-3 pb-1.5 pt-1.5 flex flex-wrap gap-1.5 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#0C0F18] shrink-0">
                        {quickActions.map((a) => (
                            <button key={a.label} onClick={() => handleSendMessage(undefined, a.query)}
                                disabled={isLoading}
                                className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all
                                    bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white/60
                                    border border-gray-200 dark:border-white/10
                                    hover:bg-[#00E599]/10 hover:text-[#00E599] hover:border-[#00E599]/30
                                    disabled:opacity-40 disabled:cursor-not-allowed">
                                {a.label}
                            </button>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="px-3 py-2.5 border-t border-gray-200 dark:border-white/5 bg-white dark:bg-[#0C0F18] shrink-0">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                            <input ref={inputRef} value={inputMessage} onChange={(e) => setInputMessage(e.target.value)}
                                placeholder={t('placeholder')}
                                disabled={isLoading}
                                className="flex-1 h-10 px-4 rounded-xl text-sm transition-colors
                                    bg-gray-100 dark:bg-[#151A28]
                                    text-gray-800 dark:text-white
                                    placeholder:text-gray-400 dark:placeholder:text-white/30
                                    border border-gray-200 dark:border-white/10
                                    focus:outline-none focus:ring-2 focus:ring-[#00E599]/40 focus:border-[#00E599]/40
                                    disabled:opacity-50" />
                            <Button type="submit" size="icon"
                                className="h-10 w-10 rounded-xl shrink-0 bg-[#00E599] text-black hover:bg-[#00D48A] transition-colors disabled:opacity-40"
                                disabled={!inputMessage.trim() || isLoading}>
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Minimized Bar ─────────────────────────────────────── */}
            {isOpen && isMinimized && (
                <button onClick={() => setIsMinimized(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-lg transition-all
                        bg-white dark:bg-[#151A28] border border-gray-200 dark:border-white/10
                        hover:shadow-xl hover:border-[#00E599]/30">
                    <div className="w-6 h-6 rounded-full bg-[#00E599] flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5 text-black" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-white/80">{t('headerTitle')}</span>
                </button>
            )}

            {/* ── Welcome Preview Bubble (first visit) ──────────────── */}
            {!isOpen && showPreview && (
                <div className="animate-in slide-in-from-right-4 fade-in duration-500 mb-1 flex items-end gap-2">
                    <button onClick={openFromPreview}
                        className="group max-w-[260px] px-4 py-3 rounded-2xl rounded-br-md shadow-xl transition-all
                            bg-white dark:bg-[#151A28] border border-gray-200 dark:border-white/10
                            hover:shadow-2xl hover:border-[#00E599]/30 cursor-pointer text-left">
                        <p className="text-sm text-gray-700 dark:text-white/80 leading-snug">
                            {i18nChat.previewBubble[lang]}
                        </p>
                        <p className="text-[10px] text-[#00E599] mt-1.5 font-semibold group-hover:underline">
                            {lang === 'fr' ? 'Cliquer pour discuter →' : 'Click to chat →'}
                        </p>
                    </button>
                    <button onClick={() => setShowPreview(false)}
                        className="shrink-0 w-5 h-5 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center
                            hover:bg-gray-300 dark:hover:bg-white/20 transition-colors mb-1">
                        <X className="w-3 h-3 text-gray-500 dark:text-white/50" />
                    </button>
                </div>
            )}

            {/* ── Floating Button ───────────────────────────────────── */}
            <button onClick={() => {
                setShowPreview(false);
                setIsOpen(!isOpen);
                setIsMinimized(false);
                localStorage.setItem(CHAT_SEEN_KEY, 'true');
            }}
                className={`group w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300
                    bg-[#00E599] hover:bg-[#00D48A] shadow-[0_4px_20px_rgba(0,229,153,0.3)] hover:shadow-[0_4px_30px_rgba(0,229,153,0.45)]
                    hover:scale-105 active:scale-95
                    ${!isOpen && showPreview ? 'animate-bounce' : ''}`}>
                {isOpen
                    ? <X className="w-6 h-6 text-black transition-transform group-hover:rotate-90" />
                    : <MessageSquare className="w-6 h-6 text-black" />}
            </button>
        </div>
    );
};
