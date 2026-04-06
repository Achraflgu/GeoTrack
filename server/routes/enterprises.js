import express from 'express';
import db from '../db/knex.js';
import { logAudit } from '../utils/auditLogger.js';

const router = express.Router();

// Get all enterprises
router.get('/', async (req, res) => {
    try {
        const enterprises = await db('enterprises').orderBy('created_at', 'desc');
        const formatted = enterprises.map(e => ({
            id: e.id,
            name: e.name,
            contactEmail: e.contact_email,
            phone: e.phone,
            address: e.address,
            status: e.status,
            createdAt: e.created_at,
            serialPrefix: e.serial_prefix,
            imeiPrefix: e.imei_prefix,
            subscriberPrefix: e.subscriber_prefix,
            alertSettings: e.alert_settings
        }));
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single enterprise
router.get('/:id', async (req, res) => {
    try {
        const enterprise = await db('enterprises').where('id', req.params.id).first();
        if (!enterprise) return res.status(404).json({ error: 'Enterprise not found' });
        
        enterprise.alertSettings = enterprise.alert_settings;
        delete enterprise.alert_settings;

        res.json(enterprise);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get next available IDs
router.get('/:id/next-ids', async (req, res) => {
    try {
        const enterprise = await db('enterprises').where('id', req.params.id).first();
        if (!enterprise) return res.status(404).json({ error: 'Enterprise not found' });

        const serialPrefix = enterprise.serial_prefix || 'GT';
        const imeiPrefix = enterprise.imei_prefix || '35907';
        const subscriberPrefix = enterprise.subscriber_prefix || '500';

        // Find max serial
        const lastSerialDevice = await db('devices')
            .where('enterprise_id', enterprise.id)
            .orderByRaw("serial_number DESC")
            .first();

        let nextSerial = 1;
        if (lastSerialDevice?.serial_number) {
            const numPart = lastSerialDevice.serial_number.replace(serialPrefix, '');
            const parsed = parseInt(numPart);
            if (!isNaN(parsed)) nextSerial = parsed + 1;
        }

        // Find max IMEI
        const lastImeiDevice = await db('devices')
            .where('enterprise_id', enterprise.id)
            .orderByRaw("imei DESC")
            .first();

        let nextImei = 1;
        if (lastImeiDevice?.imei) {
            const numPart = lastImeiDevice.imei.replace(imeiPrefix, '');
            const parsed = parseInt(numPart);
            if (!isNaN(parsed)) nextImei = parsed + 1;
        }

        // Find max subscriber
        const lastSubDevice = await db('devices')
            .where('enterprise_id', enterprise.id)
            .orderByRaw("subscriber_number DESC")
            .first();

        let nextSubscriber = 1;
        if (lastSubDevice?.subscriber_number) {
            const numPart = lastSubDevice.subscriber_number.replace(subscriberPrefix, '');
            const parsed = parseInt(numPart);
            if (!isNaN(parsed)) nextSubscriber = parsed + 1;
        }

        res.json({
            serialNumber: `${serialPrefix}${nextSerial.toString().padStart(4, '0')}`,
            imei: `${imeiPrefix}${nextImei.toString().padStart(3, '0')}`,
            subscriberNumber: `${subscriberPrefix}${nextSubscriber}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get next available prefix suggestions
router.get('/suggestions/next-prefixes', async (req, res) => {
    try {
        const enterprises = await db('enterprises').select('imei_prefix', 'subscriber_prefix');
        let maxImei = 35907;
        let maxSubscriber = 500;
        enterprises.forEach(e => {
            const imei = parseInt(e.imei_prefix);
            const sub = parseInt(e.subscriber_prefix);
            if (!isNaN(imei) && imei >= maxImei) maxImei = imei;
            if (!isNaN(sub) && sub >= maxSubscriber) maxSubscriber = sub;
        });
        res.json({
            imeiPrefix: (maxImei + 1).toString(),
            subscriberPrefix: (maxSubscriber + 1).toString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create enterprise
router.post('/', async (req, res) => {
    try {
        const { serialPrefix, imeiPrefix, subscriberPrefix } = req.body;

        if (serialPrefix) {
            const exists = await db('enterprises').where('serial_prefix', serialPrefix).first();
            if (exists) return res.status(400).json({ error: `Le préfixe série '${serialPrefix}' est déjà utilisé.` });
        }

        let finalImeiPrefix = imeiPrefix;
        if (!finalImeiPrefix) {
            const ent = await db('enterprises').orderByRaw("CAST(imei_prefix AS INTEGER) DESC").first();
            const maxImei = ent && !isNaN(parseInt(ent.imei_prefix)) ? parseInt(ent.imei_prefix) : 35907;
            finalImeiPrefix = (maxImei + 1).toString();
        } else {
            const exists = await db('enterprises').where('imei_prefix', imeiPrefix).first();
            if (exists) return res.status(400).json({ error: `Le préfixe IMEI '${imeiPrefix}' est déjà utilisé.` });
        }

        let finalSubscriberPrefix = subscriberPrefix;
        if (!finalSubscriberPrefix) {
            const ent = await db('enterprises').orderByRaw("CAST(subscriber_prefix AS INTEGER) DESC").first();
            const maxSub = ent && !isNaN(parseInt(ent.subscriber_prefix)) ? parseInt(ent.subscriber_prefix) : 500;
            finalSubscriberPrefix = (maxSub + 1).toString();
        } else {
            const exists = await db('enterprises').where('subscriber_prefix', subscriberPrefix).first();
            if (exists) return res.status(400).json({ error: `Le préfixe Abonné '${subscriberPrefix}' est déjà utilisé.` });
        }

        const [enterprise] = await db('enterprises').insert({
            name: req.body.name,
            contact_email: req.body.contactEmail,
            contact_phone: req.body.contactPhone,
            phone: req.body.phone,
            address: req.body.address,
            plan: req.body.plan || 'starter',
            status: req.body.status || 'active',
            serial_prefix: serialPrefix || req.body.name.substring(0, 3).toUpperCase(),
            imei_prefix: finalImeiPrefix,
            subscriber_prefix: finalSubscriberPrefix
        }).returning('*');

        await logAudit('enterprise.create', 'Admin', {
            targetType: 'enterprise', targetId: enterprise.id, targetName: enterprise.name
        });

        res.status(201).json(enterprise);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update enterprise
router.put('/:id', async (req, res) => {
    try {
        const updates = {};
        if (req.body.name !== undefined) updates.name = req.body.name;
        if (req.body.contactEmail !== undefined) updates.contact_email = req.body.contactEmail;
        if (req.body.phone !== undefined) updates.phone = req.body.phone;
        if (req.body.address !== undefined) updates.address = req.body.address;
        if (req.body.status !== undefined) updates.status = req.body.status;
        if (req.body.plan !== undefined) updates.plan = req.body.plan;
        if (req.body.alertSettings !== undefined) updates.alert_settings = req.body.alertSettings;
        updates.updated_at = new Date();

        const [enterprise] = await db('enterprises').where('id', req.params.id).update(updates).returning('*');
        if (!enterprise) return res.status(404).json({ error: 'Enterprise not found' });

        await logAudit('enterprise.update', 'Admin', {
            targetType: 'enterprise', targetId: enterprise.id, targetName: enterprise.name
        });

        res.json(enterprise);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete enterprise
router.delete('/:id', async (req, res) => {
    try {
        const enterprise = await db('enterprises').where('id', req.params.id).first();
        if (!enterprise) return res.status(404).json({ error: 'Enterprise not found' });

        await db('enterprises').where('id', req.params.id).del();

        await logAudit('enterprise.delete', 'Admin', {
            targetType: 'enterprise', targetId: enterprise.id, targetName: enterprise.name
        });

        res.json({ message: 'Enterprise deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
