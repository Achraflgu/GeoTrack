import express from 'express';
import db from '../db/knex.js';
import { sendStatusUpdateEmail, sendUpgradeConfirmEmail } from '../utils/mailjet.js';
const router = express.Router();

// Format order row → camelCase for frontend
function formatOrder(o) {
    return {
        _id: o.id, id: o.id,
        orderRef: o.order_ref,
        fullName: o.full_name,
        email: o.email,
        phone: o.phone,
        company: o.company,
        usageType: o.usage_type,
        gpsCount: o.gps_count,
        gpsTypes: typeof o.gps_types === 'string' ? JSON.parse(o.gps_types || '[]') : (o.gps_types || []),
        plan: o.plan,
        billingCycle: o.billing_cycle,
        totalDueToday: o.total_due_today,
        recurringCost: o.recurring_cost,
        paymentMethod: o.payment_method,
        source: o.source,
        status: o.status,
        adminNotes: o.admin_notes,
        notes: o.notes,
        enterpriseId: o.enterprise_id,
        userId: o.user_id,
        confirmedAt: o.confirmed_at,
        installedAt: o.installed_at,
        activatedAt: o.activated_at,
        cancelledAt: o.cancelled_at,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
    };
}

function generateOrderRef() {
    const date = new Date();
    const y = date.getFullYear().toString().slice(-2);
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `GT-${y}${m}-${rand}`;
}

function generateInvoiceRef() {
    const date = new Date();
    const y = date.getFullYear().toString().slice(-2);
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `INV-${y}${m}-${rand}`;
}

