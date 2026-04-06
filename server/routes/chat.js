import express from 'express';

const router = express.Router();

// ─── In-memory chat sessions for history persistence ───────────────
const chatSessions = new Map();
const SESSION_TTL = 2 * 60 * 60 * 1000; // 2 hours

// Clean old sessions periodically
setInterval(() => {
    const now = Date.now();
    for (const [sid, session] of chatSessions.entries()) {
        if (now - session.lastActive > SESSION_TTL) {
            chatSessions.delete(sid);
        }
    }
}, 10 * 60 * 1000);

// ─── POST /api/chat — Proxy to n8n AI Agent ────────────────────────
router.post('/', async (req, res) => {
    try {
        const { message, sessionId } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const sid = sessionId || `anon-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        // Track session
        if (!chatSessions.has(sid)) {
            chatSessions.set(sid, { messageCount: 0, lastActive: Date.now() });
        }
        const session = chatSessions.get(sid);
        session.messageCount++;
        session.lastActive = Date.now();

        const webhookUrl = process.env.N8N_CHAT_WEBHOOK;
        if (!webhookUrl) {
            return res.status(503).json({
                reply: "🔧 Le service de chat IA n'est pas configuré. Vérifiez N8N_CHAT_WEBHOOK dans .env"
            });
        }

        console.log(`[Chat] Session ${sid}: "${message.substring(0, 60)}..." (msg #${session.messageCount})`);

        // Call n8n webhook
        const n8nResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chatInput: message,
                sessionId: sid,
            }),
        });

        if (!n8nResponse.ok) {
            const errText = await n8nResponse.text();
            console.error('[Chat] n8n error:', n8nResponse.status, errText);
            return res.status(502).json({
                reply: "⚠️ Le service IA est temporairement indisponible. Réessayez dans un instant."
            });
        }

        const data = await n8nResponse.json();

        // n8n AI Agent returns output in various formats
        const reply = data.output || data.text || data.response || data.message ||
            (typeof data === 'string' ? data : JSON.stringify(data));

        res.json({ reply, sessionId: sid });

    } catch (err) {
        console.error('[Chat] Error:', err.message);
        res.status(500).json({
            reply: "❌ Erreur de connexion. Vérifiez que n8n est en marche."
        });
    }
});

// GET /api/chat/sessions — View active sessions
router.get('/sessions', (req, res) => {
    const sessions = [];
    for (const [sid, session] of chatSessions.entries()) {
        sessions.push({
            sessionId: sid,
            messageCount: session.messageCount,
            lastActive: new Date(session.lastActive).toISOString(),
        });
    }
    res.json({ total: sessions.length, sessions });
});

export default router;
