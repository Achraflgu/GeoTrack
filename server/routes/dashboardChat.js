import express from 'express';
import db from '../db/knex.js';

const router = express.Router();

const chatSessions = new Map();
const SESSION_TTL = 2 * 60 * 60 * 1000;

setInterval(() => {
    const now = Date.now();
    for (const [sid, session] of chatSessions.entries()) {
        if (now - session.lastActive > SESSION_TTL) chatSessions.delete(sid);
    }
}, 10 * 60 * 1000);

async function buildFleetContext(user) {
    const isAdmin = user.role === 'admin' || user.role === 'supervisor';
    let devicesQuery = db('devices');
    if (!isAdmin && user.enterpriseId) devicesQuery = devicesQuery.where('enterprise_id', user.enterpriseId);

    const devices = await devicesQuery;
    const online = devices.filter(d => d.status === 'online' || d.status === 'moving').length;
    const moving = devices.filter(d => d.status === 'moving').length;
    const offline = devices.filter(d => d.status === 'offline').length;
    const idle = devices.filter(d => d.status === 'idle').length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let alertQuery = db('alerts').where('created_at', '>=', today);
    if (!isAdmin && user.enterpriseId) alertQuery = alertQuery.where('enterprise_id', user.enterpriseId);
    const alerts = await alertQuery.orderBy('created_at', 'desc').limit(20);
    const alertsByType = {};
    alerts.forEach(a => { alertsByType[a.type] = (alertsByType[a.type] || 0) + 1; });

    let zoneQuery = db('geofences');
    if (!isAdmin && user.enterpriseId) zoneQuery = zoneQuery.where('enterprise_id', user.enterpriseId);
    const zones = await zoneQuery;

    const lowBatteryDevices = devices.filter(d => d.battery < 30).map(d => ({
        name: d.name, battery: Math.round(d.battery), status: d.status
    }));

    const speedingDevices = devices.filter(d => d.speed > 70).map(d => ({
        name: d.name, speed: d.speed, address: d.address
    }));

    let context = {
        role: user.role, userName: user.name,
        enterprise: user.enterpriseName || 'Admin Global',
        devices: { total: devices.length, online, moving, idle, offline },
        alerts: { today: alerts.length, unresolved: alerts.length, byType: alertsByType },
        zones: { total: zones.length, active: zones.filter(z => z.is_active).length },
        lowBatteryDevices, speedingDevices,
        recentAlerts: alerts.slice(0, 5).map(a => ({
            type: a.type, severity: a.severity, device: a.device_name,
            message: a.message, time: a.created_at,
        })),
    };

    if (isAdmin) {
        try {
            const [{ count: pendingOrders }] = await db('orders').whereIn('status', ['pending', 'confirmed']).count('id as count');
            const [{ count: totalOrders }] = await db('orders').count('id as count');
            const [{ count: enterpriseTotal }] = await db('enterprises').count('id as count');
            context.orders = { pending: parseInt(pendingOrders), total: parseInt(totalOrders) };
            context.enterprises = { total: parseInt(enterpriseTotal) };
        } catch (e) {}
    }

    return context;
}

router.post('/', async (req, res) => {
    try {
        const { message, sessionId, user } = req.body;
        if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });
        if (!user || !user.role) return res.status(401).json({ error: 'User context required' });

        const sid = sessionId || `dash-${user.role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

        if (!chatSessions.has(sid)) {
            chatSessions.set(sid, { messageCount: 0, lastActive: Date.now(), user: user.name });
        }
        const session = chatSessions.get(sid);
        session.messageCount++;
        session.lastActive = Date.now();

        const fleetContext = await buildFleetContext(user);

        const webhookUrl = process.env.N8N_DASHBOARD_CHAT_WEBHOOK || 'http://localhost:5678/webhook/dashboard-chat';
        if (!webhookUrl) {
            const localReply = generateLocalResponse(message, fleetContext, user);
            return res.json({ reply: localReply, sessionId: sid, context: fleetContext });
        }

        console.log(`[DashChat] ${user.name} (${user.role}): "${message.substring(0, 60)}..." (msg #${session.messageCount})`);

        const systemPrompt = `Tu es l'assistant IA GeoTrack pour le tableau de bord. Tu as accès aux données fleet en temps réel.
Utilisateur: ${user.name} (${user.role}) ${user.enterpriseName ? `- Entreprise: ${user.enterpriseName}` : ''}

DONNÉES FLEET EN TEMPS RÉEL:
${JSON.stringify(fleetContext, null, 2)}

RÈGLES IMPORTANTES:
- Tu es un conseiller pro, parle naturellement et poliment.
- Ne dis pas "Voici la liste" ou "Ok, concentrons-nous", donne directement les infos.
- Réponds de manière HYPER concise (max 3-4 lignes).
- Utilise les données fleet ci-dessus ! Tu AS accès à la base de données.
- Formate bien les données avec des emojis (🟢, 🔴, 🔋, 🏎️).
- Ne liste pas tous les appareils s'il y en a beaucoup (>3), donne juste le total et cite les plus pertinents.
- Réponds dans la langue exacte de l'utilisateur.`;

        const n8nResponse = await fetch(webhookUrl, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatInput: message, sessionId: sid, systemPrompt, context: fleetContext }),
        });

        if (!n8nResponse.ok) {
            const localReply = generateLocalResponse(message, fleetContext, user);
            return res.json({ reply: localReply, sessionId: sid });
        }

        const data = await n8nResponse.json();
        const reply = data.output || data.text || data.response || data.message ||
            (typeof data === 'string' ? data : JSON.stringify(data));
        res.json({ reply, sessionId: sid });
    } catch (err) {
        console.error('[DashChat] Error:', err.message);
        res.status(500).json({ reply: "❌ Erreur de connexion IA. Réessayez." });
    }
});