// GET all orders
router.get('/', async (req, res) => {
    try {
        const { status, source, search, email, enterpriseId } = req.query;
        let query = db('orders');
        if (status && status !== 'all') query = query.where('status', status);
        if (source && source !== 'all') query = query.where('source', source);
        if (email) query = query.where('email', email);
        if (enterpriseId) query = query.where('enterprise_id', parseInt(enterpriseId, 10));
        if (search) {
            query = query.where(function () {
                this.where('full_name', 'ilike', `%${search}%`)
                    .orWhere('email', 'ilike', `%${search}%`)
                    .orWhere('company', 'ilike', `%${search}%`)
                    .orWhere('order_ref', 'ilike', `%${search}%`);
            });
        }
        const orders = await query.orderBy('created_at', 'desc');
        res.json(orders.map(formatOrder));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// GET order tracking
router.get('/track/:ref', async (req, res) => {
    try {
        const order = await db('orders')
            .where('order_ref', req.params.ref)
            .select('status', 'order_ref', 'created_at', 'full_name', 'email', 'company')
            .first();
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(formatOrder(order));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET order stats
router.get('/stats', async (req, res) => {
    try {
        const [
            [{ count: total }], [{ count: pending }], [{ count: confirmed }],
            [{ count: installing }], [{ count: active }], [{ count: cancelled }]
        ] = await Promise.all([
            db('orders').count('id as count'),
            db('orders').where('status', 'pending').count('id as count'),
            db('orders').where('status', 'confirmed').count('id as count'),
            db('orders').where('status', 'installing').count('id as count'),
            db('orders').where('status', 'active').count('id as count'),
            db('orders').where('status', 'cancelled').count('id as count'),
        ]);
        res.json({
            total: parseInt(total), pending: parseInt(pending), confirmed: parseInt(confirmed),
            installing: parseInt(installing), active: parseInt(active), cancelled: parseInt(cancelled)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create order
router.post('/', async (req, res) => {
    try {
        const body = req.body;
        const isUpgrade = (body.source || '') === 'client_upgrade';

        const [order] = await db('orders').insert({
            full_name: body.fullName,
            email: body.email,
            phone: body.phone,
            company: body.company,
            usage_type: body.usageType || 'professional',
            gps_count: body.gpsCount || 1,
            gps_types: JSON.stringify(body.gpsTypes || []),
            plan: body.plan || 'starter',
            billing_cycle: body.billingCycle || 'monthly',
            total_due_today: body.totalDueToday || 0,
            recurring_cost: body.recurringCost || 0,
            payment_method: body.paymentMethod || '',
            source: body.source || 'manual',
            notes: body.notes || null,
            enterprise_id: body.enterpriseId ? (parseInt(body.enterpriseId, 10) || null) : null,
            user_id: body.userId ? String(body.userId) : null,
            status: 'pending',
            order_ref: generateOrderRef(),
        }).returning('*');

        // Send appropriate confirmation email
        if (isUpgrade) {
            await sendUpgradeConfirmEmail(order.email, order.full_name, order.order_ref, order.gps_count, order.plan).catch(console.error);
        } else {
            sendStatusUpdateEmail(order.email, order.full_name, order.order_ref, 'pending');
        }

        const webhookUrl = process.env.N8N_ORDER_WEBHOOK;
        if (webhookUrl) {
            try {
                await fetch(webhookUrl, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ event: isUpgrade ? 'upgrade_order_created' : 'order_created', order: formatOrder(order) }),
                });
            } catch (whErr) { console.warn('[n8n] Webhook failed:', whErr.message); }
        }

        res.status(201).json(formatOrder(order));
    } catch (err) {
        console.error('[POST /orders] Error:', err.message, err.code);
        res.status(400).json({ error: err.message });
    }
});

// PATCH update order
router.patch('/:id', async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        const update = { updated_at: new Date() };
        if (adminNotes !== undefined) update.admin_notes = adminNotes;
        if (status) {
            update.status = status;
            if (status === 'confirmed') update.confirmed_at = new Date();
            if (status === 'installing') update.installed_at = new Date();
            if (status === 'active') update.activated_at = new Date();
            if (status === 'cancelled') update.cancelled_at = new Date();
        }

        const [order] = await db('orders').where('id', req.params.id).update(update).returning('*');
        if (!order) return res.status(404).json({ error: 'Order not found' });

        if (status && ['confirmed', 'installing', 'cancelled'].includes(status)) {
            await sendStatusUpdateEmail(order.email, order.full_name, order.order_ref, status).catch(console.error);
        }

        res.json(formatOrder(order));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE order
router.delete('/:id', async (req, res) => {
    try {
        const order = await db('orders').where('id', req.params.id).first();
        if (!order) return res.status(404).json({ error: 'Order not found' });
        await db('orders').where('id', req.params.id).del();
        res.json({ message: 'Order deleted', order: formatOrder(order) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST webhook
router.post('/webhook', async (req, res) => {
    try {
        const { orderId, action, data } = req.body;
        if (orderId && action === 'update_status' && data?.status) {
            const [order] = await db('orders').where('id', orderId).update({ status: data.status }).returning('*');
            return res.json({ success: true, order: formatOrder(order) });
        }
        res.json({ success: true, message: 'Webhook received' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST process order (auto-create enterprise + user + devices)
router.post('/:id/process', async (req, res) => {
    try {
        const { prefixes } = req.body;
        const order = await db('orders').where('id', req.params.id).first();
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.status === 'active') return res.status(400).json({ error: 'Order already processed' });

        const steps = [];
        const companyName = order.company || `${order.full_name} Enterprise`;

        // 1. Create or find Enterprise
        let enterprise = await db('enterprises').where('name', companyName).first();
        if (!enterprise) {
            [enterprise] = await db('enterprises').insert({
                name: companyName, contact_email: order.email,
                contact_phone: order.phone, plan: order.plan || 'starter', status: 'active',
            }).returning('*');
            steps.push({ step: 'enterprise', status: 'created', name: enterprise.name, id: enterprise.id });
        } else {
            steps.push({ step: 'enterprise', status: 'exists', name: enterprise.name, id: enterprise.id });
        }

        // 2. Create or update User
        let userAccount = await db('users').where('email', order.email).first();
        const tempPassword = 'GT-' + Math.random().toString(36).slice(2, 8).toUpperCase();
        const bcrypt = (await import('bcryptjs')).default;

        if (!userAccount) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(tempPassword, salt);
            [userAccount] = await db('users').insert({
                email: order.email, password: hashedPassword, name: order.full_name,
                role: 'operator', plan: order.plan || 'starter',
                enterprise_id: enterprise.id, enterprise_name: enterprise.name,
                email_verified: true, is_initial_password: true,
            }).returning('*');
            steps.push({ step: 'user', status: 'created', email: order.email, tempPassword });
        } else {
            await db('users').where('id', userAccount.id).update({
                enterprise_id: enterprise.id, enterprise_name: enterprise.name
            });
            steps.push({ step: 'user', status: 'exists', email: order.email });
        }

        // 3. Create Devices
        const deviceCount = order.gps_count || 1;
        const createdDevices = [];
        const pSerie = prefixes?.serie || `SN-${order.order_ref}-`;
        const pImei = prefixes?.imei || '86';

        for (let i = 0; i < deviceCount; i++) {
            const deviceNum = String(i + 1).padStart(3, '0');
            const remainingImei = Math.max(0, 15 - pImei.length);
            const imei = pImei + Array.from({ length: remainingImei }, () => Math.floor(Math.random() * 10)).join('');

            const [device] = await db('devices').insert({
                name: `GPS-${deviceNum}`, imei,
                serial_number: `${pSerie}${deviceNum}`,
                enterprise_id: enterprise.id, enterprise_name: enterprise.name,
                status: 'online', battery: 100, signal: 95, speed: 0,
                location_lng: 10.1815, location_lat: 36.8065,
                address: 'Tunis, Tunisia', data_source: 'fake',
                sim_is_running: true, sim_route_id: 'tunis-ariana',
            }).returning('*');
            createdDevices.push({ name: device.name, imei: device.imei, id: device.id });
        }
        steps.push({ step: 'devices', status: 'created', count: createdDevices.length, devices: createdDevices });

        // 4. Activate order
        await db('orders').where('id', order.id).update({
            status: 'active', activated_at: new Date(),
            admin_notes: (order.admin_notes || '') + `\n[Auto] Processed: ${enterprise.name}, ${createdDevices.length} devices, user: ${order.email}`
        });
        steps.push({ step: 'order', status: 'activated' });

        res.json({
            success: true, orderRef: order.order_ref,
            enterprise: { name: enterprise.name, id: enterprise.id },
            user: { email: order.email, name: order.full_name, tempPassword },
            devices: createdDevices, steps,
        });
    } catch (err) {
        console.error('[Order] Process error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