function generateLocalResponse(message, ctx, user) {
    const msg = message.toLowerCase();
    const isFr = !/^(show|what|how|list|give|my|get|tell)/.test(msg);

    if (msg.includes('résumé') || msg.includes('summary') || msg.includes('dashboard') || msg.includes('tableau')) {
        return isFr
            ? `📊 **Résumé Fleet**\n• ${ctx.devices.total} appareils (${ctx.devices.online} en ligne, ${ctx.devices.moving} en mouvement, ${ctx.devices.offline} hors ligne)\n• ${ctx.alerts.today} alertes aujourd'hui\n• ${ctx.zones.total} zones GPS (${ctx.zones.active} actives)${ctx.orders ? `\n• ${ctx.orders.pending} commandes en attente` : ''}`
            : `📊 **Fleet Summary**\n• ${ctx.devices.total} devices (${ctx.devices.online} online, ${ctx.devices.moving} moving, ${ctx.devices.offline} offline)\n• ${ctx.alerts.today} alerts today\n• ${ctx.zones.total} GPS zones (${ctx.zones.active} active)${ctx.orders ? `\n• ${ctx.orders.pending} pending orders` : ''}`;
    }

    if (msg.includes('alerte') || msg.includes('alert')) {
        if (ctx.recentAlerts.length === 0) return isFr ? '✅ Aucune alerte aujourd\'hui.' : '✅ No alerts today.';
        const list = ctx.recentAlerts.map(a => `• **${a.type}** (${a.severity}) — ${a.device}: ${a.message}`).join('\n');
        return isFr ? `🚨 **${ctx.alerts.today} alertes:**\n${list}` : `🚨 **${ctx.alerts.today} alerts:**\n${list}`;
    }

    if (msg.includes('appareil') || msg.includes('device') || msg.includes('gps') || msg.includes('véhicule')) {
        let reply = isFr
            ? `📡 **${ctx.devices.total} appareils:**\n• 🟢 ${ctx.devices.online} en ligne\n• 🔵 ${ctx.devices.moving} en mouvement\n• 🟡 ${ctx.devices.idle} inactifs\n• 🔴 ${ctx.devices.offline} hors ligne`
            : `📡 **${ctx.devices.total} devices:**\n• 🟢 ${ctx.devices.online} online\n• 🔵 ${ctx.devices.moving} moving\n• 🟡 ${ctx.devices.idle} idle\n• 🔴 ${ctx.devices.offline} offline`;
        if (ctx.lowBatteryDevices.length > 0) {
            reply += isFr
                ? `\n\n🔋 **Batteries faibles:** ${ctx.lowBatteryDevices.map(d => `${d.name} (${d.battery}%)`).join(', ')}`
                : `\n\n🔋 **Low batteries:** ${ctx.lowBatteryDevices.map(d => `${d.name} (${d.battery}%)`).join(', ')}`;
        }
        return reply;
    }

    if (msg.includes('batterie') || msg.includes('battery')) {
        if (ctx.lowBatteryDevices.length === 0) return isFr ? '🔋 Toutes les batteries sont OK (>30%).' : '🔋 All batteries OK (>30%).';
        return isFr
            ? `🔋 **${ctx.lowBatteryDevices.length} batterie faible:**\n${ctx.lowBatteryDevices.map(d => `• ${d.name}: ${d.battery}%`).join('\n')}`
            : `🔋 **${ctx.lowBatteryDevices.length} low battery:**\n${ctx.lowBatteryDevices.map(d => `• ${d.name}: ${d.battery}%`).join('\n')}`;
    }

    if (msg.includes('vitesse') || msg.includes('speed')) {
        if (ctx.speedingDevices.length === 0) return isFr ? '🏎️ Aucun excès de vitesse.' : '🏎️ No speeding devices.';
        return isFr
            ? `🏎️ **${ctx.speedingDevices.length} en excès:**\n${ctx.speedingDevices.map(d => `• ${d.name}: ${d.speed} km/h`).join('\n')}`
            : `🏎️ **${ctx.speedingDevices.length} speeding:**\n${ctx.speedingDevices.map(d => `• ${d.name}: ${d.speed} km/h`).join('\n')}`;
    }

    if (msg.includes('zone') || msg.includes('geofence')) {
        return isFr
            ? `📍 **${ctx.zones.total} zones GPS:** ${ctx.zones.active} actives`
            : `📍 **${ctx.zones.total} GPS zones:** ${ctx.zones.active} active`;
    }

    return isFr
        ? `👋 Bonjour ${user.name}! Essayez: "Résumé", "Alertes", "Appareils", "Batteries", "Vitesse", "Zones"`
        : `👋 Hi ${user.name}! Try: "Summary", "Alerts", "Devices", "Battery", "Speed", "Zones"`;
}

export default router;
